package de.tum.cit.aet.staffplan.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * DTO representing a single position match result.
 */
public record PositionMatchDTO(
        UUID positionId,
        String objectId,
        String objectCode,
        String objectDescription,
        String positionGrade,
        BigDecimal positionPercentage,
        BigDecimal availablePercentage,
        LocalDate positionStartDate,
        LocalDate positionEndDate,
        double overallScore,
        MatchQuality matchQuality,
        BigDecimal wasteAmount,
        double wastePercentage,
        int currentAssignmentCount,
        List<String> warnings
) {
    /**
     * Match quality enumeration.
     */
    public enum MatchQuality {
        EXCELLENT, // 80-100
        GOOD,      // 60-79
        FAIR,      // 40-59
        POOR       // 0-39
    }

    /**
     * Determines match quality from overall score.
     */
    public static MatchQuality qualityFromScore(double score) {
        if (score >= 80) {
            return MatchQuality.EXCELLENT;
        }
        if (score >= 60) {
            return MatchQuality.GOOD;
        }
        if (score >= 40) {
            return MatchQuality.FAIR;
        }
        return MatchQuality.POOR;
    }
}
