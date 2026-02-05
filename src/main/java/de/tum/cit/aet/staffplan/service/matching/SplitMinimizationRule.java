package de.tum.cit.aet.staffplan.service.matching;

import org.springframework.stereotype.Component;

/**
 * Matching rule that prefers positions with fewer existing assignments.
 * <p>
 * Positions can be split among multiple employees (e.g., two 50% assignments on one position).
 * This rule discourages adding to already heavily-split positions to reduce:
 * <ul>
 *   <li>Administrative complexity (tracking multiple assignments)</li>
 *   <li>Coordination overhead between employees sharing a position</li>
 *   <li>Budget fragmentation</li>
 * </ul>
 * <p>
 * Note: This rule uses the maximum concurrent assignment count during the search period,
 * as calculated by the time-slice analysis.
 * <p>
 * Weight: 30% of total matching score
 *
 * @see MatchingContext#currentAssignmentCount()
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

    /**
     * Evaluates the split minimization score based on existing assignment count.
     * <p>
     * Scoring logic:
     * <ul>
     *   <li>0 assignments (unoccupied position): 100 points</li>
     *   <li>1 assignment: 80 points</li>
     *   <li>2 assignments: 50 points</li>
     *   <li>3+ assignments: 25 points, decreasing by 5 for each additional (minimum 10)</li>
     * </ul>
     * <p>
     * This rule never excludes positions (always returns ≥ 0), but heavily-split
     * positions will score lower overall.
     *
     * @param ctx the matching context containing assignment count information
     * @return score from 10-100 (never excludes)
     */
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
