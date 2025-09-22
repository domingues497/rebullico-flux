import { useState } from "react";
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
import { 
  Plus,
  Search,
  Edit,
  Eye,
  AlertTriangle
} from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { ProductFormModal } from "@/components/products/ProductFormModal";

const Products = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>();
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const { products, loading } = useProducts();

  const filteredProducts = products.filter(product =>
    product.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.ean?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockProducts = products.filter(p => p.isLowStock);

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
    setSelectedProductId(productId);
    setModalMode('edit');
    setModalOpen(true);
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
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button className="btn-pos-primary" onClick={handleNewProduct}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
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
                  <TableHead>SKU/EAN</TableHead>
                  <TableHead>Variante</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Carregando produtos...
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Nenhum produto encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="font-medium">{product.name}</div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <div>{product.sku}</div>
                        {product.ean && (
                          <div className="text-xs text-muted-foreground">
                            EAN: {product.ean}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {product.size && <span>Tam: {product.size}</span>}
                          {product.size && product.color && <span> • </span>}
                          {product.color && <span>{product.color}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">R$ {product.price?.toFixed(2) || '0.00'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={product.isLowStock ? "destructive" : "default"}
                          >
                            {product.stock || 0}
                          </Badge>
                          {product.isLowStock && (
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
        />

      </div>
    </Layout>
  );
};

export default Products;