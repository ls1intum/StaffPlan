package de.tum.cit.aet.util;

import java.util.ArrayList;
import java.util.List;

/**
 * Shared utility for CSV parsing operations.
 * Provides common functionality for detecting delimiters and parsing CSV lines.
 */
public final class CsvParser {

    private CsvParser() {
        // Utility class, prevent instantiation
    }

    /**
     * Detects the delimiter used in a CSV header line.
     * Supports tab, semicolon, and comma delimiters.
     *
     * @param headerLine the first line of the CSV file
     * @return the detected delimiter character
     */
    public static char detectDelimiter(String headerLine) {
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

    /**
     * Parses a single CSV line into an array of trimmed field values.
     * Handles quoted fields containing the delimiter character.
     *
     * @param line the CSV line to parse
     * @param delimiter the delimiter character
     * @return an array of trimmed field values
     */
    public static String[] parseLine(String line, char delimiter) {
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

    /**
     * Strips a UTF-8 BOM (Byte Order Mark) from the beginning of a string if present.
     *
     * @param line the string to process
     * @return the string without BOM prefix
     */
    public static String stripBom(String line) {
        if (line != null && line.startsWith("\uFEFF")) {
            return line.substring(1);
        }
        return line;
    }
}
