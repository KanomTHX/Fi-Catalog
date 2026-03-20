

## แผนปรับปรุง — Admin Installment Plans, Product Images/Variants, Product Card UI, Breadcrumb, Order Tracking, Save Order Message

### สรุปงานทั้งหมด

1. **สร้างหน้า Admin จัดการ Installment Plans**
2. **เพิ่มจัดการรูปหลายรูป + Variants ใน Admin Products**
3. **ปรับ Product Card (ProductCatalog)** — เอาราคาขายและปุ่ม +เพิ่มลงตะกร้าออก แสดงแผนผ่อนชำระแทน
4. **ปรับ ProductDetail** — เอา "ผ่อนชำระ 0%" label ออก
5. **แก้ Breadcrumb** — ให้หมวดหมู่กดได้ (filter by category ในหน้า /products)
6. **แก้ Order Tracking** — ใช้ UUID search ที่ทำงานจริง
7. **เพิ่มข้อความ "กรุณาบันทึกเลขใบจอง"** ทั้งใน Checkout (web) และ Showcase (LIFF)
8. **ปรับปรุง LIFF Showcase** — ใช้ product_images gallery, แสดงราคาผ่อน, เอาราคาขายออก

---

### ไม่มี Database Changes — ใช้ตารางที่มีอยู่แล้ว

---

### ไฟล์ที่สร้าง/แก้ไข

| ไฟล์ | การเปลี่ยนแปลง |
|---|---|
| `src/pages/InstallmentPlans.tsx` | **สร้างใหม่** — หน้า Admin CRUD installment plans (เพิ่ม/แก้ไข/ลบ แผนผ่อน, ตั้งค่าเดือน + อัตราดอกเบี้ย + เปิด/ปิด) |
| `src/App.tsx` | เพิ่ม route `/admin/settings/installments` |
| `src/components/AppSidebar.tsx` | เพิ่มเมนู "แผนผ่อนชำระ" ใน admin items |
| `src/pages/Products.tsx` | เพิ่มฟอร์มจัดการรูปสินค้าหลายรูป (สูงสุด 5 รูป) + จัดการ variants (เพิ่ม/ลบ variant_name + variant_value) ใน create/edit dialog |
| `src/components/ProductCatalog.tsx` | เอาราคาขาย + ปุ่ม "เพิ่มลงตะกร้า" ออก, fetch installment_plans, แสดงราคาผ่อนต่อเดือนบน card แทน |
| `src/pages/ProductDetail.tsx` | เอาข้อความ "ผ่อนชำระ 0%" ออก, แก้ Breadcrumb หมวดหมู่ให้กดได้ (link ไป `/products?category=catId`) |
| `src/pages/OrderTracking.tsx` | แก้ search logic — ใช้ `.ilike("id", `%${code}%`)` แทน prefix match, รองรับทั้ง 8 ตัวแรกและ full UUID |
| `src/pages/Checkout.tsx` | เพิ่มข้อความ "⚠️ กรุณาบันทึก/จดเลขใบจองนี้ไว้" ใน success dialog |
| `src/pages/Showcase.tsx` | เพิ่มข้อความ "กรุณาบันทึกเลขใบจอง" ใน order success dialog, fetch product_images ใน ProductDetailDialog แสดง gallery, fetch installment_plans แสดงราคาผ่อนบน card แทนราคาขาย, เอาปุ่ม + ราคาขายออก |

---

### รายละเอียด

**Admin Installment Plans** (`/admin/settings/installments`):
- ตารางแสดง plans ทั้งหมด (เดือน, อัตราดอกเบี้ย, สถานะ)
- ปุ่มเพิ่ม/แก้ไข/ลบ
- Toggle เปิด/ปิด is_active

**Admin Products — รูปหลายรูป + Variants**:
- ใน dialog create/edit เพิ่ม section "รูปสินค้าเพิ่มเติม" — upload ได้สูงสุด 5 รูป จาก `product_images`
- Section "ตัวเลือกสินค้า" — เพิ่ม variant_name + variant_value, ลบได้

**Product Card ใหม่ (ProductCatalog)**:
- ไม่แสดงราคาขาย/ราคาลด
- ไม่มีปุ่ม "เพิ่มลงตะกร้า"
- แสดง "เริ่มต้น ฿X,XXX/เดือน" (ใช้ plan ที่มีจำนวนเดือนมากสุด = ยอดผ่อนต่ำสุด)
- กดที่ card ไปหน้า ProductDetail เหมือนเดิม

**Breadcrumb Fix**:
- หมวดหมู่ใน ProductDetail เปลี่ยนจาก `<span>` เป็น `<Link to={`/products?category=${product.category_id}`}>` 
- PublicProducts อ่าน query param `category` เพื่อ pre-select filter

**Order Tracking Fix**:
- ปัจจุบัน `ilike` บน UUID column มีปัญหาเพราะ input เป็น uppercase แต่ UUID เป็น lowercase
- แก้: แปลง input เป็น lowercase ก่อน search, ใช้ `.ilike("id", `${code.toLowerCase()}%`)`

**Save Order Message**:
- Web Checkout: เพิ่มข้อความเตือน "📌 กรุณาจดหรือ screenshot เลขใบจองนี้ไว้เพื่อตรวจสอบสถานะ" + ปุ่มคัดลอกเลขใบจอง
- LIFF Showcase: เพิ่มข้อความเดียวกันใน order success dialog + ปุ่มคัดลอก

