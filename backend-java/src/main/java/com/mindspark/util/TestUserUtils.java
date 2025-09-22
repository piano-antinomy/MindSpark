package com.mindspark.util;

import com.mindspark.model.User;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Utility class for generating test users for development and testing purposes
 */
public class TestUserUtils {
    
    private static final String[] FIRST_NAMES = {
        "Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry",
        "Ivy", "Jack", "Kate", "Liam", "Maya", "Noah", "Olivia", "Paul",
        "Quinn", "Rachel", "Sam", "Tina", "Uma", "Victor", "Wendy", "Xavier",
        "Yara", "Zoe", "Alex", "Blake", "Casey", "Drew", "Emery", "Finley",
        "Gabriel", "Harper", "Isaac", "Jade", "Kai", "Luna", "Mason", "Nora",
        "Owen", "Piper", "Quinn", "Ruby", "Sebastian", "Tessa", "Uriah", "Violet"
    };
    
    private static final String[] LAST_NAMES = {
        "Anderson", "Brown", "Clark", "Davis", "Evans", "Foster", "Garcia", "Harris",
        "Johnson", "King", "Lee", "Miller", "Nelson", "O'Connor", "Parker", "Quinn",
        "Roberts", "Smith", "Taylor", "Underwood", "Vargas", "Williams", "Xu", "Young",
        "Zhang", "Adams", "Baker", "Carter", "Diaz", "Edwards", "Flores", "Green",
        "Hall", "Jackson", "Kim", "Lopez", "Martinez", "Nguyen", "Perez", "Reed",
        "Scott", "Thompson", "White", "Wilson", "Wright", "Yang", "Zhou", "Chen"
    };
    
    private static final String[] MATH_LEVELS = {"1", "2", "3"};
    private static final Random random = new Random();
    
    /**
     * Generates a list of 50 test users with varied attributes
     * @return List of User objects for testing
     */
    public static List<User> generateTestUsers() {
        List<User> testUsers = new ArrayList<>();
        
        // Add the original demo users first
        testUsers.addAll(getOriginalDemoUsers());
        
        // Generate additional users to reach 50 total
        int remainingUsers = 50 - testUsers.size();
        for (int i = 0; i < remainingUsers; i++) {
            testUsers.add(generateRandomUser(i + 1));
        }
        
        return testUsers;
    }
    
    /**
     * Returns the original demo users that were hardcoded
     */
    private static List<User> getOriginalDemoUsers() {
        List<User> originalUsers = new ArrayList<>();
        
        User demoUser = new User("demo", 150, 2, "1");
        demoUser.setUserId("demo");
        originalUsers.add(demoUser);
        
        User student1User = new User("Charles_Liu", 200, 1, "1");
        student1User.setUserId("student1");
        originalUsers.add(student1User);
        
        User student2User = new User("MathWolf", 200, 1, "1");
        student2User.setUserId("student2");
        originalUsers.add(student2User);
        
        User student3User = new User("BecauseIamHappy", 200, 1, "1");
        student3User.setUserId("student3");
        originalUsers.add(student3User);
        
        User teacherUser = new User("Wenyue_Zhang", 500, 3, "1");
        teacherUser.setUserId("teacher");
        originalUsers.add(teacherUser);
        
        User adminUser = new User("admin", 1000, 3, "1");
        adminUser.setUserId("admin");
        originalUsers.add(adminUser);
        
        return originalUsers;
    }
    
    /**
     * Generates a random user with realistic attributes
     */
    private static User generateRandomUser(int index) {
        String firstName = FIRST_NAMES[random.nextInt(FIRST_NAMES.length)];
        String lastName = LAST_NAMES[random.nextInt(LAST_NAMES.length)];
        String username = firstName.toLowerCase() + "_" + lastName.toLowerCase() + index;
        
        // Generate varied scores and math levels
        int score = random.nextInt(1000) + 50; // Score between 50-1050
        int mathLevel = random.nextInt(3) + 1; // Math level 1-3
        
        User user = new User(username, score, mathLevel, "1");
        user.setUserId(username);
        
        return user;
    }
}
