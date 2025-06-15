package com.mindspark;

import com.google.inject.Guice;
import com.google.inject.Injector;
import com.google.inject.servlet.GuiceServletContextListener;
import com.google.inject.servlet.ServletModule;
import com.mindspark.config.MindSparkModule;
import com.mindspark.controller.QuestionController;
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
            logger.info("   GET  /api/questions/math          - Get available levels for math");
            logger.info("   GET  /api/questions/math/level/1  - Get math questions for level 1");
            logger.info("   GET  /api/questions/math/level/2  - Get math questions for level 2");
            logger.info("   GET  /api/questions/math/level/3  - Get math questions for level 3");
            logger.info("   GET  /api/questions/math/health   - Health check");
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