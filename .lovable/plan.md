

## Visual Rebrand — AKK Furniture Premium & Timeless Style

### Summary
Complete visual rebrand of the entire website to match the AKK Furniture logo's premium gold-and-charcoal identity. This touches fonts, colors, component styling, and layout refinements across all public-facing components.

### Changes

#### 1. Fonts — `src/index.css` + `tailwind.config.ts`
- Import **Prompt** (Semi-bold) and **Sarabun** (Light/Regular) from Google Fonts
- Set `font-family` for headings to `'Prompt'` and body to `'Sarabun'` with `line-height: 1.6`
- Update Tailwind `fontFamily` config accordingly

#### 2. Color Palette — `src/index.css`
Replace the current blue-based CSS variables with the AKK brand palette:

| Token | Light Mode | Purpose |
|---|---|---|
| `--background` | `#FDFBF7` (warm cream) | Main body |
| `--foreground` | `#1A1A1A` (deep charcoal) | Text |
| `--primary` | `#C5A059` (deep gold) | Buttons, icons, links |
| `--primary-foreground` | `#FFFFFF` | Text on gold |
| `--secondary` | `#F5F0E8` (light warm) | Secondary surfaces |
| `--muted` | `#F7F4EE` | Muted backgrounds |
| `--muted-foreground` | `#8C7E6A` | Subtle text |
| `--accent` | `#EDE7DA` | Accent surfaces |
| `--accent-foreground` | `#8B6914` | Accent text |
| `--border` | `#E8E0D0` | Borders |
| `--card` | `#FFFFFF` | Cards |
| `--destructive` | Keep red | Errors |
| Sidebar | Dark charcoal tones | Admin sidebar |

Dark mode will also be updated to a rich charcoal/gold scheme.

#### 3. Navbar Glassmorphism — `src/components/HomeNavbar.tsx`
- When scrolled: `bg-[#FDFBF7]/85 backdrop-blur-xl border-b border-[#C5A059]/30` (1px gold bottom border)
- Nav link hover: gold color transition
- Cart icon: gold accent

#### 4. Buttons — `src/components/ui/button.tsx`
- Default variant: solid gold background (`bg-primary`), white text, hover darkens slightly
- Outline variant: gold border, gold text, hover fills gold
- Add smooth `transition-all duration-300` and slight scale on hover

#### 5. Product Cards — `src/components/ProductCatalog.tsx`
- More padding/white space in `CardContent`
- Very subtle soft shadow (`shadow-sm hover:shadow-lg`)
- Clean minimalist layout: remove heavy overlays
- Price in gold, "สั่งจอง" button in gold
- Border: `border-[#E8E0D0]/60`

#### 6. Home.tsx Sections
- Hero: charcoal heading text, gold accent badge, warm cream gradient background
- Stats counter: gold numbers
- Feature cards ("Why Choose Us"): gold icon backgrounds, charcoal text
- CTA banner: gold gradient instead of blue
- About section: warm tones
- Contact cards: gold icon accents
- Footer: dark charcoal background with gold accents

#### 7. PromoBanners.tsx
- Replace blue gradients with warm gold/cream tones

#### 8. WebOrderCart.tsx
- Gold accent on totals and confirm button
- Warm cream backgrounds for cart items

### Files Modified

| File | Change |
|---|---|
| `src/index.css` | New fonts import, new CSS variable palette |
| `tailwind.config.ts` | Update `fontFamily` to Prompt/Sarabun |
| `src/components/ui/button.tsx` | Add hover transition refinement |
| `src/components/HomeNavbar.tsx` | Glassmorphism + gold border on scroll |
| `src/components/ProductCatalog.tsx` | White space, soft shadow, gold accents |
| `src/pages/Home.tsx` | Gold/charcoal theming across all sections |
| `src/components/PromoBanners.tsx` | Gold/cream gradient |
| `src/components/WebOrderCart.tsx` | Gold accent on totals/buttons |

### No Database Changes Required

