# StaffPlan Code Review TODO

## Critical Issues

- [x] **C1**: Deploy workflow references non-existent `image-tag` input — `.github/workflows/deploy.yml`
- [x] **C2**: `deleteByResearchGroupId()` missing `@Transactional` — `PositionRepository.java:53`
- [x] **C3**: `inject(PLATFORM_ID)` called inside async `onInit()` — `security-store.service.ts:38`

## High Priority Issues

- [x] **H1**: No `@ControllerAdvice` — unhandled exceptions return 500 with stack traces
- [x] **H2**: Custom `AccessDeniedException` doesn't extend Spring's — won't trigger 403 via Spring Security
- [x] **H3**: N+1 query in `ResearchGroupService.getAllResearchGroups()` and `searchResearchGroups()`
- [ ] **H4**: `User.groups` uses `FetchType.EAGER` — should be LAZY with JOIN FETCH where needed
- [ ] **H5**: Non-atomic destructive operations — `deleteAll()` and `deleteUser()` lack transactions
- [x] **H6**: Client tests (Vitest) not run in CI — `.github/workflows/test.yml`
- [x] **H7**: Test security config bypasses Spring Security entirely — `TestSecurityConfiguration.java`
- [x] **H8**: Deprecated `CanActivate` class-based guards — `auth.guard.ts`, `admin.guard.ts`, `job-manager.guard.ts`
- [x] **H9**: No error feedback to user when position loading fails — `positions-page.component.ts`

## Medium Priority Issues

### Security
- [ ] **M1**: No rate limiting on any API endpoint
- [ ] **M2**: No `@Valid` on `@RequestBody` parameters in controllers (`GradeValueResource`, `ResearchGroupResource`, `PositionFinderResource`)
- [ ] **M3**: Actuator endpoints publicly exposed through nginx — `nginx.conf`
- [x] **M4**: Server Dockerfile runs as root — `docker/server.Dockerfile`
- [ ] **M5**: `DELETE /v2/positions` without `researchGroupId` deletes ALL positions — `PositionResource.java`
- [ ] **M6**: No page size limit on `UserResource.getAllUsers()` — `UserResource.java`
- [x] **M7**: Stale security matchers for non-existent paths — `WebSecurityConfig.java`
- [x] **M8**: GET endpoints for research groups are `permitAll()` but controller requires admin — `WebSecurityConfig.java`
- [ ] **M9**: No file size/type validation on CSV upload endpoints
- [ ] **M10**: Direct Access Grants (ROPC) enabled in Keycloak client — `staffplan-realm.json`
- [ ] **M11**: Authorization logic duplicated in controllers instead of using `@PreAuthorize`

### Reliability
- [ ] **M12**: Inconsistent timestamp type in Liquibase migration 005 (`timestamp` vs `TIMESTAMP WITH TIME ZONE`)
- [x] **M13**: Missing unique constraint on `users.university_id`
- [x] **M14**: H2 vs PostgreSQL dialect mismatch in tests — should use Testcontainers
- [ ] **M15**: No manual approval gate between staging and production deployment
- [x] **M16**: Fragile exception-based test assertions using `assertThrows(Exception.class, ...)`
- [ ] **M17**: No service layer unit tests — only integration tests exist
- [ ] **M18**: Keycloak brute force threshold too high (`failureFactor: 30`)
- [ ] **M19**: Excessively long session timeouts (30 days idle)
- [ ] **M20**: `sslRequired: "none"` in Keycloak realm JSON

### Performance
- [x] **M21**: Repeated `gradeValueRepository.findByGradeCode()` lookups in `PositionFinderService` loops
- [x] **M22**: `isFormValid()` methods called in templates on every change detection cycle
- [ ] **M23**: `hasChanges()`/`hasRole()` methods called per-row in admin users table
- [ ] **M24**: `PositionService.importFromCsv()` loads entire CSV into memory

