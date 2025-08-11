#!/bin/bash

# Test script for DynamoDB Local setup

echo "Testing DynamoDB Local setup..."

# Check if DynamoDBLocal.jar exists
DDB_JAR="../localTest/DDB/DynamoDBLocal.jar"
DDB_LIB="../localTest/DDB/DynamoDBLocal_lib"

if [ ! -f "$DDB_JAR" ]; then
    echo "❌ Error: DynamoDBLocal.jar not found at $DDB_JAR"
    echo "Run ./setup-dynamodb-local.sh first"
    exit 1
fi

# Check if DynamoDBLocal_lib directory exists
if [ ! -d "$DDB_LIB" ]; then
    echo "❌ Error: DynamoDBLocal_lib directory not found at $DDB_LIB"
    echo "Run ./setup-dynamodb-local.sh first"
    exit 1
fi

echo "✅ DynamoDBLocal.jar found at $DDB_JAR"
echo "✅ DynamoDBLocal_lib directory found at $DDB_LIB"

# Test if we can start DynamoDB Local
echo "Testing DynamoDB Local startup..."

# Start DynamoDB Local in background
java -Djava.library.path=$DDB_LIB -jar $DDB_JAR -inMemory -port 7076 &
DYNAMODB_PID=$!

# Wait a moment for it to start
sleep 3

# Check if the process is running
if kill -0 $DYNAMODB_PID 2>/dev/null; then
    echo "✅ DynamoDB Local started successfully (PID: $DYNAMODB_PID)"
    
    # Test if the port is listening
    if lsof -i :7076 >/dev/null 2>&1; then
        echo "✅ DynamoDB Local is listening on port 7076"
    else
        echo "⚠️  Warning: Port 7076 not listening (may take a moment to start)"
    fi
    
    # Stop DynamoDB Local
    echo "Stopping DynamoDB Local..."
    kill $DYNAMODB_PID
    wait $DYNAMODB_PID 2>/dev/null
    echo "✅ DynamoDB Local stopped"
else
    echo "❌ Error: DynamoDB Local failed to start"
    exit 1
fi

echo ""
echo "🎉 DynamoDB Local setup test completed successfully!"
echo ""
echo "You can now use LocalHostDynamoDB in your Java code:"
echo "  LocalHostDynamoDB localDynamoDB = new LocalHostDynamoDB(\"../localTest/DDB/DynamoDBLocal.jar\");"
echo "  localDynamoDB.start();"
echo "  // ... your DynamoDB operations ..."
echo "  localDynamoDB.stop();"
