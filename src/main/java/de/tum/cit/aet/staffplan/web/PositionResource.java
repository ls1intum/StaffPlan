package de.tum.cit.aet.staffplan.web;

import de.tum.cit.aet.core.security.CurrentUserProvider;
import de.tum.cit.aet.staffplan.dto.PositionDTO;
import de.tum.cit.aet.staffplan.service.PositionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/v2/positions")
@RequiredArgsConstructor
public class PositionResource {

    private final PositionService positionService;
    private final CurrentUserProvider currentUserProvider;

    /**
     * Returns all positions, optionally filtered by research group.
     * Requires one of the roles: admin, job_manager, professor, or employee.
     * Professors and employees only see positions from their own research group.
     *
     * @param researchGroupId optional research group ID to filter by
     * @return list of positions
     */
    @GetMapping
    public ResponseEntity<List<PositionDTO>> getPositions(
            @RequestParam(required = false) UUID researchGroupId) {

        if (!currentUserProvider.hasAnyRole()) {
            return ResponseEntity.status(403).build();
        }

        List<PositionDTO> positions;

        // Professors and employees can only see their own research group's positions
        if ((currentUserProvider.isProfessor() || currentUserProvider.isEmployee())
                && !currentUserProvider.isAdmin() && !currentUserProvider.isJobManager()) {
            var userResearchGroup = currentUserProvider.getUser().getResearchGroup();
            if (userResearchGroup == null) {
                // User has no research group assigned, return empty list
                return ResponseEntity.ok(List.of());
            }
            positions = positionService.getPositionsByResearchGroup(userResearchGroup.getId());
        } else if (researchGroupId != null) {
            positions = positionService.getPositionsByResearchGroup(researchGroupId);
        } else {
            positions = positionService.getAllPositions();
        }

        return ResponseEntity.ok(positions);
    }

    /**
     * Imports positions from a CSV file.
     *
     * @param file the CSV file to import
     * @return import result with count of imported positions
     * @throws IOException if file reading fails
     */
    @PostMapping("/import")
    public ResponseEntity<Map<String, Object>> importPositions(
            @RequestParam("file") MultipartFile file) throws IOException {

        if (!currentUserProvider.isJobManager() && !currentUserProvider.isAdmin()) {
            return ResponseEntity.status(403)
                    .body(Map.of("error", "Only job managers and admins can import positions"));
        }

        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Please upload a CSV file"));
        }

        // For now, import positions without research group (can be added later)
        int count = positionService.importFromCsv(file, null);

        return ResponseEntity.ok(Map.of(
                "message", "Successfully imported positions",
                "count", count
        ));
    }

    /**
     * Deletes positions, optionally filtered by research group.
     *
     * @param researchGroupId optional research group ID to filter by
     * @return empty response on success
     */
    @DeleteMapping
    public ResponseEntity<Void> deletePositions(
            @RequestParam(required = false) UUID researchGroupId) {

        if (!currentUserProvider.isJobManager() && !currentUserProvider.isAdmin()) {
            return ResponseEntity.status(403).build();
        }

        if (researchGroupId != null) {
            positionService.deleteByResearchGroup(researchGroupId);
        } else {
            // Job managers and admins can delete all positions
            positionService.deleteAll();
        }

        return ResponseEntity.noContent().build();
    }
}
