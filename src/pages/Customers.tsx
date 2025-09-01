import { useState } from "react";
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

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock customers data
  const customers = [
    {
      id: "1",
      name: "Maria Silva Santos",
      email: "maria.silva@email.com",
      phone: "(11) 99999-9999",
      document: "123.456.789-00",
      group: "VIP",
      groupDiscount: 15,
      totalPurchases: 2840.50,
      lastPurchase: "2024-01-15",
      status: "Ativo"
    },
    {
      id: "2",
      name: "João Pedro Oliveira",
      email: "joao.pedro@email.com",
      phone: "(11) 88888-8888",
      document: "987.654.321-00",
      group: "Regular",
      groupDiscount: 5,
      totalPurchases: 890.30,
      lastPurchase: "2024-01-10",
      status: "Ativo"
    },
    {
      id: "3",
      name: "Ana Carolina Lima",
      email: "ana.lima@email.com",
      phone: "(11) 77777-7777",
      document: "456.789.123-00",
      group: "VIP",
      groupDiscount: 15,
      totalPurchases: 4250.80,
      lastPurchase: "2023-12-28",
      status: "Ativo"
    },
    {
      id: "4",
      name: "Carlos Eduardo Santos",
      email: "carlos.santos@email.com",
      phone: "(11) 66666-6666",
      document: "789.123.456-00",
      group: "Regular",
      groupDiscount: 5,
      totalPurchases: 156.90,
      lastPurchase: "2023-11-15",
      status: "Inativo"
    },
  ];

  const customerGroups = [
    { name: "VIP", discount: 15, count: 2, color: "bg-yellow-500" },
    { name: "Regular", discount: 5, count: 2, color: "bg-blue-500" },
  ];

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.document.includes(searchTerm)
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

          {customerGroups.map((group) => (
            <Card key={group.name} className="card-elevated">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full ${group.color} flex items-center justify-center`}>
                    <span className="text-white text-sm font-semibold">{group.discount}%</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{group.count}</p>
                    <p className="text-sm text-muted-foreground">Grupo {group.name}</p>
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
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center mt-1">
                          <Mail className="h-3 w-3 mr-1" />
                          {customer.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Phone className="h-3 w-3 mr-1" />
                        {customer.phone}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {customer.document}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={customer.group === "VIP" ? "default" : "secondary"}
                        className="flex items-center space-x-1"
                      >
                        <span>{customer.group}</span>
                        <span className="text-xs">({customer.groupDiscount}%)</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">
                        R$ {customer.totalPurchases.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(customer.lastPurchase).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={customer.status === "Ativo" ? "default" : "secondary"}
                      >
                        {customer.status}
                      </Badge>
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
                ))}
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
              {customers.slice(0, 3).map((customer) => (
                <div key={customer.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Última compra: {new Date(customer.lastPurchase).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">R$ {customer.totalPurchases.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Total em compras</div>
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