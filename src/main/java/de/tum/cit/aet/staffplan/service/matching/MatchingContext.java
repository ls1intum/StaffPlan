package de.tum.cit.aet.staffplan.service.matching;

import de.tum.cit.aet.staffplan.domain.Position;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Immutable context data passed to matching rules for position evaluation.
 * <p>
 * Contains all information needed to evaluate whether a position is suitable
 * for an employee placement request, including budget comparisons, availability,
 * and time overlap calculations.
 * <p>
 * Note: The availability values ({@code currentAssignedPercentage}) represent
 * the minimum availability across the entire search period, calculated using
 * time-slice analysis. This ensures positions are only matched if they can
 * accommodate the employee for the full requested period.
 *
 * @param position                  the position being evaluated (one row from the database)
 * @param employeeGrade             the employee's grade code (e.g., "E13", "E14")
 * @param employeeMonthlyCost       the employee's prorated monthly cost (grade value × requested percentage)
 * @param positionBudget            the position's available monthly budget (grade value × available percentage)
 * @param requestedStartDate        the requested employment start date
 * @param requestedEndDate          the requested employment end date
 * @param requestedPercentage       the requested employment percentage (1-100)
 * @param currentAssignmentCount    maximum number of concurrent assignments during the search period
 * @param currentAssignedPercentage the assigned percentage representing worst-case availability
 *                                  (100 - this value = minimum available percentage)
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
     * Returns the minimum available percentage on this position during the search period.
     * <p>
     * This is calculated as 100% minus the worst-case assigned percentage across all
     * time slices in the search period. A value of 100% means the position is completely
     * free (e.g., all assignments ended before the search period).
     *
     * @return available percentage (0-100)
     */
    public BigDecimal availablePercentage() {
        return BigDecimal.valueOf(100).subtract(currentAssignedPercentage);
    }

    /**
     * Calculates the budget waste (unused portion) if this employee is placed on this position.
     * <p>
     * Waste occurs when the position's budget exceeds the employee's cost, typically when
     * placing a lower-grade employee on a higher-grade position.
     *
     * @return the monthly waste amount (position budget - employee cost), may be negative
     *         if employee costs exceed budget (though such positions should be excluded)
     */
    public BigDecimal wasteAmount() {
        return positionBudget.subtract(employeeMonthlyCost);
    }

    /**
     * Checks if the employee's cost fits within the position's available budget.
     * <p>
     * A position is budget-compatible if its available budget can cover the employee's
     * prorated monthly cost. Positions that fail this check should be excluded.
     *
     * @return true if employee cost ≤ position budget, false otherwise
     */
    public boolean fitsInBudget() {
        return employeeMonthlyCost.compareTo(positionBudget) <= 0;
    }

    /**
     * Calculates the number of overlapping days between the position's assignment dates
     * and the requested employment period.
     * <p>
     * Note: This uses the position row's start/end dates (assignment period), not the
     * availability period. For positions whose assignments ended before the search period,
     * this returns 0 even though they are 100% available. The {@link TimeOverlapRule}
     * handles this case by checking {@link #availablePercentage()} first.
     *
     * @return number of overlapping days, or 0 if no overlap
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
     * Calculates the total number of days in the requested employment period.
     *
     * @return number of days between start and end date (exclusive of end date)
     */
    public long requestedDays() {
        return java.time.temporal.ChronoUnit.DAYS.between(requestedStartDate, requestedEndDate);
    }
}
