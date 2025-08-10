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
        
        User user = users.get(username.toLowerCase());
        if (user != null && user.getPassword().equals(password)) {
            logger.info("Successful authentication for user: {}", username);
            return user.withoutPassword(); // Return user without password
        }
        
        logger.warn("Failed authentication attempt for user: {}", username);
        return null;
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
} 