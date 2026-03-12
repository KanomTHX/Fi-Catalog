

## แผนการปรับปรุง Showcase และเพิ่มหน้าตั้งค่า

### 1. Database Changes (Migration)

**เพิ่มคอลัมน์ใน `products`:**
- `color` text — สีสินค้า
- `material` text — วัสดุ
- `discount_price` numeric — ราคาลด (ถ้ามี = แสดงเป็นสินค้าลดราคา)
- `is_new` boolean default false — สินค้าใหม่
- `is_featured` boolean default false — สินค้าแนะนำ

**สร้างตาราง `site_settings` (ใหม่):**
```text
id            uuid PK default gen_random_uuid()
site_name     text default 'StockFlow'
logo_url      text nullable
created_at    timestamptz default now()
updated_at    timestamptz default now()
```
- RLS: authenticated SELECT/INSERT/UPDATE (admin only for write), anon SELECT

**สร้าง view `product_order_counts`** — นับจำนวนสั่งซื้อต่อ product_id จาก order_items (สำหรับ sorting ยอดนิยม)

---

### 2. หน้าตั้งค่าระบบ (`src/pages/SiteSettings.tsx`) — ใหม่

- ฟอร์มเปลี่ยนชื่อระบบ (แทน "StockFlow")
- อัปโหลด Logo (ใช้ storage bucket `site-assets`)
- Preview ชื่อ + logo ก่อนบันทึก
- เพิ่ม route `/settings/site` ใน App.tsx
- เพิ่มเมนู "ตั้งค่าระบบ" ใน Sidebar (admin section)

---

### 3. Showcase — Sorting & Filtering

**Sorting (dropdown):**
- ยอดนิยม — sort by order count desc (จาก product_order_counts view)
- สินค้าใหม่ — sort by created_at desc
- ราคาต่ำ→สูง / สูง→ต่ำ
- ส่วนลดสูงสุด — sort by (selling_price - discount_price) desc

**Filtering (slide-out panel/sheet):**
- ช่วงราคา — Slider component (min-max)
- แบรนด์ — checkbox list (extract unique brands from products)
- วัสดุ — checkbox list
- สี — checkbox list / color swatches
- ขนาด — input max width

**Special Sections (ก่อน product grid):**
- 🔥 สินค้าขายดี — filter by top order count, horizontal scroll
- ✨ สินค้ามาใหม่ — filter by `is_new = true` or latest created_at
- ⚡ ดีลพิเศษ — filter where `discount_price` is not null

---

### 4. Product Form Update (`Products.tsx`)

เพิ่มช่องกรอกในฟอร์มสินค้า:
- สี, วัสดุ, ราคาลดพิเศษ
- Checkbox: สินค้าใหม่, สินค้าแนะนำ

---

### 5. Showcase ใช้ชื่อ/Logo จาก site_settings

- Fetch `site_settings` ตอนโหลด Showcase
- แสดงชื่อร้านและ logo แทน hardcoded "StockFlow"
- Sidebar header ก็อ่านจาก site_settings เช่นกัน

---

### ไฟล์ที่สร้าง/แก้ไข

| ไฟล์ | การเปลี่ยนแปลง |
|---|---|
| Migration SQL | เพิ่มคอลัมน์ products + สร้าง site_settings + view |
| `src/pages/SiteSettings.tsx` (ใหม่) | หน้าตั้งค่าชื่อ/logo |
| `src/pages/Showcase.tsx` | Sorting, filtering, special sections, dynamic branding |
| `src/pages/Products.tsx` | เพิ่มช่อง color, material, discount_price, is_new, is_featured |
| `src/hooks/useProducts.ts` | รองรับ fields ใหม่ |
| `src/components/AppSidebar.tsx` | เพิ่มเมนูตั้งค่าระบบ + dynamic name/logo |
| `src/App.tsx` | เพิ่ม route `/settings/site` |

