# ECB Design System

> Enterprise Context Brain — UI Design Guidelines

---

## 1. Color Palette

### Primary Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| **Indigo** | `#6366f1` | Primary accent, buttons, active states, borders, glows |
| **Violet** | `#8b5cf6` | Secondary accent, gradients, hover states |
| **Cyan** | `#22d3ee` | Tertiary accent, highlights, badges |
| **Emerald** | `#10b981` | Success states, positive indicators |
| **Amber** | `#f59e0b` | Warning states, delayed items |
| **Rose** | `#ef4444` | Error states, critical risks, contradictions |

### Neutral Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| **Text Primary** | `#1e293b` | `#f1f5f9` | Headings, bold text |
| **Text Secondary** | `#475569` | `#cbd5e1` | Body text |
| **Text Muted** | `#94a3b8` | `#94a3b8` | Labels, captions |
| **Text Faint** | `#cbd5e1` | `#64748b` | Placeholder text |

### Surface Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| **Background** | `#f8f9fc` | `#0f172a` | Page background |
| **Card** | `rgba(255,255,255,0.7)` | `rgba(255,255,255,0.05)` | Card backgrounds |
| **Input** | `#f1f3f8` | `rgba(255,255,255,0.06)` | Input fields |
| **Border Subtle** | `#e8ecf1` | `rgba(255,255,255,0.08)` | Borders, dividers |
| **Border Medium** | `#d1d9e6` | `rgba(255,255,255,0.12)` | Input borders |

---

## 2. Design Principles

### Glass Morphism
All panels, cards, and containers use frosted glass aesthetic:
- Semi-transparent backgrounds with `backdrop-filter: blur()`
- Subtle borders with low opacity
- Soft shadows with color-tinted glow

### Theme Adherence
- **Never use hardcoded dark colors** (`rgba(10,20,32,...)`, `rgba(15,23,42,...)`)
- **Never use hardcoded white** (`#ffffff`, `#f1f5f9`)
- **Always use CSS variables** that adapt to light/dark theme

### Selection States
Interactive list items must have clear selection feedback:
- Left accent bar (3.5px solid)
- Gradient background tint
- Ring glow shadow
- Smooth transition (0.2s cubic-bezier)

---

## 3. Component Patterns

### Glass Panel (`glass-panel`)
```css
background: rgba(255, 255, 255, 0.75);     /* Light */
background: rgba(255, 255, 255, 0.05);     /* Dark */
backdrop-filter: blur(20px) saturate(1.4);
border: 1px solid var(--border-subtle);
border-radius: 16px;
box-shadow: 0 4px 20px rgba(99, 102, 241, 0.05);
```

### Glass Card (`glass-card`)
```css
background: rgba(255, 255, 255, 0.7);      /* Light */
background: rgba(255, 255, 255, 0.05);     /* Dark */
backdrop-filter: blur(12px);
border: 1px solid var(--border-subtle);
border-radius: 14px;
box-shadow: 0 2px 12px rgba(99, 102, 241, 0.04);
```

### Glass Input (`glass-input`)
```css
background: var(--bg-input);
border: 1px solid var(--border-medium);
border-radius: 10px;
color: var(--text-primary);
```

### Glass Pill (`glass-pill`)
```css
background: var(--bg-input);
border: 1px solid var(--border-subtle);
border-radius: 9999px;
color: var(--text-muted);
```

### Glass Button (`glass-btn`)
```css
background: var(--bg-input);
border: 1px solid var(--border-medium);
border-radius: 10px;
color: var(--text-secondary);
```

### Glass Button Primary (`glass-btn-primary`)
```css
background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
border: 1px solid #6366f1;
border-radius: 10px;
color: #ffffff;
box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
```

---

## 4. Interactive Selection Pattern

For all selectable list items (ADR cards, risk items, contradiction cards, etc.):

### Default State
```css
background: var(--bg-card);
border: 1px solid var(--border-subtle);
border-left: 3.5px solid transparent;
```

### Selected State
```css
background: linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%);
border: 1.5px solid rgba(99, 102, 241, 0.5);
border-left: 3.5px solid #6366f1;
box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1), 0 4px 12px rgba(99, 102, 241, 0.12);
```

