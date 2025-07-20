package com.mindspark.service.progress;

import com.mindspark.config.LocalMode;
import com.mindspark.model.Progress;
import com.mindspark.model.QuizProgress;
import com.mindspark.model.Question;
import com.mindspark.service.QuestionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Inject;
import javax.inject.Singleton;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

/**
 * Local cache-based implementation of progress tracking service
 * Uses in-memory storage with thread-safe operations
 */
@Singleton
public class LocalCacheBasedProgressTrackServiceImpl implements ProgressTrackService {
    
    private static final Logger logger = LoggerFactory.getLogger(LocalCacheBasedProgressTrackServiceImpl.class);
    
    /**
     * In-memory cache of user progress data
     * Key: userId, Value: Progress object
     */
    private final Map<String, Progress> progressCache = new ConcurrentHashMap<>();
    
    /**
     * Cache for quiz metadata (total questions per quiz)
     * Key: quizId, Value: total question count
     */
    private final Map<String, Integer> quizMetadataCache = new ConcurrentHashMap<>();
    
    private final QuestionService questionService;
    private final boolean isLocalMode;
    
    @Inject
    public LocalCacheBasedProgressTrackServiceImpl(QuestionService questionService, @LocalMode Boolean isLocalMode) {
        this.questionService = questionService;
        this.isLocalMode = isLocalMode;
        
        logger.info("Initializing LocalCacheBasedProgressTrackService in {} mode", 
                   isLocalMode ? "LOCAL" : "PRODUCTION");
        
        // Pre-populate quiz metadata cache
        initializeQuizMetadataCache();
    }
    
    @Override
    public void trackProgress(String userId, String questionId, String answer) {
        if (userId == null || questionId == null) {
            logger.warn("Cannot track progress: userId or questionId is null");
            return;
        }
        
        logger.debug("Tracking progress for user: {}, question: {}, answer: {}", userId, questionId, answer);
        
        // Extract quizId from questionId (assuming format like "2016_AMC_8_Q1")
        String quizId = extractQuizIdFromQuestionId(questionId);
        if (quizId == null) {
            logger.warn("Cannot extract quizId from questionId: {}", questionId);
            return;
        }
        
        // Get or create user progress
        Progress userProgress = progressCache.computeIfAbsent(userId, Progress::new);
        
        // Get or create quiz progress
        QuizProgress quizProgress = userProgress.getOrCreateQuizProgress(quizId);
        
        // Get correct answer for scoring
        String correctAnswer = getCorrectAnswerForQuestion(questionId, quizId);
        
        // Add the answer to quiz progress
        quizProgress.addAnswer(questionId, answer, correctAnswer);
        
        // Set total questions for the quiz if not already set
        if (quizProgress.getTotalQuestions() == 0) {
            int totalQuestions = getTotalQuestionsForQuiz(quizId);
            quizProgress.setTotalQuestionsAndRecalculate(totalQuestions);
        }
        
        // Check if quiz is completed (all questions answered)
        if (!quizProgress.isCompleted() && 
            quizProgress.getQuestionsAnswered() >= quizProgress.getTotalQuestions() &&
            quizProgress.getTotalQuestions() > 0) {
            quizProgress.markCompleted();
            logger.info("Quiz {} completed by user {}", quizId, userId);
        }
        
        // Update user's last activity and recalculate aggregated stats
        userProgress.updateLastActivity();
        userProgress.recalculateAggregatedStats();
        
        logger.debug("Progress updated for user {}: {} questions answered in quiz {}", 
                    userId, quizProgress.getQuestionsAnswered(), quizId);
    }
    
    @Override
    public Progress getProgress(String userId) {
        if (userId == null) {
            logger.warn("Cannot get progress: userId is null");
            return new Progress();
        }
        
        Progress userProgress = progressCache.get(userId);
        if (userProgress == null) {
            logger.debug("No progress found for user: {}, returning empty progress", userId);
            return new Progress(userId);
        }
        
        // Ensure aggregated stats are up to date
        userProgress.recalculateAggregatedStats();
        
        logger.debug("Retrieved progress for user {}: {} total questions answered, {} quizzes completed", 
                    userId, userProgress.getTotalQuestionsAnswered(), userProgress.getTotalQuizzesCompleted());
        
        return userProgress;
    }
    
    /**
     * Get progress for a specific quiz
     */
    public QuizProgress getQuizProgress(String userId, String quizId) {
        if (userId == null || quizId == null) {
            return new QuizProgress(quizId);
        }
        
        Progress userProgress = progressCache.get(userId);
        if (userProgress != null) {
            return userProgress.getQuizProgress().getOrDefault(quizId, new QuizProgress(quizId));
        }
        
        return new QuizProgress(quizId);
    }
    
    /**
     * Check if user has answered a specific question
     */
    public boolean hasUserAnsweredQuestion(String userId, String questionId) {
        String quizId = extractQuizIdFromQuestionId(questionId);
        if (quizId == null) return false;
        
        QuizProgress quizProgress = getQuizProgress(userId, quizId);
        return quizProgress.hasAnswered(questionId);
    }
    
