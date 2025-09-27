package com.mindspark.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;

/**
 * Represents a user activity with reference, timestamp, and type
 */
@DynamoDbBean
public class Activity {
    
    private String referenceId; // Can be quiz ID, etc. Nullable for activities like registration
    private String timestamp; // Local timestamp from client side
    private ActivityType type;
    
    // Constructors
    public Activity() {}
    
    public Activity(String referenceId, String timestamp, ActivityType type) {
        this.referenceId = referenceId;
        this.timestamp = timestamp;
        this.type = type;
    }
    
    public Activity(String timestamp, ActivityType type) {
        this(null, timestamp, type);
    }
    
    // Getters and Setters
    @DynamoDbAttribute("referenceId")
    @JsonProperty("referenceId")
    public String getReferenceId() {
        return referenceId;
    }
    
    public void setReferenceId(String referenceId) {
        this.referenceId = referenceId;
    }
    
    @DynamoDbAttribute("timestamp")
    @JsonProperty("timestamp")
    public String getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
    
    @DynamoDbAttribute("type")
    @JsonProperty("type")
    public String getType() {
        return type != null ? type.getValue() : null;
    }
    
    public void setType(String type) {
        this.type = ActivityType.fromValue(type);
    }
    
    @JsonProperty("activityType")
    public ActivityType getActivityType() {
        return type;
    }
    
    public void setActivityType(ActivityType type) {
        this.type = type;
    }
    
    @Override
    public String toString() {
        return "Activity{" +
                "referenceId='" + referenceId + '\'' +
                ", timestamp='" + timestamp + '\'' +
                ", type=" + type +
                '}';
    }
    
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        
        Activity activity = (Activity) obj;
        
        if (referenceId != null ? !referenceId.equals(activity.referenceId) : activity.referenceId != null)
            return false;
        if (timestamp != null ? !timestamp.equals(activity.timestamp) : activity.timestamp != null)
            return false;
        return type == activity.type;
    }
    
    @Override
    public int hashCode() {
        int result = referenceId != null ? referenceId.hashCode() : 0;
        result = 31 * result + (timestamp != null ? timestamp.hashCode() : 0);
        result = 31 * result + (type != null ? type.hashCode() : 0);
        return result;
    }
}
