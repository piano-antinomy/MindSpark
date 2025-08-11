package com.mindspark.service.dao;

import com.google.inject.Inject;
import com.mindspark.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

import javax.inject.Singleton;
import java.util.HashMap;
import java.util.Map;

@Singleton
public class DDBBackedUserMetadataDAO {
    private static final Logger logger = LoggerFactory.getLogger(DDBBackedUserMetadataDAO.class);
    
    private final DynamoDbClient dynamoDbClient;
    private static final String TABLE_NAME = "MindSparkUsers";
    private static final String PARTITION_KEY = "userId";
    private static final String SORT_KEY = "sortKey";
    private static final String USER_METADATA_SORT_KEY = "userMetadata";
    

    @Inject
    public DDBBackedUserMetadataDAO(final DynamoDbClient dynamoDbClient) {
        this.dynamoDbClient = dynamoDbClient;
        initializeTable();
    }
    
    /**
     * Initialize the DynamoDB table if it doesn't exist
     */
    private void initializeTable() {
        try {
            // Check if table exists
            DescribeTableRequest describeRequest = DescribeTableRequest.builder()
                    .tableName(TABLE_NAME)
                    .build();
            
            try {
                dynamoDbClient.describeTable(describeRequest);
                logger.info("Table {} already exists", TABLE_NAME);
                return;
            } catch (ResourceNotFoundException e) {
                
                logger.info("Table {} does not exist, creating it...", TABLE_NAME);
                createTable();
            }
            
        } catch (Exception e) {
            logger.error("Error initializing table {}: {}", TABLE_NAME, e.getMessage(), e);
            
            throw new RuntimeException("Failed to initialize DynamoDB table", e);
        }
    }
    
