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
  Plus,
  Search,
  Edit,
  Eye,
  UserPlus,
  Phone,
  Mail
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  cpf_cnpj?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  grupo_id?: string;
  created_at: string;
}

interface CustomerGroup {
  id: string;
  nome: string;
  descricao?: string;
  desconto_percentual?: number;
  created_at: string;
}

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
    fetchCustomerGroups();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          customer_groups!grupo_pessoas_id(nome, desconto_percentual)
        `)
        .order('nome');
      
      if (error) throw error;
      setCustomers(data || []);
    } catch (error: unknown) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os clientes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_groups')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      setCustomerGroups(data || []);
    } catch (error: unknown) {
      console.error('Error fetching customer groups:', error);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.telefone?.includes(searchTerm) ||
    customer.whatsapp?.includes(searchTerm) ||
    customer.cpf?.includes(searchTerm)
  );

  return (
    <Layout title="Gestão de Clientes">
      <div className="space-y-6">
        {/* Customer Groups Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <UserPlus className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{customers.length}</p>
                  <p className="text-sm text-muted-foreground">Total de Clientes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {customerGroups.map((group, index) => (
            <Card key={group.id} className="card-elevated">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">{Number(group.desconto_percentual)}%</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {customers.filter(c => c.grupo_pessoas_id === group.id).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Grupo {group.nome}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button className="btn-pos-primary">
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </div>

        {/* Customers Table */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Clientes Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Total Compras</TableHead>
                  <TableHead>Última Compra</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      Carregando clientes...
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      Nenhum cliente encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="font-medium">{customer.nome}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {customer.telefone && (
                            <div className="flex items-center text-sm">
                              <Phone className="h-3 w-3 mr-1" />
                              {customer.telefone}
                            </div>
                          )}
                          {customer.whatsapp && (
                            <div className="text-xs text-muted-foreground">
                              WhatsApp: {customer.whatsapp}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {customer.cpf || '-'}
                      </TableCell>
                      <TableCell>
                        {customer.customer_groups ? (
                          <Badge variant="default" className="flex items-center space-x-1">
                            <span>{customer.customer_groups.nome}</span>
                            <span className="text-xs">({Number(customer.customer_groups.desconto_percentual)}%)</span>
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Sem grupo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">R$ 0,00</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">-</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">Ativo</Badge>
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
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredCustomers.slice(0, 3).map((customer) => (
                <div key={customer.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <div className="font-medium">{customer.nome}</div>
                    <div className="text-sm text-muted-foreground">
                      Cadastrado em: {new Date(customer.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {customer.customer_groups?.nome || 'Sem grupo'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {customer.telefone || customer.whatsapp || '-'}
                    </div>
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

export default Customers;