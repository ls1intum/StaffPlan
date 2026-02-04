package de.tum.cit.aet.staffplan.service.matching;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Primary matching rule: evaluates budget efficiency.
 * Positions where the employee costs less than the budget are preferred,
 * with minimal waste being ideal.
 * <p>
 * Weight: 50%
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
