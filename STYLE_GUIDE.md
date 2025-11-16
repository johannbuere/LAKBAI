# LAKBAI Frontend Style Guide

## Overview

This style guide defines the design system for the LAKBAI Tourism Recommendation application. All frontend developers must follow these guidelines to ensure consistency across the application.

---

## 🎨 Color Palette

### Primary Colors

| Color Name | CSS Variable | Hex/Value | Usage |
|------------|-------------|-----------|-------|
| **Primary Blue** | `--color-blue-primary` | `#008cff` | Primary actions, links, active states |
| **Blue Dark** | `--color-blue-dark` | `#0c58b4` | Hover states for primary blue |
| **Primary MyBiz** | `--color-primary-mybiz` | `#ff664b` | Alternative primary color |

### Grayscale

| Color Name | CSS Variable | Hex | Usage |
|------------|-------------|-----|-------|
| **Gray Light** | `--color-gray-light` | `#9b9b9b` | Secondary text, icons |
| **Gray Medium** | `--color-gray-medium` | `#757575` | Body text, borders |
| **Gray Dark** | `--color-gray-dark` | `#4a4a4a` | Headings, primary text |
| **Gray Lighter** | `--color-gray-lighter` | `#d0d0d0` | Disabled states |
| **Gray Lightest** | `--color-gray-lightest` | `#bcbcbc` | Borders, dividers |
| **Gray Border** | `--color-gray-border` | `#e7e7e7` | Default borders |
| **Gray Background** | `--color-gray-background` | `#f6f6f6` | Card backgrounds |
| **Gray Input Border** | `--color-gray-input-border` | `#d8d8d8` | Input borders |

### Semantic Colors

| Color Name | CSS Variable | Hex | Usage |
|------------|-------------|-----|-------|
| **Success Green** | `--color-green` | `#02a19c` | Success states, confirmations |
| **Success Green Dark** | `--color-green-dark` | `#007e7d` | Hover for success |
| **Error Red** | `--color-red` | `#eb2026` | Errors, warnings |
| **Red Accent** | `--color-red-accent` | `#ff3e5e` | Error highlights |
| **Orange** | `--color-orange` | `#ff6d3f` | Warnings, highlights |
| **Yellow Dark** | `--color-yellow-dark` | `#cf8100` | Warning text |
| **Yellow Light** | `--color-yellow-light` | `#ffeba7` | Warning backgrounds |

### Blue Variations

| Color Name | CSS Variable | Hex | Usage |
|------------|-------------|-----|-------|
| **Blue Light** | `--color-blue-light` | `#ddf3ff` | Info backgrounds |
| **Blue Background** | `--color-blue-background` | `#eaf5ff` | Selected states |
| **Blue Input** | `--color-blue-input` | `#f1f8fe` | Input focus backgrounds |
| **Blue Input Border** | `--color-blue-input-border` | `#d1e2f2` | Input focus borders |

### Base Colors

| Color Name | CSS Variable | Value | Usage |
|------------|-------------|-------|-------|
| **White** | `--color-white` | `#fff` | Text on dark backgrounds |
| **Black** | `--color-black` | `#000` | Maximum contrast text |
| **Background Light** | `--color-background-light` | `#f2f2f2` | Page backgrounds |

---

## 🌈 Gradients

### Primary Gradients

```css
/* Orange-Red Gradient */
--color-gradient-orange: linear-gradient(247deg, #ff3e5e, #ff6d3f);

/* Blue Gradient */
--color-gradient-blue: linear-gradient(93deg, #53b2fe, #065af3);

/* MyBiz Primary Gradient */
--color-gradient-primary-mybiz: linear-gradient(256deg, #ff684a, #ff4959);

/* MyBiz Background Gradient */
--color-mybiz-primary-bg: linear-gradient(180deg, #371f30, #371f30);
```

**Usage Examples:**
- Use `--color-gradient-blue` for primary buttons
- Use `--color-gradient-orange` for accent buttons or highlights
- Use `--color-gradient-primary-mybiz` for special promotional elements

---

## 📝 Typography

### Font Family

```css
font-family: Lato, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
             Oxygen, Ubuntu, Cantarell, sans-serif;
```

**Primary Font:** Lato (must be loaded)
**Fallback:** System fonts for cross-platform compatibility

### Font Sizes

| Size | Value | Usage |
|------|-------|-------|
| Base | `14px` | Default body text |
| Root | `16px` | HTML root size |

**Scaling:**
Use the `--font-scale` variable (default: 1) for responsive scaling.

### Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| Regular | `400` | Body text, paragraphs |
| Medium | `500` | Subheadings, emphasized text |
| Bold | `600-700` | Headings, buttons |

### Line Height

```css
line-height: 1.5;
```

Use `1.5` for optimal readability in body text.

### Font Smoothing

