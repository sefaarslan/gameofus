---
name: Intimacy & Connection
colors:
  surface: '#fff8f6'
  surface-dim: '#fbd1c4'
  surface-bright: '#fff8f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1ed'
  surface-container: '#ffe9e3'
  surface-container-high: '#ffe2da'
  surface-container-highest: '#ffdbd0'
  on-surface: '#2c160e'
  on-surface-variant: '#584140'
  inverse-surface: '#442a22'
  inverse-on-surface: '#ffede8'
  outline: '#8c706f'
  outline-variant: '#e0bfbd'
  surface-tint: '#ae2f34'
  primary: '#ae2f34'
  on-primary: '#ffffff'
  primary-container: '#ff6b6b'
  on-primary-container: '#6d0010'
  inverse-primary: '#ffb3b0'
  secondary: '#635d59'
  on-secondary: '#ffffff'
  secondary-container: '#e7ded9'
  on-secondary-container: '#68615e'
  tertiary: '#705d00'
  on-tertiary: '#ffffff'
  tertiary-container: '#caa800'
  on-tertiary-container: '#4c3e00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad8'
  primary-fixed-dim: '#ffb3b0'
  on-primary-fixed: '#410006'
  on-primary-fixed-variant: '#8c1520'
  secondary-fixed: '#eae1dc'
  secondary-fixed-dim: '#cec5c0'
  on-secondary-fixed: '#1f1b18'
  on-secondary-fixed-variant: '#4b4642'
  tertiary-fixed: '#ffe173'
  tertiary-fixed-dim: '#e8c426'
  on-tertiary-fixed: '#221b00'
  on-tertiary-fixed-variant: '#554500'
  background: '#fff8f6'
  on-background: '#2c160e'
  surface-variant: '#ffdbd0'
typography:
  headline-xl:
    fontFamily: Quicksand
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Quicksand
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
  headline-md:
    fontFamily: Quicksand
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Quicksand
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 28px
  body-md:
    fontFamily: Quicksand
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Quicksand
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  container-padding-mobile: 24px
  container-padding-desktop: 48px
  gutter: 24px
  section-gap: 40px
---

## Brand & Style
This design system is crafted to evoke a sense of warmth, safety, and playfulness. The brand personality is centered on nurturing relationships through lighthearted but meaningful engagement. The emotional response should be one of comfort—like a soft blanket or a shared cup of tea—encouraging users to be vulnerable and expressive.

The design style is **Soft-Tactile Modernism**. It blends the cleanliness of modern SaaS with the approachability of lifestyle apps. By using generous white space, organic shapes, and subtle depth, the UI feels less like a utility and more like a gentle companion. It prioritizes clarity and friendliness, ensuring that even deep emotional prompts feel approachable and encouraging.

## Colors
The palette is built on high-warmth tones that mimic natural light and skin tones to foster a sense of intimacy.

- **Primary (Coral/Pink):** Used for key actions and focal points. It represents passion and energy.
- **Secondary (Peach/Cream):** The "embrace" color. Used for large surface areas and containers to keep the interface soft.
- **Accent (Gold/Amber):** Used sparingly for "achievements," "streaks," or special moments to provide a gentle glow.
- **Neutral (Warm Brown):** Replaces harsh blacks for text and icons to maintain the soft aesthetic.
- **Gradients:** Use subtle linear gradients from Primary to a slightly lighter tint for buttons and active states to add a tactile, "clickable" quality.

## Typography
We use **Quicksand** exclusively for its rounded terminals and friendly character. It strikes the perfect balance between legibility and personality.

Because Turkish text can be significantly longer than English, we utilize slightly more generous line-heights (1.5x for body text) to prevent crowded blocks. Headlines should remain tight but never cramped. For mobile interfaces, use `headline-lg-mobile` to ensure that long Turkish compound words do not break awkwardly or overflow containers.

## Layout & Spacing
The layout philosophy is **Floating Harmony**. Elements are given significant breathing room to prevent the user from feeling overwhelmed during gameplay.

- **Mobile:** A single-column layout centered on "Card" interactions. Cards should have a minimum horizontal margin of 24px.
- **Desktop:** A 3-column structure. The central column is the "Play Area" (fixed max-width of 720px), while the side panels (300px each) house progress stats, relationship history, and status indicators.
- **Rhythm:** All spacing should be multiples of 8px. Use larger gaps (40px+) between logical sections to maintain the airy, stress-free aesthetic.

## Elevation & Depth
Depth is created through **Soft Diffusion** rather than hard shadows. This design system avoids pitch-black shadows, instead using primary-tinted ambient shadows to maintain warmth.

- **Level 1 (Surface):** Secondary Peach color for the background.
- **Level 2 (Cards/Containers):** White (#FFFFFF) surfaces with a 16px blur shadow at 5% opacity, tinted with the Primary Coral color.
- **Level 3 (Interactive/Active):** Higher elevation (24px blur) for elements currently being interacted with.
- **Backdrop:** When modals appear, use a high-saturation background blur (10px) with a soft peach tint rather than a dark overlay.

## Shapes
The shape language is extremely organic and soft. There are no sharp corners in the design system.

- **Buttons & Inputs:** Use the full "Pill" shape (rounded-full) for all primary actions.
- **Cards:** Use a consistent 24px (1.5rem) radius.
- **Selection Indicators:** Use "squircle" shapes for icons and small badges to maintain the playful, non-industrial feel.

## Components

### Buttons
- **Primary:** Pill-shaped, Primary Coral background, White text. Bold weight.
- **Secondary:** Pill-shaped, Secondary Peach background, Primary Coral text.
- **Action Scale:** Buttons should be large (min height 56px) to feel tactile and "toy-like."

### Cards
Cards are the core of the experience. They must have a white background, 24px corner radius, and a subtle coral-tinted shadow. Use internal padding of at least 32px for game content to ensure the text feels "centered" and important.

### Input Fields
Inputs use the Secondary Peach color as a background with no border, becoming White with a thin Primary Coral border when focused. Label text sits above the field in a bold, smaller size.

### Relationship Progress (Special Component)
Use a horizontal track with rounded ends. The "fill" should be a gradient from Primary Coral to Accent Gold, suggesting growth and warmth.

### Chips & Tags
Small pill-shaped elements used for categories (e.g., "Deep Talk," "Fun," "Daily"). These should use the Accent Gold background with Neutral text to stand out without competing with Primary actions.