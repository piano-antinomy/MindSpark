package com.mindspark.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindspark.config.LocalMode;
import com.mindspark.model.Question;
import com.mindspark.model.QuestionFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Inject;
import javax.inject.Singleton;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.net.URLDecoder;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import java.util.jar.JarEntry;
import java.util.jar.JarFile;

@Singleton
public class CacheBackedQuestionServiceImpl implements QuestionService {
    
    private static final int DEFAULT_HIGHEST_LEVEL = 3;
    private static final Logger logger = LoggerFactory.getLogger(CacheBackedQuestionServiceImpl.class);
    private final ObjectMapper objectMapper;
    private final Map<Integer, List<Question>> questionsCache = new ConcurrentHashMap<>();
    private final Map<Integer, Set<String>> availableYearsByLevel = new ConcurrentHashMap<>();
    private final Map<String, String> levelToAMCType = new HashMap<>();
    
    // Environment detection
    private final boolean isLocalMode;
    private final String questionsBasePath;
    
    @Inject
    public CacheBackedQuestionServiceImpl(ObjectMapper objectMapper, @LocalMode Boolean isLocalMode) {
        this.objectMapper = objectMapper;
        this.isLocalMode = isLocalMode;
        
        // Set appropriate paths based on environment
        this.questionsBasePath = isLocalMode ? "resources/math/questions" : "/math/questions";
        
        logger.info("Initializing QuestionService in {} mode", isLocalMode ? "LOCAL" : "LAMBDA");
        logger.info("Questions base path: {}", questionsBasePath);
        
        initializeLevelMappings();
        loadAllQuestions();
    }
    
    private void initializeLevelMappings() {
        levelToAMCType.put("1", "AMC_8");
        levelToAMCType.put("2", "AMC_10");
        levelToAMCType.put("3", "AMC_12");
    }
    
    @Override
    public List<Question> listQuestionsByLevel(int level) {
        if (level < 1 || level > DEFAULT_HIGHEST_LEVEL) {
            logger.warn("Invalid level requested: {}", level);
            return Collections.emptyList();
        }
        
        return questionsCache.getOrDefault(level, Collections.emptyList());
    }
    
    @Override
    public List<Integer> getAvailableLevels() {
        List<Integer> levels = new ArrayList<>(questionsCache.keySet());
        Collections.sort(levels);
        return levels;
    }
    
    @Override
    public int getQuestionCountByLevel(int level) {
        List<Question> questions = questionsCache.get(level);
        return questions != null ? questions.size() : 0;
    }
    
    @Override
    public List<String> getAvailableYearsByLevel(int level) {
        Set<String> years = availableYearsByLevel.get(level);
        if (years != null) {
            List<String> yearsList = new ArrayList<>(years);
            Collections.sort(yearsList, Collections.reverseOrder()); // Most recent first
            return yearsList;
        }
        return Collections.emptyList();
    }
    
    @Override
    public List<Question> getQuestionsByLevelAndYear(int level, String yearVersion) {
        String amcType = levelToAMCType.get(String.valueOf(level));
        if (amcType == null) {
            logger.warn("Invalid level: {}", level);
            return Collections.emptyList();
        }
        
        // Convert yearVersion back to filename format
        String fileName = convertYearVersionToFileName(yearVersion, amcType);
        if (fileName == null) {
            logger.warn("Invalid year/version format: {}", yearVersion);
            return Collections.emptyList();
        }
        
        if (isLocalMode) {
            return loadQuestionsFromFile(amcType, fileName);
        } else {
            return loadQuestionsFromResource(amcType, fileName);
        }
    }
    
    @Override
    public String getAMCTypeByLevel(int level) {
        return levelToAMCType.getOrDefault(String.valueOf(level), "Unknown");
    }

    @Override
    public List<Question> getQuestionsByQuizId(String quizId) {
        return null;
    }

    private void loadAllQuestions() {
        logger.info("Loading all questions from {} using {} mode", questionsBasePath, isLocalMode ? "filesystem" : "classpath");
        
        // Load AMC 8 questions as Level 1
        loadAMCQuestions("AMC_8", 1);
        
        // Load AMC 10 questions as Level 2  
        loadAMCQuestions("AMC_10", 2);
        
        // Load AMC 12 questions as Level 3
        loadAMCQuestions("AMC_12", 3);
        
        logger.info("Loaded questions for {} levels", questionsCache.size());
    }
    
