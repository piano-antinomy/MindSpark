package com.mindspark.config;

public class AppConfig {
    /**
     * we use a single DynamoDB table for all user data including user progress, scores, and metadata.
     */
    public static final String UNIFIED_DDB_TABLE_NAME = "MindSparkUsers-prod";
}
