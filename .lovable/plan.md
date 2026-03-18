

## แผนปรับโครงสร้างหน้าเว็บ + ระบบ Checkout ใหม่

### 1. แยกหน้าออกเป็น Routes แยก

**Route Structure ใหม่:**
```text
/              → Home (Hero + Why Choose Us + CTA เท่านั้น)
/products      → Products Page (สินค้าแนะนำ + สินค้าทั้งหมด + ตะกร้า)
/about         → About Page (เกี่ยวกับเรา)
/contact       → Contact Page (ติดต่อเรา + Google Map)
/checkout      → Checkout Page (ใหม่)
/liff          → Showcase (LINE LIFF)
/admin/*       → Admin Panel
```

**ไฟล์ที่สร้าง/แก้ไข:**

| ไฟล์ | การเปลี่ยนแปลง |
|---|---|
| `src/pages/PublicProducts.tsx` | **สร้างใหม่** — หน้าสินค้าสไตล์ Global House (หมวดหมู่แยก section, banner หมวดหมู่, product carousel ต่อหมวด, สินค้าทั้งหมดแบบ grid) |
| `src/pages/About.tsx` | **สร้างใหม่** — ย้ายส่วน "เกี่ยวกับเรา" มาเป็นหน้าเต็ม |
| `src/pages/Contact.tsx` | **สร้างใหม่** — ย้ายส่วน "ติดต่อเรา + Google Map" มาเป็นหน้าเต็ม |
| `src/pages/Checkout.tsx` | **สร้างใหม่** — หน้า Checkout แบบเต็ม พร้อม 2 ตัวเลือก (จองเลย / เข้าสู่ระบบ Google) |
| `src/pages/Home.tsx` | **แก้ไข** — เหลือแค่ Hero + Promo Banners + Why Choose Us + CTA |
| `src/components/HomeNavbar.tsx` | **แก้ไข** — เปลี่ยน nav links จาก anchor scroll เป็น React Router links |
| `src/components/ProductCatalog.tsx` | **แก้ไข** — ปรับ UI ให้สไตล์ Global House: card ขนาดเท่ากัน, แยก section ตามหมวดหมู่ พร้อม banner หมวดหมู่, carousel สินค้าต่อหมวด |
| `src/App.tsx` | **แก้ไข** — เพิ่ม routes สำหรับ `/products`, `/about`, `/contact`, `/checkout` |

### 2. ปรับ UI สินค้าตามตัวอย่าง Global House

จากรูปตัวอย่าง:
- **แยก section ตามหมวดหมู่** แต่ละหมวดมี banner header + horizontal scroll/carousel ของสินค้า
- **Product Card**: ขนาดเท่ากัน, รูปสินค้า aspect-square, ชื่อสินค้า 2 บรรทัด, ราคา + ปุ่มตะกร้า
- Flash Sale / Promotion / New Arrival sections
- สินค้าแนะนำอยู่ด้านบน, ตามด้วยสินค้าแยกตามหมวดหมู่

### 3. ระบบ Checkout ใหม่

**Flow:**
```text
เลือกสินค้า → ตะกร้า → หน้า Checkout (/checkout)
                              ↓
                   ┌──────────────────────┐
                   │ สรุปรายการสั่งจอง      │
                   │                        │
                   │ [จองเลย ไม่ต้องสมัคร]  │ ← ปุ่มใหญ่สุด (primary)
                   │                        │
                   │ [เข้าสู่ระบบด้วย Google]│ ← ปุ่มรอง
                   └──────────────────────┘
                              ↓
                   กรอกข้อมูล (ชื่อ, เบอร์, ที่อยู่)
                              ↓
                   ได้เลขใบจอง (Order ID)
                              ↓
                   เสนอ "สมัครสมาชิก" (optional)
```

**Checkout Page (`/checkout`):**
- แสดงสรุปรายการจากตะกร้า
- 2 ปุ่มหลัก: "จองเลย" (ปุ่มใหญ่ gold) + "เข้าสู่ระบบด้วย Google" (ปุ่มรอง)
- กด "จองเลย" → แสดงฟอร์มชื่อ/เบอร์/ที่อยู่ → ยืนยัน → ได้เลขใบจอง
- กด Google → ใช้ Lovable Cloud OAuth → login แล้วดึงข้อมูลจาก profile มากรอกอัตโนมัติ → ยืนยัน → ได้เลขใบจอง
- หลังจองสำเร็จ แสดง Dialog พร้อมเลขใบจอง + ปุ่ม "สมัครสมาชิก" สำหรับ guest

**Cart State:** ใช้ React Context แทน local state ใน Home เพื่อให้ cart persist ข้าม pages

### 4. Cart Context

สร้าง `src/contexts/CartContext.tsx` เก็บ cart items, addToCart, updateQty, removeItem, clearCart เพื่อใช้ข้าม pages (Products → Checkout)

### ไม่มี Database Changes

ใช้ตาราง `customers`, `orders`, `order_items` เดิม + Google OAuth ผ่าน Lovable Cloud managed solution

