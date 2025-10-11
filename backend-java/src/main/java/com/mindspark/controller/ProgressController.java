package com.mindspark.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindspark.model.Progress;
import com.mindspark.model.QuizProgress;
import com.mindspark.service.progress.ProgressTrackService;
import com.mindspark.util.CorsUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Inject;
import javax.inject.Singleton;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.Map;

@Singleton
public class ProgressController extends HttpServlet {
    
    private static final Logger logger = LoggerFactory.getLogger(ProgressController.class);
    private final ProgressTrackService progressTrackService;
    private final ObjectMapper objectMapper;
    
    @Inject
    public ProgressController(ProgressTrackService progressTrackService, ObjectMapper objectMapper) {
        this.progressTrackService = progressTrackService;
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
            if (pathInfo == null || pathInfo.equals("/")) {
                sendErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST, "User ID required");
            } else if (pathInfo.startsWith("/user/")) {
                handleUserProgressRoutes(pathInfo, response);
            } else if (pathInfo.equals("/admin/all")) {
                handleGetAllUserProgress(response);
            } else if (pathInfo.equals("/health")) {
                handleHealthCheck(response);
            } else {
                sendErrorResponse(response, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found");
            }
        } catch (Exception e) {
            logger.error("Error processing progress request", e);
            sendErrorResponse(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }
    
    @Override
    public void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        // Enable CORS
        CorsUtils.setCorsHeaders(request, response);
        
        String pathInfo = request.getPathInfo();
        logger.debug("Processing POST request for path: {}", pathInfo);
        
        try {
            if (pathInfo == null || pathInfo.equals("/track")) {
                handleTrackProgress(request, response);
            } else {
                sendErrorResponse(response, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found");
            }
        } catch (Exception e) {
            logger.error("Error processing progress tracking request", e);
            sendErrorResponse(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }
    
    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        // Enable CORS
        CorsUtils.setCorsHeaders(request, response);
        
        String pathInfo = request.getPathInfo();
        logger.debug("Processing DELETE request for path: {}", pathInfo);
        
        try {
            if (pathInfo != null && pathInfo.startsWith("/user/")) {
                handleDeleteProgressRoutes(pathInfo, response);
            } else {
                sendErrorResponse(response, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found");
            }
        } catch (Exception e) {
            logger.error("Error processing progress deletion request", e);
            sendErrorResponse(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }
    
    @Override
    protected void doOptions(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        // Handle preflight CORS request
        CorsUtils.setCorsHeaders(request, response);
        response.setStatus(HttpServletResponse.SC_OK);
    }
    
    private void handleUserProgressRoutes(String pathInfo, HttpServletResponse response) throws IOException {
        // Parse path: /user/{userId} or /user/{userId}/quiz/{quizId}
        String[] parts = pathInfo.split("/");
        
        if (parts.length < 3) {
            sendErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST, "Invalid path format");
            return;
        }
        
        String userId = parts[2];
        
        if (parts.length == 3) {
            // /user/{userId} - return overall progress for user
            handleGetUserProgress(userId, response);
        } else if (parts.length == 5 && "quiz".equals(parts[3])) {
            // /user/{userId}/quiz/{quizId} - return quiz-specific progress
            String quizId = parts[4];
            handleGetQuizProgress(userId, quizId, response);
        } else {
            sendErrorResponse(response, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found");
        }
    }
    
    private void handleDeleteProgressRoutes(String pathInfo, HttpServletResponse response) throws IOException {
        // Parse path: /user/{userId} or /user/{userId}/quiz/{quizId}
        String[] parts = pathInfo.split("/");
        
        if (parts.length < 3) {
            sendErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST, "Invalid path format");
            return;
        }
        
        String userId = parts[2];
        
        if (parts.length == 3) {
            // /user/{userId} - clear all progress for user
            handleClearUserProgress(userId, response);
        } else if (parts.length == 5 && "quiz".equals(parts[3])) {
            // /user/{userId}/quiz/{quizId} - reset quiz-specific progress
            String quizId = parts[4];
            handleResetQuizProgress(userId, quizId, response);
        } else {
            sendErrorResponse(response, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found");
        }
    }
    
    private void handleGetUserProgress(String userId, HttpServletResponse response) throws IOException {
        if (userId == null || userId.trim().isEmpty()) {
            sendErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST, "User ID cannot be empty");
            return;
        }
        
        Progress userProgress = progressTrackService.getProgress(userId);
        
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("success", true);
        responseData.put("userId", userId);
        responseData.put("progress", userProgress);
        responseData.put("timestamp", System.currentTimeMillis());
        
        sendJsonResponse(response, responseData);
        logger.debug("Retrieved progress for user: {}", userId);
    }
    
    private void handleGetQuizProgress(String userId, String quizId, HttpServletResponse response) throws IOException {
        if (userId == null || userId.trim().isEmpty()) {
            sendErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST, "User ID cannot be empty");
            return;
        }
        
        if (quizId == null || quizId.trim().isEmpty()) {
            sendErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST, "Quiz ID cannot be empty");
            return;
        }
        
        // Get quiz progress using the standard interface method
        QuizProgress quizProgress = progressTrackService.getProgress(userId, quizId);
        
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("success", true);
        responseData.put("userId", userId);
        responseData.put("quizId", quizId);
        responseData.put("quizProgress", quizProgress);
        responseData.put("timestamp", System.currentTimeMillis());
        
        sendJsonResponse(response, responseData);
        logger.debug("Retrieved quiz progress for user: {}, quiz: {}", userId, quizId);
    }
    
    private void handleTrackProgress(HttpServletRequest request, HttpServletResponse response) throws IOException {
        // Read request body
        StringBuilder requestBody = new StringBuilder();
        try (BufferedReader reader = request.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                requestBody.append(line);
            }
        }
        
        try {
            JsonNode jsonNode = objectMapper.readTree(requestBody.toString());
            
            String userId = jsonNode.get("userId").asText();
            String quizId = jsonNode.get("quizId").asText();
            JsonNode questionIdToAnswerNode = jsonNode.get("questionIdToAnswer");
            int timeSpent = jsonNode.has("timeSpent") ? jsonNode.get("timeSpent").asInt() : 0;
            boolean hasTimer = jsonNode.has("hasTimer") ? jsonNode.get("hasTimer").asBoolean() : false;
            int timeLimit = jsonNode.has("timeLimit") ? jsonNode.get("timeLimit").asInt() : 0;
            Boolean completed = jsonNode.has("completed") ? jsonNode.get("completed").asBoolean() : false;
            
            if (userId == null || userId.trim().isEmpty()) {
                sendErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST, "User ID is required");
                return;
            }
            
            if (quizId == null || quizId.trim().isEmpty()) {
                sendErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST, "Quiz ID is required");
                return;
            }
            
            if (questionIdToAnswerNode == null || !questionIdToAnswerNode.isObject()) {
                sendErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST, "Question ID to Answer mapping is required");
                return;
            }
            
