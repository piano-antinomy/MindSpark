package com.mindspark.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.inject.AbstractModule;
import com.google.inject.Provides;
import com.mindspark.service.QuestionService;
import com.mindspark.service.CacheBackedQuestionServiceImpl;
import com.mindspark.service.LoginService;
import com.mindspark.service.LoginServiceImpl;

import javax.inject.Singleton;

public class MindSparkModule extends AbstractModule {
    
    @Override
    protected void configure() {
        // Bind services
        bind(QuestionService.class).to(CacheBackedQuestionServiceImpl.class);
        bind(LoginService.class).to(LoginServiceImpl.class);
    }
    
    @Provides
    @Singleton
    public ObjectMapper provideObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        // Configure the mapper as needed
        mapper.findAndRegisterModules();
        return mapper;
    }
} 