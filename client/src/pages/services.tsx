import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import type { Product } from "@shared/schema";

export default function Services() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const activeProducts = products?.filter(p => p.isActive);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold mb-2">Available Services</h1>
        <p className="text-muted-foreground">
          Browse support services and resources available to you
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading services...
        </div>
      ) : !activeProducts || activeProducts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No services available yet</h3>
            <p className="text-muted-foreground">
              Check back soon for available support services
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activeProducts.map((product) => (
            <Card key={product.id} className="hover-elevate" data-testid={`card-service-${product.id}`}>
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Package className="w-12 h-12 text-primary" />
              </div>
              <CardHeader>
                <div className="space-y-2">
                  <Badge variant="secondary" className="w-fit">
                    {product.productType}
                  </Badge>
                  <CardTitle className="text-xl">{product.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {product.description}
                </p>
                {product.pricing && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-semibold text-primary">{product.pricing}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
