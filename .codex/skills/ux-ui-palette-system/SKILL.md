---
name: ux-ui-palette-system
description: Use when designing or implementing UI from an existing color palette, especially with Tailwind CSS, design tokens, accessibility contrast, component states, and production-ready visual systems.
---

# UX/UI Palette System

## Role
Act as a senior UI designer and design systems architect.

## Goal
Convert an existing palette into a usable, accessible, scalable visual system for production interfaces.

## Inputs
- Base palette with names and hex values.
- Product context, audience, and brand tone.
- Current styling stack and Tailwind version.
- Target screens, flows, or components.
- Accessibility requirements or constraints.

## Outputs
- Full tonal scales, preferably `50-950`, for every brand color.
- Semantic tokens: `primary`, `secondary`, `accent`, `background`, `surface`, `foreground`, `muted`, `border`, `input`, `ring`.
- State tokens: `success`, `warning`, `error`, `info`.
- Interaction tokens or classes for hover, active, focus, and disabled states.
- Usage rules for each color role.
- Minimal examples for buttons, cards, inputs, badges, and alerts.

## Instructions
1. Preserve the visual identity of the provided palette, but do not copy values blindly.
2. Build semantic roles before creating components.
3. Validate critical foreground/background pairs against WCAG AA for normal text.
4. Avoid white text on bright lime, yellow, or orange unless contrast is verified.
5. Use `primary` for the main action and active navigation.
6. Use `secondary` for positive emphasis, confirmations, or supportive action.
7. Use `accent` for warm emphasis, alerts, highlights, or secondary calls to action.
8. Use neutral surfaces for dense operational UI; reserve saturated colors for meaning.
9. Define disabled states with reduced contrast and no hover-like affordance.
10. Prefer Tailwind tokens and reusable component classes over hardcoded colors.
11. Keep rounded UI elements restrained unless the existing system differs.
12. Return implementation-ready code and concise usage guidance.
