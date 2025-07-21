## Assumption
Users know which level are suited for them

## User flow

For first time user, I will either play with one particular year's AMC question, or I will let system generate a quiz for me.

### Question category
Each question has one category and one subcategory. When subcategory is unclear, there is a "general" subcategory as a default.

### Quiz type
1. An existing AMC test. One particular year's AMC questions. Question length: 25
2. Autogen quiz. An autogen question set is generated based on three input: category labels, question length, level
 1. We allow multiple category labels. Users can choose random, or a list of categories (category is a combo of primary category and sub category). "random" is mutually exclusive with other categories, meaning a user cannot choose both random and algebra. Note that here we say user can choose, it really means either user explicitly choose, or the system chooses categories based on student's test history
 2. We allow users to pick a question length so that they can practice fewer problem at a time. 
 3, level means amc 8, 10, or 12


### Things we need to track
Quiz itself. If it is an existing AMC quiz, it is available to everyone, we don't need to track anything. If it is a quiz generated for some student, then we will need to track the following even before the students has started on it: 1, quiz length, 2, who is this for, 3, generated time, 4, categories, 5, status (not started), 6, question ids. When the student starts to work on it, then we will keep updating this quiz's progress. The student can change their answers to any question, until they submit the quiz, then they cannot change it anymore. We also need a timer to track users' time so that we can show the average time to compete a quiz and compete a question. To summarize, things we need to track per quiz
1, quiz id
2, quiz length
3, categories
4, student id
5, start time
6, end time
7, status
8, questions (need to track all question ids even before users have started on it)
9, accumulated time
10, answer to each question
11, total score (x out of y)
12, level (8, 10, 12)

### Expected user query
1. show me all quiz i have done, ordered by time in desc order
2. filter down by level

I would imagine we can return the result by searching the metadata first. The metadata contains all fields except the actual questions. Each student won't have more than 100 quiz, so it is not a whole lot info to return all at once. Then filter down by level can be a front end filtering

### Storage
We will need to save quiz itself, then a user quiz metadata. A few options
1, save everything in a single json file, then we do backend filtering down to metadata then return to front end. I asked gemini, if each student takes no more than 100 quiz, how much storage will it be. the answer is that it will have be < 200kb if we store everything about a single student together. And s3's free tier is not as generous as ddb
2, save individual test to ddb, then use ddb stream to consume the data, and update metadata file
3, store all metdata field in a secondary index table, we query by secondary index, then load all metadata all at once

