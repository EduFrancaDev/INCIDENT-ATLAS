# Design System Rules - Radar de Acidentes Industriais

This document defines the design system structure and rules for integrating Figma designs into the Radar Acidentes project.

## Project Overview

**Framework**: Flask (Python web framework)  
**Template Engine**: Jinja2  
**Languages**: Python, HTML, CSS, JavaScript  
**Database**: DuckDB

---

## 1. Design Tokens

### Color Palette

Currently defined inline in `template/index.html`. Colors should be extracted to CSS variables in `static/img/css/style.css`:

```css
:root {
  /* Primary Colors - Gradient */
  --primary-start: #667eea;
  --primary-end: #764ba2;

  /* Neutral Colors */
  --color-white: #ffffff;
  --color-black: #000000;
  --color-text-primary: #333333;
  --color-text-secondary: #666666;
  --color-text-muted: #999999;

  /* Background Colors */
  --bg-light-gray: #fafafa;
  --bg-hover: #f5f5f5;

  /* Border Colors */
  --border-light: #e0e0e0;

  /* Accident Level Colors */
  --level-I-bg: #fff3cd;
  --level-I-text: #856404;
  --level-II-bg: #ffeaa7;
  --level-II-text: #d63031;
  --level-III-bg: #fdcb6e;
  --level-III-text: #d63031;
  --level-IV-bg: #ff7675;
  --level-IV-text: #ffffff;
  --level-V-bg: #d63031;
  --level-V-text: #ffffff;
}
```

### Typography

```css
:root {
  /* Font Families */
  --font-primary: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;

  /* Font Sizes */
  --font-size-xs: 0.85em;
  --font-size-sm: 1em;
  --font-size-md: 1.1em;
  --font-size-lg: 1.2em;
  --font-size-xl: 2.5em;

  /* Font Weights */
  --font-weight-normal: 400;
  --font-weight-semibold: 600;

  /* Letter Spacing */
  --letter-spacing-sm: 0.5px;
}
```

### Spacing

```css
:root {
  /* Padding */
  --spacing-xs: 5px;
  --spacing-sm: 10px;
  --spacing-md: 15px;
  --spacing-lg: 20px;
  --spacing-xl: 30px;
  --spacing-2xl: 40px;

  /* Container */
  --container-max-width: 1400px;
  --container-padding: 30px;

  /* Table Cell Padding */
  --table-cell-padding-v: 12px;
  --table-cell-padding-h: 15px;
  --table-header-padding: 15px;
}
```

### Border Radius

```css
:root {
  --radius-sm: 10px;
  --radius-md: 20px;
}
```

### Shadows

```css
:root {
  --shadow-container: 0 10px 30px rgba(0, 0, 0, 0.3);
}
```

---

## 2. Component Library

### Current Components

Components are defined inline within `template/index.html`. Should be extracted to reusable Jinja2 templates.

#### Recommended Structure:

```
template/
  ├── index.html
  ├── base.html
  └── components/
      ├── badge.html
      ├── table.html
      ├── stats.html
      └── container.html
```

#### Badge Component (`template/components/badge.html`)

```html
{# Usage: {% include 'components/badge.html' with level='I' %} #}
<span class="badge level-{{ level }}">{{ level }}</span>
```

#### Stats Component (`template/components/stats.html`)

```html
<div class="stats">
  Total de Acidentes Registrados: <strong>{{ count }}</strong>
</div>
```

#### Table Component

The table should be componentized for reusability across different views.

---

## 3. Frameworks & Libraries

### Backend

- **Flask**: Web framework
- **DuckDB**: Database
- **Pandas**: Data processing (imported but not currently used in templates)

### Frontend

- **No JavaScript framework**: Vanilla JS
- **No CSS framework**: Custom CSS
- **No build system**: Direct file serving through Flask

### Template Engine

- **Jinja2**: Built-in with Flask

---

## 4. Asset Management

### Current Structure

```
static/
  └── img/
      ├── css/
      │   └── style.css  (currently empty)
      └── js/
          └── main.js    (currently empty)
```

### Recommended Structure

```
static/
  ├── css/
  │   ├── variables.css      (design tokens)
  │   ├── global.css         (global styles)
  │   ├── components.css     (component styles)
  │   └── utilities.css      (utility classes)
  ├── js/
  │   ├── main.js
  │   └── utils.js
  ├── img/
  │   ├── icons/
  │   ├── logos/
  │   └── illustrations/
  └── fonts/
      └── (custom fonts if needed)
```

