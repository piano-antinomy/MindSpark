package com.mindspark.service;

import com.google.inject.Inject;
import com.mindspark.config.LocalMode;
import com.mindspark.model.ActivityType;
import com.mindspark.model.User;
import com.mindspark.service.dao.EnhancedUserDAO;
import com.mindspark.util.AchievementUtils;
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
            // Add user registration activity for test users
            String currentTimestamp = java.time.Instant.now().toString();
            user.addActivity(currentTimestamp, ActivityType.USER_REGISTRATION);
            
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
        
        // Get current user to check for achievement unlock
        User currentUser = null;
        int oldScore = 0;
        
        // Check in-memory cache first
        User cachedUser = users.get(userId);
        if (cachedUser != null) {
            currentUser = cachedUser;
            oldScore = currentUser.getScore();
        } else {
            // Check DynamoDB
            try {
                User ddbUser = userDAO.getUser(userId);
                if (ddbUser != null) {
                    currentUser = ddbUser;
                    oldScore = ddbUser.getScore();
                }
            } catch (Exception e) {
                logger.warn("Failed to get user from DynamoDB for achievement check: {}", e.getMessage());
            }
        }
        
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
        
        // Check for achievement unlock and add activity
        if (currentUser != null && AchievementUtils.hasUnlockedNewAchievement(oldScore, score)) {
            try {
                int newAchievementLevel = AchievementUtils.getNewlyUnlockedAchievementLevel(oldScore, score);
                String achievementLabel = AchievementUtils.getAchievementLabelForLevel(newAchievementLevel);
                
                // Add achievement unlock activity
                String currentTimestamp = java.time.Instant.now().toString();
                currentUser.addActivity(currentTimestamp, ActivityType.ACHIEVEMENT_UNLOCKED);
                
                // Update user activities in database
                updateUserActivities(userId, currentUser);
                
                // Update math level to match the new achievement level
                updateUserMathLevelFromPoints(userId, score);
                
                logger.info("User {} unlocked new achievement: {} (Level {})", userId, achievementLabel, newAchievementLevel);
            } catch (Exception e) {
                logger.warn("Failed to add achievement unlock activity for user {}: {}", userId, e.getMessage());
            }
        }
        
        return updated;
    }
    
    @Override
    public boolean updateUserActivities(String userId, User user) {
        if (userId == null || user == null) {
            return false;
        }

        boolean updated = false;
        
        // Update in DynamoDB
        try {
            User ddbUser = userDAO.getUser(userId);
            if (ddbUser != null) {
                ddbUser.setRecentActivities(user.getRecentActivities());
                userDAO.updateUser(ddbUser);
                updated = true;
                logger.info("Updated activities in DynamoDB for user {}: {} activities", userId, user.getRecentActivities().size());
            }
        } catch (Exception e) {
            logger.warn("Failed to update activities in DynamoDB: {}", e.getMessage());
        }
        
        // Update in-memory cache
        User cachedUser = users.get(userId);
        if (cachedUser != null) {
            cachedUser.setRecentActivities(user.getRecentActivities());
            updated = true;
            logger.info("Updated activities in cache for user {}: {} activities", userId, user.getRecentActivities().size());
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
            
            // Add user registration activity
            String currentTimestamp = java.time.Instant.now().toString();
            toStore.addActivity(currentTimestamp, ActivityType.USER_REGISTRATION);
            logger.info("Added user registration activity for: {}", normalized);
            
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
                    boolean avatarUpdated = false;
                    boolean usernameUpdated = false;
                    
                    // Check for avatar update
                    if (userPayload.getAvatarLink() != null && 
                        !userPayload.getAvatarLink().equals(existingUser.getAvatarLink())) {
                        existingUser.setAvatarLink(userPayload.getAvatarLink());
                        avatarUpdated = true;
                    }
                    
                    // Check for username update
                    if (userPayload.getUsername() != null && 
                        !userPayload.getUsername().equals(existingUser.getUsername())) {
                        existingUser.setUsername(userPayload.getUsername());
                        usernameUpdated = true;
                    }
                    
                    if (userPayload.getMathLevel() > 0) existingUser.setMathLevel(userPayload.getMathLevel());
                    // score is controlled via updateUserScore; do not overwrite unless explicitly set
                    
                    // Add activity tracking for updates
                    String currentTimestamp = java.time.Instant.now().toString();
                    if (avatarUpdated) {
                        existingUser.addActivity(currentTimestamp, ActivityType.UPDATE_AVATAR);
                        logger.info("Added avatar update activity for user: {}", normalized);
                    }
                    if (usernameUpdated) {
                        existingUser.addActivity(currentTimestamp, ActivityType.UPDATE_USERNAME);
                        logger.info("Added username update activity for user: {}", normalized);
                    }
                    
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
                boolean avatarUpdated = false;
                boolean usernameUpdated = false;
                
                // Check for avatar update
                if (userPayload.getAvatarLink() != null && 
                    !userPayload.getAvatarLink().equals(existing.getAvatarLink())) {
                    existing.setAvatarLink(userPayload.getAvatarLink());
                    avatarUpdated = true;
                }
                
                // Check for username update
                if (userPayload.getUsername() != null && 
                    !userPayload.getUsername().equals(existing.getUsername())) {
                    existing.setUsername(userPayload.getUsername());
                    usernameUpdated = true;
                }
                
                if (userPayload.getMathLevel() > 0) existing.setMathLevel(userPayload.getMathLevel());
                
                // Add activity tracking for updates
                String currentTimestamp = java.time.Instant.now().toString();
                if (avatarUpdated) {
                    existing.addActivity(currentTimestamp, ActivityType.UPDATE_AVATAR);
                    logger.info("Added avatar update activity for user: {}", normalized);
                }
                if (usernameUpdated) {
                    existing.addActivity(currentTimestamp, ActivityType.UPDATE_USERNAME);
                    logger.info("Added username update activity for user: {}", normalized);
                }
                
                logger.info("Updated user profile in cache for: {}", normalized);
                return existing.copy();
            }
        }
        
        return null;
    }
    
    @Override
    public boolean updateUserMathLevelFromPoints(String userId, int points) {
        if (userId == null) {
            return false;
        }

        int newMathLevel = AchievementUtils.getAchievementLevel(points) + 1; // Convert 0-based to 1-based
        return updateUserMathLevel(userId, newMathLevel);
    }
} 