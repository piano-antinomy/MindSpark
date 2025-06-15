# MindSpark Java Backend

A Java-based REST API server for the MindSpark learning platform, built with Google Guice dependency injection and Jetty web server.

## 🚀 Features

- **RESTful API** for question management
- **Google Guice** dependency injection
- **Jetty** lightweight web server
- **JSON** data processing with Jackson
- **Multi-level questions** support (Level 1-3)
- **CORS** enabled for cross-origin requests
- **Health check** endpoint

## 📋 Prerequisites

- **Java 11** or higher (OpenJDK 11.0.19 tested)
- **Maven 3.6+** for build management

## 🛠 Project Structure

```
backend-java/
├── src/main/java/com/mindspark/
│   ├── MindSparkApplication.java      # Main application entry point
│   ├── config/
│   │   └── MindSparkModule.java       # Guice DI configuration
│   ├── controller/
│   │   └── QuestionController.java    # REST API endpoints
│   ├── model/
│   │   └── Question.java              # Question data model
│   └── service/
│       ├── QuestionService.java       # Service interface
│       └── QuestionServiceImpl.java   # Service implementation
├── questions/                         # Question data files
│   ├── level-1/
│   ├── level-2/
│   └── level-3/
├── pom.xml                           # Maven configuration
├── run.sh                            # Linux/Mac run script
├── run.bat                           # Windows run script
└── README.md                         # This file
```

## 🏃 Running the Server

### Option 1: Using run scripts (Recommended)

**Linux/Mac:**
```bash
chmod +x run.sh
./run.sh
```

**Windows:**
```batch
run.bat
```

### Option 2: Using Maven directly

```bash
# Clean and compile
mvn clean compile

# Run the server
mvn exec:java
```

### Option 3: Manual compilation

```bash
# Compile
mvn clean package

# Run the JAR
java -cp target/classes:target/dependency/* com.mindspark.MindSparkApplication
```

## 🌐 API Endpoints

The server runs on **port 4072** and provides the following endpoints:

### Base URL: `http://localhost:4072/api/questions/math`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get available levels and question counts for math |
| GET | `/level/{level}` | Get math questions for specific level (1-3) |
| GET | `/health` | Health check endpoint |

### Examples

**Get available math levels:**
```bash
curl http://localhost:4072/api/questions/math
```

**Get Level 1 math questions:**
```bash
curl http://localhost:4072/api/questions/math/level/1
```

**Health check:**
```bash
curl http://localhost:4072/api/questions/math/health
```

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "subject": "math",
  "level": 1,
  "questions": [...],
  "count": 2
}
```

### Error Response
```json
{
  "success": false,
  "subject": "math",
  "error": "Invalid level parameter",
  "timestamp": 1701234567890
}
```

## 🏗 Architecture

- **Dependency Injection**: Google Guice manages component dependencies
- **Layered Architecture**: Controller → Service → Data layers
- **JSON Processing**: Jackson handles serialization/deserialization
- **Servlet-based**: Uses Java servlets with Jetty server
- **Thread-safe**: Concurrent access to question cache

## 🔧 Configuration

### Port Configuration
To change the server port, modify the `PORT` constant in `MindSparkApplication.java`:

```java
private static final int PORT = 4072; // Change this
```

### Adding Questions
1. Create JSON files in the appropriate `questions/level-{n}/` directory
2. Follow the existing JSON structure
3. Restart the server to load new questions

## 🧪 Testing

**Quick test after starting:**
```bash
# Test health endpoint
curl http://localhost:4072/api/questions/math/health

# Test question retrieval
curl http://localhost:4072/api/questions/math/level/1
```

## 📝 Logging

The application uses SLF4J with simple logging. Logs include:
- Server startup/shutdown events
- Question loading information
- Request processing details
- Error messages

## 🤝 Integration

This Java backend is designed to work alongside or as an alternative to the Python Flask backend. Both servers provide similar APIs with consistent response formats.

**Key Differences:**
- **Port**: Java backend uses 4072, Python uses 4092
- **Performance**: Java backend may offer better performance under load
- **Memory**: Java backend caches all questions in memory for faster access

## 📄 License

Part of the MindSpark learning platform project. 