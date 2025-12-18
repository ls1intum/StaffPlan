package de.tum.cit.aet.core.security;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.annotation.Validated;

@Data
@Validated
@Configuration
@ConfigurationProperties(prefix = "staffplan.keycloak")
public class JwtAuthConfig {
    @NotBlank
    private String clientId;
}
