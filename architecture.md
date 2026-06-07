# Architecture

## System Overview

DeadlinePilot uses an agentic workflow architecture. The system is organized around an orchestrator-style process where the user's input is routed through several specialized agents. Each agent has a narrow responsibility, and the final Reviewer Agent checks the combined output before the user sees the plan.

## Final Architecture Update: Gemini Reviewer Agent

The draft version used deterministic functions for all six agents. Based on instructor feedback, the final version keeps the deterministic workflow as a reliable scaffold but upgrades the Reviewer Agent to use a real Gemini API call.

The first five agents still produce structured outputs:

- Task Parser Agent
- Priority Agent
- Feasibility Agent
- Schedule Builder Agent
- Risk Agent

The Reviewer Agent now sends those outputs to a server-side Gemini call. Gemini audits the plan for realism, missing information, false reassurance, overload handling, and approval status.

This hybrid architecture keeps the deterministic evaluation harness while adding a real model-powered agent step.

## Data Flow

1. User enters student context and assignments.
2. The Task Parser Agent structures the assignment data.
3. The Priority Agent scores and ranks tasks.
4. The Feasibility Agent compares required work against available time.
5. The Schedule Builder Agent creates a recommended plan.
6. The Risk Agent flags potential problems.
7. The Reviewer Agent audits the final plan.
8. The user receives a recovery plan, risk warnings, and agent workflow trace.

## Agent Roles

### Task Parser Agent

Normalizes raw assignment input into structured tasks.

### Priority Agent

Scores tasks by urgency, grade weight, progress, and difficulty.

### Feasibility Agent

Compares required work against available hours and classifies the workload as manageable, tight, or overloaded.

### Schedule Builder Agent

Allocates available work time across today and tomorrow.

### Risk Agent

Flags risks such as overload, low energy, high stress, missing information, and deadline pressure.

### Reviewer Agent

Audits the plan and decides whether it is approved or needs revision.

## Current Implementation

The final version uses a hybrid architecture. Deterministic logic handles structured parsing, priority scoring, feasibility calculation, schedule scaffolding, and risk detection. The Reviewer Agent is powered by a real Gemini API call and audits the deterministic output before final review.

## Feasibility Logic

The system calculates:

required hours / available hours = workload ratio

Classification:

- 0.00–0.85: manageable
- 0.86–1.15: tight
- 1.16 or higher: overloaded

## UX Sections

The app includes:

- Header
- About the Agentic Workflow
- Evaluation Demo
- Student Context Form
- Assignment Input Section
- Run Recovery Plan button
- Situation Summary
- Priority Ranking
- Recommended Recovery Plan
- Risk Warnings
- Missing Information
- Reviewer Check
- Agent Workflow Trace

## Prototype Tech Stack

- Lovable-generated React app
- Deterministic JavaScript logic
- GitHub repository
- Markdown documentation
- Lovable deployment
