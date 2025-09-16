package com.mindspark.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.inject.Inject;
import com.google.inject.Singleton;
import com.mindspark.model.Subject;
import com.mindspark.util.CorsUtils;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Singleton
public class SubjectController extends HttpServlet {
    
    private final ObjectMapper objectMapper;
    
    @Inject
    public SubjectController(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }
    
    @Override
    public void doGet(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        
        // Set CORS headers
        CorsUtils.setCorsHeaders(request, response);
        response.setContentType("application/json");
        
        try {
            List<Subject> subjects = Arrays.asList(
                new Subject("math", "Mathematics", true),
                new Subject("music", "Music", false),
                new Subject("chess", "Chess", false),
                new Subject("python", "Python Coding", false),
                new Subject("java", "Java Coding", false)
            );
            
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("success", true);
            responseData.put("subjects", subjects);
            
            response.getWriter().write(objectMapper.writeValueAsString(responseData));
            
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error retrieving subjects: " + e.getMessage());
            response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
        }
    }
    
    @Override
    protected void doOptions(HttpServletRequest request, HttpServletResponse response) {
        // Handle CORS preflight requests
        CorsUtils.setCorsHeaders(request, response);
        response.setStatus(HttpServletResponse.SC_OK);
    }
} 