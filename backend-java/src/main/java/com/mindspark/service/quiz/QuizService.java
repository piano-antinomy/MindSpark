package com.mindspark.service.quiz;

import com.mindspark.model.Question;
import com.mindspark.model.QuizProgress;
import java.util.List;
import java.util.Map;

public interface QuizService {
    /**
     * user creates a standard quiz, return quiz progress object.
     * @param userId
     * @return
     */
    QuizProgress createStandardQuiz(String userId, String quizQuestionSetId);

    QuizProgress createPersonalizedQuiz(String userId);

    Map<String, QuizProgress> listQuiz(String userId);

    void updateQuizProgress(String userId, String quizId, QuizProgress quizProgress);

    /**
     * Get questions for a specific quiz by userId and quizId
     * @param userId the user who owns the quiz
     * @param quizId the quiz identifier
     * @return list of questions for the quiz
     */
    List<Question> getQuestionsByQuizId(String userId, String quizId);
}
