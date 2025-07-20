package com.mindspark.config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.inject.AbstractModule;
import com.google.inject.Provides;
import com.mindspark.service.QuestionService;
import com.mindspark.service.CacheBackedQuestionServiceImpl;
import com.mindspark.service.LoginService;
import com.mindspark.service.LoginServiceImpl;
import com.mindspark.service.progress.CacheBasedProgressTrackServiceImpl;
import com.mindspark.service.progress.ProgressTrackService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Singleton;

public class MindSparkModule extends AbstractModule {
    
    private static final Logger logger = LoggerFactory.getLogger(MindSparkModule.class);
    
    @Override
    protected void configure() {
        // Bind services
        bind(QuestionService.class).to(CacheBackedQuestionServiceImpl.class);
        bind(LoginService.class).to(LoginServiceImpl.class);
        bind(ProgressTrackService.class).to(CacheBasedProgressTrackServiceImpl.class);
    }
    
    @Provides
    @Singleton
    public ObjectMapper provideObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        // Configure the mapper as needed
        mapper.findAndRegisterModules();

        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
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
} 