# [FEATURE] - Visual editor — Drag & Drop, premium dark theme, and branding

## Description
Follow-up to the phase 2c MVP editor (jqapi-web, PR #56), focusing on visual identity, layout polish, and natural drag-and-drop interactions for circuit construction.

This issue aims to transition `jqapi-web` from a basic MVP layout into a highly polished, interactive, and visually stunning quantum simulator.

---

## 1. Drag & Drop Builder
Replace the click-to-place brush tool with an intuitive, drag-based layout.
*   **Palette-to-Canvas Dragting**:
    *   Gates in the palette are draggable (`draggable="true"`).
    *   As a gate is dragged over the Konva canvas, cells under the pointer light up with a subtle hover highlight showing valid drop coordinates.
*   **Canvas-to-Canvas Dragting**:
    *   Already-placed gates on the grid can be picked up, dragged, and moved to another cell.
    *   Snapping feedback: dynamically align the gate to the nearest grid cell coordinate on drag-end.
*   **Drag-to-Erase**:
    *   Dragging a gate out of the grid area and dropping it deletes the gate, providing a satisfying trash zone interaction.

---

## 2. Brand Identity (Logo & Typography)
Introduce a visual identity for `jqapi`.
*   **Header Logo**:
    *   Integrate the custom high-tech glowing Bloch sphere logo (SVG or optimized asset) in the main layout header next to the title.
*   **Modern Typography**:
    *   Replace system default fonts with high-quality web fonts:
        *   **Headers**: *Outfit* (clean, geometric sans-serif for quantum tech vibes).
        *   **Body & Controls**: *Inter* (highly readable UI font).
        *   **Values & Math**: *JetBrains Mono* / *Fira Code* (monospace).

---

## 3. Cyber-Dark Premium Theme
Upgrade the styling to feel premium, utilizing vibrant HSL colors and glassmorphism.
*   **High-Contrast Color-Coded Gates**:
    *   `H` (Hadamard): Glowing Cyan (`hsl(180, 100%, 50%)`)
    *   `X` (Not): Glowing Magenta (`hsl(320, 100%, 50%)`)
    *   `Z` (Phase): Glowing Mint Green (`hsl(150, 100%, 45%)`)
    *   `CNOT`: Glowing Electric Purple (`hsl(270, 100%, 60%)`)
*   **Glowing Pipelines (Wires)**:
    *   Make circuit wire lines look like superconducting pipelines (gradient stroke with a light pulsing effect when running simulations).
*   **Glassmorphism Overlays**:
    *   Floating control panels, grid borders, and toolbar sections housed in frosted-glass containers with subtle drop shadows (`backdrop-filter: blur(12px)`).
*   **Interactive Micro-interactions**:
    *   Pulsing "Run" button with an active neon gradient.
    *   Scale transitions on gate palette items upon hovering.

---

## 4. Interactive Results Panel
Upgrade the static percentage bars to a rich probability and state visualization.
*   **State Amplitude Phase & Math**:
    *   Render exact amplitude percentages with inline complex representations ($re + i \cdot im$).
*   **Interactive Amplitude Tooltips**:
    *   Hovering over any state's probability bar triggers a tooltip revealing:
        *   Amplitude magnitude ($|c_i|$)
        *   Phase angle in radians/degrees ($\theta$)
        *   Visual Bloch vector representation indicator
*   **Transition Animations**:
    *   When clicking "Run", probability bars animate smoothly from their previous state widths to new ones.

---

## 5. Notes & Tech Implementation
*   **Library**: Use standard `react-konva` features for drag-and-drop on the canvas (`draggable={true}`, `onDragEnd`, mapping coordinate via `stage.getPointerPosition()`).
*   **Styling**: Use vanilla CSS in `App.css` and `index.css` leveraging CSS variables for theme management.
