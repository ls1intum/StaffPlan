package de.tum.cit.aet;

import de.tum.cit.aet.config.TestSecurityConfiguration;
import de.tum.cit.aet.staffplan.domain.GradeValue;
import de.tum.cit.aet.staffplan.repository.GradeValueRepository;
import de.tum.cit.aet.staffplan.repository.PositionRepository;
import de.tum.cit.aet.staffplan.service.PositionFinderService;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.math.BigDecimal;
import java.time.Instant;

@SpringBootTest
@ActiveProfiles("test")
@Import(TestSecurityConfiguration.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public abstract class AbstractIntegrationTest {

    static final PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:17-alpine");

    static {
        postgres.start();
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    protected PositionFinderService positionFinderService;

    @Autowired
    protected PositionRepository positionRepository;

    @Autowired
    protected ResearchGroupRepository researchGroupRepository;

    @Autowired
    protected GradeValueRepository gradeValueRepository;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected UserGroupRepository userGroupRepository;

    @BeforeAll
    void seedGradeValues() {
        if (gradeValueRepository.count() > 0) {
            return;
        }

        createGradeValue("E6", "E", "Entgeltgruppe 6", new BigDecimal("3450.00"), 10);
        createGradeValue("E8", "E", "Entgeltgruppe 8", new BigDecimal("3600.00"), 20);
        createGradeValue("E9", "E", "Entgeltgruppe 9", new BigDecimal("4050.00"), 25);
        createGradeValue("E9A", "E", "Entgeltgruppe 9a", new BigDecimal("4050.00"), 30);
        createGradeValue("E9B", "E", "Entgeltgruppe 9b", new BigDecimal("4050.00"), 35);
        createGradeValue("E10", "E", "Entgeltgruppe 10", new BigDecimal("4350.00"), 40);
        createGradeValue("E11", "E", "Entgeltgruppe 11", new BigDecimal("4550.00"), 50);
        createGradeValue("E12", "E", "Entgeltgruppe 12", new BigDecimal("4750.00"), 60);
        createGradeValue("E13", "E", "Entgeltgruppe 13", new BigDecimal("5600.00"), 70);
        createGradeValue("E14", "E", "Entgeltgruppe 14", new BigDecimal("6000.00"), 80);
        createGradeValue("E15", "E", "Entgeltgruppe 15", new BigDecimal("6550.00"), 90);
        createGradeValue("A13", "A", "Besoldungsgruppe A13", new BigDecimal("5600.00"), 100);
        createGradeValue("A14", "A", "Besoldungsgruppe A14", new BigDecimal("6100.00"), 110);
        createGradeValue("A15", "A", "Besoldungsgruppe A15", new BigDecimal("6900.00"), 120);
        createGradeValue("W2", "W", "W2-Professur", new BigDecimal("7100.00"), 200);
        createGradeValue("W3", "W", "W3-Professur", new BigDecimal("8300.00"), 210);
    }

    private void createGradeValue(String code, String type, String displayName, BigDecimal monthlyValue, int sortOrder) {
        GradeValue gv = new GradeValue();
        gv.setGradeCode(code);
        gv.setGradeType(type);
        gv.setDisplayName(displayName);
        gv.setMonthlyValue(monthlyValue);
        gv.setSortOrder(sortOrder);
        gv.setActive(true);
        gv.setCreatedAt(Instant.now());
        gv.setUpdatedAt(Instant.now());
        gradeValueRepository.save(gv);
    }

    @BeforeEach
    void cleanupBefore() {
        // Delete positions first (they reference research groups)
        positionRepository.deleteAll();

        // Delete user_groups (they reference users)
        userGroupRepository.deleteAll();

        // Clear user references from research groups (head, createdBy, updatedBy)
        researchGroupRepository.findAll().forEach(group -> {
            boolean changed = false;
            if (group.getHead() != null) {
                group.setHead(null);
                changed = true;
            }
            if (group.getCreatedBy() != null) {
                group.setCreatedBy(null);
                changed = true;
            }
            if (group.getUpdatedBy() != null) {
                group.setUpdatedBy(null);
                changed = true;
            }
            if (changed) {
                researchGroupRepository.save(group);
            }
        });

        // Clear research group references from users
        userRepository.findAll().forEach(user -> {
            if (user.getResearchGroup() != null) {
                user.setResearchGroup(null);
                userRepository.save(user);
            }
        });

        // Delete all users
        userRepository.deleteAll();

        // Now safe to delete research groups (aliases deleted via orphanRemoval)
        researchGroupRepository.deleteAll();
    }

    @AfterEach
    void cleanupAfter() {
        TestSecurityConfiguration.clearCurrentUser();
    }

    protected void setCurrentUser(String universityId, String... roles) {
        User user = TestSecurityConfiguration.createTestUser(universityId, roles);
        TestSecurityConfiguration.setCurrentUser(user);
    }

    protected void setAdminUser() {
        setCurrentUser("admin", "admin");
    }

    protected void setJobManagerUser() {
        setCurrentUser("jobmanager", "job_manager");
    }

    protected void setProfessorUser() {
        setCurrentUser("professor", "professor");
    }

    protected void setEmployeeUser() {
        setCurrentUser("employee", "employee");
    }

    protected void setUserWithNoRoles() {
        setCurrentUser("user");
    }
}
