

## แผนปรับปรุง — อัปโหลดรูปหมวดหมู่, Cart ไม่แสดงราคา, Rich Text, Image Lightbox, LIFF Layout

### สรุปงาน 6 รายการ

### 1. อัปโหลดรูปหมวดหมู่ 256x256 ใน Admin Products

**`src/pages/Products.tsx`**:
- เพิ่มส่วนจัดการรูปหมวดหมู่ในบริเวณที่สร้าง/แก้ไขหมวดหมู่
- เพิ่มปุ่ม upload รูปถัดจาก dropdown หมวดหมู่ หรือสร้าง dialog แยกสำหรับจัดการหมวดหมู่ (ชื่อ + รูป)
- Upload ไปที่ storage bucket `product-images` แล้ว update `categories.image_url`

### 2. ตะกร้าสินค้าไม่แสดงราคาผ่อน (ยังไม่เลือกแผน)

**`src/components/WebOrderCart.tsx`**:
- ใน step "cart": ลบการแสดง `monthly` price — แสดงเฉพาะชื่อสินค้า + จำนวน
- ลบ `ยอดผ่อน/เดือน` ที่ footer — แสดงแค่ "ยอดรวม" หรือเฉพาะปุ่ม "ดำเนินการสั่งจอง"
- ใน step "checkout": เพิ่ม UI เลือกแผนผ่อน + วิธีรับสินค้า (เหมือน Checkout.tsx) แล้วแสดงราคาผ่อนตามแผนที่เลือก

**`src/pages/Showcase.tsx`** (LIFF Cart Sheet):
- เหมือนกัน — ลบราคาผ่อนจาก cart items, แสดงราคาผ่อนเฉพาะหลังเลือกแผนใน checkout dialog

### 3. แก้ไขกดไอคอนตะกร้าแล้วเด้งออกจากหน้า /products

**`src/components/HomeNavbar.tsx`**:
- ปัญหา: เมื่อไม่มี `onCartOpen` prop (เช่น จาก ProductDetail) และมี `cartCount` → link ไป `/products` ทำให้ navigate ออก
- แก้: เมื่อไม่มี `onCartOpen` ให้ link ไป `/checkout` แทน (หรือแสดงปุ่มแต่ไม่ navigate) เนื่องจาก ProductDetail ไม่ส่ง `onCartOpen`
- ทางเลือกที่ดีกว่า: ส่ง `onCartOpen` จาก ProductDetail ด้วย โดยเปิด WebOrderCart ใน ProductDetail

### 4. เพิ่ม Rich Text Editor สำหรับรายละเอียดสินค้า

**`src/pages/Products.tsx`**:
- เปลี่ยน `<Textarea>` ของ description เป็น rich text editor
- ใช้ `react-quill` หรือ `tiptap` — แนะนำ `@tiptap/react` เพราะ lightweight และ modern
- รองรับ: text alignment (left/center/right), font size, text color, emoji
- เก็บ HTML ใน `description` field

**`src/pages/ProductDetail.tsx`**:
- เปลี่ยนจาก `<p>{product.description}</p>` เป็น `<div dangerouslySetInnerHTML>` เพื่อ render HTML

**`src/pages/Showcase.tsx`**:
- เหมือนกัน — render description เป็น HTML

### 5. Image Lightbox ในหน้ารายละเอียดสินค้า

**`src/pages/ProductDetail.tsx`**:
- เพิ่ม Dialog/overlay เมื่อกดที่รูปใหญ่ → แสดงรูปขนาดเต็มจอ
- ใช้ Dialog + `max-w-[90vw] max-h-[90vh]` กับ `object-contain`
- รองรับ navigation ซ้าย/ขวาระหว่างรูป

### 6. ปรับ Layout รูปสินค้า (LIFF + Web)

**`src/pages/Showcase.tsx`** (LIFF ProductDetailDialog):
- ลดขนาดรูปหลักจาก `aspect-square` เป็น `aspect-[4/3]` หรือ `max-h-[40vh]`
- ย้าย thumbnails จากด้านล่างมาด้านขวาของรูปหลัก (ใช้ `flex-row`)
- ให้เห็นปุ่ม "เพิ่มลงตะกร้า" โดยไม่ต้องเลื่อนลง
- ปุ่มปิด X ให้ใหญ่ขึ้น + ตำแหน่งชัดเจน

**`src/pages/ProductDetail.tsx`** (Web):
- ย้าย thumbnails จากด้านล่างรูปมาด้านซ้ายเป็นแนวตั้ง (vertical strip)
- รูปหลักอยู่ด้านขวาของ thumbnails

### ไฟล์ที่แก้ไข

| ไฟล์ | การเปลี่ยนแปลง |
|---|---|
| `src/pages/Products.tsx` | เพิ่ม upload รูปหมวดหมู่ + เปลี่ยน description เป็น rich text editor (tiptap) |
| `src/components/WebOrderCart.tsx` | ลบราคาผ่อนจาก cart view, เพิ่มเลือกแผนผ่อน+วิธีรับสินค้าใน checkout step |
| `src/pages/Showcase.tsx` | ลบราคาผ่อนจาก LIFF cart, ปรับ ProductDetailDialog layout (รูปเล็กลง + thumbnails ขวา + ปุ่มปิดชัด), render description เป็น HTML |
| `src/components/HomeNavbar.tsx` | แก้ cart icon fallback ไม่ให้ navigate ไป /products |
| `src/pages/ProductDetail.tsx` | เพิ่ม image lightbox, ปรับ gallery layout (thumbnails แนวตั้งด้านซ้าย), render description เป็น HTML |

### Dependencies ใหม่
- `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-text-align`, `@tiptap/extension-color`, `@tiptap/extension-text-style` — สำหรับ rich text editor

### ไม่มี Database Changes (ใช้ `categories.image_url` และ `products.description` ที่มีอยู่แล้ว)

