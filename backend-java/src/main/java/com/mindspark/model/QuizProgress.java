package com.mindspark.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Individual quiz progress tracking
 */
public class QuizProgress {
    
    @JsonProperty("quiz_id")
    private String quizId;
    
    @JsonProperty("questions_answered")
    private int questionsAnswered;
    
    @JsonProperty("correct_answers")
    private int correctAnswers;
    
    @JsonProperty("total_questions")
    private int totalQuestions;
    
    @JsonProperty("is_completed")
    private boolean isCompleted;
    
    @JsonProperty("start_time")
    private LocalDateTime startTime;
    
    @JsonProperty("completion_time")
    private LocalDateTime completionTime;
    
    @JsonProperty("score_percentage")
    private int scorePercentage;
    
    /**
     * Map of questionId to user's answer
     */
    @JsonProperty("user_answers")
    private Map<String, String> userAnswers;
    
    /**
     * Map of questionId to correct answer (for scoring)
     */
    @JsonProperty("correct_answer_key")
    private Map<String, String> correctAnswerKey;
    
    // Constructors
    public QuizProgress() {
        this.userAnswers = new HashMap<>();
        this.correctAnswerKey = new HashMap<>();
        this.startTime = LocalDateTime.now();
    }
    
    public QuizProgress(String quizId) {
        this();
        this.quizId = quizId;
    }
    
    // Getters and Setters
    public String getQuizId() { return quizId; }
    public void setQuizId(String quizId) { this.quizId = quizId; }
    
    public int getQuestionsAnswered() { return questionsAnswered; }
    public void setQuestionsAnswered(int questionsAnswered) { this.questionsAnswered = questionsAnswered; }
    
    public int getCorrectAnswers() { return correctAnswers; }
    public void setCorrectAnswers(int correctAnswers) { this.correctAnswers = correctAnswers; }
    
    public int getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }
    
    public boolean isCompleted() { return isCompleted; }
    public void setCompleted(boolean completed) { this.isCompleted = completed; }
    
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    
    public LocalDateTime getCompletionTime() { return completionTime; }
    public void setCompletionTime(LocalDateTime completionTime) { this.completionTime = completionTime; }
    
    public int getScorePercentage() { return scorePercentage; }
    public void setScorePercentage(int scorePercentage) { this.scorePercentage = scorePercentage; }
    
    public Map<String, String> getUserAnswers() { return userAnswers; }
    public void setUserAnswers(Map<String, String> userAnswers) { this.userAnswers = userAnswers; }
    
    public Map<String, String> getCorrectAnswerKey() { return correctAnswerKey; }
    public void setCorrectAnswerKey(Map<String, String> correctAnswerKey) { this.correctAnswerKey = correctAnswerKey; }
    
    // Helper methods
    public void addAnswer(String questionId, String userAnswer, String correctAnswer) {
        userAnswers.put(questionId, userAnswer);
        correctAnswerKey.put(questionId, correctAnswer);
        
        recalculateProgress();
    }
    
    public void setTotalQuestionsAndRecalculate(int totalQuestions) {
        this.totalQuestions = totalQuestions;
        recalculateProgress();
    }
    
    public void markCompleted() {
        this.isCompleted = true;
        this.completionTime = LocalDateTime.now();
        recalculateProgress();
    }
    
    /**
     * Recalculate progress statistics based on current answers
     */
    private void recalculateProgress() {
        this.questionsAnswered = userAnswers.size();
        
        // Count correct answers
        this.correctAnswers = 0;
        for (Map.Entry<String, String> entry : userAnswers.entrySet()) {
            String questionId = entry.getKey();
            String userAnswer = entry.getValue();
            String correctAnswer = correctAnswerKey.get(questionId);
            
            if (userAnswer != null && userAnswer.equals(correctAnswer)) {
                this.correctAnswers++;
            }
        }
        
        // Calculate score percentage
        if (questionsAnswered > 0) {
            this.scorePercentage = (correctAnswers * 100) / questionsAnswered;
        } else {
            this.scorePercentage = 0;
        }
    }
    
    /**
     * Get progress as a fraction string (e.g., "5/25")
     */
    public String getProgressFraction() {
        return questionsAnswered + "/" + (totalQuestions > 0 ? totalQuestions : questionsAnswered);
    }
    
    /**
     * Check if user has answered a specific question
     */
    public boolean hasAnswered(String questionId) {
        return userAnswers.containsKey(questionId);
    }
    
    /**
     * Get user's answer for a specific question
     */
    public String getUserAnswer(String questionId) {
        return userAnswers.get(questionId);
    }
} 