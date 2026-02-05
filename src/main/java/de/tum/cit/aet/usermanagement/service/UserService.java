package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.core.exceptions.ResourceNotFoundException;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserGroup;
import de.tum.cit.aet.usermanagement.domain.key.UserGroupId;
import de.tum.cit.aet.usermanagement.dto.UserDTO;
import de.tum.cit.aet.usermanagement.repository.UserGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final UserGroupRepository userGroupRepository;

    /**
     * Searches users with pagination and optional filters.
     *
     * @param search optional search term for name, email, or university ID
     * @param role optional role filter
     * @param pageable pagination parameters
     * @return page of matching users
     */
    public Page<UserDTO> searchUsers(String search, String role, Pageable pageable) {
        return userRepository.searchUsers(search, role, pageable)
                .map(UserDTO::fromEntity);
    }

    /**
     * Updates the roles for a specific user.
     *
     * @param userId the user ID
     * @param roles the new list of roles
     * @return the updated user DTO
     */
    public UserDTO updateUserRoles(UUID userId, List<String> roles) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Delete existing roles
        userGroupRepository.deleteByUserId(userId);

        // Create new roles
        Set<UserGroup> userGroups = new HashSet<>();
        for (String role : roles) {
            UserGroup group = new UserGroup();
            UserGroupId groupId = new UserGroupId();
            groupId.setUserId(userId);
            groupId.setRole(role);
            group.setId(groupId);
            group.setUser(user);
            userGroups.add(userGroupRepository.save(group));
        }

        user.setGroups(userGroups);
        user = userRepository.save(user);

        return UserDTO.fromEntity(user);
    }
}
