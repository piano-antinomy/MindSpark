package com.mindspark.config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.google.inject.AbstractModule;
import com.google.inject.Provides;
import com.mindspark.service.CacheBackedQuestionServiceImpl;
import com.mindspark.service.LoginService;
import com.mindspark.service.LoginServiceImpl;
import com.mindspark.service.QuestionService;
import com.mindspark.service.S3BackedQuestionServiceImpl;
import com.mindspark.service.progress.DDBBackedProgressTrackingServiceImpl;
import com.mindspark.service.progress.ProgressTrackService;
import com.mindspark.service.quiz.DDBBackedQuizServiceImpl;
import com.mindspark.service.quiz.QuizService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Singleton;

// AWS SDK v2 S3 imports
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

public class MindSparkModule extends AbstractModule {
    
    private static final Logger logger = LoggerFactory.getLogger(MindSparkModule.class);
    
    @Override
    protected void configure() {
        // Bind services
        bind(LoginService.class).to(LoginServiceImpl.class);
        bind(ProgressTrackService.class).to(DDBBackedProgressTrackingServiceImpl.class);
        bind(QuizService.class).to(DDBBackedQuizServiceImpl.class);

        install(new DDBDAOModule());
    }

    @Provides
    @Singleton
    QuestionService provideQuestionService(
        final @LocalMode Boolean isLocalMode, final ObjectMapper objectMapper, final S3Client s3Client) {
        return isLocalMode
            ? new CacheBackedQuestionServiceImpl(objectMapper, true)
            : new S3BackedQuestionServiceImpl(objectMapper, s3Client, "mindspark-questions-prod", "math/questions");
    }
    
    @Provides
    @Singleton
    public ObjectMapper provideObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        
        // Register JavaTimeModule for LocalDateTime support
        mapper.registerModule(new JavaTimeModule());
        
        // Configure serialization settings
        mapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
        mapper.configure(SerializationFeature.INDENT_OUTPUT, true);
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        
        // Find and register other modules
        mapper.findAndRegisterModules();
        
        return mapper;
    }
    
    @Provides
    @LocalMode
    @Singleton
    public Boolean provideIsLocalMode() {
        // Method 1: Check system property set by run.sh
        String localModeProperty = System.getProperty("mindspark.local.mode");
        if ("true".equals(localModeProperty)) {
            logger.info("Local mode detected via system property");
            return true;
        }
        
        // Method 2: Check AWS Lambda environment variables
        String lambdaTaskRoot = System.getenv("LAMBDA_TASK_ROOT");
        String awsExecutionEnv = System.getenv("AWS_EXECUTION_ENV");
        if (lambdaTaskRoot != null || awsExecutionEnv != null) {
            logger.info("Lambda environment detected: LAMBDA_TASK_ROOT={}, AWS_EXECUTION_ENV={}", 
                       lambdaTaskRoot, awsExecutionEnv);
            return false;
        }
        
        // Default to local mode if uncertain
        logger.warn("Unable to determine environment, defaulting to local mode");
        return true;
    }

    @Provides
    @Singleton
    S3Client provideAmazonS3() {
        // Region us-east-1 as requested; credentials via default provider chain
        return S3Client.builder()
            .region(Region.US_EAST_1)
            .httpClient(UrlConnectionHttpClient.builder().build())
            .credentialsProvider(DefaultCredentialsProvider.create())
            .build();
    }
} 