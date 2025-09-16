package com.mindspark.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindspark.model.User;
import com.mindspark.service.LoginService;
import com.mindspark.util.CorsUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Inject;
import javax.inject.Singleton;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Singleton
public class AuthController extends HttpServlet {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    private final LoginService loginService;
    private final ObjectMapper objectMapper;
    
    @Inject
    public AuthController(LoginService loginService, ObjectMapper objectMapper) {
        this.loginService = loginService;
        this.objectMapper = objectMapper;
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
            if (pathInfo == null || pathInfo.equals("/login")) {
                handleLogin(request, response);
            } else if (pathInfo.equals("/logout")) {
                handleLogout(request, response);
            } else if (pathInfo.equals("/profile")) {
                handleCreateOrUpdateProfile(request, response);
            } else if (pathInfo.equals("/update-scores")) {
                handleUpdateScores(request, response);
            } else {
                sendErrorResponse(response, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found");
            }
        } catch (Exception e) {
            logger.error("Error processing auth request", e);
            sendErrorResponse(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Internal server error");
        }
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
            if (pathInfo == null || pathInfo.equals("/profile")) {
                handleGetProfile(request, response);
            } else if (pathInfo.equals("/status")) {
                handleAuthStatus(request, response);
            } else if (pathInfo.equals("/profile/get-all-users")) {
                handleGetAllUsers(request, response);
            } else {
                sendErrorResponse(response, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found");
            }
        } catch (Exception e) {
            logger.error("Error processing auth request", e);
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
    
    private void handleLogin(HttpServletRequest request, HttpServletResponse response) throws IOException {
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
            String password = jsonNode.get("password").asText();
            
            User authenticatedUser = loginService.authenticate(userId, password);
            
            if (authenticatedUser != null) {
                // Create session
                HttpSession session = request.getSession(true);
                session.setAttribute("userId", userId.toLowerCase());
                session.setAttribute("user", authenticatedUser);
                
                Map<String, Object> responseData = new HashMap<>();
                responseData.put("success", true);
                responseData.put("message", "Login successful");
                responseData.put("user", authenticatedUser);
                
                sendJsonResponse(response, responseData);
                logger.info("Successful login for user: {}", userId);
                
            } else {
                sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid credentials");
            }
            
        } catch (Exception e) {
            logger.error("Error parsing login request", e);
            sendErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST, "Invalid request format");
        }
    }
    
    private void handleLogout(HttpServletRequest request, HttpServletResponse response) throws IOException {
        HttpSession session = request.getSession(false);
        if (session != null) {
            String userId = (String) session.getAttribute("userId");
            session.invalidate();
            logger.info("User logged out: {}", userId);
        }
        
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("success", true);
        responseData.put("message", "Logged out successfully");
        
        sendJsonResponse(response, responseData);
    }
    
    private void handleGetProfile(HttpServletRequest request, HttpServletResponse response) throws IOException {
        HttpSession session = request.getSession(false);
        if (session == null) {
            sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "Not authenticated");
            return;
        }
        
        String userId = (String) session.getAttribute("userId");

        logger.info("Getting profile for userId = {}", userId);
        if (userId == null) {
            sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "Not authenticated");
            return;
        }
        
