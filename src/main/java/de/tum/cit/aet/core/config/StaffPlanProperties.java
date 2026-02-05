package de.tum.cit.aet.core.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

@Setter
@Getter
@Component
@ConfigurationProperties(prefix = "staffplan")
public class StaffPlanProperties {

    private String user;
    private String password;
    private String initialAdmin;
    private Cors cors = new Cors();

    @Setter
    @Getter
    public static class Cors {
        private List<String> allowedOrigins;
    }
}
