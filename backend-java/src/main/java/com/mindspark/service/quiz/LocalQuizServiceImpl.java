package com.mindspark.service.quiz;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindspark.model.Question;
import com.mindspark.model.QuizProgress;
import com.mindspark.service.QuestionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Inject;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class LocalQuizServiceImpl implements QuizService {
    private static final Logger logger = LoggerFactory.getLogger(LocalQuizServiceImpl.class);
    private static final String QUIZ_BASE_PATH = "/tmp";
    private static final String QUIZ_PROGRESS_FILE_NAME = "QuizProgress.json";
    
    // Pattern to parse quiz question set IDs like "2015_AMC_8" or "2004_AMC_10B"
    private static final Pattern QUIZ_SET_PATTERN = Pattern.compile("(\\d{4})_AMC_(\\d+)([AB]?)");
    
    private final ObjectMapper objectMapper;
    private final QuestionService questionService;
    
    @Inject
    public LocalQuizServiceImpl(ObjectMapper objectMapper, QuestionService questionService) {
        this.objectMapper = objectMapper;
        this.questionService = questionService;
        
        logger.info("Initialized LocalQuizServiceImpl with file-based storage at {}", QUIZ_BASE_PATH);
    }
    
    @Override
    public QuizProgress createStandardQuiz(String userId, String quizQuestionSetId, String quizId, String quizName) {
        if (userId == null || userId.trim().isEmpty()) {
            throw new IllegalArgumentException("userId cannot be null or empty");
        }
        if (quizQuestionSetId == null || quizQuestionSetId.trim().isEmpty()) {
            throw new IllegalArgumentException("quizQuestionSetId cannot be null or empty");
        }
        if (quizName == null || quizName.trim().isEmpty()) {
            throw new IllegalArgumentException("quizName cannot be null or empty");
        }
        
        try {
            // Load questions using the refactored method
            List<Question> questions = getQuestionsByQuestionSetId(quizQuestionSetId);
            if (questions.isEmpty()) {
                throw new RuntimeException("No questions found for " + quizQuestionSetId);
            }
            
            // Initialize questionIdToAnswer map with question IDs as keys and null values
            Map<String, String> questionIdToAnswer = new HashMap<>();
            for (Question question : questions) {
                questionIdToAnswer.put(question.getId(), null);
            }
            
            // Generate unique quiz ID and create QuizProgress
            String quizType = "standardAMC";
            
            QuizProgress quizProgress = new QuizProgress(
                quizId, 
                quizType,
                quizQuestionSetId, // Store the original question set ID
                LocalDateTime.now(), 
                questionIdToAnswer,
                quizName
            );
            
            // Save to file
            saveQuizProgress(userId, quizId, quizProgress);
            
            logger.info("Created standard quiz {} ({}) for user {} with {} questions from {}", 
                quizId, quizName, userId, questions.size(), quizQuestionSetId);
            
            return quizProgress;
            
        } catch (Exception e) {
            logger.error("Failed to create standard quiz for user {} with set {}: {}", 
                userId, quizQuestionSetId, e.getMessage(), e);
            throw new RuntimeException("Failed to create standard quiz", e);
        }
    }

    @Override
    public QuizProgress createPersonalizedQuiz(String userId, String quizId, String quizName) {
        // Implementation for later
        throw new UnsupportedOperationException("Personalized quiz creation not yet implemented");
    }

    @Override
    public Map<String, QuizProgress> listQuiz(String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            throw new IllegalArgumentException("userId cannot be null or empty");
        }
        
        Map<String, QuizProgress> quizzes = new HashMap<>();
        Path userDir = Paths.get(QUIZ_BASE_PATH, userId);
        
        if (!Files.exists(userDir)) {
            logger.debug("No quiz directory found for user {}, returning empty map", userId);
            return quizzes;
        }
        
        try {
            Files.list(userDir)
                .filter(Files::isDirectory)
                .forEach(quizDir -> {
                    String quizId = quizDir.getFileName().toString();
                    Path quizProgressFile = quizDir.resolve(QUIZ_PROGRESS_FILE_NAME);
                    
                    if (Files.exists(quizProgressFile)) {
                        try {
                            QuizProgress quizProgress = loadQuizProgress(quizProgressFile);
                            if (quizProgress != null) {
                                quizzes.put(quizId, quizProgress);
                                logger.debug("Loaded quiz {} for user {}", quizId, userId);
                            }
                        } catch (Exception e) {
                            logger.warn("Failed to load quiz {} for user {}: {}", 
                                      quizId, userId, e.getMessage());
                        }
                    }
                });
            
            logger.debug("Found {} quizzes for user {}", quizzes.size(), userId);
        } catch (Exception e) {
            logger.error("Failed to list quizzes for user {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Failed to list quizzes", e);
        }
        
        return quizzes;
    }

    @Override
    public void updateQuizProgress(String userId, String quizId, QuizProgress quizProgress) {
        if (userId == null || userId.trim().isEmpty()) {
            throw new IllegalArgumentException("userId cannot be null or empty");
        }
        if (quizId == null || quizId.trim().isEmpty()) {
            throw new IllegalArgumentException("quizId cannot be null or empty");
        }
        if (quizProgress == null) {
            throw new IllegalArgumentException("quizProgress cannot be null");
        }
        
        try {
            // Create updated QuizProgress with current timestamp
            QuizProgress updatedProgress = new QuizProgress(
                quizProgress.getQuizId(),
                quizProgress.getQuizType(),
                quizProgress.getQuestionSetId(),
                LocalDateTime.now(),
                quizProgress.getQuestionIdToAnswer(),
                quizProgress.getQuizName()
            );
            
            saveQuizProgress(userId, quizId, updatedProgress);
            logger.debug("Updated quiz progress for user {} quiz {}", userId, quizId);
        } catch (Exception e) {
            logger.error("Failed to update quiz progress for user {} quiz {}: {}", 
                        userId, quizId, e.getMessage(), e);
            throw new RuntimeException("Failed to update quiz progress", e);
        }
    }
    
    /**
     * Get questions for an existing quiz by loading the quiz progress and reconstructing the question set
     */
    public List<Question> getQuestionsByQuizId(String userId, String quizId) {
        if (userId == null || userId.trim().isEmpty()) {
            throw new IllegalArgumentException("userId cannot be null or empty");
        }
        if (quizId == null || quizId.trim().isEmpty()) {
            throw new IllegalArgumentException("quizId cannot be null or empty");
        }
        
        try {
            // Load the quiz progress from file
            Path quizProgressFile = Paths.get(QUIZ_BASE_PATH, userId, quizId, QUIZ_PROGRESS_FILE_NAME);
            if (!Files.exists(quizProgressFile)) {
                throw new RuntimeException("Quiz not found: " + quizId + " for user: " + userId);
            }
            
            QuizProgress quizProgress = loadQuizProgress(quizProgressFile);
            
            // Use the stored question set ID to reload questions
            if (quizProgress.getQuestionSetId() != null) {
                return getQuestionsByQuestionSetId(quizProgress.getQuestionSetId());
            } else {
                // Fallback: if no question set ID is stored, we can't reconstruct the questions
                // This might happen with older quiz data
                logger.warn("No questionSetId found for quiz {} of user {}, cannot reconstruct questions", quizId, userId);
                throw new RuntimeException("Cannot reconstruct questions for quiz: no question set ID available");
            }
            
        } catch (Exception e) {
            logger.error("Failed to get questions for quiz {} of user {}: {}", quizId, userId, e.getMessage(), e);
            throw new RuntimeException("Failed to get questions for quiz", e);
        }
    }
    
    /**
     * Load questions by question set ID (refactored from createStandardQuiz)
     */
    private List<Question> getQuestionsByQuestionSetId(String quizQuestionSetId) {
        // Parse the quiz question set ID to extract year and type
        Matcher matcher = QUIZ_SET_PATTERN.matcher(quizQuestionSetId);
        if (!matcher.matches()) {
            throw new IllegalArgumentException("Invalid quizQuestionSetId format: " + quizQuestionSetId + 
                ". Expected format like '2015_AMC_8' or '2004_AMC_10B'");
        }
        
        String year = matcher.group(1);
        String amcLevel = matcher.group(2);
        String variant = matcher.group(3); // A, B, or empty
        
        // Map AMC type to level
        int level = mapAMCToLevel(amcLevel);
        
        // Construct the year version for QuestionService
        String yearVersion = year + (variant != null ? variant : "");
        
        // Load questions using QuestionService
        List<Question> questions = questionService.getQuestionsByLevelAndYear(level, yearVersion);
        
        logger.debug("Loaded {} questions for question set {}", questions.size(), quizQuestionSetId);
        return questions;
    }
    
    /**
     * Map AMC level string to integer level for QuestionService
     */
    private int mapAMCToLevel(String amcLevel) {
        switch (amcLevel) {
            case "8":
                return 1;
            case "10":
                return 2;
            case "12":
                return 3;
            default:
                throw new IllegalArgumentException("Unsupported AMC level: " + amcLevel);
        }
    }
    
    /**
     * Save quiz progress to file
     */
    private void saveQuizProgress(String userId, String quizId, QuizProgress quizProgress) throws IOException {
        Path quizDir = Paths.get(QUIZ_BASE_PATH, userId, quizId);
        Files.createDirectories(quizDir);
        
        Path quizProgressFile = quizDir.resolve(QUIZ_PROGRESS_FILE_NAME);
        objectMapper.writeValue(quizProgressFile.toFile(), quizProgress);
        
        logger.debug("Saved quiz progress for user {} quiz {} to {}", userId, quizId, quizProgressFile);
    }
    
    /**
     * Load quiz progress from file
     */
    private QuizProgress loadQuizProgress(Path quizProgressFile) throws IOException {
        return objectMapper.readValue(quizProgressFile.toFile(), QuizProgress.class);
    }
}
