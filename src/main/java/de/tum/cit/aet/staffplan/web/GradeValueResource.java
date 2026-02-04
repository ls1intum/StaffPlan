package de.tum.cit.aet.staffplan.web;

import de.tum.cit.aet.core.security.CurrentUserProvider;
import de.tum.cit.aet.staffplan.dto.GradeValueDTO;
import de.tum.cit.aet.staffplan.service.GradeValueService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/v2/grade-values")
@RequiredArgsConstructor
public class GradeValueResource {

    private final GradeValueService gradeValueService;
    private final CurrentUserProvider currentUserProvider;

    /**
     * Returns all grade values.
     * Requires one of the roles: admin, job_manager.
     *
     * @param activeOnly if true, returns only active grades
     * @return list of grade values
     */
    @GetMapping
    public ResponseEntity<List<GradeValueDTO>> getGradeValues(
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly) {

        if (!currentUserProvider.isJobManager() && !currentUserProvider.isAdmin()) {
            return ResponseEntity.status(403).build();
        }

        List<GradeValueDTO> gradeValues;
        if (activeOnly) {
            gradeValues = gradeValueService.getActiveGradeValues();
        } else {
            gradeValues = gradeValueService.getAllGradeValues();
        }

        return ResponseEntity.ok(gradeValues);
    }

    /**
     * Returns a single grade value by ID.
     *
     * @param id the grade value ID
     * @return the grade value
     */
    @GetMapping("/{id}")
    public ResponseEntity<GradeValueDTO> getGradeValue(@PathVariable UUID id) {
        if (!currentUserProvider.isJobManager() && !currentUserProvider.isAdmin()) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(gradeValueService.getGradeValue(id));
    }

    /**
     * Returns grades that are currently in use in positions.
     *
     * @return list of grade codes
     */
    @GetMapping("/in-use")
    public ResponseEntity<List<String>> getGradesInUse() {
        if (!currentUserProvider.isJobManager() && !currentUserProvider.isAdmin()) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(gradeValueService.getGradesInUse());
    }

    /**
     * Creates a new grade value.
     * Admin only.
     *
     * @param dto the grade value data
     * @return the created grade value
     */
    @PostMapping
    public ResponseEntity<GradeValueDTO> createGradeValue(@RequestBody GradeValueDTO dto) {
        if (!currentUserProvider.isAdmin()) {
            return ResponseEntity.status(403).build();
        }

        GradeValueDTO created = gradeValueService.createGradeValue(dto);
        return ResponseEntity.created(URI.create("/v2/grade-values/" + created.id())).body(created);
    }

    /**
     * Updates an existing grade value.
     * Admin only.
     *
     * @param id the grade value ID
     * @param dto the updated grade value data
     * @return the updated grade value
     */
    @PutMapping("/{id}")
    public ResponseEntity<GradeValueDTO> updateGradeValue(
            @PathVariable UUID id,
            @RequestBody GradeValueDTO dto) {

        if (!currentUserProvider.isAdmin()) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(gradeValueService.updateGradeValue(id, dto));
    }

    /**
     * Deletes a grade value.
     * Admin only. Cannot delete grades that are in use.
     *
     * @param id the grade value ID
     * @return empty response on success
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGradeValue(@PathVariable UUID id) {
        if (!currentUserProvider.isAdmin()) {
            return ResponseEntity.status(403).build();
        }

        gradeValueService.deleteGradeValue(id);
        return ResponseEntity.noContent().build();
    }
}
