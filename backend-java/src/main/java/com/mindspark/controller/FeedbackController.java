package com.mindspark.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindspark.config.LocalMode;
import com.mindspark.model.Feedback;
import com.mindspark.util.CorsUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

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
public class FeedbackController extends HttpServlet {
    
    private static final Logger logger = LoggerFactory.getLogger(FeedbackController.class);
    private static final String FEEDBACK_BUCKET = "mindspark-user-feedbacks";
    
    private final ObjectMapper objectMapper;
    private final boolean localMode;
    private final S3Client s3Client;

    @Inject
    public FeedbackController(ObjectMapper objectMapper, @LocalMode boolean localMode, S3Client s3Client) {
        this.objectMapper = objectMapper;
        this.localMode = localMode;
        this.s3Client = s3Client;
    }
    
    @Override
    public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        // Enable CORS
        CorsUtils.setCorsHeaders(request, response);
        
        String pathInfo = request.getPathInfo();
        logger.info("Processing POST request for feedback path: {}", pathInfo);
        
        try {
            if (pathInfo == null || pathInfo.equals("/submit") || pathInfo.equals("/")) {
                handleSubmitFeedback(request, response);
            } else {
                sendErrorResponse(response, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found");
            }
        } catch (Exception e) {
            logger.error("Error processing feedback request", e);
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
    
    private void handleSubmitFeedback(HttpServletRequest request, HttpServletResponse response) throws IOException {
        // Read request body
        StringBuilder requestBody = new StringBuilder();
        try (BufferedReader reader = request.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                requestBody.append(line);
            }
        }
        
        try {
            Feedback feedback = objectMapper.readValue(requestBody.toString(), Feedback.class);
            
            // Validate required fields
            if (feedback.getFeedback() == null || feedback.getFeedback().trim().isEmpty()) {
                sendErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST, "Feedback content is required");
                return;
            }
            
            // Generate timestamp on the backend
            String timestamp = java.time.Instant.now().toString();
            feedback.setTimestamp(timestamp);
            
            // Log the received feedback (dummy implementation as requested)
            logger.info("=================================================");
            logger.info("📝 FEEDBACK RECEIVED");
            logger.info("=================================================");
            logger.info("User ID: {}", feedback.getUserId() != null ? feedback.getUserId() : "anonymous");
            logger.info("Timestamp: {}", feedback.getTimestamp());
            logger.info("Feedback Content:");
            logger.info("--------------------------------------------------");
            logger.info("{}", feedback.getFeedback());
            logger.info("=================================================");
            
            // only in prod, save feedback to S3
            if (!localMode) {
                saveFeedbackToS3(feedback);
            }
            // Send success response
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("success", true);
            responseData.put("message", "Feedback received successfully");
            responseData.put("timestamp", timestamp);
            
            sendJsonResponse(response, responseData);
            
        } catch (Exception e) {
            logger.error("Error parsing feedback request", e);
            sendErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST, "Invalid request format");
        }
    }
    
    private void saveFeedbackToS3(Feedback feedback) {
        try {
            // Determine userId - use "anonymous" if null or empty
            String userId = (feedback.getUserId() == null || feedback.getUserId().trim().isEmpty()) 
                ? "anonymous" 
                : feedback.getUserId();
            
            // Create filename-safe timestamp (replace colons and other special chars)
            String timestamp = feedback.getTimestamp()
                .replace(":", "-")
                .replace(".", "-")
                .replaceAll("[^a-zA-Z0-9-_]", "_");
            
            // Create S3 key: userId/feedback_timestamp.json
            String s3Key = userId + "/feedback_" + timestamp + ".json";
            
            // Serialize feedback to JSON
            String feedbackJson = objectMapper.writeValueAsString(feedback);
            
            // Create PutObjectRequest
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(FEEDBACK_BUCKET)
                .key(s3Key)
                .contentType("application/json")
                .build();
            
            // Upload to S3
            s3Client.putObject(putObjectRequest, RequestBody.fromString(feedbackJson));
            
            logger.info("✅ Successfully saved feedback to S3: s3://{}/{}", FEEDBACK_BUCKET, s3Key);
            
        } catch (Exception e) {
            logger.error("❌ Failed to save feedback to S3", e);
            // Don't throw - we don't want to fail the user request if S3 upload fails
        }
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

