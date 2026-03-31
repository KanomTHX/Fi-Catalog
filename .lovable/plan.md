
แผนแก้ไขรอบนี้จะโฟกัสที่ “ต้นเหตุร่วม” ก่อน เพราะอาการเกิดทั้ง Preview และ Published และทุกหน้า public ค้างเป็น skeleton เหมือนกัน

1. แก้ shared auth/provider ที่น่าจะทำให้ query public ค้างทั้งแอป
- ไฟล์หลัก: `src/contexts/CustomerAuthContext.tsx`
- ตอนนี้ `onAuthStateChange` เป็น async และ `await fetchCustomer(...)` อยู่ใน callback ซึ่งเสี่ยงทำให้ auth/session restore ค้าง และลากให้ query public ไม่เริ่มหรือ pending ยาว
- จะ refactor ให้ callback ไม่ await อะไรเลย:
  - set `session` / `user` ก่อน
  - ถ้ามี user ให้เรียก `void fetchCustomer(...)`
  - ตั้ง `loading`/`isReady` ให้จบจาก `getSession()` อย่างชัดเจน
- ถ้าจำเป็นจะปรับ `src/contexts/AuthContext.tsx` ให้ใช้ pattern เดียวกันเพื่อให้ behavior สม่ำเสมอ

2. ทำให้ public pages ไม่ผูกชะตากับ auth initialization
- ตรวจและปรับ query ในหน้า public ให้สามารถวิ่งได้แม้ customer session ยังไม่พร้อม
- จุดที่เกี่ยวข้อง:
  - `src/hooks/useSiteSettings.ts`
  - `src/components/ProductCatalog.tsx`
  - `src/components/ProductSearchBar.tsx`
  - `src/components/PromoBanners.tsx`
  - `src/pages/ProductDetail.tsx`
- เป้าหมายคือ ถ้า auth ยัง restore อยู่ หน้า public ต้องยังโหลดข้อมูลจาก backend ได้ตามปกติ

3. ทำ fallback/error state ให้ทุกหน้า public
- ตอนนี้หลายหน้ามีแต่ loading state หรือ fallback เงียบ ๆ
- จะเพิ่ม handling ให้ชัดเจน:
  - `/products` แยก `products` ออกจาก `installment prices` ต่อไป
  - `/`, `/about`, `/contact` ถ้า settings โหลดไม่ได้ ให้มี error/empty state ชัดเจน แทนการดูเหมือนค้าง
  - `/products/:id` เปลี่ยนจุดที่เสี่ยงจาก `.single()` เป็น `.maybeSingle()` แล้วแสดง “ไม่พบสินค้า” ให้ถูกต้อง

4. เก็บงานความสอดคล้องของ query public
- ใส่รูปแบบเดียวกันทุกจุด:
  - `throw error` เมื่อ query พลาด
  - ใช้ `data ?? []` / `maybeSingle()`
  - เพิ่ม `retry` แบบจำกัดใน public queries
  - ไม่ให้ query รอง เช่น ราคาผ่อน หรือ search suggestions ทำให้หน้าหลักดูเหมือนพังทั้งหน้า

5. ตรวจผลกระทบหลังแก้
- หน้าเป้าหมายที่ต้องกลับมาทำงาน:
  - `/`
  - `/products`
  - `/about`
  - `/contact`
  - `/products/:id`
- จะเน้นให้ “สินค้าขึ้นก่อน” และ “ข้อมูลร้านขึ้นก่อน” แม้ customer auth ยังไม่มี session

ไฟล์ที่คาดว่าจะต้องแก้
- `src/contexts/CustomerAuthContext.tsx`
- `src/contexts/AuthContext.tsx`
- `src/hooks/useSiteSettings.ts`
- `src/components/ProductCatalog.tsx`
- `src/components/ProductSearchBar.tsx`
- `src/components/PromoBanners.tsx`
- `src/pages/ProductDetail.tsx`
- อาจรวม `src/pages/Home.tsx`, `src/pages/About.tsx`, `src/pages/Contact.tsx` ถ้าต้องเพิ่ม error/empty UI

รายละเอียดเทคนิค
- จากโค้ดและอาการตอนนี้ ปัญหาไม่น่าใช่ RLS หรือไม่มีข้อมูลในฐานข้อมูล
- จุดเสี่ยงที่สุดคือ auth event callback ที่ยิง query ซ้อนแบบ await ใน `CustomerAuthContext`
- การแก้รอบนี้จะเริ่มจาก provider ก่อน แล้วค่อยเก็บ query/fallback ของ public pages เพื่อไม่ให้เกิดอาการ skeleton ค้างทั้งระบบอีก
