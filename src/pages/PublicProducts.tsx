import { useState } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { HomeNavbar } from "@/components/HomeNavbar";
import { ProductCatalog } from "@/components/ProductCatalog";
import { WebOrderCart } from "@/components/WebOrderCart";
import { useCart } from "@/contexts/CartContext";

export default function PublicProducts() {
  const { data: settings } = useSiteSettings();
  const { items, addToCart, updateQty, removeItem, clearCart, cartCount } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const siteName = settings?.site_name || "AKK Furniture";
  const logoUrl = settings?.logo_url || null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <HomeNavbar siteName={siteName} logoUrl={logoUrl} cartCount={cartCount} onCartOpen={() => setCartOpen(true)} />

      <div className="pt-20 sm:pt-24">
        <ProductCatalog onAddToCart={addToCart} />
      </div>

      <footer className="border-t border-border bg-foreground text-background">
        <div className="mx-auto max-w-7xl px-4 py-8 text-center text-sm text-background/50">
          © {new Date().getFullYear()} {siteName}
        </div>
      </footer>

      <WebOrderCart
        open={cartOpen}
        onOpenChange={setCartOpen}
        items={items}
        onUpdate={updateQty}
        onRemove={removeItem}
        onClear={clearCart}
      />
    </div>
  );
}