### Contradiction Items (Red variant)
```css
/* Selected */
background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%);
border: 1.5px solid rgba(239, 68, 68, 0.5);
border-left: 3.5px solid #ef4444;
box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08), 0 4px 12px rgba(239, 68, 68, 0.1);
```

### Transition
```css
transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
```

---

## 5. Gradients

### ECB Logo Gradient
```
from-[#6366f1] via-[#8b5cf6] to-[#22d3ee]
```

### Progress Bar (Normal)
```
linear-gradient(90deg, #6366f1, #8b5cf6)
```

### Progress Bar (Delayed)
```
linear-gradient(90deg, #fb923c, #f97316)
```

### AuroraText Animation Colors
```
["#6366f1", "#8b5cf6", "#22d3ee", "#10b981"]
```

---

## 6. Spacing & Typography

### Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `8px` | Pills, small elements |
| `--radius-md` | `12px` | Cards, panels |
| Default glass | `14px` | Glass cards |
| Default panel | `16px` | Glass panels |

### Font Sizes
| Token | Size | Usage |
|-------|------|-------|
| `--fs-xs` | `0.7rem` | Labels, captions |
| `--fs-sm` | `0.85rem` | Body text |
| `--fs-base` | `1rem` | Default |
| `--fs-lg` | `1.15rem` | Section headings |

### Shadows
| Type | Value |
|------|-------|
| Subtle | `0 2px 12px rgba(99, 102, 241, 0.04)` |
| Medium | `0 4px 20px rgba(99, 102, 241, 0.05)` |
| Selected ring | `0 0 0 3px rgba(99, 102, 241, 0.1)` |
| Selected lift | `0 4px 12px rgba(99, 102, 241, 0.12)` |

---

## 7. Heatmap Cell Styles

### Critical (Score 18-25)
```css
background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(153, 27, 27, 0.1));
border: 1px solid rgba(239, 68, 68, 0.3);
color: #ef4444;
```

### High (Score 12-17)
```css
background: linear-gradient(135deg, rgba(249, 115, 22, 0.12), rgba(180, 83, 9, 0.08));
border: 1px solid rgba(249, 115, 22, 0.25);
color: #f97316;
```

### Medium (Score 6-11)
```css
background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(146, 64, 14, 0.06));
border: 1px solid rgba(245, 158, 11, 0.2);
color: #f59e0b;
```

### Low (Score 1-5)
```css
background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.05));
border: 1px solid rgba(99, 102, 241, 0.15);
color: #6366f1;
```

### Selected (Any level)
```css
transform: scale(1.08);
box-shadow: 0 0 0 4px [level-color-alpha-0.15], 0 4px 16px [level-color-alpha-0.25];
```

---

## 8. Status Indicators

| Status | Color | Usage |
|--------|-------|-------|
| Active/Connected | `#6366f1` | Webhook active, connected |
| Completed | `#10b981` | Milestones, tasks done |
| In Progress | `#6366f1` | Active work items |
| Delayed | `#f59e0b` | Behind schedule |
| Blocked | `#ef4444` | Cannot proceed |
| Critical Risk | `#ef4444` | High severity |
| Resolved | `#10b981` | Fixed/closed |

---

## 9. File Reference

| File | Purpose |
|------|---------|
| `src/styles/globals.css` | Theme variables, glass components, light/dark modes |
| `src/styles/tokens.css` | Design tokens, risk cells, layout utilities |
| `src/index.css` | Root CSS variables |
| `src/components/ECBKineticBrand.tsx` | Logo with AuroraText gradient |
| `src/components/ContextScopeBar.tsx` | Project/source/agent selector bar |

---

## 10. Migration Checklist

When updating components for light/dark theme support:

- [ ] Replace `rgba(10,20,32,...)` → `var(--bg-card)`
- [ ] Replace `rgba(15,23,42,...)` → `var(--bg-card)`
- [ ] Replace `rgba(17,34,54,...)` → `var(--bg-card)` or `glass-card`
- [ ] Replace `#ffffff` → `var(--text-primary)`
- [ ] Replace `#f1f5f9` → `var(--text-primary)`
- [ ] Replace `rgba(255,255,255,0.0x)` borders → `var(--border-subtle)`
- [ ] Add `glass-card` class for card containers
- [ ] Add selection pattern for interactive lists
- [ ] Test both light and dark themes
