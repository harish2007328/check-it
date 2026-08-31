# Design System: AI-Powered Legal Metrology Compliance Scanner (NutriPam Glass Style)

## 1. Executive Summary & Design Vision
This design system adapts the ultra-clean, high-end mobile UI architecture inspired by the reference design (**NutriPam** aesthetic) for the **SIH26034 AI-Powered Packaged Commodity Compliance Scanner**. 

The interface combines a pristine **light theme** with **pastel micro-surfaces**, tactile card modules, and a **Liquid Glass** effect that blends soft frosted blurs, glossy edge reflections, and a dark floating island bottom navbar.

---

## 2. Color Palette & Tokens

### Primary Palette (Direct Reference Tokens)
| Token Name | Hex Code | Purpose & Usage |
| :--- | :--- | :--- |
| **Faded Orange** | `#FC9244` | Primary brand accent, glowing center scanner button, primary CTAs, active highlights |
| **Faded Orange Glow** | `rgba(252, 146, 68, 0.25)` | Specular glow for active items & liquid glass scanner button |
| **Porcelain** | `#E6F4F1` | Pastel cyan/mint container background for hero cards, summary modules, and status chips |
| **Chrome White** | `#EBF5C2` | Soft lime-yellow highlight card for educational tips, quick stats, and warning notices |
| **Almost Black** | `#0D0D12` | Primary headline typography, dark floating bottom navigation island, high-contrast badges |
| **Pure White** | `#FFFFFF` | Core card surfaces, elevated sheets, input fields, and pill backgrounds |
| **Canvas Background** | `#F7F9FC` | Ultra-clean soft grey-blue backdrop providing subtle contrast against white cards |

### Pastel Metric & Status Accent Colors
| Accent Tone | Hex / RGBA | Usage |
| :--- | :--- | :--- |
| **Pastel Mint (Pass)** | `#D2F5DC` / `#16A34A` | Passed compliance checks, compliant badges, positive score indicators |
| **Pastel Peach (Review)** | `#FFD8BE` / `#EA580C` | Low-confidence OCR items, pending verification badges, caution cards |
| **Pastel Rose (Violation)** | `#FFD1D5` / `#E11D48` | Critical missing declarations, failed legal rules, penalty warnings |
| **Pastel Lavender (Info)** | `#E2D9F3` / `#7C3AED` | Legal rule citations, statutory clause tags, FSSAI verification chips |
| **Soft Border Stroke** | `rgba(13, 13, 18, 0.06)` | Ultra-thin crisp hairline border on white cards |
| **Glass Border Stroke** | `rgba(255, 255, 255, 0.65)` | Crisp specular highlight border for liquid glass elements |

---

## 3. Liquid Glass Architecture

### Physics & Visual Composition
1. **Backdrop Blur & Tint:** Utilizing `expo-blur` with light/dark adaptive intensity (15–35) combined with translucent linear gradient fills (`rgba(255, 255, 255, 0.75)` to `rgba(255, 255, 255, 0.35)`).
2. **Specular Top Light:** A 1px top/lateral border in `rgba(255, 255, 255, 0.85)` simulating ambient light catching the glass bevel.
3. **Diffuse Ambient Occlusion:** Soft multi-tier drop shadows:
   - Elevation 1: `shadowColor: '#0D0D12'`, `shadowOffset: {width: 0, height: 4}`, `shadowOpacity: 0.04`, `shadowRadius: 12`
   - Floating Island: `shadowColor: '#0D0D12'`, `shadowOffset: {width: 0, height: 10}`, `shadowOpacity: 0.18`, `shadowRadius: 24`
4. **Liquid Glass CTA Buttons:** Gradient `#FC9244` to `#FF7A1A` with a top highlight rim and subtle inner specular gradient.

---

## 4. Typography Hierarchy
*Clean, modern sans-serif inspired by PP Neue Montreal / Inter.*

