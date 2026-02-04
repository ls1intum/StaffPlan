package de.tum.cit.aet.staffplan.service.matching;

import de.tum.cit.aet.staffplan.domain.Position;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Context data for evaluating position matching rules.
 *
 * @param position the position being evaluated
 * @param employeeGrade the employee's grade code
 * @param employeeMonthlyCost the employee's monthly cost (grade value * percentage)
 * @param positionBudget the position's monthly budget (grade value * percentage)
 * @param requestedStartDate the requested employment start date
 * @param requestedEndDate the requested employment end date
 * @param requestedPercentage the requested employment percentage
 * @param currentAssignmentCount number of current assignments on this position
 * @param currentAssignedPercentage total percentage already assigned
 */
public record MatchingContext(
        Position position,
        String employeeGrade,
        BigDecimal employeeMonthlyCost,
        BigDecimal positionBudget,
        LocalDate requestedStartDate,
        LocalDate requestedEndDate,
        BigDecimal requestedPercentage,
        int currentAssignmentCount,
        BigDecimal currentAssignedPercentage
) {
    /**
     * Returns the available percentage on this position.
     * Available = 100% - total assigned percentage for this objectId.
     */
    public BigDecimal availablePercentage() {
        return BigDecimal.valueOf(100).subtract(currentAssignedPercentage);
    }

    /**
     * Calculates the waste amount (unused budget).
     */
    public BigDecimal wasteAmount() {
        return positionBudget.subtract(employeeMonthlyCost);
    }

    /**
     * Checks if the employee fits within the position budget.
     */
    public boolean fitsInBudget() {
        return employeeMonthlyCost.compareTo(positionBudget) <= 0;
    }

    /**
     * Calculates the number of overlapping days between the position and requested period.
     */
    public long overlapDays() {
        LocalDate posStart = position.getStartDate();
        LocalDate posEnd = position.getEndDate();

        if (posStart == null || posEnd == null) {
            // If position has no dates, assume full overlap
            return java.time.temporal.ChronoUnit.DAYS.between(requestedStartDate, requestedEndDate);
        }

        LocalDate overlapStart = posStart.isAfter(requestedStartDate) ? posStart : requestedStartDate;
        LocalDate overlapEnd = posEnd.isBefore(requestedEndDate) ? posEnd : requestedEndDate;

        if (overlapStart.isAfter(overlapEnd)) {
            return 0;
        }

        return java.time.temporal.ChronoUnit.DAYS.between(overlapStart, overlapEnd);
    }

    /**
     * Calculates the total requested days.
     */
    public long requestedDays() {
        return java.time.temporal.ChronoUnit.DAYS.between(requestedStartDate, requestedEndDate);
    }
}
