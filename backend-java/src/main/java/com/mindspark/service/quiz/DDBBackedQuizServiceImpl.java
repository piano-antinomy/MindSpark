package com.mindspark.service.quiz;

import com.mindspark.config.AppConfig;
import com.mindspark.model.Question;
import com.mindspark.model.QuizProgress;
import com.mindspark.service.QuestionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryEnhancedRequest;

import javax.inject.Inject;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class DDBBackedQuizServiceImpl implements QuizService {
    private static final Logger logger = LoggerFactory.getLogger(DDBBackedQuizServiceImpl.class);
    
    // Pattern to parse quiz question set IDs like "2015_AMC_8" or "2004_AMC_10B"
    private static final Pattern QUIZ_SET_PATTERN = Pattern.compile("(\\d{4})_AMC_(\\d+)([AB]?)");
    
    private final QuestionService questionService;
    private final DynamoDbTable<QuizProgress> userProgressTable;
    
    @Inject
    public DDBBackedQuizServiceImpl(
            final DynamoDbEnhancedClient dynamoDbEnhancedClient,
            final QuestionService questionService) {
        this.userProgressTable = dynamoDbEnhancedClient.table(
                AppConfig.UNIFIED_DDB_TABLE_NAME, TableSchema.fromBean(QuizProgress.class));
        this.questionService = questionService;
        
        logger.info("Initialized DDBBackedQuizServiceImpl with DynamoDB storage");
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
            // Check if quiz already exists
            QuizProgress existingQuiz = userProgressTable.getItem(
                    r -> r.key(k -> k.partitionValue(userId).sortValue(quizId)));
            
            if (existingQuiz != null) {
                logger.warn("Quiz {} already exists for user {}", quizId, userId);
                return existingQuiz;
            }
            
            // Load questions using the refactored method
            List<Question> questions = getQuestionsByQuestionSetId(quizQuestionSetId);
            if (questions.isEmpty()) {
                throw new RuntimeException("No questions found for " + quizQuestionSetId);
            }
            
            // Initialize questionIdToAnswer to an empty map
            Map<String, String> questionIdToAnswer = Collections.emptyMap();
            
            // Generate unique quiz ID and create QuizProgress
            String quizType = "standardAMC";
            
            QuizProgress quizProgress = new QuizProgress(
                userId,
                quizId, 
                quizType,
                quizQuestionSetId, // Store the original question set ID
                quizName,
                LocalDateTime.now(), 
                questionIdToAnswer,
                0 // Initial score
            );
            
            // Save to DynamoDB
            userProgressTable.putItem(quizProgress);
            
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
        
        try {
            // Query all quiz progress records for the user
            QueryEnhancedRequest queryRequest = QueryEnhancedRequest.builder()
                    .queryConditional(QueryConditional.keyEqualTo(k -> k.partitionValue(userId)))
                    .build();

            Map<String, QuizProgress> quizzes = new HashMap<>();
            
            userProgressTable.query(queryRequest)
                    .stream()
                    .forEach(page -> page.items()
                    .forEach(quizProgress -> {
                        if (quizProgress.getQuizId() == null || !quizProgress.getQuizId().contains("quiz")) {
                            logger.info("user {} has no quizId", userId);
                        } else {
                            quizzes.put(quizProgress.getQuizId(), quizProgress);
                        }
                    }));

            logger.info("Found {} quizzes for user {}", quizzes.size(), userId);
            return quizzes;
            
        } catch (Exception e) {
            logger.error("Failed to list quizzes for user {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Failed to list quizzes", e);
        }
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
            // Check if quiz exists
            QuizProgress existingQuiz = userProgressTable.getItem(
                    r -> r.key(k -> k.partitionValue(userId).sortValue(quizId)));
            
            if (existingQuiz == null) {
                throw new RuntimeException("Quiz not found: " + quizId + " for user: " + userId);
            }
            
            // Update the existing quiz progress
            existingQuiz.setQuestionIdToAnswer(quizProgress.getQuestionIdToAnswer());
            existingQuiz.setLastActivity(LocalDateTime.now());
            existingQuiz.setQuizScore(quizProgress.getQuizScore());
            
            userProgressTable.updateItem(existingQuiz);
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
    @Override
    public List<Question> getQuestionsByQuizId(String userId, String quizId) {
        if (userId == null || userId.trim().isEmpty()) {
            throw new IllegalArgumentException("userId cannot be null or empty");
        }
        if (quizId == null || quizId.trim().isEmpty()) {
            throw new IllegalArgumentException("quizId cannot be null or empty");
        }
        
        try {
            // Load the quiz progress from DynamoDB
            QuizProgress quizProgress = userProgressTable.getItem(
                    r -> r.key(k -> k.partitionValue(userId).sortValue(quizId)));
            
            if (quizProgress == null) {
                throw new RuntimeException("Quiz not found: " + quizId + " for user: " + userId);
            }
            
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
}
