import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ShoppingCart, User } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useBrands } from "@/hooks/useBrands";
import { useSettings } from "@/hooks/useSettings";

const Home = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const { products, groups, loading, fetchProducts } = useProducts();
  const { brands } = useBrands();
  const { settings } = useSettings();

  useEffect(() => {
    const filters = {
      searchTerm: searchTerm || undefined,
      categoryId: selectedCategory && selectedCategory !== "all" ? selectedCategory : undefined,
      brandId: selectedBrand && selectedBrand !== "all" ? selectedBrand : undefined,
    };
    fetchProducts(filters);
  }, [searchTerm, selectedCategory, selectedBrand, fetchProducts]);

  const getProductImage = () => {
    return "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=400&fit=crop";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">{settings?.store_name || 'Rebulliço'}</h1>
            </div>
            
            <div className="flex-1 max-w-2xl mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Link to="/login">
              <Button variant="outline" className="gap-2">
                <User className="h-4 w-4" />
                Acesso Admin
              </Button>
            </Link>
          </div>

          {/* Filtros */}
          <div className="flex gap-4 mt-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
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
              <SelectTrigger className="w-[200px]">
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
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-primary/10 via-primary/5 to-background py-12 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-bold mb-4">Moda e Estilo</h2>
            <p className="text-xl text-muted-foreground mb-6">
              Encontre as melhores peças para o seu guarda-roupa
            </p>
            <div className="flex gap-4">
              <Badge variant="secondary" className="text-sm py-2 px-4">Entrega Rápida</Badge>
              <Badge variant="secondary" className="text-sm py-2 px-4">Produtos de Qualidade</Badge>
              <Badge variant="secondary" className="text-sm py-2 px-4">Melhores Preços</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground">Tente ajustar os filtros de busca</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-2xl font-bold">Produtos Disponíveis</h3>
              <p className="text-muted-foreground">{products.length} produtos encontrados</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img
                      src={getProductImage()}
                      alt={product.nome}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm mb-1 line-clamp-2">{product.nome}</h4>
                    {product.brand_name && (
                      <p className="text-xs text-muted-foreground mb-2">{product.brand_name}</p>
                    )}
                    {(product.tamanho || product.cor) && (
                      <div className="flex gap-2 mb-2">
                        {product.tamanho && (
                          <Badge variant="outline" className="text-xs">
                            Tam: {product.tamanho}
                          </Badge>
                        )}
                        {product.cor && (
                          <Badge variant="outline" className="text-xs">
                            {product.cor}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex-col items-start gap-2">
                    <div className="w-full">
                      <p className="text-2xl font-bold text-primary">
                        R$ {product.preco_base?.toFixed(2)}
                      </p>
                      {product.estoque_atual > 0 ? (
                        <p className="text-xs text-green-600">Em estoque</p>
                      ) : (
                        <p className="text-xs text-red-600">Indisponível</p>
                      )}
                    </div>
                    <Button 
                      className="w-full" 
                      size="sm"
                      disabled={product.estoque_atual === 0}
                    >
                      Ver Detalhes
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-semibold mb-3">Sobre</h4>
              <p className="text-sm text-muted-foreground">
                {settings?.store_name || 'Rebulliço'} - Sua loja de moda e estilo
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Contato</h4>
              <p className="text-sm text-muted-foreground">{settings?.store_phone}</p>
              <p className="text-sm text-muted-foreground">{settings?.store_email}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Endereço</h4>
              <p className="text-sm text-muted-foreground">{settings?.store_address}</p>
            </div>
          </div>
          <div className="border-t mt-8 pt-4 text-center text-sm text-muted-foreground">
            © 2025 {settings?.store_name || 'Rebulliço'}. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
