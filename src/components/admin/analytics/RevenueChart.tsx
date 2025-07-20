import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface RevenueData {
  month: string;
  revenue: number;
  orders: number;
}

interface RevenueChartProps {
  data: RevenueData[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const maxRevenue = Math.max(...data.map(d => d.revenue));
  const currentMonth = data[data.length - 1];
  const previousMonth = data[data.length - 2];
  const growthRate = previousMonth 
    ? ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue * 100).toFixed(1)
    : '0';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Динамика доходов по месяцам</CardTitle>
        <CardDescription>
          Рост выручки: +{growthRate}% за последний месяц
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => {
            const percentage = (item.revenue / maxRevenue) * 100;
            
            return (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-12 text-sm font-medium">{item.month}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">₽{item.revenue.toLocaleString()}</span>
                    <span className="text-xs text-gray-600">{item.orders} заказов</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}