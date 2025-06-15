package com.mindspark.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public class Question {
    
    @JsonProperty("id")
    private String id;
    
    @JsonProperty("question")
    private QuestionDetails question;
    
    @JsonProperty("tags")
    private List<String> tags;
    
    @JsonProperty("sources")
    private List<String> sources;
    
    @JsonProperty("answer")
    private String answer;
    
    @JsonProperty("solutions")
    private List<Solution> solutions;

    // Constructors
    public Question() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public QuestionDetails getQuestion() { return question; }
    public void setQuestion(QuestionDetails question) { this.question = question; }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }

    public List<String> getSources() { return sources; }
    public void setSources(List<String> sources) { this.sources = sources; }

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }

    public List<Solution> getSolutions() { return solutions; }
    public void setSolutions(List<Solution> solutions) { this.solutions = solutions; }

    public static class QuestionDetails {
        @JsonProperty("text")
        private String text;
        
        @JsonProperty("insertions")
        private Map<String, Insertion> insertions;
        
        @JsonProperty("type")
        private String type;
        
        @JsonProperty("text_choices")
        private List<String> textChoices;
        
        @JsonProperty("picture_choices")
        private List<String> pictureChoices;
        
        @JsonProperty("latex_choices")
        private List<String> latexChoices;
        
        @JsonProperty("asy_choices")
        private List<String> asyChoices;

        // Getters and Setters
        public String getText() { return text; }
        public void setText(String text) { this.text = text; }

        public Map<String, Insertion> getInsertions() { return insertions; }
        public void setInsertions(Map<String, Insertion> insertions) { this.insertions = insertions; }

        public String getType() { return type; }
        public void setType(String type) { this.type = type; }

        public List<String> getTextChoices() { return textChoices; }
        public void setTextChoices(List<String> textChoices) { this.textChoices = textChoices; }

        public List<String> getPictureChoices() { return pictureChoices; }
        public void setPictureChoices(List<String> pictureChoices) { this.pictureChoices = pictureChoices; }

        public List<String> getLatexChoices() { return latexChoices; }
        public void setLatexChoices(List<String> latexChoices) { this.latexChoices = latexChoices; }

        public List<String> getAsyChoices() { return asyChoices; }
        public void setAsyChoices(List<String> asyChoices) { this.asyChoices = asyChoices; }
    }

    public static class Insertion {
        @JsonProperty("picture")
        private String picture;
        
        @JsonProperty("alt_type")
        private String altType;
        
        @JsonProperty("alt_value")
        private String altValue;

        // Getters and Setters
        public String getPicture() { return picture; }
        public void setPicture(String picture) { this.picture = picture; }

        public String getAltType() { return altType; }
        public void setAltType(String altType) { this.altType = altType; }

        public String getAltValue() { return altValue; }
        public void setAltValue(String altValue) { this.altValue = altValue; }
    }

    public static class Solution {
        @JsonProperty("solution_id")
        private int solutionId;
        
        @JsonProperty("type")
        private String type;
        
        @JsonProperty("value")
        private List<String> value;

        // Getters and Setters
        public int getSolutionId() { return solutionId; }
        public void setSolutionId(int solutionId) { this.solutionId = solutionId; }

        public String getType() { return type; }
        public void setType(String type) { this.type = type; }

        public List<String> getValue() { return value; }
        public void setValue(List<String> value) { this.value = value; }
    }
} 