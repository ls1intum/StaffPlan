package de.tum.cit.aet.staffplan.repository;

import de.tum.cit.aet.staffplan.domain.Position;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface PositionRepository extends JpaRepository<Position, UUID> {

    @Query("SELECT p FROM Position p LEFT JOIN FETCH p.researchGroup ORDER BY p.startDate ASC")
    List<Position> findAllWithResearchGroup();

    @Query("SELECT p FROM Position p LEFT JOIN FETCH p.researchGroup WHERE p.researchGroup.id = :researchGroupId ORDER BY p.startDate ASC")
    List<Position> findByResearchGroupIdWithResearchGroup(@Param("researchGroupId") UUID researchGroupId);

    @Query("SELECT p FROM Position p LEFT JOIN FETCH p.researchGroup")
    List<Position> findAllWithResearchGroupForMatching();

    void deleteByResearchGroupId(UUID researchGroupId);

    /**
     * Finds candidate positions for matching.
     * Returns all positions with a valid grade that could potentially be available.
     * The availability calculation is done in Java to handle complex date logic.
     * Excludes placeholder rows (personnel_number = '00000000').
     *
     * @param researchGroupId optional research group filter
     * @param relevanceTypes  optional relevance type filter
     * @return matching positions ordered by grade and start date
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
     * Counts the number of assignments (occupied entries) for a position at a specific date.
     * Excludes placeholder rows (personnel_number = '00000000').
     *
     * @param objectId      the position object ID
     * @param referenceDate the date to check (typically the start of the search period)
     * @return the number of active assignments at that date
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
     * Excludes placeholder rows (personnel_number = '00000000').
     *
     * @param objectId      the position object ID
     * @param referenceDate the date to check (typically the start of the search period)
     * @return the total assigned percentage at that date, or 0 if none
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
     * Returns all distinct position relevance types.
     *
     * @return distinct relevance types ordered alphabetically
     */
    @Query("""
            SELECT DISTINCT p.positionRelevanceType FROM Position p
            WHERE p.positionRelevanceType IS NOT NULL AND p.positionRelevanceType <> ''
            ORDER BY p.positionRelevanceType
            """)
    List<String> findDistinctRelevanceTypes();
}
