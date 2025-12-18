package de.tum.cit.aet;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;


@SpringBootTest
class StaffPlanApplicationTests {

    @Autowired
    private ArtemisClientService artemisClientService;

    @Autowired
    private RepositoryFetchingService repositoryFetchingService;

    @Test
    void contextLoads() {
    }

}
