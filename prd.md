# Product Requirements Document: DeadlinePilot

## Product Summary

DeadlinePilot is an agentic academic deadline recovery assistant for students who are overwhelmed by multiple assignments and limited time. It helps students triage work, check feasibility, and create a realistic recovery plan.

## Target User

The primary user is a college student balancing coursework, work, internships, and personal responsibilities.

Secondary users could include academic coaches, advisors, or peer mentors who help students recover from deadline overload.

## User Problem

Students often know they are behind, but they do not know what to do first. When several assignments are due close together, students may:

- underestimate how long tasks will take
- start with easy but low-impact work
- ignore grade weight or deadline urgency
- overcommit to unrealistic study plans
- panic when everything feels equally urgent
- ask AI for reassurance instead of realistic triage

## Product Goal

DeadlinePilot should help students create a realistic recovery plan based on:

- assignment deadlines
- estimated hours remaining
- grade weight or importance
- current progress
- difficulty
- available time
- energy level
- stress level
- fixed commitments

## Non-Goals

DeadlinePilot does not:

- complete assignments for the student
- guarantee grades
- replace communication with instructors
- provide mental health or medical advice
- encourage academic dishonesty
- claim that impossible workloads are realistic

## Core Requirements

### R1: Student Context Intake

The system must collect the current date, available time today, available time tomorrow, energy level, stress level, and fixed commitments.

### R2: Assignment Intake

The system must allow the user to enter multiple assignments with name, course, due date, hours remaining, importance, progress, difficulty, and notes.

### R3: Task Parsing

The system must normalize assignment input into structured tasks.

### R4: Priority Ranking

The system must rank assignments using urgency, importance, progress, and difficulty.

### R5: Feasibility Classification

The system must compare required work against available time and classify the workload as manageable, tight, or overloaded.

### R6: Recovery Plan

The system must create a recommended recovery plan based on priority and feasibility.

### R7: Risk Detection

The system must flag planning risks such as overload, missing information, low energy, high stress, and deadline pressure.

### R8: Reviewer Check

The system must include a final reviewer step that approves the plan or marks it as needing revision.

### R9: LLM Reviewer Agent

The system must include at least one real model-powered agent step. In the final version, the Reviewer Agent calls Gemini through a secure server-side API function to audit the deterministic recovery plan.

## Success Criteria

DeadlinePilot is successful when it:

- identifies the highest-risk assignments
- explains why tasks are prioritized
- calculates whether available time is enough
- flags overloaded workloads
- avoids false reassurance
- produces a realistic next action
- shows the agent workflow trace
