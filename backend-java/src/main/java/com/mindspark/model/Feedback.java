package com.mindspark.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Feedback {
    
    @JsonProperty("userId")
    private String userId;
    
    @JsonProperty("feedback")
    private String feedback;
    
    @JsonProperty("timestamp")
    private String timestamp;
    
    public Feedback() {
        // Default constructor for Jackson
    }
    
    public Feedback(String userId, String feedback, String timestamp) {
        this.userId = userId;
        this.feedback = feedback;
        this.timestamp = timestamp;
    }
    
    public String getUserId() {
        return userId;
    }
    
    public void setUserId(String userId) {
        this.userId = userId;
    }
    
    public String getFeedback() {
        return feedback;
    }
    
    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }
    
    public String getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
    
    @Override
    public String toString() {
        return "Feedback{" +
                "userId='" + userId + '\'' +
                ", feedback='" + feedback + '\'' +
                ", timestamp='" + timestamp + '\'' +
                '}';
    }
}