- **Large Display:** 30px / Line Height 36px / Bold (700) / Tracking -0.5px
- **Screen Title:** 22px / Line Height 28px / SemiBold (600) / Tracking -0.3px
- **Card Heading:** 17px / Line Height 22px / SemiBold (600)
- **Body Regular:** 14px / Line Height 20px / Regular (400) / Color `#6B7280`
- **Metric Numbers:** 24px–32px / Line Height 36px / Bold (700) / Monospace Numbers
- **Label / Micro Badge:** 11px / Line Height 14px / Bold (700) / Letter Spacing +0.6px uppercase

---

## 5. Iconography Rules
- **Zero Emojis Policy:** Emojis are strictly banned throughout all screens, badges, buttons, lists, and forms, **except for the single friendly greeting on the homepage header** (`"👋"`).
- **Vector Icons:** Strictly using `@expo/vector-icons` (`Feather`, `Ionicons`, `MaterialCommunityIcons`):
  - Home: `Feather.home`
  - Compass / Rules: `Feather.compass` or `Feather.book-open`
  - Camera Scanner: `MaterialCommunityIcons.barcode-scan` / `Feather.camera`
  - Complaints / Tracker: `Feather.activity` / `Feather.file-text`
  - Profile: `Feather.user`
  - Search: `Feather.search`
  - Notification: `Feather.bell` with active unread dot
  - Metric Pills: `Feather.check-circle`, `Feather.alert-triangle`, `Feather.x-circle`, `Feather.shield`

---

## 6. Layout & Navigation Blueprint

### A. Top App Header
- **Greeting Line:** `"Welcome back 👋"` (Only permitted emoji)
- **User Title:** `"Inspector Sharma"` (or active profile name) in 22px SemiBold
- **Action Icons:** Dual circular pill buttons (44x44px) with subtle background (`#FFFFFF` with hairline border):
  - Left circular button: Search icon (`Feather: search`)
  - Right circular button: Bell icon (`Feather: bell`) with `#FC9244` notification badge dot

### B. Hero Inspection Card
- **Background:** Pastel Porcelain (`#E6F4F1`) with soft rounded corners (24px radius).
- **Content:**
  - Headline: *"Verify Packaged Commodities"*
  - Subtext: *"AI instant check for MRP, Net Qty, Best Before & Manufacturer declarations."*
  - Action Button: **Faded Orange Pill** (`#FC9244`) with text *"Scan Now"* and trailing arrow icon.
  - Floating Graphic: Packaged product badge / AI scan illustration.

### C. Inspection Metrics Grid (2x2 Pastel Cards)
1. **Compliant Scans:** Mint card (`#D2F5DC` pill with `Feather: check-circle`), displaying pass count and 94.2% rate.
2. **Flagged Violations:** Rose card (`#FFD1D5` pill with `Feather: alert-circle`), displaying violation count and severity.
3. **Pending Review:** Peach card (`#FFD8BE` pill with `Feather: clock`), displaying items needing manual verification.
4. **Active Complaints:** Lavender card (`#E2D9F3` pill with `Feather: file-text`), displaying filed cases.

### D. Floating Liquid Glass Bottom Navigation Island
- **Container Shape:** Pill-shaped floating capsule centered horizontally (`bottom: 24px`, `marginHorizontal: 20px`, `height: 68px`, `borderRadius: 34px`).
- **Surface Material:** `Almost Black` (`#0D0D12`) with frosted blur and ultra-subtle border `rgba(255, 255, 255, 0.12)`.
- **5 Navigation Slots:**
  1. `Home` (`Feather: home`)
  2. `Rules & Standards` (`Feather: book-open`)
  3. **Middle Scanner Button:** Enlarged elevated 56x56px circular button floating in the center, rendered in **vibrant Faded Orange (`#FC9244`)** with subtle drop shadow and `MaterialCommunityIcons: barcode-scan` icon.
  4. `Track Complaints` (`Feather: activity`)
  5. `Profile & Settings` (`Feather: user`)
