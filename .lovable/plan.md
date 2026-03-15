

## สร้างหน้าแรกใหม่ — Landing Page แนะนำร้านค้า

### สรุป
สร้าง page component ใหม่ `src/pages/Home.tsx` เป็น Landing Page สำหรับแนะนำร้านค้า แทนที่ Showcase ที่หน้า `/` โดย Showcase จะย้ายไปใช้เฉพาะ `/liff` สำหรับลูกค้าผ่าน LINE เท่านั้น

### Route Structure

```text
/          → Home (Landing Page ใหม่ - public)
/liff      → Showcase (LINE LIFF only)
/admin/*   → Admin panel (เหมือนเดิม)
```

### หน้า Home ประกอบด้วย

1. **Hero Section** — ชื่อร้าน + โลโก้ (ดึงจาก site_settings), tagline, ปุ่ม CTA "ดูสินค้า" ลิงก์ไป LINE LIFF
2. **สินค้าแนะนำ** — ดึงสินค้า featured/new จาก products table แสดง 4-8 รายการพร้อมรูป ราคา
3. **จุดเด่นร้าน** — 3-4 Feature cards (เช่น สินค้าคุณภาพ, สั่งง่ายผ่าน LINE, จัดส่งรวดเร็ว)
4. **ปุ่มเข้าสู่ LINE** — CTA ใหญ่เปิด LINE LIFF เพื่อสั่งจองสินค้า
5. **Footer** — ข้อมูลติดต่อ + ลิงก์เข้า Admin

### ไฟล์ที่สร้าง/แก้ไข

| ไฟล์ | การเปลี่ยนแปลง |
|---|---|
| `src/pages/Home.tsx` | **สร้างใหม่** — Landing Page component |
| `src/App.tsx` | เปลี่ยน `/` จาก Showcase → Home, เปลี่ยน `/liff` จาก redirect → render Showcase ตรง |

### รายละเอียดทางเทคนิค

**`src/pages/Home.tsx`**
- ใช้ `useSiteSettings()` ดึงชื่อร้าน/โลโก้
- ใช้ `useQuery` ดึงสินค้า featured (`is_featured = true` หรือ `is_new = true`) จำกัด 8 รายการ
- ใช้ `useQuery` ดึง `line_settings` เพื่อสร้าง LIFF launch URL สำหรับปุ่ม CTA
- Styling: gradient hero, card grid, responsive, Framer Motion animations
- ไม่ต้อง login

**`src/App.tsx`**
- `<Route path="/" element={<Home />} />`
- `<Route path="/liff" element={<Showcase />} />` (render ตรง ไม่ redirect)
- ลบ `/showcase` redirect

