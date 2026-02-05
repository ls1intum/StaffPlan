package de.tum.cit.aet.staffplan.service;

import de.tum.cit.aet.staffplan.domain.GradeValue;
import de.tum.cit.aet.staffplan.dto.GradeValueDTO;
import de.tum.cit.aet.staffplan.repository.GradeValueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class GradeValueService {

    private final GradeValueRepository gradeValueRepository;

    /**
     * Returns all grade values ordered by sort order.
     *
     * @return ordered grade values with usage flags
     */
    public List<GradeValueDTO> getAllGradeValues() {
        Set<String> gradesInUse = new HashSet<>(gradeValueRepository.findGradesInUse());
        return gradeValueRepository.findAllByOrderBySortOrderAsc()
                .stream()
                .map(gv -> GradeValueDTO.fromEntity(gv, gradesInUse.contains(gv.getGradeCode())))
                .toList();
    }

    /**
     * Returns only active grade values.
     *
     * @return active grade values ordered by sort order
     */
    public List<GradeValueDTO> getActiveGradeValues() {
        return gradeValueRepository.findByActiveTrueOrderBySortOrderAsc()
                .stream()
                .map(GradeValueDTO::fromEntity)
                .toList();
    }

    /**
     * Returns a grade value by ID.
     *
     * @param id the grade value ID
     * @return the grade value
     */
    public GradeValueDTO getGradeValue(UUID id) {
        GradeValue gradeValue = gradeValueRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Grade value not found: " + id));
        Set<String> gradesInUse = new HashSet<>(gradeValueRepository.findGradesInUse());
        return GradeValueDTO.fromEntity(gradeValue, gradesInUse.contains(gradeValue.getGradeCode()));
    }

    /**
     * Returns grades that are currently used in positions.
     *
     * @return distinct base grades in use
     */
    public List<String> getGradesInUse() {
        return gradeValueRepository.findGradesInUse();
    }

    /**
     * Creates a new grade value.
     *
     * @param dto the grade value payload
     * @return the created grade value
     */
    public GradeValueDTO createGradeValue(GradeValueDTO dto) {
        if (gradeValueRepository.existsByGradeCode(dto.gradeCode())) {
            throw new IllegalArgumentException("Grade code already exists: " + dto.gradeCode());
        }

        GradeValue gradeValue = new GradeValue();
        updateEntityFromDto(gradeValue, dto);
        gradeValue = gradeValueRepository.save(gradeValue);
        log.info("Created grade value: {}", gradeValue.getGradeCode());
        return GradeValueDTO.fromEntity(gradeValue);
    }

    /**
     * Updates an existing grade value.
     *
     * @param id  the grade value ID
     * @param dto the grade value payload
     * @return the updated grade value
     */
    public GradeValueDTO updateGradeValue(UUID id, GradeValueDTO dto) {
        GradeValue gradeValue = gradeValueRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Grade value not found: " + id));

        // Check if grade code is being changed to an existing one
        if (!gradeValue.getGradeCode().equals(dto.gradeCode())
                && gradeValueRepository.existsByGradeCode(dto.gradeCode())) {
            throw new IllegalArgumentException("Grade code already exists: " + dto.gradeCode());
        }

        updateEntityFromDto(gradeValue, dto);
        gradeValue = gradeValueRepository.save(gradeValue);
        log.info("Updated grade value: {}", gradeValue.getGradeCode());
        return GradeValueDTO.fromEntity(gradeValue);
    }

    /**
     * Deletes a grade value.
     *
     * @param id the grade value ID
     */
    public void deleteGradeValue(UUID id) {
        GradeValue gradeValue = gradeValueRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Grade value not found: " + id));

        // Check if grade is in use
        Set<String> gradesInUse = new HashSet<>(gradeValueRepository.findGradesInUse());
        if (gradesInUse.contains(gradeValue.getGradeCode())) {
            throw new IllegalArgumentException("Cannot delete grade value that is in use: " + gradeValue.getGradeCode());
        }

        gradeValueRepository.delete(gradeValue);
        log.info("Deleted grade value: {}", gradeValue.getGradeCode());
    }

    private void updateEntityFromDto(GradeValue entity, GradeValueDTO dto) {
        entity.setGradeCode(dto.gradeCode());
        entity.setGradeType(dto.gradeType());
        entity.setDisplayName(dto.displayName());
        entity.setMonthlyValue(dto.monthlyValue());
        entity.setMinSalary(dto.minSalary());
        entity.setMaxSalary(dto.maxSalary());
        entity.setSortOrder(dto.sortOrder());
        if (dto.active() != null) {
            entity.setActive(dto.active());
        }
    }
}
