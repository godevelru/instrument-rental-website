import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { ToolsTable } from '@/components/admin/tools/ToolsTable';
import { ToolForm } from '@/components/admin/tools/ToolForm';
import { ToolsFilters } from '@/components/admin/tools/ToolsFilters';
import { useApi } from '@/hooks/useApi';
import { apiService } from '@/services/api';

const AdminToolsManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTool, setEditingTool] = useState(null);

  const { data: toolsData, loading, refetch } = useApi(() => 
    apiService.getTools({ 
      search: searchQuery || undefined,
      category: selectedCategory !== 'all' ? selectedCategory : undefined 
    })
  );
  
  const { data: categoriesData } = useApi(() => apiService.getCategories());

  const tools = toolsData?.data?.tools || [];
  const categories = categoriesData?.data?.map((cat: any) => cat.name) || [];

  const handleEditTool = (tool: Tool) => {
    setEditingTool(tool);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTool(null);
  };

  const handleFormSuccess = () => {
    refetch();
  };

  // Обновляем данные при изменении фильтров
  useEffect(() => {
    refetch();
  }, [searchQuery, selectedCategory]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Управление инструментами</h1>
          <p className="text-gray-600">Полный контроль над каталогом инструментов</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => {
            setEditingTool(null);
            setIsFormOpen(true);
          }}
        >
          <Icon name="Plus" size={16} className="mr-2" />
          Добавить инструмент
        </Button>
      </div>

      {/* Filters */}
      <ToolsFilters
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        onSearchChange={setSearchQuery}
        onCategoryChange={setSelectedCategory}
        categories={categories}
      />

      {/* Tools Table */}
      <Card>
        <CardHeader>
          <CardTitle>Каталог инструментов ({tools.length})</CardTitle>
          <CardDescription>
            Управление всеми инструментами в системе
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Icon name="Loader2" className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <ToolsTable
              tools={tools}
              onEdit={handleEditTool}
              onRefresh={refetch}
            />
          )}
        </CardContent>
      </Card>

      {/* Tool Form Dialog */}
      <ToolForm
        tool={editingTool}
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default AdminToolsManagement;