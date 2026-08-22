# Run app locally (MindSpark)

Use this skill to review MindSpark from an isolated worktree. It runs the Java
backend against DynamoDB Local and builds the website so that all browser calls,
local sign-in, and redirects stay on localhost.

## Prerequisites

- Java installed
- Node.js + npm installed
- Maven installed (`mvn`)

## 1) Install dependencies and set up DynamoDB Local (one-time)

From repo root:

```bash
cd backend-java
bash setup-dynamodb-local.sh

cd ../website
npm install
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

If this fails because port `7076` is already in use, identify the exact process:

```bash
lsof -nP -iTCP:7076 -sTCP:LISTEN
```

Stop only the reported stale process, then rerun the command.

## 3) Start the backend in local mode

```bash
cd backend-java
bash run.sh --local
```

Important:

- local mode is enabled via JVM property: `-Dmindspark.local.mode=true`
- backend local DynamoDB client points to `http://localhost:7076`
- in local mode, backend attempts to start DynamoDB Local itself
- leave this terminal running

In a separate terminal, verify that the backend is serving the local API:

```bash
curl --fail http://localhost:4072/api/questions/math/
curl --fail http://localhost:4072/api/quiz/user/local-reviewer
```

If port `4072` is already in use, identify the exact listener:

```bash
lsof -nP -iTCP:4072 -sTCP:LISTEN
```

Stop only the reported stale process before starting the backend again.

## 4) Build and start the frontend in local mode

In a separate terminal:

```bash
cd website
REACT_APP_LOCAL_MODE=true \
REACT_APP_API_BASE_URL=http://localhost:4072/api \
REACT_APP_REDIRECT_URI=http://localhost:3000 \
npm run build
npm start
```

Frontend runs on `http://localhost:3000`.

Do not omit the three build-time variables. `npm start` serves the existing
production build; without these variables, `.env.production` directs API calls
and Cognito redirects to production instead of localhost.

If port `3000` is already in use, identify the exact listener:

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
```

Stop only the reported stale process, then rerun the local build and server.

## 5) Review local sign-in and quiz behavior

1. Open `http://localhost:3000`.
2. Navigate to sign-in.
3. Confirm the button reads **Continue Locally**, not **Continue with Google**.
4. Select **Continue Locally**. It creates the `local-reviewer` review session
   and returns to the local home page without opening Cognito.
5. Open a quiz and navigate between questions. The local review session must
   remain active, even if a local API response is `401`.

The local behavior applies only on `localhost` or `127.0.0.1`. Never use the
production Cognito flow while reviewing a worktree locally.

## 6) Local DDB admin UI (optional)

Current helper script:

```bash
bash check_local_ddb_ui.sh
```

Notes:

- intended to open `dynamodb-admin` against `127.0.0.1:7076`
- may fail on older Node versions (observed `getRandomValues is not a function`)
- if needed, use a newer Node runtime before using this UI tool