    private void loadAMCQuestions(String amcType, int level) {
        logger.info("Loading {} questions for level {}", amcType, level);
        List<Question> allQuestionsForLevel = new ArrayList<>();
        Set<String> yearsForLevel = new TreeSet<>();
        
        // Discover available files dynamically
        List<String> availableFiles = scanAvailableFiles(amcType);
        
        for (String fileName : availableFiles) {
            String yearVersion = extractYearVersionFromFileName(fileName, amcType);
            if (yearVersion != null) {
                List<Question> yearQuestions;
                
                if (isLocalMode) {
                    yearQuestions = loadQuestionsFromFile(amcType, fileName);
                } else {
                    yearQuestions = loadQuestionsFromResource(amcType, fileName);
                }
                
                if (!yearQuestions.isEmpty()) {
                    allQuestionsForLevel.addAll(yearQuestions);
                    yearsForLevel.add(yearVersion);
                    logger.debug("Loaded {} questions from {} {}", yearQuestions.size(), amcType, yearVersion);
                }
            }
        }
        
        questionsCache.put(level, allQuestionsForLevel);
        availableYearsByLevel.put(level, yearsForLevel);
        logger.info("Loaded {} questions for level {} ({}) with {} years available", 
                   allQuestionsForLevel.size(), level, amcType, yearsForLevel.size());
    }
    
    /**
     * Scan available files for the given AMC type
     */
    private List<String> scanAvailableFiles(String amcType) {
        List<String> files = new ArrayList<>();
        
        if (isLocalMode) {
            files = scanFilesystemForAMCFiles(amcType);
        } else {
            files = scanClasspathForAMCFiles(amcType);
        }
        
        logger.debug("Found {} files for {}: {}", files.size(), amcType, files);
        return files;
    }
    
    /**
     * Scan filesystem for AMC files
     */
    private List<String> scanFilesystemForAMCFiles(String amcType) {
        List<String> files = new ArrayList<>();
        String dirPath = questionsBasePath + "/" + amcType;
        File directory = new File(dirPath);
        
        if (!directory.exists() || !directory.isDirectory()) {
            logger.warn("Directory does not exist: {}", dirPath);
            return files;
        }
        
        try {
            File[] jsonFiles = directory.listFiles((dir, name) -> name.endsWith(".json"));
            if (jsonFiles != null) {
                for (File file : jsonFiles) {
                    files.add(file.getName());
                }
            }
        } catch (Exception e) {
            logger.error("Error scanning filesystem directory: {}", dirPath, e);
        }
        
        return files;
    }
    
    /**
     * Scan classpath for AMC files
     */
    private List<String> scanClasspathForAMCFiles(String amcType) {
        List<String> files = new ArrayList<>();
        String resourcePath = questionsBasePath + "/" + amcType;
        
        try {
            URL resourceUrl = getClass().getResource(resourcePath);
            if (resourceUrl == null) {
                logger.warn("Resource path not found: {}", resourcePath);
                return files;
            }
            
            if (resourceUrl.getProtocol().equals("file")) {
                // Running from IDE or expanded classpath
                Path path = Paths.get(resourceUrl.toURI());
                try (Stream<Path> stream = Files.list(path)) {
                    stream.filter(Files::isRegularFile)
                          .filter(p -> p.toString().endsWith(".json"))
                          .forEach(p -> files.add(p.getFileName().toString()));
                }
            } else if (resourceUrl.getProtocol().equals("jar")) {
                // Running from JAR
                String jarPath = resourceUrl.getPath().substring(5, resourceUrl.getPath().indexOf("!"));
                try (JarFile jar = new JarFile(URLDecoder.decode(jarPath, "UTF-8"))) {
                    String targetPath = resourcePath.startsWith("/") ? resourcePath.substring(1) : resourcePath;
                    jar.stream()
                       .filter(entry -> !entry.isDirectory())
                       .filter(entry -> entry.getName().startsWith(targetPath + "/"))
                       .filter(entry -> entry.getName().endsWith(".json"))
                       .forEach(entry -> {
                           String fileName = entry.getName().substring(entry.getName().lastIndexOf('/') + 1);
                           files.add(fileName);
                       });
                }
            }
        } catch (Exception e) {
            logger.error("Error scanning classpath for AMC files: {}", resourcePath, e);
        }
        
        return files;
    }
    
