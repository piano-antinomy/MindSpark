package com.mindspark.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Comprehensive user progress tracking across all competitions and quizzes
 */
public class Progress {
    
    @JsonProperty("user_id")
    private String userId;
    
    @JsonProperty("total_questions_answered")
    private int totalQuestionsAnswered;
    
    @JsonProperty("total_quizzes_completed")
    private int totalQuizzesCompleted;
    
    @JsonProperty("overall_score")
    private int overallScore;
    
    @JsonProperty("last_activity")
    private LocalDateTime lastActivity;
    
    /**
     * Map of quizId to individual quiz progress
     * QuizId format: "2016_AMC_8", "level_quiz_amc_10", etc.
     */
    @JsonProperty("quiz_progress")
    private Map<String, QuizProgress> quizProgress;
    
    /**
     * Aggregated progress by competition type (AMC_8, AMC_10, AMC_12)
     */
    @JsonProperty("competition_progress")
    private Map<String, CompetitionProgress> competitionProgress;
    
    // Constructors
    public Progress() {
        this.quizProgress = new HashMap<>();
        this.competitionProgress = new HashMap<>();
        this.lastActivity = LocalDateTime.now();
    }
    
    public Progress(String userId) {
        this();
        this.userId = userId;
    }
    
    // Getters and Setters
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    
    public int getTotalQuestionsAnswered() { return totalQuestionsAnswered; }
    public void setTotalQuestionsAnswered(int totalQuestionsAnswered) { this.totalQuestionsAnswered = totalQuestionsAnswered; }
    
    public int getTotalQuizzesCompleted() { return totalQuizzesCompleted; }
    public void setTotalQuizzesCompleted(int totalQuizzesCompleted) { this.totalQuizzesCompleted = totalQuizzesCompleted; }
    
    public int getOverallScore() { return overallScore; }
    public void setOverallScore(int overallScore) { this.overallScore = overallScore; }
    
    public LocalDateTime getLastActivity() { return lastActivity; }
    public void setLastActivity(LocalDateTime lastActivity) { this.lastActivity = lastActivity; }
    
    public Map<String, QuizProgress> getQuizProgress() { return quizProgress; }
    public void setQuizProgress(Map<String, QuizProgress> quizProgress) { this.quizProgress = quizProgress; }
    
    public Map<String, CompetitionProgress> getCompetitionProgress() { return competitionProgress; }
    public void setCompetitionProgress(Map<String, CompetitionProgress> competitionProgress) { this.competitionProgress = competitionProgress; }
    
    // Helper methods for updating progress
    public void updateLastActivity() {
        this.lastActivity = LocalDateTime.now();
    }
    
    public QuizProgress getOrCreateQuizProgress(String quizId) {
        return quizProgress.computeIfAbsent(quizId, k -> new QuizProgress(quizId));
    }
    
    public CompetitionProgress getOrCreateCompetitionProgress(String competitionType) {
        return competitionProgress.computeIfAbsent(competitionType, k -> new CompetitionProgress(competitionType));
    }
    
    /**
     * Recalculate aggregated statistics from individual quiz progress
     */
    public void recalculateAggregatedStats() {
        // Reset totals
        this.totalQuestionsAnswered = 0;
        this.totalQuizzesCompleted = 0;
        this.overallScore = 0;
        
        // Clear competition progress for recalculation
        this.competitionProgress.clear();
        
        // Aggregate from individual quiz progress
        for (QuizProgress quiz : quizProgress.values()) {
            this.totalQuestionsAnswered += quiz.getQuestionsAnswered();
            
            if (quiz.isCompleted()) {
                this.totalQuizzesCompleted++;
            }
            
            // Extract competition type from quizId (e.g., "2016_AMC_8" -> "AMC_8")
            String competitionType = extractCompetitionType(quiz.getQuizId());
            if (competitionType != null) {
                CompetitionProgress compProgress = getOrCreateCompetitionProgress(competitionType);
                compProgress.addQuizProgress(quiz);
            }
        }
        
        // Calculate overall score as percentage
        if (totalQuestionsAnswered > 0) {
            int totalCorrect = quizProgress.values().stream()
                .mapToInt(QuizProgress::getCorrectAnswers)
                .sum();
            this.overallScore = (totalCorrect * 100) / totalQuestionsAnswered;
        }
    }
    
    /**
     * Extract competition type from quizId
     * Examples: "2016_AMC_8" -> "AMC_8", "level_quiz_amc_10" -> "AMC_10"
     */
    private String extractCompetitionType(String quizId) {
        if (quizId == null) return null;
        
        if (quizId.contains("AMC_8")) return "AMC_8";
        if (quizId.contains("AMC_10") || quizId.contains("amc_10")) return "AMC_10";
        if (quizId.contains("AMC_12") || quizId.contains("amc_12")) return "AMC_12";
        
        return null;
    }
}