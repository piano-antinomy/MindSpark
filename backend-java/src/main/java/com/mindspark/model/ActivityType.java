package com.mindspark.model;

/**
 * Enum representing different types of user activities
 */
public enum ActivityType {
    USER_REGISTRATION("user_registration"),
    START_QUIZ("start_quiz"),
    COMPLETE_QUIZ("complete_quiz"),
    UPDATE_AVATAR("update_avatar"),
    UPDATE_USERNAME("update_username"),
    LOGIN("login"),
    LOGOUT("logout"),
    ACHIEVEMENT_UNLOCKED("achievement_unlocked");
    
    private final String value;
    
    ActivityType(String value) {
        this.value = value;
    }
    
    public String getValue() {
        return value;
    }
    
    @Override
    public String toString() {
        return value;
    }
    
    /**
     * Get ActivityType from string value
     * @param value the string value
     * @return ActivityType or null if not found
     */
    public static ActivityType fromValue(String value) {
        for (ActivityType type : ActivityType.values()) {
            if (type.value.equals(value)) {
                return type;
            }
        }
        return null;
    }
}
