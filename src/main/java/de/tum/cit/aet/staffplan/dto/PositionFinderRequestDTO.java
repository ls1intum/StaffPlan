package de.tum.cit.aet.staffplan.dto;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Request DTO for position finder searches.
 */
public record PositionFinderRequestDTO(
        LocalDate startDate,
        LocalDate endDate,
        String employeeGrade,
        Integer fillPercentage,
        UUID researchGroupId
) {
    /**
     * Returns the fill percentage as a decimal (0-100 -> actual percentage).
     */
    public int fillPercentageOrDefault() {
        return fillPercentage != null ? fillPercentage : 100;
    }
}
