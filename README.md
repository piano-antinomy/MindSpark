# MindSpark

MindSpark is a math-learning web application built around AMC 8, AMC 10, and AMC 12 problem sets. Learners sign in, choose an exam level and year, practice questions with MathJax-rendered content, take quizzes, view solutions and progress, and submit feedback.

The active application is a React frontend and a Java API. The old Python/Flask setup described by historical files is not the current runtime.

## Start here (agents and contributors)

Before changing code or AMC resources:

1. Read this README.
2. List `.claude/skills/*/SKILL.md`.
3. Read the `SKILL.md` file for the task you are performing, plus every file it explicitly references. For example, AMC resource work requires the JSON-schema skill and the appropriate validation skill.
4. Follow the skill's validation and confirmation requirements. In particular, do not automatically apply AI-proposed answer or solution changes.

The task-specific skills are:

| Skill | Use when |
| --- | --- |
| [`amc-question-json-structure`](.claude/skills/amc-question-json-structure/SKILL.md) | Understanding AMC JSON, Java models, or frontend question/solution rendering |
| [`amc-resource-validator`](.claude/skills/amc-resource-validator/SKILL.md) | Validating AMC resources, browser rendering, or AI review of problems and solutions |
| [`amc-resource-quality-control`](.claude/skills/amc-resource-quality-control/SKILL.md) | Checking rendered choice length and readability |
| [`amc-ai-solution-sync`](.claude/skills/amc-ai-solution-sync/SKILL.md) | Copying matching AI solutions into question resources |
| [`amc-categorization-apply-with-validation`](.claude/skills/amc-categorization-apply-with-validation/SKILL.md) | Applying validated category overrides to AMC resources |
| [`python-scripts-setup`](.claude/skills/python-scripts-setup/SKILL.md) | Running parsing, labeling, and other Python utilities |
| [`run-app-locally`](.claude/skills/run-app-locally/SKILL.md) | Running the complete local application stack |

## Architecture

```text
website/                         React 18 single-page application
  src/components/                Screens: login, subjects, practice, quizzes, solutions, etc.
  src/utils/                     API client and question/solution parsers
  public/resources/images/       Local images referenced by AMC content

backend-java/                    Java 17 API
  src/main/java/com/mindspark/   Jetty + Guice controllers, services, and AWS adapters
  resources/math/questions/      Canonical AMC question JSON, grouped by AMC_8, AMC_10, AMC_12
  resources/math/ai/             AI-generated solution data paired with question files
  questions/                     Legacy/import source data; not the canonical editable resource path

scripts/python/                  AMC parsing, labeling, and validation utilities
.claude/skills/                  Task-specific agent instructions and helpers
```

### Runtime flow

1. The React app uses `REACT_APP_API_BASE_URL`, or defaults to `http://<host>:4072/api`.
2. The Java backend serves the API on port `4072`.
3. In local mode, the Java `QuestionService` reads `backend-java/resources/math/questions/` from the filesystem.
4. In deployed mode, the backend reads question data from S3 and uses AWS services for persistence.
5. DynamoDB stores user progress and quiz data. Local development uses DynamoDB Local on port `7076`.

Level mapping is fixed: **1 = AMC 8**, **2 = AMC 10**, and **3 = AMC 12**.

## Technology

| Area | Implementation |
| --- | --- |
| Frontend | React 18, React Router, MathJax, Express static server |
| API | Java 17, Jetty, Guice, Jackson |
| Data and cloud | DynamoDB, S3, AWS Lambda/CDK |
| Content tooling | Python 3 utilities |

## Run locally

Prerequisites: Java 17, Maven, Node.js with npm, and Python 3 for content tooling.

1. Set up DynamoDB Local once:

   ```bash
   cd backend-java
   bash setup-dynamodb-local.sh
   bash test-dynamodb-local.sh
   ```

2. Start the Java API in local mode:

   ```bash
   cd backend-java
   bash run.sh --local
   ```

3. In another terminal, start the React development server:

   ```bash
   cd website
   npm install
   npm run react-start
   ```

Open `http://localhost:3000`. Localhost uses a local review sign-in rather than the production Cognito redirect.

For a production-style frontend server, run `npm run build && npm start` in `website/`. The Express server serves the generated `website/build/` directory.

## API surface

The Java API is mounted below `/api` on port `4072`.

| Area | Examples |
| --- | --- |
| Authentication | `POST /auth/login`, `POST /auth/logout`, `GET /auth/profile`, `GET /auth/status` |
| Subjects and questions | `GET /subjects`, `GET /questions/math`, `GET /questions/math/level/{level}/years`, `GET /questions/math/level/{level}/year/{year}` |
| Progress and quizzes | `POST /progress/track`, `GET /progress/user/{userId}`, `POST /quiz/create`, `GET /quiz/user/{userId}` |
| Community | `GET /leaderboard/*`, `POST /feedback/submit` |

See [`backend-java/README.md`](backend-java/README.md) for the backend's endpoint details. Some older documentation describes legacy endpoints or implementation history; prefer this README, the code, and the task skills when they disagree.

## AMC content workflow

The canonical content location is:

```text
backend-java/resources/math/questions/{AMC_8,AMC_10,AMC_12}/*.json
```

Each file contains `competition_info` and a `problems` array. Problems include an ID, question payload, answer, and solutions. Rendering supports text, LaTeX, image insertions, and text/LaTeX/image choices.

For any resource edit:

1. Read `amc-question-json-structure`.
2. Run the static and browser checks in `amc-resource-validator`.
3. Run the required AI quality review generated by that skill.
4. For answer corrections or generated solutions, obtain explicit user confirmation before modifying the resource.
5. Review the edited resource in the locally running application.

Common commands are documented in the linked skills; run them from the repository root unless the skill says otherwise.

## Development map

- **Frontend behavior and routes:** `website/src/App.js` and `website/src/components/`
- **Question rendering:** `website/src/components/QuestionRenderer.js`, `website/src/utils/QuestionParser.js`, and `website/src/utils/SolutionParser.js`
- **API wiring:** `backend-java/src/main/java/com/mindspark/MindSparkApplication.java`
- **Dependency injection and local/production service choice:** `backend-java/src/main/java/com/mindspark/config/MindSparkModule.java`
- **Question loading:** `backend-java/src/main/java/com/mindspark/service/CacheBackedQuestionServiceImpl.java`
- **AWS infrastructure:** `backend-java/src/main/java/com/mindspark/aws/cdk/`

## Useful references

- [`website/README.md`](website/README.md) - frontend commands and layout
- [`backend-java/README.md`](backend-java/README.md) - backend setup and API details
- [`backend-java/DYNAMODB_LOCAL_SETUP.md`](backend-java/DYNAMODB_LOCAL_SETUP.md) - local DynamoDB notes
- [`scripts/python/requirements.txt`](scripts/python/requirements.txt) - Python tooling dependencies
