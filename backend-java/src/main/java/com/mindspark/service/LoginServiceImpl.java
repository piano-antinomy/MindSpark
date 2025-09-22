package com.mindspark.service;

import com.google.inject.Inject;
import com.mindspark.config.LocalMode;
import com.mindspark.model.User;
import com.mindspark.service.dao.EnhancedUserDAO;
import com.mindspark.util.TestUserUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Singleton;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

@Singleton
public class LoginServiceImpl implements LoginService {
    
    private static final Logger logger = LoggerFactory.getLogger(LoginServiceImpl.class);
    
    private final EnhancedUserDAO userDAO;
    
    // In-memory user storage for backward compatibility and caching
    // This will be gradually migrated to DynamoDB
    private final Map<String, User> users = new ConcurrentHashMap<>();
    
    @Inject
    public LoginServiceImpl(
        @LocalMode final Boolean isLocalMode,
        EnhancedUserDAO userDAO) {
        this.userDAO = userDAO;
        // only initialize test users in local env
        if (isLocalMode) {
            initializeTestUsers();
        }
    }
    
    /**
     * Initialize test users for demo purposes
     * These will be stored in both in-memory cache and DynamoDB
     */
    private void initializeTestUsers() {
        List<User> testUsers = TestUserUtils.generateTestUsers();
        int successCount = 0;
        int failureCount = 0;
        
        logger.info("Starting to initialize {} test users", testUsers.size());
        
        // Store in both in-memory cache and DynamoDB
        for (User user : testUsers) {
            users.put(user.getUserId(), user);
            
            try {
                userDAO.createUser(user);
                successCount++;
                logger.debug("Successfully created user {} in DynamoDB", user.getUserId());
            } catch (Exception e) {
                failureCount++;
                logger.error("Failed to create user {} in DynamoDB: {}", user.getUserId(), e.getMessage(), e);
            }
        }
        
        logger.info("Initialized {} test users in DynamoDB ({} success, {} failures)", testUsers.size(), successCount, failureCount);
        logger.info("Initialized {} test users in cache", users.size());
    }
    
    @Override
    public User authenticate(String username, String password) {
        if (username == null || password == null) {
            logger.warn("Authentication attempt with null username or password");
            return null;
        }
        
        return null;
    }
    
    @Override
    public User getUserProfile(String userId) {
        if (userId == null) {
            return null;
        }
        
        // First try to get from DynamoDB
        try {
            User ddbUser = userDAO.getUser(userId);
            if (ddbUser != null) {
                return ddbUser.copy();
            }
        } catch (Exception e) {
            logger.warn("Failed to retrieve user from DynamoDB: {}", e.getMessage());
        }
        
        // Fallback to in-memory storage
        User user = users.get(userId);
        return user != null ? user.copy() : null;
    }
    
    @Override
    public boolean updateUserScore(String userId, int score) {
        if (userId == null) {
            return false;
        }

        boolean updated = false;
        // Update in DynamoDB
        try {
            User ddbUser = userDAO.getUser(userId);
            if (ddbUser != null) {
                ddbUser.setScore(score);
                userDAO.updateUser(ddbUser);
                updated = true;
                logger.info("Updated score in DynamoDB for user {}: {}", userId, score);
            }
        } catch (Exception e) {
            logger.warn("Failed to update score in DynamoDB: {}", e.getMessage());
        }
        
        // Update in-memory cache
        User user = users.get(userId);
        if (user != null) {
            user.setScore(score);
            updated = true;
            logger.info("Updated score in cache for user {}: {}", userId, score);
        }
        
        return updated;
    }
    
    @Override
    public boolean updateUserMathLevel(String userId, int mathLevel) {
        if (userId == null) {
            return false;
        }

        boolean updated = false;
        
        // Update in DynamoDB
        try {
            User ddbUser = userDAO.getUser(userId);
            if (ddbUser != null) {
                ddbUser.setMathLevel(mathLevel);
                userDAO.updateUser(ddbUser);
                updated = true;
                logger.info("Updated math level in DynamoDB for user {}: {}", userId, mathLevel);
            }
        } catch (Exception e) {
            logger.warn("Failed to update math level in DynamoDB: {}", e.getMessage());
        }
        
        // Update in-memory cache
        User user = users.get(userId);
        if (user != null) {
            user.setMathLevel(mathLevel);
            updated = true;
            logger.info("Updated math level in cache for user {}: {}", userId, mathLevel);
        }
        
        return updated;
    }

    @Override
    public boolean userExists(String userId) {
        return users.containsKey(userId);
    }

    /**
     * Get all users (for admin purposes - without passwords)
     */
    @Override
    public List<User> getAllUsers() {
        return userDAO.getAllUsers();
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
            userExistsInDDB = userDAO.getUser(userPayload.getUserId()) != null;
        } catch (Exception e) {
            logger.warn("Failed to check user existence in DynamoDB: {}", e.getMessage());
        }
        
        if (!userExistsInDDB) {
            // Create new user
            User toStore = new User();
            toStore.setUserId(userPayload.getUserId());
            toStore.setUsername(normalized);
            toStore.setScore(userPayload.getScore() > 0 ? userPayload.getScore() : 0);
            toStore.setMathLevel(userPayload.getMathLevel() > 0 ? userPayload.getMathLevel() : 1);
            toStore.setAvatarLink(userPayload.getAvatarLink());
            
            // Store in DynamoDB
            try {
                userDAO.createUser(toStore);
                logger.info("Created user profile in DynamoDB for: {}", normalized);
            } catch (Exception e) {
                logger.warn("Failed to create user in DynamoDB: {}", e.getMessage());
            }
            
            // Store in cache
            users.put(normalized, toStore);
            return toStore.copy();
        } else {
            // Update existing user
            try {
                User existingUser = userDAO.getUser(userPayload.getUserId());
                if (existingUser != null) {
                    // Update selective fields
                    if (userPayload.getAvatarLink() != null) existingUser.setAvatarLink(userPayload.getAvatarLink());
                    if (userPayload.getMathLevel() > 0) existingUser.setMathLevel(userPayload.getMathLevel());
                    // score is controlled via updateUserScore; do not overwrite unless explicitly set
                    
                    userDAO.updateUser(existingUser);
                    logger.info("Updated user profile in DynamoDB for: {}", normalized);
                    
                    // Update cache
                    users.put(normalized, existingUser);
                    return existingUser.copy();
                }
            } catch (Exception e) {
                logger.warn("Failed to update user in DynamoDB: {}", e.getMessage());
            }
            
            // Fallback to in-memory update
            User existing = users.get(normalized);
            if (existing != null) {
                if (userPayload.getAvatarLink() != null) existing.setAvatarLink(userPayload.getAvatarLink());
                if (userPayload.getMathLevel() > 0) existing.setMathLevel(userPayload.getMathLevel());
                logger.info("Updated user profile in cache for: {}", normalized);
                return existing.copy();
            }
        }
        
        return null;
    }
} 