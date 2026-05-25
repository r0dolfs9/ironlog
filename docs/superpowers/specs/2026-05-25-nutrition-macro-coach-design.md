# IronLog Nutrition Macro Coach Design

Date: 2026-05-25  
Status: Approved design direction  
Scope: V1 nutrition tracker, adaptive cutting coach, and future AI/photo logging foundation

## Goal

Add a first-class Nutrition tab to IronLog so the app can support a serious cutting phase. The feature should be closer to MacroFactor than a simple calorie diary: accurate macro logging, cooked-weight recipe support, training/rest day targets, and weekly target recommendations based on intake, bodyweight trend, and light training context.

The app should remain phone-first and personal-use focused. AI/photo logging is part of the long-term design, but v1 must work well without it.

## Product Principles

- Accuracy comes before logging speed.
- Manual entries are the source of truth.
- AI/photo results are drafts that must be reviewed before saving.
- Recipe portions store nutrition snapshots so old diary entries never change when a recipe is edited.
- The coach uses a neutral analyst tone: factual, direct, no guilt and no cheerleading.
- The app tolerates imperfect logging, but flags data quality so recommendations are not overconfident.
- Nutrition coaching uses training performance as context, not as the primary driver of calorie changes.

## Navigation

Add a fifth bottom tab:

```text
Home | Train | Nutrition | Progress | History
```

The Nutrition tab owns daily macro tracking, meal logging, recipe logging, target setup, and weekly check-ins. Home can later show a small nutrition summary card, but the main workflow lives in Nutrition.

## Primary Daily Flow

```text
Open Nutrition
-> See today's calorie/protein/carbs/fat dashboard
-> Add meal item
-> Choose manual food, saved food, or recipe portion
-> Enter grams
-> Save
-> Macro dashboard updates
-> Day quality updates
-> User marks day complete when finished
```

Daily screen layout:

```text
TODAY
[Calorie ring]
[Protein bar] [Carbs bar] [Fat bar]
[Target: Training day / Rest day]
[Data quality: Complete / Likely incomplete / Missing]
[Coach note]

MEALS
Breakfast
Lunch
Dinner
Snacks

ADD
Manual food
Saved food
Recipe
AI scan later
```

## Food Logging

V1 supports:

- manual food/ingredient logging
- private saved foods
- small built-in starter food database
- saved recipes/batch meals
- cooked-weight recipe portions

Starter database should be small and practical, not a large public food database.

Initial starter foods:

- Protein: chicken breast, lean beef, eggs, egg whites, Greek yogurt, cottage cheese, whey protein, tuna, salmon
- Carbs: rice, potatoes, oats, pasta, bread, banana, berries
- Fats: olive oil, avocado, peanut butter, nuts
- Common/mixed: protein bar, milk, vegetables, generic sauce entry

Food entries should support nutrition per 100g and optionally per serving. The logging UI should prefer grams for accuracy.

## Recipes

Recipe support is required in v1.

Main recipe method: cooked weight.

Flow:

```text
Create recipe
-> Add raw ingredients by grams
-> Enter total cooked weight after cooking
-> App calculates nutrition per 100g
-> Later log "Recipe name, 350g"
-> App calculates calories/macros for that portion
```

Recipe requirements:

- ingredients with grams
- total cooked weight
- calculated nutrition per 100g
- ability to log a cooked-weight portion later
- ability to edit recipe without changing old logged diary entries

Logged recipe portions must store a snapshot of calories, protein, carbs, and fat at the time of logging.

## Targets

Targets are app-suggested but fully editable before the user starts.

The setup flow asks for enough information to suggest starting targets:

- current body weight
- target body weight or target cut pace
- age, height, sex if available
- training days per week
- preferred cut mode: conservative, standard, aggressive

The user can override calories and macro targets before saving.

Targets use a training/rest split from v1:

```text
Weekly average target
|-- Training day: higher calories/carbs
`-- Rest day: lower calories/carbs
```

Protein stays steady across day types. Fat keeps a minimum floor. Carbs absorb most day-type differences.

## Adaptive Coach

The coach adjusts calories and macros weekly.

Primary inputs:

- 7/14/21-day bodyweight trend
- average calorie intake
- average protein, carbs, and fat
- complete vs incomplete nutrition days
- selected cut mode
- target weekly loss pace

Secondary context:

- training frequency
- volume/performance trend
- missed workouts
- obvious performance drop warnings

Training data should influence recommendation text and caution level, but bodyweight trend, intake, and adherence drive target changes.

Weekly output example:

```text
Weight trend: -0.42 kg/week
Target pace: -0.50 kg/week
Average intake: 2310 kcal
Data quality: medium, 2 incomplete days
Training: stable

