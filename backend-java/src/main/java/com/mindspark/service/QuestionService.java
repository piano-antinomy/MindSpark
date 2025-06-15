package com.mindspark.service;

import com.mindspark.model.Question;
import java.util.List;

public interface QuestionService {
    
    /**
     * Get questions by difficulty level
     * @param level The difficulty level (1, 2, or 3)
     * @return List of questions for the specified level
     */
    List<Question> listQuestionsByLevel(int level);
    
    /**
     * Get all available levels
     * @return List of available levels
     */
    List<Integer> getAvailableLevels();
    
    /**
     * Get total count of questions for a level
     * @param level The difficulty level
     * @return Number of questions available for the level
     */
    int getQuestionCountByLevel(int level);
} 