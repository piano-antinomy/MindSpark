package com.mindspark.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindspark.model.Question;
import com.mindspark.service.QuestionService;
import com.mindspark.util.CorsUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Inject;
import javax.inject.Singleton;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Singleton
public class QuestionController extends HttpServlet {
    
    private static final Logger logger = LoggerFactory.getLogger(QuestionController.class);
    private final QuestionService questionService;
    private final ObjectMapper objectMapper;
    
    @Inject
    public QuestionController(QuestionService questionService, ObjectMapper objectMapper) {
        this.questionService = questionService;
        this.objectMapper = objectMapper;
    }
    
    @Override
    public void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        // Enable CORS
        CorsUtils.setCorsHeaders(request, response);
        
        String pathInfo = request.getPathInfo();
        logger.debug("Processing GET request for path: {}", pathInfo);
        
        try {
            if (pathInfo == null || pathInfo.equals("/") || pathInfo.equals("/levels")) {
                handleGetAvailableLevels(response);
            } else if (pathInfo.startsWith("/level/")) {
                handleLevelRoutes(pathInfo, response);
            } else if (pathInfo.equals("/health")) {
                handleHealthCheck(response);
            } else {
                sendErrorResponse(response, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found");
            }
        } catch (Exception e) {
            logger.error("Error processing request", e);
            sendErrorResponse(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }
    
    private void handleLevelRoutes(String pathInfo, HttpServletResponse response) throws IOException {
        // Parse path: /level/{level} or /level/{level}/years or /level/{level}/year/{year}
        String[] parts = pathInfo.split("/");
        
        if (parts.length < 3) {
            sendErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST, "Invalid path format");
            return;
        }
        
        try {
            int level = Integer.parseInt(parts[2]);
            
            if (parts.length == 3) {
                // /level/{level} - return all questions for level (backward compatibility)
                handleGetQuestionsByLevel(level, response);
            } else if (parts.length == 4 && "years".equals(parts[3])) {
                // /level/{level}/years - return available years for level
                handleGetAvailableYears(level, response);
            } else if (parts.length == 5 && "year".equals(parts[3])) {
                // /level/{level}/year/{year} - return questions for level and year
                String year = parts[4];
                handleGetQuestionsByLevelAndYear(level, year, response);
            } else {
                sendErrorResponse(response, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found");
            }
        } catch (NumberFormatException e) {
            logger.warn("Invalid level parameter: {}", parts[2]);
            sendErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST, "Invalid level parameter");
        }
    }
    
    @Override
    protected void doOptions(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        // Handle preflight CORS request
        CorsUtils.setCorsHeaders(request, response);
        response.setStatus(HttpServletResponse.SC_OK);
    }
    
    private void handleGetQuestionsByLevel(int level, HttpServletResponse response) throws IOException {
        List<Question> questions = questionService.listQuestionsByLevel(level);
        
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("success", true);
        responseData.put("subject", "math");
        responseData.put("level", level);
        responseData.put("amcType", questionService.getAMCTypeByLevel(level));
        responseData.put("questions", questions);
        responseData.put("count", questions.size());
        
        sendJsonResponse(response, responseData);
        logger.info("Returned {} math questions for level {}", questions.size(), level);
    }
    
    private void handleGetAvailableYears(int level, HttpServletResponse response) throws IOException {
        List<String> years = questionService.getAvailableYearsByLevel(level);
        
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("success", true);
        responseData.put("subject", "math");
        responseData.put("level", level);
        responseData.put("amcType", questionService.getAMCTypeByLevel(level));
        responseData.put("years", years);
        responseData.put("count", years.size());
        
        sendJsonResponse(response, responseData);
        logger.info("Returned {} available years for level {} ({})", years.size(), level, questionService.getAMCTypeByLevel(level));
    }
    
    private void handleGetQuestionsByLevelAndYear(int level, String year, HttpServletResponse response) throws IOException {
        List<Question> questions = questionService.getQuestionsByLevelAndYear(level, year);
        
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("success", true);
        responseData.put("subject", "math");
        responseData.put("level", level);
        responseData.put("year", year);
        responseData.put("amcType", questionService.getAMCTypeByLevel(level));
        responseData.put("questions", questions);
        responseData.put("count", questions.size());
        
        sendJsonResponse(response, responseData);
        logger.info("Returned {} math questions for level {} year {} ({})", 
                   questions.size(), level, year, questionService.getAMCTypeByLevel(level));
    }
    
    private void handleGetAvailableLevels(HttpServletResponse response) throws IOException {
        List<Integer> levels = questionService.getAvailableLevels();
        
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("success", true);
        responseData.put("subject", "math");
        responseData.put("levels", levels);
        
        // Add question counts and AMC types for each level
        Map<Integer, Integer> levelCounts = new HashMap<>();
        Map<Integer, String> levelAMCTypes = new HashMap<>();
        Map<Integer, Integer> levelYearCounts = new HashMap<>();
        
        for (Integer level : levels) {
            levelCounts.put(level, questionService.getQuestionCountByLevel(level));
            levelAMCTypes.put(level, questionService.getAMCTypeByLevel(level));
            levelYearCounts.put(level, questionService.getAvailableYearsByLevel(level).size());
        }
        
        responseData.put("levelCounts", levelCounts);
        responseData.put("levelAMCTypes", levelAMCTypes);
        responseData.put("levelYearCounts", levelYearCounts);
        
        sendJsonResponse(response, responseData);
        logger.info("Returned available math levels: {}", levels);
    }
    
    private void handleHealthCheck(HttpServletResponse response) throws IOException {
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("status", "healthy");
        responseData.put("service", "MindSpark Java Backend - Math Module");
        responseData.put("subject", "math");
        responseData.put("timestamp", System.currentTimeMillis());
        responseData.put("availableLevels", questionService.getAvailableLevels());
        
        sendJsonResponse(response, responseData);
    }
    
    private void sendJsonResponse(HttpServletResponse response, Object data) throws IOException {
        PrintWriter writer = response.getWriter();
        objectMapper.writeValue(writer, data);
        writer.flush();
    }
    
    private void sendErrorResponse(HttpServletResponse response, int statusCode, String message) throws IOException {
        response.setStatus(statusCode);
        
        Map<String, Object> errorData = new HashMap<>();
        errorData.put("success", false);
        errorData.put("subject", "math");
        errorData.put("error", message);
        errorData.put("timestamp", System.currentTimeMillis());
        
        sendJsonResponse(response, errorData);
    }
} 