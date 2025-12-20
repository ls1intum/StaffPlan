package de.tum.cit.aet.staffplan.service;

import de.tum.cit.aet.staffplan.domain.Position;
import de.tum.cit.aet.staffplan.dto.PositionDTO;
import de.tum.cit.aet.staffplan.repository.PositionRepository;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PositionService {

    private final PositionRepository positionRepository;

    private static final DateTimeFormatter[] DATE_FORMATTERS = {
            DateTimeFormatter.ofPattern("M/d/yy"),      // US short: 7/16/21
            DateTimeFormatter.ofPattern("M/d/yyyy"),    // US: 7/16/2021
            DateTimeFormatter.ofPattern("MM/dd/yy"),    // US short padded: 07/16/21
            DateTimeFormatter.ofPattern("MM/dd/yyyy"),  // US padded: 07/16/2021
            DateTimeFormatter.ofPattern("dd.MM.yyyy"),  // German: 16.07.2021
            DateTimeFormatter.ofPattern("yyyy-MM-dd"),  // ISO: 2021-07-16
    };

    @Transactional(readOnly = true)
    public List<PositionDTO> getAllPositions() {
        return positionRepository.findAllByOrderByStartDateAsc()
                .stream()
                .map(PositionDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PositionDTO> getPositionsByResearchGroup(UUID researchGroupId) {
        return positionRepository.findByResearchGroupIdOrderByStartDateAsc(researchGroupId)
                .stream()
                .map(PositionDTO::fromEntity)
                .toList();
    }

    @Transactional
    public int importFromCsv(MultipartFile file, ResearchGroup researchGroup) throws IOException {
        List<Position> positions = parseCsvFile(file, researchGroup);
        positionRepository.saveAll(positions);
        log.info("Imported {} positions from CSV", positions.size());
        return positions.size();
    }

    @Transactional
    public void deleteByResearchGroup(UUID researchGroupId) {
        positionRepository.deleteByResearchGroupId(researchGroupId);
        log.info("Deleted positions for research group {}", researchGroupId);
    }

    @Transactional
    public void deleteAll() {
        positionRepository.deleteAll();
        log.info("Deleted all positions");
    }

    private char detectDelimiter(String headerLine) {
        int semicolons = headerLine.length() - headerLine.replace(";", "").length();
        int commas = headerLine.length() - headerLine.replace(",", "").length();
        int tabs = headerLine.length() - headerLine.replace("\t", "").length();

        if (tabs > semicolons && tabs > commas) {
            return '\t';
        }
        if (semicolons > commas) {
            return ';';
        }
        return ',';
    }

    private List<Position> parseCsvFile(MultipartFile file, ResearchGroup researchGroup) throws IOException {
        List<Position> positions = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String headerLine = reader.readLine();
            if (headerLine == null) {
                return positions;
            }

            // Remove BOM if present
            if (headerLine.startsWith("\uFEFF")) {
                headerLine = headerLine.substring(1);
            }

            char delimiter = detectDelimiter(headerLine);
            log.info("Detected CSV delimiter: '{}'", delimiter == '\t' ? "TAB" : String.valueOf(delimiter));

            String[] headers = parseCsvLine(headerLine, delimiter);
            log.info("Found {} CSV headers: {}", headers.length, String.join(", ", headers));

            int[] columnIndices = mapColumnIndices(headers);
            log.info("Column mapping - objectDescription: {}, status: {}, percentage: {}, startDate: {}, endDate: {}",
                    columnIndices[4], columnIndices[2], columnIndices[10], columnIndices[11], columnIndices[12]);

            String line;
            int lineNum = 1;
            while ((line = reader.readLine()) != null) {
                lineNum++;
                if (line.trim().isEmpty()) {
                    continue;
                }

                try {
                    Position position = parsePositionFromLine(line, columnIndices, researchGroup, delimiter);
                    positions.add(position);
                } catch (Exception e) {
                    log.warn("Failed to parse CSV line {}: {}. Error: {}", lineNum, line.substring(0, Math.min(100, line.length())), e.getMessage());
                }
            }
        }

        return positions;
    }

    private String[] parseCsvLine(String line, char delimiter) {
        List<String> fields = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;

        for (char c : line.toCharArray()) {
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == delimiter && !inQuotes) {
                fields.add(current.toString().trim());
                current = new StringBuilder();
            } else {
                current.append(c);
            }
        }
        fields.add(current.toString().trim());

        return fields.toArray(new String[0]);
    }

    private int[] mapColumnIndices(String[] headers) {
        int[] indices = new int[21];
        Arrays.fill(indices, -1);

        for (int i = 0; i < headers.length; i++) {
            String header = headers[i].trim().toLowerCase()
                    .replace("ü", "u")
                    .replace("ä", "a")
                    .replace("ö", "o")
                    .replace("ß", "ss");

            // Match various possible header names
            if (header.contains("stellenplanrelevanz")) {
                indices[0] = i;
            } else if (header.equals("objektid") || header.equals("objekt id") || header.equals("object id")) {
                indices[1] = i;
            } else if (header.equals("sta") || header.equals("status")) {
                indices[2] = i;
            } else if (header.contains("objektkurzel") || header.contains("object code")) {
                indices[3] = i;
            } else if (header.contains("objektbezeichnung") || header.contains("object description") || header.contains("bezeichnung")) {
                indices[4] = i;
            } else if (header.contains("wert stelle") || header.contains("position value")) {
                indices[5] = i;
            } else if (header.equals("department id") || header.equals("departmentid")) {
                indices[6] = i;
            } else if (header.contains("organisationseinheit") || header.contains("organization")) {
                indices[7] = i;
            } else if (header.contains("trfgr") || header.contains("tariff")) {
                indices[8] = i;
            } else if (header.contains("bsgrd") || header.contains("base grade")) {
                indices[9] = i;
            } else if (header.contains("prozt") || header.contains("prozent") || header.contains("percentage") || header.equals("%")) {
                indices[10] = i;
            } else if (header.contains("beginn") || header.equals("start") || header.equals("start date") || header.contains("start_date")) {
                indices[11] = i;
            } else if (header.contains("ende") || header.equals("end") || header.equals("end date") || header.contains("end_date")) {
                indices[12] = i;
            } else if (header.equals("fonds") || header.equals("fund")) {
                indices[13] = i;
            } else if (header.equals("department id2") || header.equals("departmentid2")) {
                indices[14] = i;
            } else if (header.contains("persnr") || header.contains("personnel")) {
                indices[15] = i;
            } else if (header.contains("mitarbeitergruppe") || header.contains("employee group")) {
                indices[16] = i;
            } else if (header.contains("mitarbeiterkreis") || header.contains("employee circle")) {
                indices[17] = i;
            } else if (header.contains("eintrittsdatum") || header.contains("entry date")) {
                indices[18] = i;
            } else if (header.contains("voraussichtlicher austritt") || header.contains("expected exit")) {
                indices[19] = i;
            }

            if (indices[4] == i || indices[2] == i || indices[10] == i || indices[11] == i || indices[12] == i) {
                log.info("Mapped header '{}' (index {}) to column {}", headers[i], i,
                    indices[4] == i ? "objectDescription" :
                    indices[2] == i ? "status" :
                    indices[10] == i ? "percentage" :
                    indices[11] == i ? "startDate" : "endDate");
            }
        }

        return indices;
    }

    private Position parsePositionFromLine(String line, int[] columnIndices, ResearchGroup researchGroup, char delimiter) {
        String[] values = parseCsvLine(line, delimiter);
        Position position = new Position();

        position.setPositionRelevanceType(getValueOrNull(values, columnIndices[0]));
        position.setObjectId(getValueOrNull(values, columnIndices[1]));
        position.setStatus(getValueOrNull(values, columnIndices[2]));
        position.setObjectCode(getValueOrNull(values, columnIndices[3]));
        position.setObjectDescription(getValueOrNull(values, columnIndices[4]));
        position.setPositionValue(parseDecimal(getValueOrNull(values, columnIndices[5])));
        position.setDepartmentId(getValueOrNull(values, columnIndices[6]));
        position.setOrganizationUnit(getValueOrNull(values, columnIndices[7]));
        position.setTariffGroup(getValueOrNull(values, columnIndices[8]));
        position.setBaseGrade(getValueOrNull(values, columnIndices[9]));
        position.setPercentage(parseDecimal(getValueOrNull(values, columnIndices[10])));
        position.setStartDate(parseDate(getValueOrNull(values, columnIndices[11])));
        position.setEndDate(parseDate(getValueOrNull(values, columnIndices[12])));
        position.setFund(getValueOrNull(values, columnIndices[13]));
        position.setDepartmentId2(getValueOrNull(values, columnIndices[14]));
        position.setPersonnelNumber(getValueOrNull(values, columnIndices[15]));
        position.setEmployeeGroup(getValueOrNull(values, columnIndices[16]));
        position.setEmployeeCircle(getValueOrNull(values, columnIndices[17]));
        position.setEntryDate(parseDate(getValueOrNull(values, columnIndices[18])));
        position.setExpectedExitDate(parseDate(getValueOrNull(values, columnIndices[19])));
        position.setResearchGroup(researchGroup);

        return position;
    }

    private String getValueOrNull(String[] values, int index) {
        if (index < 0 || index >= values.length) {
            return null;
        }
        String value = values[index].trim();
        return value.isEmpty() ? null : value;
    }

    private BigDecimal parseDecimal(String value) {
        if (value == null || value.isEmpty()) {
            return null;
        }
        try {
            String normalized = value.replace(",", ".");
            return new BigDecimal(normalized);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isEmpty()) {
            return null;
        }

        for (DateTimeFormatter formatter : DATE_FORMATTERS) {
            try {
                LocalDate date = LocalDate.parse(value, formatter);
                // Handle 2-digit years: 00-30 -> 2000-2030, 31-99 -> 1931-1999
                if (date.getYear() < 100) {
                    int year = date.getYear();
                    date = date.withYear(year <= 30 ? 2000 + year : 1900 + year);
                }
                return date;
            } catch (DateTimeParseException ignored) {
                // Try next formatter
            }
        }

        log.warn("Could not parse date: {}", value);
        return null;
    }
}
