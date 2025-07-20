import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar
} from '@/components/ui/sidebar';
import Icon from '@/components/ui/icon';
import { DashboardStats } from '@/components/admin/DashboardStats';
import { QuickActions } from '@/components/admin/QuickActions';
import { useApi } from '@/hooks/useApi';
import { apiService } from '@/services/api';

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isDarkMode: boolean;
  onThemeToggle: () => void;
}

const menuItems = [
  {
    title: "Главная",
    icon: "Home",
    id: "dashboard"
  },
  {
    title: "Инструменты",
    icon: "Wrench",
    id: "tools"
  },
  {
    title: "Заказы",
    icon: "ShoppingCart",
    id: "orders"
  },
  {
    title: "Аналитика",
    icon: "BarChart3",
    id: "analytics"
  },
  {
    title: "Клиенты",
    icon: "Users",
    id: "customers"
  },
  {
    title: "Настройки",
    icon: "Settings",
    id: "settings"
  }
];

export function AdminSidebar({ activeSection, onSectionChange, isDarkMode, onThemeToggle }: AdminSidebarProps) {
  const { data: statsData } = useApi(() => apiService.getOrderStatistics());
  
  const quickStats = [
    { label: "Активные заказы", value: statsData?.data?.active?.toString() || "0", color: "text-blue-600" },
    { label: "Новые заказы", value: statsData?.data?.pending?.toString() || "0", color: "text-green-600" },
    { label: "Завершённые", value: statsData?.data?.completed?.toString() || "0", color: "text-orange-600" }
  ];

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <Icon name="Wrench" className="h-6 w-6" />
          <span className="font-bold">RentTools Admin</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Навигация</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onSectionChange(item.id)}
                    isActive={activeSection === item.id}
                  >
                    <Icon name={item.icon as any} />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Быстрая статистика</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-4 space-y-3">
              {quickStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <span className={`font-bold ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Настройки</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-4 py-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Тёмная тема</span>
                <Switch checked={isDarkMode} onCheckedChange={onThemeToggle} />
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            АП
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Админ Панель</span>
            <span className="truncate text-xs text-muted-foreground">admin@renttools.ru</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <SidebarTrigger className="fixed top-4 left-4 z-40 md:hidden" />
        {children}
      </div>
    </SidebarProvider>
  );
}

import { ThemeProvider, useTheme } from '@/hooks/useTheme';

const AdminPanelContent = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const { isDarkMode, toggleTheme } = useTheme();

  const renderDashboard = () => (
    <div className="p-6 space-y-6">
      <DashboardStats onSectionChange={setActiveSection} />
      <QuickActions onSectionChange={setActiveSection} />
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboard();
      case 'tools':
        return (
          <div className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Переходим к полнофункциональному управлению инструментами</p>
            <Button onClick={() => window.location.href = '/admin/tools'}>
              Открыть управление инструментами
            </Button>
          </div>
        );
      case 'orders':
        return (
          <div className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Переходим к управлению заказами</p>
            <Button onClick={() => window.location.href = '/admin/orders'}>
              Открыть управление заказами
            </Button>
          </div>
        );
      case 'analytics':
        return (
          <div className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Переходим к детальной аналитике</p>
            <Button onClick={() => window.location.href = '/admin/analytics'}>
              Открыть аналитику
            </Button>
          </div>
        );
      case 'customers':
        return (
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle>Управление клиентами</CardTitle>
                <CardDescription>Информация о клиентах и их активности</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Раздел в разработке...</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'settings':
        return (
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle>Настройки системы</CardTitle>
                <CardDescription>Конфигурация и параметры приложения</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Тёмная тема</h4>
                      <p className="text-sm text-muted-foreground">Переключение между светлой и тёмной темой</p>
                    </div>
                    <Button variant="outline" onClick={toggleTheme}>
                      <Icon name={isDarkMode ? "Sun" : "Moon"} className="h-4 w-4 mr-2" />
                      {isDarkMode ? 'Светлая' : 'Тёмная'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return renderDashboard();
    }
  };

  return (
    <AdminLayout>
      <AdminSidebar 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isDarkMode={isDarkMode}
        onThemeToggle={toggleTheme}
      />
      <div className="flex-1">
        {renderContent()}
      </div>
    </AdminLayout>
  );
};

const AdminPanel = () => {
  return (
    <ThemeProvider defaultTheme="light" storageKey="admin-theme">
      <AdminPanelContent />
    </ThemeProvider>
  );
};

export default AdminPanel;