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
import { 
  Download,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Package,
  Users,
  ShoppingCart
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SaleItem {
  quantidade: number;
  preco_unitario: number;
  product_variants: {
    products: {
      nome: string;
    };
  };
}

interface Sale {
  id: string;
  total: number;
  created_at: string;
  customer_id?: string;
  sale_items: SaleItem[];
}

interface PaymentMethod {
  metodo_pagamento: {
    nome: string;
  };
  valor: number;
}

interface ProductStats {
  [productName: string]: {
    sold: number;
    revenue: number;
  };
}

interface PaymentStats {
  [methodName: string]: {
    count: number;
    total: number;
  };
}

interface LowStockItem {
  id: string;
  sku: string;
  estoque_atual: number;
  estoque_minimo: number;
  products: {
    nome: string;
  };
}

interface TopProduct {
  name: string;
  sold: number;
  revenue: number;
}

interface RecentSale {
  id: string;
  customer: string;
  total: number;
  items: number;
  payment: string;
  time: string;
}

interface PaymentMethodStat {
  method: string;
  count: number;
  total: number;
  percentage: number;
}

interface LowStockItemDisplay {
  name: string;
  current: number;
  minimum: number;
  sku: string;
}

const Reports = () => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [todayStats, setTodayStats] = useState({
    sales: 0,
    transactions: 0,
    items: 0,
    customers: 0
  });
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodStat[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItemDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      await Promise.all([
        fetchTodayStats(),
        fetchTopProducts(),
        fetchRecentSales(),
        fetchPaymentMethodStats(),
        fetchLowStockItems()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: salesData, error } = await supabase
        .from('sales')
        .select(`
          total_liquido,
          sale_items!inner(quantidade)
        `)
        .gte('data', today)
        .lt('data', new Date(new Date().getTime() + 24*60*60*1000).toISOString());

      if (error) throw error;

      const totalSales = salesData?.reduce((sum, sale) => sum + Number(sale.total_liquido), 0) || 0;
      const totalItems = salesData?.reduce((sum, sale) => 
        sum + sale.sale_items.reduce((itemSum: number, item: SaleItem) => itemSum + item.quantidade, 0), 0) || 0;

      setTodayStats({
        sales: totalSales,
        transactions: salesData?.length || 0,
        items: totalItems,
        customers: new Set(salesData?.map(s => (s as { customer_id?: string }).customer_id).filter(Boolean)).size
      });
    } catch (error: unknown) {
      console.error('Error fetching today stats:', error);
    }
  };

  const fetchTopProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('sale_items')
        .select(`
          quantidade,
          preco_unit,
          product_variants!inner(
            id,
            sku,
            products!inner(nome)
          )
        `)
        .gte('created_at', new Date(Date.now() - 30*24*60*60*1000).toISOString());

      if (error) throw error;

      // Group by product and calculate totals
      const productStats = data?.reduce((acc: ProductStats, item: SaleItem) => {
        const productName = item.product_variants.products.nome;
        if (!acc[productName]) {
          acc[productName] = { sold: 0, revenue: 0 };
        }
        acc[productName].sold += item.quantidade;
        acc[productName].revenue += item.quantidade * Number(item.preco_unit);
        return acc;
      }, {}) || {};

      const topProductsList = Object.entries(productStats)
        .map(([name, stats]: [string, { sold: number; revenue: number }]) => ({ name, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 4);

      setTopProducts(topProductsList);
    } catch (error: unknown) {
      console.error('Error fetching top products:', error);
    }
  };

  const fetchRecentSales = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id,
          total_liquido,
          data,
          customers(nome),
          sale_items(quantidade),
          payments(tipo)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const salesWithDetails = data?.map((sale: Sale) => ({
        id: `VD-${sale.id.slice(-4)}`,
        customer: sale.customers?.nome || 'Cliente não identificado',
        total: Number(sale.total_liquido),
        items: sale.sale_items?.reduce((sum: number, item: SaleItem) => sum + item.quantidade, 0) || 0,
        payment: sale.payments?.[0]?.tipo || 'N/A',
        time: new Date(sale.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      })) || [];

      setRecentSales(salesWithDetails);
    } catch (error: unknown) {
      console.error('Error fetching recent sales:', error);
    }
  };

  const fetchPaymentMethodStats = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          tipo,
          valor,
          bandeira
        `);

      if (error) throw error;

      // Group by payment type
      const methodStats = data?.reduce((acc: PaymentStats, payment: PaymentMethod) => {
        const method = payment.tipo;
        if (!acc[method]) {
          acc[method] = { count: 0, total: 0, fee: 0 };
        }
        acc[method].count += 1;
        acc[method].total += Number(payment.valor);
        return acc;
      }, {}) || {};

      const methodsList = Object.entries(methodStats).map(([method, stats]: [string, { count: number; total: number }]) => ({
        method,
        count: stats.count,
        total: stats.total,
        fee: 0, // Placeholder - would need acquirer_fees integration
        net: stats.total
      }));

      setPaymentMethods(methodsList);
    } catch (error: unknown) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const fetchLowStockItems = async () => {
    try {
      const { data, error } = await supabase
        .from('v_stock_balance')
        .select('*')
        .eq('is_low_stock', true)
        .limit(10);

      if (error) throw error;

      const lowStockList = data?.map((item: LowStockItem) => ({
        name: `${item.product_name}${item.tamanho ? ` - ${item.tamanho}` : ''}${item.cor ? ` ${item.cor}` : ''}`,
        current: item.estoque_atual,
        minimum: item.estoque_minimo
      })) || [];

      setLowStockItems(lowStockList);
    } catch (error: unknown) {
      console.error('Error fetching low stock items:', error);
    }
  };

  const handleApplyPeriod = () => {
    fetchReports();
    toast({
      title: "Período aplicado",
      description: "Relatórios atualizados para o período selecionado"
    });
  };

  return (
    <Layout title="Relatórios e Análises">
      <div className="space-y-6">
        {/* Period Selection */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex space-x-2">
            <Input 
              type="date" 
              className="w-40" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="flex items-center text-muted-foreground">até</span>
            <Input 
              type="date" 
              className="w-40" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <Button variant="outline" onClick={handleApplyPeriod}>
              <Calendar className="mr-2 h-4 w-4" />
              Aplicar
            </Button>
          </div>
          <Button className="btn-pos-primary">
            <Download className="mr-2 h-4 w-4" />
            Exportar Relatório
          </Button>
        </div>

        {/* Today's Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <DollarSign className="h-8 w-8 text-success" />
                <div>
                  <p className="text-2xl font-bold">R$ {todayStats.sales.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Vendas Hoje</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <ShoppingCart className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{todayStats.transactions}</p>
                  <p className="text-sm text-muted-foreground">Transações</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Package className="h-8 w-8 text-accent-foreground" />
                <div>
                  <p className="text-2xl font-bold">{todayStats.items}</p>
                  <p className="text-sm text-muted-foreground">Itens Vendidos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-secondary-foreground" />
                <div>
                  <p className="text-2xl font-bold">{todayStats.customers}</p>
                  <p className="text-sm text-muted-foreground">Clientes Únicos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Products & Recent Sales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Produtos Mais Vendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center text-muted-foreground">Carregando...</div>
                ) : topProducts.length === 0 ? (
                  <div className="text-center text-muted-foreground">Nenhum produto vendido no período</div>
                ) : (
                  topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {product.sold} unidades vendidas
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">R$ {product.revenue.toFixed(2)}</div>
                        <Badge variant="default">#{index + 1}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Sales */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Vendas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center text-muted-foreground">Carregando...</div>
                ) : recentSales.length === 0 ? (
                  <div className="text-center text-muted-foreground">Nenhuma venda recente</div>
                ) : (
                  recentSales.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <div className="font-medium">{sale.id}</div>
                        <div className="text-sm text-muted-foreground">
                          {sale.customer} • {sale.items} itens • {sale.time}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">R$ {sale.total.toFixed(2)}</div>
                        <Badge variant="outline">{sale.payment}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales by Payment Method */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Vendas por Forma de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Forma de Pagamento</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Taxa</TableHead>
                  <TableHead>Valor Líquido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">Carregando...</TableCell>
                  </TableRow>
                ) : paymentMethods.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">Nenhuma venda no período</TableCell>
                  </TableRow>
                ) : (
                  paymentMethods.map((method) => (
                    <TableRow key={method.method}>
                      <TableCell>{method.method}</TableCell>
                      <TableCell>{method.count}</TableCell>
                      <TableCell>R$ {method.total.toFixed(2)}</TableCell>
                      <TableCell>{method.fee}%</TableCell>
                      <TableCell>R$ {method.net.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card className="card-elevated border-warning">
          <CardHeader>
            <CardTitle className="flex items-center text-warning">
              <TrendingDown className="mr-2 h-5 w-5" />
              Produtos com Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center text-muted-foreground">Carregando...</div>
              ) : lowStockItems.length === 0 ? (
                <div className="text-center text-success">Nenhum produto com estoque baixo! 🎉</div>
              ) : (
                lowStockItems.map((item) => (
                  <div key={item.id || item.name} className="flex items-center justify-between p-3 bg-warning/10 rounded-lg border-l-4 border-warning">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Mínimo recomendado: {item.minimum}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive">{item.current} em estoque</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Reports;