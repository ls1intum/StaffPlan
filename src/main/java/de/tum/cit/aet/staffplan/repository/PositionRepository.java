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

    List<Position> findByResearchGroupId(UUID researchGroupId);

    List<Position> findByResearchGroupIdOrderByStartDateAsc(UUID researchGroupId);

    List<Position> findAllByOrderByStartDateAsc();

    void deleteByResearchGroupId(UUID researchGroupId);

    /**
     * Finds candidate positions for matching.
     * Returns positions that have time overlap with the requested period and have a valid grade.
     * Excludes placeholder rows (personnel_number = '00000000').
     */
    @Query("""
            SELECT p FROM Position p
            WHERE (p.startDate IS NULL OR p.startDate <= :endDate)
              AND (p.endDate IS NULL OR p.endDate >= :startDate)
              AND p.tariffGroup IS NOT NULL AND p.tariffGroup <> ''
              AND (p.personnelNumber IS NULL OR p.personnelNumber <> '00000000')
              AND (:researchGroupId IS NULL OR p.researchGroup.id = :researchGroupId)
            ORDER BY p.tariffGroup, p.startDate
            """)
    List<Position> findCandidatePositions(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("researchGroupId") UUID researchGroupId);

    /**
     * Counts the number of assignments (occupied entries) for a position based on personnel number.
     * Excludes placeholder rows (personnel_number = '00000000').
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
     */
    @Query("""
            SELECT COALESCE(SUM(p.percentage), 0) FROM Position p
            WHERE p.objectId = :objectId
              AND p.personnelNumber IS NOT NULL
              AND p.personnelNumber <> ''
              AND p.personnelNumber <> '00000000'
            """)
    java.math.BigDecimal sumAssignedPercentageByObjectId(@Param("objectId") String objectId);
}
