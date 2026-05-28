# IronLog Future App Structure

Status: future direction, not current implementation.

## Big Idea

IronLog can grow from a workout tracker into a personal operating app with four main domains:

- **Fitness** - current workout app, progress, history, body weight, exercise library, form reminders.
- **Nutrition** - current macro tracker, saved foods, recipes, targets, coach handoff.
- **Sleep** - sleep logging, sleep quality, bedtime consistency, recovery notes.
- **Finances** - simple personal finance tracking, budgets, spending checks, future planning.

## Navigation Direction

Future bottom navigation should return to four slots:

1. Fitness
2. Nutrition
3. Sleep
4. Finances

The opening screen can become a domain launcher/home with four large panels. Tapping **Fitness** opens the current training layout. Tapping **Nutrition** opens the current macro tracker. Sleep and Finances can start as polished "Coming soon" screens until their real workflows are designed.

## Fitness Structure

Fitness should keep the current IronLog training system:

- Home/training dashboard
- Train screen
- Progress
- History
- Body weight
- Records
- Settings

When the top-level app shell exists, Fitness can have its own internal tabs or segmented controls for Train, Progress, History, and Records. Nutrition should no longer live inside Fitness once the four-domain shell exists.

## Nutrition Structure

Nutrition should own:

- Daily macro dashboard
- Food search and manual entry
- Saved foods
- Cooked-weight recipe builder
- Recipe edit/log flows
- Weekly nutrition trend
- Macro coach recommendations
- AI handoff nutrition export

## Later Fitness Upgrade: Exercise Form Library

Add an exercise form/reference feature later, especially for users who need reminders on proper setup and execution.

Useful shape:

- Exercise detail page includes a **Form** section.
- Short setup cues, execution cues, common mistakes, and muscle focus.
- Optional media later: images, short clips, or generated diagrams.
- Keep cues factual and concise. Avoid pretending to replace a coach or medical advice.

## Current Small Cleanup

The old profile/avatar topbar button opened the same Settings sheet as the gear button. Keep only the gear button unless real profile switching returns.
