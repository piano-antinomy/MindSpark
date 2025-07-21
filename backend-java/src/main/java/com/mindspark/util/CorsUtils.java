package com.mindspark.util;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class CorsUtils {
    
    public static void setCorsHeaders(HttpServletRequest request, HttpServletResponse response) {
        // Get the origin from the request and allow it dynamically
        String origin = request.getHeader("Origin");
        if (origin != null) {
            response.setHeader("Access-Control-Allow-Origin", origin);
        } else {
            // Fallback for requests without origin header
            response.setHeader("Access-Control-Allow-Origin", "*");
        }
        
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.setHeader("Access-Control-Allow-Credentials", "true");
    }
} 