import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BarcodeScanner } from "@/components/pos/BarcodeScanner";
import { NumericKeypad } from "@/components/pos/NumericKeypad";
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

interface CartItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  discount?: number;
}

const POS = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [discount, setDiscount] = useState(0);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Mock products
  const products = [
    { id: "1", name: "Camisa Polo Masculina", sku: "CM001", price: 89.90, stock: 15 },
    { id: "2", name: "Calça Jeans Feminina", sku: "CJ002", price: 129.90, stock: 8 },
    { id: "3", name: "Vestido Floral", sku: "VF003", price: 159.90, stock: 12 },
    { id: "4", name: "Bermuda Masculina", sku: "BM004", price: 69.90, stock: 20 },
  ];

  const addToCart = (product: typeof products[0]) => {
    const existingItem = cart.find(item => item.sku === product.sku);
    if (existingItem) {
      setCart(cart.map(item => 
        item.sku === product.sku 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        quantity: 1
      }]);
    }
  };

  const updateQuantity = (sku: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.sku !== sku));
    } else {
      setCart(cart.map(item => 
        item.sku === sku ? { ...item, quantity } : item
      ));
    }
  };

  const removeFromCart = (sku: string) => {
    setCart(cart.filter(item => item.sku !== sku));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = subtotal * (discount / 100);
  const total = subtotal - discountAmount;

  const handleBarcodeScanned = (code: string) => {
    // Mock barcode lookup
    const product = products.find(p => p.sku === code);
    if (product) {
      addToCart(product);
    }
  };

  const handleCustomerSelect = () => {
    // Mock customer selection - would open customer modal
    setSelectedCustomer({
      name: "Maria Silva",
      group: "VIP",
      discount: 15
    });
    // Apply automatic discount based on customer group
    setDiscount(15);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
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
                onClick={() => addToCart(product)}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-sm">{product.name}</h3>
                      <Badge variant={product.stock > 10 ? "default" : "destructive"}>
                        {product.stock}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
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
                      <div className="font-medium">{selectedCustomer.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Grupo {selectedCustomer.group} - {selectedCustomer.discount}% desconto
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">Nenhum cliente selecionado</div>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={handleCustomerSelect}>
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
                Carrinho ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cart Items */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Carrinho vazio
                  </p>
                ) : (
                  cart.map((item) => (
                    <div key={item.sku} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.name}</h4>
                        <p className="text-xs text-muted-foreground">{item.sku}</p>
                        <p className="text-sm font-semibold">R$ {item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.sku, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.sku, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-6 w-6"
                          onClick={() => removeFromCart(item.sku)}
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
                <label className="text-sm font-medium">Desconto (%)</label>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    placeholder="0"
                    className="flex-1"
                  />
                  <Button variant="outline" size="icon">
                    <Percent className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-destructive">
                    <span>Desconto ({discount}%):</span>
                    <span>-R$ {discountAmount.toFixed(2)}</span>
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
                  disabled={cart.length === 0}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Finalizar - R$ {total.toFixed(2)}
                </Button>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline"
                    className="btn-pos"
                    disabled={cart.length === 0}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Cartão
                  </Button>
                  <Button 
                    variant="outline"
                    className="btn-pos"
                    onClick={() => setShowKeypad(!showKeypad)}
                    disabled={cart.length === 0}
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
    </Layout>
  );
};

export default POS;