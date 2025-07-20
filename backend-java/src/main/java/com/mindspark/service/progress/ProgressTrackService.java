package com.mindspark.service.progress;

import com.mindspark.model.Progress;

public interface ProgressTrackService {
    /**
     * Track the progress of a user for a given question
     */
    void trackProgress(String userId, String questionId, String answer);

    /**
     * Get the progress of a user
     */
    Progress getProgress(String userId);
}