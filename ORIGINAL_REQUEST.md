# Original User Request

## 2026-08-16T03:29:22+07:00

This is a single self-contained fix; keep it small and focused. Redesign the visual style and art direction of the SumStar OS application into a bold, brutalist-inspired creative studio editorial aesthetic, using a pastel pink/salmon pink and black color scheme with oversized typography and hand-drawn elements, without altering the existing content, layouts, or functionalities.

Working directory: c:/Users/siraw/OneDrive/Desktop/sumstar-os
Integrity mode: development

## Requirements

### R1. Color Palette: Pastel Pink & Black
- Update the system color scheme to use pastel pink/salmon pink as the primary background color, black (or near-black) for text and graphics/borders, and white as a secondary accent.
- Remove all gradients and glassmorphism from the application.

### R2. Bold Editorial Typography
- Load a bold/condensed Google Font (e.g., Archivo Black, Syne, Cabinet Grotesque, or similar) for headings.
- Make typography a central element: large headings, tight line-heights, uppercase for key labels, and weight that stands out.

### R3. Brutalist UI Elements & Hand-Drawn Aesthetics
- Update UI components (buttons, cards, borders, badges, sidebars) to use thick black borders (`border-4` or similar), minimal/solid flat shadows (no solid blur), and sharp corners.
- Infuse a hand-drawn, marker-like feeling into graphic accents (like pins, lines, and borders).
- Apply subtle organic rotations (`rotate-[-1deg]` to `rotate-[1.5deg]`) to key container cards for a slightly asymmetrical, handmade look.

### R4. Playful Motion
- Integrate playful micro-animations (e.g., slight hover rotations, text movements, organic scaling).

### R5. Verification Script
- Implement a verification script (e.g., `scripts/verify_style.ts`) to programmatically ensure that the style changes compile correctly in Next.js/Tailwind and that the required CSS variables are applied.

## Acceptance Criteria

### Styling & Aesthetics
- [ ] The app's primary background is pastel pink/salmon pink, text is bold black, and card/button borders are thick solid black.
- [ ] Headings are rendered using a bold, large display Google Font with tight line-height.
- [ ] Gradients and glassmorphism are completely removed.
- [ ] UI buttons and cards have sharp corners, flat drop shadows, and slight organic rotations.

### Code Integrity
- [ ] Existing page layouts, routing, database fields, and application logic remain fully unchanged.
- [ ] Next.js build compiles successfully.
- [ ] The verification script `scripts/verify_style.ts` executes and passes successfully.
