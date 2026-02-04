package de.tum.cit.aet.staffplan.service.matching;

/**
 * Interface for position matching rules.
 * Each rule evaluates a specific aspect of how well a position matches an employee's requirements.
 */
public interface MatchingRule {

    /**
     * Returns the name of this rule for display purposes.
     */
    String getName();

    /**
     * Returns the priority of this rule (lower = higher priority).
     * Used for sorting when displaying rule evaluations.
     */
    int getPriority();

    /**
     * Returns the weight of this rule in the overall score (0.0 - 1.0).
     * All weights should sum to 1.0 across all active rules.
     */
    double getWeight();

    /**
     * Evaluates this rule for the given context.
     *
     * @param ctx the matching context with position and employee data
     * @return a score from 0 to 100, or -1 if the position should be excluded entirely
     */
    double evaluate(MatchingContext ctx);
}
