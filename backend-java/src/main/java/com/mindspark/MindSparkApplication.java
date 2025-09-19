package com.mindspark;

import com.google.inject.Guice;
import com.google.inject.Injector;
import com.google.inject.servlet.GuiceServletContextListener;
import com.google.inject.servlet.ServletModule;
import com.mindspark.config.MindSparkModule;
import com.mindspark.controller.QuestionController;
import com.mindspark.controller.AuthController;
import com.mindspark.controller.SubjectController;
import com.mindspark.controller.ProgressController;
import com.mindspark.controller.QuizController;
import com.mindspark.controller.LeaderboardController;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.ServletContextEvent;

public class MindSparkApplication {
    
    private static final Logger logger = LoggerFactory.getLogger(MindSparkApplication.class);
    private static final int PORT = 4072;
    
    public static void main(String[] args) {
        try {
            new MindSparkApplication().start();
        } catch (Exception e) {
            logger.error("Failed to start application", e);
            System.exit(1);
        }
    }
    
    public void start() throws Exception {
        logger.info("Starting MindSpark Java Backend on port {}", PORT);
        
        // Create Jetty server
        Server server = new Server(PORT);
        
        // Create servlet context handler
        ServletContextHandler context = new ServletContextHandler(ServletContextHandler.SESSIONS);
        context.setContextPath("/");
        server.setHandler(context);
        
        // Add Guice listener
        context.addEventListener(new GuiceServletConfig());
        
        // Add Guice filter
        context.addFilter(com.google.inject.servlet.GuiceFilter.class, "/*", null);
        
        try {
            server.start();
            logger.info("✅ MindSpark Java Backend started successfully!");
            logger.info("🌐 Server running on: http://localhost:{}", PORT);
            logger.info("📚 Available endpoints:");
            logger.info("   🔐 Authentication & User Management:");
            logger.info("   POST /api/auth/login              - User login");
            logger.info("   POST /api/auth/logout             - User logout");
            logger.info("   GET  /api/auth/profile            - Get user profile");
            logger.info("   POST /api/auth/profile            - Create/update user profile");
            logger.info("   GET  /api/auth/status             - Check authentication status");
            logger.info("   POST /api/auth/update-scores      - Update user scores");
            logger.info("   📖 Subjects & Content:");
            logger.info("   GET  /api/subjects                - Get available subjects");
            logger.info("   GET  /api/questions/math          - Get available levels for math");
            logger.info("   GET  /api/questions/math/level/{level} - Get math questions for level");
            logger.info("   GET  /api/questions/math/level/{level}/years - Get available years for level");
            logger.info("   GET  /api/questions/math/level/{level}/year/{year} - Get questions for level and year");
            logger.info("   GET  /api/questions/math/health   - Math service health check");
            logger.info("   📈 Progress Tracking:");
            logger.info("   POST /api/progress/track          - Track question answer");
            logger.info("   GET  /api/progress/user/{userId}  - Get user progress");
            logger.info("   GET  /api/progress/user/{userId}/quiz/{quizId} - Get quiz progress");
            logger.info("   DELETE /api/progress/user/{userId} - Clear user progress");
            logger.info("   DELETE /api/progress/user/{userId}/quiz/{quizId} - Reset quiz progress");
            logger.info("   GET  /api/progress/admin/all      - Get all user progress (admin)");
            logger.info("   GET  /api/progress/health         - Progress service health check");
            logger.info("   🧩 Quiz Management:");
            logger.info("   POST /api/quiz/create             - Create new quiz");
            logger.info("   POST /api/quiz/update             - Update quiz progress");
            logger.info("   GET  /api/quiz/user/{userId}      - Get user quizzes");
            logger.info("   GET  /api/quiz/user/{userId}/quiz/{quizId} - Get specific quiz");
            logger.info("   GET  /api/quiz/user/{userId}/quiz/{quizId}/questions - Get quiz questions");
            logger.info("   GET  /api/quiz/health             - Quiz service health check");
            logger.info("   🔧 System:");
            logger.info("   All endpoints support CORS and OPTIONS preflight requests");
            logger.info("   JSON responses with UTF-8 encoding");
            logger.info("   Session-based authentication");
            logger.info("Press Ctrl+C to stop the server");
            
            server.join();
        } catch (Exception e) {
            logger.error("Server failed to start", e);
            throw e;
        } finally {
            server.destroy();
        }
    }
    
    public static class GuiceServletConfig extends GuiceServletContextListener {
        
        @Override
        protected Injector getInjector() {
            return Guice.createInjector(
                new MindSparkModule(),
                new ServletModule() {
                    @Override
                    protected void configureServlets() {
                        serve("/api/questions/math/*").with(QuestionController.class);
                        serve("/api/auth/*").with(AuthController.class);
                        serve("/api/subjects").with(SubjectController.class);
                        serve("/api/progress/*").with(ProgressController.class);
                        serve("/api/quiz/*").with(QuizController.class);
                        serve("/api/leaderboard/*").with(LeaderboardController.class);
                    }
                }
            );
        }
        
        @Override
        public void contextInitialized(ServletContextEvent servletContextEvent) {
            super.contextInitialized(servletContextEvent);
            logger.info("Guice context initialized");
        }
        
        @Override
        public void contextDestroyed(ServletContextEvent servletContextEvent) {
            super.contextDestroyed(servletContextEvent);
            logger.info("Guice context destroyed");
        }
    }
} 