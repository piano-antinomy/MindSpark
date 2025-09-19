package com.mindspark.controller;

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
import java.io.IOException;
import java.io.PrintWriter;
import java.util.*;

@Singleton
public class LeaderboardController extends HttpServlet {
    private static final Logger logger = LoggerFactory.getLogger(LeaderboardController.class);
    private final LoginService loginService;
    private final ObjectMapper objectMapper;
    
    @Inject
    public LeaderboardController(LoginService loginService, ObjectMapper objectMapper) {
        this.loginService = loginService;
        this.objectMapper = objectMapper;
        logger.info("LeaderboardController initialized successfully");
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        CorsUtils.setCorsHeaders(request, response);
        
        String pathInfo = request.getPathInfo();
        logger.info("LeaderboardController: Processing GET request for path: {}", pathInfo);
        
        try {
            if (pathInfo == null || pathInfo.equals("/get-focused-leaderboard")) {
                handleGetFocusedLeaderboard(request, response);
            } else {
                sendErrorResponse(response, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found");
            }
        } catch (Exception e) {
            logger.error("Error processing leaderboard request", e);
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
    
    private void handleGetFocusedLeaderboard(HttpServletRequest request, HttpServletResponse response) throws IOException {
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "Not authenticated");
            return;
        }

        // Get userId parameter
        String userId = request.getParameter("userId");
        if (userId == null || userId.trim().isEmpty()) {
            sendErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST, "userId parameter is required");
            return;
        }

        List<User> allUsers = loginService.getAllUsers();
        logger.info("LeaderboardController: Retrieved {} users from service", allUsers != null ? allUsers.size() : 0);
        
        if (allUsers == null || allUsers.isEmpty()) {
            logger.warn("LeaderboardController: No users found, returning empty list");
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("success", true);
            responseData.put("users", Collections.emptyList());
            sendJsonResponse(response, responseData);
            return;
        }

        // Sort users by score (descending)
        List<User> sortedUsers = new ArrayList<>(allUsers);
        sortedUsers.sort((a, b) -> Integer.compare(b.getScore(), a.getScore()));

        // Find current user index
        int currentUserIndex = -1;
        for (int i = 0; i < sortedUsers.size(); i++) {
            if (userId.equals(sortedUsers.get(i).getUserId())) {
                currentUserIndex = i;
                break;
            }
        }
        
        logger.info("LeaderboardController: Looking for userId={}, found at index={}", userId, currentUserIndex);

        List<User> focusedUsers;
        int currentRank = currentUserIndex + 1; // Declare currentRank outside the if-else blocks
        
        if (currentUserIndex == -1) {
            // User not found, return top 10
            focusedUsers = sortedUsers.subList(0, Math.min(10, sortedUsers.size()));
        } else if (currentRank <= 6) {
            // Current user is in top 6, show top 10
            focusedUsers = sortedUsers.subList(0, Math.min(10, sortedUsers.size()));
        } else {
            // Current user is rank 7 or lower
            // Show: top 3 + 3 above current + current + 3 below = 10 total
            int usersAboveCurrent = Math.min(3, currentRank - 1 - 3); // 3 users above current (excluding top 3)
            int usersBelowCurrent = Math.min(3, sortedUsers.size() - currentRank);
            
            int startIndex, endIndex;
            
            if (usersAboveCurrent < 3) {
                // Less than 3 users above current (after top 3), show more below
                int remainingSlots = 10 - 3 - usersAboveCurrent - 1; // -1 for current user
                startIndex = 0; // Always start from top 3
                endIndex = Math.min(sortedUsers.size(), currentRank + remainingSlots);
            } else if (usersBelowCurrent < 3) {
                // Less than 3 users below current, show more above
                int remainingSlots = 10 - 3 - usersBelowCurrent - 1; // -1 for current user
                startIndex = 0; // Always start from top 3
                endIndex = Math.min(sortedUsers.size(), currentRank + usersBelowCurrent);
            } else {
                // Normal case: top 3 + 3 above current + current + 3 below
                startIndex = 0; // Always start from top 3
                endIndex = Math.min(sortedUsers.size(), currentRank + 3);
            }
            
            focusedUsers = sortedUsers.subList(startIndex, endIndex);
        }

        // Sanitize users and add rank information
        List<Map<String, Object>> sanitizedUsers = new ArrayList<>();
        int startIndex = 0; // Initialize startIndex for rank calculation
        if (currentUserIndex != -1 && currentRank > 6) {
            // Calculate startIndex for rank 7+ case
            int usersAboveCurrent = Math.min(3, currentRank - 1 - 3);
            int usersBelowCurrent = Math.min(3, sortedUsers.size() - currentRank);
            
            if (usersAboveCurrent < 3) {
                int remainingSlots = 10 - 3 - usersAboveCurrent - 1;
                startIndex = 0;
            } else if (usersBelowCurrent < 3) {
                int remainingSlots = 10 - 3 - usersBelowCurrent - 1;
                startIndex = 0;
            } else {
                startIndex = 0;
            }
        }
        
        for (int i = 0; i < focusedUsers.size(); i++) {
            User user = focusedUsers.get(i);
            if (user != null) {
                Map<String, Object> userData = new HashMap<>();
                userData.put("userId", user.getUserId());
                userData.put("username", user.getUsername());
                userData.put("score", user.getScore());
                userData.put("mathLevel", user.getMathLevel());
                userData.put("email", user.getEmail());
                userData.put("fullName", user.getFullName());
                userData.put("createdAt", user.getCreatedAt());
                userData.put("updatedAt", user.getUpdatedAt());
                userData.put("rank", startIndex + i + 1); // Add rank information
                sanitizedUsers.add(userData);
            }
        }

        logger.info("LeaderboardController: Returning {} focused users for userId={}", sanitizedUsers.size(), userId);
        
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("success", true);
        responseData.put("users", sanitizedUsers);
        sendJsonResponse(response, responseData);
    }
    
    private void sendJsonResponse(HttpServletResponse response, Object data) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter writer = response.getWriter();
        objectMapper.writeValue(writer, data);
        writer.flush();
    }
    
    private void sendErrorResponse(HttpServletResponse response, int statusCode, String message) throws IOException {
        response.setStatus(statusCode);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        Map<String, Object> errorData = new HashMap<>();
        errorData.put("success", false);
        errorData.put("error", message);
        
        PrintWriter writer = response.getWriter();
        objectMapper.writeValue(writer, errorData);
        writer.flush();
    }
}
