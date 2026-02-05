package de.tum.cit.aet.staffplan.service.matching;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Primary matching rule that evaluates budget efficiency of a position placement.
 * <p>
 * This rule ensures that:
 * <ul>
 *   <li>The employee's cost does not exceed the position's available budget (hard constraint)</li>
 *   <li>Minimal budget waste is preferred (soft constraint affecting score)</li>
 * </ul>
 * <p>
 * Budget waste occurs when placing a lower-grade employee on a higher-grade position,
 * leaving unused budget capacity. For example, placing an E13 employee on an E14 position
 * results in waste equal to the monthly cost difference.
 * <p>
 * Weight: 50% of total matching score (highest priority rule)
 *
 * @see MatchingContext#fitsInBudget()
 * @see MatchingContext#wasteAmount()
 */
@Component
public class BudgetEfficiencyRule implements MatchingRule {

    @Override
    public String getName() {
        return "Budget Efficiency";
    }

    @Override
    public int getPriority() {
        return 1;
    }

    @Override
    public double getWeight() {
        return 0.50;
    }

    /**
     * Evaluates the budget efficiency score for a position placement.
     * <p>
     * Scoring logic:
     * <ul>
     *   <li>If employee cost exceeds position budget: returns -1 (excluded)</li>
     *   <li>If no waste (perfect budget match): returns 100</li>
     *   <li>Otherwise: score decreases linearly with waste percentage (100 - waste%)</li>
     * </ul>
     * <p>
     * Examples:
     * <ul>
     *   <li>E13 on E13 position (0% waste): score = 100</li>
     *   <li>E13 on E14 position (~15% waste): score ≈ 85</li>
     *   <li>E10 on E14 position (~50% waste): score ≈ 50</li>
     * </ul>
     *
     * @param ctx the matching context containing budget information
     * @return score from 0-100, or -1 to exclude the position
     */
    @Override
    public double evaluate(MatchingContext ctx) {
        // Exclude if employee costs more than position budget
        if (!ctx.fitsInBudget()) {
            return -1;
        }

        BigDecimal waste = ctx.wasteAmount();
        BigDecimal budget = ctx.positionBudget();

        // Perfect match (no waste) = 100 points
        if (waste.compareTo(BigDecimal.ZERO) == 0) {
            return 100.0;
        }

        // Calculate waste percentage
        double wastePercentage = waste.divide(budget, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();

        // Score decreases with more waste
        // 0% waste = 100 points
        // 50% waste = 50 points
        // 100% waste = 0 points
        return Math.max(0, 100 - wastePercentage);
    }
}
