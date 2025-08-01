import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  ShoppingCart, Package, Truck, CheckCircle, XCircle, 
  Eye, Edit, Search, Filter, Calendar, MapPin, Phone, Mail, Clock,
  Bell, Timer, Navigation, Store, Home, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, apiPost, apiPut } from "@/lib/queryClient";

interface Order {
  id: number;
  customerId: number;
  customerName: string;
  totalAmount: string;
  status: string;
  shippingAddress: string;
  paymentMethod: string;
  phone: string;
  latitude: string;
  longitude: string;
  createdAt: string;
  items?: Array<{
    id: number;
    productId: number;
    quantity: number;
    price: string;
    product?: {
      id: number;
      name: string;
      imageUrl?: string;
      description?: string;
      category?: string;
    };
  }>;
}

interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: string;
  storeId: number;
  product?: {
    id: number;
    name: string;
    imageUrl?: string;
    description?: string;
    category?: string;
  };
}

export default function SellerOrders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);

  // Check authentication and admin approval
  if (!user || user.role !== 'shopkeeper') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              You need to be a shopkeeper to access order management.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.role === 'shopkeeper' && user.status !== 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-center text-yellow-600">Pending Admin Approval</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <p className="text-muted-foreground">
              Your seller account is pending approval from our admin team. You cannot access order management until approved.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/">
                <Button variant="outline">Go to Homepage</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get user's store first
  const { data: stores = [] } = useQuery({
    queryKey: ['/api/stores/owner', user?.id],
    queryFn: () => fetch(`/api/stores/owner/${user?.id}`).then(res => res.json()),
    enabled: !!user?.id,
  });

  const currentStore = stores[0];

  // Orders query with items included
  const { data: orders = [], isLoading: ordersLoading, error: ordersError } = useQuery<Order[]>({
    queryKey: ['/api/orders/store', currentStore?.id],
    queryFn: async () => {
      if (!currentStore?.id) {
        return [];
      }
      
      try {
        const response = await fetch(`/api/orders/store/${currentStore.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            return []; // No orders found
          }
          throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
        }
        
        const ordersData = await response.json();
        console.log('Orders fetched for user:', user.id, 'Count:', ordersData.length);
        
        // Ensure we return an array
        return Array.isArray(ordersData) ? ordersData : [];
      } catch (error) {
        console.error('Order fetch error:', error);
        throw error;
      }
    },
    enabled: !!user?.id && user.role === 'shopkeeper' && user.status === 'active',
    retry: 2,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Order items query
  const { data: orderItems, isLoading: itemsLoading } = useQuery<OrderItem[]>({
    queryKey: ['/api/order-items', selectedOrder?.id],
    queryFn: () => fetch(`/api/order-items?orderId=${selectedOrder?.id}`).then(res => res.json()),
    enabled: !!selectedOrder?.id,
  });

  // Order status update mutation  
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      return await apiPut(`/api/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders/store'] });
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      });
    },
  });

  // Notification mutation for delivery partners
  const notifyDeliveryPartnerMutation = useMutation({
    mutationFn: async ({ orderId, message, isAssigned }: { orderId: number; message: string; isAssigned: boolean }) => {
      return await apiPost('/api/delivery-partners/notify', {
        orderId,
        message,
        isAssigned,
        storeId: currentStore?.id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Delivery partners notified successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to notify delivery partners",
        variant: "destructive",
      });
    },
  });

  const handleOrderStatusUpdate = (orderId: number, status: string) => {
    updateOrderStatusMutation.mutate({ orderId, status });
  };

  const handleNotifyDeliveryPartner = (orderId: number, message: string, isAssigned: boolean) => {
    notifyDeliveryPartnerMutation.mutate({ orderId, message, isAssigned });
  };

  const handleStatusChange = (orderId: number, newStatus: string) => {
    updateOrderStatusMutation.mutate({ orderId, status: newStatus });
  };

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderDetailOpen(true);
  };

  // Filter orders
  const filteredOrders = orders?.filter((order) => {
    const matchesSearch = 
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm) ||
      order.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'processing': return 'default';
      case 'shipped': return 'outline';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600';
      case 'processing': return 'text-blue-600';
      case 'shipped': return 'text-purple-600';
      case 'delivered': return 'text-green-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const statusCounts = orders?.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 sm:py-4 gap-3 sm:gap-0">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">Order Management</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Track and manage customer orders</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
              <Link href="/seller/dashboard" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto text-sm">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Order Status Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Pending</CardTitle>
              <Package className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold text-yellow-600">{statusCounts.pending || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Processing</CardTitle>
              <Package className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold text-blue-600">{statusCounts.processing || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Shipped</CardTitle>
              <Truck className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold text-purple-600">{statusCounts.shipped || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Delivered</CardTitle>
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold text-green-600">{statusCounts.delivered || 0}</div>
            </CardContent>
          </Card>

          <Card className="col-span-2 sm:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Cancelled</CardTitle>
              <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold text-red-600">{statusCounts.cancelled || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-4 sm:mb-6">
          <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by customer name, order ID, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Management */}
        <Card>
          <CardHeader>
            <CardTitle>Order Management</CardTitle>
          </CardHeader>
          <CardContent>
            {ordersError ? (
              <div className="text-center py-8">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 mb-4">Failed to load orders</p>
                <Button 
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/orders/store'] })}
                  variant="outline"
                >
                  Retry
                </Button>
              </div>
            ) : ordersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-500">Loading orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">Order #{order.id}</h3>
                        <p className="text-sm text-muted-foreground">
                          {order.customerName} • {order.phone}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="font-semibold text-lg">
                          ₹{Number(order.totalAmount).toLocaleString()}
                        </p>
                        <div className="flex gap-2">
                          <Select
                            value={order.status}
                            onValueChange={(value) =>
                              handleOrderStatusUpdate(order.id, value)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">
                                Pending
                              </SelectItem>
                              <SelectItem value="processing">
                                Processing
                              </SelectItem>
                              <SelectItem value="ready_for_pickup">
                                Ready for Pickup
                              </SelectItem>
                              <SelectItem value="assigned_for_delivery">
                                Assigned for Delivery
                              </SelectItem>
                              <SelectItem value="shipped">
                                Shipped
                              </SelectItem>
                              <SelectItem value="delivered">
                                Delivered
                              </SelectItem>
                              <SelectItem value="cancelled">
                                Cancelled
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* First-Accept-First-Serve Delivery System */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {order.status !== "assigned_for_delivery" &&
                            order.status !== "delivered" &&
                            order.status !== "cancelled" && (
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => {
                                    handleNotifyDeliveryPartner(
                                      order.id,
                                      `🚚 New Order Available: Order #${order.id} from ${currentStore?.name}. Customer: ${order.customerName}. Total: ₹${order.totalAmount}. First to accept gets delivery!`,
                                      false,
                                    );
                                  }}
                                  className="bg-orange-600 hover:bg-orange-700 text-white"
                                >
                                  <Bell className="h-4 w-4 mr-2" />
                                  Send to All Partners (First Accept)
                                </Button>
                              </div>
                            )}

                          {order.status === "assigned_for_delivery" && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 w-full">
                              <p className="text-sm text-green-700 font-medium">
                                ✅ Delivery partner assigned and notified
                              </p>
                              <p className="text-xs text-green-600 mt-1">
                                Order is being processed for delivery
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    {order.items && order.items.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium mb-2">Order Items:</p>
                        <div className="space-y-2">
                          {order.items.slice(0, 3).map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-sm">
                              <span>{item.product?.name || `Product #${item.productId}`}</span>
                              <span>{item.quantity} × ₹{Number(item.price).toFixed(2)}</span>
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{order.items.length - 3} more items
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Order Actions */}
                    <div className="mt-4 pt-4 border-t flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openOrderDetail(order)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={isOrderDetailOpen} onOpenChange={setIsOrderDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Order Details - #{selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList>
                <TabsTrigger value="details">Order Details</TabsTrigger>
                <TabsTrigger value="shipping">Shipping Info</TabsTrigger>
                <TabsTrigger value="items">Order Items</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Customer Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p><strong>Name:</strong> {selectedOrder.customerName}</p>
                        <p><strong>Phone:</strong> {selectedOrder.phone}</p>
                        <p><strong>Payment:</strong> {selectedOrder.paymentMethod}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p><strong>Total Amount:</strong> ₹{parseFloat(selectedOrder.totalAmount).toLocaleString()}</p>
                        <p><strong>Status:</strong> 
                          <Badge className="ml-2" variant={getStatusBadgeVariant(selectedOrder.status)}>
                            {selectedOrder.status}
                          </Badge>
                        </p>
                        <p><strong>Order Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="shipping" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Shipping Address</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="flex items-start">
                        <MapPin className="h-4 w-4 mr-2 mt-1" />
                        {selectedOrder.shippingAddress}
                      </p>
                      {selectedOrder.latitude && selectedOrder.longitude && (
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const googleMapsUrl = `https://www.google.com/maps?q=${selectedOrder.latitude},${selectedOrder.longitude}`;
                              window.open(googleMapsUrl, '_blank');
                            }}
                            className="w-fit"
                          >
                            <MapPin className="h-4 w-4 mr-2" />
                            View on Google Maps
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            Coordinates: {selectedOrder.latitude}, {selectedOrder.longitude}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="items" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Order Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {itemsLoading ? (
                      <p>Loading order items...</p>
                    ) : (
                      <div className="space-y-3">
                        {itemsLoading ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-gray-500">Loading order items...</p>
                          </div>
                        ) : orderItems && orderItems.length > 0 ? (
                          orderItems.map((item) => (
                            <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                              {/* Product Image */}
                              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center relative">
                                {item.product?.imageUrl ? (
                                  <>
                                    <img 
                                      src={item.product.imageUrl} 
                                      alt={item.product.name || 'Product'}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.classList.add('hidden');
                                        const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                                        if (fallback) fallback.classList.remove('hidden');
                                      }}
                                    />
                                    <Package className="fallback-icon h-8 w-8 text-gray-400 absolute inset-0 m-auto hidden" />
                                  </>
                                ) : (
                                  <Package className="h-8 w-8 text-gray-400" />
                                )}
                              </div>
                              
                              {/* Product Details */}
                              <div className="flex-1">
                                <p className="font-medium text-base">
                                  {item.product?.name || `Product #${item.productId}`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Quantity: {item.quantity} × ₹{parseFloat(item.price).toFixed(2)}
                                </p>
                                {item.product?.description && (
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    {item.product.description}
                                  </p>
                                )}
                                {item.product?.category && (
                                  <p className="text-xs text-blue-600 mt-1">
                                    Category: {item.product.category}
                                  </p>
                                )}
                                {!item.product && (
                                  <p className="text-xs text-red-500 mt-1">
                                    Product details unavailable
                                  </p>
                                )}
                              </div>
                              
                              {/* Price Details */}
                              <div className="text-right">
                                <p className="font-medium text-lg">₹{(parseFloat(item.price) * item.quantity).toLocaleString()}</p>
                                <p className="text-sm text-muted-foreground">
                                  Unit Price: ₹{parseFloat(item.price).toFixed(2)}
                                </p>
                                <p className="text-xs text-green-600">
                                  Qty: {item.quantity}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No items found in this order</p>
                            <p className="text-xs text-gray-400 mt-2">
                              This order may have been created before product details were properly linked.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}