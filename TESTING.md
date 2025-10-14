# SalesQueen Testing Guide

This document provides a comprehensive, methodical checklist and reporting template for validating functionality, responsiveness, cross‑browser compatibility, and accessibility of the SalesQueen web application.

## How to Test
- Use real devices where possible (mobile, tablet, desktop) and latest Chrome/Firefox/Safari/Edge.
- Test at target widths: 375px (mobile), 768px (tablet), 1366px (laptop), 1920px (desktop).
- Capture screenshots or detailed notes for issues.
- Record results using the Reporting Template per item.

---

## 1) Functionality Testing
Checklist:
- Header
  - [ ] Sticky behavior at scroll, nav collapse on small screens
  - [ ] Active tab highlight and smooth scrolling
  - [ ] Progress stages update (Lead → Quote → Design), percentage reflects state
  - [ ] Save (localStorage), Export JSON, Share (Web Share or clipboard)
- Find Business
  - [ ] Geolocation prompt and center map
  - [ ] Search with debounce; autocomplete when key enabled
  - [ ] Nearby results render; markers show info windows
  - [ ] Industry filter impacts results
  - [ ] “This is My Business” captures lead data; referral CTA works
  - [ ] Manual form validation (name 2–100, phone 10–15 digits, email structure)
  - [ ] Form autosaves; reload restores data
- Get Quote (Estimator)
  - [ ] Stepper navigation (Next/Back), type selection required
  - [ ] Real‑time totals update with features and timeline
  - [ ] GST 18% applied; budget warnings show/hide
  - [ ] Count‑up animation on totals
  - [ ] Print/PDF (browser), Export JSON, Email (mailto)
- Design Preview
  - [ ] Drag components from library to canvas
  - [ ] Select block to style; changes apply live (bg, color, padding, font)
  - [ ] Reorder blocks via drag; persistence across reload
  - [ ] Device preview switches (desktop/tablet/mobile)
  - [ ] Export HTML produces valid file

Edge cases:
- Empty search; invalid address; blocked geolocation
- Rapid toggling of features; large budgets; extreme font sizes in style panel
- Drag/drop outside canvas; delete/backspace content inside blocks

---

## 2) Responsive Design Verification
Test at exact widths; verify layout and interactions:
- 1920px (Desktop)
  - [ ] Three‑column builder layout visible
  - [ ] Map height 500px
  - [ ] Results grid 3 cards per row
  - [ ] Sidebars ~300px
- 1366px (Laptop)
  - [ ] Structure consistent; reduced spacing
  - [ ] Results grid 3 cards per row
  - [ ] Sidebars ~280px
- 768–1024px (Tablet)
  - [ ] Library collapses (accordion usable)
  - [ ] Results grid 2 cards per row
  - [ ] Map 100% width, ~400px height
  - [ ] Settings panel behaves as narrow column (or validate planned offcanvas behavior if enabled)
- 375–767px (Mobile)
  - [ ] Single‑column layout; hamburger nav visible
  - [ ] Results grid 1 card per row; no horizontal scroll
  - [ ] Map 100% width, ~300px height
  - [ ] Bottom navigation tabs and FAB visible; FAB action usable

Interaction checks:
- [ ] Touch scrolling and taps responsive, no accidental drag
- [ ] Keyboard and mouse interactions equivalent

---

## 3) Cross‑Browser Compatibility
For Chrome, Firefox, Safari, Edge (latest):
- [ ] Styles render consistently (fonts, spacing, shadows)
- [ ] JS features: drag & drop, localStorage, Web Share fallback, clipboard
- [ ] Google Maps (with key): geolocation, places, markers, info windows
- [ ] Chart.js renders chart
- [ ] Print dialog shows correct summary layout

Note anomalies:
- [ ] Browser‑specific warnings or console errors
- [ ] Differences in form validation messages

---

## 4) Accessibility Compliance (WCAG AA)
Keyboard
- [ ] Full navigation via Tab/Shift+Tab; Enter/Space activates controls
- [ ] Focus states visible and not clipped

ARIA & Semantics
- [ ] ARIA labels on progress/stepper; charts have role/img + label
- [ ] Info windows and toasts announce without trapping focus

Contrast and Alternatives
- [ ] Color contrast passes AA for text/buttons
- [ ] Alternative text for icons or ARIA‑labelled controls

Assistive Tech
- [ ] Screen reader announces nav, tabs, progress, buttons, form errors

Automation (optional)
- [ ] Run Lighthouse/axe; address high/critical issues

---

## Reporting Template
Copy this block for each test or issue:
```
Area: (Functionality | Responsive | Cross‑Browser | Accessibility)
Item: (e.g., Estimator budget warning)
Status: Pass | Fail
Details: (What you observed; include device, width, browser)
Reproduction:
  1) ...
  2) ...
  3) ...
Severity: P0 Blocker | P1 High | P2 Medium | P3 Low
Recommended Fix: (Short, actionable suggestion)
Attachments: (Screenshots/links if available)
```

---

## Tips
- Clear cache or use incognito for fresh state.
- Disable extensions if you see inconsistent behaviors.
- When filing issues, include console logs and network tab snapshots when relevant.
