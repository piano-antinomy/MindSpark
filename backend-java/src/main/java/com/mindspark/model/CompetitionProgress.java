package com.mindspark.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

/**
 * Aggregated progress statistics for a specific competition type (AMC_8, AMC_10, AMC_12)
 */
public class CompetitionProgress {
    
    @JsonProperty("competition_type")
    private String competitionType;
    
    @JsonProperty("total_questions_answered")
    private int totalQuestionsAnswered;
    
    @JsonProperty("total_quizzes_attempted")
    private int totalQuizzesAttempted;
    
    @JsonProperty("total_quizzes_completed")
    private int totalQuizzesCompleted;
    
    @JsonProperty("average_score_percentage")
    private int averageScorePercentage;
    
    @JsonProperty("best_score_percentage")
    private int bestScorePercentage;
    
    /**
     * Map of year to questions answered count for that year
     * Example: {"2016": 25, "2017": 18, "2018": 25}
     */
    @JsonProperty("questions_by_year")
    private Map<String, Integer> questionsByYear;
    
    /**
     * Map of year to completion status
     * Example: {"2016": true, "2017": false, "2018": true}
     */
    @JsonProperty("completion_by_year")
    private Map<String, Boolean> completionByYear;
    
    /**
     * Map of year to score percentage
     * Example: {"2016": 85, "2017": 72, "2018": 90}
     */
    @JsonProperty("scores_by_year")
    private Map<String, Integer> scoresByYear;
    
    // Constructors
    public CompetitionProgress() {
        this.questionsByYear = new HashMap<>();
        this.completionByYear = new HashMap<>();
        this.scoresByYear = new HashMap<>();
    }
    
    public CompetitionProgress(String competitionType) {
        this();
        this.competitionType = competitionType;
    }
    
    // Getters and Setters
    public String getCompetitionType() { return competitionType; }
    public void setCompetitionType(String competitionType) { this.competitionType = competitionType; }
    
    public int getTotalQuestionsAnswered() { return totalQuestionsAnswered; }
    public void setTotalQuestionsAnswered(int totalQuestionsAnswered) { this.totalQuestionsAnswered = totalQuestionsAnswered; }
    
    public int getTotalQuizzesAttempted() { return totalQuizzesAttempted; }
    public void setTotalQuizzesAttempted(int totalQuizzesAttempted) { this.totalQuizzesAttempted = totalQuizzesAttempted; }
    
    public int getTotalQuizzesCompleted() { return totalQuizzesCompleted; }
    public void setTotalQuizzesCompleted(int totalQuizzesCompleted) { this.totalQuizzesCompleted = totalQuizzesCompleted; }
    
    public int getAverageScorePercentage() { return averageScorePercentage; }
    public void setAverageScorePercentage(int averageScorePercentage) { this.averageScorePercentage = averageScorePercentage; }
    
    public int getBestScorePercentage() { return bestScorePercentage; }
    public void setBestScorePercentage(int bestScorePercentage) { this.bestScorePercentage = bestScorePercentage; }
    
    public Map<String, Integer> getQuestionsByYear() { return questionsByYear; }
    public void setQuestionsByYear(Map<String, Integer> questionsByYear) { this.questionsByYear = questionsByYear; }
    
    public Map<String, Boolean> getCompletionByYear() { return completionByYear; }
    public void setCompletionByYear(Map<String, Boolean> completionByYear) { this.completionByYear = completionByYear; }
    
    public Map<String, Integer> getScoresByYear() { return scoresByYear; }
    public void setScoresByYear(Map<String, Integer> scoresByYear) { this.scoresByYear = scoresByYear; }
    
    // Helper methods
    public void addQuizProgress(QuizProgress quizProgress) {
        String year = extractYear(quizProgress.getQuizId());
        if (year != null) {
            // Update questions answered for this year
            questionsByYear.merge(year, quizProgress.getQuestionsAnswered(), Integer::sum);
            
            // Update completion status
            if (quizProgress.isCompleted()) {
                completionByYear.put(year, true);
            } else {
                completionByYear.putIfAbsent(year, false);
            }
            
            // Update score for this year (take the latest/highest score)
            if (quizProgress.getQuestionsAnswered() > 0) {
                int currentScore = scoresByYear.getOrDefault(year, 0);
                scoresByYear.put(year, Math.max(currentScore, quizProgress.getScorePercentage()));
            }
        }
        
        // Recalculate aggregated statistics
        recalculateAggregatedStats();
    }
    
    /**
     * Extract year from quizId (e.g., "2016_AMC_8" -> "2016")
     */
    private String extractYear(String quizId) {
        if (quizId == null) return null;
        
        // Look for 4-digit year pattern
        String[] parts = quizId.split("_");
        for (String part : parts) {
            if (part.matches("\\d{4}")) {
                return part;
            }
        }
        
        return null;
    }
    
    /**
     * Recalculate aggregated statistics from year-based data
     */
    private void recalculateAggregatedStats() {
        // Total questions answered
        this.totalQuestionsAnswered = questionsByYear.values().stream()
            .mapToInt(Integer::intValue)
            .sum();
        
        // Total quizzes attempted and completed
        this.totalQuizzesAttempted = questionsByYear.size();
        this.totalQuizzesCompleted = (int) completionByYear.values().stream()
            .mapToLong(completed -> completed ? 1 : 0)
            .sum();
        
        // Best score
        this.bestScorePercentage = scoresByYear.values().stream()
            .mapToInt(Integer::intValue)
            .max()
            .orElse(0);
        
        // Average score
        if (!scoresByYear.isEmpty()) {
            this.averageScorePercentage = (int) scoresByYear.values().stream()
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0.0);
        } else {
            this.averageScorePercentage = 0;
        }
    }
    
    /**
     * Get sorted years (most recent first)
     */
    public Set<String> getSortedYears() {
        Set<String> sortedYears = new TreeSet<>((a, b) -> b.compareTo(a)); // Reverse order
        sortedYears.addAll(questionsByYear.keySet());
        return sortedYears;
    }
    
    /**
     * Get questions answered for a specific year
     */
    public int getQuestionsAnsweredForYear(String year) {
        return questionsByYear.getOrDefault(year, 0);
    }
    
    /**
     * Check if quiz for a specific year is completed
     */
    public boolean isYearCompleted(String year) {
        return completionByYear.getOrDefault(year, false);
    }
    
    /**
     * Get score percentage for a specific year
     */
    public int getScoreForYear(String year) {
        return scoresByYear.getOrDefault(year, 0);
    }
} 