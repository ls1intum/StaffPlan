package de.tum.cit.aet.staffplan.repository;

import de.tum.cit.aet.staffplan.domain.GradeValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GradeValueRepository extends JpaRepository<GradeValue, UUID> {

    Optional<GradeValue> findByGradeCode(String gradeCode);

    List<GradeValue> findByActiveTrue();

    List<GradeValue> findAllByOrderBySortOrderAsc();

    List<GradeValue> findByActiveTrueOrderBySortOrderAsc();

    boolean existsByGradeCode(String gradeCode);

    /**
     * Returns all distinct base grades currently used in positions.
     */
    @Query("SELECT DISTINCT p.baseGrade FROM Position p WHERE p.baseGrade IS NOT NULL")
    List<String> findGradesInUse();
}
