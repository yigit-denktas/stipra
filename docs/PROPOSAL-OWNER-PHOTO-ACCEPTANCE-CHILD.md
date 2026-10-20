# Proposal — #13 owner-photo package acceptance child

**Status:** proposal only. No issue has been created, no acceptance has been executed, and no result is claimed. This document prepares a future child of [#13](https://github.com/yigit-denktas/stipra/issues/13), which remains an open acceptance parent.

## Proposed issue

**Title:** Owner-photo package acceptance — private evidence

**Parent:** #13 · **References:** #8, #9, #12, #39 · **Type:** QA / acceptance · **Priority:** P1 · **Owner:** repository owner, with private operator/agent execution

## Purpose

Execute and record the already-written acceptance matrix in [the owner-photo package specification](PRINT-PACKAGE-ACCEPTANCE.md):

- **G01–G11** package checks for each of the three private fixtures A/B/C;
- **A1–A5 / B1–B5 / C1–C5** image-specific visual acceptance criteria.

The implementation records #8/#9/#12 remain complete for their delivered digital scopes. This child is for acceptance evidence only; it does not reopen their implementation work.

## Required record

For each fixture and each criterion, record exactly one of **PASS / FAIL / NOT RUN**, or narrowly justified **NOT APPLICABLE** where the specification permits. Every record includes:

- source and delivered-artifact SHA-256 identity;
- software version/commit and environment;
- reviewer/operator identity and date;
- whether evidence is automated, visually reviewed, or physically printed;
- saved private evidence paths/hashes (never public owner photographs).

## Boundaries

- Owner photographs and image-bearing evidence stay private.
- The existing acceptance document remains **NOT YET RUN / 0 of 3** until real evidence exists; no checkbox is ticked from CI, a merged implementation, or this proposal.
- Physical prints and independent artist trials remain separate and deferred; a digital package pass is not a physical pass.
- No production adapter, dependency, recipe, golden or delivered archive is changed by this acceptance work unless a separately authorized defect fix is opened.
- The child does not close #13. Human accessibility, physical print observations and independent artist usefulness retain their own gates (#13/#70).

## Completion condition

Closure requires all three fixtures to meet the existing package-pass gate in PRINT-PACKAGE-ACCEPTANCE.md: G01–G11 PASS or narrowly justified NOT APPLICABLE where the specification permits, all five image-specific criteria PASS by a named reviewer, and source rights/evidence requirements met. Recording FAIL or NOT RUN, or completing the inventory/summary, does **not** satisfy acceptance; FAIL needs a linked defect and NOT RUN remains pending. An explicit owner decision to defer or abandon is recorded as such and never as accepted. Physical prints and independent artist trials remain separate and are not hidden digital child requirements.
