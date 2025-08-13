#!/bin/bash

# Fix script for DynamoDB Local native libraries
# This script downloads and sets up the missing native libraries

set -e

echo "🔧 Fixing DynamoDB Local native libraries..."

# Configuration
TARGET_DIR="../localTest/DDB"
LIB_DIR="$TARGET_DIR/DynamoDBLocal_lib"

# Check if we're in the right directory
if [ ! -d "$TARGET_DIR" ]; then
    echo "❌ Error: $TARGET_DIR directory not found!"
    echo "Please run this script from the backend-java directory"
    exit 1
fi

# Create lib directory if it doesn't exist
mkdir -p "$LIB_DIR"

# Download DynamoDB Local to get the native libraries
echo "📥 Downloading DynamoDB Local to extract native libraries..."
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

# Download the latest version
curl -L -o dynamodb_local.tar.gz "https://d1ni2b6xgvw0s0.cloudfront.net/v2.x/dynamodb_local_latest.tar.gz"

# Extract
echo "📦 Extracting files..."
tar -xzf dynamodb_local.tar.gz

# Copy native libraries
if [ -d "DynamoDBLocal_lib" ]; then
    echo "📁 Copying native libraries..."
    cp -r DynamoDBLocal_lib/* "$LIB_DIR/"
    echo "✅ Native libraries copied successfully!"
else
    echo "❌ Error: DynamoDBLocal_lib directory not found in downloaded files"
    exit 1
fi

# Clean up
cd - > /dev/null
rm -rf "$TEMP_DIR"

echo ""
echo "🎉 DynamoDB Local native libraries setup complete!"
echo "📁 Libraries are now in: $LIB_DIR"
echo ""
echo "You can now try running the backend server again."
