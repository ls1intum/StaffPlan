package de.tum.cit.aet.staffplan.service;

import de.tum.cit.aet.staffplan.domain.GradeValue;
import de.tum.cit.aet.staffplan.domain.Position;
import de.tum.cit.aet.staffplan.dto.PositionFinderRequestDTO;
import de.tum.cit.aet.staffplan.dto.PositionFinderResponseDTO;
import de.tum.cit.aet.staffplan.dto.PositionMatchDTO;
import de.tum.cit.aet.staffplan.dto.SplitSuggestionDTO;
import de.tum.cit.aet.staffplan.repository.GradeValueRepository;
import de.tum.cit.aet.staffplan.repository.PositionRepository;
import de.tum.cit.aet.staffplan.service.matching.MatchingContext;
import de.tum.cit.aet.staffplan.service.matching.MatchingRule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PositionFinderService {

    private final PositionRepository positionRepository;
    private final GradeValueRepository gradeValueRepository;
    private final List<MatchingRule> matchingRules;

    /**
     * Finds positions matching the given criteria.
     *
     * @param request the position finder request
     * @return matching positions with optional split suggestions
     */
    public PositionFinderResponseDTO findPositions(PositionFinderRequestDTO request) {
        // Validate request
        if (request.startDate() == null || request.endDate() == null) {
            throw new IllegalArgumentException("Start date and end date are required");
        }
        if (request.startDate().isAfter(request.endDate())) {
            throw new IllegalArgumentException("Start date must be before end date");
        }
        if (request.employeeGrade() == null || request.employeeGrade().isBlank()) {
            throw new IllegalArgumentException("Employee grade is required");
        }

        int fillPercentage = request.fillPercentageOrDefault();
        if (fillPercentage < 1 || fillPercentage > 100) {
            throw new IllegalArgumentException("Fill percentage must be between 1 and 100");
        }

        // Get employee grade value (normalize the grade code)
        String normalizedEmployeeGrade = normalizeGradeCode(request.employeeGrade());
        GradeValue employeeGradeValue = gradeValueRepository.findByGradeCode(normalizedEmployeeGrade)
                .orElseThrow(() -> new IllegalArgumentException("Unknown employee grade: " + request.employeeGrade() + " (normalized: " + normalizedEmployeeGrade + ")"));

        BigDecimal employeeMonthlyCost = calculateMonthlyCost(employeeGradeValue, fillPercentage);

        // Prepare relevance types filter (treat empty list as null = no filter)
        List<String> relevanceTypes = request.relevanceTypes();
        if (relevanceTypes != null && relevanceTypes.isEmpty()) {
            relevanceTypes = null;
        }

        // Find candidate positions (date filtering is done in Java for complex availability logic)
        List<Position> candidates = positionRepository.findCandidatePositions(
                request.researchGroupId(),
                relevanceTypes);

        log.info("Found {} candidate positions for grade {} at {}%",
                candidates.size(), request.employeeGrade(), fillPercentage);

        // Group positions by objectId to handle position splits
        Map<String, List<Position>> positionsByObjectId = new HashMap<>();
        for (Position position : candidates) {
            if (position.getObjectId() != null) {
                positionsByObjectId.computeIfAbsent(position.getObjectId(), k -> new ArrayList<>()).add(position);
            }
        }

        // Evaluate each unique position
        List<PositionMatchDTO> matches = new ArrayList<>();
        Set<String> processedObjectIds = new HashSet<>();
        int skippedUnknownGrade = 0;
        int skippedNoAvailability = 0;
        int skippedByRules = 0;

        for (Position position : candidates) {
            String objectId = position.getObjectId();
            if (objectId == null || processedObjectIds.contains(objectId)) {
                continue;
            }
            processedObjectIds.add(objectId);

            // Get position grade value (normalize the grade code for matching)
            // Use tariffGroup which contains the actual grade (E10, E13, etc.)
            String normalizedGrade = normalizeGradeCode(position.getTariffGroup());
            Optional<GradeValue> positionGradeOpt = gradeValueRepository.findByGradeCode(normalizedGrade);
            if (positionGradeOpt.isEmpty()) {
                skippedUnknownGrade++;
                if (skippedUnknownGrade <= 5) {
                    log.warn("Skipping position {} - unknown grade: '{}' (normalized: '{}')", objectId, position.getTariffGroup(), normalizedGrade);
                }
                continue;
            }

            GradeValue positionGradeValue = positionGradeOpt.get();

            // Get all positions for this objectId to calculate availability across the entire period
            List<Position> positionsForObjectId = positionsByObjectId.get(objectId);
            AvailabilityInfo availability = calculateMinAvailabilityInPeriod(
                    positionsForObjectId,
                    request.startDate(),
                    request.endDate()
            );

            BigDecimal availablePercentage = availability.minAvailablePercentage();
            int assignmentCount = availability.maxAssignmentCount();
            BigDecimal assignedPercentage = BigDecimal.valueOf(100).subtract(availablePercentage);

            // Debug: log details for first few positions
            if (processedObjectIds.size() <= 3) {
                log.info("Position {} (grade {}): minAvailable={}%, maxAssignments={}",
                        objectId, position.getTariffGroup(), availablePercentage, assignmentCount);
            }

            // Calculate position budget based on AVAILABLE percentage
            BigDecimal positionBudget = calculatePositionBudgetForPercentage(positionGradeValue, availablePercentage);

            // Build matching context
            MatchingContext ctx = new MatchingContext(
                    position,
                    request.employeeGrade(),
                    employeeMonthlyCost,
                    positionBudget,
                    request.startDate(),
                    request.endDate(),
                    BigDecimal.valueOf(fillPercentage),
                    assignmentCount,
                    assignedPercentage
            );
            if (availablePercentage.compareTo(BigDecimal.valueOf(fillPercentage)) < 0) {
                skippedNoAvailability++;
                if (skippedNoAvailability <= 5) {
                    log.warn("Skipping position {} - insufficient availability: {}% < {}% (assigned: {}%)",
                            objectId, availablePercentage, fillPercentage, assignedPercentage);
                }
                continue;
            }

            // Evaluate all rules
            double totalScore = 0;
            boolean excluded = false;
            List<String> warnings = new ArrayList<>();

            for (MatchingRule rule : matchingRules) {
                double score = rule.evaluate(ctx);
                if (score < 0) {
                    excluded = true;
                    break;
                }
                totalScore += score * rule.getWeight();
            }

            if (excluded) {
                skippedByRules++;
                if (skippedByRules <= 5) {
                    log.warn("Skipping position {} - excluded by matching rule (employee cost: {}, position budget: {})",
                            objectId, employeeMonthlyCost, positionBudget);
                }
                continue;
            }

            // Calculate waste info
            BigDecimal waste = ctx.wasteAmount();
            double wastePercentage = positionBudget.compareTo(BigDecimal.ZERO) > 0
                    ? waste.divide(positionBudget, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                    : 0;

            // Add warnings
            if (wastePercentage > 30) {
                warnings.add("High budget waste (>" + String.format("%.0f", wastePercentage) + "%)");
            }
            if (assignmentCount >= 2) {
                warnings.add("Position has multiple assignments");
            }
            long overlapDays = ctx.overlapDays();
            long requestedDays = ctx.requestedDays();
            if (requestedDays > 0 && (double) overlapDays / requestedDays < 0.8) {
                warnings.add("Partial time overlap only");
            }

            // Build match result
            PositionMatchDTO match = new PositionMatchDTO(
                    position.getId(),
                    objectId,
                    position.getObjectCode(),
                    position.getObjectDescription(),
                    position.getTariffGroup(),  // Use tariffGroup for grade display
                    position.getPositionRelevanceType(),
                    position.getPercentage(),
                    availablePercentage,
                    position.getStartDate(),
                    position.getEndDate(),
                    Math.round(totalScore * 100) / 100.0,
                    PositionMatchDTO.qualityFromScore(totalScore),
                    waste.setScale(2, RoundingMode.HALF_UP),
                    Math.round(wastePercentage * 100) / 100.0,
                    assignmentCount,
                    warnings
            );

            matches.add(match);
        }

        // Sort by overall score descending
        matches.sort((a, b) -> Double.compare(b.overallScore(), a.overallScore()));

        log.info("Found {} matching positions (skipped: {} unknown grade, {} no availability, {} by rules)",
                matches.size(), skippedUnknownGrade, skippedNoAvailability, skippedByRules);

        // Generate split suggestions if no single position can fully accommodate
        List<SplitSuggestionDTO> splitSuggestions = List.of();
        if (matches.isEmpty()) {
            splitSuggestions = generateSplitSuggestions(
                    candidates,
                    employeeGradeValue,
                    fillPercentage,
                    request.startDate(),
                    request.endDate()
            );
            log.info("Generated {} split suggestions", splitSuggestions.size());
        }

        return new PositionFinderResponseDTO(
                employeeMonthlyCost.setScale(2, RoundingMode.HALF_UP),
                request.employeeGrade(),
                fillPercentage,
                matches.size(),
                matches,
                splitSuggestions
        );
    }

    private BigDecimal calculateMonthlyCost(GradeValue gradeValue, int percentage) {
        BigDecimal monthlyValue = gradeValue.getMonthlyValue();
        if (monthlyValue == null) {
            return BigDecimal.ZERO;
        }
        return monthlyValue.multiply(BigDecimal.valueOf(percentage))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculatePositionBudgetForPercentage(GradeValue gradeValue, BigDecimal percentage) {
        BigDecimal monthlyValue = gradeValue.getMonthlyValue();
        if (monthlyValue == null) {
            return BigDecimal.ZERO;
        }
        if (percentage == null) {
            percentage = BigDecimal.valueOf(100);
        }
        return monthlyValue.multiply(percentage)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    /**
     * Generates split suggestions when no single position can accommodate the full request.
     * Finds combinations of positions that together can satisfy the requested percentage
     * for the ENTIRE search period.
     */
    private List<SplitSuggestionDTO> generateSplitSuggestions(
            List<Position> candidates,
            GradeValue employeeGradeValue,
            int fillPercentage,
            LocalDate startDate,
            LocalDate endDate
    ) {
        // Group candidates by objectId
        Map<String, List<Position>> positionsByObjectId = new HashMap<>();
        for (Position position : candidates) {
            if (position.getObjectId() != null) {
                positionsByObjectId.computeIfAbsent(position.getObjectId(), k -> new ArrayList<>()).add(position);
            }
        }

        // Collect all positions with any available capacity that match the grade
        List<PositionMatchDTO> partialMatches = new ArrayList<>();
        Set<String> seenObjectIds = new HashSet<>();

        for (Position position : candidates) {
            String objectId = position.getObjectId();
            if (objectId == null || seenObjectIds.contains(objectId)) {
                continue;
            }
            seenObjectIds.add(objectId);

            // Check grade matches
            String normalizedGrade = normalizeGradeCode(position.getTariffGroup());
            Optional<GradeValue> positionGradeOpt = gradeValueRepository.findByGradeCode(normalizedGrade);
            if (positionGradeOpt.isEmpty()) {
                continue;
            }

            GradeValue positionGradeValue = positionGradeOpt.get();

            // Only include positions of the same or higher grade (budget-wise)
            if (positionGradeValue.getMonthlyValue().compareTo(employeeGradeValue.getMonthlyValue()) < 0) {
                continue;
            }

            // Get minimum available percentage across the entire period
            List<Position> positionsForObjectId = positionsByObjectId.get(objectId);
            AvailabilityInfo availability = calculateMinAvailabilityInPeriod(positionsForObjectId, startDate, endDate);
            BigDecimal availablePercentage = availability.minAvailablePercentage();

            // Skip if no availability
            if (availablePercentage.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            int assignmentCount = availability.maxAssignmentCount();

            // Calculate budget and waste for this partial position
            BigDecimal positionBudget = calculatePositionBudgetForPercentage(positionGradeValue, availablePercentage);
            BigDecimal partialEmployeeCost = calculateMonthlyCost(employeeGradeValue, availablePercentage.intValue());
            BigDecimal waste = positionBudget.subtract(partialEmployeeCost);
            if (waste.compareTo(BigDecimal.ZERO) < 0) {
                waste = BigDecimal.ZERO;
            }
            double wastePercentage = positionBudget.compareTo(BigDecimal.ZERO) > 0
                    ? waste.divide(positionBudget, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                    : 0;

            PositionMatchDTO match = new PositionMatchDTO(
                    position.getId(),
                    objectId,
                    position.getObjectCode(),
                    position.getObjectDescription(),
                    position.getTariffGroup(),
                    position.getPositionRelevanceType(),
                    position.getPercentage(),
                    availablePercentage,
                    position.getStartDate(),
                    position.getEndDate(),
                    50.0, // Default score for partial matches
                    PositionMatchDTO.MatchQuality.FAIR,
                    waste.setScale(2, RoundingMode.HALF_UP),
                    Math.round(wastePercentage * 100) / 100.0,
                    assignmentCount,
                    List.of()
            );

            partialMatches.add(match);
        }

        List<SplitSuggestionDTO> suggestions = new ArrayList<>();
        BigDecimal targetPercentage = BigDecimal.valueOf(fillPercentage);

        // Find top combinations for each split size (2, 3, 4 positions)
        // Return more options for 2-way splits (most practical), fewer for larger splits
        suggestions.addAll(findTopCombinations(partialMatches, targetPercentage, 2, 5));
        suggestions.addAll(findTopCombinations(partialMatches, targetPercentage, 3, 2));
        suggestions.addAll(findTopCombinations(partialMatches, targetPercentage, 4, 1));

        // Sort suggestions by split count first (prefer fewer splits), then by excess percentage
        suggestions.sort((a, b) -> {
            int splitCompare = Integer.compare(a.splitCount(), b.splitCount());
            if (splitCompare != 0) {
                return splitCompare;
            }
            // Within same split count, prefer minimal excess
            BigDecimal excessA = a.totalAvailablePercentage().subtract(targetPercentage);
            BigDecimal excessB = b.totalAvailablePercentage().subtract(targetPercentage);
            return excessA.compareTo(excessB);
        });

        // Return top 8 suggestions
        return suggestions.stream().limit(8).toList();
    }

    /**
     * Finds the top combinations of exactly n positions that meet the target percentage,
     * sorted by minimal excess (over-allocation).
     */
    private List<SplitSuggestionDTO> findTopCombinations(
            List<PositionMatchDTO> positions,
            BigDecimal targetPercentage,
            int n,
            int maxResults
    ) {
        if (positions.size() < n) {
            return List.of();
        }

        // Generate all combinations of size n
        List<List<PositionMatchDTO>> combinations = generateCombinations(positions, n);

        // Filter and sort by excess
        return combinations.stream()
                .map(combo -> {
                    BigDecimal totalAvailable = combo.stream()
                            .map(PositionMatchDTO::availablePercentage)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new AbstractMap.SimpleEntry<>(combo, totalAvailable);
                })
                .filter(entry -> entry.getValue().compareTo(targetPercentage) >= 0)
                .sorted((a, b) -> {
                    BigDecimal excessA = a.getValue().subtract(targetPercentage);
                    BigDecimal excessB = b.getValue().subtract(targetPercentage);
                    return excessA.compareTo(excessB);
                })
                .limit(maxResults)
                .map(entry -> SplitSuggestionDTO.fromMatches(new ArrayList<>(entry.getKey())))
                .toList();
    }

    /**
     * Generates all combinations of size k from the given list.
     * Limited to first 100 positions to avoid combinatorial explosion.
     */
    private List<List<PositionMatchDTO>> generateCombinations(List<PositionMatchDTO> positions, int k) {
        List<List<PositionMatchDTO>> result = new ArrayList<>();
        // Limit input size to prevent combinatorial explosion
        List<PositionMatchDTO> limited = positions.size() > 100 ? positions.subList(0, 100) : positions;
        generateCombinationsHelper(limited, k, 0, new ArrayList<>(), result);
        return result;
    }

    private void generateCombinationsHelper(
            List<PositionMatchDTO> positions,
            int k,
            int start,
            List<PositionMatchDTO> current,
            List<List<PositionMatchDTO>> result
    ) {
        if (current.size() == k) {
            result.add(new ArrayList<>(current));
            return;
        }

        // Early termination if we can't possibly fill the remaining slots
        if (start >= positions.size() || positions.size() - start < k - current.size()) {
            return;
        }

        // Limit total combinations to prevent performance issues
        if (result.size() >= 10000) {
            return;
        }

        for (int i = start; i < positions.size(); i++) {
            current.add(positions.get(i));
            generateCombinationsHelper(positions, k, i + 1, current, result);
            current.removeLast();
        }
    }

    /**
     * Normalizes a grade code for matching.
     * Removes spaces, converts to uppercase, and handles common variations.
     * Examples: "E 13" -> "E13", "e13" -> "E13", "E13 TVL" -> "E13", "E13UE" -> "E13", "A13 A.Z." -> "A13"
     */
    private String normalizeGradeCode(String gradeCode) {
        if (gradeCode == null || gradeCode.isBlank()) {
            return "";
        }
        // Remove spaces and convert to uppercase
        String normalized = gradeCode.toUpperCase().replaceAll("\\s+", "");
        // Remove common suffixes like "TVL", "TVÖD", "UE" (Überleitungsentgelt), "A.Z." etc.
        normalized = normalized.replaceAll("(TVL|TVÖD|TV-L|TVOED|UE|Ü|A\\.Z\\.)$", "");
        // Handle cases like "E13A" or "E13B" -> keep as is (these are distinct grades)
        // Handle cases like "E9A" vs "E9a" -> normalize to uppercase (already done)
        return normalized;
    }

    /**
     * Record to hold availability info for a position during a time period.
     */
    private record AvailabilityInfo(BigDecimal minAvailablePercentage, int maxAssignmentCount) {}

    /**
     * Calculates the minimum availability across the entire time period by analyzing all time slices.
     * The position must have sufficient availability for the ENTIRE period to be a valid match.
     *
     * @param positionsForObjectId all position rows for this objectId
     * @param startDate            search period start
     * @param endDate              search period end
     * @return availability info with minimum available percentage across the period
     */
    private AvailabilityInfo calculateMinAvailabilityInPeriod(
            List<Position> positionsForObjectId,
            LocalDate startDate,
            LocalDate endDate
    ) {
        // Collect all assignments (rows with personnel number, excluding placeholders)
        List<Position> assignments = positionsForObjectId.stream()
                .filter(p -> p.getPersonnelNumber() != null
                        && !p.getPersonnelNumber().isEmpty()
                        && !p.getPersonnelNumber().equals("00000000"))
                .toList();

        if (assignments.isEmpty()) {
            // No assignments = 100% available for the entire period
            return new AvailabilityInfo(BigDecimal.valueOf(100), 0);
        }

        // Collect all boundary dates within the search period
        TreeSet<LocalDate> boundaries = new TreeSet<>();
        boundaries.add(startDate);
        boundaries.add(endDate);

        for (Position a : assignments) {
            LocalDate aStart = a.getStartDate() != null ? a.getStartDate() : LocalDate.MIN;
            LocalDate aEnd = a.getEndDate() != null ? a.getEndDate() : LocalDate.MAX;

            // Add boundary if within search period
            if (!aStart.isBefore(startDate) && !aStart.isAfter(endDate)) {
                boundaries.add(aStart);
            }
            if (!aEnd.isBefore(startDate) && !aEnd.isAfter(endDate)) {
                boundaries.add(aEnd);
            }
            // Also add day after end date as a boundary (when availability changes)
            LocalDate dayAfterEnd = aEnd.plusDays(1);
            if (!dayAfterEnd.isBefore(startDate) && !dayAfterEnd.isAfter(endDate)) {
                boundaries.add(dayAfterEnd);
            }
        }

        // For each time slice, calculate assigned percentage and track the MINIMUM availability
        BigDecimal minAvailable = BigDecimal.valueOf(100);
        int maxAssignmentCount = 0;

        List<LocalDate> boundaryList = new ArrayList<>(boundaries);
        for (int i = 0; i < boundaryList.size() - 1; i++) {
            LocalDate sliceStart = boundaryList.get(i);

            // Use slice start date for checking which assignments are active
            LocalDate checkDate = sliceStart;

            // Sum assigned percentage for this slice
            BigDecimal assignedSum = BigDecimal.ZERO;
            int assignmentCount = 0;
            for (Position a : assignments) {
                LocalDate aStart = a.getStartDate() != null ? a.getStartDate() : LocalDate.MIN;
                LocalDate aEnd = a.getEndDate() != null ? a.getEndDate() : LocalDate.MAX;

                if (!aStart.isAfter(checkDate) && !aEnd.isBefore(checkDate)) {
                    assignedSum = assignedSum.add(a.getPercentage() != null ? a.getPercentage() : BigDecimal.ZERO);
                    assignmentCount++;
                }
            }

            BigDecimal available = BigDecimal.valueOf(100).subtract(assignedSum);
            if (available.compareTo(BigDecimal.ZERO) < 0) {
                available = BigDecimal.ZERO;
            }

            // Track minimum availability (worst case across the period)
            if (available.compareTo(minAvailable) < 0) {
                minAvailable = available;
            }
            if (assignmentCount > maxAssignmentCount) {
                maxAssignmentCount = assignmentCount;
            }
        }

        return new AvailabilityInfo(minAvailable, maxAssignmentCount);
    }
}
