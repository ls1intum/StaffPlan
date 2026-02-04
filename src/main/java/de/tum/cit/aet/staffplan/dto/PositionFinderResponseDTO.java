package de.tum.cit.aet.staffplan.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response DTO for position finder searches.
 */
public record PositionFinderResponseDTO(
        BigDecimal employeeMonthlyCost,
        String employeeGrade,
        int fillPercentage,
        int totalMatchesFound,
        List<PositionMatchDTO> matches
) {
}
