package de.tum.cit.aet.usermanagement.web;

import de.tum.cit.aet.core.security.CurrentUserProvider;
import de.tum.cit.aet.usermanagement.dto.UserDTO;
import de.tum.cit.aet.usermanagement.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v2/users")
@RequiredArgsConstructor
public class UserResource {

    private final UserService userService;
    private final CurrentUserProvider currentUserProvider;

    /**
     * Returns the current authenticated user with their roles.
     *
     * @return the current user DTO
     */
    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser() {
        return ResponseEntity.ok(UserDTO.fromEntity(currentUserProvider.getUser()));
    }

    /**
     * Returns all users. Admin only.
     *
     * @return list of all users
     */
    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        if (!currentUserProvider.isAdmin()) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(userService.getAllUsers());
    }

    /**
     * Updates the roles for a specific user. Admin only.
     *
     * @param id the user ID
     * @param roles the new list of roles
     * @return the updated user DTO
     */
    @PutMapping("/{id}/roles")
    public ResponseEntity<UserDTO> updateUserRoles(
            @PathVariable UUID id,
            @RequestBody List<String> roles) {
        if (!currentUserProvider.isAdmin()) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(userService.updateUserRoles(id, roles));
    }
}