Recommendation:
Keep calories unchanged.
Increase protein consistency.
```

Adjustment rules:

- Adjust calories and macros, not calories alone.
- Protect protein during the cut.
- Keep fat above a minimum floor.
- Move most calorie changes through carbs.
- Cap weekly changes so the app does not overreact.
- Maintain the training/rest split within the weekly average.
- If weight drops too fast and training performance falls, recommend easing the cut or raising training-day carbs.
- If weight is flat and data quality is high, recommend reducing calories.
- If data quality is low, recommend finishing more logs before making a large change.

## Data Quality

The app uses flexible logging with data-quality flags.

Day quality states:

- `complete`: user marked complete and logged intake looks plausible
- `likelyIncomplete`: calories/macros are suspiciously low or meal pattern is incomplete
- `missing`: no nutrition logged

Weekly confidence:

- High: most days complete and 5+ weigh-ins
- Medium: some incomplete days or 3-4 weigh-ins
- Low: many missing/incomplete days or fewer than 3 weigh-ins

The app still shows a weekly check-in with imperfect data, but the recommendation text must clearly state confidence and why.

## Bodyweight Expectations

The coach is designed for daily weigh-ins but tolerates missed days.

```text
Ideal: 7 weigh-ins/week
Good: 5+ weigh-ins/week
Usable: 3-4 weigh-ins/week
Low confidence: fewer than 3 weigh-ins/week
```

V1 optimizes for scale trend plus gym performance. Later versions can add waist measurements, progress photos, and body composition notes.

## Data Model

Add a top-level `DB.nutrition` object. Existing databases without this object migrate by adding defaults.

Proposed shape:

```js
DB.nutrition = {
  targets: {
    mode: 'conservative' | 'standard' | 'aggressive',
    goal: 'cut',
    startDate,
    weeklyLossRatePct,
    trainingDay: { calories, protein, carbs, fat },
    restDay: { calories, protein, carbs, fat },
    history: []
  },

  diary: {
    '2026-05-25': {
      targetType: 'training' | 'rest',
      status: 'open' | 'complete',
      quality: 'complete' | 'likelyIncomplete' | 'missing',
      meals: [
        {
          id,
          name: 'Lunch',
          items: [
            {
              type: 'food' | 'recipe' | 'aiIngredient',
              sourceId,
              name,
              grams,
              calories,
              protein,
              carbs,
              fat,
              snapshot: true
            }
          ]
        }
      ]
    }
  },

  foods: [],
  recipes: [],
  checkins: []
}
```

Food shape:

```js
{
  id,
  name,
  brand,
  source: 'starter' | 'private',
  per100g: { calories, protein, carbs, fat },
  serving: { label, grams } | null,
  archived: false
}
```

Recipe shape:

```js
{
  id,
  name,
  ingredients: [
    { foodId, name, grams, calories, protein, carbs, fat, snapshot: true }
  ],
  cookedWeightGrams,
  per100g: { calories, protein, carbs, fat },
  archived: false,
  updatedAt
}
```

Check-in shape:

```js
{
  id,
  weekStart,
  weekEnd,
  confidence: 'high' | 'medium' | 'low',
  weightTrendKgPerWeek,
  targetLossKgPerWeek,
  avgCalories,
  avgProtein,
  avgCarbs,
  avgFat,
  incompleteDays,
  weighIns,
  trainingContext,
  recommendation,
  accepted: true | false,
  createdAt
}
```

## AI Handoff and Future AI Photo Logging

V1 should include nutrition data in the existing AI handoff/export path.

Export should include:

- daily nutrition totals
- meal/item details
- target history
- check-in history
- incomplete-day flags
- bodyweight trend
- training frequency and performance context
- app recommendation and confidence

Future photo flow:

```text
Take/select photo
-> AI creates ingredient breakdown draft
-> User edits ingredients, grams, and macros
-> Save as meal
```

Photo logging must not bypass manual review. It uses the same diary item model with `type: 'aiIngredient'`.

## Implementation Stages

### Stage 1: Nutrition foundation

- Add `DB.nutrition` migration/defaults.
- Add Nutrition bottom tab.
- Render daily macro dashboard.
- Add meal sections.
- Add manual ingredient logging.
- Calculate daily totals and remaining macros.

### Stage 2: Foods and recipes

- Add starter food database.
- Add private saved foods.
- Add recipe builder with cooked weight.
- Add log-recipe-portion flow.
- Store snapshots for logged recipe portions.

### Stage 3: Targets and cutting setup

- Add target setup flow.
- Suggest starting calories/macros.
- Allow full target override.
- Add conservative, standard, aggressive modes.
- Add training/rest day targets.

### Stage 4: Weekly coach

- Calculate weight trend and intake averages.
- Score data quality and confidence.
- Generate target recommendations.
- Support accept, edit, or skip.
- Save check-in history.

### Stage 5: AI handoff/export

- Extend markdown/JSON export with nutrition context.
- Include app recommendation and confidence.
- Include training-performance context.

### Stage 6: Photo AI later

- Add camera/photo UI.
- Add AI ingredient breakdown draft.
- Require user review before saving.
- Use the same food/recipe/diary model.

## Non-Goals for V1

- Public food database.
- Barcode scanner.
- Automatic exercise calorie eating-back.
- Meal timing coaching.
- Desktop/tablet-optimized recipe editor.
- Cloud sync.
- Fully automated AI decisions that change targets without user review.

## Implementation Decisions

- Starting target formulas should be defined in the implementation plan, but the UI must always allow user override before targets are activated.
- Weekly target changes must be capped in the implementation plan; no automated recommendation should make a large jump without user review.
- If the app cannot determine whether today is a training day, it should default to the planned day type and allow the user to toggle Training / Rest from the Nutrition screen.
- V1 should include an explicit "mark day complete" action. Inference can still flag suspicious days, but user intent is needed for coaching confidence.
- Home nutrition summary is deferred until after the Nutrition tab works. The first implementation should keep the workflow inside Nutrition.
