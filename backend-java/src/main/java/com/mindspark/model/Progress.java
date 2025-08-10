package com.mindspark.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Comprehensive user progress tracking across all competitions and quizzes
 */
public class Progress {
    
    @JsonProperty("userId")
    private String userId;

    /**
     * Map of quizId to individual quiz progress
     * QuizId format: "2016_AMC_8", "level_quiz_amc_10", etc.
     */
    @JsonProperty("quizProgress")
    private Map<String, QuizProgress> quizProgress;
    
    // Constructors
    public Progress(final String userId) {
        this.userId = userId;
        this.quizProgress = new HashMap<>();
    }

    public Progress(final String userId, Map<String, QuizProgress> quizProgress) {
        this.userId = userId;
        this.quizProgress = quizProgress;
    }
    

    public String getUserId() { return userId; }

    public Map<String, QuizProgress> getQuizProgress() { return quizProgress; }
}