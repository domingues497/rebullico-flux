import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus,
  Search,
  Edit,
  Eye,
  AlertTriangle,
  Filter,
  X
} from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useBrands } from "@/hooks/useBrands";
import { ProductFormModal } from "@/components/products/ProductFormModal";

const Products = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>();
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const { products, groups, loading, fetchProducts } = useProducts();
  const { brands } = useBrands();

  // Apply filters when any filter changes
  useEffect(() => {
    const filters = {
      searchTerm: searchTerm || undefined,
      categoryId: selectedCategory && selectedCategory !== "all" ? selectedCategory : undefined,
      brandId: selectedBrand && selectedBrand !== "all" ? selectedBrand : undefined,
    };
    
    console.log('🔍 Aplicando filtros:', filters);
    fetchProducts(filters);
  }, [searchTerm, selectedCategory, selectedBrand, fetchProducts]); // ✅ Agora fetchProducts é estável

  const lowStockProducts = products.filter(p => p.isLowStock);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedBrand("all");
  };

  const hasActiveFilters = searchTerm || (selectedCategory && selectedCategory !== "all") || (selectedBrand && selectedBrand !== "all");

  const handleNewProduct = () => {
    setSelectedProductId(undefined);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleViewProduct = (productId: string) => {
    setSelectedProductId(productId);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleEditProduct = (productId: string) => {
    console.log('🎯 handleEditProduct chamado com ID:', productId);
    console.log('🎯 Tipo do productId:', typeof productId);
    console.log('🎯 Valor exato:', productId);
    setSelectedProductId(productId);
    setModalMode('edit');
    setModalOpen(true);
    console.log('🎯 Estado após setSelectedProductId:', productId);
  };

  return (
    <Layout title="Gestão de Produtos">
      <div className="space-y-6">
        {/* Alert for low stock */}
        {lowStockProducts.length > 0 && (
          <Card className="border-warning bg-warning/10">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <span className="font-medium">
                  {lowStockProducts.length} produto(s) com estoque baixo
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions Bar */}
        <div className="flex flex-col gap-4">
          {/* Search and Filters Row */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, SKU, EAN, código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Marca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as marcas</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={clearFilters}
                  title="Limpar filtros"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* New Product Button Row */}
          <div className="flex justify-end">
            <Button className="btn-pos-primary" onClick={handleNewProduct}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </div>
        </div>

        {/* Products Table */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Produtos Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Código Interno</TableHead>
                  <TableHead>SKU/EAN</TableHead>
                  <TableHead>Cód. Fabricante</TableHead>
                  <TableHead>Variante</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow key="loading">
                    <TableCell colSpan={9} className="text-center">
                      Carregando produtos...
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow key="empty">
                    <TableCell colSpan={9} className="text-center">
                      Nenhum produto encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product, index) => (
                    <TableRow key={`${product.id}-${index}`}>
                      <TableCell>
                        <div className="font-medium">{product.nome}</div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <Badge variant="outline">{product.cod_interno}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <div>{product.sku}</div>
                        {product.ean && (
                          <div className="text-xs text-muted-foreground">
                            EAN: {product.ean}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {product.cod_fabricante && (
                          <div>{product.cod_fabricante}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {product.tamanho && <span>Tam: {product.tamanho}</span>}
                          {product.tamanho && product.cor && <span> • </span>}
                          {product.cor && <span>{product.cor}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">R$ {product.preco_base?.toFixed(2) || '0.00'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={product.estoque_atual < product.estoque_minimo ? "destructive" : "default"}
                          >
                            {product.estoque_atual || 0}
                          </Badge>
                          {product.estoque_atual < product.estoque_minimo && (
                            <AlertTriangle className="h-4 w-4 text-warning" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">Ativo</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleViewProduct(product.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleEditProduct(product.id)}
                          >
                            <Edit className="h-4 w-4" />
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

        <ProductFormModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          productId={selectedProductId}
          mode={modalMode}
          onSuccess={() => {
            console.log('🎉 Produto salvo com sucesso, recarregando lista');
            fetchProducts();
          }}
        />

      </div>
    </Layout>
  );
};

export default Products;