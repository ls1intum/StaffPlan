# StaffPlan

Strategic Staff and Budget Planning - A web application built with Spring Boot, Angular, and Keycloak.

## Prerequisites

- **Java 25** (required for Spring Boot 4.0)
- **Node.js 24.x** and **npm 11.x** (for Angular client)
- **Docker** and **Docker Compose** (for running services locally)

## Quick Start (Docker)

The fastest way to get started is using Docker Compose, which starts all services (PostgreSQL, Keycloak, Spring Boot server, and Angular client):

```bash
# Start all services
cd docker
docker compose up -d

# Watch logs
docker compose logs -f
```

Services will be available at:
- **Angular App**: http://localhost:5173
- **Spring Boot API**: http://localhost:8080
- **Keycloak Admin Console**: http://localhost:8081/admin

## Development Setup

For active development, run the database and Keycloak in Docker, but run the Spring Boot server and Angular client locally for hot-reloading.

### 1. Start Database and Keycloak

```bash
cd docker
docker compose up -d postgres keycloak
```

Wait for Keycloak to be healthy:
```bash
docker compose ps
```

### 2. Run Spring Boot Server

```bash
# From project root
./gradlew bootRun
```

The server will start at http://localhost:8080

### 3. Run Angular Client

```bash
cd src/main/webapp
npm install
npm start
```

The Angular dev server will start at http://localhost:4200

## Test Users

The following test users are pre-configured in Keycloak:

| Username   | Password   | Role        |
|------------|------------|-------------|
| admin      | admin      | admin       |
| jobmanager | jobmanager | job_manager |
| professor  | professor  | professor   |
| employee   | employee   | employee    |

## Project Structure

```
StaffPlan/
├── docker/                     # Docker configuration
│   ├── docker-compose.yml      # Development compose file
│   ├── keycloak/               # Keycloak realm configuration
│   └── *.Dockerfile            # Service Dockerfiles
├── src/
│   ├── main/
│   │   ├── java/               # Spring Boot application
│   │   ├── resources/          # Configuration and migrations
│   │   └── webapp/             # Angular application
│   └── test/                   # Tests
├── build.gradle                # Gradle build configuration
└── README.md
```

## Configuration

### Application Configuration

Main configuration files:
- `src/main/resources/config/application.yml` - Base configuration
- `src/main/resources/config/application-local.yml` - Local development overrides

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SPRING_DATASOURCE_URL` | PostgreSQL connection URL | `jdbc:postgresql://localhost:5432/staffplan` |
| `SPRING_DATASOURCE_USERNAME` | Database username | `postgres` |
| `SPRING_DATASOURCE_PASSWORD` | Database password | `staffplan` |
| `SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI` | Keycloak issuer URI | `http://localhost:8081/realms/staffplan` |
| `STAFFPLAN_KEYCLOAK_CLIENT_ID` | Keycloak client ID | `staffplan-client` |

## Build Commands

### Backend (Gradle)

```bash
# Run tests
./gradlew test

# Build JAR
./gradlew bootJar

# Check code format
./gradlew spotlessCheck

# Apply code format
./gradlew spotlessApply

# Check style (JavaDoc, etc.)
./gradlew checkstyleMain
```

### Frontend (npm)

```bash
cd src/main/webapp

# Install dependencies
npm install

# Start dev server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## API Documentation

When running the server, OpenAPI documentation is available at:
- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI spec: http://localhost:8080/v3/api-docs

## Keycloak Administration

Access the Keycloak admin console at http://localhost:8081/admin

Admin credentials:
- Username: `admin`
- Password: `admin`

## Troubleshooting

### Keycloak not starting

If Keycloak fails to start, check if PostgreSQL is healthy:
```bash
docker compose ps
docker compose logs postgres
```

### JWT validation errors

Ensure the Keycloak issuer URI matches your configuration. When running in Docker, services use internal hostnames (e.g., `http://keycloak:8081`), while local development uses `http://localhost:8081`.

### CORS errors

CORS is configured to allow requests from:
- http://localhost:4200 (Angular dev server)
- http://localhost:5173 (Docker client)
- http://localhost:8080 (API server)

If you need additional origins, update `staffplan.cors.allowed-origins` in `application.yml`.
