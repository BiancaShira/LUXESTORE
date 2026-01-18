import { useCart } from "@/hooks/use-cart";
import { useCreateOrder } from "@/hooks/use-orders";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Lock, Smartphone, CreditCard } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

const checkoutSchema = z.object({
  paymentMethod: z.enum(["mpesa", "card"]),
  phoneNumber: z.string().optional(),
  cardNumber: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
}).refine((data) => {
  if (data.paymentMethod === "mpesa" && !data.phoneNumber) return false;
  if (data.paymentMethod === "card" && !data.cardNumber) return false;
  return true;
}, {
  message: "Required payment details missing",
  path: ["paymentMethod"],
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const { items, cartTotal, clearCart } = useCart();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { mutate: createOrder, isPending } = useCreateOrder();
  const [, setLocation] = useLocation();

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: "mpesa",
      name: user ? `${user.firstName} ${user.lastName}` : "",
    },
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthLoading && !user) {
      // In a real app we'd redirect to login with a "next" param
      window.location.href = "/api/login"; 
    }
  }, [user, isAuthLoading]);

  // Redirect if empty cart
  useEffect(() => {
    if (items.length === 0) {
      setLocation("/shop");
    }
  }, [items, setLocation]);

  if (isAuthLoading || !user) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  const onSubmit = (data: CheckoutForm) => {
    const orderItems = items.map(item => ({
      productId: item.product.id,
      quantity: item.quantity
    }));

    createOrder({
      items: orderItems,
      paymentMethod: data.paymentMethod,
      paymentPhoneNumber: data.phoneNumber
    }, {
      onSuccess: () => {
        clearCart();
        setLocation("/profile"); // Redirect to orders page
      }
    });
  };

  const paymentMethod = form.watch("paymentMethod");

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="font-display font-bold text-3xl mb-8">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Shipping Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                  <CardDescription>Secure payment processing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                              <FormControl>
                                <RadioGroupItem value="mpesa" />
                              </FormControl>
                              <FormLabel className="flex-1 cursor-pointer font-normal">
                                <div className="flex items-center gap-2">
                                  <Smartphone className="w-5 h-5 text-green-600" />
                                  <span className="font-medium">M-Pesa</span>
                                </div>
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                              <FormControl>
                                <RadioGroupItem value="card" />
                              </FormControl>
                              <FormLabel className="flex-1 cursor-pointer font-normal">
                                <div className="flex items-center gap-2">
                                  <CreditCard className="w-5 h-5 text-blue-600" />
                                  <span className="font-medium">Card (Stripe)</span>
                                </div>
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {paymentMethod === "mpesa" && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                      <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>M-Pesa Phone Number</FormLabel>
                            <FormControl><Input placeholder="2547..." {...field} /></FormControl>
                            <p className="text-xs text-muted-foreground">We'll send an STK push to this number.</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {paymentMethod === "card" && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                      <FormField
                        control={form.control}
                        name="cardNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Card Number (Mock)</FormLabel>
                            <FormControl><Input placeholder="4242 4242 4242 4242" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Button type="submit" size="lg" className="w-full text-lg h-14" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    Pay {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(cartTotal)}
                    <Lock className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 bg-muted/30">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.product.name}</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(cartTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
