package de.tum.cit.aet.staffplan.domain;

import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "positions")
public class Position {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "position_id", nullable = false)
    private UUID id;

    @Column(name = "position_relevance_type")
    private String positionRelevanceType;

    @Column(name = "object_id")
    private String objectId;

    @Column(name = "status", length = 50)
    private String status;

    @Column(name = "object_code", length = 100)
    private String objectCode;

    @Column(name = "object_description", length = 500)
    private String objectDescription;

    @Column(name = "position_value", precision = 10, scale = 2)
    private BigDecimal positionValue;

    @Column(name = "department_id", length = 100)
    private String departmentId;

    @Column(name = "organization_unit")
    private String organizationUnit;

    @Column(name = "tariff_group", length = 50)
    private String tariffGroup;

    @Column(name = "base_grade", length = 50)
    private String baseGrade;

    @Column(name = "percentage", precision = 5, scale = 2)
    private BigDecimal percentage;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "fund", length = 100)
    private String fund;

    @Column(name = "department_id_2", length = 100)
    private String departmentId2;

    @Column(name = "personnel_number", length = 50)
    private String personnelNumber;

    @Column(name = "employee_group", length = 100)
    private String employeeGroup;

    @Column(name = "employee_circle", length = 100)
    private String employeeCircle;

    @Column(name = "entry_date")
    private LocalDate entryDate;

    @Column(name = "expected_exit_date")
    private LocalDate expectedExitDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "research_group_id")
    private ResearchGroup researchGroup;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
