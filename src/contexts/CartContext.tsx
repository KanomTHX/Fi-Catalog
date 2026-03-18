import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";

export interface CartItem {
  id: string;
  name: string;
  image_url: string | null;
  price: number;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: { id: string; name: string; image_url: string | null; selling_price: number | null; discount_price: number | null }) => void;
  updateQty: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  cartCount: number;
  total: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  const addToCart = useCallback((product: { id: string; name: string; image_url: string | null; selling_price: number | null; discount_price: number | null }) => {
    const price = product.discount_price || product.selling_price || 0;
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { id: product.id, name: product.name, image_url: product.image_url, price, quantity: 1 }];
    });
    toast({ title: "เพิ่มสินค้าลงตะกร้าแล้ว", description: product.name });
  }, [toast]);

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty <= 0) { setItems((p) => p.filter((i) => i.id !== id)); return; }
    setItems((p) => p.map((i) => i.id === id ? { ...i, quantity: qty } : i));
  }, []);

  const removeItem = useCallback((id: string) => setItems((p) => p.filter((i) => i.id !== id)), []);
  const clearCart = useCallback(() => setItems([]), []);
  const cartCount = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, updateQty, removeItem, clearCart, cartCount, total }}>
      {children}
    </CartContext.Provider>
  );
}
