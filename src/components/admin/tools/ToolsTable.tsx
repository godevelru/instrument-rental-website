import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Icon from '@/components/ui/icon';
import { useAsyncAction } from '@/hooks/useApi';
import { apiService } from '@/services/api';

interface Tool {
  _id: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  price: number;
  images: string[];
  isActive: boolean;
  inStock: number;
  totalRentals: number;
  totalRevenue: number;
  rating: number;
  reviewCount: number;
}

interface ToolsTableProps {
  tools: Tool[];
  onEdit: (tool: Tool) => void;
  onRefresh: () => void;
}

export function ToolsTable({ tools, onEdit, onRefresh }: ToolsTableProps) {
  const { execute: deleteTool, loading: deleteLoading } = useAsyncAction(apiService.deleteTool);
  const { execute: updateTool } = useAsyncAction(apiService.updateTool);

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { text: 'Нет в наличии', color: 'bg-red-100 text-red-800' };
    if (stock <= 2) return { text: 'Мало', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'В наличии', color: 'bg-green-100 text-green-800' };
  };

  const handleDelete = async (id: string) => {
    const result = await deleteTool(id);
    if (result) {
      onRefresh();
    }
  };

  const toggleAvailability = async (tool: Tool) => {
    const result = await updateTool(tool._id, { isActive: !tool.isActive });
    if (result) {
      onRefresh();
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Инструмент</TableHead>
            <TableHead>Категория</TableHead>
            <TableHead>Цена/день</TableHead>
            <TableHead>Склад</TableHead>
            <TableHead>Статистика</TableHead>
            <TableHead>Доступность</TableHead>
            <TableHead>Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tools.map((tool) => {
            const stockStatus = getStockStatus(tool.inStock);
            return (
              <TableRow key={tool._id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <img 
                      src={tool.images[0] || '/img/5e130715-b755-4ab5-82af-c9e448995766.jpg'} 
                      alt={tool.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-medium">{tool.name}</p>
                      <p className="text-sm text-gray-600">{tool.brand}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{tool.category}</p>
                    <p className="text-sm text-gray-600">{tool.subcategory}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-bold">₽{tool.price.toLocaleString()}</span>
                </TableCell>
                <TableCell>
                  <div>
                    <Badge className={stockStatus.color}>
                      {stockStatus.text}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-1">{tool.inStock} шт.</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>Аренд: {tool.totalRentals}</p>
                    <p>Доход: ₽{tool.totalRevenue.toLocaleString()}</p>
                    <p className="text-gray-600">
                      {tool.rating > 0 ? `★ ${tool.rating} (${tool.reviewCount})` : 'Нет отзывов'}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={tool.isActive}
                    onCheckedChange={() => toggleAvailability(tool)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(tool)}
                    >
                      <Icon name="Edit" size={14} />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" disabled={deleteLoading}>
                          <Icon name="Trash2" size={14} className="text-red-600" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Удалить инструмент?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Это действие нельзя отменить. Инструмент "{tool.name}" будет удален из каталога.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(tool._id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Удалить
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}