package com.mindspark.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindspark.model.Question;
import com.mindspark.model.QuizProgress;
import com.mindspark.model.QuizType;
import com.mindspark.service.quiz.QuizService;
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
import java.util.List;
import java.util.Map;

@Singleton
public class QuizController extends HttpServlet {
    
    private static final Logger logger = LoggerFactory.getLogger(QuizController.class);
    private final QuizService quizService;
    private final ObjectMapper objectMapper;
    
    @Inject
    public QuizController(QuizService quizService, ObjectMapper objectMapper) {
        this.quizService = quizService;
        this.objectMapper = objectMapper;
    }
    
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
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
                handleUserQuizRoutes(pathInfo, response);
            } else if (pathInfo.equals("/health")) {
                handleHealthCheck(response);
            } else {
                sendErrorResponse(response, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found");
            }
        } catch (Exception e) {
            logger.error("Error processing quiz request", e);
            sendErrorResponse(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }
    
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        // Enable CORS
        CorsUtils.setCorsHeaders(request, response);
        
        String pathInfo = request.getPathInfo();
        logger.debug("Processing POST request for path: {}", pathInfo);
        
        try {
            if (pathInfo == null || pathInfo.equals("/create")) {
                handleCreateQuiz(request, response);
            } else if (pathInfo.equals("/update")) {
                handleUpdateQuiz(request, response);
            } else {
                sendErrorResponse(response, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found");
            }
        } catch (Exception e) {
            logger.error("Error processing quiz creation/update request", e);
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
    
    private void handleUserQuizRoutes(String pathInfo, HttpServletResponse response) throws IOException {
        // Parse path: /user/{userId} or /user/{userId}/quiz/{quizId}
        String[] parts = pathInfo.split("/");
        
        if (parts.length < 3) {
            sendErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST, "Invalid path format");
            return;
        }
        
        String userId = parts[2];
        
        if (parts.length == 3) {
            // /user/{userId} - return all quizzes for user
            handleGetUserQuizzes(userId, response);
        } else if (parts.length == 5 && "quiz".equals(parts[3])) {
            // /user/{userId}/quiz/{quizId} - return specific quiz
            String quizId = parts[4];
            handleGetQuiz(userId, quizId, response);
        } else if (parts.length == 6 && "quiz".equals(parts[3]) && "questions".equals(parts[5])) {
            // /user/{userId}/quiz/{quizId}/questions - return questions for quiz
            String quizId = parts[4];
            handleGetQuizQuestions(userId, quizId, response);
        } else {
            sendErrorResponse(response, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found");
        }
    }
    
    private void handleGetUserQuizzes(String userId, HttpServletResponse response) throws IOException {
        try {
            Map<String, QuizProgress> quizzes = quizService.listQuiz(userId);
            sendJsonResponse(response, quizzes);
        } catch (Exception e) {
            logger.error("Error getting quizzes for user {}", userId, e);
            sendErrorResponse(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to get user quizzes");
        }
    }
    
    private void handleGetQuiz(String userId, String quizId, HttpServletResponse response) throws IOException {
        try {
            Map<String, QuizProgress> quizzes = quizService.listQuiz(userId);
            QuizProgress quiz = quizzes.get(quizId);
            
            if (quiz == null) {
                sendErrorResponse(response, HttpServletResponse.SC_NOT_FOUND, "Quiz not found");
                return;
            }
            
            sendJsonResponse(response, quiz);
        } catch (Exception e) {
            logger.error("Error getting quiz {} for user {}", quizId, userId, e);
            sendErrorResponse(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to get quiz");
        }
    }
    
    private void handleGetQuizQuestions(String userId, String quizId, HttpServletResponse response) throws IOException {
        try {
            List<Question> questions = quizService.getQuestionsByQuizId(userId, quizId);
            sendJsonResponse(response, questions);
        } catch (Exception e) {
            logger.error("Error getting questions for quiz {} and user {}", quizId, userId, e);
            sendErrorResponse(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to get quiz questions");
        }
    }
    
    private void handleCreateQuiz(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            JsonNode requestBody = readRequestBody(request);
            
            String userId = getRequiredField(requestBody, "userId");
            String quizTypeStr = getRequiredField(requestBody, "quizType");
            String quizId = requestBody.has("quizId") ? requestBody.get("quizId").asText() : null;
            String quizName = getRequiredField(requestBody, "quizName");
            
            QuizType quizType = QuizType.fromValue(quizTypeStr);
            if (quizType == null) {
                sendErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST, "Invalid quiz type: " + quizTypeStr);
                return;
            }
            
            QuizProgress quizProgress;
            
            if (quizType == QuizType.STANDARD_AMC) {
                String quizQuestionSetId = getRequiredField(requestBody, "quizQuestionSetId");
                quizProgress = quizService.createStandardQuiz(userId, quizQuestionSetId, quizId, quizName);
            } else if (quizType == QuizType.PERSONALIZED) {
                quizProgress = quizService.createPersonalizedQuiz(userId, quizId, quizName);
            } else {
                sendErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST, "Unsupported quiz type: " + quizTypeStr);
                return;
            }
            
            sendJsonResponse(response, quizProgress);
            
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid request for quiz creation: {}", e.getMessage());
            sendErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            logger.error("Error creating quiz", e);
            sendErrorResponse(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to create quiz");
        }
    }
    
    private void handleUpdateQuiz(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            JsonNode requestBody = readRequestBody(request);
            
            String userId = getRequiredField(requestBody, "userId");
            String quizId = getRequiredField(requestBody, "quizId");
            
            QuizProgress quizProgress = objectMapper.treeToValue(requestBody.get("quizProgress"), QuizProgress.class);
            
            quizService.updateQuizProgress(userId, quizId, quizProgress);
            
            Map<String, String> result = new HashMap<>();
            result.put("message", "Quiz progress updated successfully");
            sendJsonResponse(response, result);
            
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid request for quiz update: {}", e.getMessage());
            sendErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            logger.error("Error updating quiz", e);
            sendErrorResponse(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to update quiz");
        }
    }
    
    private void handleHealthCheck(HttpServletResponse response) throws IOException {
        Map<String, String> health = new HashMap<>();
        health.put("status", "healthy");
        health.put("service", "quiz");
        sendJsonResponse(response, health);
    }
    
    private JsonNode readRequestBody(HttpServletRequest request) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = request.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        }
        return objectMapper.readTree(sb.toString());
    }
    
    private String getRequiredField(JsonNode requestBody, String fieldName) {
        if (!requestBody.has(fieldName) || requestBody.get(fieldName).isNull()) {
            throw new IllegalArgumentException("Missing required field: " + fieldName);
        }
        return requestBody.get(fieldName).asText();
    }
    
    private void sendJsonResponse(HttpServletResponse response, Object data) throws IOException {
        try (PrintWriter out = response.getWriter()) {
            out.print(objectMapper.writeValueAsString(data));
            out.flush();
        }
    }
    
    private void sendErrorResponse(HttpServletResponse response, int statusCode, String message) throws IOException {
        response.setStatus(statusCode);
        Map<String, String> error = new HashMap<>();
        error.put("error", message);
        sendJsonResponse(response, error);
    }
} 