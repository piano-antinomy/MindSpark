#!/bin/bash

echo "🚀 Starting MindSpark Java Backend..."
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
mvn exec:java

echo ""
echo "�� Server stopped." 