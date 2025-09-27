package com.mindspark.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

import java.util.ArrayList;
import java.util.List;

@DynamoDbBean
public class User {
    
    private String username;
    private String userId;
    private int score;
    private int mathLevel;
    private String avatarLink;
    private String sortKey; // For composite key
    private String createdAt;
    private String updatedAt;
    private List<Activity> recentActivities; // Most recent 10 activities

    // Constructors
    public User() {}

    public User(String username, int score, int mathLevel) {
        this.username = username;
        this.score = score;
        this.mathLevel = mathLevel;
        this.sortKey = "userMetadata"; // Default sort key
    }

    public User(String username, int score, int mathLevel, String avatarLink) {
        this.username = username;
        this.score = score;
        this.mathLevel = mathLevel;
        this.avatarLink = avatarLink;
        this.sortKey = "userMetadata"; // Default sort key
    }

    // DynamoDB Key attributes
    @DynamoDbPartitionKey
    @DynamoDbAttribute("userId")
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    @DynamoDbSortKey
    @DynamoDbAttribute("sortKey")
    public String getSortKey() { return sortKey; }
    public void setSortKey(String sortKey) { this.sortKey = sortKey; }

    // Regular attributes
    @DynamoDbAttribute("username")
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    @DynamoDbAttribute("score")
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    @DynamoDbAttribute("mathLevel")
    public int getMathLevel() { return mathLevel; }
    public void setMathLevel(int mathLevel) { this.mathLevel = mathLevel; }

    @DynamoDbAttribute("avatarLink")
    public String getAvatarLink() { return avatarLink; }
    public void setAvatarLink(String avatarLink) { this.avatarLink = avatarLink; }

    @DynamoDbAttribute("createdAt")
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    @DynamoDbAttribute("updatedAt")
    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    @DynamoDbAttribute("recentActivities")
    @JsonProperty("recentActivities")
    public List<Activity> getRecentActivities() { 
        return recentActivities != null ? recentActivities : new ArrayList<>(); 
    }
    public void setRecentActivities(List<Activity> recentActivities) { 
        this.recentActivities = recentActivities; 
    }
    
    /**
     * Add a new activity to the recent activities list
     * Maintains a maximum of 10 activities (removes oldest if exceeded)
     * @param activity the activity to add
     */
    public void addActivity(Activity activity) {
        if (recentActivities == null) {
            recentActivities = new ArrayList<>();
        }
        
        // Add the new activity at the beginning (most recent first)
        recentActivities.add(0, activity);
        
        // Keep only the most recent 10 activities
        if (recentActivities.size() > 10) {
            recentActivities = recentActivities.subList(0, 10);
        }
    }
    
    /**
     * Add a new activity with reference ID
     * @param referenceId the reference ID (can be null)
     * @param timestamp the local timestamp from client
     * @param type the activity type
     */
    public void addActivity(String referenceId, String timestamp, ActivityType type) {
        addActivity(new Activity(referenceId, timestamp, type));
    }
    
    /**
     * Add a new activity without reference ID
     * @param timestamp the local timestamp from client
     * @param type the activity type
     */
    public void addActivity(String timestamp, ActivityType type) {
        addActivity(new Activity(timestamp, type));
    }
    
    /**
     * Get the most recent activities (up to 10)
     * @return list of recent activities, most recent first
     */
    public List<Activity> getRecentActivitiesList() {
        return getRecentActivities();
    }

    // Helper method to create user copy for responses
    public User copy() {
        User user = new User();
        user.username = this.username;
        user.userId = this.userId;
        user.score = this.score;
        user.mathLevel = this.mathLevel;
        user.avatarLink = this.avatarLink;
        user.sortKey = this.sortKey;
        user.createdAt = this.createdAt;
        user.updatedAt = this.updatedAt;
        user.recentActivities = this.recentActivities != null ? new ArrayList<>(this.recentActivities) : new ArrayList<>();
        return user;
    }

    @Override
    public String toString() {
        return "User{" +
                "username='" + username + '\'' +
                ", userId='" + userId + '\'' +
                ", score=" + score +
                ", mathLevel=" + mathLevel +
                ", avatarLink='" + avatarLink + '\'' +
                '}';
    }
} 