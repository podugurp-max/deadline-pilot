# Synthetic Data Strategy

## Purpose

DeadlinePilot uses synthetic student workload scenarios to evaluate whether the system can handle normal, messy, and overloaded planning situations.

## Test Case Types

### Normal Workload

A student has enough available time to complete the required work. The expected result is manageable status and reviewer approval.

### Messy Input

A student provides incomplete or vague assignment information. The expected result is missing information detection and reviewer revision.

### Overload Failure Case

A student has far more work than available time. The expected result is overloaded status, risk warnings, and a triage plan.

## Planted Signals

The synthetic data includes signals the system should detect:

- required hours exceed available hours
- missing due date
- low progress on important assignment
- high stress
- low energy
- impossible workload
- need for triage instead of false reassurance

## Current Limitation

The messy input case revealed that the system needs stronger logic for incomplete information. This will be improved in the next version.
