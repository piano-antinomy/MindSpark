#!/bin/bash

# Setup script for DynamoDB Local
# This script downloads DynamoDB Local and extracts the necessary files

set -e

# Configuration
DYNAMODB_VERSION="1.21.0"
DYNAMODB_URL="https://d1ni2b6xgvw0s0.cloudfront.net/v2.x/dynamodb_local_latest.tar.gz"
TARGET_DIR="../localTest/DDB"
LIB_DIR="$TARGET_DIR/DynamoDBLocal_lib"
JAR_FILE="$TARGET_DIR/DynamoDBLocal.jar"

echo "Setting up DynamoDB Local..."

# Create directories
mkdir -p $TARGET_DIR
mkdir -p $LIB_DIR

# Download DynamoDB Local
echo "Downloading DynamoDB Local..."
curl -L -o dynamodb_local.tar.gz $DYNAMODB_URL

# Extract the archive
echo "Extracting DynamoDB Local..."
tar -xzf dynamodb_local.tar.gz

# Move files to appropriate locations
echo "Setting up files..."
if [ -f "DynamoDBLocal.jar" ]; then
    mv DynamoDBLocal.jar $JAR_FILE
    echo "DynamoDBLocal.jar moved to $JAR_FILE"
else
    echo "Error: DynamoDBLocal.jar not found in extracted files"
    exit 1
fi

# Copy native libraries
if [ -d "DynamoDBLocal_lib" ]; then
    cp -r DynamoDBLocal_lib/* $LIB_DIR/
    echo "Native libraries copied to $LIB_DIR"
    rm -rf DynamoDBLocal_lib
else
    echo "Warning: DynamoDBLocal_lib directory not found"
fi

# Clean up
rm -f dynamodb_local.tar.gz

echo "DynamoDB Local setup complete!"
echo "Files:"
echo "  - $JAR_FILE"
echo "  - $LIB_DIR/ (native libraries)"
echo ""
echo "You can now use LocalHostDynamoDB with:"
echo "  new LocalHostDynamoDB(\"../localTest/DDB/DynamoDBLocal.jar\")"
