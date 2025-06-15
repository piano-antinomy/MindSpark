package com.mindspark.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class User {
    
    @JsonProperty("username")
    private String username;
    
    @JsonProperty("password")
    private String password;
    
    @JsonProperty("score")
    private int score;
    
    @JsonProperty("math_level")
    private String mathLevel;
    
    @JsonProperty("email")
    private String email;
    
    @JsonProperty("full_name")
    private String fullName;

    // Constructors
    public User() {}

    public User(String username, String password, int score, String mathLevel) {
        this.username = username;
        this.password = password;
        this.score = score;
        this.mathLevel = mathLevel;
    }

    public User(String username, String password, int score, String mathLevel, String email, String fullName) {
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

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public String getMathLevel() { return mathLevel; }
    public void setMathLevel(String mathLevel) { this.mathLevel = mathLevel; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    // Helper method to create user without password for responses
    public User withoutPassword() {
        User user = new User();
        user.username = this.username;
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
                ", score=" + score +
                ", mathLevel='" + mathLevel + '\'' +
                ", email='" + email + '\'' +
                ", fullName='" + fullName + '\'' +
                '}';
    }
} 