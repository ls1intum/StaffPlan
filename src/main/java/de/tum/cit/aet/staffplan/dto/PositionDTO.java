package de.tum.cit.aet.staffplan.dto;

import de.tum.cit.aet.staffplan.domain.Position;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record PositionDTO(
        UUID id,
        String positionRelevanceType,
        String objectId,
        String status,
        String objectCode,
        String objectDescription,
        BigDecimal positionValue,
        String departmentId,
        String organizationUnit,
        String tariffGroup,
        String baseGrade,
        BigDecimal percentage,
        LocalDate startDate,
        LocalDate endDate,
        String fund,
        String departmentId2,
        String personnelNumber,
        String employeeGroup,
        String employeeCircle,
        LocalDate entryDate,
        LocalDate expectedExitDate,
        UUID researchGroupId
) {
    public static PositionDTO fromEntity(Position position) {
        return new PositionDTO(
                position.getId(),
                position.getPositionRelevanceType(),
                position.getObjectId(),
                position.getStatus(),
                position.getObjectCode(),
                position.getObjectDescription(),
                position.getPositionValue(),
                position.getDepartmentId(),
                position.getOrganizationUnit(),
                position.getTariffGroup(),
                position.getBaseGrade(),
                position.getPercentage(),
                position.getStartDate(),
                position.getEndDate(),
                position.getFund(),
                position.getDepartmentId2(),
                position.getPersonnelNumber(),
                position.getEmployeeGroup(),
                position.getEmployeeCircle(),
                position.getEntryDate(),
                position.getExpectedExitDate(),
                position.getResearchGroup() != null ? position.getResearchGroup().getId() : null
        );
    }
}