    /**
     * Extract year and version from filename
     * Examples:
     * - "2020_AMC_8.json" -> "2020"
     * - "2020_AMC_10A.json" -> "2020A"
     * - "2020_AMC_12B.json" -> "2020B"
     */
    private String extractYearVersionFromFileName(String fileName, String amcType) {
        // Pattern to match: YYYY_AMC_NN[A|B].json
        Pattern pattern = Pattern.compile("(\\d{4})_" + amcType + "([AB]?)\\.json");
        Matcher matcher = pattern.matcher(fileName);
        
        if (matcher.matches()) {
            String year = matcher.group(1);
            String version = matcher.group(2);
            return year + (version != null ? version : "");
        }
        
        return null;
    }

    /**
     * Load questions from file system (local development) - updated to use filename
     */
    private List<Question> loadQuestionsFromFile(String amcType, String fileName) {
        String filePath = questionsBasePath + "/" + amcType + "/" + fileName;
        File file = new File(filePath);
        
        if (file.exists()) {
            try {
                logger.debug("Loading questions from file: {}", filePath);
                QuestionFile questionFile = objectMapper.readValue(file, QuestionFile.class);
                return questionFile.getProblems() != null ? questionFile.getProblems() : Collections.emptyList();
            } catch (IOException e) {
                logger.error("Error loading questions from file: {}", filePath, e);
                return Collections.emptyList();
            }
        }
        
        logger.debug("File not found: {}", filePath);
        return Collections.emptyList();
    }
    
    /**
     * Load questions from classpath resources (Lambda/production) - updated to use filename
     */
    private List<Question> loadQuestionsFromResource(String amcType, String fileName) {
        String resourcePath = questionsBasePath + "/" + amcType + "/" + fileName;
        
        try (InputStream inputStream = getClass().getResourceAsStream(resourcePath)) {
            if (inputStream != null) {
                logger.debug("Loading questions from resource: {}", resourcePath);
                QuestionFile questionFile = objectMapper.readValue(inputStream, QuestionFile.class);
                return questionFile.getProblems() != null ? questionFile.getProblems() : Collections.emptyList();
            }
        } catch (IOException e) {
            logger.error("Error loading questions from resource: {}", resourcePath, e);
        }
        
        logger.debug("Resource not found: {}", resourcePath);
        return Collections.emptyList();
    }
    
    /**
     * Reload questions from appropriate source (useful for Lambda cold starts)
     */
    public void reloadQuestions() {
        logger.info("Reloading all questions from {} using {} mode", questionsBasePath, isLocalMode ? "filesystem" : "classpath");
        questionsCache.clear();
        availableYearsByLevel.clear();
        loadAllQuestions();
    }
    
    /**
     * Get questions by AMC type and year/version (backward compatibility)
     */
    public List<Question> getQuestionsByAMCAndYear(String amcType, String yearVersion) {
        String fileName = convertYearVersionToFileName(yearVersion, amcType);
        if (fileName == null) {
            logger.warn("Invalid year/version format: {}", yearVersion);
            return Collections.emptyList();
        }
        
        if (isLocalMode) {
            return loadQuestionsFromFile(amcType, fileName);
        } else {
            return loadQuestionsFromResource(amcType, fileName);
        }
    }

    /**
     * Convert year/version back to filename format
     * Examples:
     * - "2020" + "AMC_8" -> "2020_AMC_8.json"
     * - "2020A" + "AMC_10" -> "2020_AMC_10A.json"
     */
    private String convertYearVersionToFileName(String yearVersion, String amcType) {
        Pattern pattern = Pattern.compile("(\\d{4})([AB]?)");
        Matcher matcher = pattern.matcher(yearVersion);
        
        if (matcher.matches()) {
            String year = matcher.group(1);
            String version = matcher.group(2);
            return year + "_" + amcType + version + ".json";
        }
        
        return null;
    }
} 