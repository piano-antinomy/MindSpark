
package com.mindspark.aws.cdk;

import software.amazon.awscdk.Duration;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.apigateway.AccessLogFormat;
import software.amazon.awscdk.services.apigateway.AuthorizationType;
import software.amazon.awscdk.services.apigateway.CognitoUserPoolsAuthorizer;
import software.amazon.awscdk.services.apigateway.Cors;
import software.amazon.awscdk.services.apigateway.CorsOptions;
import software.amazon.awscdk.services.apigateway.LambdaIntegration;
import software.amazon.awscdk.services.apigateway.LogGroupLogDestination;
import software.amazon.awscdk.services.apigateway.MethodLoggingLevel;
import software.amazon.awscdk.services.apigateway.MethodOptions;
import software.amazon.awscdk.services.apigateway.ProxyResourceOptions;
import software.amazon.awscdk.services.apigateway.RestApi;
import software.amazon.awscdk.services.apigateway.StageOptions;
import software.amazon.awscdk.services.cognito.UserPool;
import software.amazon.awscdk.services.lambda.Alias;
import software.amazon.awscdk.services.lambda.Code;
import software.amazon.awscdk.services.lambda.Function;
import software.amazon.awscdk.services.lambda.Version;
import software.amazon.awscdk.services.logs.LogGroup;
import software.amazon.awscdk.services.logs.RetentionDays;
import software.constructs.Construct;

import java.util.Arrays;

public class MindSparkStack extends Stack {

    public MindSparkStack(final Construct scope, final String id, final MindSparkStackProps props) {
        super(scope, id, StackProps.builder()
            .env(software.amazon.awscdk.Environment.builder()
                .region(props.getRegion())
                .build())
            .build());

        // Cognito user pool for API auth (existing pool)
        software.amazon.awscdk.services.cognito.IUserPool userPool = UserPool.fromUserPoolArn(this, "MindSparkUserPool", "arn:aws:cognito-idp:us-east-1:979130302070:userpool/us-east-1_kfQvyJNce");

        CognitoUserPoolsAuthorizer authorizer = CognitoUserPoolsAuthorizer.Builder.create(this, "MindSparkAuthorizer")
            .cognitoUserPools(java.util.List.of(userPool))
            .build();

        // Lambda for backend
        Function lambda = Function.Builder.create(this, "MindSparkLambda")
            .runtime(software.amazon.awscdk.services.lambda.Runtime.JAVA_17)
            .handler("com.mindspark.aws.lambda.MindSparkLambdaHandler::handleRequest")
            .memorySize(2048)
            .timeout(Duration.seconds(30))
            .logRetention(RetentionDays.SIX_MONTHS)
            .code(Code.fromAsset("target/MindSpark-backend-java-1.0.0-shaded.jar"))
            .build();

        Version version = lambda.getCurrentVersion();
        Alias alias = Alias.Builder.create(this, "MindSparkLambdaLive")
            .aliasName("live")
            .version(version)
            //.provisionedConcurrentExecutions(2)
            //.snapStart(software.amazon.awscdk.services.lambda.SnapStartConf.ON_PUBLISHED_VERSIONS)
            .build();

        LogGroup apiLogs = LogGroup.Builder.create(this, "MindSparkApiLogs")
            .retention(RetentionDays.SIX_MONTHS)
            .build();

        RestApi api = RestApi.Builder.create(this, "MindSparkApi")
            .deployOptions(StageOptions.builder()
                .loggingLevel(MethodLoggingLevel.INFO)
                .dataTraceEnabled(Boolean.TRUE)
                .tracingEnabled(Boolean.TRUE)
                .accessLogDestination(new LogGroupLogDestination(apiLogs))
                .accessLogFormat(AccessLogFormat.jsonWithStandardFields())
                .throttlingRateLimit(50)
                .throttlingBurstLimit(100)
                .build())
            .defaultMethodOptions(MethodOptions.builder()
                .authorizationType(AuthorizationType.COGNITO)
                .authorizer(authorizer)
                .build())
            .defaultCorsPreflightOptions(CorsOptions.builder()
                .allowOrigins(Cors.ALL_ORIGINS)
                .allowMethods(Cors.ALL_METHODS)
                .allowHeaders(Arrays.asList("Content-Type", "Authorization", "X-Amz-Date", "X-Api-Key", "X-Amz-Security-Token"))
                .allowCredentials(true)
                .build())
            .build();

        LambdaIntegration integration = new LambdaIntegration(alias);

        // Root proxy to cover all existing controller paths
        api.getRoot().addProxy(ProxyResourceOptions.builder()
            .defaultIntegration(integration)
            .anyMethod(true)
            .defaultMethodOptions(MethodOptions.builder()
                .authorizationType(AuthorizationType.COGNITO)
                .authorizer(authorizer)
                .build())
            .build());
    }
}

