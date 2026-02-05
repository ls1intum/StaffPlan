package de.tum.cit.aet.usermanagement.repository;

import de.tum.cit.aet.usermanagement.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByUniversityId(String universityId);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.researchGroup LEFT JOIN FETCH u.groups WHERE u.universityId = :universityId")
    Optional<User> findByUniversityIdWithResearchGroup(@Param("universityId") String universityId);

    @Query("""
            SELECT DISTINCT u FROM User u
            LEFT JOIN u.groups g
            WHERE (:search IS NULL OR :search = ''
                   OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(u.universityId) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:role IS NULL OR :role = '' OR g.id.role = :role)
            """)
    Page<User> searchUsers(@Param("search") String search, @Param("role") String role, Pageable pageable);
}
