

## แผนปรับปรุง — ลบราคาขายสด, ฟิลเตอร์สี/วัสดุ, ตะกร้าถาวร, ระบบสมาชิกลูกค้า

### 1. ลบราคาขายสดออกจากระบบ + บังคับมีราคาผ่อนก่อนสั่งจอง

**`src/pages/Products.tsx`**:
- ลบคอลัมน์ "ราคาขาย" ออกจาก Table Header + TableBody (line 249, 268)
- ลบ `selling_price` ออกจาก `emptyForm` และ `openEdit`

**`src/pages/ProductDetail.tsx`**:
- ปุ่ม "เพิ่มใส่ตะกร้า" และ "ซื้อเลย" → disable ถ้าไม่มี `productInstallmentPrices` หรือ length === 0
- แสดงข้อความ "กรุณาติดต่อร้านเพื่อสอบถามราคา" ถ้าไม่มีราคาผ่อน

**`src/components/ProductCatalog.tsx`**:
- ลบ `selling_price`, `discount_price` ออกจาก Product interface และ query select
- ลบ `formatPrice` ที่ใช้กับ selling_price

**`src/pages/Checkout.tsx`**:
- ลบการแสดง `item.price` (ราคาขายสด) ในรายการสินค้า
- ลบ "รวมทั้งหมด" ที่คำนวณจาก selling_price
- บังคับเลือกแผนผ่อนก่อนกดจอง (ถ้าไม่เลือกแผน → disable ปุ่มจอง)

**`src/components/WebOrderCart.tsx`**:
- ลบการแสดงราคาต่อชิ้น (item.price) ในตะกร้า
- ลบ total ที่คำนวณจาก price

### 2. เพิ่มฟิลเตอร์สีและวัสดุ

**`src/components/ProductCatalog.tsx`**:
- เพิ่ม `color`, `material` ใน Product interface + query select
- สร้าง `allColors` และ `allMaterials` useMemo (เหมือน `allBrands`)
- เพิ่ม state: `selectedColors`, `selectedMaterials`
- เพิ่ม checkbox filter ใน Desktop sidebar (ต่อจาก Brands)
- เพิ่ม checkbox filter ใน Mobile Sheet (ต่อจาก Brands)
- เพิ่ม filter logic ใน `filtered` useMemo
- อัปเดต `hasActiveFilter` ให้รวม colors/materials
- อัปเดตปุ่ม "ล้างตัวกรอง" ให้ reset colors/materials ด้วย

### 3. Popup ตะกร้าสินค้าถาวรด้านล่าง (ทุกหน้า)

**สร้างไฟล์ใหม่ `src/components/FloatingCart.tsx`**:
- Component แสดง bar ด้านล่างจอ (fixed bottom) เมื่อมีสินค้าในตะกร้า
- แสดงจำนวนสินค้า + ปุ่ม "ดูตะกร้า" → navigate to `/checkout`
- ใช้ `useCart()` → แสดงเมื่อ `cartCount > 0`
- AnimatePresence slide up/down

**`src/App.tsx`**:
- เพิ่ม `<FloatingCart />` ภายใน `<CartProvider>` ให้แสดงทุกหน้า (public routes)
- ไม่แสดงในหน้า `/admin/*` และ `/checkout`

### 4. ระบบสมาชิกลูกค้า + Google Auth + Customer Portal

**สร้าง customer auth page `src/pages/CustomerAuth.tsx`**:
- หน้า Login/Signup สำหรับลูกค้า (แยกจาก Admin Auth)
- รองรับ Email + Password + Google OAuth (ใช้ `lovable.auth.signInWithOAuth("google")`)
- Redirect กลับหน้าเดิมหลัง login

**สร้าง `src/contexts/CustomerAuthContext.tsx`**:
- Context แยกสำหรับลูกค้า (ใช้ Supabase Auth เดียวกัน แต่ไม่ต้อง check admin role)
- เก็บ user, session, loading, signOut
- Link กับ `customers` table (ถ้ามี record ที่ match email)

**สร้าง `src/pages/CustomerPortal.tsx`**:
- หน้า Dashboard ลูกค้า: แสดงรายการคำสั่งจอง + สถานะ + ยอดผ่อน
- แสดง profile (ชื่อ, เบอร์, ที่อยู่) + แก้ไขได้
- ดึง orders ผ่าน `customers` table (match auth email/phone)

**`src/components/HomeNavbar.tsx`**:
- เพิ่มปุ่ม "สมัครสมาชิก / เข้าสู่ระบบ" ข้างปุ่มตะกร้า (ด้านขวาบน)
- ถ้า login แล้ว → แสดง Avatar + dropdown (โปรไฟล์, คำสั่งจองของฉัน, ออกจากระบบ)

**`src/pages/Checkout.tsx`**:
- เพิ่ม Banner เชิญชวนสมัครสมาชิกก่อนกดจอง: "สมัครสมาชิกเพื่อติดตามสถานะใบจอง"
- ถ้า login แล้ว → auto-fill ชื่อ/เบอร์จาก customer profile
- Link order กับ customer auth user

**`src/App.tsx`**:
- เพิ่ม routes: `/auth` (customer auth), `/my-orders` (customer portal)
- Wrap ด้วย CustomerAuthContext

### Database Changes

```sql
-- เพิ่ม auth_user_id ใน customers เพื่อ link กับ Supabase Auth
ALTER TABLE public.customers ADD COLUMN auth_user_id uuid DEFAULT NULL;
CREATE INDEX idx_customers_auth_user_id ON public.customers(auth_user_id);
```

### ไฟล์ที่แก้ไข/สร้าง

| ไฟล์ | การเปลี่ยนแปลง |
|---|---|
| `src/pages/Products.tsx` | ลบคอลัมน์ราคาขาย |
| `src/components/ProductCatalog.tsx` | ลบ selling_price, เพิ่มฟิลเตอร์สี/วัสดุ |
| `src/pages/ProductDetail.tsx` | disable ปุ่มจองถ้าไม่มีราคาผ่อน |
| `src/pages/Checkout.tsx` | ลบราคาขายสด, บังคับเลือกแผนผ่อน, banner สมัครสมาชิก |
| `src/components/WebOrderCart.tsx` | ลบราคาขายสดจากตะกร้า |
| `src/components/FloatingCart.tsx` | **ใหม่** — popup ตะกร้าถาวรด้านล่าง |
| `src/pages/CustomerAuth.tsx` | **ใหม่** — หน้า Login/Signup ลูกค้า + Google |
| `src/contexts/CustomerAuthContext.tsx` | **ใหม่** — Context สำหรับ auth ลูกค้า |
| `src/pages/CustomerPortal.tsx` | **ใหม่** — หน้า Dashboard ลูกค้า |
| `src/components/HomeNavbar.tsx` | เพิ่มปุ่มสมัคร/เข้าสู่ระบบ + Avatar dropdown |
| `src/App.tsx` | เพิ่ม routes + FloatingCart + CustomerAuthContext |