### Asset Referencing in Flask/Jinja2

```html
<!-- CSS -->
<link
  rel="stylesheet"
  href="{{ url_for('static', filename='css/style.css') }}"
/>

<!-- JavaScript -->
<script src="{{ url_for('static', filename='js/main.js') }}"></script>

<!-- Images -->
<img src="{{ url_for('static', filename='img/logo.png') }}" alt="Logo" />
```

---

## 5. Icon System

### Current State

- No icon system currently implemented
- Using emoji (🚨, ⚠️) for visual elements

### Recommended Approach

Choose one of:

1. **Font Awesome** (CDN):

```html
<link
  rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
/>
```

2. **Material Icons** (CDN):

```html
<link
  href="https://fonts.googleapis.com/icon?family=Material+Icons"
  rel="stylesheet"
/>
```

3. **SVG Icons** (self-hosted):

```
static/
  └── img/
      └── icons/
          ├── alert.svg
          ├── warning.svg
          └── info.svg
```

### Icon Usage Pattern

```html
<!-- Font Awesome -->
<i class="fas fa-exclamation-triangle"></i>

<!-- Material Icons -->
<span class="material-icons">warning</span>

<!-- SVG -->
<img
  src="{{ url_for('static', filename='img/icons/alert.svg') }}"
  alt="Alert"
  class="icon"
/>
```

---

## 6. Styling Approach

### Methodology

- **Custom CSS**: No CSS framework currently
- **Inline styles**: Currently in `<style>` tag in HTML (should be moved to external CSS)
- **BEM-like naming**: Recommended for class names

### Recommended CSS Organization

#### File: `static/css/variables.css`

Contains all design tokens (colors, typography, spacing)

#### File: `static/css/global.css`

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-primary);
  background: linear-gradient(
    135deg,
    var(--primary-start) 0%,
    var(--primary-end) 100%
  );
  min-height: 100vh;
  padding: var(--spacing-lg);
}
```

#### File: `static/css/components.css`

Component-specific styles:

```css
/* Container Component */
.container {
  max-width: var(--container-max-width);
  margin: 0 auto;
  background: var(--color-white);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-container);
  padding: var(--container-padding);
}

/* Badge Component */
.badge {
  display: inline-block;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

/* Badge Variants */
.badge.level-I {
  background-color: var(--level-I-bg);
  color: var(--level-I-text);
}
/* ... other levels ... */
```

#### File: `static/css/utilities.css`

Utility classes for common patterns:

```css
/* Text Utilities */
.text-center {
  text-align: center;
}
.text-left {
  text-align: left;
}
.text-right {
  text-align: right;
}

/* Spacing Utilities */
.mt-sm {
  margin-top: var(--spacing-sm);
}
.mb-md {
  margin-bottom: var(--spacing-md);
}
.p-lg {
  padding: var(--spacing-lg);
}

/* Display Utilities */
.d-block {
  display: block;
}
.d-inline-block {
  display: inline-block;
}
.d-none {
  display: none;
}
```

### Responsive Design Pattern

```css
/* Mobile First Approach */
.container {
  padding: var(--spacing-lg);
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    padding: var(--spacing-xl);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    padding: var(--container-padding);
  }
}
```

---

## 7. Project Structure

### Current Structure

```
Radar-Acidentes/
├── requirements.txt          # Python dependencies
├── run.py                    # Flask application entry point
├── data/                     # CSV data files
│   └── IHMStefanini_industrial_safety_and_health_database_with_accidents_description.csv
├── models/                   # (Empty - for future data models)
├── scripts/                  # Utility scripts
│   └── subir_csv_para_db.py # Database population script
├── static/                   # Static assets
│   └── img/
│       ├── css/
│       │   └── style.css     # (Currently empty)
│       └── js/
│           └── main.js       # (Currently empty)
└── template/                 # Jinja2 templates
    └── index.html           # Main page template
