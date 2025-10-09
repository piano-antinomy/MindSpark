package com.mindspark.service.progress;

import com.mindspark.model.Progress;
import com.mindspark.model.QuizProgress;

import java.util.Map;

public interface ProgressTrackService {

    void trackProgress(String userId, String quizId, Map<String, String> questionIdToAnswer, int timeSpent, boolean hasTimer, int timeLimit);

    /**
     * Get the progress of a user
     */
    Progress getProgress(String userId);

    /**
     * get quiz progress.
     * @param userId
     * @param quizId
     * @return
     */
    QuizProgress getProgress(String userId, String quizId);
}