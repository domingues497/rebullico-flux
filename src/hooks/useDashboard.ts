import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DashboardStats {
  salesToday: {
    value: string;
    change: string;
  };
  totalProducts: {
    value: string;
    change: string;
  };
  totalCustomers: {
    value: string;
    change: string;
  };
  salesThisMonth: {
    value: string;
    change: string;
  };
}

export interface DashboardAlert {
  type: string;
  message: string;
  severity: 'warning' | 'danger';
}

export interface RecentSale {
  id: string;
  customer_name: string | null;
  total_liquido: number;
  created_at: string;
  status: string;
}

export const useDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Buscar vendas de hoje
      const today = new Date().toISOString().split('T')[0];
      const { data: salesToday, error: salesTodayError } = await supabase
        .from('sales')
        .select('total_liquido')
        .eq('data', today);

      if (salesTodayError) throw salesTodayError;

      // Buscar vendas de ontem para comparação
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const { data: salesYesterday, error: salesYesterdayError } = await supabase
        .from('sales')
        .select('total_liquido')
        .eq('data', yesterdayStr);

      if (salesYesterdayError) throw salesYesterdayError;

      // Calcular totais de hoje e ontem
      const todayTotal = salesToday?.reduce((sum, sale) => sum + sale.total_liquido, 0) || 0;
      const yesterdayTotal = salesYesterday?.reduce((sum, sale) => sum + sale.total_liquido, 0) || 0;
      const todayChange = yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal * 100) : 0;

      // Buscar vendas do mês atual
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const { data: salesThisMonth, error: salesThisMonthError } = await supabase
        .from('sales')
        .select('total_liquido')
        .gte('data', `${currentMonth}-01`)
        .lt('data', `${currentMonth}-32`);

      if (salesThisMonthError) throw salesThisMonthError;

      // Buscar vendas do mês anterior para comparação
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthStr = lastMonth.toISOString().slice(0, 7);
      
      const { data: salesLastMonth, error: salesLastMonthError } = await supabase
        .from('sales')
        .select('total_liquido')
        .gte('data', `${lastMonthStr}-01`)
        .lt('data', `${lastMonthStr}-32`);

      if (salesLastMonthError) throw salesLastMonthError;

      const thisMonthTotal = salesThisMonth?.reduce((sum, sale) => sum + sale.total_liquido, 0) || 0;
      const lastMonthTotal = salesLastMonth?.reduce((sum, sale) => sum + sale.total_liquido, 0) || 0;
      const monthChange = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100) : 0;

      // Buscar total de produtos
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      if (productsError) throw productsError;

      // Buscar total de clientes
      const { count: customersCount, error: customersError } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      if (customersError) throw customersError;

      // Buscar produtos com estoque baixo
      const { data: lowStockProducts, error: lowStockError } = await supabase
        .from('v_stock_balance')
        .select('*')
        .eq('is_low_stock', true);

      if (lowStockError) throw lowStockError;

      // Buscar vendas recentes (últimas 5)
      const { data: recentSalesData, error: recentSalesError } = await supabase
        .from('sales')
        .select(`
          id,
          total_liquido,
          created_at,
          customers (nome)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentSalesError) throw recentSalesError;

      // Montar estatísticas
      const dashboardStats: DashboardStats = {
        salesToday: {
          value: `R$ ${todayTotal.toFixed(2).replace('.', ',')}`,
          change: `${todayChange >= 0 ? '+' : ''}${todayChange.toFixed(1)}%`
        },
        totalProducts: {
          value: (productsCount || 0).toString(),
          change: '+0' // Pode ser implementado comparando com período anterior
        },
        totalCustomers: {
          value: (customersCount || 0).toString(),
          change: '+0' // Pode ser implementado comparando com período anterior
        },
        salesThisMonth: {
          value: `R$ ${thisMonthTotal.toFixed(2).replace('.', ',')}`,
          change: `${monthChange >= 0 ? '+' : ''}${monthChange.toFixed(1)}%`
        }
      };

      // Montar alertas
      const dashboardAlerts: DashboardAlert[] = [];
      
      if (lowStockProducts && lowStockProducts.length > 0) {
        dashboardAlerts.push({
          type: 'Estoque Baixo',
          message: `${lowStockProducts.length} produtos com estoque abaixo do mínimo`,
          severity: 'warning'
        });
      }

      // Montar vendas recentes
      const formattedRecentSales: RecentSale[] = recentSalesData?.map(sale => ({
        id: sale.id,
        customer_name: sale.customers?.nome || 'Cliente não informado',
        total_liquido: sale.total_liquido,
        created_at: sale.created_at,
        status: 'Concluída'
      })) || [];

      setStats(dashboardStats);
      setAlerts(dashboardAlerts);
      setRecentSales(formattedRecentSales);

    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    stats,
    alerts,
    recentSales,
    loading,
    refetch: fetchDashboardData
  };
};