package com.mindspark.local.ddb;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

import java.net.URI;

public class DynamoDBLocalExample {
    
    public static void main(String[] args) {
        LocalHostDynamoDB localDynamoDB = null;
        
        try {
            // Start DynamoDB Local
            localDynamoDB = new LocalHostDynamoDB();
            localDynamoDB.start();
            
            // Create DynamoDB client
            DynamoDbClient client = DynamoDbClient.builder()
                    .endpointOverride(URI.create(localDynamoDB.getEndpointUrl()))
                    .credentialsProvider(StaticCredentialsProvider.create(
                            AwsBasicCredentials.create("dummy", "dummy")))
                    .region(Region.US_EAST_1)
                    .build();
            
            // Example: Create a table
            String tableName = "TestTable";
            createTable(client, tableName);
            
            // Example: Put an item
            putItem(client, tableName, "user123", "John Doe", 25);
            
            // Example: Get an item
            getItem(client, tableName, "user123");
            
            System.out.println("DynamoDB Local example completed successfully!");
            
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
        } finally {
            // Stop DynamoDB Local
            if (localDynamoDB != null) {
                localDynamoDB.stop();
            }
        }
    }
    
    private static void createTable(DynamoDbClient client, String tableName) {
        try {
            CreateTableRequest request = CreateTableRequest.builder()
                    .tableName(tableName)
                    .attributeDefinitions(AttributeDefinition.builder()
                            .attributeName("id")
                            .attributeType(ScalarAttributeType.S)
                            .build())
                    .keySchema(KeySchemaElement.builder()
                            .attributeName("id")
                            .keyType(KeyType.HASH)
                            .build())
                    .provisionedThroughput(ProvisionedThroughput.builder()
                            .readCapacityUnits(5L)
                            .writeCapacityUnits(5L)
                            .build())
                    .build();
            
            client.createTable(request);
            System.out.println("Table '" + tableName + "' created successfully");
            
        } catch (ResourceInUseException e) {
            System.out.println("Table '" + tableName + "' already exists");
        }
    }
    
    private static void putItem(DynamoDbClient client, String tableName, String id, String name, int age) {
        PutItemRequest request = PutItemRequest.builder()
                .tableName(tableName)
                .item(java.util.Map.of(
                        "id", AttributeValue.builder().s(id).build(),
                        "name", AttributeValue.builder().s(name).build(),
                        "age", AttributeValue.builder().n(String.valueOf(age)).build()
                ))
                .build();
        
        client.putItem(request);
        System.out.println("Item added: " + id);
    }
    
    private static void getItem(DynamoDbClient client, String tableName, String id) {
        GetItemRequest request = GetItemRequest.builder()
                .tableName(tableName)
                .key(java.util.Map.of("id", AttributeValue.builder().s(id).build()))
                .build();
        
        GetItemResponse response = client.getItem(request);
        if (response.hasItem()) {
            System.out.println("Retrieved item: " + response.item());
        } else {
            System.out.println("Item not found: " + id);
        }
    }
}
