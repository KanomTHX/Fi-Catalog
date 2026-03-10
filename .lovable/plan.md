

## Inventory & Stock Management System — Full Implementation Plan

### Overview
A complete SaaS-style inventory management app with authentication, product management, stock tracking, reports, and activity logs. Uses Lovable Cloud (Supabase) for backend, single warehouse to start.

---

### Phase 1: Backend Setup (Database & Auth)

**Authentication & Users**
- Email/password signup and login pages
- User profiles table with name, avatar
- Roles table (admin, staff) with proper RLS security
- Admin can manage users; staff has limited permissions

**Database Tables**
- `products` — name, SKU, barcode, category, cost_price, selling_price, unit, min_stock_level, image_url, created_by
- `categories` — for organizing products
- `stock_movements` — type (in/out/adjustment), product_id, quantity, note, created_by, timestamp
- `stock_adjustments` — reason, quantity change, product_id, audit trail
- `activity_logs` — action, user_id, details, timestamp
- `warehouses` — single location for now, expandable later
- RLS policies on all tables based on user roles

---

### Phase 2: App Layout & Navigation

- Sidebar navigation with collapsible menu (Dashboard, Products, Stock In, Stock Out, Adjustments, Reports, Users, Activity Log)
- Top header with user avatar, notifications bell, and logout
- Responsive layout — sidebar collapses to icons on mobile
- Modern dark/light SaaS design

---

### Phase 3: Dashboard

- Summary cards: Total Products, Total Stock, Low Stock Items, Today's In/Out
- Bar/line chart showing stock movements over the last 30 days
- Recent stock movements table (last 10 entries)
- Low stock alerts list with links to restock

---

### Phase 4: Product Management

- Data table with search, category filter, and pagination
- Add/Edit product dialog with all fields (name, SKU, barcode, category, prices, unit, min stock)
- Product image upload via Supabase Storage
- Delete product with confirmation
- CSV/Excel import functionality using file upload + parsing
- Current stock auto-calculated from stock movements

---

### Phase 5: Stock In / Stock Out / Adjustments

**Stock Receiving (In)**
- Form: select product (searchable dropdown), enter quantity, optional note
- Auto-updates stock, records movement history

**Stock Withdrawal (Out)**
- Form: select product, enter quantity, optional note (customer/order ref)
- Validates against available stock, auto-deducts
- Records withdrawal history

**Stock Adjustment**
- Add or deduct stock with required reason
- Full audit log of all adjustments

---

### Phase 6: Reports

- Inventory Report — all products with current stock levels
- Low Stock Report — items below minimum level
- Stock Movement Report — filterable by date range, type, product
- Export to Excel (CSV download) and PDF generation

---

### Phase 7: Notifications & Activity Logs

**Notifications**
- Bell icon in header showing count of low-stock alerts
- Dropdown panel listing products below minimum stock
- Toast notifications on stock actions

**Activity Logs**
- Full table of system activities (product created, stock received, etc.)
- Filterable by user, action type, date range

---

### Phase 8: User Management (Admin)

- Admin page to list, add, edit, and deactivate users
- Assign roles (admin/staff)
- Staff sees limited menu (no user management, no activity logs)