### UX
- [x] **M25**: No wildcard/404 route — blank page on bad URLs
- [x] **M26**: HTML `lang="en"` but UI is German — wrong screen reader pronunciation
- [ ] **M27**: No loading indicator on grade values table refresh
- [ ] **M28**: Landing page redirects users without roles to `/positions` causing potential loops
- [ ] **M29**: Missing ARIA labels on navigation elements
- [ ] **M30**: Upload success/error messages persist indefinitely
- [x] **M31**: `window.location.reload()` in admin users component

### Maintainability
- [x] **M32**: `::ng-deep` used in 7+ places (deprecated)
- [x] **M33**: Template-driven forms used everywhere (conventions say reactive forms)
- [ ] **M34**: Inconsistent signal vs plain field usage for dialog state
- [x] **M35**: Duplicate CSV parsing logic across `PositionService` and `ResearchGroupService`
- [x] **M36**: `application.yml` contains unrelated `artemis` configuration block
- [ ] **M37**: `effect()` with `allowSignalWrites: true` in Gantt component
- [ ] **M38**: Potential `LazyInitializationException` in `ResearchGroupDTO.fromEntity()` accessing lazy `head`
- [ ] **M39**: `BudgetEfficiencyRule.evaluate()` potential division by zero

## Low Priority Issues

- [ ] **L1**: CSV parser doesn't handle escaped quotes (RFC 4180)
- [ ] **L2**: 2-digit year boundary (30) too close to current year for future dates
- [ ] **L3**: Logging PII (emails, usernames) at INFO level
- [ ] **L4**: `SessionAuthenticationStrategy` bean unnecessary for stateless JWT — `WebSecurityConfig.java`
- [ ] **L5**: `AuthenticationService` uses `@Autowired` instead of `@RequiredArgsConstructor`
- [ ] **L6**: `experimentalDecorators` in tsconfig not needed for Angular 21
- [ ] **L7**: Hardcoded color values instead of PrimeNG CSS variables
- [x] **L8**: `.DS_Store` files committed to repository
- [ ] **L9**: No JaCoCo coverage threshold enforced
- [ ] **L10**: `npm install` instead of `npm ci` in CI workflows
- [ ] **L11**: Gradle version mismatch in `check-server-start.yml` (9.2.0 vs 9.3.1)
- [ ] **L12**: Build workflow `paths-ignore` has incorrect relative paths (`../../docs-github/**`)
- [ ] **L13**: `buildDir` deprecation warning in `build.gradle`
- [ ] **L14**: CORS `allowedHeaders` permits all (`*`)
- [ ] **L15**: `ABBREVIATION_PATTERN` only matches uppercase abbreviations
- [ ] **L16**: Levenshtein distance implementation uses full matrix (could use 2 rows)
- [ ] **L17**: Missing `type="button"` on header buttons
- [ ] **L18**: No responsive breakpoints for Gantt chart or admin tables
- [ ] **L19**: `today` signal in Gantt component never updates after midnight
- [ ] **L20**: DST-unsafe date calculations in Gantt component
- [ ] **L21**: Missing `aria-live` region for dynamic filter stats
- [ ] **L22**: `PositionFinderResource` injects `PositionRepository` directly (bypasses service layer)
- [ ] **L23**: App defines custom CSS properties that overlap with PrimeNG theme variables
- [ ] **L24**: Inconsistent use of `ngOnInit` vs constructor for data loading
- [ ] **L25**: `KeycloakServiceConfig` lacks `@Validated` unlike `JwtAuthConfig`
- [ ] **L26**: Date parsing 2-digit year logic in `PositionService`
- [ ] **L27**: Missing test for admin archive research group success case
- [ ] **L28**: Production Docker Compose missing health check timeout/start_period
- [ ] **L29**: No resource limits on Docker containers
- [ ] **L30**: `PositionFinderService.generateCombinations()` could be slow with large datasets

## Completed

- [x] **Removed unused code** (19 items across 13 files) — repository methods, domain methods, DTO methods, config properties, TypeScript interfaces, service methods, CSS classes
