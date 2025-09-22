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
    public void doGet(HttpServletRequest request, HttpServletResponse response) 
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
    public void doOptions(HttpServletRequest request, HttpServletResponse response) 
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

        // Calculate ranks for all users first
        List<Map<String, Object>> usersWithRanks = new ArrayList<>();
        for (int i = 0; i < sortedUsers.size(); i++) {
            User user = sortedUsers.get(i);
            if (user != null) {
                Map<String, Object> userData = new HashMap<>();
                userData.put("userId", user.getUserId());
                userData.put("username", user.getUsername());
                userData.put("score", user.getScore());
                userData.put("mathLevel", user.getMathLevel());
                userData.put("avatarLink", user.getAvatarLink());
                userData.put("createdAt", user.getCreatedAt());
                userData.put("updatedAt", user.getUpdatedAt());
                userData.put("rank", i + 1); // Global rank based on sorted position
                usersWithRanks.add(userData);
            }
        }

        // Find current user index
        int currentUserIndex = -1;
        for (int i = 0; i < usersWithRanks.size(); i++) {
            if (userId.equals(usersWithRanks.get(i).get("userId"))) {
                currentUserIndex = i;
                break;
            }
        }
        
        logger.info("LeaderboardController: Looking for userId={}, found at index={}", userId, currentUserIndex);

        List<Map<String, Object>> focusedUsers = new ArrayList<>();
        int currentRank = currentUserIndex + 1;
        
        if (currentUserIndex == -1) {
            // User not found, return top 10
            focusedUsers = usersWithRanks.subList(0, Math.min(10, usersWithRanks.size()));
        } else if (currentRank <= 6) {
            // Current user is in top 6, show top 10
            focusedUsers = usersWithRanks.subList(0, Math.min(10, usersWithRanks.size()));
        } else {
            // Current user is rank 7 or lower
            // Build focused list: top 3 + 3 above current + current + 3 below = 10 total
            
            // 1. Always add top 3 users first
            for (int i = 0; i < Math.min(3, usersWithRanks.size()); i++) {
                focusedUsers.add(usersWithRanks.get(i));
            }
            
            // 2. Add 3 users immediately above current user (after top 3)
            int usersAboveCurrent = Math.min(3, currentRank - 1 - 3); // 3 users above current (excluding top 3)
            int startAbove = Math.max(3, currentRank - 1 - usersAboveCurrent); // Start from rank 4 or higher
            for (int i = startAbove; i < currentRank - 1 && focusedUsers.size() < 10; i++) {
                focusedUsers.add(usersWithRanks.get(i));
            }
            
            // 3. Add current user
            if (focusedUsers.size() < 10) {
                focusedUsers.add(usersWithRanks.get(currentUserIndex));
            }
            
            // 4. Add 3 users immediately below current user
            int usersBelowCurrent = Math.min(3, usersWithRanks.size() - currentRank);
            for (int i = currentRank; i < currentRank + usersBelowCurrent && focusedUsers.size() < 10; i++) {
                focusedUsers.add(usersWithRanks.get(i));
            }
            
            // 5. If we still have slots and there are more users below, fill them
            while (focusedUsers.size() < 10 && currentRank + usersBelowCurrent < usersWithRanks.size()) {
                focusedUsers.add(usersWithRanks.get(currentRank + usersBelowCurrent));
                usersBelowCurrent++;
            }
            
            // 6. If we still have slots and there are more users above (after top 3), fill them
            while (focusedUsers.size() < 10 && startAbove > 3) {
                startAbove--;
                focusedUsers.add(usersWithRanks.get(startAbove));
            }
        }

        logger.info("LeaderboardController: Returning {} focused users for userId={}", focusedUsers.size(), userId);
        
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("success", true);
        responseData.put("users", focusedUsers);
        responseData.put("totalUsers", usersWithRanks.size());
        responseData.put("currentUserRank", currentUserIndex != -1 ? currentRank : null);
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
