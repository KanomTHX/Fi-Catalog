import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface HomeNavbarProps {
  siteName: string;
  logoUrl: string | null;
  cartCount: number;
  onCartOpen?: () => void;
}

const navLinks = [
  { label: "หน้าแรก", href: "/" },
  { label: "สินค้า", href: "/products" },
  { label: "ตรวจสอบใบจอง", href: "/order-tracking" },
  { label: "เกี่ยวกับเรา", href: "/about" },
  { label: "ติดต่อ", href: "/contact" },
];

export function HomeNavbar({ siteName, logoUrl, cartCount, onCartOpen }: HomeNavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/85 backdrop-blur-xl shadow-lg border-b border-primary/25"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="h-10 w-10 rounded-xl object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm font-heading">
                {siteName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="text-lg font-bold text-foreground font-heading">{siteName}</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                to={l.href}
                className={`text-sm font-medium transition-colors duration-300 ${
                  location.pathname === l.href ? "text-primary" : "text-muted-foreground hover:text-primary"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {onCartOpen && (
              <Button variant="outline" size="icon" className="relative border-primary/30 hover:border-primary" onClick={onCartOpen}>
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
                    {cartCount}
                  </Badge>
                )}
              </Button>
            )}
            {!onCartOpen && cartCount > 0 && (
              <Link to="/checkout">
                <Button variant="outline" size="icon" className="relative border-primary/30 hover:border-primary">
                  <ShoppingBag className="h-5 w-5" />
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
                    {cartCount}
                  </Badge>
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/95 backdrop-blur-xl border-b border-primary/20"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  to={l.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-300 ${
                    location.pathname === l.href ? "text-primary bg-accent" : "text-muted-foreground hover:text-primary hover:bg-accent"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
