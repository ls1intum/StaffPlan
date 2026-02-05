package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserGroup;
import de.tum.cit.aet.usermanagement.domain.key.UserGroupId;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserGroupRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Service for automatically assigning professors to their research groups on login.
 *
 * Matching priority (most reliable first):
 * 1. By universityId - matches user's universityId against professor_university_id field
 * 2. By email - matches user's email against professor_email field
 * 3. By name - matches user's first/last name against professor name fields (least reliable)
 *
 * When a user logs in and matches a research group's professor info,
 * they are automatically assigned the professor role and set as head of that group.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProfessorLoginMatchingService {

    private static final String PROFESSOR_ROLE = "professor";

    private final ResearchGroupRepository researchGroupRepository;
    private final UserGroupRepository userGroupRepository;

    /**
     * Attempts to match a user to their research group and assign them as head.
     * Uses a three-tier matching strategy: universityId > email > name.
     * If a match is found, the user is automatically granted the professor role.
     *
     * @param user the user to match
     */
    public void matchProfessorToResearchGroup(User user) {
        if (user == null) {
            return;
        }

        // Check if user is already a head of any research group
        if (isAlreadyHead(user)) {
            log.debug("User {} is already head of a research group, skipping matching", user.getUniversityId());
            return;
        }

        // Try matching strategies in order of reliability
        Optional<ResearchGroup> matchingGroup = matchByUniversityId(user)
                .or(() -> matchByEmail(user))
                .or(() -> matchByName(user));

        if (matchingGroup.isEmpty()) {
            log.debug("No matching research group found for user: {} (universityId: {})",
                    user.getFirstName() + " " + user.getLastName(), user.getUniversityId());
            return;
        }

        ResearchGroup group = matchingGroup.get();

        // Only assign if the group doesn't already have a head
        if (group.getHead() != null) {
            log.debug("Research group '{}' already has a head: {}",
                    group.getName(), group.getHead().getUniversityId());
            return;
        }

        // Don't assign if the group is flagged for manual mapping
        if (group.isNeedsManualMapping()) {
            log.debug("Research group '{}' is flagged for manual mapping, skipping auto-assignment",
                    group.getName());
            return;
        }

        // Assign professor role if user doesn't have it
        if (!user.hasAnyGroup(PROFESSOR_ROLE)) {
            assignProfessorRole(user);
        }

        // Assign user as head
        group.setHead(user);
        user.setResearchGroup(group);
        researchGroupRepository.save(group);

        log.info("Auto-assigned {} {} (universityId: {}) as head of research group '{}'",
                user.getFirstName(), user.getLastName(), user.getUniversityId(), group.getName());
    }

    /**
     * Primary matching strategy: Match by universityId (most reliable).
     * This uses the professor_university_id field imported from Keycloak/LDAP lookup.
     */
    private Optional<ResearchGroup> matchByUniversityId(User user) {
        if (user.getUniversityId() == null || user.getUniversityId().isBlank()) {
            return Optional.empty();
        }

        Optional<ResearchGroup> match = researchGroupRepository
                .findByProfessorUniversityIdAndHeadIsNull(user.getUniversityId());

        match.ifPresent(researchGroup -> log.debug("Found research group '{}' matching universityId: {}",
                researchGroup.getName(), user.getUniversityId()));

        return match;
    }

    /**
     * Secondary matching strategy: Match by email.
     * This uses the professor_email field (from CSV import).
     */
    private Optional<ResearchGroup> matchByEmail(User user) {
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            return Optional.empty();
        }

        Optional<ResearchGroup> match = researchGroupRepository
                .findByProfessorEmailIgnoreCaseAndHeadIsNull(user.getEmail());

        match.ifPresent(researchGroup -> log.debug("Found research group '{}' matching email: {}",
                researchGroup.getName(), user.getEmail()));

        return match;
    }

    /**
     * Tertiary matching strategy: Match by name (least reliable).
     * This uses exact case-insensitive first name and last name matching.
     */
    private Optional<ResearchGroup> matchByName(User user) {
        // Need both first and last name for matching
        if (user.getFirstName() == null || user.getLastName() == null) {
            return Optional.empty();
        }

        Optional<ResearchGroup> match = researchGroupRepository
                .findByProfessorNameIgnoreCase(user.getFirstName(), user.getLastName());

        // Only return the match if the group doesn't need manual mapping
        // (groups flagged for manual mapping shouldn't be auto-assigned via name)
        if (match.isPresent()) {
            ResearchGroup group = match.get();
            if (group.isNeedsManualMapping()) {
                log.debug("Found research group '{}' matching name {} {}, but it's flagged for manual mapping",
                        group.getName(), user.getFirstName(), user.getLastName());
                return Optional.empty();
            }
            log.debug("Found research group '{}' matching name: {} {}",
                    group.getName(), user.getFirstName(), user.getLastName());
        }

        return match;
    }

    private void assignProfessorRole(User user) {
        UserGroupId groupId = new UserGroupId();
        groupId.setUserId(user.getId());
        groupId.setRole(PROFESSOR_ROLE);

        UserGroup userGroup = new UserGroup();
        userGroup.setId(groupId);
        userGroup.setUser(user);

        userGroupRepository.save(userGroup);
        user.getGroups().add(userGroup);

        log.info("Auto-assigned professor role to user {} {} based on research group match",
                user.getFirstName(), user.getLastName());
    }

    private boolean isAlreadyHead(User user) {
        return researchGroupRepository.existsByHeadId(user.getId());
    }
}
