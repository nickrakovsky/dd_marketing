# DataDocks Brand Colors

This document defines the brand color palette and functional color systems for DataDocks. LLM agents should refer to these hex codes to maintain visual consistency across components and designs.

## Marketing Core
The primary identity colors for DataDocks marketing and brand recognition.

| Color Name | Hex Code | Usage |
| :--- | :--- | :--- |
| Official Orange | `#FE5000` | Primary brand color / Hero CTAs |
| Paper White | `#FFF8EE` | Primary background canvas |
| Dark Beige | `#EFE2D2` | Secondary marketing surfaces and section backgrounds |
| Solid Black | `#000000` | Primary typography |

### Orange surface text rule

Black text on an orange background must never be an element's default appearance. Use white or the approved light paper colour for text and inherited icons on orange surfaces, including buttons, cards, banners, and navigation controls. Black text on orange is permitted only for special or temporary states, such as mouseover. Check child elements as well as the surface itself; they must not override this default with black text.

White or paper text on Official Orange needs large-text sizing to meet AA contrast: at least 24px regular or 18.67px bold. Use 20px bold or larger for orange CTA labels; use a black surface with light text when smaller labels are necessary. Dark Beige is a background colour, not a substitute for light text on orange.

## Product Core (Neutrals)
The secondary palette used within the DataDocks application interface.

| Variable Name | Hex Code | Usage |
| :--- | :--- | :--- |
| `--datadocks-orange` | `#fd4f00` | Primary interface action color |
| `--datadocks-brown-dark` | `#ad9686` | Secondary brand color / Icons |
| `--datadocks-brown-light` | `#ece6de` | Backgrounds / Neutral sections |
| `--datadocks-brown-extra-light` | `#faf8f5` | Subtle backgrounds |
| `--datadocks-brown-extra-dark` | `#5f483a` | UI Text / Dark accents |
| `--datadocks-brown-medium` | `#9c806d` | Accents / Borders |

## Appointment State Colors
Used specifically for dock scheduling states and status indicators.

| Status / Variable Name | Hex Code |
| :--- | :--- |
| `--datadocks-unbooked` | `#e6e6e6` |
| `--datadocks-booking-pending` | `#d0ddf6` |
| `--datadocks-booked` | `#9de9bb` |
| `--datadocks-booked-inbound` | `#9de9bb` |
| `--datadocks-booked-outbound` | `#9de9bb` |
| `--datadocks-arrived` | `#a9efff` |
| `--datadocks-started` | `#fff8bc` |
| `--datadocks-completed` | `#92b4f5` |
| `--datadocks-departed` | `#d7e0f1` |
| `--datadocks-unscheduled-arrival` | `#feceff` |
| `--datadocks-delayed` | `#ffdba5` |
| `--datadocks-cancelled` | `#ffc1c1` |
| `--datadocks-no-show` | `#bababa` |

## Functional UI Colors
General UI utility colors.

| Variable Name | Hex Code | Usage |
| :--- | :--- | :--- |
| `--datadocks-black-transparent` | `#0000007a` | Overlays / Modals |
| `--datadocks-important-red` | `#dc3545` | Critical alerts / Errors |

## Semantic Color Sets
Used for general UI feedback (success, warning, info, error).

### Blue (Information/Primary)
| Variable Name | Hex Code |
| :--- | :--- |
| `--datadocks-blue-light` | `#d0ddf6` |
| `--datadocks-blue-medium` | `#99bcff` |
| `--datadocks-blue-dark` | `#4a69a4` |

### Red (Error/Negative)
| Variable Name | Hex Code |
| :--- | :--- |
| `--datadocks-red-light` | `#ffd7d7` |
| `--datadocks-red-medium` | `#ffa6a6` |
| `--datadocks-red-dark` | `#cb4949` |

### Green (Success/Positive)
| Variable Name | Hex Code |
| :--- | :--- |
| `--datadocks-green-light` | `#e0eedb` |
| `--datadocks-green-medium` | `#8DCA77` |
| `--datadocks-green-dark` | `#4a8136` |
