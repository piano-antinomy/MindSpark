package com.mindspark.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class User {
    
    @JsonProperty("username")
    private String username;
    
    @JsonProperty("password")
    private String password;
    
    @JsonProperty("userId")
    private String userId;
    
    @JsonProperty("score")
    private int score;
    
    @JsonProperty("mathLevel")
    private int mathLevel;
    
    @JsonProperty("email")
    private String email;
    
    @JsonProperty("fullName")
    private String fullName;

    // Constructors
    public User() {}

    public User(String username, String password, int score, int mathLevel) {
        this.username = username;
        this.password = password;
        this.score = score;
        this.mathLevel = mathLevel;
    }

    public User(String username, String password, int score, int mathLevel, String email, String fullName) {
        this.username = username;
        this.password = password;
        this.score = score;
        this.mathLevel = mathLevel;
        this.email = email;
        this.fullName = fullName;
    }

    // Getters and Setters
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public int getMathLevel() { return mathLevel; }
    public void setMathLevel(int mathLevel) { this.mathLevel = mathLevel; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    // Helper method to create user without password for responses
    public User withoutPassword() {
        User user = new User();
        user.username = this.username;
        user.userId = this.userId;
        user.score = this.score;
        user.mathLevel = this.mathLevel;
        user.email = this.email;
        user.fullName = this.fullName;
        return user;
    }

    @Override
    public String toString() {
        return "User{" +
                "username='" + username + '\'' +
                ", userId='" + userId + '\'' +
                ", score=" + score +
                ", mathLevel=" + mathLevel +
                ", email='" + email + '\'' +
                ", fullName='" + fullName + '\'' +
                '}';
    }
} 