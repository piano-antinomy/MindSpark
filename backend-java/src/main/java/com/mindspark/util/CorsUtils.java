package com.mindspark.util;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class CorsUtils {
    
    public static void setCorsHeaders(HttpServletRequest request, HttpServletResponse response) {
        // Get the origin from the request
        String origin = request.getHeader("Origin");
        
        // Allow specific origins (localhost for development)
        if (origin != null && (origin.startsWith("http://localhost:") || origin.startsWith("https://localhost:"))) {
            response.setHeader("Access-Control-Allow-Origin", origin);
        } else {
            // Fallback to localhost:3000 for development
            response.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
        }
        
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.setHeader("Access-Control-Allow-Credentials", "true");
    }
} 