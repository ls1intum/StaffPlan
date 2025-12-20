package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.core.config.StaffPlanProperties;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserGroup;
import de.tum.cit.aet.usermanagement.domain.key.UserGroupId;
import de.tum.cit.aet.usermanagement.repository.UserGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@Service
public class AuthenticationService {
    private final UserRepository userRepository;
    private final UserGroupRepository userGroupRepository;
    private final StaffPlanProperties staffPlanProperties;

    @Autowired
    public AuthenticationService(UserRepository userRepository, UserGroupRepository userGroupRepository, StaffPlanProperties staffPlanProperties) {
        this.userRepository = userRepository;
        this.userGroupRepository = userGroupRepository;
        this.staffPlanProperties = staffPlanProperties;
    }

    @Transactional
    public User getAuthenticatedUser(JwtAuthenticationToken jwt) {
        return userRepository.findByUniversityId(getUniversityId(jwt))
                .orElseGet(() -> updateAuthenticatedUser(jwt));
    }

    @Transactional
    public User getAuthenticatedUserWithResearchGroup(JwtAuthenticationToken jwt) {
        return userRepository.findByUniversityIdWithResearchGroup(getUniversityId(jwt))
                .orElseGet(() -> updateAuthenticatedUser(jwt));
    }

    /**
     * Creates the authenticated user from JWT token data on first login.
     * Updates basic profile info but preserves existing roles.
     *
     * @param jwt the JWT authentication token
     * @return the created or existing user
     */
    @Transactional
    public User updateAuthenticatedUser(JwtAuthenticationToken jwt) {
        Map<String, Object> attributes = jwt.getTokenAttributes();
        String universityId = getUniversityId(jwt);

        String email = (String) attributes.get("email");
        String firstName = (String) attributes.get("given_name");
        String lastName = (String) attributes.get("family_name");

        boolean isNewUser = userRepository.findByUniversityId(universityId).isEmpty();

        User user = userRepository.findByUniversityId(universityId).orElseGet(() -> {
            User newUser = new User();
            Instant currentTime = Instant.now();

            newUser.setJoinedAt(currentTime);
            newUser.setUpdatedAt(currentTime);

            return newUser;
        });

        user.setUniversityId(universityId);

        if (email != null && !email.isEmpty()) {
            user.setEmail(email);
        }

        if (firstName != null && !firstName.isEmpty()) {
            user.setFirstName(firstName);
        }

        if (lastName != null && !lastName.isEmpty()) {
            user.setLastName(lastName);
        }

        user = userRepository.save(user);

        // Only assign initial admin role for new users
        if (isNewUser) {
            String initialAdmin = staffPlanProperties.getInitialAdmin();
            if (initialAdmin != null && !initialAdmin.isEmpty() && universityId.equals(initialAdmin)) {
                UserGroup adminGroup = new UserGroup();
                UserGroupId adminGroupId = new UserGroupId();
                adminGroupId.setUserId(user.getId());
                adminGroupId.setRole("admin");
                adminGroup.setUser(user);
                adminGroup.setId(adminGroupId);
                userGroupRepository.save(adminGroup);

                Set<UserGroup> groups = new HashSet<>();
                groups.add(adminGroup);
                user.setGroups(groups);
            }
        }

        return user;
    }

    private String getUniversityId(JwtAuthenticationToken jwt) {
        return jwt.getName();
    }
}
