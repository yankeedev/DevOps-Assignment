# Agriculture Project - Official Color Palette

A carefully curated palette inspired by nature, growth, and harvest.
Designed for accessibility, readability, and modern agricultural UI/UX.

## 1. Color Overview

| Category   | Count | Purpose                                  |
|------------|-------|------------------------------------------|
| Primary    | 3     | Brand identity, CTAs, headers            |
| Secondary  | 4     | Supporting UI, highlights, harvest theme |
| Accent     | 3     | Water/irrigation, info, notifications    |
| Neutral    | 5     | Text, backgrounds, borders               |
| Semantic   | 4     | Success, warning, error, info states     |

---

## 2. Primary Colors

| Name         | Hex       | RGB           | Usage                                  |
|--------------|-----------|---------------|----------------------------------------|
| Leaf Green   | #2E7D32   | 46, 125, 50   | Primary brand color, buttons, headers  |
| Fresh Green  | #4CAF50   | 76, 175, 80   | Success states, CTAs, accents          |
| Deep Forest  | #1B5E20   | 27, 94, 32    | Dark backgrounds, emphasis text        |

---

## 3. Secondary Colors

| Name         | Hex       | RGB              | Usage                            |
|--------------|-----------|------------------|----------------------------------|
| Sprout       | #A5D6A7   | 165, 214, 167    | Soft backgrounds, hover states   |
| Wheat        | #F9A825   | 249, 168, 37     | Highlights, warnings, harvest    |
| Golden Sun   | #FBC02D   | 251, 192, 45     | Icons, badges, accents           |
| Earth Brown  | #6D4C41   | 109, 76, 65      | Soil theme, secondary text       |

---

## 4. Accent Colors

| Name         | Hex       | RGB            | Usage                            |
|--------------|-----------|----------------|----------------------------------|
| Sky Blue     | #0288D1   | 2, 136, 209    | Water/irrigation, links, info    |
| Water Blue   | #4FC3F7   | 79, 195, 247   | Charts, info backgrounds         |
| Sunlight     | #FFEB3B   | 255, 235, 59   | Warnings, notifications          |

---

## 5. Neutral Colors

| Name       | Hex       | RGB              | Usage                    |
|------------|-----------|------------------|--------------------------|
| Charcoal   | #212121   | 33, 33, 33       | Primary text             |
| Slate      | #455A64   | 69, 90, 100      | Secondary text           |
| Stone      | #B0BEC5   | 176, 190, 197    | Borders, dividers        |
| Cloud      | #F5F5F5   | 245, 245, 245    | Backgrounds              |
| White      | #FFFFFF   | 255, 255, 255    | Cards, surfaces          |

---

## 6. Semantic Colors

| Name     | Hex       | Usage                          |
|----------|-----------|--------------------------------|
| Success  | #43A047   | Positive actions, confirmations|
| Warning  | #FB8C00   | Warnings, alerts               |
| Error    | #E53935   | Errors, destructive actions    |
| Info     | #039BE5   | Informational messages         |

---

## 7. CSS Variables

```css
:root {
  /* Primary */
  --color-primary: #2E7D32;
  --color-primary-light: #4CAF50;
  --color-primary-dark: #1B5E20;

  /* Secondary */
  --color-sprout: #A5D6A7;
  --color-wheat: #F9A825;
  --color-golden-sun: #FBC02D;
  --color-earth-brown: #6D4C41;

  /* Accent */
  --color-sky-blue: #0288D1;
  --color-water-blue: #4FC3F7;
  --color-sunlight: #FFEB3B;

  /* Neutrals */
  --color-charcoal: #212121;
  --color-slate: #455A64;
  --color-stone: #B0BEC5;
  --color-cloud: #F5F5F5;
  --color-white: #FFFFFF;

  /* Semantic */
  --color-success: #43A047;
  --color-warning: #FB8C00;
  --color-error: #E53935;
  --color-info: #039BE5;
}