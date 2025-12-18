package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.core.exceptions.ResourceNotFoundException;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserGroup;
import de.tum.cit.aet.usermanagement.domain.key.UserGroupId;
import de.tum.cit.aet.usermanagement.repository.UserGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class AuthenticationService {
    private final UserRepository userRepository;
    private final UserGroupRepository userGroupRepository;

    @Autowired
    public AuthenticationService(UserRepository userRepository, UserGroupRepository userGroupRepository) {
        this.userRepository = userRepository;
        this.userGroupRepository = userGroupRepository;
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

    @Transactional
    public User updateAuthenticatedUser(JwtAuthenticationToken jwt) {
        Map<String, Object> attributes = jwt.getTokenAttributes();
        String universityId = getUniversityId(jwt);

        String email = (String) attributes.get("email");
        String firstName = (String) attributes.get("given_name");
        String lastName = (String) attributes.get("family_name");

        List<String> groups = jwt.getAuthorities().stream()
                .filter(authority -> authority.getAuthority().startsWith("ROLE_"))
                .map(authority -> authority.getAuthority().replace("ROLE_", "")).toList();

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

        userGroupRepository.deleteByUserId(user.getId());

        Set<UserGroup> userGroups = new HashSet<>();

        for (String group : groups) {
            UserGroup entity = new UserGroup();
            UserGroupId entityId = new UserGroupId();

            entityId.setUserId(user.getId());
            entityId.setRole(group);

            entity.setUser(user);
            entity.setId(entityId);

            userGroups.add(userGroupRepository.save(entity));
        }

        user.setGroups(userGroups);

        return userRepository.save(user);
    }
    
    private String getUniversityId(JwtAuthenticationToken jwt) {
        return jwt.getName();
    }
}
