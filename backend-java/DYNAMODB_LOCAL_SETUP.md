# DynamoDB Local Setup Guide

This guide explains how to set up and use DynamoDB Local for development and testing.

## Prerequisites

- Java 17 or higher (DynamoDB Local requires Java 17+)
- Maven
- Internet connection (for downloading DynamoDB Local)

**Note**: If you're using Java 11, you'll need to upgrade to Java 17 or use an older version of DynamoDB Local.

## Setup Instructions

### 1. Download DynamoDB Local

Run the setup script to download and configure DynamoDB Local:

```bash
cd backend-java
./setup-dynamodb-local.sh
```

This script will:
- Download the latest DynamoDB Local JAR file
- Extract native libraries
- Set up the required directory structure

### 2. Verify Setup

After running the setup script, you should have:
- `../localTest/DDB/DynamoDBLocal.jar` - The DynamoDB Local executable
- `../localTest/DDB/DynamoDBLocal_lib/` - Directory containing native libraries

### 3. Dependencies

The following AWS SDK dependencies have been added to `pom.xml`:
- `software.amazon.awssdk:dynamodb` - Core DynamoDB client
- `software.amazon.awssdk:dynamodb-enhanced` - Enhanced DynamoDB client
- `software.amazon.awssdk:url-connection-client` - HTTP client for local connections

## Usage

### Basic Usage

```java
import com.mindspark.local.ddb.LocalHostDynamoDB;

// Create and start DynamoDB Local
LocalHostDynamoDB localDynamoDB = new LocalHostDynamoDB("../localTest/DDB/DynamoDBLocal.jar");
localDynamoDB.start();

// Get the endpoint URL for your DynamoDB client
String endpointUrl = localDynamoDB.getEndpointUrl(); // "http://localhost:7076"

// Stop DynamoDB Local when done
localDynamoDB.stop();
```

### Creating a DynamoDB Client

```java
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.net.URI;

DynamoDbClient client = DynamoDbClient.builder()
    .endpointOverride(URI.create("http://localhost:7076"))
    .credentialsProvider(StaticCredentialsProvider.create(
        AwsBasicCredentials.create("dummy", "dummy")))
    .region(Region.US_EAST_1)
    .build();
```

### Running the Example

To test the setup, run the example class:

```bash
mvn compile exec:java -Dexec.mainClass="com.mindspark.local.ddb.DynamoDBLocalExample"
```

## Configuration Options

### Custom Port

The default port is 7076. You can modify this in the `LocalHostDynamoDB` class.

### Custom Library Path

```java
LocalHostDynamoDB localDynamoDB = new LocalHostDynamoDB(
    "./DynamoDBLocal.jar", 
    "./custom/lib/path"
);
```

### Persistence Mode

By default, DynamoDB Local runs in in-memory mode. To enable persistence, modify the `start()` method in `LocalHostDynamoDB`:

```java
// Remove "-inMemory" from the ProcessBuilder arguments
ProcessBuilder builder = new ProcessBuilder(
    "java", 
    "-Djava.library.path=" + libPath,
    "-jar", jarPath,
    "-port", String.valueOf(port)
    // Add "-dbPath", "./dynamodb-data" for persistence
);
```

## Troubleshooting

### Common Issues

1. **Port already in use**: Change the port number in `LocalHostDynamoDB`
2. **JAR file not found**: Run the setup script again
3. **Native library errors**: Ensure the `DynamoDBLocal_lib` directory exists
4. **Permission denied**: Make sure the JAR file is executable

### Logs

DynamoDB Local output is inherited by the Java process. Check your application logs for any error messages.

## Features

- **In-memory storage**: Fast, no persistence (default)
- **Local endpoint**: No AWS credentials required
- **Full DynamoDB API**: Supports all DynamoDB operations
- **Easy integration**: Works with AWS SDK v2

## Security Note

DynamoDB Local is for development and testing only. Never use it in production environments.
