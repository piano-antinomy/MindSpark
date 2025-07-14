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
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Singleton
public class CacheBackedQuestionServiceImpl implements QuestionService {
    
    private static final int DEFAULT_HIGHEST_LEVEL = 3;
    private static final Logger logger = LoggerFactory.getLogger(CacheBackedQuestionServiceImpl.class);
    private final ObjectMapper objectMapper;
    private final Map<Integer, List<Question>> questionsCache = new ConcurrentHashMap<>();
    private final String questionsBasePath = "questions";
    private final String defaultSubject = "math";
    
    @Inject
    public CacheBackedQuestionServiceImpl(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        loadAllQuestions();
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
    
    private void loadAllQuestions() {
        logger.info("Loading all questions from {}/{}", questionsBasePath, defaultSubject);
        
        for (int level = 1; level <= DEFAULT_HIGHEST_LEVEL; level++) {
            loadQuestionsForLevel(level);
        }
        
        logger.info("Loaded questions for {} levels", questionsCache.size());
    }
    
    private void loadQuestionsForLevel(int level) {
        String levelPath = questionsBasePath + "/" + defaultSubject + "/level-" + level;
        File levelDir = new File(levelPath);
        
        if (!levelDir.exists() || !levelDir.isDirectory()) {
            logger.warn("Level directory does not exist: {}", levelPath);
            return;
        }
        
        List<Question> allQuestionsForLevel = new ArrayList<>();
        File[] jsonFiles = levelDir.listFiles((dir, name) -> name.endsWith(".json"));
        
        if (jsonFiles != null) {
            for (File jsonFile : jsonFiles) {
                try {
                    logger.debug("Loading questions from: {}", jsonFile.getName());
                    QuestionFile questionFile = objectMapper.readValue(jsonFile, QuestionFile.class);
                    List<Question> questions = questionFile.getProblems();
                    if (questions != null) {
                        allQuestionsForLevel.addAll(questions);
                        logger.debug("Loaded {} questions from {}", questions.size(), jsonFile.getName());
                    } else {
                        logger.warn("No problems found in file: {}", jsonFile.getName());
                    }
                } catch (IOException e) {
                    logger.error("Error loading questions from file: {}", jsonFile.getName(), e);
                }
            }
        }
        
        questionsCache.put(level, allQuestionsForLevel);
        logger.info("Loaded {} questions for level {}", allQuestionsForLevel.size(), level);
    }
    
    /**
     * Reload questions from files (useful for updating questions without restart)
     */
    public void reloadQuestions() {
        logger.info("Reloading all questions");
        questionsCache.clear();
        loadAllQuestions();
    }
    
    /**
     * Load questions for a specific subject and level (for future multi-subject support)
     * @param subject The subject (e.g., "math", "science")
     * @param level The difficulty level
     * @return List of questions for the subject and level
     */
    public List<Question> loadQuestionsForSubjectAndLevel(String subject, int level) {
        String levelPath = questionsBasePath + "/" + subject + "/level-" + level;
        File levelDir = new File(levelPath);
        
        if (!levelDir.exists() || !levelDir.isDirectory()) {
            logger.warn("Level directory does not exist for subject {}: {}", subject, levelPath);
            return Collections.emptyList();
        }
        
        List<Question> questions = new ArrayList<>();
        File[] jsonFiles = levelDir.listFiles((dir, name) -> name.endsWith(".json"));
        
        if (jsonFiles != null) {
            for (File jsonFile : jsonFiles) {
                try {
                    logger.debug("Loading {} questions from: {}", subject, jsonFile.getName());
                    List<Question> fileQuestions = objectMapper.readValue(
                        jsonFile, 
                        new TypeReference<List<Question>>() {}
                    );
                    questions.addAll(fileQuestions);
                    logger.debug("Loaded {} questions from {}", fileQuestions.size(), jsonFile.getName());
                } catch (IOException e) {
                    logger.error("Error loading {} questions from file: {}", subject, jsonFile.getName(), e);
                }
            }
        }
        
        logger.info("Loaded {} questions for {} level {}", questions.size(), subject, level);
        return questions;
    }
} 