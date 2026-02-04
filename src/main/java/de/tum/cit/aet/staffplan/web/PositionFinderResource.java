package de.tum.cit.aet.staffplan.web;

import de.tum.cit.aet.core.security.CurrentUserProvider;
import de.tum.cit.aet.staffplan.dto.PositionFinderRequestDTO;
import de.tum.cit.aet.staffplan.dto.PositionFinderResponseDTO;
import de.tum.cit.aet.staffplan.service.PositionFinderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/v2/position-finder")
@RequiredArgsConstructor
public class PositionFinderResource {

    private final PositionFinderService positionFinderService;
    private final CurrentUserProvider currentUserProvider;

    /**
     * Searches for positions matching the given criteria.
     * Requires one of the roles: admin, job_manager.
     *
     * @param request the search criteria
     * @return matching positions with scores
     */
    @PostMapping("/search")
    public ResponseEntity<PositionFinderResponseDTO> searchPositions(
            @RequestBody PositionFinderRequestDTO request) {

        if (!currentUserProvider.isJobManager() && !currentUserProvider.isAdmin()) {
            return ResponseEntity.status(403).build();
        }

        log.info("Position finder search: grade={}, percentage={}%, dates={} to {}",
                request.employeeGrade(),
                request.fillPercentageOrDefault(),
                request.startDate(),
                request.endDate());

        PositionFinderResponseDTO response = positionFinderService.findPositions(request);

        return ResponseEntity.ok(response);
    }
}
