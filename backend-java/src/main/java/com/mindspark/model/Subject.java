package com.mindspark.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Subject {
    @JsonProperty("id")
    private String id;
    
    @JsonProperty("name")
    private String name;
    
    @JsonProperty("available")
    private boolean available;
    
    // Default constructor for Jackson
    public Subject() {}
    
    public Subject(String id, String name, boolean available) {
        this.id = id;
        this.name = name;
        this.available = available;
    }
    
    // Getters and setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public boolean isAvailable() {
        return available;
    }
    
    public void setAvailable(boolean available) {
        this.available = available;
    }
} 