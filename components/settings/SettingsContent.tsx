'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, User, Palette, Tags, Download, Plus, Trash2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { updateProfile, exportUserData } from '@/lib/actions/profile';
import { getCategories, createCategory, deleteCategory, createSubcategory, deleteSubcategory } from '@/lib/actions/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DEFAULT_CATEGORY_COLORS } from '@/lib/types';
import type { Profile, Category } from '@/lib/types';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface SettingsContentProps {
  profile: Profile | null;
}

export function SettingsContent({ profile }: SettingsContentProps) {
  const { theme, setTheme } = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'receita' | 'despesa'>('despesa');
  const [newCategoryColor, setNewCategoryColor] = useState('#6366f1');
  const [isExporting, setIsExporting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: profile?.full_name ?? '' },
  });

  const loadCategories = async () => {
    const result = await getCategories();
    setCategories(result.data as Category[]);
  };

  useEffect(() => { loadCategories(); }, []);

  const onSubmitProfile = async (data: ProfileFormValues) => {
    const result = await updateProfile({ full_name: data.full_name });
    if (result.success) {
      toast.success('Perfil atualizado!');
    } else {
      toast.error('Erro ao atualizar perfil.');
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = await exportUserData();
      if (!data) { toast.error('Erro ao exportar dados.'); return; }
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `money99_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Dados exportados com sucesso!');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) { toast.error('Informe o nome da categoria.'); return; }
    const result = await createCategory({
      name: newCategoryName.trim(),
      type: newCategoryType,
      color: newCategoryColor,
      icon: 'tag',
    });
    if (result.success) {
      toast.success('Categoria criada!');
      setNewCategoryName('');
      loadCategories();
    } else {
      toast.error(result.error ?? 'Erro ao criar categoria.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const result = await deleteCategory(id);
    if (result.success) {
      toast.success('Categoria removida.');
      loadCategories();
    } else {
      toast.error('Não é possível remover categorias padrão ou com transações vinculadas.');
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground text-sm">Gerencie seu perfil e preferências</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile"><User className="mr-2 h-4 w-4" />Perfil</TabsTrigger>
          <TabsTrigger value="appearance"><Palette className="mr-2 h-4 w-4" />Aparência</TabsTrigger>
          <TabsTrigger value="categories"><Tags className="mr-2 h-4 w-4" />Categorias</TabsTrigger>
          <TabsTrigger value="data"><Download className="mr-2 h-4 w-4" />Dados</TabsTrigger>
        </TabsList>

        {/* Perfil */}
        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>Atualize seus dados cadastrais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                    {getInitials(profile?.full_name ?? null)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{profile?.full_name ?? 'Usuário'}</p>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                </div>
              </div>
              <Separator />
              <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome completo</Label>
                  <Input id="full_name" {...register('full_name')} />
                  {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input value={profile?.email ?? ''} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado aqui.</p>
                </div>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : 'Salvar Alterações'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aparência */}
        <TabsContent value="appearance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Tema</CardTitle>
              <CardDescription>Escolha como o Money99 aparece para você</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      theme === t ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <div className={`w-10 h-8 rounded-md ${
                      t === 'light' ? 'bg-white border' : t === 'dark' ? 'bg-slate-900' : 'bg-gradient-to-r from-white to-slate-900'
                    }`} />
                    <span className="text-sm font-medium capitalize">
                      {t === 'light' ? 'Claro' : t === 'dark' ? 'Escuro' : 'Sistema'}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categorias */}
        <TabsContent value="categories" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Categorias Personalizadas</CardTitle>
              <CardDescription>Crie e gerencie suas categorias de transações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Criar nova categoria */}
              <div className="flex flex-wrap gap-3 p-4 border rounded-xl bg-muted/30">
                <Input
                  placeholder="Nome da categoria"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 min-w-40"
                />
                <Select value={newCategoryType} onValueChange={(v) => setNewCategoryType(v as 'receita' | 'despesa')}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="despesa">Despesa</SelectItem>
                    <SelectItem value="receita">Receita</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-1.5">
                  {DEFAULT_CATEGORY_COLORS.slice(0, 8).map(color => (
                    <button
                      key={color}
                      onClick={() => setNewCategoryColor(color)}
                      className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${newCategoryColor === color ? 'ring-2 ring-offset-1 ring-foreground' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <Button onClick={handleCreateCategory} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar
                </Button>
              </div>

              {/* Lista de categorias */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Categorias de Despesa</h3>
                {categories.filter(c => c.type === 'despesa' || c.type === 'ambos').map(cat => (
                  <CategoryRow key={cat.id} category={cat} onDelete={() => handleDeleteCategory(cat.id)} />
                ))}
              </div>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Categorias de Receita</h3>
                {categories.filter(c => c.type === 'receita').map(cat => (
                  <CategoryRow key={cat.id} category={cat} onDelete={() => handleDeleteCategory(cat.id)} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dados */}
        <TabsContent value="data" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Exportar Dados</CardTitle>
              <CardDescription>Baixe todos os seus dados em formato JSON</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Exporte um backup completo com todas as suas transações, contas, categorias, orçamentos e metas.
              </p>
              <Button onClick={handleExportData} disabled={isExporting} variant="outline">
                {isExporting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Exportando...</>
                ) : (
                  <><Download className="mr-2 h-4 w-4" />Exportar Backup JSON</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CategoryRow({ category, onDelete }: { category: Category; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50">
      <div className="flex items-center gap-2.5">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
        <span className="text-sm font-medium">{category.name}</span>
        {category.is_default && (
          <Badge variant="outline" className="text-xs py-0 px-1.5 h-4">padrão</Badge>
        )}
      </div>
      {!category.is_default && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
