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

    @GetMapping
    public ResponseEntity<List<PositionDTO>> getPositions(
            @RequestParam(required = false) UUID researchGroupId) {

        List<PositionDTO> positions;
        if (researchGroupId != null) {
            positions = positionService.getPositionsByResearchGroup(researchGroupId);
        } else {
            // For now, return all positions (research group filtering can be added later)
            positions = positionService.getAllPositions();
        }

        return ResponseEntity.ok(positions);
    }

    @PostMapping("/import")
    public ResponseEntity<Map<String, Object>> importPositions(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "researchGroupId", required = false) UUID researchGroupId) throws IOException {

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
