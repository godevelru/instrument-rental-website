import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OrdersStatsProps {
  stats: {
    total: number;
    pending: number;
    active: number;
    completed: number;
    totalRevenue: number;
  };
}

export function OrdersStats({ stats }: OrdersStatsProps) {
  const statCards = [
    {
      title: 'Всего заказов',
      value: stats.total,
      color: 'text-gray-900'
    },
    {
      title: 'Ожидают',
      value: stats.pending,
      color: 'text-yellow-600'
    },
    {
      title: 'Активные',
      value: stats.active,
      color: 'text-green-600'
    },
    {
      title: 'Завершённые',
      value: stats.completed,
      color: 'text-gray-600'
    },
    {
      title: 'Общая выручка',
      value: `₽${stats.totalRevenue.toLocaleString()}`,
      color: 'text-blue-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}