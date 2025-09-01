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

const Products = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock products data
  const products = [
    {
      id: "1",
      name: "Camisa Polo Masculina",
      category: "Masculino",
      brand: "Rebulliço",
      sku: "CM001",
      price: 89.90,
      cost: 45.00,
      stock: 15,
      minStock: 5,
      status: "Ativo",
      variants: [
        { size: "P", color: "Azul", stock: 5 },
        { size: "M", color: "Azul", stock: 8 },
        { size: "G", color: "Branco", stock: 2 },
      ]
    },
    {
      id: "2",
      name: "Calça Jeans Feminina",
      category: "Feminino",
      brand: "Rebulliço",
      sku: "CJ002",
      price: 129.90,
      cost: 65.00,
      stock: 8,
      minStock: 10,
      status: "Ativo",
      variants: [
        { size: "36", color: "Azul", stock: 3 },
        { size: "38", color: "Azul", stock: 5 },
      ]
    },
    {
      id: "3",
      name: "Vestido Floral",
      category: "Feminino",
      brand: "Rebulliço",
      sku: "VF003",
      price: 159.90,
      cost: 80.00,
      stock: 12,
      minStock: 5,
      status: "Ativo",
      variants: [
        { size: "P", color: "Floral Rosa", stock: 4 },
        { size: "M", color: "Floral Rosa", stock: 8 },
      ]
    },
    {
      id: "4",
      name: "Bermuda Masculina",
      category: "Masculino",
      brand: "Rebulliço",
      sku: "BM004",
      price: 69.90,
      cost: 35.00,
      stock: 20,
      minStock: 8,
      status: "Ativo",
      variants: [
        { size: "M", color: "Caqui", stock: 12 },
        { size: "G", color: "Caqui", stock: 8 },
      ]
    },
  ];

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

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
          <Button className="btn-pos-primary">
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
                  <TableHead>SKU</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {product.brand}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-semibold">R$ {product.price.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">
                          Custo: R$ {product.cost.toFixed(2)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={product.stock <= product.minStock ? "destructive" : "default"}
                        >
                          {product.stock}
                        </Badge>
                        {product.stock <= product.minStock && (
                          <AlertTriangle className="h-4 w-4 text-warning" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">{product.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Product Variants */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Variações por Produto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <div key={product.id} className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">{product.name}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {product.variants.map((variant, index) => (
                      <div 
                        key={index}
                        className="flex justify-between items-center p-2 bg-muted/30 rounded"
                      >
                        <div>
                          <span className="text-sm font-medium">
                            {variant.size} - {variant.color}
                          </span>
                        </div>
                        <Badge 
                          variant={variant.stock <= 2 ? "destructive" : "default"}
                        >
                          {variant.stock}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Products;