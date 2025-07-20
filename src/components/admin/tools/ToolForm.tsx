import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAsyncAction, useApi } from '@/hooks/useApi';
import { apiService } from '@/services/api';

interface Tool {
  _id?: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  price: number;
  description: string;
  fullDescription?: string;
  specifications?: any;
  features?: string[];
  inStock: number;
  totalStock: number;
}

interface ToolFormProps {
  tool?: Tool | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const brands = ['Bosch', 'DeWalt', 'Makita', 'Metabo', 'Milwaukee', 'Ryobi'];

export function ToolForm({ tool, isOpen, onClose, onSuccess }: ToolFormProps) {
  const [formData, setFormData] = useState<Partial<Tool>>({
    name: '',
    brand: '',
    category: '',
    subcategory: '',
    price: 0,
    description: '',
    fullDescription: '',
    inStock: 0,
    totalStock: 0,
    features: [],
    specifications: {}
  });

  const { data: categories } = useApi(() => apiService.getCategories());
  const { execute: createTool, loading: createLoading } = useAsyncAction(apiService.createTool);
  const { execute: updateTool, loading: updateLoading } = useAsyncAction(apiService.updateTool);

  const loading = createLoading || updateLoading;

  useEffect(() => {
    if (tool) {
      setFormData({
        name: tool.name,
        brand: tool.brand,
        category: tool.category,
        subcategory: tool.subcategory,
        price: tool.price,
        description: tool.description,
        fullDescription: tool.fullDescription || '',
        inStock: tool.inStock,
        totalStock: tool.totalStock,
        features: tool.features || [],
        specifications: tool.specifications || {}
      });
    } else {
      setFormData({
        name: '',
        brand: '',
        category: '',
        subcategory: '',
        price: 0,
        description: '',
        fullDescription: '',
        inStock: 0,
        totalStock: 0,
        features: [],
        specifications: {}
      });
    }
  }, [tool]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const toolData = {
      ...formData,
      features: typeof formData.features === 'string' 
        ? formData.features.split(',').map(f => f.trim()) 
        : formData.features,
      specifications: {
        power: formData.specifications?.power || '',
        weight: formData.specifications?.weight || '',
        voltage: '230V',
        warranty: '2 года'
      }
    };

    let result;
    if (tool?._id) {
      result = await updateTool(tool._id, toolData);
    } else {
      result = await createTool(toolData);
    }

    if (result) {
      onSuccess();
      onClose();
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSpecificationChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [field]: value
      }
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {tool ? 'Редактировать инструмент' : 'Добавить новый инструмент'}
          </DialogTitle>
          <DialogDescription>
            {tool ? 'Изменение информации об инструменте' : 'Заполните информацию о новом инструменте для каталога'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название инструмента</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Перфоратор Bosch..."
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="brand">Бренд</Label>
              <Select value={formData.brand} onValueChange={(value) => handleInputChange('brand', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите бренд" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map(brand => (
                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Категория</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.data?.map((category: any) => (
                    <SelectItem key={category.name} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subcategory">Подкатегория</Label>
              <Input
                id="subcategory"
                value={formData.subcategory}
                onChange={(e) => handleInputChange('subcategory', e.target.value)}
                placeholder="Перфораторы, Дрели..."
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price">Цена за день (₽)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', Number(e.target.value))}
                placeholder="1200"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="inStock">Количество на складе</Label>
              <Input
                id="inStock"
                type="number"
                value={formData.inStock}
                onChange={(e) => handleInputChange('inStock', Number(e.target.value))}
                placeholder="5"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="totalStock">Общее количество</Label>
              <Input
                id="totalStock"
                type="number"
                value={formData.totalStock}
                onChange={(e) => handleInputChange('totalStock', Number(e.target.value))}
                placeholder="5"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="power">Мощность</Label>
              <Input
                id="power"
                value={formData.specifications?.power || ''}
                onChange={(e) => handleSpecificationChange('power', e.target.value)}
                placeholder="1500W"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="weight">Вес</Label>
              <Input
                id="weight"
                value={formData.specifications?.weight || ''}
                onChange={(e) => handleSpecificationChange('weight', e.target.value)}
                placeholder="5.8кг"
              />
            </div>
            
            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Краткое описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Краткое описание инструмента..."
                rows={2}
                required
              />
            </div>
            
            <div className="col-span-2 space-y-2">
              <Label htmlFor="fullDescription">Полное описание</Label>
              <Textarea
                id="fullDescription"
                value={formData.fullDescription}
                onChange={(e) => handleInputChange('fullDescription', e.target.value)}
                placeholder="Подробное описание инструмента..."
                rows={4}
              />
            </div>
            
            <div className="col-span-2 space-y-2">
              <Label htmlFor="features">Особенности (через запятую)</Label>
              <Input
                id="features"
                value={Array.isArray(formData.features) ? formData.features.join(', ') : formData.features}
                onChange={(e) => handleInputChange('features', e.target.value)}
                placeholder="SDS-Max, Антивибрация, Регулировка оборотов"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? 'Сохранение...' : (tool ? 'Сохранить изменения' : 'Добавить инструмент')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}