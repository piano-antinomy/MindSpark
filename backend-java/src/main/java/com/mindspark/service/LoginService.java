package com.mindspark.service;

import com.mindspark.model.User;

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
     * @param mathLevel The new math level
     * @return true if update successful
     */
    boolean updateUserMathLevel(String username, String mathLevel);
    
    /**
     * Check if user exists
     * @param username The username
     * @return true if user exists
     */
    boolean userExists(String username);
} 