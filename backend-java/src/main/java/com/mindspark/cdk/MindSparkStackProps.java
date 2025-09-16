package com.mindspark.cdk;

public class MindSparkStackProps {
    private final String region;

    public MindSparkStackProps(String region) {
        this.region = region;
    }

    public String getRegion() {
        return region;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String region;

        public Builder region(String region) {
            this.region = region;
            return this;
        }

        public MindSparkStackProps build() {
            return new MindSparkStackProps(region);
        }
    }
} 