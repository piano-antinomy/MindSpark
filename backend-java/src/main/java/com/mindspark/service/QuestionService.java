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
    
    /**
     * Get available years for a specific level
     * @param level The difficulty level (1=AMC_8, 2=AMC_10, 3=AMC_12)
     * @return List of available years for the level
     */
    List<String> getAvailableYearsByLevel(int level);
    
    /**
     * Get questions by level and year
     * @param level The difficulty level (1=AMC_8, 2=AMC_10, 3=AMC_12)
     * @param year The year (e.g., "2024")
     * @return List of questions for the specific level and year
     */
    List<Question> getQuestionsByLevelAndYear(int level, String year);
    
    /**
     * Get AMC type name by level
     * @param level The difficulty level (1=AMC_8, 2=AMC_10, 3=AMC_12)
     * @return AMC type name (e.g., "AMC_8")
     */
    String getAMCTypeByLevel(int level);


    List<Question> getQuestionsByQuizId(String quizId);
} 