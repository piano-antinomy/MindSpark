package com.mindspark.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindspark.model.Question;
import com.mindspark.service.QuestionService;
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
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        // Enable CORS
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        
        String pathInfo = request.getPathInfo();
        logger.debug("Processing GET request for path: {}", pathInfo);
        
        try {
            if (pathInfo == null || pathInfo.equals("/")) {
                handleGetAvailableLevels(response);
            } else if (pathInfo.startsWith("/level/")) {
                String levelStr = pathInfo.substring("/level/".length());
                handleGetQuestionsByLevel(levelStr, response);
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
    
    @Override
    protected void doOptions(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        // Handle preflight CORS request
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.setStatus(HttpServletResponse.SC_OK);
    }
    
    private void handleGetQuestionsByLevel(String levelStr, HttpServletResponse response) throws IOException {
        try {
            int level = Integer.parseInt(levelStr);
            List<Question> questions = questionService.listQuestionsByLevel(level);
            
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("success", true);
            responseData.put("subject", "math");
            responseData.put("level", level);
            responseData.put("questions", questions);
            responseData.put("count", questions.size());
            
            sendJsonResponse(response, responseData);
            logger.info("Returned {} math questions for level {}", questions.size(), level);
            
        } catch (NumberFormatException e) {
            logger.warn("Invalid level parameter: {}", levelStr);
            sendErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST, "Invalid level parameter");
        }
    }
    
    private void handleGetAvailableLevels(HttpServletResponse response) throws IOException {
        List<Integer> levels = questionService.getAvailableLevels();
        
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("success", true);
        responseData.put("subject", "math");
        responseData.put("levels", levels);
        
        // Add question counts for each level
        Map<Integer, Integer> levelCounts = new HashMap<>();
        for (Integer level : levels) {
            levelCounts.put(level, questionService.getQuestionCountByLevel(level));
        }
        responseData.put("levelCounts", levelCounts);
        
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