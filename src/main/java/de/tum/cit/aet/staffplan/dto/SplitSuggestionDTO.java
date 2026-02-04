package de.tum.cit.aet.staffplan.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Represents a suggestion to split an employee across multiple positions.
 *
 * @param positions the positions that together can accommodate the employee
 * @param totalAvailablePercentage the sum of available percentages across all positions
 * @param totalWasteAmount the total budget waste across all positions
 * @param splitCount the number of positions in this split
 */
public record SplitSuggestionDTO(
        List<PositionMatchDTO> positions,
        BigDecimal totalAvailablePercentage,
        BigDecimal totalWasteAmount,
        int splitCount
) {
    /**
     * Creates a split suggestion from a list of position matches.
     */
    public static SplitSuggestionDTO fromMatches(List<PositionMatchDTO> matches) {
        BigDecimal totalAvailable = matches.stream()
                .map(PositionMatchDTO::availablePercentage)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalWaste = matches.stream()
                .map(PositionMatchDTO::wasteAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new SplitSuggestionDTO(matches, totalAvailable, totalWaste, matches.size());
    }
}
