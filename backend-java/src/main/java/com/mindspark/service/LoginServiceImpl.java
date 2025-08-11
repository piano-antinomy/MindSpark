package com.mindspark.service;

import com.mindspark.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Singleton;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

@Singleton
public class LoginServiceImpl implements LoginService {
    
    private static final Logger logger = LoggerFactory.getLogger(LoginServiceImpl.class);
    
    // In-memory user storage (in production, this would be a database)
    private final Map<String, User> users = new ConcurrentHashMap<>();
    
    public LoginServiceImpl() {
        initializeTestUsers();
    }
    
    /**
     * Initialize test users for demo purposes
     */
    private void initializeTestUsers() {
        // Add demo users that match the original Python backend
        users.put("demo", new User("demo", "demo123", 150, 2, "demo@mindspark.com", "Demo User"));
        users.put("student1", new User("student1", "password123", 200, 1, "student1@mindspark.com", "Student One"));
        users.put("teacher", new User("teacher", "teacher123", 500, 3, "teacher@mindspark.com", "Teacher User"));
        users.put("admin", new User("admin", "admin123", 1000, 3, "admin@mindspark.com", "Admin User"));
        
        logger.info("Initialized {} test users", users.size());
    }
    
    @Override
    public User authenticate(String username, String password) {
        if (username == null || password == null) {
            logger.warn("Authentication attempt with null username or password");
            return null;
        }
        
        // Pass-through authentication: if user exists, accept any password; if not, create a dummy user.
        final String normalized = username.toLowerCase();
        User existing = users.get(normalized);
        if (existing == null) {
            // Create a new user with default fields
            User newUser = new User();
            newUser.setUsername(normalized);
            newUser.setPassword(password);
            // default score 0
            newUser.setScore(0);
            // default math level 1 unless we have a better default
            newUser.setMathLevel(1);
            users.put(normalized, newUser);
            logger.info("Pass-through created new user: {}", normalized);
            return newUser.withoutPassword();
        }
        
        logger.info("Pass-through authenticated existing user: {}", normalized);
        return existing.withoutPassword();
    }
    
    @Override
    public User getUserProfile(String username) {
        if (username == null) {
            return null;
        }
        
        User user = users.get(username.toLowerCase());
        return user != null ? user.withoutPassword() : null;
    }
    
    @Override
    public boolean updateUserScore(String username, int score) {
        if (username == null) {
            return false;
        }
        
        User user = users.get(username.toLowerCase());
        if (user != null) {
            user.setScore(score);
            logger.info("Updated score for user {}: {}", username, score);
            return true;
        }
        
        return false;
    }
    
    @Override
    public boolean updateUserMathLevel(String username, int mathLevel) {
        if (username == null) {
            return false;
        }
        
        User user = users.get(username.toLowerCase());
        if (user != null) {
            user.setMathLevel(mathLevel);
            logger.info("Updated math level for user {}: {}", username, mathLevel);
            return true;
        }
        
        return false;
    }
    
    @Override
    public boolean userExists(String username) {
        return username != null && users.containsKey(username.toLowerCase());
    }
    
    /**
     * Get all users (for admin purposes - without passwords)
     */
    public Map<String, User> getAllUsers() {
        Map<String, User> result = new ConcurrentHashMap<>();
        users.forEach((key, user) -> result.put(key, user.withoutPassword()));
        return result;
    }
    
    /**
     * Add a new user (for registration functionality)
     */
    public boolean addUser(String username, String password, String email, String fullName) {
        if (username == null || password == null || userExists(username)) {
            return false;
        }
        
        User newUser = new User(username.toLowerCase(), password, 0, 1, email, fullName);
        users.put(username.toLowerCase(), newUser);
        logger.info("Added new user: {}", username);
        return true;
    }

    @Override
    public User createOrUpdateUser(User userPayload) {
        if (userPayload == null || userPayload.getUsername() == null) {
            return null;
        }
        final String normalized = userPayload.getUsername().toLowerCase();
        User existing = users.get(normalized);

        if (existing == null) {
            User toStore = new User();
            toStore.setUserId(userPayload.getUserId());
            toStore.setUsername(normalized);
            toStore.setPassword(userPayload.getPassword());
            // default score to 0 if null-ish
            toStore.setScore(0);
            // default math level to payload value or 1
            toStore.setMathLevel(userPayload.getMathLevel() > 0 ? userPayload.getMathLevel() : 1);
            toStore.setEmail(userPayload.getEmail());
            toStore.setFullName(userPayload.getFullName());
            users.put(normalized, toStore);
            logger.info("Created user profile for: {}", normalized);
            return toStore.withoutPassword();
        } else {
            // Update existing selective fields
            if (userPayload.getPassword() != null) existing.setPassword(userPayload.getPassword());
            if (userPayload.getEmail() != null) existing.setEmail(userPayload.getEmail());
            if (userPayload.getFullName() != null) existing.setFullName(userPayload.getFullName());
            if (userPayload.getMathLevel() > 0) existing.setMathLevel(userPayload.getMathLevel());
            // score is controlled via updateUserScore; do not overwrite unless explicitly set
            logger.info("Updated user profile for: {}", normalized);
            return existing.withoutPassword();
        }
    }
} 