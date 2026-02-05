package de.tum.cit.aet.staffplan.service.matching;

/**
 * Interface for position matching rules used by the position finder algorithm.
 * <p>
 * Each rule evaluates a specific aspect of position-employee compatibility:
 * <ul>
 *   <li>{@link BudgetEfficiencyRule}: Ensures employee cost fits position budget, minimizes waste</li>
 *   <li>{@link SplitMinimizationRule}: Prefers positions with fewer existing assignments</li>
 *   <li>{@link TimeOverlapRule}: Evaluates temporal compatibility between position and request</li>
 * </ul>
 * <p>
 * Rules are applied in priority order. Each rule returns either:
 * <ul>
 *   <li>A score from 0-100 (higher is better)</li>
 *   <li>-1 to exclude the position entirely (hard constraint violation)</li>
 * </ul>
 * <p>
 * The final matching score is calculated as the weighted sum of all rule scores:
 * {@code totalScore = Σ(ruleScore × ruleWeight)}
 *
 * @see MatchingContext
 * @see de.tum.cit.aet.staffplan.service.PositionFinderService
 */
public interface MatchingRule {

    /**
     * Returns the display name of this rule.
     *
     * @return human-readable rule name (e.g., "Budget Efficiency")
     */
    String getName();

    /**
     * Returns the evaluation priority of this rule.
     * <p>
     * Rules with lower priority numbers are evaluated first. This affects:
     * <ul>
     *   <li>Display order in UI</li>
     *   <li>Early termination (if a high-priority rule excludes a position)</li>
     * </ul>
     *
     * @return priority value (1 = highest priority)
     */
    int getPriority();

    /**
     * Returns the weight of this rule in the overall matching score.
     * <p>
     * Weights should sum to 1.0 across all active rules. Current distribution:
     * <ul>
     *   <li>Budget Efficiency: 0.50 (50%)</li>
     *   <li>Split Minimization: 0.30 (30%)</li>
     *   <li>Time Overlap: 0.20 (20%)</li>
     * </ul>
     *
     * @return weight value between 0.0 and 1.0
     */
    double getWeight();

    /**
     * Evaluates this rule for the given matching context.
     * <p>
     * Implementation guidelines:
     * <ul>
     *   <li>Return -1 for hard constraint violations (position must be excluded)</li>
     *   <li>Return 0-100 for soft scoring (0 = poor match, 100 = perfect match)</li>
     *   <li>Keep evaluation logic stateless and side-effect free</li>
     * </ul>
     *
     * @param ctx the matching context containing position and request data
     * @return score from 0-100, or -1 to exclude the position
     */
    double evaluate(MatchingContext ctx);
}
