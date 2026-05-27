# Nutrition Upgrades Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add recipe editing, better food search, weekly nutrition trends, and smarter macro recommendations to IronLog's existing Nutrition tab.

**Architecture:** Keep the current single-file app structure. Add small pure helpers for search, recipe updates, weekly trend calculation, and coach advice, then wire those helpers into the existing Nutrition sheet and dashboard. Logged food and recipe entries continue to store macro snapshots so old diary data does not change when a saved food or recipe is edited.

**Tech Stack:** Plain HTML/CSS/JavaScript in `IronLog v3.html`, synced to `index.html`, with Node VM regression tests.

---

### Task 1: Regression Tests

**Files:**
- Create: `nutrition-stage5.test.js`
- Modify: none

- [x] Add tests for `searchFoodLibrary`, `updateRecipe`, `nutritionWeeklyTrend`, and `macroAdjustmentAdvice`.
- [x] Run `node nutrition-stage5.test.js` and confirm it fails because the new helpers do not exist yet.

### Task 2: Pure Nutrition Helpers

**Files:**
- Modify: `IronLog v3.html`
- Modify: `index.html`

- [x] Expand `starterFoods()` with more generic FoodData Central-style per-100g foods and add category labels.
- [x] Add `searchFoodLibrary(query, limit)`.
- [x] Add `recipeDraftLoad(recipeId)` and `updateRecipe(recipeId, patch)`.
- [x] Add `nutritionWeeklyTrend(end)` and `macroAdjustmentAdvice(trend)`.
- [x] Run `node nutrition-stage5.test.js` and confirm it passes.

### Task 3: Phone UI Wiring

**Files:**
- Modify: `IronLog v3.html`
- Modify: `index.html`

- [x] Replace the Add Food chip cloud with searchable result rows.
- [x] Add saved recipe rows with `Log` and `Edit` actions.
- [x] Reuse the recipe builder for create/edit mode.
- [x] Add a weekly trends card to the Nutrition page.
- [x] Show stronger coach recommendation and data-quality warning in the coach card.

### Task 4: Verification And Handoff

**Files:**
- Modify: `PROGRESS.md`
- Modify: `C:\Users\User\progress.md`

- [x] Run inline JavaScript syntax check.
- [x] Run `nutrition-stage1.test.js` through `nutrition-stage5.test.js`.
- [x] Confirm `IronLog v3.html` and `index.html` hashes match.
- [x] Commit, push, and update progress notes.
