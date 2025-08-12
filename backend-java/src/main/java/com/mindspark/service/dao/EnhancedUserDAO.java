package com.mindspark.service.dao;

import com.google.inject.Inject;
import com.mindspark.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.PageIterable;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryEnhancedRequest;
import software.amazon.awssdk.services.dynamodb.model.ResourceNotFoundException;

import javax.inject.Singleton;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Singleton
public class EnhancedUserDAO {
    private static final Logger logger = LoggerFactory.getLogger(EnhancedUserDAO.class);
    private final DynamoDbTable<User> userTable;
    private static final String TABLE_NAME = "MindSparkUsers";

    @Inject
    public EnhancedUserDAO(final DynamoDbEnhancedClient enhancedClient) {
        this.userTable = enhancedClient.table(TABLE_NAME, TableSchema.fromBean(User.class));
        initializeTable();
    }
    
    /**
     * Initialize the DynamoDB table if it doesn't exist
     */
    private void initializeTable() {
        try {
            // Check if table exists by trying to describe it
            userTable.describeTable();
            logger.info("Table {} already exists", TABLE_NAME);
        } catch (ResourceNotFoundException e) {
            logger.info("Table {} does not exist, creating it...", TABLE_NAME);
            createTable();
        } catch (Exception e) {
            logger.error("Error initializing table {}: {}", TABLE_NAME, e.getMessage(), e);
            throw new RuntimeException("Failed to initialize DynamoDB table", e);
        }
    }
    
    private void createTable() {
        // Create table using the enhanced client
        userTable.createTable(builder -> builder
                .provisionedThroughput(provisionedThroughput -> provisionedThroughput
                        .readCapacityUnits(5L)
                        .writeCapacityUnits(5L)
                        .build())
                .build());
        logger.info("Table {} created successfully", TABLE_NAME);
    }
    
    /**
     * Create a new user in DynamoDB
     */
    public void createUser(User user) {
        if (user == null || user.getUserId() == null) {
            throw new IllegalArgumentException("User and userId cannot be null");
        }
        
        try {
            // Set default values
            if (user.getSortKey() == null) {
                user.setSortKey("userMetadata");
            }
            if (user.getCreatedAt() == null) {
                user.setCreatedAt(Instant.now().toString());
            }
            user.setUpdatedAt(Instant.now().toString());
            
            userTable.putItem(user);
            logger.info("User created successfully: {}", user.getUserId());
            
        } catch (Exception e) {
            logger.error("Error creating user {}: {}", user.getUserId(), e.getMessage(), e);
            throw new RuntimeException("Failed to create user in DynamoDB", e);
        }
    }
    
    /**
     * Retrieve a user from DynamoDB by userId
     */
    public User getUser(String userId) {
        if (userId == null) {
            throw new IllegalArgumentException("userId cannot be null");
        }
        
        try {
            Key key = Key.builder()
                    .partitionValue(userId)
                    .sortValue("userMetadata")
                    .build();
            
            User user = userTable.getItem(key);
            
            if (user == null) {
                logger.info("User not found: {}", userId);
                return null;
            }
            
            logger.info("User retrieved successfully: {}", userId);
            return user;
            
        } catch (Exception e) {
            logger.error("Error retrieving user {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve user from DynamoDB", e);
        }
    }
    
    /**
     * Update an existing user in DynamoDB
     */
    public void updateUser(User user) {
        if (user == null || user.getUserId() == null) {
            throw new IllegalArgumentException("User and userId cannot be null");
        }
        
        try {
            user.setUpdatedAt(Instant.now().toString());
            userTable.updateItem(user);
            logger.info("User updated successfully: {}", user.getUserId());
            
        } catch (Exception e) {
            logger.error("Error updating user {}: {}", user.getUserId(), e.getMessage(), e);
            throw new RuntimeException("Failed to update user in DynamoDB", e);
        }
    }
    
    /**
     * Check if a user exists in DynamoDB
     */
    public boolean userExists(String userId) {
        if (userId == null) {
            return false;
        }
        
        try {
            Key key = Key.builder()
                    .partitionValue(userId)
                    .sortValue("userMetadata")
                    .build();
            
            User user = userTable.getItem(key);
            return user != null;
            
        } catch (Exception e) {
            logger.error("Error checking if user exists {}: {}", userId, e.getMessage(), e);
            return false;
        }
    }

    /**
     * Delete a user from DynamoDB
     */
    public void deleteUser(String userId) {
        if (userId == null) {
            throw new IllegalArgumentException("userId cannot be null");
        }
        
        try {
            Key key = Key.builder()
                    .partitionValue(userId)
                    .sortValue("userMetadata")
                    .build();
            
            userTable.deleteItem(key);
            logger.info("User deleted successfully: {}", userId);
            
        } catch (Exception e) {
            logger.error("Error deleting user {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Failed to delete user from DynamoDB", e);
        }
    }
    
    /**
     * Get all users (for admin purposes)
     */
    public List<User> getAllUsers() {
        try {
            PageIterable<User> results = userTable.scan();
            List<User> users = new ArrayList<>();
            results.items().forEach(users::add);
            
            logger.info("Retrieved {} users from DynamoDB", users.size());
            return users;
            
        } catch (Exception e) {
            logger.error("Error retrieving all users: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve all users from DynamoDB", e);
        }
    }
}
