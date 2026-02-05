package de.tum.cit.aet.staffplan.service.matching;

import org.springframework.stereotype.Component;

/**
 * Matching rule that evaluates time overlap between the position and requested employment period.
 * <p>
 * This rule handles two scenarios:
 * <ol>
 *   <li><b>Position with sufficient availability:</b> If the position has enough available percentage
 *       to accommodate the request (calculated via time-slice analysis), it receives full score (100).
 *       This handles positions whose assignments ended before the search period - they are 100% available
 *       even though their assignment dates don't overlap with the search period.</li>
 *   <li><b>Position with partial overlap:</b> Score is proportional to the overlap between the
 *       position's assignment dates and the requested period. Positions with no overlap are excluded.</li>
 * </ol>
 * <p>
 * Weight: 20% of total matching score
 *
 * @see MatchingContext#availablePercentage()
 * @see MatchingContext#overlapDays()
 */
@Component
public class TimeOverlapRule implements MatchingRule {

    @Override
    public String getName() {
        return "Time Overlap";
    }

    @Override
    public int getPriority() {
        return 3;
    }

    @Override
    public double getWeight() {
        return 0.20;
    }

    /**
     * Evaluates the time overlap score for a position.
     * <p>
     * Scoring logic:
     * <ul>
     *   <li>If requested days is invalid (≤0): returns -1 (excluded)</li>
     *   <li>If position has sufficient availability for the entire period: returns 100 (full score)</li>
     *   <li>If position has no date overlap with the search period: returns -1 (excluded)</li>
     *   <li>Otherwise: returns proportional score based on overlap percentage (0-100)</li>
     * </ul>
     *
     * @param ctx the matching context containing position and request details
     * @return score from 0-100, or -1 to exclude the position
     */
    @Override
    public double evaluate(MatchingContext ctx) {
        long requestedDays = ctx.requestedDays();

        // If requested days is 0 or negative (invalid), exclude
        if (requestedDays <= 0) {
            return -1;
        }

        // If position has availability (assignment ended or never started during search period),
        // it's fully available for the search period - full overlap score
        if (ctx.availablePercentage().compareTo(ctx.requestedPercentage()) >= 0) {
            // Position can accommodate the request, consider it as full time overlap
            return 100.0;
        }

        long overlapDays = ctx.overlapDays();

        // No overlap at all - exclude this position
        if (overlapDays <= 0) {
            return -1;
        }

        // Score based on overlap percentage
        // 100% overlap = 100 points
        // 50% overlap = 50 points
        // 0% overlap = excluded
        double overlapPercentage = (double) overlapDays / requestedDays * 100;
        return Math.min(100, overlapPercentage);
    }
}
