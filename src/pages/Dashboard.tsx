import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Package, 
  Users, 
  ShoppingCart,
  DollarSign,
  AlertTriangle
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  // Mock data - will be replaced with real data from API
  const stats = [
    {
      title: "Vendas Hoje",
      value: "R$ 2.847,50",
      change: "+12.5%",
      icon: DollarSign,
      color: "text-success"
    },
    {
      title: "Produtos",
      value: "347",
      change: "+3",
      icon: Package,
      color: "text-primary"
    },
    {
      title: "Clientes",
      value: "1.245",
      change: "+28",
      icon: Users,
      color: "text-accent-foreground"
    },
    {
      title: "Vendas do Mês",
      value: "R$ 45.673,20",
      change: "+18.2%",
      icon: TrendingUp,
      color: "text-success"
    },
  ];

  const alerts = [
    {
      type: "Estoque Baixo",
      message: "5 produtos com estoque abaixo do mínimo",
      severity: "warning"
    },
    {
      type: "Venda Pendente",
      message: "2 vendas fiado vencidas",
      severity: "danger"
    }
  ];

  return (
    <Layout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
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
              {alerts.map((alert, index) => (
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
              ))}
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
              {[1, 2, 3].map((_, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <div className="font-medium">#VD-{String(index + 1).padStart(4, '0')}</div>
                    <div className="text-sm text-muted-foreground">
                      Cliente: Maria Silva - {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">R$ {(Math.random() * 500 + 50).toFixed(2)}</div>
                    <div className="text-sm text-success">Concluída</div>
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

export default Dashboard;