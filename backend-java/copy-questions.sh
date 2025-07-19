#!/bin/bash

echo "🔄 Copying question files to resources for Lambda deployment..."

# Create resources directory
mkdir -p src/main/resources/math/questions

# Copy all AMC questions to resources
echo "📚 Copying AMC questions..."
cp -r questions/AMC/ src/main/resources/math/questions/

# Copy processed AMC questions (if available)
if [ -d "questions/AMC_processed" ]; then
    echo "📚 Copying processed AMC questions..."
    cp -r questions/AMC_processed/ src/main/resources/math/questions/
fi

# Copy math level questions (if available)
if [ -d "questions/math" ]; then
    echo "📚 Copying math level questions..."
    cp -r questions/math/ src/main/resources/math/
fi

# Show summary
echo "✅ Copy completed!"
echo "📊 Resource structure:"
find src/main/resources -name "*.json" | wc -l | awk '{print "   Total JSON files: " $1}'
echo "   Directory structure:"
ls -la src/main/resources/math/questions/

echo ""
echo "🚀 Ready for Lambda deployment!"
echo "   Next steps:"
echo "   1. mvn clean package"
echo "   2. Deploy the JAR to AWS Lambda" 