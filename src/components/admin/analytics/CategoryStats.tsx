import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface CategoryData {
  name: string;
  share: number;
  revenue: number;
  orders: number;
}

interface CategoryStatsProps {
  data: CategoryData[];
}

export function CategoryStats({ data }: CategoryStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Доходы по категориям</CardTitle>
        <CardDescription>
          Распределение выручки по типам инструментов
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((category, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{category.name}</span>
              <span className="text-sm text-gray-600">{category.share}%</span>
            </div>
            <Progress value={category.share} className="h-2" />
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>₽{category.revenue.toLocaleString()}</span>
              <span>{category.orders} заказов</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}