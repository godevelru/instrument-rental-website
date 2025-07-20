import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface QuickActionsProps {
  onSectionChange: (section: string) => void;
}

export function QuickActions({ onSectionChange }: QuickActionsProps) {
  const actions = [
    {
      title: "Добавить инструмент",
      icon: "Plus",
      action: () => onSectionChange('tools')
    },
    {
      title: "Новый заказ",
      icon: "FileText",
      action: () => onSectionChange('orders')
    },
    {
      title: "Клиенты",
      icon: "Users",
      action: () => onSectionChange('customers')
    },
    {
      title: "Настройки",
      icon: "Settings",
      action: () => onSectionChange('settings')
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Быстрые действия</CardTitle>
        <CardDescription>
          Часто используемые функции администратора
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {actions.map((action, index) => (
            <Button 
              key={index}
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={action.action}
            >
              <Icon name={action.icon as any} size={24} />
              <span className="text-sm">{action.title}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}