import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useApi } from '@/hooks/useApi';
import { apiService } from '@/services/api';

interface DashboardStatsProps {
  onSectionChange: (section: string) => void;
}

export function DashboardStats({ onSectionChange }: DashboardStatsProps) {
  const { data: stats, loading } = useApi(() => apiService.getOrderStatistics());
  const { data: popularTools } = useApi(() => apiService.getPopularTools(5));

  const statsCards = [
    {
      title: 'Общая выручка',
      value: stats?.totalRevenue ? `₽${stats.totalRevenue.toLocaleString()}` : '₽0',
      change: '+12.5%',
      icon: 'TrendingUp',
      color: 'text-green-600'
    },
    {
      title: 'Активные заказы',
      value: stats?.active?.toString() || '0',
      change: '+8.2%',
      icon: 'ShoppingCart',
      color: 'text-blue-600'
    },
    {
      title: 'Всего заказов',
      value: stats?.total?.toString() || '0',
      change: '+15.3%',
      icon: 'Package',
      color: 'text-orange-600'
    },
    {
      title: 'Завершённые заказы',
      value: stats?.completed?.toString() || '0',
      change: '+22.1%',
      icon: 'CheckCircle',
      color: 'text-purple-600'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon name={stat.icon as any} size={20} className={stat.color} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-green-600 mt-1">
                {stat.change} с прошлого месяца
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Popular Tools */}
      {popularTools && (
        <Card>
          <CardHeader>
            <CardTitle>Популярные инструменты</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {popularTools.data?.slice(0, 5).map((tool: any, index: number) => (
                <div key={tool._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary">#{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{tool.name}</p>
                      <p className="text-sm text-gray-600">{tool.brand}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">₽{tool.price}/день</p>
                    <p className="text-sm text-gray-600">{tool.totalRentals} аренд</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}