

## Customer Portal ใน LIFF + ปรับ Showcase ใหม่

### สรุปสิ่งที่จะทำ

1. **Customer Portal** — เพิ่มหน้า "คำสั่งจองของฉัน" ให้ลูกค้าดูรายการจอง + ประวัติ โดยใช้ LINE userId แทนการสมัครสมาชิก
2. **ออกแบบ Showcase ใหม่** — ปรับ UI ให้ modern ยิ่งขึ้น เพิ่ม bottom navigation, tab สลับระหว่าง "ร้านค้า" กับ "คำสั่งจองของฉัน"
3. **ดึงข้อมูลจาก LINE แทนการสมัครสมาชิก** — ใช้ LIFF profile เป็น identity ของลูกค้า

---

### Database Changes

**RLS Policy เพิ่ม** — ให้ `anon` SELECT orders ของตัวเองได้ (ใช้ customer_id match):
- เพิ่ม policy บน `orders`: anon SELECT WHERE customer_id อยู่ใน customers ที่มี line_user_id ตรงกัน
- เพิ่ม policy บน `order_items`: anon SELECT WHERE order_id อยู่ใน orders ที่ลูกค้าเป็นเจ้าของ

เนื่องจาก anon ไม่มี auth.uid() จะใช้วิธี query ฝั่ง client: ค้นหา customer ด้วย line_user_id ก่อน แล้ว fetch orders ด้วย customer_id

ตรวจสอบแล้ว: `customers` มี anon SELECT policy (`true`) อยู่แล้ว, `orders` มี anon INSERT แต่ยังไม่มี anon SELECT → ต้องเพิ่ม anon SELECT on orders + order_items

---

### Frontend Changes

**1. Refactor Showcase เป็น multi-tab (`src/pages/Showcase.tsx`)**

เพิ่ม Bottom Navigation Bar (fixed bottom) สำหรับมือถือ:
- 🏠 **ร้านค้า** — หน้า Showcase สินค้าปัจจุบัน
- 📋 **คำสั่งจอง** — Customer Portal ดูรายการจอง
- 👤 **โปรไฟล์** — ข้อมูลลูกค้า + ที่อยู่

**2. Customer Portal Tab (ในหน้า Showcase)**
- แสดงรายการคำสั่งจองทั้งหมดของลูกค้า (query by line_user_id → customer_id → orders)
- แต่ละ order แสดง: เลขที่, วันที่, สถานะ (badge), ยอดรวม
- กดเข้าดูรายละเอียด: รายการสินค้า, จำนวน, ราคา
- สถานะแสดงเป็น Timeline/Progress: รอดำเนินการ → ยืนยันแล้ว → เบิกแล้ว
- ถ้าไม่มี LIFF profile → แสดงข้อความ "กรุณาเปิดผ่าน LINE เพื่อดูคำสั่งจอง"

**3. Profile Tab**
- แสดง LINE profile (รูป, ชื่อ)
- แก้ไขเบอร์โทร, ที่อยู่ (อัปเดต customers table)

**4. Redesign Showcase UI ให้ modern ขึ้น**
- Header ปรับให้กะทัดรัดขึ้น ไม่กินพื้นที่เยอะ
- เพิ่ม Hero banner/carousel สำหรับ promotion (ใช้ special offers)
- Product card ปรับ shadow, spacing, typography
- Smooth page transitions ระหว่าง tabs ด้วย framer-motion
- ปรับ footer ให้มี padding สำหรับ bottom nav

---

### ไฟล์ที่สร้าง/แก้ไข

| ไฟล์ | การเปลี่ยนแปลง |
|---|---|
| Migration SQL | เพิ่ม anon SELECT policy บน orders + order_items |
| `src/pages/Showcase.tsx` | Refactor เป็น multi-tab + customer portal + redesign UI |

---

### Flow

```text
ลูกค้าเปิด LIFF → LINE Login อัตโนมัติ → ดูสินค้า (Tab ร้านค้า)
→ สั่งจอง → สำเร็จ
→ กด Tab "คำสั่งจอง" → ดูรายการจอง + สถานะ
→ กด Tab "โปรไฟล์" → แก้ไขเบอร์โทร/ที่อยู่
```

