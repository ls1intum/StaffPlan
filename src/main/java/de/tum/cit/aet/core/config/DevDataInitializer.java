package de.tum.cit.aet.core.config;

import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserGroup;
import de.tum.cit.aet.usermanagement.domain.key.UserGroupId;
import de.tum.cit.aet.usermanagement.repository.UserGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import org.jspecify.annotations.NonNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;

/**
 * Initializes test users with their roles for local development.
 * Only runs when the "local" profile is active.
 *
 * <p>Test users defined in README.md:
 * <ul>
 *   <li>admin - admin role</li>
 *   <li>jobmanager - job_manager role</li>
 *   <li>professor - professor role</li>
 *   <li>employee - employee role</li>
 * </ul>
 */
@Component
@Profile("local")
public class DevDataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DevDataInitializer.class);

    private static final Map<String, String> TEST_USERS = Map.of(
            "admin", "admin",
            "jobmanager", "job_manager",
            "professor", "professor",
            "employee", "employee"
    );

    private final UserRepository userRepository;
    private final UserGroupRepository userGroupRepository;

    public DevDataInitializer(UserRepository userRepository, UserGroupRepository userGroupRepository) {
        this.userRepository = userRepository;
        this.userGroupRepository = userGroupRepository;
    }

    @Override
    public void run(@NonNull ApplicationArguments args) {
        log.info("Initializing test users for local development...");

        for (Map.Entry<String, String> entry : TEST_USERS.entrySet()) {
            String username = entry.getKey();
            String role = entry.getValue();
            initializeTestUser(username, role);
        }

        log.info("Test user initialization complete.");
    }

    private void initializeTestUser(String username, String role) {
        User user = userRepository.findByUniversityId(username).orElseGet(() -> {
            User newUser = new User();
            newUser.setUniversityId(username);
            newUser.setEmail(username + "@test.local");
            newUser.setFirstName(capitalize(username));
            newUser.setLastName("User");
            Instant now = Instant.now();
            newUser.setJoinedAt(now);
            newUser.setUpdatedAt(now);
            return userRepository.save(newUser);
        });

        // Check if user already has the role
        boolean hasRole = user.getGroups().stream()
                .anyMatch(g -> g.getId().getRole().equals(role));

        if (!hasRole) {
            UserGroup userGroup = new UserGroup();
            UserGroupId groupId = new UserGroupId();
            groupId.setUserId(user.getId());
            groupId.setRole(role);
            userGroup.setId(groupId);
            userGroup.setUser(user);
            userGroupRepository.save(userGroup);
            log.info("Assigned role '{}' to user '{}'", role, username);
        } else {
            log.debug("User '{}' already has role '{}'", username, role);
        }
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) {
            return str;
        }
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }
}
