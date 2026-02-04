package de.tum.cit.aet.staffplan.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response DTO for position finder searches.
 *
 * @param employeeMonthlyCost the monthly cost of the employee based on grade and percentage
 * @param employeeGrade the employee's grade code
 * @param fillPercentage the requested fill percentage
 * @param totalMatchesFound number of single-position matches found
 * @param matches list of positions that can fully accommodate the request
 * @param splitSuggestions suggested combinations when no single position suffices
 */
public record PositionFinderResponseDTO(
        BigDecimal employeeMonthlyCost,
        String employeeGrade,
        int fillPercentage,
        int totalMatchesFound,
        List<PositionMatchDTO> matches,
        List<SplitSuggestionDTO> splitSuggestions
) {
    /**
     * Constructor without split suggestions (for backward compatibility).
     */
    public PositionFinderResponseDTO(
            BigDecimal employeeMonthlyCost,
            String employeeGrade,
            int fillPercentage,
            int totalMatchesFound,
            List<PositionMatchDTO> matches
    ) {
        this(employeeMonthlyCost, employeeGrade, fillPercentage, totalMatchesFound, matches, List.of());
    }
}
