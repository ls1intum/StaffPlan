package de.tum.cit.aet.staffplan.repository;

import de.tum.cit.aet.staffplan.domain.Position;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Repository for Position entities.
 * <p>
 * Each Position row represents an assignment period for a specific position (identified by objectId).
 * A position may have multiple rows if it has multiple assignments or assignment changes over time.
 * Positions without a personnelNumber (or with placeholder '00000000') represent unassigned capacity.
 */
@Repository
public interface PositionRepository extends JpaRepository<Position, UUID> {

    /**
     * Retrieves all positions with their research groups eagerly loaded.
     *
     * @return all positions ordered by start date ascending
     */
    @Query("SELECT p FROM Position p LEFT JOIN FETCH p.researchGroup ORDER BY p.startDate ASC")
    List<Position> findAllWithResearchGroup();

    /**
     * Retrieves positions for a specific research group with the research group eagerly loaded.
     *
     * @param researchGroupId the research group ID to filter by
     * @return positions for the specified research group, ordered by start date ascending
     */
    @Query("SELECT p FROM Position p LEFT JOIN FETCH p.researchGroup WHERE p.researchGroup.id = :researchGroupId ORDER BY p.startDate ASC")
    List<Position> findByResearchGroupIdWithResearchGroup(@Param("researchGroupId") UUID researchGroupId);

    /**
     * Retrieves all positions with research groups for matching operations.
     *
     * @return all positions with research groups loaded
     */
    @Query("SELECT p FROM Position p LEFT JOIN FETCH p.researchGroup")
    List<Position> findAllWithResearchGroupForMatching();

    /**
     * Deletes all positions belonging to a specific research group.
     *
     * @param researchGroupId the research group ID whose positions should be deleted
     */
    void deleteByResearchGroupId(UUID researchGroupId);

    /**
     * Finds candidate positions for the position finder/matching algorithm.
     * <p>
     * This query returns all positions that could potentially be available, without date filtering.
     * Date-based availability is calculated in Java using time-slice analysis because:
     * <ul>
     *   <li>Positions whose assignments ended are 100% available (no date overlap needed)</li>
     *   <li>Availability varies over time and requires analyzing multiple time slices</li>
     *   <li>The minimum availability across the entire search period must be calculated</li>
     * </ul>
     * <p>
     * Excludes:
     * <ul>
     *   <li>Positions without a valid tariff group (grade)</li>
     *   <li>Placeholder rows (personnel_number = '00000000')</li>
     * </ul>
     *
     * @param researchGroupId optional filter to restrict results to a specific research group (null = all)
     * @param relevanceTypes  optional filter for position relevance types (null = all types)
     * @return candidate positions ordered by grade and start date
     */
    @Query("""
            SELECT p FROM Position p
            WHERE p.tariffGroup IS NOT NULL AND p.tariffGroup <> ''
              AND (p.personnelNumber IS NULL OR p.personnelNumber <> '00000000')
              AND (:researchGroupId IS NULL OR p.researchGroup.id = :researchGroupId)
              AND (:relevanceTypes IS NULL OR p.positionRelevanceType IN :relevanceTypes)
            ORDER BY p.tariffGroup, p.startDate
            """)
    List<Position> findCandidatePositions(
            @Param("researchGroupId") UUID researchGroupId,
            @Param("relevanceTypes") List<String> relevanceTypes);

    /**
     * Counts the number of active assignments for a position at a specific date.
     * <p>
     * An assignment is considered active if its date range includes the reference date
     * (startDate <= referenceDate <= endDate). Excludes placeholder rows.
     * <p>
     * Note: This method is used for point-in-time queries. For period-based availability
     * calculations, use the time-slice analysis in {@code PositionFinderService}.
     *
     * @param objectId      the position's SAP object ID (shared by all assignment rows for the same position)
     * @param referenceDate the date to check for active assignments
     * @return the count of active assignments at the reference date
     */
    @Query("""
            SELECT COUNT(p) FROM Position p
            WHERE p.objectId = :objectId
              AND p.personnelNumber IS NOT NULL
              AND p.personnelNumber <> ''
              AND p.personnelNumber <> '00000000'
              AND (p.startDate IS NULL OR p.startDate <= :referenceDate)
              AND (p.endDate IS NULL OR p.endDate >= :referenceDate)
            """)
    int countAssignmentsAtDate(
            @Param("objectId") String objectId,
            @Param("referenceDate") LocalDate referenceDate);

    /**
     * Calculates the total assigned percentage for a position at a specific date.
     * <p>
     * Sums the percentage of all active assignments at the reference date. An assignment
     * is active if its date range includes the reference date. Excludes placeholder rows.
     * <p>
     * Example: If a position has two 50% assignments active on the reference date,
     * this returns 100 (fully occupied).
     * <p>
     * Note: This method is used for point-in-time queries. For period-based availability
     * calculations, use the time-slice analysis in {@code PositionFinderService}.
     *
     * @param objectId      the position's SAP object ID (shared by all assignment rows for the same position)
     * @param referenceDate the date to check for assigned percentage
     * @return the sum of percentages from all active assignments, or 0 if no active assignments
     */
    @Query("""
            SELECT COALESCE(SUM(p.percentage), 0) FROM Position p
            WHERE p.objectId = :objectId
              AND p.personnelNumber IS NOT NULL
              AND p.personnelNumber <> ''
              AND p.personnelNumber <> '00000000'
              AND (p.startDate IS NULL OR p.startDate <= :referenceDate)
              AND (p.endDate IS NULL OR p.endDate >= :referenceDate)
            """)
    java.math.BigDecimal sumAssignedPercentageAtDate(
            @Param("objectId") String objectId,
            @Param("referenceDate") LocalDate referenceDate);

    /**
     * Returns all distinct position relevance types for filter dropdowns.
     * <p>
     * Relevance types categorize positions (e.g., "Haushaltsstelle", "Drittmittelstelle").
     *
     * @return distinct non-empty relevance types, ordered alphabetically
     */
    @Query("""
            SELECT DISTINCT p.positionRelevanceType FROM Position p
            WHERE p.positionRelevanceType IS NOT NULL AND p.positionRelevanceType <> ''
            ORDER BY p.positionRelevanceType
            """)
    List<String> findDistinctRelevanceTypes();
}
