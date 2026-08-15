# AMC DOM validation rules

Use this checklist when validating rendered AMC questions and solutions in a browser.

## Required checks

1. Question text renders without raw `<INSERTION_INDEX_...>` markers.
2. MathJax output appears where LaTeX is present.
3. Images load and have non-zero natural dimensions.
4. Choice content stays visible inside the choice container.
5. Question content stays visible inside the question container.
6. Horizontal overflow is absent unless explicitly intended.
7. Scrollbars appear only when content exceeds the available height.
8. If content overflows, the bottom remains reachable by scrolling.
9. Choice labels and answer text remain aligned.
10. Solution content renders without clipping or overlap.
11. No element is hidden behind fixed headers or footer chrome.
12. Computed bounds fit the viewport for the selected device profile.

## Scrollable region rules

- Validate top, middle, and bottom scroll positions when a region overflows.
- Confirm the last visible line is reachable after scrolling to the end.
- Confirm the first line is reachable after scrolling back to the top.

## Viewport profiles

- iPad mini portrait: `768x1024`
- iPad mini landscape: `1024x768`
- laptop: `1440x900`
- desktop: `1920x1080`

## Failure examples

- choice column clipped off the right edge
- long question cut off below the fold with no scroll path
- solution area hidden behind another container
- MathJax never typesets raw TeX
- broken image placeholder or zero-size image
