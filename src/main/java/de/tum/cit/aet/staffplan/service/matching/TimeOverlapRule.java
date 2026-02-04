package de.tum.cit.aet.staffplan.service.matching;

import org.springframework.stereotype.Component;

/**
 * Tertiary matching rule: evaluates how well the position's time period
 * overlaps with the requested employment period.
 * <p>
 * Weight: 20%
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

    @Override
    public double evaluate(MatchingContext ctx) {
        long overlapDays = ctx.overlapDays();
        long requestedDays = ctx.requestedDays();

        // No overlap at all - exclude this position
        if (overlapDays <= 0) {
            return -1;
        }

        // If requested days is 0 or negative (invalid), exclude
        if (requestedDays <= 0) {
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
