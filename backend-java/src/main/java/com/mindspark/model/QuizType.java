package com.mindspark.model;

/**
 * Enum representing the different types of quizzes available in the system
 */
public enum QuizType {
    STANDARD_AMC("standardAMC", "Standard AMC Quiz"),
    PERSONALIZED("personalized", "Personalized Quiz");
    
    private final String value;
    private final String displayName;
    
    QuizType(String value, String displayName) {
        this.value = value;
        this.displayName = displayName;
    }
    
    public String getValue() {
        return value;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    /**
     * Get QuizType by its string value
     * @param value the string value to match
     * @return the corresponding QuizType, or null if not found
     */
    public static QuizType fromValue(String value) {
        for (QuizType type : values()) {
            if (type.value.equals(value)) {
                return type;
            }
        }
        return null;
    }
    
    /**
     * Check if a string value is a valid quiz type
     * @param value the string value to validate
     * @return true if valid, false otherwise
     */
    public static boolean isValid(String value) {
        return fromValue(value) != null;
    }
}
