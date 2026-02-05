package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;

@Service
public class AuthenticationService {
    private final UserRepository userRepository;
    private final ProfessorLoginMatchingService professorLoginMatchingService;

    @Autowired
    public AuthenticationService(UserRepository userRepository, ProfessorLoginMatchingService professorLoginMatchingService) {
        this.userRepository = userRepository;
        this.professorLoginMatchingService = professorLoginMatchingService;
    }

    /**
     * Gets the authenticated user with research group eagerly loaded.
     *
     * @param jwt the JWT authentication token
     * @return the authenticated user with research group
     */
    public User getAuthenticatedUserWithResearchGroup(JwtAuthenticationToken jwt) {
        User user = updateAuthenticatedUser(jwt);
        // Re-fetch with research group to ensure it's loaded
        return userRepository.findByUniversityIdWithResearchGroup(user.getUniversityId())
                .orElse(user);
    }

    /**
     * Creates or updates the authenticated user from JWT token data.
     * Updates basic profile info (email, name) but preserves existing roles.
     * Roles are managed separately in the database, not synced from Keycloak.
     *
     * @param jwt the JWT authentication token
     * @return the created or updated user
     */
    public User updateAuthenticatedUser(JwtAuthenticationToken jwt) {
        Map<String, Object> attributes = jwt.getTokenAttributes();
        String universityId = getUniversityId(jwt);

        String email = (String) attributes.get("email");
        String firstName = (String) attributes.get("given_name");
        String lastName = (String) attributes.get("family_name");

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

        // Update last login timestamp
        user.setLastLoginAt(Instant.now());

        User savedUser = userRepository.save(user);

        // Try to match professor to their research group
        professorLoginMatchingService.matchProfessorToResearchGroup(savedUser);

        return savedUser;
    }

    private String getUniversityId(JwtAuthenticationToken jwt) {
        return jwt.getName();
    }
}
