package de.tum.cit.aet.usermanagement.web;

import de.tum.cit.aet.AbstractRestIntegrationTest;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("Research Group REST API Tests")
class ResearchGroupResourceTest extends AbstractRestIntegrationTest {

    private static final String BASE_URL = "/v2/research-groups";
    private static final String IMPORT_URL = "/v2/research-groups/import";

    private ResearchGroup machineLearningGroup;
    private ResearchGroup computerVisionGroup;

    @BeforeEach
    void setupTestData() {
        setAdminUser();
        machineLearningGroup = createResearchGroup("Machine Learning", "I-ML", "Computer Science");
        computerVisionGroup = createResearchGroup("Computer Vision", "I-CV", "Computer Science");
    }

    private ResearchGroup createResearchGroup(String name, String abbreviation, String department) {
        ResearchGroup group = new ResearchGroup();
        group.setName(name);
        group.setAbbreviation(abbreviation);
        group.setDepartment(department);
        return researchGroupRepository.save(group);
    }

    @Nested
    @DisplayName("GET /v2/research-groups - Authorization Tests")
    class GetResearchGroupsAuthorizationTests {

        @Test
        @DisplayName("Admin can get all research groups")
        void getResearchGroups_asAdmin_returnsAll() throws Exception {
            setAdminUser();

            get(BASE_URL)
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(2))));
        }

        @Test
        @DisplayName("Job manager gets 403 forbidden")
        void getResearchGroups_asJobManager_returns403() throws Exception {
            setJobManagerUser();

            get(BASE_URL)
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Professor gets 403 forbidden")
        void getResearchGroups_asProfessor_returns403() throws Exception {
            setProfessorUser();

            get(BASE_URL)
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Employee gets 403 forbidden")
        void getResearchGroups_asEmployee_returns403() throws Exception {
            setEmployeeUser();

            get(BASE_URL)
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("User without role gets 403 forbidden")
        void getResearchGroups_withoutRole_returns403() throws Exception {
            setUserWithNoRoles();

            get(BASE_URL)
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("GET /v2/research-groups - Search Tests")
    class GetResearchGroupsSearchTests {

        @Test
        @DisplayName("Search by name")
        void getResearchGroups_searchByName() throws Exception {
            setAdminUser();

            get(BASE_URL + "?search=Machine")
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));
        }

        @Test
        @DisplayName("Search by abbreviation")
        void getResearchGroups_searchByAbbreviation() throws Exception {
            setAdminUser();

            get(BASE_URL + "?search=I-CV")
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));
        }

        @Test
        @DisplayName("Search with no results")
        void getResearchGroups_searchNoResults() throws Exception {
            setAdminUser();

            get(BASE_URL + "?search=NonExistentXYZ123")
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$", hasSize(0)));
        }
    }

    @Nested
    @DisplayName("GET /v2/research-groups/{id} - Tests")
    class GetSingleResearchGroupTests {

        @Test
        @DisplayName("Admin can get single research group")
        void getResearchGroup_asAdmin_returnsGroup() throws Exception {
            setAdminUser();

            get(BASE_URL + "/" + machineLearningGroup.getId())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(machineLearningGroup.getId().toString()))
                    .andExpect(jsonPath("$.name").value("Machine Learning"))
                    .andExpect(jsonPath("$.abbreviation").value("I-ML"));
        }

        @Test
        @DisplayName("Non-existent ID throws exception")
        void getResearchGroup_notFound_throwsException() {
            setAdminUser();

            // ResourceNotFoundException is thrown but not handled globally
            assertThrows(Exception.class, () -> get(BASE_URL + "/" + UUID.randomUUID()));
        }

        @Test
        @DisplayName("Professor gets 403 forbidden")
        void getResearchGroup_asProfessor_returns403() throws Exception {
            setProfessorUser();

            get(BASE_URL + "/" + machineLearningGroup.getId())
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("GET /v2/research-groups/without-head - Tests")
    class GetResearchGroupsWithoutHeadTests {

        @Test
        @DisplayName("Admin can get research groups without head")
        void getResearchGroupsWithoutHead_asAdmin() throws Exception {
            setAdminUser();

            get(BASE_URL + "/without-head")
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray());
        }

        @Test
        @DisplayName("Professor gets 403 forbidden")
        void getResearchGroupsWithoutHead_asProfessor_returns403() throws Exception {
            setProfessorUser();

            get(BASE_URL + "/without-head")
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("POST /v2/research-groups - Create Tests")
    class CreateResearchGroupTests {

        @Test
        @DisplayName("Admin can create research group")
        void createResearchGroup_asAdmin_succeeds() throws Exception {
            setAdminUser();

            ResearchGroupDTO newGroup = new ResearchGroupDTO(
                    null,
                    "Database Systems",
                    "I-DBS",
                    "Research in database systems",
                    null,
                    null,
                    "Computer Science",
                    null,
                    null,
                    null,
                    null,
                    false,
                    null,
                    false,
                    null,
                    List.of(),
                    0,
                    null,
                    null
            );

            postJson(BASE_URL, newGroup)
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").exists())
                    .andExpect(jsonPath("$.name").value("Database Systems"))
                    .andExpect(jsonPath("$.abbreviation").value("I-DBS"));
        }

        @Test
        @DisplayName("Job manager gets 403 forbidden")
        void createResearchGroup_asJobManager_returns403() throws Exception {
            setJobManagerUser();

            ResearchGroupDTO newGroup = new ResearchGroupDTO(
                    null, "Test Group", "T-GRP", null, null, null, "Test Dept",
                    null, null, null, null, false, null, false, null, List.of(), 0, null, null
            );

            postJson(BASE_URL, newGroup)
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Professor gets 403 forbidden")
        void createResearchGroup_asProfessor_returns403() throws Exception {
            setProfessorUser();

            ResearchGroupDTO newGroup = new ResearchGroupDTO(
                    null, "Test Group", "T-GRP", null, null, null, "Test Dept",
                    null, null, null, null, false, null, false, null, List.of(), 0, null, null
            );

            postJson(BASE_URL, newGroup)
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("PUT /v2/research-groups/{id} - Update Tests")
    class UpdateResearchGroupTests {

        @Test
        @DisplayName("Admin can update research group")
        void updateResearchGroup_asAdmin_succeeds() throws Exception {
            setAdminUser();

            ResearchGroupDTO updateDto = new ResearchGroupDTO(
                    machineLearningGroup.getId(),
                    "Machine Learning Updated",
                    "I-ML",
                    "Updated description",
                    null,
                    null,
                    "Computer Science",
                    null,
                    null,
                    null,
                    null,
                    false,
                    null,
                    false,
                    null,
                    List.of(),
                    0,
                    null,
                    null
            );

            putJson(BASE_URL + "/" + machineLearningGroup.getId(), updateDto)
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("Machine Learning Updated"))
                    .andExpect(jsonPath("$.description").value("Updated description"));
        }

        @Test
        @DisplayName("Job manager gets 403 forbidden")
        void updateResearchGroup_asJobManager_returns403() throws Exception {
            setJobManagerUser();

            ResearchGroupDTO updateDto = new ResearchGroupDTO(
                    machineLearningGroup.getId(), "Updated", "I-ML", null, null, null, "CS",
                    null, null, null, null, false, null, false, null, List.of(), 0, null, null
            );

            putJson(BASE_URL + "/" + machineLearningGroup.getId(), updateDto)
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("DELETE /v2/research-groups/{id} - Archive Tests")
    class ArchiveResearchGroupTests {

        @Test
        @DisplayName("Job manager gets 403 forbidden")
        void archiveResearchGroup_asJobManager_returns403() throws Exception {
            setJobManagerUser();

            delete(BASE_URL + "/" + machineLearningGroup.getId())
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Professor gets 403 forbidden")
        void archiveResearchGroup_asProfessor_returns403() throws Exception {
            setProfessorUser();

            delete(BASE_URL + "/" + machineLearningGroup.getId())
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("DELETE /v2/research-groups - Delete All Tests")
    class DeleteAllResearchGroupsTests {

        @Test
        @DisplayName("Job manager gets 403 forbidden")
        void deleteAllResearchGroups_asJobManager_returns403() throws Exception {
            setJobManagerUser();

            delete(BASE_URL)
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("POST /v2/research-groups/import - CSV Import Tests")
    class ImportResearchGroupsTests {

        private static final String CSV_CONTENT = """
                firstName,lastName,groupName,abbreviation,department,email,login
                Maria,Schneider,Machine Learning New,I-MLN,Computer Science,maria.schneider@tum.de,ml52sch
                Thomas,Weber,Computer Vision New,I-CVN,Computer Science,thomas.weber@tum.de,cv38web
                """;

        @Test
        @DisplayName("Admin can import research groups")
        void importResearchGroups_asAdmin_succeeds() throws Exception {
            setAdminUser();

            uploadFile(IMPORT_URL, "file", "research-groups.csv", CSV_CONTENT)
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.created").isNumber())
                    .andExpect(jsonPath("$.updated").isNumber())
                    .andExpect(jsonPath("$.skipped").isNumber())
                    .andExpect(jsonPath("$.errors").isArray())
                    .andExpect(jsonPath("$.warnings").isArray());
        }

        @Test
        @DisplayName("Job manager gets 403 forbidden")
        void importResearchGroups_asJobManager_returns403() throws Exception {
            setJobManagerUser();

            uploadFile(IMPORT_URL, "file", "research-groups.csv", CSV_CONTENT)
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Professor gets 403 forbidden")
        void importResearchGroups_asProfessor_returns403() throws Exception {
            setProfessorUser();

            uploadFile(IMPORT_URL, "file", "research-groups.csv", CSV_CONTENT)
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("POST /v2/research-groups/batch-assign-positions - Tests")
    class BatchAssignPositionsTests {

        @Test
        @DisplayName("Admin can batch assign positions")
        void batchAssignPositions_asAdmin_succeeds() throws Exception {
            setAdminUser();

            postJson(BASE_URL + "/batch-assign-positions", null)
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.matched").isMap())
                    .andExpect(jsonPath("$.unmatchedOrgUnits").isArray());
        }

        @Test
        @DisplayName("Professor gets 403 forbidden")
        void batchAssignPositions_asProfessor_returns403() throws Exception {
            setProfessorUser();

            postJson(BASE_URL + "/batch-assign-positions", null)
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("Response Structure Tests")
    class ResponseStructureTests {

        @Test
        @DisplayName("Research group response contains all expected fields")
        void researchGroupResponse_containsAllFields() throws Exception {
            setAdminUser();

            get(BASE_URL + "/" + machineLearningGroup.getId())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").exists())
                    .andExpect(jsonPath("$.name").exists())
                    .andExpect(jsonPath("$.abbreviation").exists())
                    .andExpect(jsonPath("$.department").exists())
                    .andExpect(jsonPath("$.archived").isBoolean())
                    .andExpect(jsonPath("$.positionCount").isNumber())
                    .andExpect(jsonPath("$.aliases").isArray());
        }
    }
}
