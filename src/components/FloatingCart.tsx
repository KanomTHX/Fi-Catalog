import { useCart } from "@/contexts/CartContext";
import { useNavigate, useLocation } from "react-router-dom";
import { ShoppingBag, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

const hiddenPaths = ["/checkout", "/admin"];

export function FloatingCart() {
  const { items, cartCount, removeItem } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const isHidden = hiddenPaths.some((p) => location.pathname.startsWith(p));

  return (
    <AnimatePresence>
      {!isHidden && cartCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-primary/20 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
        >
          <div className="mx-auto max-w-7xl px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Items preview */}
              <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide">
                {items.map((item) => (
                  <div key={item.id} className="shrink-0 flex items-center gap-2 bg-muted/50 rounded-lg px-2 py-1.5 border border-border">
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="h-8 w-8 rounded object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                        <ShoppingBag className="h-3 w-3 text-muted-foreground/40" />
                      </div>
                    )}
                    <span className="text-xs font-medium max-w-[80px] truncate">{item.name}</span>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1">{item.quantity}</Badge>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                      className="h-4 w-4 rounded-full bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center transition-colors"
                    >
                      <X className="h-2.5 w-2.5 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Cart action */}
              <Button size="sm" className="shrink-0 gap-1.5" onClick={() => navigate("/checkout")}>
                <ShoppingBag className="h-4 w-4" />
                <span className="hidden sm:inline">ดูตะกร้า</span>
                <Badge className="bg-primary-foreground text-primary h-5 px-1.5 text-xs">{cartCount}</Badge>
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
