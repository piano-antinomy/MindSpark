package com.mindspark.service.progress;

import com.google.inject.Inject;
import com.mindspark.config.AppConfig;
import com.mindspark.model.Progress;
import com.mindspark.model.Question;
import com.mindspark.model.QuizProgress;
import com.mindspark.service.quiz.QuizService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryEnhancedRequest;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DDBBackedProgressTrackingServiceImpl implements ProgressTrackService {
    private final Logger logger = LoggerFactory.getLogger(DDBBackedProgressTrackingServiceImpl.class);
    private final DynamoDbTable<QuizProgress> userProgressTable;
    private final QuizService quizService;

    @Inject
    public DDBBackedProgressTrackingServiceImpl(
        final DynamoDbEnhancedClient dynamoDbEnhancedClient,
        final QuizService quizService) {
        this.userProgressTable = dynamoDbEnhancedClient.table(
                AppConfig.UNIFIED_DDB_TABLE_NAME, TableSchema.fromBean(QuizProgress.class));
        this.quizService = quizService;
    }

    @Override
    public void trackProgress(String userId, String quizId, Map<String, String> questionIdToAnswer, int timeSpent) {
        try {
            // Try to get existing progress for this user and quiz
            QuizProgress existingProgress = userProgressTable.getItem(
                    r -> r.key(k -> k.partitionValue(userId).sortValue(quizId)));

            if (existingProgress == null) {
                throw new RuntimeException("Quiz progress not found for user: " + userId + " quiz: " + quizId);
            }

            // Update existing progress
            Map<String, String> updatedQuestionIdToAnswer = existingProgress.getQuestionIdToAnswer();
            
            // only update the questions that were answered in this call
            updatedQuestionIdToAnswer.putAll(questionIdToAnswer);

            existingProgress.setQuestionIdToAnswer(updatedQuestionIdToAnswer);
            existingProgress.setLastActivity(LocalDateTime.now(ZoneOffset.UTC));
            existingProgress.setTimeSpent(timeSpent);

            existingProgress.setQuizScore(figureQuizScore(userId, quizId, updatedQuestionIdToAnswer));
            userProgressTable.updateItem(existingProgress);
            logger.info("Updated progress for user: {} quiz: {} timeSpent: {}", userId, quizId, timeSpent);
            
        } catch (Exception e) {
            logger.error("Error tracking progress for user: {} quiz: {}", userId, quizId, e);
            throw new RuntimeException("Failed to track progress", e);
        }
    }

    private int figureQuizScore(String userId, String quizId, Map<String, String> updatedQuestionIdToAnswer) {
        List<Question> questions = quizService.getQuestionsByQuizId(userId, quizId);
        int score = 0;

        for (Question question : questions) {
            String userAnswer = updatedQuestionIdToAnswer.get(question.getId());
            if (userAnswer != null && userAnswer.equals(question.getAnswer())) {
                score += 4;
            }
        }

        logger.info("Score for user: {} quiz: {} = {}", userId, quizId, score);
        return score;
    }

    @Override
    public Progress getProgress(String userId) {
        try {
            // Query all quiz progress records for the user
            QueryEnhancedRequest queryRequest = QueryEnhancedRequest.builder()
                    .queryConditional(QueryConditional.keyEqualTo(k -> k.partitionValue(userId)))
                    .build();

            Map<String, QuizProgress> quizProgressMap = new HashMap<>();
            
            userProgressTable.query(queryRequest)
                    .stream()
                    .forEach(page -> page.items()
                    .forEach(quizProgress -> {
                        quizProgressMap.put(quizProgress.getQuizId(), quizProgress);
                    }));

            logger.info("Retrieved {} quiz progress records for user: {}", quizProgressMap.size(), userId);
            return new Progress(userId, quizProgressMap);
            
        } catch (Exception e) {
            logger.error("Error retrieving progress for user: {}", userId, e);
            throw new RuntimeException("Failed to retrieve progress", e);
        }
    }

    @Override
    public QuizProgress getProgress(String userId, String quizId) {
        // Retrieve the progress for the specified user and quiz
        return userProgressTable.getItem(
                r -> r.key(k -> k.partitionValue(userId).sortValue(quizId)));
    }
}
