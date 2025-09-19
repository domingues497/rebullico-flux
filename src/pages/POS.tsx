import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BarcodeScanner } from "@/components/pos/BarcodeScanner";
import { NumericKeypad } from "@/components/pos/NumericKeypad";
import { PaymentModal } from "@/components/pos/PaymentModal";
import { CustomerSelectionModal } from "@/components/pos/CustomerSelectionModal";
import { ProductFormModal } from "@/components/products/ProductFormModal";
import { usePOS } from "@/hooks/usePOS";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  ShoppingCart,
  Search,
  Scan,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  DollarSign,
  Percent,
  Users
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  ean?: string;
  price: number;
  stock: number;
  product_variant_id: string;
}

const POS = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [scannedCode, setScannedCode] = useState<string>("");
  const [customers, setCustomers] = useState<any[]>([]);
  const { toast } = useToast();
  
  const {
    cartItems,
    selectedCustomer,
    discount,
    discountPercent,
    subtotal,
    totalDiscount,
    total,
    isProcessing,
    setSelectedCustomer,
    setDiscount,
    setDiscountPercent,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    processSale,
  } = usePOS();

  // Load products and customers on mount
  useEffect(() => {
    loadProducts();
    loadCustomers();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select(`
          id,
          sku,
          ean,
          preco_base,
          estoque_atual,
          product:products(nome)
        `)
        .gt('estoque_atual', 0);

      if (error) throw error;

      const formattedProducts = data.map(variant => ({
        id: variant.id,
        product_variant_id: variant.id,
        name: variant.product.nome,
        sku: variant.sku,
        ean: variant.ean,
        price: Number(variant.preco_base),
        stock: variant.estoque_atual,
      }));

      setProducts(formattedProducts);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os produtos",
        variant: "destructive"
      });
    }
  };

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          id,
          nome,
          grupo_pessoas_id,
          customer_group:customer_groups(nome, desconto_percentual)
        `);

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os clientes",
        variant: "destructive"
      });
    }
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product.product_variant_id);
  };

  const handleBarcodeScanned = (code: string) => {
    const product = products.find(p => p.sku === code || p.id === code || p.ean === code);
    if (product) {
      handleAddToCart(product);
    } else {
      setScannedCode(code);
      toast({
        title: "Produto não encontrado",
        description: (
          <div className="space-y-2">
            <p>Código {code} não foi encontrado</p>
            <Button 
              size="sm" 
              onClick={() => setIsProductModalOpen(true)}
              className="w-full"
            >
              Cadastrar Produto
            </Button>
          </div>
        ),
        variant: "destructive",
        duration: 4000, // 5 segundos
      });
    }
  };

  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer);
  };

  const handlePayment = async (payments: any[], observations?: string) => {
    try {
      await processSale(payments, observations);
      setIsPaymentModalOpen(false);
      toast({
        title: "Venda realizada!",
        description: "Venda processada com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro na venda",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.ean && product.ean.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Layout title="PDV - Ponto de Venda">
      <div className="pos-grid">
        {/* Products Section */}
        <div className="pos-products space-y-4">
          {/* Search Bar */}
          <Card className="card-flat">
            <CardContent className="p-4">
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produtos por nome ou código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                  <Button variant="outline" size="icon" onClick={() => setIsScannerOpen(true)}>
                    <Scan className="h-4 w-4" />
                  </Button>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="card-elevated hover:shadow-xl transition-all cursor-pointer"
                onClick={() => handleAddToCart(product)}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-sm">{product.name}</h3>
                      <Badge variant={product.stock > 10 ? "default" : "destructive"}>
                        {product.stock}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      SKU: {product.sku}
                      {product.ean && <span> • EAN: {product.ean}</span>}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-primary">
                        R$ {product.price.toFixed(2)}
                      </span>
                      <Button size="sm" className="btn-pos-primary">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cart Section */}
        <div className="pos-cart space-y-4">
          {/* Customer Selection */}
          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  {selectedCustomer ? (
                    <div>
                      <div className="font-medium">{selectedCustomer.nome}</div>
                      <div className="text-sm text-muted-foreground">
                        {selectedCustomer.customer_group?.nome || 'Cliente'} - {selectedCustomer.customer_group?.desconto_percentual || 0}% desconto
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">Nenhum cliente selecionado</div>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsCustomerModalOpen(true)}
                >
                  <Users className="mr-2 h-4 w-4" />
                  {selectedCustomer ? "Trocar" : "Selecionar"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Carrinho ({cartItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cart Items */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cartItems.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Carrinho vazio
                  </p>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.name}</h4>
                        <p className="text-xs text-muted-foreground">{item.sku}</p>
                        <p className="text-sm font-semibold">R$ {item.final_price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.product_variant_id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.product_variant_id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-6 w-6"
                          onClick={() => removeItem(item.product_variant_id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Separator />

              {/* Discount */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Desconto (R$ ou %)</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    defaultValue=""
                    onKeyDown={(e) => {
                      // Permite apenas números (0-9), vírgula, % e teclas de controle
                      const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
                      const isNumber = e.key >= '0' && e.key <= '9';
                      const isComma = e.key === ',';
                      const isPercent = e.key === '%';
                      const isControlKey = allowedKeys.includes(e.key);
                      
                      if (!isNumber && !isComma && !isPercent && !isControlKey) {
                        e.preventDefault(); // Bloqueia a tecla
                      }
                    }}
                    onChange={(e) => {
                      const raw = e.target.value;
                      console.log('Input value:', raw); // Debug
                      
                      // Se vazio, zera tudo
                      if (!raw.trim()) {
                        setDiscount(0);
                        setDiscountPercent(0);
                        return;
                      }

                      // Verifica se termina com %
                      const isPercent = /%\s*$/.test(raw);
                      
                      // Normaliza vírgula para ponto e remove % para parsing
                      let valueStr = raw.replace(',', '.').replace('%', '').trim();
                      
                      // Se não conseguir fazer parse, mantém o estado atual (permite digitação incompleta)
                      const num = parseFloat(valueStr);
                      if (isNaN(num) || num < 0) {
                        return; // Mantém estado atual durante digitação
                      }

                      if (isPercent) {
                        // É percentual: aplica sobre o total
                        setDiscount(0);
                        setDiscountPercent(num);
                      } else {
                        // É valor em R$: aplica valor fixo
                        setDiscount(num);
                        setDiscountPercent(0);
                      }
                    }}
                    placeholder="Ex: 0,50 (R$) ou 0,5% (percentual)"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm flex-1 font-mono"
                  />
                </div>
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-destructive">
                    <span>Desconto:</span>
                    <span>-R$ {totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Buttons */}
              <div className="space-y-2">
                <Button 
                  className="w-full btn-pos-primary"
                  disabled={cartItems.length === 0 || isProcessing}
                  onClick={() => setIsPaymentModalOpen(true)}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  {isProcessing ? "Processando..." : `Finalizar - R$ ${total.toFixed(2)}`}
                </Button>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline"
                    className="btn-pos"
                    disabled={cartItems.length === 0}
                    onClick={() => setIsPaymentModalOpen(true)}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Cartão
                  </Button>
                  <Button 
                    variant="outline"
                    className="btn-pos"
                    onClick={() => setShowKeypad(!showKeypad)}
                    disabled={cartItems.length === 0}
                  >
                    🔢 Teclado
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Numeric Keypad for Mobile */}
          {showKeypad && (
            <NumericKeypad
              onNumberClick={(num) => console.log('Number clicked:', num)}
              onBackspace={() => console.log('Backspace')}
              onClear={() => console.log('Clear')}
              onEnter={() => console.log('Enter')}
            />
          )}
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onCodeScanned={handleBarcodeScanned}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        total={total}
        onConfirm={handlePayment}
        isProcessing={isProcessing}
      />

      {/* Customer Selection Modal */}
      <CustomerSelectionModal
        open={isCustomerModalOpen}
        onOpenChange={setIsCustomerModalOpen}
        customers={customers}
        onSelectCustomer={handleCustomerSelect}
      />

      {/* Product Registration Modal */}
      <ProductFormModal
        open={isProductModalOpen}
        onOpenChange={(open) => {
          setIsProductModalOpen(open);
          if (!open) {
            setScannedCode("");
          }
        }}
        mode="create"
        initialSku={scannedCode}
        initialEan={scannedCode}
      />
    </Layout>
  );
};

export default POS;