```

### Recommended Structure

```
Radar-Acidentes/
├── requirements.txt
├── run.py
├── config.py                 # Configuration file
├── data/                     # Data files
├── models/                   # Database models
│   └── acidente.py
├── routes/                   # Route blueprints
│   ├── __init__.py
│   └── main.py
├── scripts/                  # Utility scripts
├── static/
│   ├── css/
│   │   ├── variables.css
│   │   ├── global.css
│   │   ├── components.css
│   │   └── utilities.css
│   ├── js/
│   │   ├── main.js
│   │   └── table-filters.js
│   └── img/
│       ├── icons/
│       ├── logos/
│       └── illustrations/
├── template/
│   ├── base.html            # Base template
│   ├── index.html
│   ├── components/          # Reusable components
│   │   ├── badge.html
│   │   ├── table.html
│   │   └── stats.html
│   └── layouts/             # Layout templates
│       └── dashboard.html
└── tests/                   # Test files
    └── test_routes.py
```

---

## 8. Integration with Figma Designs

### Workflow for Implementing Figma Designs

1. **Extract Design Tokens from Figma**

   - Use Figma's Inspect panel to get exact colors, typography, spacing
   - Update `static/css/variables.css` with new tokens

2. **Component Mapping**

   - Identify Figma components
   - Create corresponding Jinja2 templates in `template/components/`
   - Style components in `static/css/components.css`

3. **Export Assets**

   - Export icons as SVG to `static/img/icons/`
   - Export images as PNG/JPG to `static/img/`
   - Optimize assets before adding to project

4. **Implement Responsive Designs**

   - Define breakpoints in CSS
   - Use Figma's responsive frames to guide implementation
   - Test on multiple devices

5. **Maintain Consistency**
   - Always use design tokens (CSS variables) instead of hardcoded values
   - Follow established naming conventions
   - Document any deviations from Figma designs

### Example: Converting Figma Card to HTML/CSS

**Figma Design**: Card with shadow, rounded corners, padding

**Implementation**:

```html
<!-- template/components/card.html -->
<div class="card">
  <div class="card__header">{{ title }}</div>
  <div class="card__body">{{ content }}</div>
</div>
```

```css
/* static/css/components.css */
.card {
  background: var(--color-white);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-container);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-lg);
}

.card__header {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.card__body {
  color: var(--color-text-secondary);
  line-height: 1.6;
}
```

---

## 9. Best Practices

### CSS

- Use CSS variables for all design tokens
- Follow BEM naming convention for components
- Keep specificity low
- Use mobile-first responsive design
- Group related styles together

### HTML/Jinja2

- Use semantic HTML elements
- Create reusable component templates
- Keep templates DRY (Don't Repeat Yourself)
- Use descriptive variable names in Jinja2

### JavaScript

- Use vanilla JavaScript for simple interactions
- Keep JavaScript separate from HTML
- Use event delegation for dynamic elements
- Comment complex logic

### Flask

- Organize routes using Blueprints for larger apps
- Use template inheritance
- Pass only necessary data to templates
- Handle errors gracefully

---

## 10. Color System Reference

### Accident Level Color Mapping

| Level | Background | Text    | Usage             |
| ----- | ---------- | ------- | ----------------- |
| I     | #fff3cd    | #856404 | Low severity      |
| II    | #ffeaa7    | #d63031 | Minor incidents   |
| III   | #fdcb6e    | #d63031 | Moderate severity |
| IV    | #ff7675    | #ffffff | High severity     |
| V     | #d63031    | #ffffff | Critical/Fatal    |

### Gradient Background

- Start: `#667eea` (Purple-Blue)
- End: `#764ba2` (Purple)
- Direction: 135deg diagonal

---

## Next Steps

1. **Move inline styles** from `template/index.html` to `static/css/` files
2. **Extract CSS variables** to `static/css/variables.css`
3. **Create component templates** in `template/components/`
4. **Implement JavaScript functionality** in `static/js/main.js`
5. **Add responsive breakpoints** for mobile/tablet views
6. **Set up icon system** (Font Awesome or Material Icons)
7. **Create base template** (`template/base.html`) for template inheritance
8. **Add filtering/sorting** functionality for the accidents table
9. **Implement search** functionality
10. **Add data visualization** (charts for accident statistics)

---

## Figma MCP Integration Notes

When using the Figma Model Context Protocol tools:

- **`mcp_figma_get_design_context`**: Extract design specifications from Figma
- **`mcp_figma_get_variable_defs`**: Get Figma variables to map to CSS variables
- **`mcp_figma_get_screenshot`**: Generate reference images from Figma designs
- **`mcp_figma_get_code_connect_map`**: Map Figma components to code components

Always maintain the mapping between Figma components and Flask/Jinja2 templates for consistency.
