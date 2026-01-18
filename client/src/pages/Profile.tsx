import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Package, ShoppingBag } from "lucide-react";
import { Redirect } from "wouter";

export default function Profile() {
  const { user, isLoading } = useAuth();

  // Fetch user orders (filtered on backend by user ID typically, here utilizing list endpoint but relying on backend to filter or we filter client side if needed, but schema implies orders are tied to user)
  const { data: orders, isLoading: isOrdersLoading } = useQuery({
    queryKey: [api.orders.list.path], // Assumes endpoint returns current user's orders
    queryFn: async () => {
      const res = await fetch(api.orders.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return api.orders.list.responses[200].parse(await res.json());
    },
    enabled: !!user,
  });

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!user) return <Redirect to="/" />;

  const myOrders = orders?.filter((o: any) => o.userId === user.id) || [];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* User Sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <div className="w-24 h-24 mx-auto rounded-full overflow-hidden bg-muted mb-4 border-2 border-primary/10">
                {user.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-muted-foreground">
                    {user.firstName?.[0]}
                  </div>
                )}
              </div>
              <CardTitle>{user.firstName} {user.lastName}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Orders List */}
        <div className="md:col-span-3">
          <h2 className="font-display font-bold text-2xl mb-6 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6" /> Order History
          </h2>

          {isOrdersLoading ? (
            <Loader2 className="animate-spin mx-auto" />
          ) : myOrders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No orders yet</p>
                <p className="text-muted-foreground">Start shopping to see your orders here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {myOrders.map((order: any) => (
                <Card key={order.id} className="overflow-hidden">
                  <div className="bg-muted/30 p-4 flex flex-wrap justify-between items-center border-b">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Order #{order.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: "long" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-bold">
                        {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(order.total)}
                      </p>
                      <Badge variant={order.status === "delivered" ? "default" : "outline"}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="p-4 flex gap-4 items-center">
                          <div className="w-16 h-16 bg-muted rounded border overflow-hidden">
                             {/* Assuming item structure includes product info, or just placeholder if joined */}
                             {item.product?.imageUrl && <img src={item.product.imageUrl} className="w-full h-full object-cover" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{item.product?.name || `Product #${item.productId}`}</p>
                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-sm font-medium">
                            {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(item.price)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
