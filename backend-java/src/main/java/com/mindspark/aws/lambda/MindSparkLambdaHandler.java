
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;

public class MindSparkLambdaHandler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    private static final Logger logger = LoggerFactory.getLogger(MindSparkLambdaHandler.class);
    private final Injector injector;

    public MindSparkLambdaHandler() {
        injector = Guice.createInjector(
                new MindSparkModule(),
                new ServletModule()
        );
    }

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent apiGatewayProxyRequestEvent, Context context) {
        try {
            logger.info("Processing request: {} {}", apiGatewayProxyRequestEvent.getHttpMethod(), apiGatewayProxyRequestEvent.getPath());

            // Create mock HttpServletRequest
            HttpServletRequest request = APIGatewayProxyRequestEventMapper.createHttpServletRequest(apiGatewayProxyRequestEvent);

            // Create mock HttpServletResponse
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            HttpServletResponse response = APIGatewayProxyResponseEventMapper.createHttpServletResponse(outputStream);

            // Route to appropriate controller based on path
            String path = apiGatewayProxyRequestEvent.getPath();
            String method = apiGatewayProxyRequestEvent.getHttpMethod();

            if (path.startsWith("/auth")) {
                AuthController authController = injector.getInstance(AuthController.class);
                if ("POST".equals(method)) {
                    authController.doPost(request, response);
                } else if ("GET".equals(method)) {
                    authController.doGet(request, response);
                }
            } else if (path.startsWith("/progress")) {
                ProgressController progressController = injector.getInstance(ProgressController.class);
                if ("POST".equals(method)) {
                    progressController.doPost(request, response);
                } else if ("GET".equals(method)) {
                    progressController.doGet(request, response);
                }
            } else if (path.startsWith("/questions")) {
                QuestionController questionController = injector.getInstance(QuestionController.class);
                if ("GET".equals(method)) {
                    questionController.doGet(request, response);
                }
            } else if (path.startsWith("/quiz")) {
                QuizController quizController = injector.getInstance(QuizController.class);
                if ("POST".equals(method)) {
                    quizController.doPost(request, response);
                } else if ("GET".equals(method)) {
                    quizController.doGet(request, response);
                }
            } else if (path.startsWith("/subjects")) {
                SubjectController subjectController = injector.getInstance(SubjectController.class);
                if ("GET".equals(method)) {
                    subjectController.doGet(request, response);
                }
            } else {
                // Default response for unknown paths
                response.setStatus(404);
                response.setContentType("application/json");
                PrintWriter writer = response.getWriter();
                writer.write("{\"error\": \"Not found\"}");
                writer.flush();
            }

            // Convert response back to APIGatewayProxyResponseEvent
            return APIGatewayProxyResponseEventMapper.createApiGatewayResponse(response, outputStream);

        } catch (Exception e) {
            logger.error("Error processing request", e);
            APIGatewayProxyResponseEvent errorResponse = new APIGatewayProxyResponseEvent();
            errorResponse.setStatusCode(500);
            errorResponse.setBody("{\"error\": \"Internal server error: " + e.getMessage() + "\"}");
            return errorResponse;
        }
    }
}

