#!/bin/bash

# Parse arguments
LOCAL_MODE=true
while [[ $# -gt 0 ]]; do
    case $1 in
        --local)
            LOCAL_MODE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--local]"
            echo "  --local: Run in local development mode (reads from file system)"
            exit 1
            ;;
    esac
done

echo "🚀 Starting MindSpark Java Backend..."
if [ "$LOCAL_MODE" = true ]; then
    echo "🔧 Running in LOCAL development mode"
    echo "📁 Will read questions from: questions/ directory"
else
    echo "☁️  Running in LAMBDA/PRODUCTION mode"
    echo "📁 Will read questions from: classpath resources"
fi

echo "📋 Checking Java version..."
java -version

echo ""
echo "📦 Compiling and running the application..."

# Clean and compile
mvn clean compile

if [ $? -ne 0 ]; then
    echo "❌ Compilation failed!"
    exit 1
fi

echo ""
echo "🏃 Running the server..."

# Set system property based on mode
if [ "$LOCAL_MODE" = true ]; then
    mvn exec:java -Dmindspark.local.mode=true
else
    mvn exec:java
fi

echo ""
echo "�� Server stopped." 