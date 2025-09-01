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

const Reports = () => {
  // Mock data for reports
  const todayStats = {
    sales: 2847.50,
    transactions: 15,
    items: 28,
    customers: 12
  };

  const topProducts = [
    { name: "Camisa Polo Masculina", sold: 15, revenue: 1348.50 },
    { name: "Calça Jeans Feminina", sold: 8, revenue: 1039.20 },
    { name: "Vestido Floral", sold: 6, revenue: 959.40 },
    { name: "Bermuda Masculina", sold: 12, revenue: 838.80 },
  ];

  const recentSales = [
    {
      id: "VD-0001",
      customer: "Maria Silva",
      total: 289.90,
      items: 2,
      payment: "Cartão",
      time: "14:32"
    },
    {
      id: "VD-0002",
      customer: "João Pedro",
      total: 159.90,
      items: 1,
      payment: "Dinheiro",
      time: "14:15"
    },
    {
      id: "VD-0003",
      customer: "Ana Carolina",
      total: 419.80,
      items: 3,
      payment: "PIX",
      time: "13:45"
    },
  ];

  const lowStockItems = [
    { name: "Camisa Polo - P Azul", current: 2, minimum: 5 },
    { name: "Calça Jeans - 36 Azul", current: 3, minimum: 10 },
    { name: "Vestido - P Rosa", current: 1, minimum: 5 },
  ];

  return (
    <Layout title="Relatórios e Análises">
      <div className="space-y-6">
        {/* Period Selection */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex space-x-2">
            <Input type="date" className="w-40" defaultValue="2024-01-01" />
            <span className="flex items-center text-muted-foreground">até</span>
            <Input type="date" className="w-40" defaultValue="2024-01-31" />
            <Button variant="outline">
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
                {topProducts.map((product, index) => (
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
                ))}
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
                {recentSales.map((sale) => (
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
                ))}
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
                <TableRow>
                  <TableCell>Dinheiro</TableCell>
                  <TableCell>5</TableCell>
                  <TableCell>R$ 847,50</TableCell>
                  <TableCell>0%</TableCell>
                  <TableCell>R$ 847,50</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Cartão de Crédito</TableCell>
                  <TableCell>7</TableCell>
                  <TableCell>R$ 1.245,80</TableCell>
                  <TableCell>3,5%</TableCell>
                  <TableCell>R$ 1.202,20</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Cartão de Débito</TableCell>
                  <TableCell>2</TableCell>
                  <TableCell>R$ 489,90</TableCell>
                  <TableCell>2,0%</TableCell>
                  <TableCell>R$ 480,10</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>PIX</TableCell>
                  <TableCell>1</TableCell>
                  <TableCell>R$ 264,30</TableCell>
                  <TableCell>0%</TableCell>
                  <TableCell>R$ 264,30</TableCell>
                </TableRow>
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
              {lowStockItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-warning/10 rounded-lg border-l-4 border-warning">
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Reports;