    private void createTable() {
        // Create table
        CreateTableRequest createRequest = CreateTableRequest.builder()
                .tableName(TABLE_NAME)
                .attributeDefinitions(
                        AttributeDefinition.builder()
                                .attributeName(PARTITION_KEY)
                                .attributeType(ScalarAttributeType.S)
                                .build(),
                        AttributeDefinition.builder()
                                .attributeName(SORT_KEY)
                                .attributeType(ScalarAttributeType.S)
                                .build()
                )
                .keySchema(
                        KeySchemaElement.builder()
                                .attributeName(PARTITION_KEY)
                                .keyType(KeyType.HASH)
                                .build(),
                        KeySchemaElement.builder()
                                .attributeName(SORT_KEY)
                                .keyType(KeyType.RANGE)
                                .build()
                )
                .provisionedThroughput(ProvisionedThroughput.builder()
                        .readCapacityUnits(5L)
                        .writeCapacityUnits(5L)
                        .build())
                .build();
        
        dynamoDbClient.createTable(createRequest);
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
            Map<String, AttributeValue> item = new HashMap<>();
            
            // Primary key attributes
            item.put(PARTITION_KEY, AttributeValue.builder().s(user.getUserId()).build());
            item.put(SORT_KEY, AttributeValue.builder().s(USER_METADATA_SORT_KEY).build());
            
            // User attributes
            if (user.getUsername() != null) {
                item.put("username", AttributeValue.builder().s(user.getUsername()).build());
            }
            if (user.getPassword() != null) {
                item.put("password", AttributeValue.builder().s(user.getPassword()).build());
            }
            if (user.getEmail() != null) {
                item.put("email", AttributeValue.builder().s(user.getEmail()).build());
            }
            if (user.getFullName() != null) {
                item.put("fullName", AttributeValue.builder().s(user.getFullName()).build());
            }
            
            // Numeric attributes
            item.put("score", AttributeValue.builder().n(String.valueOf(user.getScore())).build());
            item.put("mathLevel", AttributeValue.builder().n(String.valueOf(user.getMathLevel())).build());
            
            // Timestamp
            item.put("createdAt", AttributeValue.builder().s(java.time.Instant.now().toString()).build());
            
            PutItemRequest putRequest = PutItemRequest.builder()
                    .tableName(TABLE_NAME)
                    .item(item)
                    .build();
            
            dynamoDbClient.putItem(putRequest);
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
            GetItemRequest getRequest = GetItemRequest.builder()
                    .tableName(TABLE_NAME)
                    .key(Map.of(
                            PARTITION_KEY, AttributeValue.builder().s(userId).build(),
                            SORT_KEY, AttributeValue.builder().s(USER_METADATA_SORT_KEY).build()
                    ))
                    .build();
            
            GetItemResponse response = dynamoDbClient.getItem(getRequest);
            
            if (!response.hasItem()) {
                logger.info("User not found: {}", userId);
                return null;
            }
            
            Map<String, AttributeValue> item = response.item();
            User user = new User();
            
            // Set basic attributes
            user.setUserId(getStringValue(item, PARTITION_KEY));
            user.setUsername(getStringValue(item, "username"));
            user.setPassword(getStringValue(item, "password"));
            user.setEmail(getStringValue(item, "email"));
            user.setFullName(getStringValue(item, "fullName"));
            
            // Set numeric attributes
            user.setScore(getIntValue(item, "score", 0));
            user.setMathLevel(getIntValue(item, "mathLevel", 1));
            
            logger.info("User retrieved successfully: {}", userId);
            return user;
            
        } catch (Exception e) {
            logger.error("Error retrieving user {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve user from DynamoDB", e);
        }
    }
    
    /**
     * Retrieve a user from DynamoDB by username
     * Note: This requires a scan operation since username is not a key
     */
    public User getUserByUsername(String username) {
        if (username == null) {
            throw new IllegalArgumentException("username cannot be null");
        }
        
        try {
            // Use scan to find user by username
            ScanRequest scanRequest = ScanRequest.builder()
                    .tableName(TABLE_NAME)
                    .filterExpression("username = :username")
                    .expressionAttributeValues(Map.of(
                            ":username", AttributeValue.builder().s(username.toLowerCase()).build()
                    ))
                    .build();
            
            ScanResponse response = dynamoDbClient.scan(scanRequest);
            
            if (response.items().isEmpty()) {
                logger.info("User not found by username: {}", username);
                return null;
            }
            
            // Get the first matching item
            Map<String, AttributeValue> item = response.items().get(0);
            User user = new User();
            
            // Set basic attributes
            user.setUserId(getStringValue(item, PARTITION_KEY));
            user.setUsername(getStringValue(item, "username"));
            user.setPassword(getStringValue(item, "password"));
            user.setEmail(getStringValue(item, "email"));
            user.setFullName(getStringValue(item, "fullName"));
            
            // Set numeric attributes
            user.setScore(getIntValue(item, "score", 0));
            user.setMathLevel(getIntValue(item, "mathLevel", 1));
            
            logger.info("User retrieved by username successfully: {}", username);
            return user;
            
        } catch (Exception e) {
            logger.error("Error retrieving user by username {}: {}", username, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve user by username from DynamoDB", e);
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
            Map<String, AttributeValue> key = Map.of(
                    PARTITION_KEY, AttributeValue.builder().s(user.getUserId()).build(),
                    SORT_KEY, AttributeValue.builder().s(USER_METADATA_SORT_KEY).build()
            );
            
            Map<String, AttributeValueUpdate> updates = new HashMap<>();
            
            // Update string attributes if provided
            if (user.getUsername() != null) {
                updates.put("username", AttributeValueUpdate.builder()
                        .value(AttributeValue.builder().s(user.getUsername()).build())
                        .action(AttributeAction.PUT)
                        .build());
            }
            if (user.getPassword() != null) {
                updates.put("password", AttributeValueUpdate.builder()
                        .value(AttributeValue.builder().s(user.getPassword()).build())
                        .action(AttributeAction.PUT)
                        .build());
            }
            if (user.getEmail() != null) {
                updates.put("email", AttributeValueUpdate.builder()
                        .value(AttributeValue.builder().s(user.getEmail()).build())
                        .action(AttributeAction.PUT)
                        .build());
            }
            if (user.getFullName() != null) {
                updates.put("fullName", AttributeValueUpdate.builder()
                        .value(AttributeValue.builder().s(user.getFullName()).build())
                        .action(AttributeAction.PUT)
                        .build());
            }
            
            // Update numeric attributes
            updates.put("score", AttributeValueUpdate.builder()
                    .value(AttributeValue.builder().n(String.valueOf(user.getScore())).build())
                    .action(AttributeAction.PUT)
                    .build());
            updates.put("mathLevel", AttributeValueUpdate.builder()
                    .value(AttributeValue.builder().n(String.valueOf(user.getMathLevel())).build())
                    .action(AttributeAction.PUT)
                    .build());
            
            // Update timestamp
            updates.put("updatedAt", AttributeValueUpdate.builder()
                    .value(AttributeValue.builder().s(java.time.Instant.now().toString()).build())
                    .action(AttributeAction.PUT)
                    .build());
            
            UpdateItemRequest updateRequest = UpdateItemRequest.builder()
                    .tableName(TABLE_NAME)
                    .key(key)
                    .attributeUpdates(updates)
                    .build();
            
            dynamoDbClient.updateItem(updateRequest);
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
            GetItemRequest getRequest = GetItemRequest.builder()
                    .tableName(TABLE_NAME)
                    .key(Map.of(
                            PARTITION_KEY, AttributeValue.builder().s(userId).build(),
                            SORT_KEY, AttributeValue.builder().s(USER_METADATA_SORT_KEY).build()
                    ))
                    .build();
            
            GetItemResponse response = dynamoDbClient.getItem(getRequest);
            return response.hasItem();
            
        } catch (Exception e) {
            logger.error("Error checking if user exists {}: {}", userId, e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Check if a user exists in DynamoDB by username
     */
    public boolean userExistsByUsername(String username) {
        if (username == null) {
            return false;
        }
        
        try {
            ScanRequest scanRequest = ScanRequest.builder()
                    .tableName(TABLE_NAME)
                    .filterExpression("username = :username")
                    .expressionAttributeValues(Map.of(
                            ":username", AttributeValue.builder().s(username.toLowerCase()).build()
                    ))
                    .select(Select.COUNT)
                    .build();
            
            ScanResponse response = dynamoDbClient.scan(scanRequest);
            return response.count() > 0;
            
        } catch (Exception e) {
            logger.error("Error checking if user exists by username {}: {}", username, e.getMessage(), e);
            return false;
        }
    }
    
    // Helper methods for extracting values from DynamoDB items
    private String getStringValue(Map<String, AttributeValue> item, String key) {
        AttributeValue value = item.get(key);
        return value != null ? value.s() : null;
    }
    
    private int getIntValue(Map<String, AttributeValue> item, String key, int defaultValue) {
        AttributeValue value = item.get(key);
        if (value != null && value.n() != null) {
            try {
                return Integer.parseInt(value.n());
            } catch (NumberFormatException e) {
                logger.warn("Invalid number format for key {}: {}", key, value.n());
            }
        }
        return defaultValue;
    }
}
