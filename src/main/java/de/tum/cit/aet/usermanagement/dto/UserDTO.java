package de.tum.cit.aet.usermanagement.dto;

import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserGroup;

import java.util.List;
import java.util.UUID;

public record UserDTO(
        UUID id,
        String universityId,
        String email,
        String firstName,
        String lastName,
        List<String> roles
) {
    /**
     * Creates a UserDTO from a User entity.
     */
    public static UserDTO fromEntity(User user) {
        List<String> roles = user.getGroups().stream()
                .map(group -> group.getId().getRole())
                .sorted()
                .toList();

        return new UserDTO(
                user.getId(),
                user.getUniversityId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                roles
        );
    }
}
