package com.mindspark.service;

import com.google.inject.Inject;
import com.mindspark.model.User;
import com.mindspark.service.dao.DDBBackedUserMetadataDAO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Singleton;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

@Singleton
public class LoginServiceImpl implements LoginService {
    
    private static final Logger logger = LoggerFactory.getLogger(LoginServiceImpl.class);
    
    private final DDBBackedUserMetadataDAO userDAO;
    
    // In-memory user storage for backward compatibility and caching
    // This will be gradually migrated to DynamoDB
    private final Map<String, User> users = new ConcurrentHashMap<>();
    
    @Inject
    public LoginServiceImpl(DDBBackedUserMetadataDAO userDAO) {
        this.userDAO = userDAO;
        initializeTestUsers();
    }
    
    /**
     * Initialize test users for demo purposes
     * These will be stored in both in-memory cache and DynamoDB
     */
    private void initializeTestUsers() {
        // Add demo users that match the original Python backend
        User demoUser = new User("demo", "demo123", 150, 2, "demo@mindspark.com", "Demo User");
        demoUser.setUserId("demo");
        
        User student1User = new User("student1", "password123", 200, 1, "student1@mindspark.com", "Student One");
        student1User.setUserId("student1");
        
        User teacherUser = new User("teacher", "teacher123", 500, 3, "teacher@mindspark.com", "Teacher User");
        teacherUser.setUserId("teacher");
        
        User adminUser = new User("admin", "admin123", 1000, 3, "admin@mindspark.com", "Admin User");
        adminUser.setUserId("admin");
        
        // Store in both in-memory cache and DynamoDB
        users.put("demo", demoUser);
        users.put("student1", student1User);
        users.put("teacher", teacherUser);
        users.put("admin", adminUser);
        
        // Store in DynamoDB
        try {
            userDAO.createUser(demoUser);
            userDAO.createUser(student1User);
            userDAO.createUser(teacherUser);
            userDAO.createUser(adminUser);
            logger.info("Initialized {} test users in DynamoDB", users.size());
        } catch (Exception e) {
            logger.warn("Failed to initialize test users in DynamoDB: {}", e.getMessage());
        }
        
        logger.info("Initialized {} test users", users.size());
    }
    
