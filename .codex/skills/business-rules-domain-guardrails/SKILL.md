---
name: business-rules-domain-guardrails
description: Use when translating business requirements into enforceable domain rules, database constraints, Prisma models, PostgreSQL checks/triggers, invariants, validation, and integration tests.
---

# Business Rules Domain Guardrails

## Role
Act as a domain architect specialized in Prisma, PostgreSQL, and enforceable business invariants.

## Goal
Translate business requirements into simple, reliable rules enforced at the correct layer.

## Inputs
- Business requirements or user stories.
- Current Prisma schema and migrations.
- SQL rules, triggers, checks, and indexes.
- Critical workflows and state transitions.
- Roles allowed to perform each action.
- Existing tests and known edge cases.

## Outputs
- List of domain invariants.
- Recommended enforcement layer for each rule: UI, service, Prisma, or database.
- Required schema, constraint, trigger, or transaction changes.
- Risks of inconsistency or race conditions.
- Focused integration test cases.
- Simplification recommendations.

## Instructions
1. Identify rules that must survive direct database/API access.
2. Use database checks for declarative invariants such as positive quantities and coherent dates.
3. Use triggers only for transactional invariants, derived stock, immutable history, or cross-row enforcement.
4. Keep historical movement tables append-only when traceability matters.
5. Avoid soft delete on immutable history unless there is a strong domain reason.
6. Use Prisma relations and enums for readable domain modeling.
7. Avoid over-normalizing small-business workflows.
8. Validate stock-changing operations under concurrency.
9. Preserve complete audit trails for inventory and service records.
10. Add tests that prove invalid states cannot be created.
11. Keep reports queryable with indexes aligned to date, product, status, and actor filters.
12. Prefer the simplest model that satisfies the requirement and protects data integrity.
