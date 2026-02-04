package de.tum.cit.aet.staffplan.service.matching;

import org.springframework.stereotype.Component;

/**
 * Secondary matching rule: prefers positions with fewer existing assignments.
 * This minimizes administrative complexity by avoiding heavily split positions.
 * <p>
 * Weight: 30%
 */
@Component
public class SplitMinimizationRule implements MatchingRule {

    @Override
    public String getName() {
        return "Split Minimization";
    }

    @Override
    public int getPriority() {
        return 2;
    }

    @Override
    public double getWeight() {
        return 0.30;
    }

    @Override
    public double evaluate(MatchingContext ctx) {
        int assignmentCount = ctx.currentAssignmentCount();

        // Score based on existing assignments
        // 0 assignments = 100 points (best - virgin position)
        // 1 assignment = 80 points
        // 2 assignments = 50 points
        // 3+ assignments = 25 points (heavily split)
        return switch (assignmentCount) {
            case 0 -> 100.0;
            case 1 -> 80.0;
            case 2 -> 50.0;
            default -> Math.max(10, 25 - (assignmentCount - 3) * 5.0);
        };
    }
}
