

## LINE LIFF Showcase & Rich Menu Integration

### What We're Building
1. **Public product showcase page** (`/showcase`) — no login required, displays products with images, prices, and categories in a mobile-friendly grid layout optimized for LINE's in-app browser
2. **LINE LIFF integration** — initialize LIFF SDK on the showcase page so it works inside LINE's browser with user profile access
3. **LINE Settings page** (admin only) — configure LIFF ID and LINE Channel Access Token
4. **Rich Menu auto-creation** — edge function that calls LINE Messaging API to create and set a Rich Menu linking to the showcase page

---

### Database Changes

- New table `line_settings` to store LIFF ID, Channel Access Token, and Rich Menu ID
  - Columns: `id`, `liff_id`, `channel_access_token`, `rich_menu_id`, `created_at`, `updated_at`
  - RLS: only admins can read/write
- Add RLS policy on `products` and `categories` for anonymous SELECT access (showcase is public)

---

### Frontend Changes

**1. Public Showcase Page (`/showcase`)**
- Mobile-first product grid with images, name, price, category badges
- Category filter tabs at the top
- LIFF SDK initialization (`@line/liff` npm package)
- Route added outside `ProtectedRoutes` so no auth is required

**2. LINE Settings Page (`/settings/line`) — Admin Only**
- Form to input LIFF ID and Channel Access Token
- Save to `line_settings` table
- "Create Rich Menu" button that calls the edge function
- Shows current Rich Menu status

**3. Sidebar Update**
- Add "LINE Settings" link under Admin section

---

### Backend (Edge Function)

**`line-rich-menu` edge function:**
- Accepts Channel Access Token from `line_settings` table
- Creates a Rich Menu via LINE Messaging API (`POST https://api.line.me/v2/bot/richmenu`)
- Uploads Rich Menu image
- Sets as default Rich Menu (`POST https://api.line.me/v2/bot/user/all/richmenu/{richMenuId}`)
- Stores the `rich_menu_id` back in `line_settings`

---

### Secrets Needed
- LINE Channel Access Token — stored in `line_settings` table (admin-managed, not as env secret since it's per-tenant config)
- LIFF ID — stored in `line_settings` table

---

### Implementation Order
1. Create `line_settings` table + RLS policies + public access for products
2. Build showcase page with LIFF SDK
3. Build LINE Settings admin page
4. Create `line-rich-menu` edge function
5. Wire everything together

