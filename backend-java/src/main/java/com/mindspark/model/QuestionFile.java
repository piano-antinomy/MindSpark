package com.mindspark.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/**
 * Represents the structure of a question JSON file with competition info and problems
 */
public class QuestionFile {
    
    @JsonProperty("competition_info")
    private CompetitionInfo competitionInfo;
    
    @JsonProperty("problems")
    private List<Question> problems;
    
    public CompetitionInfo getCompetitionInfo() {
        return competitionInfo;
    }
    
    public void setCompetitionInfo(CompetitionInfo competitionInfo) {
        this.competitionInfo = competitionInfo;
    }
    
    public List<Question> getProblems() {
        return problems;
    }
    
    public void setProblems(List<Question> problems) {
        this.problems = problems;
    }
    
    /**
     * Inner class for competition metadata
     */
    public static class CompetitionInfo {
        private String name;
        private String group;
        private int year;
        
        @JsonProperty("is_AJHSME")
        private boolean isAJHSME;
        
        private String level;
        private String suffix;
        
        @JsonProperty("fall_version")
        private boolean fallVersion;
        
        @JsonProperty("total_problems")
        private int totalProblems;
        
        @JsonProperty("problem_number_override")
        private String problemNumberOverride;
        
        // Getters and setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getGroup() { return group; }
        public void setGroup(String group) { this.group = group; }
        
        public int getYear() { return year; }
        public void setYear(int year) { this.year = year; }
        
        public boolean isAJHSME() { return isAJHSME; }
        public void setAJHSME(boolean isAJHSME) { this.isAJHSME = isAJHSME; }
        
        public String getLevel() { return level; }
        public void setLevel(String level) { this.level = level; }
        
        public String getSuffix() { return suffix; }
        public void setSuffix(String suffix) { this.suffix = suffix; }
        
        public boolean isFallVersion() { return fallVersion; }
        public void setFallVersion(boolean fallVersion) { this.fallVersion = fallVersion; }
        
        public int getTotalProblems() { return totalProblems; }
        public void setTotalProblems(int totalProblems) { this.totalProblems = totalProblems; }
        
        public String getProblemNumberOverride() { return problemNumberOverride; }
        public void setProblemNumberOverride(String problemNumberOverride) { this.problemNumberOverride = problemNumberOverride; }
    }
} 