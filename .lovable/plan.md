

## แผนการปรับปรุง 3 ส่วน

### 1. Auto-generate Barcode เมื่อรับสินค้าเข้า (Stock-In)

**แนวทาง:** เมื่อ `useCreateMovement` สร้าง stock movement แบบ `type: "in"` สำเร็จ → เช็คว่าสินค้านั้นมี `barcode` หรือยัง ถ้ายังไม่มี → auto-generate barcode แล้ว update กลับไปที่ `products` table

- **รูปแบบ Barcode:** ใช้ prefix `SF` + timestamp-based running number เช่น `SF20260310001` (Code 39 compatible)
- **แก้ไข `src/hooks/useStockMovements.ts`:** ใน `onSuccess` ของ `useCreateMovement` เมื่อ type เป็น `in` → query product ดูว่ามี barcode ไหม ถ้าไม่มีให้ generate แล้ว update
- **แก้ไข `src/pages/StockIn.tsx`:** แสดง barcode ที่ auto-generate ในประวัติ หรือแจ้ง toast ว่าสร้าง barcode อัตโนมัติแล้ว

---

### 2. แสดงรายละเอียดเพิ่มเติมในตารางสินค้า

**แก้ไข `src/pages/Products.tsx`:**
- เพิ่มคอลัมน์ **แบรนด์**, **ตำแหน่ง**, **น้ำหนัก** ในตาราง
- แสดง barcode ด้วย (ที่ auto-generate มา)
- ปรับ responsive: ซ่อนบางคอลัมน์บนมือถือ ด้วย `hidden md:table-cell`

---

### 3. ออกแบบหน้า /showcase ใหม่ให้สวยงาม

**เขียนใหม่ `src/pages/Showcase.tsx`** ด้วย:
- **Hero Section:** gradient background + ชื่อร้าน + search bar แบบ floating
- **Category pills** พร้อม animation เมื่อเลือก (framer-motion)
- **Product cards** ที่มี hover effects: scale up, shadow, image zoom
- **Product detail modal** เมื่อกดที่สินค้า → แสดงรูปใหญ่ + รายละเอียด + ราคา ในรูปแบบ dialog/drawer
- **Staggered animation** สำหรับ product grid ใช้ framer-motion `motion.div` กับ delay ต่อ item
- **Skeleton loading** ที่ดูดีขึ้นพร้อม shimmer effect
- **Gradient text** สำหรับหัวข้อ ใช้ `.text-gradient` class ที่มีอยู่แล้ว
- **Footer** ที่สวยขึ้นพร้อม gradient line

---

### ไฟล์ที่แก้ไข
1. `src/hooks/useStockMovements.ts` — เพิ่ม auto-generate barcode logic
2. `src/pages/Products.tsx` — เพิ่มคอลัมน์รายละเอียด
3. `src/pages/Showcase.tsx` — redesign ทั้งหน้า
4. `src/pages/StockIn.tsx` — แสดง barcode ในประวัติ (minor)