Always apply:
```css
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

---

## 🎯 Text Colors (Semantic)

| Purpose | CSS Variable | Value | Usage |
|---------|-------------|-------|-------|
| **Default Text** | `--text-dark` | `var(--color-gray-dark)` | Primary text color |
| **Secondary Text** | `--text-gray` | `var(--color-gray-medium)` | Less important text |
| **White Text** | `--text-white` | `var(--color-white)` | Text on dark backgrounds |
| **Black Text** | `--text-black` | `var(--color-black)` | Maximum contrast |
| **Link Text** | `--text-blue` | `var(--color-blue-primary)` | Links, interactive text |
| **Error Text** | `--text-error` | `var(--color-red)` | Error messages |

---

## 🔘 Buttons

### Primary Button

```css
background: var(--btn-primary-bg); /* Blue gradient */
color: var(--btn-primary-text); /* White */
border-radius: var(--btn-border-radius); /* 4px */
```

**Example:**
```css
.btn-primary {
  background: linear-gradient(93deg, #53b2fe, #065af3);
  color: #fff;
  border-radius: 4px;
  padding: 12px 24px;
  border: none;
  cursor: pointer;
  font-weight: 600;
}
```

### Secondary Button

```css
background: transparent;
color: var(--color-btn);
border: 2px solid var(--color-btn);
border-radius: 4px;
```

### MyBiz Button (Special)

```css
background: var(--color-btn-mybiz-primary-bg);
/* linear-gradient(256deg, #ff684a, #ff4959) */
color: #fff;
border-radius: 4px;
```

### Button States

- **Hover:** Slightly darken background or increase shadow
- **Active:** Slightly scale down (0.98)
- **Disabled:** Use `--color-gray-lighter` background, reduce opacity to 0.6
- **Focus:** Add outline using `--color-blue-primary`

---

## 📦 Layout & Spacing

### Background

```css
background: var(--background); /* #f2f2f2 */
```

**Page Background:** Always use `#f2f2f2` for main page background.

### Border Radius

| Purpose | Variable | Value |
|---------|----------|-------|
| **Default** | `--border-radius` | `8px` |
| **Buttons** | `--btn-border-radius` | `4px` |
| **Small Elements** | Custom | `4px` |
| **Large Panels** | Custom | `12px` |

### Shadows

```css
--shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
```

**Usage:**
- **Light Shadow:** `0 2px 4px rgba(0, 0, 0, 0.1)` - Cards, buttons
- **Medium Shadow:** `0 4px 8px rgba(0, 0, 0, 0.15)` - Modals, dropdowns
- **Heavy Shadow:** `0 8px 16px rgba(0, 0, 0, 0.2)` - Floating elements

---

## 🖼️ Borders

### Border Colors

| Purpose | Variable | Value | Usage |
|---------|----------|-------|-------|
| **Light Border** | `--border-light` | `#e7e7e7` | Dividers, card borders |
| **Input Border** | `--border-input` | `#d8d8d8` | Form inputs (default) |

### Border Width

```css
--borderWidth: 2px;
```

**Standard:** Use `1px` for subtle borders, `2px` for emphasis.

---

## 🖱️ Scrollbars (Custom)

### Scrollbar Styling

```css
/* Width & Height */
::-webkit-scrollbar {
  width: 30px;
  height: 30px;
}

/* Track */
::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 15px;
}

/* Thumb */
::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 15px;
  border: 4px solid rgba(0, 0, 0, 0);
  background-clip: content-box;
  min-height: 150px;
}

/* Corner */
::-webkit-scrollbar-corner {
  background: rgba(0, 0, 0, 0);
}

/* Firefox */
scrollbar-width: auto;
scrollbar-color: rgba(0, 0, 0, 0.4) rgba(0, 0, 0, 0.1);
```

**Dark scrollbars** with rounded corners for a modern look.

---

## 🎨 Icon Colors (Semantic)

| Purpose | Variable | Value | Usage |
|---------|----------|-------|-------|
| **Light Icons** | `--icon-gray-light` | `#9b9b9b` | Inactive, disabled |
| **Medium Icons** | `--icon-gray-medium` | `#757575` | Default icons |
| **Dark Icons** | `--icon-gray-dark` | `#4a4a4a` | Active icons |
| **Primary Icons** | `--icon-blue` | `#008cff` | Interactive icons |

---

## 📐 Box Model

### Global Reset

```css
*, :before, :after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  -webkit-font-smoothing: antialiased;
}
```

**Always applied:** All elements use `border-box` sizing.

### Overflow

```css
html, body {
  overflow-x: hidden; /* Prevent horizontal scroll */
  overflow-y: auto;   /* Allow vertical scroll */
}
```

---

## 🎭 States & Interactions

### Hover

- **Background:** Darken by 5-10%
- **Transform:** `translateY(-2px)` for lift effect
- **Shadow:** Increase shadow depth

### Active

- **Transform:** `scale(0.98)` for pressed effect
- **Shadow:** Reduce shadow

### Focus

- **Outline:** `2px solid var(--color-blue-primary)`
- **Outline Offset:** `2px`

### Disabled

- **Opacity:** `0.6`
- **Cursor:** `not-allowed`
- **Background:** `var(--color-gray-lighter)`

---

## 📱 Responsive Design

### Breakpoints

| Device | Width | Usage |
|--------|-------|-------|
| Mobile | `< 768px` | Single column layouts |
| Tablet | `768px - 1024px` | 2 column layouts |
| Desktop | `> 1024px` | 3+ column layouts |

### Mobile-First Approach

```css
/* Base styles for mobile */
.container {
  padding: 16px;
}

/* Tablet and up */
@media (min-width: 768px) {
  .container {
    padding: 24px;
  }
}

/* Desktop */
@media (min-width: 1200px) {
  .container {
    padding: 32px;
  }
}
```

---

## ✅ Best Practices

### 1. Always Use CSS Variables

**Do:**
```css
.button {
  background: var(--color-blue-primary);
  color: var(--text-white);
}
```

**Don't:**
```css
.button {
  background: #008cff;
  color: #fff;
}
```

### 2. Consistent Naming

- Use kebab-case for class names: `.card-header`, `.btn-primary`
- Use semantic names: `.error-message` not `.red-text`

### 3. Component Structure

```css
/* Component base */
.card { }

/* Component variations */
.card--highlighted { }

/* Component elements */
.card__header { }
.card__body { }
.card__footer { }

/* Component modifiers */
.card__header--large { }
```

### 4. Spacing Scale

Use a consistent spacing scale:
- **4px** - Micro spacing
- **8px** - Small spacing
- **16px** - Medium spacing
- **24px** - Large spacing
- **32px** - Extra large spacing
- **48px** - Section spacing

### 5. Accessibility

- **Contrast Ratio:** Minimum 4.5:1 for normal text
- **Focus States:** Always visible
- **Touch Targets:** Minimum 44x44px
- **Keyboard Navigation:** Support Tab, Enter, Escape

### 6. Performance

- **Font Loading:** Use `font-display: swap` for Lato
- **Animations:** Use `transform` and `opacity` only
- **Will-Change:** Use sparingly, only for animated properties

---

## 🚫 Anti-Patterns

### Don't Use

1. **Inline Styles** - Use classes instead
2. **!important** - Indicates specificity issues
3. **Fixed Widths** - Use responsive units (%, vw, rem)
4. **Absolute Positioning** - Use flexbox/grid when possible
5. **Deep Nesting** - Max 3 levels deep

---

## 📚 Example Components

### Card Component

```css
.card {
  background: var(--color-white);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  padding: 24px;
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}
```

### Input Component

```css
.input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--border-input);
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.3s ease;
}

.input:focus {
  outline: none;
  border-color: var(--color-blue-input-border);
  background: var(--color-blue-input);
}

.input::placeholder {
  color: var(--color-gray-light);
}
```

### Button Component

```css
.btn {
  padding: 12px 24px;
  border-radius: var(--btn-border-radius);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.3s ease;
}

.btn-primary {
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(5, 90, 243, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

---

## 🎨 Color Usage Guidelines

### When to Use Each Color

**Primary Blue (`#008cff`):**
- Primary CTAs
- Links
- Active navigation items
- Progress indicators

**Success Green (`#02a19c`):**
- Success messages
- Confirmation buttons
- Positive indicators
- Completed states

**Error Red (`#eb2026`):**
- Error messages
- Delete/destructive actions
- Validation errors
- Critical warnings

**Orange (`#ff6d3f`):**
- Warning messages
- Important notices
- Highlights

**Gray Scale:**
- Text hierarchy (dark → light)
- Borders and dividers
- Backgrounds
- Disabled states

---

## 📋 Checklist for Developers

Before submitting code, ensure:

- [ ] All colors use CSS variables
- [ ] Font family includes Lato with fallbacks
- [ ] Border radius uses `--border-radius` variable
- [ ] Buttons follow the button style guide
- [ ] Hover/focus states are defined
- [ ] Mobile responsiveness is implemented
- [ ] Accessibility contrast ratios met
- [ ] No inline styles used
- [ ] No `!important` declarations
- [ ] Component follows BEM naming convention

---

## 🔄 Updates and Maintenance

This style guide is a living document. When adding new styles:

1. Add new CSS variables to `:root`
2. Update this guide with examples
3. Review with design team
4. Test across browsers
5. Communicate changes to all developers

---

**Last Updated:** November 2024
**Version:** 1.0.0
**Maintained By:** LAKBAI Development Team
