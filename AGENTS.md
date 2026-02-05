# AGENTS.md

These instructions describe my design and UX preferences for this repo.
Follow them unless a specific file or page already establishes a different pattern.

## Design Direction
- Aim for a bold, intentional visual language. Avoid generic SaaS layouts.
- Prefer a single, coherent theme per page (type, color, spacing, motion).
- Use atmosphere: gradients, subtle texture, or shapes instead of flat backgrounds.
- Avoid purple-heavy palettes and default grayscale ramps.

## Typography
- Use expressive typefaces and avoid default system stacks.
- Prefer strong type scale contrast: clear display size and readable body size.
- Keep line length comfortable (roughly 60-80 characters on desktop).

## Layout
- Use clear visual hierarchy with generous spacing.
- Favor asymmetric or editorial layouts when possible.
- Ensure mobile layouts feel intentional, not just stacked desktop sections.

## Color and Contrast
- Maintain strong contrast for readability.
- Define color tokens/variables early and reuse them consistently.
- Avoid noisy gradients; keep them subtle and controlled.
- Sitewide colors must be drawn only from the palette defined in `app/globals.css`.
- Do not introduce new hex values or ad-hoc colors in components.

## Motion
- Use a small number of meaningful animations.
- Prefer page-load or section-reveal motion over constant micro-animations.
- Keep durations short and easing smooth; avoid bouncy defaults.

## Components
- Reuse components; do not create near-duplicates.
- Keep component APIs minimal and consistent.
- When extending a component, add a variant instead of a new component.

## UX Behavior
- Prioritize clarity and speed over clever interactions.
- Avoid unexpected layout shifts.
- Provide immediate feedback for user actions (loading, success, error).

## Accessibility
- Preserve focus states and keyboard navigation.
- Ensure sufficient color contrast for text and controls.
- Do not rely on color alone to convey status.

## Implementation Notes
- Prefer CSS variables for theme tokens (colors, spacing, type scale).
- Avoid magic numbers; use shared spacing/size tokens.
- Keep styles co-located with components unless a global token is required.

## SaaS/WaaS Configuration
- Assume the product is DB-driven and configurable for multiple deployments.
- Treat localization, formatting, brand names, copy, and labels as admin-configured globals.
- Avoid hard-coded strings for tenant-specific content; use config or i18n hooks.
- Keep tenant-specific settings centralized and easy to override per deployment.
