# AMC question JSON structure

Use this skill when you need the current AMC resource schema, backend model mapping, or frontend rendering flow.

## Covers

- `backend-java/resources/math/questions/*.json`
- `backend-java/src/main/java/com/mindspark/model/Question.java`
- `backend-java/src/main/java/com/mindspark/model/Solution.java`
- `website/src/utils/QuestionParser.js`
- `website/src/utils/SolutionParser.js`

## Key shape

- root object: `competition_info` + `problems`
- each problem: `id`, `question`, `answer`, `solutions`, plus optional tags/sources
- `question.text` and `solution.text` may contain insertion markers that must be replaced before rendering
- choice payloads may live in `text_choices`, `latex_choices`, or `picture_choices`

## Rendering notes

- `QuestionParser.parseQuestion()` resolves insertions, choices, `choice_space`, and `choice_vertical`
- `Solutions.js` renders the first solution by default
- `SolutionParser.processSolutionText()` resolves insertions and strips attribution-only signatures

## Use it for

- schema checks
- rendering/debugging questions or solutions
- investigating missing content, insertion markers, or malformed choice payloads
