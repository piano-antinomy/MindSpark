package com.mindspark.cdk;

import software.amazon.awscdk.App;

public class MindSparkCdkApp {
    public static void main(final String[] args) {
        App app = new App();

        new MindSparkStack(app, "MindSparkBackendStack", MindSparkStackProps.builder()
            .region("us-east-1")
            .build());

        app.synth();
    }
} 