

## ระบบ Serial Number (Code 39), พิมพ์ Thermal Printer และ Batch Scanner

### สรุปสิ่งที่จะสร้าง
1. **ระบบ Serial Number** — ผูก Serial Number (Code 39 barcode) กับสินค้าแต่ละชิ้น ติดตามสถานะ (in_stock, sold, damaged)
2. **พิมพ์ฉลาก Thermal Printer** — สร้างฉลากบาร์โค้ด Code 39 แล้วพิมพ์ผ่าน Web Print API (รองรับ thermal printer ทั่วไป)
3. **เช็คสต็อกด้วย Batch Scanner** — หน้าสแกนบาร์โค้ดต่อเนื่อง เทียบกับ serial ในระบบ แสดงผลต่างสต็อก

---

### Database Changes

**ตาราง `serial_numbers` (ใหม่)**
```text
id           uuid PK default gen_random_uuid()
product_id   uuid FK -> products(id) ON DELETE CASCADE
serial_code  text UNIQUE NOT NULL
status       text NOT NULL default 'in_stock'  -- in_stock | sold | damaged
note         text nullable
created_by   uuid nullable
created_at   timestamptz default now()
```

RLS policies:
- authenticated SELECT: true
- authenticated INSERT: auth.uid() = created_by
- authenticated UPDATE: auth.uid() = created_by OR has_role(admin)
- authenticated DELETE: has_role(admin)

---

### Frontend Changes

**1. Serial Number Management (ในหน้า Products)**
- เพิ่มปุ่ม "Serial Numbers" ในแต่ละแถวสินค้า เปิด Dialog แสดงรายการ serial ทั้งหมดของสินค้านั้น
- ฟอร์มเพิ่ม serial: กรอก serial code หรือ auto-generate (prefix + running number)
- เพิ่มทีละหลายรายการ (batch generate): ระบุจำนวน + prefix → สร้าง serial codes อัตโนมัติ
- แสดงสถานะแต่ละ serial (คงเหลือ/ขายแล้ว/ชำรุด) พร้อม badge สี

**2. พิมพ์ฉลากบาร์โค้ด Code 39 (`/serial-print`)**
- เลือกสินค้า → แสดง serial numbers ที่ยังอยู่ในสต็อก
- เลือก serial ที่ต้องการพิมพ์ (เลือกหลายรายการได้)
- Preview ฉลากที่มี: ชื่อสินค้า, Serial Code, บาร์โค้ด Code 39 (render ด้วย Canvas)
- ปุ่ม "พิมพ์" ใช้ `window.print()` กับ CSS `@media print` ปรับขนาดฉลากสำหรับ thermal printer (เช่น 50x25mm)
- ไม่ต้องติดตั้ง library เพิ่ม — Code 39 encoding ง่ายพอที่จะ render เองด้วย Canvas/SVG

**3. เช็คสต็อกด้วย Batch Scanner (`/stock-check`)**
- หน้าใหม่สำหรับเช็คสต็อก (Stock Take / Inventory Check)
- ใช้ `<input autoFocus>` รับค่าจาก barcode scanner (scanner ทำงานเหมือนคีย์บอร์ด พิมพ์แล้ว Enter)
- สแกนต่อเนื่อง: แต่ละครั้งที่สแกน จะเพิ่มรายการในตาราง "สแกนแล้ว" พร้อมเช็คกับ serial ในระบบ
- แสดงสรุป: จำนวนสแกนแล้ว, พบในระบบ, ไม่พบในระบบ, ยังไม่ได้สแกน
- ปุ่ม "เสร็จสิ้นการเช็คสต็อก" → แสดงรายงานผลต่าง (ของที่อยู่ในระบบแต่ไม่ได้สแกน = อาจหาย)

**4. Navigation**
- เพิ่มเมนู "พิมพ์ฉลาก" และ "เช็คสต็อก" ใน sidebar (เมนูหลัก)

---

### Technical Details

**Code 39 Barcode Rendering:**
- Implement a small utility function that encodes a string to Code 39 bar pattern
- Render to Canvas element for both screen display and print
- Characters supported: A-Z, 0-9, -, ., $, /, +, %, SPACE

**Thermal Print Layout:**
- Use `@media print` CSS with fixed label size (configurable)
- Hide all UI chrome during print, show only labels
- Each label: product name (truncated), serial code text, Code 39 barcode image

**Batch Scanner Input:**
- Auto-focus input field, clear after each scan (on Enter/submit)
- Debounce to handle rapid scanning
- Play audio feedback (success/error beep via Web Audio API)
- Show real-time counter and scanned items list

---

### Implementation Order
1. Database migration: create `serial_numbers` table with RLS
2. Create hooks: `useSerialNumbers`, `useCreateSerial`, `useBatchCreateSerials`
3. Add Serial Number dialog to Products page
4. Build Code 39 encoder utility + label print page
5. Build Batch Scanner stock check page
6. Update sidebar navigation

