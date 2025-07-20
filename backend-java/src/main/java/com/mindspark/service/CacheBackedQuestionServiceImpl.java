package com.mindspark.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindspark.model.Question;
import com.mindspark.model.QuestionFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Inject;
import javax.inject.Singleton;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.concurrent.ConcurrentHashMap;

@Singleton
public class CacheBackedQuestionServiceImpl implements QuestionService {
    
    private static final int DEFAULT_HIGHEST_LEVEL = 3;
    private static final Logger logger = LoggerFactory.getLogger(CacheBackedQuestionServiceImpl.class);
    private final ObjectMapper objectMapper;
    private final Map<Integer, List<Question>> questionsCache = new ConcurrentHashMap<>();
    private final Map<Integer, Set<String>> availableYearsByLevel = new ConcurrentHashMap<>();
    private final Map<String, String> levelToAMCType = new HashMap<>();
    
    // Environment detection
    private final boolean isLocalMode;
    private final String questionsBasePath;
    
    @Inject
    public CacheBackedQuestionServiceImpl(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        
        // Detect environment and set appropriate paths
        this.isLocalMode = detectLocalMode();
        this.questionsBasePath = isLocalMode ? "/resources/math/questions" : "/math/questions";
        
        logger.info("Initializing QuestionService in {} mode", isLocalMode ? "LOCAL" : "LAMBDA");
        logger.info("Questions base path: {}", questionsBasePath);
        
        initializeLevelMappings();
        loadAllQuestions();
    }
    
    /**
     * Detect if running in local development mode vs Lambda/production
     */
    private boolean detectLocalMode() {
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
    
    private void initializeLevelMappings() {
        levelToAMCType.put("1", "AMC_8");
        levelToAMCType.put("2", "AMC_10");
        levelToAMCType.put("3", "AMC_12");
    }
    
    @Override
    public List<Question> listQuestionsByLevel(int level) {
        if (level < 1 || level > DEFAULT_HIGHEST_LEVEL) {
            logger.warn("Invalid level requested: {}", level);
            return Collections.emptyList();
        }
        
        return questionsCache.getOrDefault(level, Collections.emptyList());
    }
    
    @Override
    public List<Integer> getAvailableLevels() {
        List<Integer> levels = new ArrayList<>(questionsCache.keySet());
        Collections.sort(levels);
        return levels;
    }
    
    @Override
    public int getQuestionCountByLevel(int level) {
        List<Question> questions = questionsCache.get(level);
        return questions != null ? questions.size() : 0;
    }
    
    @Override
    public List<String> getAvailableYearsByLevel(int level) {
        Set<String> years = availableYearsByLevel.get(level);
        if (years != null) {
            List<String> yearsList = new ArrayList<>(years);
            Collections.sort(yearsList, Collections.reverseOrder()); // Most recent first
            return yearsList;
        }
        return Collections.emptyList();
    }
    
    @Override
    public List<Question> getQuestionsByLevelAndYear(int level, String year) {
        String amcType = levelToAMCType.get(String.valueOf(level));
        if (amcType == null) {
            logger.warn("Invalid level: {}", level);
            return Collections.emptyList();
        }
        
        if (isLocalMode) {
            return loadQuestionsFromFile(amcType, year);
        } else {
            return loadQuestionsFromResource(amcType, year);
        }
    }
    
    @Override
    public String getAMCTypeByLevel(int level) {
        return levelToAMCType.getOrDefault(String.valueOf(level), "Unknown");
    }
    
    private void loadAllQuestions() {
        logger.info("Loading all questions from {} using {} mode", questionsBasePath, isLocalMode ? "filesystem" : "classpath");
        
        // Load AMC 8 questions as Level 1
        loadAMCQuestions("AMC_8", 1);
        
        // Load AMC 10 questions as Level 2  
        loadAMCQuestions("AMC_10", 2);
        
        // Load AMC 12 questions as Level 3
        loadAMCQuestions("AMC_12", 3);
        
        logger.info("Loaded questions for {} levels", questionsCache.size());
    }
    
    private void loadAMCQuestions(String amcType, int level) {
        logger.info("Loading {} questions for level {}", amcType, level);
        List<Question> allQuestionsForLevel = new ArrayList<>();
        Set<String> yearsForLevel = new TreeSet<>();
        
        // Common AMC file names
        String[] years = {
            "2000", "2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009",
            "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019",
            "2020", "2021", "2022", "2023", "2024", "2025"
        };
        
        for (String year : years) {
            List<Question> yearQuestions;
            
            if (isLocalMode) {
                yearQuestions = loadQuestionsFromFile(amcType, year);
            } else {
                yearQuestions = loadQuestionsFromResource(amcType, year);
            }
            
            if (!yearQuestions.isEmpty()) {
                allQuestionsForLevel.addAll(yearQuestions);
                yearsForLevel.add(year);
                logger.debug("Loaded {} questions from {} {}", yearQuestions.size(), amcType, year);
            }
        }
        
        questionsCache.put(level, allQuestionsForLevel);
        availableYearsByLevel.put(level, yearsForLevel);
        logger.info("Loaded {} questions for level {} ({}) with {} years available", 
                   allQuestionsForLevel.size(), level, amcType, yearsForLevel.size());
    }
    
    /**
     * Load questions from file system (local development)
     */
    private List<Question> loadQuestionsFromFile(String amcType, String year) {
        String filePath = questionsBasePath + "/AMC/" + amcType + "/" + year + "_" + amcType + ".json";
        File file = new File(filePath);
        
        if (!file.exists()) {
            logger.debug("File not found: {}", filePath);
            return Collections.emptyList();
        }
        
        try {
            logger.debug("Loading questions from file: {}", filePath);
            QuestionFile questionFile = objectMapper.readValue(file, QuestionFile.class);
            return questionFile.getProblems() != null ? questionFile.getProblems() : Collections.emptyList();
        } catch (IOException e) {
            logger.error("Error loading questions from file: {}", filePath, e);
            return Collections.emptyList();
        }
    }
    
    /**
     * Load questions from classpath resources (Lambda/production)
     */
    private List<Question> loadQuestionsFromResource(String amcType, String year) {
        String resourcePath = questionsBasePath + "/AMC/" + amcType + "/" + year + "_" + amcType + ".json";
        
        try (InputStream inputStream = getClass().getResourceAsStream(resourcePath)) {
            if (inputStream != null) {
                logger.debug("Loading questions from classpath: {}", resourcePath);
                QuestionFile questionFile = objectMapper.readValue(inputStream, QuestionFile.class);
                return questionFile.getProblems() != null ? questionFile.getProblems() : Collections.emptyList();
            } else {
                logger.debug("Resource not found: {}", resourcePath);
                return Collections.emptyList();
            }
        } catch (IOException e) {
            logger.error("Error loading questions from resource: {}", resourcePath, e);
            return Collections.emptyList();
        }
    }
    
    /**
     * Reload questions from appropriate source (useful for Lambda cold starts)
     */
    public void reloadQuestions() {
        logger.info("Reloading all questions from {} using {} mode", questionsBasePath, isLocalMode ? "filesystem" : "classpath");
        questionsCache.clear();
        availableYearsByLevel.clear();
        loadAllQuestions();
    }
    
    /**
     * Get questions by AMC type and year (backward compatibility)
     */
    public List<Question> getQuestionsByAMCAndYear(String amcType, String year) {
        if (isLocalMode) {
            return loadQuestionsFromFile(amcType, year);
        } else {
            return loadQuestionsFromResource(amcType, year);
        }
    }
} 