            // Convert JsonNode to Map
            Map<String, String> questionIdToAnswer = new HashMap<>();
            questionIdToAnswerNode.fields().forEachRemaining(entry -> {
                questionIdToAnswer.put(entry.getKey(), entry.getValue().asText());
            });
            
            logger.info("Tracking progress for user: {}, quiz: {}, questions: {}, hasTimer: {}, timeLimit: {}", 
                       userId, quizId, questionIdToAnswer.keySet(), hasTimer, timeLimit);
            
            // Track the progress using batch method
            progressTrackService.trackProgress(userId, quizId, questionIdToAnswer, completed, timeSpent, hasTimer, timeLimit);
            
            // Return updated quiz progress
            QuizProgress updatedQuizProgress = progressTrackService.getProgress(userId, quizId);
            
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("success", true);
            responseData.put("message", "Progress tracked successfully");
            responseData.put("userId", userId);
            responseData.put("quizId", quizId);
            responseData.put("questionsTracked", questionIdToAnswer.size());
            responseData.put("updatedQuizProgress", updatedQuizProgress);
            responseData.put("timestamp", System.currentTimeMillis());
            
            sendJsonResponse(response, responseData);
            logger.info("Successfully tracked progress for user: {}, quiz: {}, {} questions", 
                       userId, quizId, questionIdToAnswer.size());
            
        } catch (Exception e) {
            logger.error("Error processing track progress request", e);
            sendErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST, "Error processing progress tracking");
        }
    }

    
    private void handleResetQuizProgress(String userId, String quizId, HttpServletResponse response) throws IOException {
        if (userId == null || userId.trim().isEmpty()) {
            sendErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST, "User ID cannot be empty");
            return;
        }
        
        if (quizId == null || quizId.trim().isEmpty()) {
            sendErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST, "Quiz ID cannot be empty");
            return;
        }
        
        // Check if the service implementation supports resetQuizProgress method
        sendErrorResponse(response, HttpServletResponse.SC_NOT_IMPLEMENTED, "Reset quiz progress not supported by current implementation");

        /*
         * for future reference, if we implement resetQuizProgress:
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("success", true);
        responseData.put("message", "Quiz progress reset successfully");
        responseData.put("userId", userId);
        responseData.put("quizId", quizId);
        responseData.put("timestamp", System.currentTimeMillis());
        
        sendJsonResponse(response, responseData);
        logger.info("Reset quiz progress for user: {}, quiz: {}", userId, quizId);
         */
    }
    
    private void handleClearUserProgress(String userId, HttpServletResponse response) throws IOException {
        if (userId == null || userId.trim().isEmpty()) {
            sendErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST, "User ID cannot be empty");
            return;
        }
        
        sendErrorResponse(response, HttpServletResponse.SC_NOT_IMPLEMENTED, "Clear user progress not supported by current implementation");
    }
    
    private void handleGetAllUserProgress(HttpServletResponse response) throws IOException {
        // This is an admin endpoint - in a real application, you'd check for admin privileges

        sendErrorResponse(response, HttpServletResponse.SC_NOT_IMPLEMENTED, "Get all user progress not supported by current implementation");
    }
    
    private void handleHealthCheck(HttpServletResponse response) throws IOException {
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("status", "healthy");
        responseData.put("service", "MindSpark Java Backend - Progress Module");
        responseData.put("timestamp", System.currentTimeMillis());
        
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
        errorData.put("error", message);
        errorData.put("timestamp", System.currentTimeMillis());
        
        sendJsonResponse(response, errorData);
    }
} 