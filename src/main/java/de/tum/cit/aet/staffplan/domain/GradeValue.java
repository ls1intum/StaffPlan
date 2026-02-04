package de.tum.cit.aet.staffplan.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Represents a salary grade (Stellenwertigkeit) with its monetary value.
 * Used for budget calculations when matching employees to positions.
 */
@Getter
@Setter
@Entity
@Table(name = "grade_values")
public class GradeValue {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "grade_value_id", nullable = false)
    private UUID id;

    @Column(name = "grade_code", unique = true, nullable = false, length = 20)
    private String gradeCode;

    @Column(name = "grade_type", length = 10)
    private String gradeType;

    @Column(name = "display_name", length = 100)
    private String displayName;

    @Column(name = "monthly_value", precision = 10, scale = 2)
    private BigDecimal monthlyValue;

    @Column(name = "min_salary", precision = 10, scale = 2)
    private BigDecimal minSalary;

    @Column(name = "max_salary", precision = 10, scale = 2)
    private BigDecimal maxSalary;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "active", nullable = false)
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
