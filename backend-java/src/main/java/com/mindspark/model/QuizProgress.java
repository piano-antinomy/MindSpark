package com.mindspark.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Map;

/**
 * Individual quiz progress tracking
 */
public class QuizProgress {
    @JsonProperty("quiz_id")
    private String quizId;

    @JsonProperty("quiz_type")
    private String quizType;

    @JsonProperty("question_set_id")
    private String questionSetId;

    @JsonProperty("last_activity")
    private LocalDateTime lastActivity;

    /**
     * key set of this map contains all question ids within this quiz.
     * when this quiz was initially created, this map has only keys and all values will default to null.
     * value to each key is the user's Answer, we track this when user is working on the quiz.
     */
    @JsonProperty("question_id_to_answer")
    private Map<String, String> questionIdToAnswer;

    public QuizProgress(String quizId, LocalDateTime lastActivity, Map<String, String> questionIdToAnswer) {
        this.quizId = quizId;
        this.lastActivity = lastActivity;
        this.questionIdToAnswer = questionIdToAnswer;
    }

    public QuizProgress(String quizId, String quizType, LocalDateTime lastActivity, Map<String, String> questionIdToAnswer) {
        this.quizId = quizId;
        this.quizType = quizType;
        this.lastActivity = lastActivity;
        this.questionIdToAnswer = questionIdToAnswer;
    }

    public QuizProgress(String quizId, String quizType, String questionSetId, LocalDateTime lastActivity, Map<String, String> questionIdToAnswer) {
        this.quizId = quizId;
        this.quizType = quizType;
        this.questionSetId = questionSetId;
        this.lastActivity = lastActivity;
        this.questionIdToAnswer = questionIdToAnswer;
    }

    public QuizProgress(String quizId) {
        this.quizId = quizId;
        this.lastActivity = LocalDateTime.now();
        this.questionIdToAnswer = Collections.emptyMap();
    }

    public String getQuizId() {
        return quizId;
    }

    public String getQuizType() {
        return quizType;
    }

    public String getQuestionSetId() {
        return questionSetId;
    }

    public LocalDateTime getLastActivity() {
        return lastActivity;
    }

    public Map<String, String> getQuestionIdToAnswer() {
        return questionIdToAnswer;
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