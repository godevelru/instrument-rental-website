import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { OrdersTable } from '@/components/admin/orders/OrdersTable';
import { OrderDetails } from '@/components/admin/orders/OrderDetails';
import { OrdersStats } from '@/components/admin/orders/OrdersStats';
import { useApi } from '@/hooks/useApi';
import { apiService } from '@/services/api';

const AdminOrdersManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { data: ordersData, loading, refetch } = useApi(() => 
    apiService.getOrders({
      status: statusFilter !== 'all' ? statusFilter : undefined
    })
  );

  const { data: statsData } = useApi(() => apiService.getOrderStatistics());

  const orders = ordersData?.data?.orders || [];
  const stats = statsData?.data || {
    total: 0,
    pending: 0,
    active: 0,
    completed: 0,
    totalRevenue: 0
  };

  const filteredOrders = orders.filter((order: any) => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         `${order.customerInfo.firstName} ${order.customerInfo.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.customerInfo.phone.includes(searchQuery);
    
    return matchesSearch;
  });

  const handleOrderSelect = (order: any) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  // Обновляем данные при изменении фильтров
  useEffect(() => {
    refetch();
  }, [statusFilter]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Управление заказами</h1>
          <p className="text-gray-600">Контроль всех заказов и бронирований</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Icon name="Plus" size={16} className="mr-2" />
          Создать заказ
        </Button>
      </div>

      {/* Statistics Cards */}
      <OrdersStats stats={stats} />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Поиск по номеру заказа, имени клиента или телефону..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Все статусы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="pending">Ожидает</SelectItem>
                <SelectItem value="confirmed">Подтверждён</SelectItem>
                <SelectItem value="active">Активный</SelectItem>
                <SelectItem value="completed">Завершён</SelectItem>
                <SelectItem value="cancelled">Отменён</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Список заказов ({filteredOrders.length})</CardTitle>
          <CardDescription>
            Все заказы с возможностью управления статусами
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Icon name="Loader2" className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <OrdersTable
              orders={filteredOrders}
              onOrderSelect={handleOrderSelect}
              onRefresh={refetch}
            />
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <OrderDetails
        order={selectedOrder}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    </div>
  );
};

export default AdminOrdersManagement;