    @Override
    public User authenticate(String username, String password) {
        if (username == null || password == null) {
            logger.warn("Authentication attempt with null username or password");
            return null;
        }
        
        final String normalized = username.toLowerCase();
        
        // First try to get from DynamoDB
        try {
            User ddbUser = userDAO.getUserByUsername(normalized);
            if (ddbUser != null) {
                logger.info("Authenticated user from DynamoDB: {}", normalized);
                return ddbUser.withoutPassword();
            }
        } catch (Exception e) {
            logger.warn("Failed to retrieve user from DynamoDB: {}", e.getMessage());
        }
        
        // Fallback to in-memory storage
        User existing = users.get(normalized);
        if (existing == null) {
            // Create a new user with default fields
            User newUser = new User();
            newUser.setUserId(normalized); // Use username as userId for consistency
            newUser.setUsername(normalized);
            newUser.setPassword(password);
            newUser.setScore(0);
            newUser.setMathLevel(1);
            
            // Store in both places
            users.put(normalized, newUser);
            try {
                userDAO.createUser(newUser);
                logger.info("Created new user in DynamoDB: {}", normalized);
            } catch (Exception e) {
                logger.warn("Failed to store new user in DynamoDB: {}", e.getMessage());
            }
            
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
        
        final String normalized = username.toLowerCase();
        
        // First try to get from DynamoDB
        try {
            User ddbUser = userDAO.getUserByUsername(normalized);
            if (ddbUser != null) {
                return ddbUser.withoutPassword();
            }
        } catch (Exception e) {
            logger.warn("Failed to retrieve user from DynamoDB: {}", e.getMessage());
        }
        
        // Fallback to in-memory storage
        User user = users.get(normalized);
        return user != null ? user.withoutPassword() : null;
    }
    
    @Override
    public boolean updateUserScore(String username, int score) {
        if (username == null) {
            return false;
        }
        
        final String normalized = username.toLowerCase();
        boolean updated = false;
        
        // Update in DynamoDB
        try {
            User ddbUser = userDAO.getUserByUsername(normalized);
            if (ddbUser != null) {
                ddbUser.setScore(score);
                userDAO.updateUser(ddbUser);
                updated = true;
                logger.info("Updated score in DynamoDB for user {}: {}", username, score);
            }
        } catch (Exception e) {
            logger.warn("Failed to update score in DynamoDB: {}", e.getMessage());
        }
        
        // Update in-memory cache
        User user = users.get(normalized);
        if (user != null) {
            user.setScore(score);
            updated = true;
            logger.info("Updated score in cache for user {}: {}", username, score);
        }
        
        return updated;
    }
    
    @Override
    public boolean updateUserMathLevel(String username, int mathLevel) {
        if (username == null) {
            return false;
        }
        
        final String normalized = username.toLowerCase();
        boolean updated = false;
        
        // Update in DynamoDB
        try {
            User ddbUser = userDAO.getUserByUsername(normalized);
            if (ddbUser != null) {
                ddbUser.setMathLevel(mathLevel);
                userDAO.updateUser(ddbUser);
                updated = true;
                logger.info("Updated math level in DynamoDB for user {}: {}", username, mathLevel);
            }
        } catch (Exception e) {
            logger.warn("Failed to update math level in DynamoDB: {}", e.getMessage());
        }
        
        // Update in-memory cache
        User user = users.get(normalized);
        if (user != null) {
            user.setMathLevel(mathLevel);
            updated = true;
            logger.info("Updated math level in cache for user {}: {}", username, mathLevel);
        }
        
        return updated;
    }
    
    @Override
    public boolean userExists(String username) {
        if (username == null) {
            return false;
        }
        
        final String normalized = username.toLowerCase();
        
        // Check DynamoDB first
        try {
            if (userDAO.userExistsByUsername(normalized)) {
                return true;
            }
        } catch (Exception e) {
            logger.warn("Failed to check user existence in DynamoDB: {}", e.getMessage());
        }
        
        // Fallback to in-memory storage
        return users.containsKey(normalized);
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
        
        final String normalized = username.toLowerCase();
        User newUser = new User(normalized, password, 0, 1, email, fullName);
        newUser.setUserId(normalized);
        
        // Store in both places
        users.put(normalized, newUser);
        try {
            userDAO.createUser(newUser);
            logger.info("Added new user in DynamoDB: {}", username);
        } catch (Exception e) {
            logger.warn("Failed to store new user in DynamoDB: {}", e.getMessage());
        }
        
        logger.info("Added new user: {}", username);
        return true;
    }

    @Override
    public User createOrUpdateUser(User userPayload) {
        if (userPayload == null || userPayload.getUsername() == null) {
            return null;
        }
        
        final String normalized = userPayload.getUsername().toLowerCase();
        
        // Ensure userId is set
        if (userPayload.getUserId() == null) {
            userPayload.setUserId(normalized);
        }
        
        // Check if user exists in DynamoDB
        boolean userExistsInDDB = false;
        try {
            userExistsInDDB = userDAO.userExistsByUsername(userPayload.getUsername());
        } catch (Exception e) {
            logger.warn("Failed to check user existence in DynamoDB: {}", e.getMessage());
        }
        
        if (!userExistsInDDB) {
            // Create new user
            User toStore = new User();
            toStore.setUserId(userPayload.getUserId());
            toStore.setUsername(normalized);
            toStore.setPassword(userPayload.getPassword());
            toStore.setScore(userPayload.getScore() > 0 ? userPayload.getScore() : 0);
            toStore.setMathLevel(userPayload.getMathLevel() > 0 ? userPayload.getMathLevel() : 1);
            toStore.setEmail(userPayload.getEmail());
            toStore.setFullName(userPayload.getFullName());
            
            // Store in DynamoDB
            try {
                userDAO.createUser(toStore);
                logger.info("Created user profile in DynamoDB for: {}", normalized);
            } catch (Exception e) {
                logger.warn("Failed to create user in DynamoDB: {}", e.getMessage());
            }
            
            // Store in cache
            users.put(normalized, toStore);
            return toStore.withoutPassword();
        } else {
            // Update existing user
            try {
                User existingUser = userDAO.getUserByUsername(userPayload.getUsername());
                if (existingUser != null) {
                    // Update selective fields
                    if (userPayload.getPassword() != null) existingUser.setPassword(userPayload.getPassword());
                    if (userPayload.getEmail() != null) existingUser.setEmail(userPayload.getEmail());
                    if (userPayload.getFullName() != null) existingUser.setFullName(userPayload.getFullName());
                    if (userPayload.getMathLevel() > 0) existingUser.setMathLevel(userPayload.getMathLevel());
                    // score is controlled via updateUserScore; do not overwrite unless explicitly set
                    
                    userDAO.updateUser(existingUser);
                    logger.info("Updated user profile in DynamoDB for: {}", normalized);
                    
                    // Update cache
                    users.put(normalized, existingUser);
                    return existingUser.withoutPassword();
                }
            } catch (Exception e) {
                logger.warn("Failed to update user in DynamoDB: {}", e.getMessage());
            }
            
            // Fallback to in-memory update
            User existing = users.get(normalized);
            if (existing != null) {
                if (userPayload.getPassword() != null) existing.setPassword(userPayload.getPassword());
                if (userPayload.getEmail() != null) existing.setEmail(userPayload.getEmail());
                if (userPayload.getFullName() != null) existing.setFullName(userPayload.getFullName());
                if (userPayload.getMathLevel() > 0) existing.setMathLevel(userPayload.getMathLevel());
                logger.info("Updated user profile in cache for: {}", normalized);
                return existing.withoutPassword();
            }
        }
        
        return null;
    }
} 