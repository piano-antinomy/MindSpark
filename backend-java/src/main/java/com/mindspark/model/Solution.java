package com.mindspark.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Represents a solution for a math problem.
 * Compatible with both simple string format (from JSON files) and object format.
 */
public class Solution {
    
    @JsonProperty("solution_id")
    private int solutionId;
    
    @JsonProperty("type")
    private String type;
    
    @JsonProperty("text")
    private String text;
    
    @JsonProperty("insertions")
    private java.util.Map<String, Object> insertions;

    // Default constructor
    public Solution() {}
    
    // Constructor for string-based solutions (from JSON files)
    @JsonCreator
    public Solution(String solutionText) {
        this.text = solutionText;
        this.type = "html"; // Default type for string solutions
        this.solutionId = 0; // Default ID
    }
    
    // Constructor for object-based solutions
    public Solution(int solutionId, String type, String text) {
        this.solutionId = solutionId;
        this.type = type;
        this.text = text;
    }

    // Getters and Setters
    public int getSolutionId() { 
        return solutionId; 
    }
    
    public void setSolutionId(int solutionId) { 
        this.solutionId = solutionId; 
    }

    public String getType() { 
        return type != null ? type : "html"; 
    }
    
    public void setType(String type) { 
        this.type = type; 
    }

    public String getText() { 
        return text; 
    }
    
    public void setText(String text) { 
        this.text = text; 
    }
    
    public java.util.Map<String, Object> getInsertions() {
        return insertions;
    }
    
    public void setInsertions(java.util.Map<String, Object> insertions) {
        this.insertions = insertions;
    }

    // For backward compatibility - return text as value
    public String getValue() {
        return text;
    }
    
    public void setValue(String value) {
        this.text = value;
    }

    @Override
    public String toString() {
        return "Solution{" +
                "solutionId=" + solutionId +
                ", type='" + type + '\'' +
                ", text='" + (text != null ? text.substring(0, Math.min(text.length(), 50)) + "..." : "null") + '\'' +
                '}';
    }
} 