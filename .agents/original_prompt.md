
## Follow-up — 2026-07-22T20:23:34+07:00

Redesign the virtual office dashboard (CommandCenter) in SumStar OS into a "Cute Minimal" desk setup: a wooden clipboard for command input positioned above a corkboard where tasks are pinned as colorful post-it notes.

Working directory: c:/Users/siraw/OneDrive/Desktop/sumstar-os
Integrity mode: development

## Requirements

### R1. Clipboard-Style Command Input
- Redesign the task input form at the top of the dashboard to look like a vertical wooden clipboard.
- The clipboard should have a dark grey retro metal clip visual at the top.
- The input fields should appear as a white/cream sheet of paper held by the clip, with faint writing lines and a hand-drawn feel.

### R2. Corkboard Task Board
- Build a corkboard container below the clipboard (using a warm textured cork/wood color and wooden frame borders).
- Inside the corkboard, display the task lists (active tasks and recently done tasks).

### R3. Pastel Post-it Sticky Notes
- Render each task as a sticky note with a 3D pushpin/thumbtack graphic at the top center.
- Apply subtle random rotations (`rotate-[-1.5deg]` to `rotate-[1.5deg]`) to the notes to make them look organically pinned.
- Use status-based pastel background colors:
  - Pending Review: Warm yellow
  - Queued: Soft blue
  - In Progress: Orange/purple
  - Done: Soft green
- When expanded, the subtask checklist should look like a handwriting notebook sheet.
- Hovering over a card should trigger smooth micro-animations (e.g., float or lift).

## Acceptance Criteria

### UI & Aesthetics
- [ ] The dashboard has a prominent wooden clipboard form at the top and a textured corkboard container for tasks below it.
- [ ] Tasks are displayed as colorful sticky notes with a thumbtack icon on top, slightly rotated.
- [ ] Task card background colors correctly reflect their current status (yellow, blue, orange/purple, green).

### Functionality
- [ ] Adding tasks, delegating, processing subtasks, giving feedback, and deleting tasks still work perfectly without broken state transitions.
