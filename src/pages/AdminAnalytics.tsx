import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { RevenueChart } from '@/components/admin/analytics/RevenueChart';
import { CategoryStats } from '@/components/admin/analytics/CategoryStats';
import { useApi } from '@/hooks/useApi';
import { apiService } from '@/services/api';

const AdminAnalytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const { data: statsData, loading: statsLoading } = useApi(() => apiService.getOrderStatistics());
  const { data: popularToolsData } = useApi(() => apiService.getPopularTools(10));
  const { data: categoriesData } = useApi(() => apiService.getCategories());

  // Генерируем данные для графика доходов на основе реальной статистики
  const revenueData = useMemo(() => {
    if (!statsData?.data?.revenueByMonth) return [];
    
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    return Object.entries(statsData.data.revenueByMonth).map(([key, revenue]) => {
      const [year, month] = key.split('-');
      return {
        month: months[parseInt(month) - 1],
        revenue: revenue as number,
        orders: Math.floor((revenue as number) / 3000) // Примерный расчет количества заказов
      };
    });
  }, [statsData]);

  // Генерируем статистику по категориям
  const categoryStats = useMemo(() => {
    if (!categoriesData?.data || !statsData?.data) return [];
    
    const totalRevenue = statsData.data.totalRevenue || 1;
    return categoriesData.data.map((category: any, index: number) => {
      const share = [65, 15, 12, 8][index] || 5; // Примерные доли
      const revenue = Math.floor(totalRevenue * (share / 100));
      return {
        name: category.name,
        share,
        revenue,
        orders: Math.floor(revenue / 3000)
      };
    });
  }, [categoriesData, statsData]);

  const topTools = popularToolsData?.data || [];

  const financialKPIs = useMemo(() => {
    const stats = statsData?.data || {};
    return [
      { 
        name: 'Общая выручка', 
        value: `₽${(stats.totalRevenue || 0).toLocaleString()}`, 
        change: '+12.5%', 
        positive: true 
      },
      { 
        name: 'Средний чек', 
        value: `₽${(stats.averageOrderValue || 0).toLocaleString()}`, 
        change: '+8.2%', 
        positive: true 
      },
      { 
        name: 'Всего заказов', 
        value: (stats.total || 0).toString(), 
        change: '+15.3%', 
        positive: true 
      },
      { 
        name: 'Завершённые заказы', 
        value: (stats.completed || 0).toString(), 
        change: '+22.1%', 
        positive: true 
      }
    ];
  }, [statsData]);

  if (statsLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <Icon name="Loader2" className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Аналитика и отчёты</h1>
          <p className="text-gray-600">Подробная статистика по доходам и использованию</p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Неделя</SelectItem>
            <SelectItem value="month">Месяц</SelectItem>
            <SelectItem value="quarter">Квартал</SelectItem>
            <SelectItem value="year">Год</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="revenue">Доходы</TabsTrigger>
          <TabsTrigger value="tools">Инструменты</TabsTrigger>
          <TabsTrigger value="customers">Клиенты</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {financialKPIs.map((kpi, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {kpi.name}
                  </CardTitle>
                  <Icon 
                    name={kpi.positive ? 'TrendingUp' : 'TrendingDown'} 
                    size={16} 
                    className={kpi.positive ? 'text-green-600' : 'text-red-600'} 
                  />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <p className={`text-xs mt-1 ${kpi.positive ? 'text-green-600' : 'text-red-600'}`}>
                    {kpi.change} с прошлого периода
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Revenue Chart Simulation */}
          {revenueData.length > 0 && <RevenueChart data={revenueData} />}
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Revenue */}
            {categoryStats.length > 0 && <CategoryStats data={categoryStats} />}

            {/* Top Performing Tools */}
            <Card>
              <CardHeader>
                <CardTitle>Топ инструментов по доходам</CardTitle>
                <CardDescription>
                  Самые прибыльные позиции каталога
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topTools.slice(0, 5).map((tool: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{tool.name}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-600">{tool.totalRentals} аренд</span>
                          <span className="text-xs">★ {tool.rating}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">₽{tool.totalRevenue.toLocaleString()}</p>
                        <Badge variant="secondary" className="text-xs">
                          #{index + 1}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Анализ использования инструментов</CardTitle>
              <CardDescription>
                Подробная статистика по каждому инструменту
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Инструмент</TableHead>
                    <TableHead>Аренды</TableHead>
                    <TableHead>Доход</TableHead>
                    <TableHead>Загрузка</TableHead>
                    <TableHead>Рейтинг</TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topTools.map((tool, index) => {
                    const utilizationRate = Math.min((tool.totalRentals / 200) * 100, 100);
                    
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{tool.name}</TableCell>
                        <TableCell>{tool.totalRentals}</TableCell>
                        <TableCell>₽{tool.totalRevenue.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Progress value={utilizationRate} className="h-2" />
                            <span className="text-xs text-gray-600">{utilizationRate.toFixed(1)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Icon name="Star" size={12} className="text-yellow-400 fill-current" />
                            <span>{tool.rating}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={utilizationRate > 70 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                          >
                            {utilizationRate > 70 ? 'Высокая' : 'Средняя'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Метрики клиентов</CardTitle>
                <CardDescription>
                  Ключевые показатели работы с клиентами
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.floor((statsData?.data?.total || 0) * 1.5)}
                    </div>
                    <div className="text-sm text-gray-600">Всего клиентов</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.floor((statsData?.data?.total || 0) * 0.1)}
                    </div>
                    <div className="text-sm text-gray-600">Новых за месяц</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">67%</div>
                    <div className="text-sm text-gray-600">Возвращаются</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {((statsData?.data?.averageOrderValue || 0) / 1000).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Аренд на клиента</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalytics;