
package com.mindspark.aws.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.google.inject.Guice;
import com.google.inject.Injector;
import com.google.inject.servlet.ServletModule;
import com.mindspark.config.MindSparkModule;
import com.mindspark.controller.AuthController;
import com.mindspark.controller.ProgressController;
import com.mindspark.controller.QuestionController;
import com.mindspark.controller.QuizController;
import com.mindspark.controller.SubjectController;
import com.mindspark.controller.LeaderboardController;
import com.mindspark.controller.FeedbackController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class MindSparkLambdaHandler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    private static final Logger logger = LoggerFactory.getLogger(MindSparkLambdaHandler.class);
    private final Injector injector;

    private static final Set<String> ALLOWED_ORIGINS = new HashSet<>() {{
        add("https://main.d1e5wuvsqvmyqw.amplifyapp.com");
        add("https://www.sparksio.com");
        add("http://localhost:3000");
    }};

    public MindSparkLambdaHandler() {
        injector = Guice.createInjector(
                new MindSparkModule(),
                new ServletModule()
        );
    }

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent apiGatewayProxyRequestEvent, Context context) {
        try {
            logger.info("Processing request: {}", apiGatewayProxyRequestEvent);

            // Create mock HttpServletRequest
            HttpServletRequest request;

            // Create mock HttpServletResponse
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            HttpServletResponse response = APIGatewayProxyResponseEventMapper.createHttpServletResponse(outputStream);

            // Route to appropriate controller based on path
            String path = apiGatewayProxyRequestEvent.getPath();
            String method = apiGatewayProxyRequestEvent.getHttpMethod();

            if (path.startsWith("/auth")) {
                request = APIGatewayProxyRequestEventMapper.createHttpServletRequest(apiGatewayProxyRequestEvent, "/auth");
                AuthController authController = injector.getInstance(AuthController.class);
                if ("POST".equals(method)) {
                    authController.doPost(request, response);
                } else if ("GET".equals(method)) {
                    authController.doGet(request, response);
                }
            } else if (path.startsWith("/progress")) {
                request = APIGatewayProxyRequestEventMapper.createHttpServletRequest(apiGatewayProxyRequestEvent, "/progress");
                ProgressController progressController = injector.getInstance(ProgressController.class);
                if ("POST".equals(method)) {
                    progressController.doPost(request, response);
                } else if ("GET".equals(method)) {
                    progressController.doGet(request, response);
                }
            } else if (path.startsWith("/questions/math")) {
                request = APIGatewayProxyRequestEventMapper.createHttpServletRequest(apiGatewayProxyRequestEvent, "/questions/math");
                QuestionController questionController = injector.getInstance(QuestionController.class);
                if ("GET".equals(method)) {
                    questionController.doGet(request, response);
                }
            } else if (path.startsWith("/quiz")) {
                request = APIGatewayProxyRequestEventMapper.createHttpServletRequest(apiGatewayProxyRequestEvent, "/quiz");
                QuizController quizController = injector.getInstance(QuizController.class);
                if ("POST".equals(method)) {
                    quizController.doPost(request, response);
                } else if ("GET".equals(method)) {
                    quizController.doGet(request, response);
                }
            } else if (path.startsWith("/leaderboard")) {
                request = APIGatewayProxyRequestEventMapper.createHttpServletRequest(apiGatewayProxyRequestEvent, "/leaderboard");
                LeaderboardController leaderboardController = injector.getInstance(LeaderboardController.class);
                if ("GET".equals(method)) {
                    leaderboardController.doGet(request, response);
                }
            } else if (path.startsWith("/feedback")) {
                request = APIGatewayProxyRequestEventMapper.createHttpServletRequest(apiGatewayProxyRequestEvent, "/feedback");
                FeedbackController feedbackController = injector.getInstance(FeedbackController.class);
                if ("POST".equals(method)) {
                    feedbackController.doPost(request, response);
                }
            } else if (path.startsWith("/subjects")) {
                request = APIGatewayProxyRequestEventMapper.createHttpServletRequest(apiGatewayProxyRequestEvent, "/subjects");
                SubjectController subjectController = injector.getInstance(SubjectController.class);
                if ("GET".equals(method)) {
                    subjectController.doGet(request, response);
                }
            } else {
                request = APIGatewayProxyRequestEventMapper.createHttpServletRequest(apiGatewayProxyRequestEvent, "");
                // Default response for unknown paths
                response.setStatus(404);
                response.setContentType("application/json");
                PrintWriter writer = response.getWriter();
                writer.write("{\"error\": \"Not found\"}");
                writer.flush();
            }

            // Set CORS headers on successful responses
            applyCorsHeaders(apiGatewayProxyRequestEvent, response);

            // Convert response back to APIGatewayProxyResponseEvent
            return APIGatewayProxyResponseEventMapper.createApiGatewayResponse(response, outputStream);

        } catch (Exception e) {
            logger.error("Error processing request", e);
            APIGatewayProxyResponseEvent errorResponse = new APIGatewayProxyResponseEvent();
            errorResponse.setStatusCode(500);
            errorResponse.setBody("{\"error\": \"Internal server error: " + e.getMessage() + "\"}");

            // Ensure CORS headers are present on error responses too
            Map<String, String> headers = new HashMap<>();
            String origin = extractOrigin(apiGatewayProxyRequestEvent);
            if (origin != null && ALLOWED_ORIGINS.contains(origin)) {
                headers.put("Access-Control-Allow-Origin", origin);
                headers.put("Access-Control-Allow-Credentials", "true");
                headers.put("Vary", "Origin");
            }
            if (!headers.isEmpty()) {
                errorResponse.setHeaders(headers);
            }
            return errorResponse;
        }
    }

    private static void applyCorsHeaders(APIGatewayProxyRequestEvent requestEvent, HttpServletResponse response) {
        String origin = extractOrigin(requestEvent);
        if (origin != null && ALLOWED_ORIGINS.contains(origin)) {
            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Access-Control-Allow-Credentials", "true");
            response.setHeader("Vary", "Origin");
        }
    }

    private static String extractOrigin(APIGatewayProxyRequestEvent requestEvent) {
        if (requestEvent == null || requestEvent.getHeaders() == null) {
            return null;
        }
        for (Map.Entry<String, String> entry : requestEvent.getHeaders().entrySet()) {
            if (entry.getKey() != null && entry.getKey().equalsIgnoreCase("Origin")) {
                return entry.getValue();
            }
        }
        return null;
    }
}