        User user = loginService.getUserProfile(userId);
        if (user != null) {
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("success", true);
            responseData.put("user", user);
            
            sendJsonResponse(response, responseData);
        } else {
            sendErrorResponse(response, HttpServletResponse.SC_NOT_FOUND, "User not found");
        }
    }

    private void handleCreateOrUpdateProfile(HttpServletRequest request, HttpServletResponse response) throws IOException {
        // Read request body
        StringBuilder requestBody = new StringBuilder();
        try (BufferedReader reader = request.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                requestBody.append(line);
            }
        }
        try {
            User payload = objectMapper.readValue(requestBody.toString(), User.class);
            if (payload == null || payload.getUserId() == null) {
                sendErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST, "userId is required");
                return;
            }
            // Ensure default score is 0 if not present
            if (payload.getScore() <= 0) {
                payload.setScore(0);
            }
            if (payload.getMathLevel() <= 0) {
                payload.setMathLevel(1);
            }
            User stored = loginService.createOrUpdateUser(payload);
            if (stored == null) {
                sendErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST, "Invalid user payload");
                return;
            }

            // Attach to session if caller wants to set login state
            HttpSession session = request.getSession(true);
            session.setAttribute("userId", stored.getUserId());
            session.setAttribute("user", stored);

            Map<String, Object> responseData = new HashMap<>();
            responseData.put("success", true);
            responseData.put("user", stored);
            sendJsonResponse(response, responseData);
        } catch (Exception e) {
            logger.error("Error parsing profile request", e);
            sendErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST, "Invalid request format");
        }
    }
    
    private void handleAuthStatus(HttpServletRequest request, HttpServletResponse response) throws IOException {
        HttpSession session = request.getSession(false);
        
        Map<String, Object> responseData = new HashMap<>();
        if (session != null && session.getAttribute("userId") != null) {
            String userId = (String) session.getAttribute("userId");
            User user = loginService.getUserProfile(userId);
            
            responseData.put("authenticated", true);
            responseData.put("user", user);
        } else {
            responseData.put("authenticated", false);
        }
        
        responseData.put("success", true);
        sendJsonResponse(response, responseData);
    }
    
    private void handleUpdateScores(HttpServletRequest request, HttpServletResponse response) throws IOException {
        // Check authentication first
        HttpSession session = request.getSession(false);
        if (session == null) {
            sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "Not authenticated");
            return;
        }
        
        String userId = (String) session.getAttribute("userId");
        if (userId == null) {
            sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "Not authenticated");
            return;
        }
        
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
            
            // Extract score and mathLevel from request
            Integer score = null;
            Integer mathLevel = null;
            
            if (jsonNode.has("score")) {
                score = jsonNode.get("score").asInt();
            }
            
            if (jsonNode.has("mathLevel")) {
                mathLevel = jsonNode.get("mathLevel").asInt();
            }
            
            // Validate that at least one field is provided
            if (score == null && mathLevel == null) {
                sendErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST, "At least one of 'score' or 'mathLevel' must be provided");
                return;
            }
            
            boolean updateSuccess = true;
            String updateMessage = "Progress updated successfully";
            
            // Update score if provided
            if (score != null) {
                if (score < 0) {
                    sendErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST, "Score cannot be negative");
                    return;
                }
                boolean scoreUpdated = loginService.updateUserScore(userId, score);
                if (!scoreUpdated) {
                    updateSuccess = false;
                    updateMessage = "Failed to update score";
                }
            }
            
            // Update math level if provided
            if (mathLevel != null && updateSuccess) {
                boolean mathLevelUpdated = loginService.updateUserMathLevel(userId, mathLevel);
                if (!mathLevelUpdated) {
                    updateSuccess = false;
                    updateMessage = "Failed to update math level";
                }
            }
            
            if (updateSuccess) {
                // Get updated user profile
                User updatedUser = loginService.getUserProfile(userId);
                
                Map<String, Object> responseData = new HashMap<>();
                responseData.put("success", true);
                responseData.put("message", updateMessage);
                responseData.put("user", updatedUser);
                
                sendJsonResponse(response, responseData);
                logger.info("Progress updated for user: {} - score: {}, mathLevel: {}", userId, score, mathLevel);
            } else {
                sendErrorResponse(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, updateMessage);
            }
            
        } catch (Exception e) {
            logger.error("Error parsing update progress request", e);
            sendErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST, "Invalid request format");
        }
    }
    
    private void handleGetAllUsers(HttpServletRequest request, HttpServletResponse response) throws IOException {
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "Not authenticated");
            return;
        }

        List<User> users = loginService.getAllUsers();
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("success", true);
        if (users == null) {
            responseData.put("users", Collections.emptyList());
        } else {
            List<User> sanitized = new ArrayList<>();
            for (User u : users) {
                if (u != null) {
                    sanitized.add(u.withoutPassword());
                }
            }
            responseData.put("users", sanitized);
        }
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