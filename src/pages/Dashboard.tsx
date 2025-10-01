import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Package, 
  Users, 
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "@/hooks/useDashboard";

const Dashboard = () => {
  const navigate = useNavigate();
  const { stats, alerts, recentSales, loading } = useDashboard();

  // Configuração dos cards de estatísticas
  const statsConfig = [
    {
      title: "Vendas Hoje",
      value: stats?.salesToday.value || "R$ 0,00",
      change: stats?.salesToday.change || "0%",
      icon: DollarSign,
      color: "text-success"
    },
    {
      title: "Produtos",
      value: stats?.totalProducts.value || "0",
      change: stats?.totalProducts.change || "0",
      icon: Package,
      color: "text-primary"
    },
    {
      title: "Clientes",
      value: stats?.totalCustomers.value || "0",
      change: stats?.totalCustomers.change || "0",
      icon: Users,
      color: "text-accent-foreground"
    },
    {
      title: "Vendas do Mês",
      value: stats?.salesThisMonth.value || "R$ 0,00",
      change: stats?.salesThisMonth.change || "0%",
      icon: TrendingUp,
      color: "text-success"
    },
  ];

  return (
    <Layout title="Dashboard">
      <div className="space-y-6">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando dados...</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsConfig.map((stat, index) => (
            <Card key={index} className="card-elevated hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-success">{stat.change}</span> desde ontem
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full btn-pos btn-pos-primary"
                onClick={() => navigate('/pos')}
              >
                Abrir PDV
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="btn-pos">
                  Nova Venda
                </Button>
                <Button variant="outline" className="btn-pos">
                  Cadastrar Produto
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-warning" />
                Alertas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts && alerts.length > 0 ? (
                alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-l-4 ${
                      alert.severity === 'warning' 
                        ? 'bg-warning/10 border-warning' 
                        : 'bg-destructive/10 border-destructive'
                    }`}
                  >
                    <div className="font-medium text-sm">{alert.type}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {alert.message}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Nenhum alerta no momento
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Sales */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Vendas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSales && recentSales.length > 0 ? (
                recentSales.map((sale, index) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <div className="font-medium">#{sale.id.slice(0, 8)}</div>
                      <div className="text-sm text-muted-foreground">
                        Cliente: {sale.customer_name} - {new Date(sale.created_at).toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">R$ {sale.total_liquido.toFixed(2).replace('.', ',')}</div>
                      <div className="text-sm text-success">{sale.status}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma venda recente
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;