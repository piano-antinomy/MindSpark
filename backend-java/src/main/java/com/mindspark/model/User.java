package com.mindspark.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

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