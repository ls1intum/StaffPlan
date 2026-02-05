package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.staffplan.domain.Position;
import de.tum.cit.aet.staffplan.repository.PositionRepository;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service for matching organization units to research groups using various strategies:
 * 1. Exact match on abbreviation
 * 2. Exact match on name (case-sensitive and case-insensitive)
 * 3. Fuzzy matching with Levenshtein distance and token overlap
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ResearchGroupMatchingService {

    private static final double FUZZY_MATCH_THRESHOLD = 0.7;
    private static final Set<String> CENTRAL_UNIT_KEYWORDS = Set.of(
            "academic programs office",
            "ressourcenmanagement",
            "it operations",
            "dean's office",
            "stabsstellen",
            "zeitlab",
            "zentral"
    );

    // Pattern to extract abbreviations like (I12), (DSS), (CIT)
    private static final Pattern ABBREVIATION_PATTERN = Pattern.compile("\\(([A-Z0-9-]+)\\)");

    // Pattern to remove any parenthetical content (e.g., "(Prof. Schneider)")
    private static final Pattern PARENTHETICAL_PATTERN = Pattern.compile("\\s*\\([^)]+\\)");

    // Prefixes to strip from organization unit names
    private static final List<String> STRIP_PREFIXES = List.of(
            "L.f.", "Lehrstuhl für", "Prof.f.", "Professur für", "Prof. für"
    );

    private final ResearchGroupRepository researchGroupRepository;
    private final PositionRepository positionRepository;

    /**
     * Batch assigns research groups to all unassigned positions based on organization unit matching.
     * Optimized to pre-load all data and cache matching results.
     *
     * @return a map of matched positions (position ID -> research group name) and unmatched org units
     */
    public BatchAssignResult batchAssignPositions() {
        // Pre-load all data once (with researchGroup eagerly fetched)
        List<Position> allPositions = positionRepository.findAllWithResearchGroupForMatching();
        List<ResearchGroup> allGroups = researchGroupRepository.findAllByArchivedFalseOrderByNameAsc();

        // Build lookup maps for fast exact matching
        Map<String, ResearchGroup> groupsByAbbreviation = new HashMap<>();
        Map<String, ResearchGroup> groupsByName = new HashMap<>();
        Map<String, ResearchGroup> groupsByNameLower = new HashMap<>();

        for (ResearchGroup group : allGroups) {
            groupsByAbbreviation.put(group.getAbbreviation(), group);
            groupsByName.put(group.getName(), group);
            groupsByNameLower.put(group.getName().toLowerCase(), group);
        }

        // Cache for org unit -> research group mapping (avoids recalculating for same org unit)
        Map<String, Optional<ResearchGroup>> matchCache = new HashMap<>();

        Map<UUID, String> matched = new HashMap<>();
        Set<String> unmatched = new LinkedHashSet<>();
        List<Position> positionsToSave = new ArrayList<>();

        for (Position position : allPositions) {
            if (position.getResearchGroup() != null) {
                continue; // Already assigned
            }

            String orgUnit = position.getOrganizationUnit();
            if (orgUnit == null || orgUnit.isBlank()) {
                continue;
            }

            // Use cached result if available
            Optional<ResearchGroup> match = matchCache.computeIfAbsent(orgUnit,
                    ou -> matchOrganizationUnitOptimized(ou, groupsByAbbreviation, groupsByName, groupsByNameLower, allGroups));

            if (match.isPresent()) {
                position.setResearchGroup(match.get());
                positionsToSave.add(position);
                matched.put(position.getId(), match.get().getName());
            } else {
                unmatched.add(orgUnit);
            }
        }

        // Batch save all modified positions
        if (!positionsToSave.isEmpty()) {
            positionRepository.saveAll(positionsToSave);
        }

        log.info("Batch assign completed: {} positions matched, {} org units unmatched", matched.size(), unmatched.size());
        return new BatchAssignResult(matched, new ArrayList<>(unmatched));
    }

    /**
     * Optimized matching that uses pre-loaded lookup maps instead of database queries.
     */
    private Optional<ResearchGroup> matchOrganizationUnitOptimized(
            String orgUnit,
            Map<String, ResearchGroup> groupsByAbbreviation,
            Map<String, ResearchGroup> groupsByName,
            Map<String, ResearchGroup> groupsByNameLower,
            List<ResearchGroup> allGroups) {

        if (isCentralUnit(orgUnit)) {
            return Optional.empty();
        }

        NormalizedOrgUnit normalized = normalizeOrgUnit(orgUnit);

        // 1. Try exact match on abbreviation
        if (normalized.abbreviation != null) {
            ResearchGroup match = groupsByAbbreviation.get(normalized.abbreviation);
            if (match != null) {
                return Optional.of(match);
            }
        }

        // 2. Try exact match on name
        ResearchGroup nameMatch = groupsByName.get(normalized.name);
        if (nameMatch != null) {
            return Optional.of(nameMatch);
        }

        // 3. Try case-insensitive name match
        ResearchGroup lowerMatch = groupsByNameLower.get(normalized.normalizedForMatching);
        if (lowerMatch != null) {
            return Optional.of(lowerMatch);
        }

        // 4. Try fuzzy matching (using pre-loaded groups)
        return matchByFuzzyOptimized(normalized.normalizedForMatching, allGroups);
    }

    /**
     * Fuzzy matching using pre-loaded groups list.
     */
    private Optional<ResearchGroup> matchByFuzzyOptimized(String normalizedInput, List<ResearchGroup> allGroups) {
        double bestScore = 0;
        ResearchGroup bestMatch = null;

        for (ResearchGroup group : allGroups) {
            String groupNameNormalized = group.getName().toLowerCase().replaceAll("\\s+", " ").trim();
            double score = calculateMatchScore(normalizedInput, groupNameNormalized);

            if (score > bestScore && score >= FUZZY_MATCH_THRESHOLD) {
                bestScore = score;
                bestMatch = group;
            }
        }

        return Optional.ofNullable(bestMatch);
    }

    private boolean isCentralUnit(String orgUnit) {
        String lower = orgUnit.toLowerCase();
        return CENTRAL_UNIT_KEYWORDS.stream().anyMatch(lower::contains);
    }

    private NormalizedOrgUnit normalizeOrgUnit(String orgUnit) {
        String input = orgUnit.trim();

        // Extract abbreviation in parentheses (uppercase only, like I-ML, CIT, I12)
        String abbreviation = null;
        Matcher matcher = ABBREVIATION_PATTERN.matcher(input);
        if (matcher.find()) {
            abbreviation = matcher.group(1);
        }

        // Remove ALL parenthetical content (including professor names like "(Prof. Schneider)")
        String name = PARENTHETICAL_PATTERN.matcher(input).replaceAll("").trim();

        // Strip common prefixes
        String normalized = name;
        for (String prefix : STRIP_PREFIXES) {
            if (normalized.toLowerCase().startsWith(prefix.toLowerCase())) {
                normalized = normalized.substring(prefix.length()).trim();
                break;
            }
        }

        // Normalize for fuzzy matching (lowercase, remove extra whitespace)
        String forMatching = normalized.toLowerCase().replaceAll("\\s+", " ").trim();

        return new NormalizedOrgUnit(name, abbreviation, forMatching);
    }

    /**
     * Calculates a combined match score using Levenshtein similarity and token overlap.
     */
    private double calculateMatchScore(String input, String target) {
        // Levenshtein similarity (0 to 1)
        double levenshteinSim = 1.0 - ((double) levenshteinDistance(input, target) / Math.max(input.length(), target.length()));

        // Token overlap (Jaccard similarity)
        Set<String> inputTokens = new HashSet<>(Arrays.asList(input.split("\\s+")));
        Set<String> targetTokens = new HashSet<>(Arrays.asList(target.split("\\s+")));
        Set<String> intersection = new HashSet<>(inputTokens);
        intersection.retainAll(targetTokens);
        Set<String> union = new HashSet<>(inputTokens);
        union.addAll(targetTokens);
        double tokenSim = union.isEmpty() ? 0 : (double) intersection.size() / union.size();

        // Weighted combination
        return 0.5 * levenshteinSim + 0.5 * tokenSim;
    }

    /**
     * Calculates the Levenshtein distance between two strings.
     */
    private int levenshteinDistance(String s1, String s2) {
        int[][] dp = new int[s1.length() + 1][s2.length() + 1];

        for (int i = 0; i <= s1.length(); i++) {
            dp[i][0] = i;
        }
        for (int j = 0; j <= s2.length(); j++) {
            dp[0][j] = j;
        }

        for (int i = 1; i <= s1.length(); i++) {
            for (int j = 1; j <= s2.length(); j++) {
                int cost = s1.charAt(i - 1) == s2.charAt(j - 1) ? 0 : 1;
                dp[i][j] = Math.min(
                        Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1),
                        dp[i - 1][j - 1] + cost
                );
            }
        }

        return dp[s1.length()][s2.length()];
    }

    private record NormalizedOrgUnit(String name, String abbreviation, String normalizedForMatching) {}

    public record BatchAssignResult(Map<UUID, String> matched, List<String> unmatchedOrgUnits) {}
}
