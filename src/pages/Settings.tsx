import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Settings as SettingsIcon,
  CreditCard,
  Users,
  Save,
  Plus,
  Edit,
  Trash2
} from "lucide-react";

const Settings = () => {
  const [roundingEnabled, setRoundingEnabled] = useState(false);

  // Mock payment methods data
  const paymentMethods = [
    { id: "1", name: "Dinheiro", feePercent: 0, allowInstallments: false, active: true },
    { id: "2", name: "Cartão de Crédito", feePercent: 3.5, allowInstallments: true, active: true },
    { id: "3", name: "Cartão de Débito", feePercent: 2.0, allowInstallments: false, active: true },
    { id: "4", name: "PIX", feePercent: 0, allowInstallments: false, active: true },
    { id: "5", name: "Fiado", feePercent: 0, allowInstallments: false, active: true },
  ];

  // Mock customer groups data
  const customerGroups = [
    { id: "1", name: "VIP", discountPercent: 15, active: true },
    { id: "2", name: "Regular", discountPercent: 5, active: true },
    { id: "3", name: "Funcionários", discountPercent: 20, active: true },
  ];

  return (
    <Layout title="Configurações do Sistema">
      <div className="space-y-6">
        {/* General Settings */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center">
              <SettingsIcon className="mr-2 h-5 w-5" />
              Configurações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="storeName">Nome da Loja</Label>
                <Input id="storeName" defaultValue="Rebulliço" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input id="cnpj" placeholder="00.000.000/0000-00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" placeholder="Rua, número, bairro" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" placeholder="(11) 99999-9999" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Arredondamento para R$ 0,05</Label>
                <p className="text-sm text-muted-foreground">
                  Arredondar o total da venda para múltiplos de 5 centavos
                </p>
              </div>
              <Switch
                checked={roundingEnabled}
                onCheckedChange={setRoundingEnabled}
              />
            </div>

            <div className="flex justify-end">
              <Button className="btn-pos-primary">
                <Save className="mr-2 h-4 w-4" />
                Salvar Configurações
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Formas de Pagamento
              </div>
              <Button className="btn-pos-primary">
                <Plus className="mr-2 h-4 w-4" />
                Nova Forma
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Forma de Pagamento</TableHead>
                  <TableHead>Taxa (%)</TableHead>
                  <TableHead>Parcelamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentMethods.map((method) => (
                  <TableRow key={method.id}>
                    <TableCell className="font-medium">{method.name}</TableCell>
                    <TableCell>{method.feePercent}%</TableCell>
                    <TableCell>
                      <Badge variant={method.allowInstallments ? "default" : "secondary"}>
                        {method.allowInstallments ? "Sim" : "Não"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={method.active ? "default" : "secondary"}>
                        {method.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Customer Groups */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Grupos de Clientes
              </div>
              <Button className="btn-pos-primary">
                <Plus className="mr-2 h-4 w-4" />
                Novo Grupo
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Grupo</TableHead>
                  <TableHead>Desconto (%)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerGroups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{group.discountPercent}%</span>
                        <Badge variant="outline">Automático</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={group.active ? "default" : "secondary"}>
                        {group.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Receipt Settings */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Configurações do Recibo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="receiptHeader">Cabeçalho do Recibo</Label>
                <Input id="receiptHeader" defaultValue="REBULLIÇO - NO CAMPO E NA CIDADE" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receiptFooter">Rodapé do Recibo</Label>
                <Input id="receiptFooter" defaultValue="Obrigado pela preferência!" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Imprimir duas vias</Label>
                  <p className="text-sm text-muted-foreground">
                    Uma via para o cliente e outra para controle
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Incluir QR Code</Label>
                  <p className="text-sm text-muted-foreground">
                    QR Code para consulta online da venda
                  </p>
                </div>
                <Switch />
              </div>
            </div>

            <div className="flex justify-end">
              <Button className="btn-pos-primary">
                <Save className="mr-2 h-4 w-4" />
                Salvar Configurações
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Settings;