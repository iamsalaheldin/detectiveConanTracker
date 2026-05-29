---
name: Shinjitsu no Tracker
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#43474f'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#737780'
  outline-variant: '#c3c6d1'
  surface-tint: '#3a5f94'
  primary: '#001e40'
  on-primary: '#ffffff'
  primary-container: '#003366'
  on-primary-container: '#799dd6'
  inverse-primary: '#a7c8ff'
  secondary: '#bc0000'
  on-secondary: '#ffffff'
  secondary-container: '#e42214'
  on-secondary-container: '#fffbff'
  tertiary: '#705d00'
  on-tertiary: '#ffffff'
  tertiary-container: '#c9a900'
  on-tertiary-container: '#4c3e00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#a7c8ff'
  on-primary-fixed: '#001b3c'
  on-primary-fixed-variant: '#1f477b'
  secondary-fixed: '#ffdad4'
  secondary-fixed-dim: '#ffb4a8'
  on-secondary-fixed: '#410000'
  on-secondary-fixed-variant: '#930000'
  tertiary-fixed: '#ffe16d'
  tertiary-fixed-dim: '#e9c400'
  on-tertiary-fixed: '#221b00'
  on-tertiary-fixed-variant: '#544600'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  headline-xl:
    fontFamily: Bricolage Grotesque
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Bricolage Grotesque
    fontSize: 32px
    fontWeight: '800'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Bricolage Grotesque
    fontSize: 28px
    fontWeight: '800'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.2'
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
spacing:
  unit: 8px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 40px
  diagonal-offset: 12px
---

## Brand & Style
The design system is built on the narrative of a high-stakes investigation. It targets the dedicated fan base of the series, evoking feelings of suspense, intellectual challenge, and the kinetic energy of a Shonen action-mystery. 

The aesthetic is a hybrid of **Manga Brutalism** and **Tactile Case Files**. It utilizes raw, heavy borders, halftone dot patterns, and diagonal structural elements that mirror the dynamic layout of a manga page. UI elements should feel physical—like documents pulled from a Manila folder or evidence displayed on a tactical monitor. The emotional response is one of urgency and precision, using "Anime Flash" transitions (high-speed white-to-transparent wipes) to signify navigation and action.

## Colors
The palette is deeply rooted in the iconic visual identity of the series. 
- **Deep Detective Blue** serves as the primary structural color, used for headers, navigation, and primary branding elements.
- **Action Red** is reserved for critical interactions, "Solved" states, and the "Black Organization" themed sections.
- **Magnifying Glass & Caution Yellow** provide high-contrast accents for unread episodes, alerts, and highlighting key evidence.
- **Paper White & Ink Black** form the foundation of the content areas, ensuring high legibility reminiscent of printed manga.

Special "Black Organization" mode can be triggered for specific high-stakes episode arcs, swapping the neutral background for `organization_dark_hex` and increasing the presence of `secondary_color_hex`.

## Typography
The typography system balances the impact of a comic book with the technical feel of an investigation.
- **Headlines:** Use `Bricolage Grotesque` for its quirky, bold, and expressive character. In RTL Arabic contexts, substitute with a high-impact font like `Tajawal` (ExtraBold) to maintain the "heavy" manga aesthetic. Headlines should often be slightly italicized or placed on a 3-degree slant to increase visual tension.
- **Body:** `Be Vietnam Pro` provides a clean, contemporary sans-serif experience that remains legible even against textured backgrounds.
- **Labels/Technical Data:** `JetBrains Mono` is used for metadata (Episode numbers, air dates, case file IDs) to evoke a sense of digital forensic analysis.

## Layout & Spacing
The layout follows a **RTL (Right-to-Left)** orientation, optimized for Arabic and the traditional flow of manga reading. 

The system utilizes a **Dynamic Manga Grid**. Unlike standard boring grids, this system allows for:
1.  **Diagonal Dividers:** Section breaks should often be 3-5 degree diagonal lines rather than horizontal ones.
2.  **Overlapping Elements:** Character portraits or "Evidence" images should frequently break the container boundaries.
3.  **Comic Gutters:** Consistent 16px gutters between cards, styled to look like the space between manga panels.
4.  **RTL Flow:** Primary navigation begins on the right. Lists and progress bars fill from right to left.

## Elevation & Depth
This design system avoids soft, blurry shadows in favor of **Bold Borders** and **Tonal Layering**. 
- **Depth Levels:** Hierarchy is created by stacking "Paper" textures. Level 0 is the desk/background. Level 1 is the Manila Folder (Card). Level 2 is the "Sticky Note" or "Evidence Clip" (Labels/Chips).
- **Outlines:** Every interactive element must have a 2px or 3px solid `ink_black_hex` border. 
- **Halftone Shadows:** Instead of Gaussian blurs, use 45-degree dot-grid patterns (halftones) offset from the element to indicate shadow. This reinforces the printed manga aesthetic.
- **Glassmorphism:** Reserved only for "Digital Evidence" overlays (simulating Conan's glasses or a computer screen), using a blue-tinted backdrop blur.

## Shapes
The shape language is **Sharp and Aggressive**. 
- **Rectilinear:** Use 0px border-radius for almost all containers and buttons to maintain the brutalist manga panel look.
- **Beveled Corners:** Use clipped corners (45-degree cuts) on episode tags and "Status" indicators to mimic industrial or detective-kit styling.
- **Speech Bubbles:** For character quotes or "Hints," use classic manga speech bubble shapes with sharp tails.

## Components
- **Case File Cards:** Use a base color of light manila (`#E3DCC5`). Add a subtle paper grain texture. The top-right (or top-left for RTL) should feature a "tab" style header containing the episode number.
- **Manga Buttons:** Solid primary color with a heavy black bottom-right border. On hover, the background should flash white momentarily before settling into the secondary color.
- **Tracking Chips:** Small, rectangular labels with halftone background patterns. Use `Magnifying Glass Yellow` for "In Progress" and `Action Red` for "Essential/Canon" episodes.
- **Keyhole Inputs:** Input fields should be framed by thick borders, with a keyhole-shaped icon placeholder on the leading edge.
- **Investigation Progress Bar:** A thick, segmented bar. As it fills (RTL), segments change from `Ink Black` to `Action Red`, mimicking a mounting tension meter.
- **Icons:** Custom-drawn silhouettes of the "Small Detective" and the "Criminal" (Shadow Man) should be used for empty states and profile placeholders.