import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProductGroupModal } from "@/components/products/ProductGroupModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProductGroup {
  id: string;
  nome: string;
  estoque_minimo_default: number;
  created_at: string;
  product_count?: number;
}

const ProductGroups = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string>();
  const { toast } = useToast();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      
      // Fetch groups with product count
      const { data: groupsData, error: groupsError } = await supabase
        .from('product_groups')
        .select(`
          *,
          products(count)
        `)
        .order('nome');

      if (groupsError) throw groupsError;

      const groupsWithCount = groupsData?.map(group => ({
        ...group,
        product_count: group.products?.[0]?.count || 0
      })) || [];

      setGroups(groupsWithCount);
    } catch (error: unknown) {
      console.error('Error fetching groups:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os grupos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewGroup = () => {
    setSelectedGroupId(undefined);
    setModalOpen(true);
  };

  const handleEditGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    setModalOpen(true);
  };

  const handleDeleteGroup = (groupId: string) => {
    setGroupToDelete(groupId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!groupToDelete) return;

    try {
      const { error } = await supabase
        .from('product_groups')
        .delete()
        .eq('id', groupToDelete);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Grupo excluído com sucesso"
      });

      await fetchGroups();
    } catch (error: unknown) {
      console.error('Error deleting group:', error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao excluir grupo";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setGroupToDelete(undefined);
    }
  };

  const filteredGroups = groups.filter(group =>
    group.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="Grupos de Produtos">
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar grupos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button className="btn-pos-primary" onClick={handleNewGroup}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Grupo
          </Button>
        </div>

        {/* Groups Table */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Grupos Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Estoque Mínimo Padrão</TableHead>
                  <TableHead>Produtos</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Carregando grupos...
                    </TableCell>
                  </TableRow>
                ) : filteredGroups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Nenhum grupo encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGroups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell>
                        <div className="font-medium">{group.nome}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{group.estoque_minimo_default}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{group.product_count} produtos</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(group.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleEditGroup(group.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleDeleteGroup(group.id)}
                            disabled={group.product_count > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <ProductGroupModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          groupId={selectedGroupId}
          onSuccess={fetchGroups}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza de que deseja excluir este grupo? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default ProductGroups;