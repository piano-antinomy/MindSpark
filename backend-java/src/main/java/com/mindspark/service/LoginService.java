package com.mindspark.service;

import com.mindspark.model.User;

import java.util.List;

public interface LoginService {
    
    /**
     * Authenticate user with username and password
     * @param username The username
     * @param password The password
     * @return User object if authentication successful, null otherwise
     */
    User authenticate(String username, String password);
    
    /**
     * Get user profile by username
     * @param username The username
     * @return User object without password
     */
    User getUserProfile(String username);
    
    /**
     * Update user score
     * @param username The username
     * @param score The new score
     * @return true if update successful
     */
    boolean updateUserScore(String username, int score);
    
    /**
     * Update user math level
     * @param username The username
     * @param mathLevel The new math level (1=beginner, 2=intermediate, 3=advanced)
     * @return true if update successful
     */
    boolean updateUserMathLevel(String username, int mathLevel);
    
    /**
     * Check if user exists
     * @param username The username
     * @return true if user exists
     */
    boolean userExists(String username);

    /**
     * Create or update a user profile using the provided {@link User} schema.
     * Implementations should ensure sensible defaults (e.g., score defaults to 0).
     * Returns the created/updated user without the password field populated.
     *
     * @param user the user payload
     * @return the stored user without password, or null if the payload is invalid
     */
    User createOrUpdateUser(User user);

    /**
     * Update user activities
     * @param userId The user ID
     * @param user The updated user object with activities
     * @return true if update successful
     */
    boolean updateUserActivities(String userId, User user);
    
    /**
     * Update user math level based on points
     * @param userId the user ID
     * @param points the user's current points
     * @return true if successful, false otherwise
     */
    boolean updateUserMathLevelFromPoints(String userId, int points);

    List<User> getAllUsers();
} 