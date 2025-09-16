package com.mindspark.config;

import com.google.inject.AbstractModule;
import com.google.inject.Provides;
import com.google.inject.Singleton;
import com.mindspark.local.ddb.LocalHostDynamoDB;
import com.mindspark.service.dao.EnhancedUserDAO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.io.IOException;
import java.net.URI;

public class DDBDAOModule extends AbstractModule {
    private static final Logger logger = LoggerFactory.getLogger(DDBDAOModule.class);
    
    @Override
    protected void configure() {
        bind(EnhancedUserDAO.class);
    }

    @Provides
    @Singleton
    public DynamoDbClient provideDynamoDBClient(@LocalMode Boolean localMode) {
        if (localMode) {
            logger.info("Using local DynamoDB client for testing");
            LocalHostDynamoDB localHostDynamoDB = new LocalHostDynamoDB();
            try {
                localHostDynamoDB.start();
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
            return DynamoDbClient.builder()
                    .endpointOverride(URI.create(localHostDynamoDB.getEndpointUrl()))
                    .credentialsProvider(StaticCredentialsProvider.create(
                            AwsBasicCredentials.create("dummy", "dummy")))
                    .region(Region.US_EAST_1)
                    .httpClient(UrlConnectionHttpClient.builder().build())
                    .build();
        } else {
            logger.info("Using production DynamoDB client");
            return DynamoDbClient.builder()
                    .httpClient(UrlConnectionHttpClient.builder().build())
                    .build();
        }
    }
    
    @Provides
    @Singleton
    public DynamoDbEnhancedClient provideDynamoDBEnhancedClient(DynamoDbClient dynamoDbClient) {
        return DynamoDbEnhancedClient.builder()
                .dynamoDbClient(dynamoDbClient)
                .build();
    }
}
