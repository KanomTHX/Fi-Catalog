

## ระบบตะกร้าสินค้า, สั่งจองผ่าน LINE LIFF และหน้าจัดการคำสั่งจอง

### สรุปสิ่งที่จะสร้าง

1. **ตะกร้าสินค้าใน Showcase** — ลูกค้าเลือกสินค้าใส่ตะกร้า กรอกข้อมูลติดต่อ แล้วยืนยันสั่งจอง
2. **ระบบลูกค้าแบบง่าย** — ไม่ต้อง login แต่กรอกชื่อ, ที่อยู่, เบอร์โทร + ดึง LINE profile จาก LIFF
3. **ตาราง `customers` + `orders` + `order_items`** — เก็บข้อมูลลูกค้าและคำสั่งจอง
4. **หน้าจัดการคำสั่งจอง (Backend)** — หน้าใหม่ `/orders` สำหรับ admin/staff ดูคำสั่งจอง อนุมัติ/เบิกสินค้าออก
5. **ปรับ Showcase URL** — เปิดผ่าน LIFF แทน URL ตรง, Rich Menu ชี้ไป `https://liff.line.me/{liffId}`

---

### Database Changes

**ตาราง `customers` (ใหม่)**
```text
id            uuid PK default gen_random_uuid()
line_user_id  text UNIQUE nullable       -- จาก LIFF profile
display_name  text NOT NULL
phone         text nullable
address       text nullable
picture_url   text nullable
created_at    timestamptz default now()
```

**ตาราง `orders` (ใหม่)**
```text
id            uuid PK default gen_random_uuid()
customer_id   uuid FK -> customers(id)
status        text NOT NULL default 'pending'  -- pending | confirmed | completed | cancelled
total_amount  numeric default 0
note          text nullable
created_at    timestamptz default now()
updated_at    timestamptz default now()
```

**ตาราง `order_items` (ใหม่)**
```text
id            uuid PK default gen_random_uuid()
order_id      uuid FK -> orders(id) ON DELETE CASCADE
product_id    uuid FK -> products(id)
quantity      integer NOT NULL default 1
unit_price    numeric default 0
```

**RLS:**
- `customers`: anon/authenticated SELECT+INSERT (ลูกค้าสร้างเอง), authenticated UPDATE
- `orders`: anon INSERT (สร้างคำสั่งจอง), authenticated SELECT/UPDATE
- `order_items`: anon INSERT, authenticated SELECT

---

### Frontend Changes

**1. ตะกร้าสินค้าใน Showcase (`src/pages/Showcase.tsx`)**
- เพิ่ม state `cart: { product: Product, qty: number }[]`
- ปุ่ม "เพิ่มลงตะกร้า" ใน ProductDetailDialog + ProductCard
- Floating cart icon (มุมล่างขวา) แสดงจำนวนรายการ
- Cart drawer/sheet: แสดงรายการ, ปรับจำนวน, ลบ, ยอมรวม
- ปุ่ม "สั่งจอง" → เปิด checkout form

**2. Checkout Form (ใน Showcase)**
- กรอก: ชื่อ (pre-fill จาก LINE profile), เบอร์โทร, ที่อยู่, หมายเหตุ
- ถ้า LIFF logged in → ดึง displayName, pictureUrl, userId มา pre-fill
- เมื่อยืนยัน → สร้าง/อัปเดต `customers` (upsert by line_user_id) → สร้าง `orders` + `order_items`
- แสดงหน้ายืนยัน "สั่งจองสำเร็จ" พร้อมเลขที่ order

**3. Showcase เปิดผ่าน LIFF เท่านั้น**
- เมื่อ LIFF init แล้ว ถ้ายังไม่ login → เรียก `liff.login()` อัตโนมัติ (เพื่อให้ได้ profile)
- ถ้าไม่มี LIFF ID ตั้งค่า → แสดงหน้าปกติ (fallback)
- LINE Settings: เปลี่ยน Showcase URL จาก raw URL เป็น `https://liff.line.me/{liffId}`

**4. หน้าจัดการคำสั่งจอง (`src/pages/Orders.tsx`) — Backend**
- ตาราง: แสดงชื่อลูกค้า, เบอร์โทร, รายการสินค้า, ยอดรวม, สถานะ, วันที่
- Badge สถานะ: pending(เหลือง), confirmed(ฟ้า), completed(เขียว), cancelled(แดง)
- ปุ่ม "ยืนยัน" → เปลี่ยนสถานะเป็น confirmed
- ปุ่ม "เบิกสินค้า" → เปลี่ยนสถานะเป็น completed + สร้าง stock_movement type=out อัตโนมัติ
- ปุ่ม "ยกเลิก" → เปลี่ยนสถานะเป็น cancelled

**5. Navigation**
- เพิ่มเมนู "คำสั่งจอง" ใน sidebar (เมนูหลัก) ด้วย icon `ShoppingCart`

---

### ไฟล์ที่สร้าง/แก้ไข

| ไฟล์ | การเปลี่ยนแปลง |
|---|---|
| Migration SQL | สร้าง customers, orders, order_items + RLS |
| `src/pages/Showcase.tsx` | เพิ่มตะกร้า, checkout form, LIFF auto-login |
| `src/pages/Orders.tsx` (ใหม่) | หน้าจัดการคำสั่งจอง |
| `src/hooks/useOrders.ts` (ใหม่) | hooks สำหรับ orders CRUD |
| `src/components/AppSidebar.tsx` | เพิ่มเมนูคำสั่งจอง |
| `src/App.tsx` | เพิ่ม route `/orders` |
| `src/pages/LineSettings.tsx` | ปรับ Showcase URL แสดง LIFF URL |

---

### Flow การทำงาน

```text
ลูกค้าเปิด LIFF → LINE Login อัตโนมัติ → ดูสินค้า → เลือกใส่ตะกร้า
→ กดสั่งจอง → กรอกเบอร์โทร+ที่อยู่ → ยืนยัน
→ ระบบสร้าง order (status: pending)
→ Admin/Staff เห็นในหน้าคำสั่งจอง → ยืนยัน → เบิกสินค้าออก (auto stock-out)
```

