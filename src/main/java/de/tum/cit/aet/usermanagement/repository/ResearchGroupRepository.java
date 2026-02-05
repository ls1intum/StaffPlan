package de.tum.cit.aet.usermanagement.repository;

import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ResearchGroupRepository extends JpaRepository<ResearchGroup, UUID> {

    Optional<ResearchGroup> findByName(String name);

    Optional<ResearchGroup> findByAbbreviation(String abbreviation);

    List<ResearchGroup> findAllByArchivedFalseOrderByNameAsc();

    @Query("SELECT rg FROM ResearchGroup rg WHERE rg.archived = false AND LOWER(rg.professorLastName) = LOWER(:lastName) AND LOWER(rg.professorFirstName) = LOWER(:firstName)")
    Optional<ResearchGroup> findByProfessorNameIgnoreCase(@Param("firstName") String firstName, @Param("lastName") String lastName);

    @Query("SELECT rg FROM ResearchGroup rg WHERE rg.archived = false AND rg.professorUniversityId = :universityId AND rg.head IS NULL")
    Optional<ResearchGroup> findByProfessorUniversityIdAndHeadIsNull(@Param("universityId") String universityId);

    @Query("SELECT rg FROM ResearchGroup rg WHERE rg.archived = false AND LOWER(rg.professorEmail) = LOWER(:email) AND rg.head IS NULL")
    Optional<ResearchGroup> findByProfessorEmailIgnoreCaseAndHeadIsNull(@Param("email") String email);

    @Query("SELECT rg FROM ResearchGroup rg LEFT JOIN FETCH rg.aliases LEFT JOIN FETCH rg.head WHERE rg.id = :id")
    Optional<ResearchGroup> findByIdWithAliases(@Param("id") UUID id);

    @Query("SELECT DISTINCT rg FROM ResearchGroup rg LEFT JOIN FETCH rg.aliases LEFT JOIN FETCH rg.head WHERE rg.archived = false ORDER BY rg.name")
    List<ResearchGroup> findAllWithAliasesNotArchived();

    @Query("SELECT DISTINCT rg FROM ResearchGroup rg LEFT JOIN FETCH rg.aliases WHERE rg.head IS NULL AND rg.archived = false ORDER BY rg.name")
    List<ResearchGroup> findByHeadIsNullWithAliases();

    @Query("""
            SELECT DISTINCT rg FROM ResearchGroup rg
            LEFT JOIN FETCH rg.aliases
            LEFT JOIN FETCH rg.head h
            WHERE rg.archived = false
              AND (:search IS NULL OR :search = ''
                   OR LOWER(rg.name) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(rg.abbreviation) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(rg.professorFirstName) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(rg.professorLastName) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(rg.professorEmail) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(rg.professorUniversityId) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(rg.department) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(h.firstName) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(h.lastName) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(h.email) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(h.universityId) LIKE LOWER(CONCAT('%', :search, '%')))
            ORDER BY rg.name
            """)
    List<ResearchGroup> searchWithAliases(@Param("search") String search);

    @Query("""
            SELECT COUNT(p) FROM Position p
            WHERE p.researchGroup.id = :researchGroupId
            """)
    int countPositionsByResearchGroupId(@Param("researchGroupId") UUID researchGroupId);

    boolean existsByName(String name);

    boolean existsByAbbreviation(String abbreviation);

    boolean existsByHeadId(UUID headId);
}