    /**
     * Get user's answer for a specific question
     */
    public String getUserAnswerForQuestion(String userId, String questionId) {
        String quizId = extractQuizIdFromQuestionId(questionId);
        if (quizId == null) return null;
        
        QuizProgress quizProgress = getQuizProgress(userId, quizId);
        return quizProgress.getUserAnswer(questionId);
    }
    
    /**
     * Reset progress for a specific quiz (useful for retaking quizzes)
     */
    public void resetQuizProgress(String userId, String quizId) {
        if (userId == null || quizId == null) {
            logger.warn("Cannot reset quiz progress: userId or quizId is null");
            return;
        }
        
        Progress userProgress = progressCache.get(userId);
        if (userProgress != null) {
            userProgress.getQuizProgress().remove(quizId);
            userProgress.recalculateAggregatedStats();
            logger.info("Reset quiz progress for user {} and quiz {}", userId, quizId);
        }
    }
    
    /**
     * Clear all progress for a user (useful for testing or user reset)
     */
    public void clearUserProgress(String userId) {
        if (userId != null) {
            progressCache.remove(userId);
            logger.info("Cleared all progress for user {}", userId);
        }
    }
    
    /**
     * Get all users with progress (for admin purposes)
     */
    public Map<String, Progress> getAllUserProgress() {
        return new ConcurrentHashMap<>(progressCache);
    }
    
    /**
     * Extract quizId from questionId
     * Examples: "2016_AMC_8_Q1" -> "2016_AMC_8", "level_quiz_amc_10_Q5" -> "level_quiz_amc_10"
     */
    private String extractQuizIdFromQuestionId(String questionId) {
        if (questionId == null) return null;
        
        // Remove question number suffix (e.g., "_Q1", "_Q25")
        if (questionId.matches(".*_Q\\d+$")) {
            return questionId.replaceAll("_Q\\d+$", "");
        }
        
        // If no question number pattern, try to extract based on known patterns
        if (questionId.contains("_AMC_")) {
            // Pattern: year_AMC_level_something -> year_AMC_level
            String[] parts = questionId.split("_");
            if (parts.length >= 3) {
                return parts[0] + "_" + parts[1] + "_" + parts[2];
            }
        }
        
        // Default: return the questionId as quizId (might not be ideal but safe)
        return questionId;
    }
    
    /**
     * Get correct answer for a question by looking it up in the question service
     */
    private String getCorrectAnswerForQuestion(String questionId, String quizId) {
        try {
            // Extract level and year from quizId to query questions
            String[] parts = quizId.split("_");
            if (parts.length >= 3) {
                String year = parts[0];
                String amcType = parts[1] + "_" + parts[2]; // e.g., "AMC_8"
                
                // Map AMC type to level
                int level = mapAMCTypeToLevel(amcType);
                if (level > 0) {
                    List<Question> questions = questionService.getQuestionsByLevelAndYear(level, year);
                    
                    // Find the question with matching ID
                    for (Question question : questions) {
                        if (questionId.equals(question.getId())) {
                            return question.getAnswer();
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("Error getting correct answer for question {}: {}", questionId, e.getMessage());
        }
        
        return null; // If we can't find the correct answer
    }
    
    /**
     * Get total number of questions for a quiz
     */
    private int getTotalQuestionsForQuiz(String quizId) {
        return quizMetadataCache.computeIfAbsent(quizId, this::calculateTotalQuestionsForQuiz);
    }
    
    /**
     * Calculate total questions for a quiz by querying the question service
     */
    private int calculateTotalQuestionsForQuiz(String quizId) {
        try {
            String[] parts = quizId.split("_");
            if (parts.length >= 3) {
                String year = parts[0];
                String amcType = parts[1] + "_" + parts[2];
                
                int level = mapAMCTypeToLevel(amcType);
                if (level > 0) {
                    List<Question> questions = questionService.getQuestionsByLevelAndYear(level, year);
                    return questions.size();
                }
            }
        } catch (Exception e) {
            logger.warn("Error calculating total questions for quiz {}: {}", quizId, e.getMessage());
        }
        
        return 25; // Default assumption for AMC competitions
    }
    
    /**
     * Map AMC type to level number
     */
    private int mapAMCTypeToLevel(String amcType) {
        switch (amcType) {
            case "AMC_8": return 1;
            case "AMC_10": return 2;
            case "AMC_12": return 3;
            default: return 0;
        }
    }
    
    /**
     * Initialize quiz metadata cache with known quiz information
     */
    private void initializeQuizMetadataCache() {
        try {
            // Get available levels and years from question service
            List<Integer> levels = questionService.getAvailableLevels();
            
            for (int level : levels) {
                List<String> years = questionService.getAvailableYearsByLevel(level);
                String amcType = questionService.getAMCTypeByLevel(level);
                
                for (String year : years) {
                    String quizId = year + "_" + amcType;
                    int totalQuestions = questionService.getQuestionsByLevelAndYear(level, year).size();
                    quizMetadataCache.put(quizId, totalQuestions);
                    
                    logger.debug("Cached metadata for quiz {}: {} questions", quizId, totalQuestions);
                }
            }
            
            logger.info("Initialized quiz metadata cache with {} entries", quizMetadataCache.size());
        } catch (Exception e) {
            logger.error("Error initializing quiz metadata cache: {}", e.getMessage(), e);
        }
    }
} 