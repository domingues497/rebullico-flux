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
import { ReceiptModal } from "@/components/pos/ReceiptModal";
import { ProductFormModal } from "@/components/products/ProductFormModal";
import { usePOS } from "@/hooks/usePOS";
import { useSettings } from "@/hooks/useSettings";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CustomerSearchDialog, { Customer } from "@/components/customers/CustomerSearchDialog";

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

interface PaymentData {
  method: string;
  amount: number;
  brand?: string;
  installments?: number;
  methodName?: string;
}

interface ReceiptData {
  id: string;
  date: Date;
  customer?: Customer;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  payments: PaymentData[];
  created_at: string;
}

const POS = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [scannedCode, setScannedCode] = useState<string>("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [storeInfo, setStoreInfo] = useState({
    name: "Rebulliço",
    cnpj: "00.000.000/0000-00",
    address: "Rua Exemplo, 123 - Centro",
    phone: "(11) 99999-9999"
  });
  const { toast } = useToast();
  const { getSetting } = useSettings();
  
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
    loadStoreSettings();
  }, []);

  // Carregar configurações da loja
  const loadStoreSettings = async () => {
    try {
      const storeName = await getSetting('store_name');
      const cnpj = await getSetting('store_cnpj');
      const address = await getSetting('store_address');
      const phone = await getSetting('store_phone');

      setStoreInfo({
        name: storeName ? String(storeName).replace(/"/g, '') : "Rebulliço",
        cnpj: cnpj ? String(cnpj).replace(/"/g, '') : "",
        address: address ? String(address).replace(/"/g, '') : "",
        phone: phone ? String(phone).replace(/"/g, '') : ""
      });
    } catch (error) {
      console.error('Erro ao carregar configurações da loja:', error);
    }
  };

  const loadProducts = async () => {
    try {
      console.log('Carregando produtos...');
      
      // Buscar todos os produtos (incluindo os com estoque 0)
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
        .order('created_at', { ascending: false });

      console.log('Todos os produtos carregados:', { data, error });

      if (error) throw error;

      const formattedProducts = data?.map(variant => ({
        id: variant.id,
        product_variant_id: variant.id,
        name: variant.product?.nome || 'Produto sem nome',
        sku: variant.sku,
        ean: variant.ean,
        price: Number(variant.preco_base),
        stock: variant.estoque_atual,
      })) || [];

      console.log('Produtos formatados:', formattedProducts);
      setProducts(formattedProducts);
    } catch (error: unknown) {
      console.error('Error fetching products:', error);
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
    } catch (error: unknown) {
      console.error('Error fetching customers:', error);
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

  const handleCustomerSelect = async (customer: any | null) => {
    if (!customer) {
      setSelectedCustomer(null);
      setDiscount(0);
      return;
    }
  
    // Busca o cliente com o grupo (nome + desconto)
    const { data, error } = await supabase
      .from('customers')
      .select(`
        id,
        nome,
        grupo_pessoas_id,
        customer_group:customer_groups (nome, desconto_percentual)
      `)
      .eq('id', customer.id)
      .single();
      
    if (error) {
      console.error(error);
      // fallback: usa o que veio do dialog
      setSelectedCustomer(customer);
      setDiscount(0);
      return;
    }
  
    setSelectedCustomer(data);
    const percent = Number(data?.customer_group?.desconto_percentual ?? 0);
    setDiscount(percent);
  };
  

  const handlePayment = async (payments: PaymentData[], observations?: string) => {
    try {
      const result = await processSale(payments, observations);
      setIsPaymentModalOpen(false);
      
      // Preparar dados do recibo e abrir modal
      if (result && result.receiptData) {
        setReceiptData(result.receiptData);
        setIsReceiptModalOpen(true);
      }
      
      toast({
        title: "Venda realizada!",
        description: "Venda processada com sucesso",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro na venda';
      toast({
        title: "Erro na venda",
        description: errorMessage,
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
            <CardContent className="p-3">
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produtos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10"
                  />
                </div>
                  <Button variant="outline" size="icon" onClick={() => setIsScannerOpen(true)} className="h-10 w-10">
                    <Scan className="h-4 w-4" />
                  </Button>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="card-elevated hover:shadow-xl transition-all cursor-pointer"
                onClick={() => handleAddToCart(product)}
              >
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-sm leading-tight">{product.name}</h3>
                      <Badge variant={product.stock > 10 ? "default" : "destructive"} className="text-xs">
                        {product.stock}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      SKU: {product.sku}
                      {product.ean && <span> • EAN: {product.ean}</span>}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold text-primary">
                        R$ {product.price.toFixed(2)}
                      </span>
                      <Button size="sm" className="btn-pos-primary h-8 w-8 p-0">
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
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  {selectedCustomer ? (
                    <div>
                      <div className="font-medium text-sm truncate">{selectedCustomer.nome}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {selectedCustomer.customer_group?.nome || 'Cliente'} - {selectedCustomer.customer_group?.desconto_percentual || 0}% desconto
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm">Nenhum cliente selecionado</div>
                  )}
                </div>
                <CustomerSearchDialog
                  triggerLabel={selectedCustomer ? "Trocar" : "Selecionar"}
                  onSelect={(c: Customer) => handleCustomerSelect(c)}
                  onClear={() => handleCustomerSelect(null as any)} // se quiser um "limpar"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Carrinho ({cartItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {/* Cart Items */}
              <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                {cartItems.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6 text-sm">
                    Carrinho vazio
                  </p>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <div className="flex-1 min-w-0 pr-2">
                        <h4 className="font-medium text-sm truncate">{item.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">{item.sku}</p>
                        <p className="text-sm font-semibold">R$ {item.final_price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center space-x-1 shrink-0">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product_variant_id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product_variant_id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-7 w-7"
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
                      const valueStr = raw.replace(',', '.').replace('%', '').trim();
                      
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
                    placeholder="Ex: 0,50 ou 0,5%"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex-1 font-mono"
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
                <div className="flex justify-between text-base font-bold">
                  <span>Total:</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Buttons */}
              <div className="space-y-2">
                <Button 
                  className="w-full btn-pos-primary h-11"
                  disabled={cartItems.length === 0 || isProcessing}
                  onClick={() => setIsPaymentModalOpen(true)}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  <span className="text-sm font-medium">
                    {isProcessing ? "Processando..." : `Finalizar - R$ ${total.toFixed(2)}`}
                  </span>
                </Button>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline"
                    className="btn-pos h-10"
                    disabled={cartItems.length === 0}
                    onClick={() => setIsPaymentModalOpen(true)}
                  >
                    <CreditCard className="mr-1 h-4 w-4" />
                    <span className="text-sm">Cartão</span>
                  </Button>
                  <Button 
                    variant="outline"
                    className="btn-pos h-10"
                    onClick={() => setShowKeypad(!showKeypad)}
                    disabled={cartItems.length === 0}
                  >
                    <span className="mr-1">🔢</span>
                    <span className="text-sm">Teclado</span>
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
        onSuccess={() => {
          // Recarregar produtos após cadastro bem-sucedido
          loadProducts();
        }}
      />

      {/* Receipt Modal */}
      {receiptData && (
        <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          saleData={receiptData}
        />
      )}
    </Layout>
  );
};

export default POS;