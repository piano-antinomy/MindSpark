package com.mindspark.local.ddb;

import java.io.File;
import java.io.IOException;
import java.util.concurrent.TimeUnit;

public class LocalHostDynamoDB {
    private Process dynamoDBProcess;
    private final int port = 7076;
    private final String jarPath;
    private final String libPath;

    public LocalHostDynamoDB() {
        this("../localTest/DDB/DynamoDBLocal.jar", "../localTest/DDB/DynamoDBLocal_lib");
    }

    public LocalHostDynamoDB(String dynamoDBLocalJarPath, String libPath) {
        this.jarPath = dynamoDBLocalJarPath;
        this.libPath = libPath;
        validatePaths();
    }

    private void validatePaths() {
        File jarFile = new File(jarPath);
        if (!jarFile.exists()) {
            throw new IllegalArgumentException("DynamoDB Local JAR file not found: " + jarPath);
        }
        if (!jarFile.canRead()) {
            throw new IllegalArgumentException("Cannot read DynamoDB Local JAR file: " + jarPath);
        }
        
        File libDir = new File(libPath);
        if (!libDir.exists()) {
            System.out.println("Warning: Native library directory not found: " + libPath);
        }
    }

    public void start() throws IOException {
        if (dynamoDBProcess != null && dynamoDBProcess.isAlive()) {
            throw new IllegalStateException("DynamoDB Local is already running.");
        }
        
        // Get the filename from the full path
        String jarFileName = new File(jarPath).getName();
        
        ProcessBuilder builder = new ProcessBuilder(
                "java", 
                "-Djava.library.path=" + libPath,
                "-jar", jarFileName,
                "-inMemory",
                "-port", String.valueOf(port)
        );
        // Set working directory to the directory containing the JAR file
        builder.directory(new File(jarPath).getParentFile());
        builder.inheritIO();
        
        System.out.println("Starting DynamoDB Local on port " + port + "...");
        System.out.println("Working directory: " + builder.directory().getAbsolutePath());
        System.out.println("JAR filename: " + jarFileName);
        System.out.println("Lib path: " + libPath);
        
        dynamoDBProcess = builder.start();
        
        // Wait a moment to check if the process started successfully
        try {
            Thread.sleep(2000);
            if (!dynamoDBProcess.isAlive()) {
                throw new IOException("DynamoDB Local failed to start. Exit code: " + dynamoDBProcess.exitValue());
            }
            System.out.println("DynamoDB Local started successfully on port " + port);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("Interrupted while starting DynamoDB Local", e);
        }
    }

    public void stop() {
        if (dynamoDBProcess != null && dynamoDBProcess.isAlive()) {
            System.out.println("Stopping DynamoDB Local...");
            dynamoDBProcess.destroy();
            
            // Wait for the process to terminate gracefully
            try {
                if (!dynamoDBProcess.waitFor(10, TimeUnit.SECONDS)) {
                    System.out.println("Force killing DynamoDB Local process...");
                    dynamoDBProcess.destroyForcibly();
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                System.out.println("Interrupted while stopping DynamoDB Local");
            }
            
            System.out.println("DynamoDB Local stopped");
        }
    }

    public int getPort() {
        return port;
    }

    public String getEndpointUrl() {
        return "http://localhost:" + port;
    }

    public boolean isRunning() {
        return dynamoDBProcess != null && dynamoDBProcess.isAlive();
    }
}
