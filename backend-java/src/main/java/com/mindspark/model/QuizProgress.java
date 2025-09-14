package com.mindspark.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.Map;

/**
 * Individual quiz progress tracking
 */
@DynamoDbBean
public class QuizProgress {
    
    private String userId;
    private String quizId;
    private QuizType quizType;
    private String questionSetId;
    private LocalDateTime startTime;
    private LocalDateTime lastActivity;
    private String quizName;
    private Map<String, String> questionIdToAnswer;
    private int quizScore;
    private boolean completed;
    private int totalQuestions;

    // Primary constructor with all fields including userId
    public QuizProgress(String userId, String quizId, QuizType quizType, String questionSetId, String quizName, LocalDateTime startTime, LocalDateTime lastActivity, Map<String, String> questionIdToAnswer, int quizScore) {
        this.userId = userId;
        this.quizId = quizId;
        this.quizType = quizType;
        this.questionSetId = questionSetId;
        this.quizName = quizName;
        this.startTime = startTime;
        this.lastActivity = lastActivity;
        this.questionIdToAnswer = questionIdToAnswer != null ? questionIdToAnswer : Collections.emptyMap();
        this.quizScore = quizScore;
        this.completed = false;
        this.totalQuestions = 25; // Default for AMC quizzes
    }

    // Constructor for creating new quiz progress
    public QuizProgress(String userId, String quizId, String quizName) {
        this.userId = userId;
        this.quizId = quizId;
        this.quizName = quizName;
        this.startTime = LocalDateTime.now(ZoneOffset.UTC);
        this.lastActivity = LocalDateTime.now(ZoneOffset.UTC);
        this.questionIdToAnswer = Collections.emptyMap();
        this.quizScore = 0;
        this.completed = false;
        this.totalQuestions = 25; // Default for AMC quizzes
    }

    // Default constructor for JSON deserialization
    public QuizProgress() {
        this.questionIdToAnswer = Collections.emptyMap();
        this.quizScore = 0;
        this.completed = false;
        this.totalQuestions = 25; // Default for AMC quizzes
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
        return quizType != null ? quizType.getValue() : null;
    }

    @DynamoDbAttribute("questionSetId")
    @JsonProperty("questionSetId")
    public String getQuestionSetId() {
        return questionSetId;
    }

    @DynamoDbAttribute("startTime")
    @JsonProperty("startTime")
    public LocalDateTime getStartTime() {
        return startTime;
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

    @DynamoDbAttribute("completed")
    @JsonProperty("completed")
    public boolean isCompleted() {
        return completed;
    }

    @DynamoDbAttribute("totalQuestions")
    @JsonProperty("totalQuestions")
    public int getTotalQuestions() {
        return totalQuestions;
    }

    public void setTotalQuestions(int totalQuestions) {
        this.totalQuestions = totalQuestions;
    }

    @JsonProperty("scorePercentage")
    public int getScorePercentage() {
        if (questionIdToAnswer == null || questionIdToAnswer.isEmpty()) {
            return 0;
        }
        
        int actualTotalQuestions;
        if (quizType == QuizType.STANDARD_AMC) {
            // For standard AMC quizzes, use the stored totalQuestions (25)
            actualTotalQuestions = totalQuestions;
        } else {
            // For personalized quizzes, use the number of questions in the map
            actualTotalQuestions = questionIdToAnswer.size();
        }
        
        int answeredQuestions = getQuestionsAnswered();
        return (int) Math.round((double) answeredQuestions / actualTotalQuestions * 100.0);
    }

    // Setter methods for JSON deserialization
    public void setQuizId(String quizId) {
        this.quizId = quizId;
    }

    public void setQuizType(String quizType) {
        this.quizType = QuizType.fromValue(quizType);
    }
    
    public void setQuizType(QuizType quizType) {
        this.quizType = quizType;
    }

    public void setQuestionSetId(String questionSetId) {
        this.questionSetId = questionSetId;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
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

    public void setCompleted(boolean completed) {
        this.completed = completed;
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
     * Check if the quiz is completed (user has submitted the quiz)
     */
    public boolean isQuizCompleted() {
        return completed;
    }

}