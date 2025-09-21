package com.mindspark.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindspark.model.Question;
import com.mindspark.model.QuestionFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.S3Object;

import javax.inject.Singleton;
import java.io.IOException;
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

@Singleton
public class S3BackedQuestionServiceImpl implements QuestionService {

    private static final Logger logger = LoggerFactory.getLogger(S3BackedQuestionServiceImpl.class);
    private static final int DEFAULT_HIGHEST_LEVEL = 3;

    private final ObjectMapper objectMapper;
    private final S3Client s3Client;
    private final String bucketName;
    private final String questionsPrefixRoot; // e.g., "math/questions"

    private final Map<Integer, List<Question>> questionsCache = new ConcurrentHashMap<>();
    private final Map<Integer, Set<String>> availableYearsByLevel = new ConcurrentHashMap<>();
    private final Map<String, String> levelToAMCType = new HashMap<>();

    public S3BackedQuestionServiceImpl(
        final ObjectMapper objectMapper,
        final S3Client s3Client,
        final String bucketName,
        final String questionsPrefixRoot) {
        this.objectMapper = objectMapper;
        this.s3Client = s3Client;
        this.bucketName = bucketName;
        this.questionsPrefixRoot = questionsPrefixRoot;

        initializeLevelMappings();
        loadAllQuestions();
    }

    private void initializeLevelMappings() {
        levelToAMCType.put("1", "AMC_8");
        levelToAMCType.put("2", "AMC_10");
        levelToAMCType.put("3", "AMC_12");
    }

    @Override
    public List<Question> listQuestionsByLevel(final int level) {
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
    public int getQuestionCountByLevel(final int level) {
        List<Question> questions = questionsCache.get(level);
        return questions != null ? questions.size() : 0;
    }

    @Override
    public List<String> getAvailableYearsByLevel(final int level) {
        Set<String> years = availableYearsByLevel.get(level);
        if (years != null) {
            List<String> yearsList = new ArrayList<>(years);
            Collections.sort(yearsList, Collections.reverseOrder());
            return yearsList;
        }
        return Collections.emptyList();
    }

    @Override
    public List<Question> getQuestionsByLevelAndYear(final int level, final String yearVersion) {
        String amcType = levelToAMCType.get(String.valueOf(level));
        if (amcType == null) {
            logger.warn("Invalid level: {}", level);
            return Collections.emptyList();
        }
        String fileName = convertYearVersionToFileName(yearVersion, amcType);
        if (fileName == null) {
            logger.warn("Invalid year/version format: {}", yearVersion);
            return Collections.emptyList();
        }
        return loadQuestionsFromS3(amcType, fileName);
    }

    @Override
    public String getAMCTypeByLevel(final int level) {
        return levelToAMCType.getOrDefault(String.valueOf(level), "Unknown");
    }

    @Override
    public List<Question> getQuestionsByQuizId(final String quizId) {
        return null;
    }

    private void loadAllQuestions() {
        logger.info("Loading all questions from s3://{}/{}", bucketName, questionsPrefixRoot);
        loadAMCQuestions("AMC_8", 1);
        loadAMCQuestions("AMC_10", 2);
        loadAMCQuestions("AMC_12", 3);
        logger.info("Loaded questions for {} levels", questionsCache.size());
    }

    private void loadAMCQuestions(final String amcType, final int level) {
        logger.info("Loading {} questions for level {} from S3", amcType, level);
        List<Question> allQuestionsForLevel = new ArrayList<>();
        Set<String> yearsForLevel = new TreeSet<>();

        List<String> availableFiles = listJsonFilesUnder(amcType);
        for (String fileName : availableFiles) {
            String yearVersion = extractYearVersionFromFileName(fileName, amcType);
            if (yearVersion != null) {
                List<Question> yearQuestions = loadQuestionsFromS3(amcType, fileName);
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

    private List<String> listJsonFilesUnder(final String amcType) {
        String prefix = questionsPrefixRoot + "/" + amcType + "/";
        List<String> files = new ArrayList<>();
        String continuationToken = null;
        try {
            do {
                ListObjectsV2Request.Builder reqBuilder = ListObjectsV2Request.builder()
                    .bucket(bucketName)
                    .prefix(prefix)
                    .maxKeys(1000);
                if (continuationToken != null) {
                    reqBuilder.continuationToken(continuationToken);
                }
                ListObjectsV2Response resp = s3Client.listObjectsV2(reqBuilder.build());
                for (S3Object obj : resp.contents()) {
                    String key = obj.key();
                    if (key.endsWith(".json") && key.startsWith(prefix)) {
                        String fileName = key.substring(prefix.length());
                        if (!fileName.isEmpty() && !fileName.contains("/")) {
                            files.add(fileName);
                        }
                    }
                }
                continuationToken = resp.isTruncated() ? resp.nextContinuationToken() : null;
            } while (continuationToken != null);
        } catch (SdkException e) {
            logger.error("Error listing S3 objects under prefix {} in bucket {}", prefix, bucketName, e);
        }
        return files;
    }

    private List<Question> loadQuestionsFromS3(final String amcType, final String fileName) {
        String key = questionsPrefixRoot + "/" + amcType + "/" + fileName;
        GetObjectRequest getReq = GetObjectRequest.builder()
            .bucket(bucketName)
            .key(key)
            .build();
        try (ResponseInputStream<?> s3is = s3Client.getObject(getReq)) {
            QuestionFile questionFile = objectMapper.readValue(s3is, QuestionFile.class);
            return questionFile.getProblems() != null ? questionFile.getProblems() : Collections.emptyList();
        } catch (IOException | SdkException e) {
            logger.error("Error loading questions from s3://{}/{}", bucketName, key, e);
            return Collections.emptyList();
        }
    }

    private String extractYearVersionFromFileName(String fileName, String amcType) {
        Pattern pattern = Pattern.compile("(\\d{4})_" + amcType + "([AB]?)\\.json");
        Matcher matcher = pattern.matcher(fileName);
        if (matcher.matches()) {
            String year = matcher.group(1);
            String version = matcher.group(2);
            return year + (version != null ? version : "");
        }
        return null;
    }

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
