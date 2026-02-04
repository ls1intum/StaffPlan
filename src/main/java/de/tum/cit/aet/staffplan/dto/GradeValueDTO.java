package de.tum.cit.aet.staffplan.dto;

import de.tum.cit.aet.staffplan.domain.GradeValue;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Data transfer object for grade values.
 */
public record GradeValueDTO(
        UUID id,
        String gradeCode,
        String gradeType,
        String displayName,
        BigDecimal monthlyValue,
        BigDecimal minSalary,
        BigDecimal maxSalary,
        Integer sortOrder,
        Boolean active,
        Boolean inUse
) {
    /**
     * Creates a GradeValueDTO from a GradeValue entity.
     */
    public static GradeValueDTO fromEntity(GradeValue entity) {
        return fromEntity(entity, false);
    }

    /**
     * Creates a GradeValueDTO from a GradeValue entity with inUse flag.
     */
    public static GradeValueDTO fromEntity(GradeValue entity, boolean inUse) {
        return new GradeValueDTO(
                entity.getId(),
                entity.getGradeCode(),
                entity.getGradeType(),
                entity.getDisplayName(),
                entity.getMonthlyValue(),
                entity.getMinSalary(),
                entity.getMaxSalary(),
                entity.getSortOrder(),
                entity.getActive(),
                inUse
        );
    }
}
