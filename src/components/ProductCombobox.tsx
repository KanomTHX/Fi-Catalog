import { useState, useRef, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  sku?: string | null;
}

interface ProductComboboxProps {
  products: Product[];
  value: string;
  onSelect: (productId: string) => void;
  placeholder?: string;
}

export function ProductCombobox({ products, value, onSelect, placeholder = "ค้นหาสินค้า..." }: ProductComboboxProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedProduct = products.find((p) => p.id === value);

  const filtered = useMemo(() => {
    if (!query.trim()) return products.slice(0, 20);
    const q = query.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q)
    ).slice(0, 20);
  }, [products, query]);

  const handleSelect = (id: string) => {
    onSelect(id);
    setQuery("");
    setOpen(false);
  };

  const handleFocus = () => {
    setOpen(true);
    if (selectedProduct) {
      setQuery("");
    }
  };

  const handleBlur = () => {
    // Delay to allow click on item
    setTimeout(() => setOpen(false), 150);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={open ? query : (selectedProduct ? `${selectedProduct.name}${selectedProduct.sku ? ` (${selectedProduct.sku})` : ''}` : query)}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={cn(selectedProduct && !open && "text-foreground")}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-md shadow-md max-h-60 overflow-y-auto">
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              className={cn(
                "w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                p.id === value && "bg-accent/50 font-medium"
              )}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(p.id); }}
            >
              <span>{p.name}</span>
              {p.sku && <span className="ml-2 text-muted-foreground font-mono text-xs">({p.sku})</span>}
            </button>
          ))}
        </div>
      )}
      {open && query && filtered.length === 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-md shadow-md p-3 text-sm text-muted-foreground text-center">
          ไม่พบสินค้า
        </div>
      )}
    </div>
  );
}
