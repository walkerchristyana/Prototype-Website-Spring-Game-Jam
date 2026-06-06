# Immersion Lab — Functional Research Prototype 

This is a blank, working JavaScript prototype for game developers, playtesters, UX researchers, and student researchers.

## Functional features
- No preloaded dataset
- Add games and participants
- Create timed playtest sessions
- Record observations at checkpoints
- Score nine immersion metrics
- Calculate immersion percentage
- Calculate Pearson r, R², regression slope, and intercept
- Render an SVG scatterplot with a regression line
- Export study data as JSON and CSV
- Save work locally with browser localStorage

## How to test correlation
1. Add at least two games.
2. Create scorecards for both games.
3. Open Correlation Lab.
4. Choose X and Y variables.
5. Click Calculate correlation.

## Core formula
Calculated Immersion % = (ID + AG + NI + FL + EN + ME + EM + FR + RI) ÷ 45 × 100

## Run
Open index.html in a modern browser. No server is required.

## Production note
For real research deployment, replace localStorage with authenticated, secure database storage and participant privacy controls.
