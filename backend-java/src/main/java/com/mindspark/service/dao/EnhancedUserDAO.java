package com.mindspark.service.dao;

import com.google.inject.Inject;
import com.mindspark.config.AppConfig;
import com.mindspark.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.PageIterable;
import software.amazon.awssdk.services.dynamodb.model.ResourceNotFoundException;
import software.amazon.awssdk.enhanced.dynamodb.Expression;
import software.amazon.awssdk.enhanced.dynamodb.model.ScanEnhancedRequest;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import java.util.HashMap;
import java.util.Map;

import javax.inject.Singleton;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Singleton
public class EnhancedUserDAO {
    private static final Logger logger = LoggerFactory.getLogger(EnhancedUserDAO.class);
    private final DynamoDbTable<User> userTable;

    @Inject
    public EnhancedUserDAO(final DynamoDbEnhancedClient enhancedClient) {
        this.userTable = enhancedClient.table(AppConfig.UNIFIED_DDB_TABLE_NAME, TableSchema.fromBean(User.class));
        initializeTable();
    }
    
    /**
     * Initialize the DynamoDB table if it doesn't exist
     */
    private void initializeTable() {
        try {
            // Check if table exists by trying to describe it
            userTable.describeTable();
            logger.info("Table {} already exists", AppConfig.UNIFIED_DDB_TABLE_NAME);
        } catch (ResourceNotFoundException e) {
            logger.info("Table {} does not exist, creating it...", AppConfig.UNIFIED_DDB_TABLE_NAME);
            createTable();
        } catch (Exception e) {
            logger.error("Error initializing table {}: {}", AppConfig.UNIFIED_DDB_TABLE_NAME, e.getMessage(), e);
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
        logger.info("Table {} created successfully", AppConfig.UNIFIED_DDB_TABLE_NAME);
    }
    
    /**
     * Create a new user in DynamoDB
     */
    public void createUser(User user) {
        if (user == null || user.getUserId() == null) {
            throw new IllegalArgumentException("User and userId cannot be null");
        }

        if (getUser(user.getUserId()) != null) {
            logger.info("user id found, skip creation: " + user.getUserId());
            return;
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
            Map<String, String> expressionNames = new HashMap<>();
            expressionNames.put("#sk", "sortKey");

            Map<String, AttributeValue> expressionValues = new HashMap<>();
            expressionValues.put(":skVal", AttributeValue.builder().s("userMetadata").build());

            Expression filterExpression = Expression.builder()
                    .expression("#sk = :skVal")
                    .expressionNames(expressionNames)
                    .expressionValues(expressionValues)
                    .build();

            ScanEnhancedRequest request = ScanEnhancedRequest.builder()
                    .filterExpression(filterExpression)
                    .build();

            PageIterable<User> results = userTable.scan(request);
            List<User> users = new ArrayList<>();
            results.items().stream().forEach(users::add);
            
            logger.info("Retrieved {} users from DynamoDB", users.size());
            
            // Debug: Log first few users to see what we're getting
            if (users.size() > 0) {
                logger.info("First user details: userId={}, sortKey={}, username={}", 
                    users.get(0).getUserId(), users.get(0).getSortKey(), users.get(0).getUsername());
            } else {
                logger.warn("No users found in DynamoDB scan");
            }
            
            return users;
            
        } catch (Exception e) {
            logger.error("Error retrieving all users: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve all users from DynamoDB", e);
        }
    }
}
