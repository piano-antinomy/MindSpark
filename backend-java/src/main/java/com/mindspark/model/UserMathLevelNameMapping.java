package com.mindspark.model;

import java.util.Map;
import java.util.TreeMap;

public class UserMathLevelNameMapping {
    private final Map<Integer, String> userMathLevelNameMapping;


    public UserMathLevelNameMapping(final Map<Integer, String> userMathLevelNameMapping) {
        this.userMathLevelNameMapping = new TreeMap<>() {{

        }};
    }

    public String getLevelName(int userMathLevel) {
        return userMathLevelNameMapping.get(userMathLevel);
    }
}
