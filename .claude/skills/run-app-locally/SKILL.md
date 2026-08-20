# Run app locally (MindSpark)

Use this skill to start the MindSpark Java backend + website locally, with DynamoDB Local for quiz/progress data.

## Prerequisites

- Java installed
- Node.js + npm installed
- Maven installed (`mvn`)

## 1) Set up DynamoDB Local (one-time)

From repo root:

```bash
cd backend-java
bash setup-dynamodb-local.sh
```

This installs:

- `localTest/DDB/DynamoDBLocal.jar`
- `localTest/DDB/DynamoDBLocal_lib/`

## 2) Verify DynamoDB Local setup

```bash
cd backend-java
bash test-dynamodb-local.sh
```

Expected behavior:

- starts DynamoDB Local on port `7076`
- confirms port is listening
- stops it cleanly

## 3) Start backend in local mode

```bash
cd backend-java
bash run.sh --local
```

Important:

- local mode is enabled via JVM property: `-Dmindspark.local.mode=true`
- backend local DynamoDB client points to `http://localhost:7076`
- in local mode, backend attempts to start DynamoDB Local itself

## 4) Start frontend

In another terminal:

```bash
cd website
npm install
npm start
```

Frontend runs on `http://localhost:3000`.

- Sign-in on `localhost` uses a local review session and must stay on the local site. Do not use the production Cognito redirect while reviewing a worktree.

## 5) Local DDB admin UI (optional)

Current helper script:

```bash
bash check_local_ddb_ui.sh
```

Notes:

- intended to open `dynamodb-admin` against `127.0.0.1:7076`
- may fail on older Node versions (observed `getRandomValues is not a function`)
- if needed, use a newer Node runtime before using this UI tool
