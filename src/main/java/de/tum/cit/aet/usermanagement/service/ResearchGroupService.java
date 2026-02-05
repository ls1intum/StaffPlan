package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.ResearchGroupAlias;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserGroup;
import de.tum.cit.aet.usermanagement.domain.key.UserGroupId;
import de.tum.cit.aet.usermanagement.dto.KeycloakUserDTO;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupDTO;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupImportResultDTO;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResearchGroupService {

    private static final String PROFESSOR_ROLE = "professor";

    private final ResearchGroupRepository researchGroupRepository;
    private final UserRepository userRepository;
    private final UserGroupRepository userGroupRepository;
    private final KeycloakAdminService keycloakAdminService;

    /**
     * Returns all research groups (not archived).
     *
     * @return list of research group DTOs
     */
    public List<ResearchGroupDTO> getAllResearchGroups() {
        return researchGroupRepository.findAllWithAliasesNotArchived()
                .stream()
                .map(rg -> ResearchGroupDTO.fromEntity(rg, researchGroupRepository.countPositionsByResearchGroupId(rg.getId())))
                .toList();
    }

    /**
     * Searches research groups by name, abbreviation, professor name, or department.
     *
     * @param search the search term (can be null or empty for all results)
     * @return list of matching research group DTOs
     */
    public List<ResearchGroupDTO> searchResearchGroups(String search) {
        return researchGroupRepository.searchWithAliases(search)
                .stream()
                .map(rg -> ResearchGroupDTO.fromEntity(rg, researchGroupRepository.countPositionsByResearchGroupId(rg.getId())))
                .toList();
    }

    /**
     * Returns a research group by ID.
     *
     * @param id the research group ID
     * @return the research group DTO
     */
    public ResearchGroupDTO getResearchGroup(UUID id) {
        ResearchGroup researchGroup = researchGroupRepository.findByIdWithAliases(id)
                .orElseThrow(() -> new IllegalArgumentException("Research group not found: " + id));
        int positionCount = researchGroupRepository.countPositionsByResearchGroupId(id);
        return ResearchGroupDTO.fromEntity(researchGroup, positionCount);
    }

    /**
     * Returns research groups without a head assigned.
     *
     * @return list of research group DTOs without head
     */
    public List<ResearchGroupDTO> getResearchGroupsWithoutHead() {
        return researchGroupRepository.findByHeadIsNullWithAliases()
                .stream()
                .map(ResearchGroupDTO::fromEntity)
                .toList();
    }

    /**
     * Creates a new research group.
     *
     * @param dto the research group data
     * @return the created research group DTO
     */
    public ResearchGroupDTO createResearchGroup(ResearchGroupDTO dto) {
        if (researchGroupRepository.existsByName(dto.name())) {
            throw new IllegalArgumentException("Research group with name already exists: " + dto.name());
        }
        if (researchGroupRepository.existsByAbbreviation(dto.abbreviation())) {
            throw new IllegalArgumentException("Research group with abbreviation already exists: " + dto.abbreviation());
        }

        ResearchGroup researchGroup = new ResearchGroup();
        updateEntityFromDto(researchGroup, dto);
        researchGroup = researchGroupRepository.save(researchGroup);
        log.info("Created research group: {}", researchGroup.getName());
        return ResearchGroupDTO.fromEntity(researchGroup);
    }

    /**
     * Updates an existing research group.
     *
     * @param id the research group ID
     * @param dto the updated research group data
     * @return the updated research group DTO
     */
    public ResearchGroupDTO updateResearchGroup(UUID id, ResearchGroupDTO dto) {
        ResearchGroup researchGroup = researchGroupRepository.findByIdWithAliases(id)
                .orElseThrow(() -> new IllegalArgumentException("Research group not found: " + id));

        // Check if name is being changed to an existing one
        if (!researchGroup.getName().equals(dto.name()) && researchGroupRepository.existsByName(dto.name())) {
            throw new IllegalArgumentException("Research group with name already exists: " + dto.name());
        }

        // Check if abbreviation is being changed to an existing one
        if (!researchGroup.getAbbreviation().equals(dto.abbreviation()) && researchGroupRepository.existsByAbbreviation(dto.abbreviation())) {
            throw new IllegalArgumentException("Research group with abbreviation already exists: " + dto.abbreviation());
        }

        updateEntityFromDto(researchGroup, dto);
        researchGroup = researchGroupRepository.save(researchGroup);
        log.info("Updated research group: {}", researchGroup.getName());
        return ResearchGroupDTO.fromEntity(researchGroup, researchGroupRepository.countPositionsByResearchGroupId(id));
    }

    /**
     * Archives a research group (soft delete).
     *
     * @param id the research group ID
     */
    public void archiveResearchGroup(UUID id) {
        ResearchGroup researchGroup = researchGroupRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Research group not found: " + id));
        researchGroup.setArchived(true);
        researchGroupRepository.save(researchGroup);
        log.info("Archived research group: {}", researchGroup.getName());
    }

    /**
     * Imports research groups from a CSV file with optional Keycloak lookup for professor matching.
     * CSV format: firstName,lastName,groupName,abbreviation,department[,email[,login]]
     *
     * If 'login' column is present, it is used directly as the professor's universityId.
     * If 'login' is missing but 'email' is present and Keycloak service is configured:
     * - Searches Keycloak/LDAP by email to find the professor's universityId
     * - If exactly one user is found, the universityId is imported
     * - If no user or multiple users are found, the group is flagged for manual mapping
     *
     * If both 'login' and 'email' are missing, the group is flagged for manual mapping
     * and will be matched during the professor's first login.
     *
     * @param file the CSV file to import
     * @return the import result with counts and errors
     */
    public ResearchGroupImportResultDTO importFromCsv(MultipartFile file) {
        ResearchGroupImportResultDTO.Builder result = ResearchGroupImportResultDTO.builder();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String headerLine = reader.readLine();
            if (headerLine == null) {
                result.addError("CSV file is empty");
                return result.build();
            }

            // Remove BOM if present
            if (headerLine.startsWith("\uFEFF")) {
                headerLine = headerLine.substring(1);
            }

            char delimiter = detectDelimiter(headerLine);
            String[] headers = parseCsvLine(headerLine, delimiter);
            Map<String, Integer> headerIndices = mapHeaderIndices(headers);

            String line;
            int lineNumber = 1;
            while ((line = reader.readLine()) != null) {
                lineNumber++;
                if (line.trim().isEmpty()) {
                    continue;
                }
                try {
                    String[] values = parseCsvLine(line, delimiter);
                    processImportRecord(values, headerIndices, result, lineNumber);
                } catch (Exception e) {
                    log.warn("Failed to import line {}: {}", lineNumber, e.getMessage());
                    result.addError("Line " + lineNumber + ": " + e.getMessage());
                }
            }
        } catch (IOException e) {
            log.error("Error parsing CSV file", e);
            result.addError("Failed to parse CSV file: " + e.getMessage());
        }

        ResearchGroupImportResultDTO importResult = result.build();
        log.info("CSV import completed: created={}, updated={}, skipped={}, errors={}",
                importResult.created(), importResult.updated(), importResult.skipped(), importResult.errors().size());
        return importResult;
    }

    private char detectDelimiter(String headerLine) {
        int semicolons = headerLine.length() - headerLine.replace(";", "").length();
        int commas = headerLine.length() - headerLine.replace(",", "").length();
        return semicolons > commas ? ';' : ',';
    }

    private String[] parseCsvLine(String line, char delimiter) {
        List<String> fields = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;

        for (char c : line.toCharArray()) {
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == delimiter && !inQuotes) {
                fields.add(current.toString().trim());
                current = new StringBuilder();
            } else {
                current.append(c);
            }
        }
        fields.add(current.toString().trim());

        return fields.toArray(new String[0]);
    }

    private Map<String, Integer> mapHeaderIndices(String[] headers) {
        Map<String, Integer> indices = new HashMap<>();
        for (int i = 0; i < headers.length; i++) {
            indices.put(headers[i].trim().toLowerCase(), i);
        }
        return indices;
    }

    private void processImportRecord(String[] values, Map<String, Integer> headerIndices,
                                     ResearchGroupImportResultDTO.Builder result, int lineNumber) {
        String firstName = getValueByHeader(values, headerIndices, "firstname");
        String lastName = getValueByHeader(values, headerIndices, "lastname");
        String groupName = getValueByHeader(values, headerIndices, "groupname");
        String abbreviation = getValueByHeader(values, headerIndices, "abbreviation");
        String department = getValueByHeader(values, headerIndices, "department");
        String email = getValueByHeader(values, headerIndices, "email");
        String login = getValueByHeader(values, headerIndices, "login");

        if (groupName == null || groupName.isBlank()) {
            result.addError("Line " + lineNumber + ": groupName is required");
            result.incrementSkipped();
            return;
        }

        if (abbreviation == null || abbreviation.isBlank()) {
            result.addError("Line " + lineNumber + ": abbreviation is required");
            result.incrementSkipped();
            return;
        }

        Optional<ResearchGroup> existingByName = researchGroupRepository.findByName(groupName);
        Optional<ResearchGroup> existingByAbbr = researchGroupRepository.findByAbbreviation(abbreviation);

        if (existingByName.isPresent()) {
            // Update existing
            ResearchGroup existing = existingByName.get();
            if (!existing.getAbbreviation().equals(abbreviation) && existingByAbbr.isPresent()) {
                result.addWarning("Line " + lineNumber + ": Abbreviation conflict, skipping update for " + groupName);
                result.incrementSkipped();
                return;
            }
            existing.setAbbreviation(abbreviation);
            existing.setProfessorFirstName(firstName);
            existing.setProfessorLastName(lastName);
            existing.setDepartment(department);
            existing.setProfessorEmail(email);

            // Use login directly if provided, otherwise perform Keycloak lookup
            if (login != null && !login.isBlank()) {
                existing.setProfessorUniversityId(login);
                existing.setNeedsManualMapping(false);
                existing.setMappingNotes(null);
                log.info("Using provided login '{}' for group '{}'", login, groupName);
            } else {
                lookupProfessorInKeycloak(existing);
            }

            researchGroupRepository.save(existing);

            // Create user and assign as head if we have the login
            createAndAssignProfessor(existing);

            result.incrementUpdated();
        } else if (existingByAbbr.isPresent()) {
            result.addWarning("Line " + lineNumber + ": Abbreviation " + abbreviation + " already exists for different group");
            result.incrementSkipped();
        } else {
            // Create new
            ResearchGroup newGroup = new ResearchGroup();
            newGroup.setName(groupName);
            newGroup.setAbbreviation(abbreviation);
            newGroup.setProfessorFirstName(firstName);
            newGroup.setProfessorLastName(lastName);
            newGroup.setDepartment(department);
            newGroup.setProfessorEmail(email);

            // Use login directly if provided, otherwise perform Keycloak lookup
            if (login != null && !login.isBlank()) {
                newGroup.setProfessorUniversityId(login);
                newGroup.setNeedsManualMapping(false);
                newGroup.setMappingNotes(null);
                log.info("Using provided login '{}' for group '{}'", login, groupName);
            } else {
                lookupProfessorInKeycloak(newGroup);
            }

            researchGroupRepository.save(newGroup);

            // Create user and assign as head if we have the login
            createAndAssignProfessor(newGroup);

            result.incrementCreated();
        }
    }

    /**
     * Creates a user for the professor (if not exists) and assigns them as head of the research group.
     * Only creates the user if we have a professorUniversityId (login).
     *
     * If the professor is already the head of another research group, assignment is skipped
     * to avoid violating the unique constraint on head_user_id.
     */
    private void createAndAssignProfessor(ResearchGroup group) {
        String login = group.getProfessorUniversityId();
        if (login == null || login.isBlank()) {
            return; // No login available, professor will be matched on first login
        }

        // Skip if group already has a head
        if (group.getHead() != null) {
            log.debug("Group '{}' already has a head, skipping user creation", group.getName());
            return;
        }

        try {
            // Find or create user
            User professor = userRepository.findByUniversityId(login)
                    .orElseGet(() -> {
                        User newUser = new User();
                        newUser.setUniversityId(login);
                        newUser.setFirstName(group.getProfessorFirstName());
                        newUser.setLastName(group.getProfessorLastName());
                        newUser.setEmail(group.getProfessorEmail());
                        // Initialize timestamps to satisfy @NotNull validation
                        // (Hibernate's @CreationTimestamp/@UpdateTimestamp run after validation)
                        Instant now = Instant.now();
                        newUser.setJoinedAt(now);
                        newUser.setUpdatedAt(now);
                        return userRepository.save(newUser);
                    });

            // Update user info if it was existing but had missing data
            boolean updated = false;
            if (professor.getFirstName() == null && group.getProfessorFirstName() != null) {
                professor.setFirstName(group.getProfessorFirstName());
                updated = true;
            }
            if (professor.getLastName() == null && group.getProfessorLastName() != null) {
                professor.setLastName(group.getProfessorLastName());
                updated = true;
            }
            if (professor.getEmail() == null && group.getProfessorEmail() != null) {
                professor.setEmail(group.getProfessorEmail());
                updated = true;
            }
            if (updated) {
                professor = userRepository.save(professor);
            }

            // Assign professor role if not already assigned
            if (!professor.hasAnyGroup(PROFESSOR_ROLE)) {
                assignProfessorRole(professor);
            }

            // Check if this professor is already the head of another group (unique constraint)
            if (researchGroupRepository.existsByHeadId(professor.getId())) {
                log.warn("Professor '{}' ({}) is already head of another group, cannot assign to '{}'. "
                        + "A professor can only be head of one research group.",
                        professor.getFirstName() + " " + professor.getLastName(), login, group.getName());
                return;
            }

            // Set as head of research group
            group.setHead(professor);
            professor.setResearchGroup(group);
            researchGroupRepository.save(group);
            userRepository.save(professor);

            log.info("Created/assigned professor '{}' ({}) as head of group '{}'",
                    professor.getFirstName() + " " + professor.getLastName(), login, group.getName());

        } catch (Exception e) {
            log.warn("Failed to create/assign professor for group '{}': {}", group.getName(), e.getMessage());
            // Don't fail the import, just log the warning
        }
    }

    /**
     * Assigns the professor role to a user.
     */
    private void assignProfessorRole(User user) {
        UserGroupId groupId = new UserGroupId();
        groupId.setUserId(user.getId());
        groupId.setRole(PROFESSOR_ROLE);

        UserGroup userGroup = new UserGroup();
        userGroup.setId(groupId);
        userGroup.setUser(user);

        userGroupRepository.save(userGroup);
        user.getGroups().add(userGroup);
    }

    /**
     * Performs Keycloak/LDAP lookup to find the professor's universityId.
     * Prioritizes email lookup, falls back to name lookup if no email is provided.
     * Catches all exceptions to ensure CSV import continues even if Keycloak lookup fails.
     */
    private void lookupProfessorInKeycloak(ResearchGroup group) {
        if (!keycloakAdminService.isConfigured()) {
            log.debug("Keycloak service not configured, skipping professor lookup for group: {}", group.getName());
            flagForManualMapping(group, "Keycloak service not configured");
            return;
        }

        String email = group.getProfessorEmail();
        String firstName = group.getProfessorFirstName();
        String lastName = group.getProfessorLastName();

        try {
            List<KeycloakUserDTO> keycloakUsers;

            // Step 1: If email is provided (from CSV import), search by email
            if (email != null && !email.isBlank()) {
                keycloakUsers = keycloakAdminService.searchByEmail(email);
                processKeycloakResults(group, keycloakUsers, "email: " + email);
            } else if (firstName != null && !firstName.isBlank() && lastName != null && !lastName.isBlank()) {
                // Step 2: Fallback to name search (less reliable)
                keycloakUsers = keycloakAdminService.searchByName(firstName, lastName);
                processKeycloakResults(group, keycloakUsers, "name: " + firstName + " " + lastName);
            } else {
                // No email or professor name provided
                flagForManualMapping(group, "No email or professor name provided");
                log.debug("No professor info for group '{}', flagged for manual mapping", group.getName());
            }
        } catch (Exception e) {
            log.warn("Keycloak lookup failed for group '{}': {}", group.getName(), e.getMessage());
            flagForManualMapping(group, "Keycloak lookup failed: " + e.getMessage());
        }
    }

    /**
     * Flags a research group for manual mapping with a note.
     */
    private void flagForManualMapping(ResearchGroup group, String note) {
        group.setNeedsManualMapping(true);
        group.setMappingNotes(note);
    }

    /**
     * Processes Keycloak lookup results and updates the research group accordingly.
     */
    private void processKeycloakResults(ResearchGroup group, List<KeycloakUserDTO> keycloakUsers, String searchCriteria) {
        if (keycloakUsers == null || keycloakUsers.isEmpty()) {
            flagForManualMapping(group, "No user found in Keycloak/LDAP for " + searchCriteria);
            log.info("No Keycloak user found for group '{}' with {}", group.getName(), searchCriteria);
        } else if (keycloakUsers.size() == 1) {
            KeycloakUserDTO user = keycloakUsers.getFirst();
            group.setProfessorUniversityId(user.username());
            group.setNeedsManualMapping(false);
            group.setMappingNotes(null);
            log.info("Found unique Keycloak user '{}' for group '{}' with {}",
                    user.username(), group.getName(), searchCriteria);
        } else {
            String usernames = keycloakUsers.stream()
                    .map(KeycloakUserDTO::username)
                    .collect(Collectors.joining(", "));
            flagForManualMapping(group, "Multiple users found for " + searchCriteria + ": " + usernames);
            log.info("Multiple Keycloak users found for group '{}' with {}: {}",
                    group.getName(), searchCriteria, usernames);
        }
    }

    private String getValueByHeader(String[] values, Map<String, Integer> headerIndices, String header) {
        Integer index = headerIndices.get(header);
        if (index == null || index >= values.length) {
            return null;
        }
        String value = values[index].trim();
        return value.isEmpty() ? null : value;
    }

    private void updateEntityFromDto(ResearchGroup entity, ResearchGroupDTO dto) {
        entity.setName(dto.name());
        entity.setAbbreviation(dto.abbreviation());
        entity.setDescription(dto.description());
        entity.setWebsiteUrl(dto.websiteUrl());
        entity.setCampus(dto.campus());
        entity.setDepartment(dto.department());
        entity.setProfessorFirstName(dto.professorFirstName());
        entity.setProfessorLastName(dto.professorLastName());
        entity.setProfessorEmail(dto.professorEmail());
        entity.setProfessorUniversityId(dto.professorUniversityId());
        entity.setNeedsManualMapping(dto.needsManualMapping());
        entity.setMappingNotes(dto.mappingNotes());

        // Update aliases
        if (dto.aliases() != null) {
            entity.getAliases().clear();
            for (String alias : dto.aliases()) {
                ResearchGroupAlias aliasEntity = new ResearchGroupAlias();
                aliasEntity.setResearchGroup(entity);
                aliasEntity.setAliasPattern(alias);
                aliasEntity.setMatchType(ResearchGroupAlias.MatchType.CONTAINS);
                entity.getAliases().add(aliasEntity);
            }
        }
    }

    /**
     * Deletes all research groups and their associated data.
     * This is a destructive operation intended for administrative cleanup.
     *
     * @return the number of research groups deleted
     */
    @Transactional
    public int deleteAll() {
        // First, unlink all users from research groups
        List<ResearchGroup> allGroups = researchGroupRepository.findAll();
        for (ResearchGroup group : allGroups) {
            if (group.getHead() != null) {
                User head = group.getHead();
                head.setResearchGroup(null);
                group.setHead(null);
                userRepository.save(head);
            }
        }

        // Delete all research groups (cascades to aliases)
        int count = allGroups.size();
        researchGroupRepository.deleteAll();
        log.info("Deleted all {} research groups", count);
        return count;
    }
}
