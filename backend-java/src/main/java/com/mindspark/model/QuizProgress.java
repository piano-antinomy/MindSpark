package com.mindspark.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Map;

/**
 * Individual quiz progress tracking
 */
@DynamoDbBean
public class QuizProgress {
    
    private String userId;
    private String quizId;
    private String quizType;
    private String questionSetId;
    private LocalDateTime lastActivity;
    private String quizName;
    private Map<String, String> questionIdToAnswer;
    private int quizScore;

    // Primary constructor with all fields including userId
    public QuizProgress(String userId, String quizId, String quizType, String questionSetId, String quizName, LocalDateTime lastActivity, Map<String, String> questionIdToAnswer, int quizScore) {
        this.userId = userId;
        this.quizId = quizId;
        this.quizType = quizType;
        this.questionSetId = questionSetId;
        this.quizName = quizName;
        this.lastActivity = lastActivity;
        this.questionIdToAnswer = questionIdToAnswer != null ? questionIdToAnswer : Collections.emptyMap();
        this.quizScore = quizScore;
    }

    // Constructor for creating new quiz progress
    public QuizProgress(String userId, String quizId, String quizName) {
        this.userId = userId;
        this.quizId = quizId;
        this.quizName = quizName;
        this.lastActivity = LocalDateTime.now();
        this.questionIdToAnswer = Collections.emptyMap();
        this.quizScore = 0;
    }

    // Default constructor for JSON deserialization
    public QuizProgress() {
        this.questionIdToAnswer = Collections.emptyMap();
        this.quizScore = 0;
    }

    // DynamoDB Key attributes
    @DynamoDbPartitionKey
    @DynamoDbAttribute("userId")
    @JsonProperty("userId")
    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    @DynamoDbSortKey
    @DynamoDbAttribute("sortKey")
    @JsonProperty("quizId")
    public String getQuizId() {
        return quizId;
    }

    // Regular attributes
    @DynamoDbAttribute("quizType")
    @JsonProperty("quizType")
    public String getQuizType() {
        return quizType;
    }

    @DynamoDbAttribute("questionSetId")
    @JsonProperty("questionSetId")
    public String getQuestionSetId() {
        return questionSetId;
    }

    @DynamoDbAttribute("lastActivity")
    @JsonProperty("lastActivity")
    public LocalDateTime getLastActivity() {
        return lastActivity;
    }

    @DynamoDbAttribute("quizName")
    @JsonProperty("quizName")
    public String getQuizName() {
        return quizName;
    }

    @DynamoDbAttribute("questionIdToAnswer")
    @JsonProperty("questionIdToAnswer")
    public Map<String, String> getQuestionIdToAnswer() {
        return questionIdToAnswer;
    }

    @DynamoDbAttribute("quizScore")
    @JsonProperty("quizScore")
    public int getQuizScore() {
        return quizScore;
    }

    // Setter methods for JSON deserialization
    public void setQuizId(String quizId) {
        this.quizId = quizId;
    }

    public void setQuizType(String quizType) {
        this.quizType = quizType;
    }

    public void setQuestionSetId(String questionSetId) {
        this.questionSetId = questionSetId;
    }

    public void setLastActivity(LocalDateTime lastActivity) {
        this.lastActivity = lastActivity;
    }

    public void setQuizName(String quizName) {
        this.quizName = quizName;
    }

    public void setQuestionIdToAnswer(Map<String, String> questionIdToAnswer) {
        this.questionIdToAnswer = questionIdToAnswer != null ? questionIdToAnswer : Collections.emptyMap();
    }

    public void setQuizScore(int quizScore) {
        this.quizScore = quizScore;
    }

    /**
     * Get the count of questions that have been answered (non-null values)
     */
    public int getQuestionsAnswered() {
        if (questionIdToAnswer == null) {
            return 0;
        }
        return (int) questionIdToAnswer.values().stream()
            .filter(answer -> answer != null && !answer.trim().isEmpty())
            .count();
    }

    /**
     * Check if the quiz is completed (all questions have answers)
     */
    public boolean isCompleted() {
        if (questionIdToAnswer == null || questionIdToAnswer.isEmpty()) {
            return false;
        }
        return questionIdToAnswer.values().stream()
            .allMatch(answer -> answer != null && !answer.trim().isEmpty());
    }

    /**
     * Get the completion percentage (0-100)
     * For now, this returns the percentage of questions answered.
     * In the future, this could be enhanced to calculate actual score percentage.
     */
    public int getScorePercentage() {
        if (questionIdToAnswer == null || questionIdToAnswer.isEmpty()) {
            return 0;
        }
        int totalQuestions = questionIdToAnswer.size();
        int answeredQuestions = getQuestionsAnswered();
        return (int) Math.round((double) answeredQuestions / totalQuestions * 100.0);
    }
}