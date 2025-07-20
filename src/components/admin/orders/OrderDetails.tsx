import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Order {
  _id: string;
  orderNumber: string;
  customerInfo: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    company?: string;
  };
  items: Array<{
    toolName: string;
    quantity: number;
    days: number;
    pricePerDay: number;
    total: number;
  }>;
  startDate: string;
  endDate: string;
  status: string;
  total: number;
  deposit: number;
  notes?: string;
  deliveryInfo?: {
    address: string;
    timeSlot: string;
  };
}

interface OrderDetailsProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderDetails({ order, isOpen, onClose }: OrderDetailsProps) {
  if (!order) return null;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { text: 'Ожидает', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { text: 'Подтверждён', color: 'bg-blue-100 text-blue-800' },
      active: { text: 'Активный', color: 'bg-green-100 text-green-800' },
      completed: { text: 'Завершён', color: 'bg-gray-100 text-gray-800' },
      cancelled: { text: 'Отменён', color: 'bg-red-100 text-red-800' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Детали заказа {order.orderNumber}</DialogTitle>
          <DialogDescription>
            Полная информация о заказе и клиенте
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Информация о клиенте</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Имя клиента</Label>
                  <p className="mt-1">{order.customerInfo.firstName} {order.customerInfo.lastName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Телефон</Label>
                  <p className="mt-1">{order.customerInfo.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="mt-1">{order.customerInfo.email}</p>
                </div>
                {order.customerInfo.company && (
                  <div>
                    <Label className="text-sm font-medium">Компания</Label>
                    <p className="mt-1">{order.customerInfo.company}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Детали заказа</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Дата начала</Label>
                    <p className="mt-1">{formatDate(order.startDate)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Дата окончания</Label>
                    <p className="mt-1">{formatDate(order.endDate)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Статус</Label>
                    <div className="mt-1">{getStatusBadge(order.status)}</div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Tools List */}
                <div>
                  <Label className="text-sm font-medium">Арендованные инструменты</Label>
                  <div className="mt-2 space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{item.toolName}</p>
                          <p className="text-sm text-gray-600">
                            Количество: {item.quantity} | Дней: {item.days}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">₽{item.total.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">₽{item.pricePerDay}/день</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                {/* Delivery Info */}
                {order.deliveryInfo && (
                  <>
                    <div>
                      <Label className="text-sm font-medium">Информация о доставке</Label>
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm">Адрес: {order.deliveryInfo.address}</p>
                        <p className="text-sm">Время: {order.deliveryInfo.timeSlot}</p>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}
                
                {/* Financial Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Общая сумма</Label>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      ₽{order.total.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Залог</Label>
                    <p className="text-2xl font-bold text-orange-600 mt-1">
                      ₽{order.deposit.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                {/* Notes */}
                {order.notes && (
                  <div>
                    <Label className="text-sm font-medium">Примечания</Label>
                    <p className="mt-1 p-3 bg-gray-50 rounded-lg">{order.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Закрыть
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            Редактировать заказ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}