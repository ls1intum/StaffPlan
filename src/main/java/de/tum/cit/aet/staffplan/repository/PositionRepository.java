package de.tum.cit.aet.staffplan.repository;

import de.tum.cit.aet.staffplan.domain.Position;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PositionRepository extends JpaRepository<Position, UUID> {

    List<Position> findByResearchGroupId(UUID researchGroupId);

    List<Position> findByResearchGroupIdOrderByStartDateAsc(UUID researchGroupId);

    List<Position> findAllByOrderByStartDateAsc();

    void deleteByResearchGroupId(UUID researchGroupId);
}
