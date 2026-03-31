import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

function useBanners() {
  return useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("sort_order")
        .limit(10);
      if (error) throw error;
      return data as Array<{
        id: string;
        title: string;
        subtitle: string | null;
        image_url: string | null;
        link_url: string | null;
      }>;
    },
    staleTime: 60_000,
    retry: 2,
  });
}

export function PromoBanners() {
  const { data: banners, isLoading } = useBanners();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Skeleton className="h-48 sm:h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!banners || banners.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mx-auto max-w-7xl px-4 py-8 sm:py-12"
    >
      <Carousel className="w-full" opts={{ loop: true }}>
        <CarouselContent>
          {banners.map((b) => (
            <CarouselItem key={b.id}>
              <a
                href={b.link_url || "#"}
                className="block relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 to-accent/40 group"
              >
                <div className="flex flex-col sm:flex-row items-center min-h-[200px] sm:min-h-[280px]">
                  <div className="flex-1 p-6 sm:p-10 space-y-3">
                    <h3 className="text-xl sm:text-3xl font-bold text-foreground font-heading">{b.title}</h3>
                    {b.subtitle && (
                      <p className="text-muted-foreground text-sm sm:text-base">{b.subtitle}</p>
                    )}
                  </div>
                  {b.image_url && (
                    <div className="flex-1 flex justify-center p-4">
                      <img
                        src={b.image_url}
                        alt={b.title}
                        className="max-h-[180px] sm:max-h-[240px] object-contain group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
              </a>
            </CarouselItem>
          ))}
        </CarouselContent>
        {banners.length > 1 && (
          <>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </>
        )}
      </Carousel>
    </motion.section>
  );
}
