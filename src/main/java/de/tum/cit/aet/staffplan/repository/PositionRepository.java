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
     * Returns positions that have time overlap with the requested period and have a valid grade.
     * Excludes placeholder rows (personnel_number = '00000000').
     *
     * @param startDate       the requested start date (inclusive)
     * @param endDate         the requested end date (inclusive)
     * @param researchGroupId optional research group filter
     * @param relevanceTypes  optional relevance type filter
     * @return matching positions ordered by grade and start date
     */
    @Query("""
            SELECT p FROM Position p
            WHERE (p.startDate IS NULL OR p.startDate <= :endDate)
              AND (p.endDate IS NULL OR p.endDate >= :startDate)
              AND p.tariffGroup IS NOT NULL AND p.tariffGroup <> ''
              AND (p.personnelNumber IS NULL OR p.personnelNumber <> '00000000')
              AND (:researchGroupId IS NULL OR p.researchGroup.id = :researchGroupId)
              AND (:relevanceTypes IS NULL OR p.positionRelevanceType IN :relevanceTypes)
            ORDER BY p.tariffGroup, p.startDate
            """)
    List<Position> findCandidatePositions(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("researchGroupId") UUID researchGroupId,
            @Param("relevanceTypes") List<String> relevanceTypes);

    /**
     * Counts the number of assignments (occupied entries) for a position based on personnel number.
     * Excludes placeholder rows (personnel_number = '00000000').
     *
     * @param objectId the position object ID
     * @return the number of assigned entries for the position
     */
    @Query("""
            SELECT COUNT(p) FROM Position p
            WHERE p.objectId = :objectId
              AND p.personnelNumber IS NOT NULL
              AND p.personnelNumber <> ''
              AND p.personnelNumber <> '00000000'
            """)
    int countAssignmentsByObjectId(@Param("objectId") String objectId);

    /**
     * Calculates the total assigned percentage for a position.
     * Excludes placeholder rows (personnel_number = '00000000').
     *
     * @param objectId the position object ID
     * @return the total assigned percentage, or 0 if none
     */
    @Query("""
            SELECT COALESCE(SUM(p.percentage), 0) FROM Position p
            WHERE p.objectId = :objectId
              AND p.personnelNumber IS NOT NULL
              AND p.personnelNumber <> ''
              AND p.personnelNumber <> '00000000'
            """)
    java.math.BigDecimal sumAssignedPercentageByObjectId(@Param("objectId") String objectId);

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
