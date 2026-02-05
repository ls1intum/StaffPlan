package de.tum.cit.aet.core.security;

import de.tum.cit.aet.core.exceptions.AccessDeniedException;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.service.AuthenticationService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.context.WebApplicationContext;

@Component
@Scope(value = WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.TARGET_CLASS)
@RequiredArgsConstructor
public class CurrentUserProvider {

   private final AuthenticationService authenticationService;
   private User cachedUser;

   /**
    * Returns the currently authenticated user.
    *
    * @return the authenticated user
    */
   public User getUser() {
      if (cachedUser == null) {
         Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
         if (authentication instanceof JwtAuthenticationToken jwt) {
            cachedUser = authenticationService.getAuthenticatedUserWithResearchGroup(jwt);
         } else {
            throw new AccessDeniedException("Please login first.");
         }
      }
      return cachedUser;
   }

   public boolean isAnonymous() {
      return getUser().hasNoGroup();
   }

   public boolean isEmployee() {
      return getUser().hasAnyGroup("employee");
   }

   public boolean isProfessor() {
      return getUser().hasAnyGroup("professor");
   }

   public boolean isJobManager() {
      return getUser().hasAnyGroup("job_manager");
   }

   public boolean isAdmin() {
      return getUser().hasAnyGroup("admin");
   }

   public boolean hasAnyRole() {
      return isAdmin() || isJobManager() || isProfessor() || isEmployee();
   }

}
