package com.mindspark.util;

/**
 * Utility class for calculating achievement levels based on points
 */
public class AchievementUtils {
    
    // Achievement level thresholds (same as frontend)
    private static final int[] ACHIEVEMENT_THRESHOLDS = {
        0,   // Number Nibbler (0-1)
        2,   // Counting Kid (2-9)
        10,  // Math Explorer (10-19)
        20,  // Addition Adventurer (20-39)
        40,  // Subtraction Sorcerer (40-59)
        60,  // Multiplication Hero (60-79)
        80,  // Division Detective (80-99)
        100, // Fraction Master (100-149)
        150, // Algebra Ace (150-199)
        200  // Number Scientist (200+)
    };
    
    private static final String[] ACHIEVEMENT_LABELS = {
        "🍼 Number Nibbler",
        "🐣 Counting Kid", 
        "🦄 Math Explorer",
        "🚀 Addition Adventurer",
        "🧙 Subtraction Sorcerer",
        "🦸 Multiplication Hero",
        "🧩 Division Detective",
        "🏆 Fraction Master",
        "🧠 Algebra Ace",
        "🔬 Number Scientist"
    };
    
    /**
     * Get the achievement level (0-9) based on points
     * @param points the user's total points
     * @return achievement level (0-9)
     */
    public static int getAchievementLevel(int points) {
        for (int i = ACHIEVEMENT_THRESHOLDS.length - 1; i >= 0; i--) {
            if (points >= ACHIEVEMENT_THRESHOLDS[i]) {
                return i;
            }
        }
        return 0; // Default to first level
    }
    
    /**
     * Get the achievement label based on points
     * @param points the user's total points
     * @return achievement label string
     */
    public static String getAchievementLabel(int points) {
        int level = getAchievementLevel(points);
        return ACHIEVEMENT_LABELS[level];
    }
    
    /**
     * Get the next achievement level
     * @param currentPoints the user's current points
     * @return next achievement level (0-9), or -1 if already at max level
     */
    public static int getNextAchievementLevel(int currentPoints) {
        int currentLevel = getAchievementLevel(currentPoints);
        if (currentLevel >= ACHIEVEMENT_LABELS.length - 1) {
            return -1; // Already at max level
        }
        return currentLevel + 1;
    }
    
    /**
     * Get points needed to reach the next achievement level
     * @param currentPoints the user's current points
     * @return points needed for next level, or 0 if already at max level
     */
    public static int getPointsToNextAchievement(int currentPoints) {
        int nextLevel = getNextAchievementLevel(currentPoints);
        if (nextLevel == -1) {
            return 0; // Already at max level
        }
        return ACHIEVEMENT_THRESHOLDS[nextLevel] - currentPoints;
    }
    
    /**
     * Check if the user has unlocked a new achievement level
     * @param oldPoints the user's previous points
     * @param newPoints the user's new points
     * @return true if a new achievement level was unlocked
     */
    public static boolean hasUnlockedNewAchievement(int oldPoints, int newPoints) {
        int oldLevel = getAchievementLevel(oldPoints);
        int newLevel = getAchievementLevel(newPoints);
        return newLevel > oldLevel;
    }
    
    /**
     * Get the newly unlocked achievement level
     * @param oldPoints the user's previous points
     * @param newPoints the user's new points
     * @return the newly unlocked achievement level, or -1 if no new level unlocked
     */
    public static int getNewlyUnlockedAchievementLevel(int oldPoints, int newPoints) {
        int oldLevel = getAchievementLevel(oldPoints);
        int newLevel = getAchievementLevel(newPoints);
        if (newLevel > oldLevel) {
            return newLevel;
        }
        return -1;
    }
    
    /**
     * Get the achievement label for a specific level
     * @param level the achievement level (0-9)
     * @return achievement label string
     */
    public static String getAchievementLabelForLevel(int level) {
        if (level >= 0 && level < ACHIEVEMENT_LABELS.length) {
            return ACHIEVEMENT_LABELS[level];
        }
        return ACHIEVEMENT_LABELS[0]; // Default to first level
    }
}
