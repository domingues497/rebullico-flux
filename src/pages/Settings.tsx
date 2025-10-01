import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  Trash2,
  Store,
  DollarSign,
  Package,
  Monitor
} from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/hooks/use-toast";
import type { Settings } from "@/types/settings";

const Settings = () => {
  // Store Information
  const [storeName, setStoreName] = useState("");
  const [storeCnpj, setStoreCnpj] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeEmail, setStoreEmail] = useState("");

  // POS Configuration
  const [enableRoundingTo05, setEnableRoundingTo05] = useState(false);
  const [allowPriceEditSeller, setAllowPriceEditSeller] = useState(false);
  const [autoPrintReceipt, setAutoPrintReceipt] = useState(true);
  const [receiptFooter, setReceiptFooter] = useState("");

  // Financial Settings
  const [defaultTaxRate, setDefaultTaxRate] = useState(0);
  const [currencySymbol, setCurrencySymbol] = useState("R$");

  // Inventory Settings
  const [lowStockAlert, setLowStockAlert] = useState(true);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [autoUpdateStock, setAutoUpdateStock] = useState(true);
  const [trackInventory, setTrackInventory] = useState(true);

  // System Settings
  const [autoBackup, setAutoBackup] = useState(false);
  const [backupFrequencyDays, setBackupFrequencyDays] = useState(7);
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("pt-BR");

  const { settings, loading, updateSettings } = useSettings();
  const { toast } = useToast();

  // Carregar configurações quando os dados estiverem disponíveis
  useEffect(() => {
    if (settings) {
      console.log('Carregando configurações do settings:', settings);
      const s = settings as unknown as Settings;
      
      // Store Information
      setStoreName(s.store_name || "");
      setStoreCnpj(s.store_cnpj || "");
      setStoreAddress(s.store_address || "");
      setStorePhone(s.store_phone || "");
      setStoreEmail(s.store_email || "");

      // POS Configuration
      setEnableRoundingTo05(s.enable_rounding_to_05 || false);
      setAllowPriceEditSeller(s.allow_price_edit_seller || false);
      setAutoPrintReceipt(s.auto_print_receipt || true);
      setReceiptFooter(s.receipt_footer || "");

      // Financial Settings
      setDefaultTaxRate(s.default_tax_rate || 0);
      setCurrencySymbol(s.currency_symbol || "R$");

      // Inventory Settings
      setLowStockAlert(s.low_stock_alert || true);
      setLowStockThreshold(s.low_stock_threshold || 10);
      setAutoUpdateStock(s.auto_update_stock || true);
      setTrackInventory(s.track_inventory || true);

      // System Settings
      setAutoBackup(s.auto_backup || false);
      setBackupFrequencyDays(s.backup_frequency_days || 7);
      setTheme(s.theme || "light");
      setLanguage(s.language || "pt-BR");
    }
  }, [settings]);

  // Função para salvar configurações
  const handleSaveSettings = async () => {
    const data = {
      store_name: storeName,
      store_cnpj: storeCnpj,
      store_address: storeAddress,
      store_phone: storePhone,
      store_email: storeEmail,
      enable_rounding_to_05: enableRoundingTo05,
      allow_price_edit_seller: allowPriceEditSeller,
      auto_print_receipt: autoPrintReceipt,
      receipt_footer: receiptFooter,
      default_tax_rate: defaultTaxRate,
      currency_symbol: currencySymbol,
      low_stock_alert: lowStockAlert,
      low_stock_threshold: lowStockThreshold,
      auto_update_stock: autoUpdateStock,
      track_inventory: trackInventory,
      auto_backup: autoBackup,
      backup_frequency_days: backupFrequencyDays,
      theme: theme,
      language: language
    };
    
    console.log('Dados a serem salvos:', data);
    
    const success = await updateSettings(data);
    if (success) {
      toast({
        title: "Configurações salvas",
        description: "As configurações foram atualizadas com sucesso.",
      });
    } else {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    }
  };

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
        {/* Store Information */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Store className="mr-2 h-5 w-5" />
              Informações da Loja
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="storeName">Nome da Loja</Label>
                <Input
                  id="storeName"
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Nome da sua loja"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeCnpj">CNPJ</Label>
                <Input
                  id="storeCnpj"
                  type="text"
                  value={storeCnpj}
                  onChange={(e) => setStoreCnpj(e.target.value)}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeAddress">Endereço</Label>
                <Input
                  id="storeAddress"
                  type="text"
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  placeholder="Endereço completo da loja"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storePhone">Telefone</Label>
                <Input
                  id="storePhone"
                  type="text"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeEmail">E-mail</Label>
                <Input
                  id="storeEmail"
                  type="email"
                  value={storeEmail}
                  onChange={(e) => setStoreEmail(e.target.value)}
                  placeholder="contato@loja.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* POS Configuration */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Monitor className="mr-2 h-5 w-5" />
              Configurações do PDV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Arredondamento para R$ 0,05</Label>
                  <p className="text-sm text-muted-foreground">
                    Arredondar valores para múltiplos de 5 centavos
                  </p>
                </div>
                <Switch
                  checked={enableRoundingTo05}
                  onCheckedChange={setEnableRoundingTo05}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Permitir edição de preço</Label>
                  <p className="text-sm text-muted-foreground">
                    Vendedor pode alterar preços durante a venda
                  </p>
                </div>
                <Switch
                  checked={allowPriceEditSeller}
                  onCheckedChange={setAllowPriceEditSeller}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Impressão automática</Label>
                  <p className="text-sm text-muted-foreground">
                    Imprimir cupom automaticamente após venda
                  </p>
                </div>
                <Switch
                  checked={autoPrintReceipt}
                  onCheckedChange={setAutoPrintReceipt}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="receiptFooter">Rodapé do Cupom</Label>
              <Textarea
                id="receiptFooter"
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                placeholder="Mensagem que aparece no final do cupom"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial Settings */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5" />
              Configurações Financeiras
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="defaultTaxRate">Taxa de Imposto Padrão (%)</Label>
                <Input
                  id="defaultTaxRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={defaultTaxRate}
                  onChange={(e) => setDefaultTaxRate(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currencySymbol">Símbolo da Moeda</Label>
                <Input
                  id="currencySymbol"
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  placeholder="R$"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Settings */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Configurações de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alerta de estoque baixo</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificar quando produtos estão com estoque baixo
                  </p>
                </div>
                <Switch
                  checked={lowStockAlert}
                  onCheckedChange={setLowStockAlert}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lowStockThreshold">Limite para estoque baixo</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  min="1"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 10)}
                  placeholder="10"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Atualização automática</Label>
                  <p className="text-sm text-muted-foreground">
                    Atualizar estoque automaticamente nas vendas
                  </p>
                </div>
                <Switch
                  checked={autoUpdateStock}
                  onCheckedChange={setAutoUpdateStock}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Controle de estoque</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar controle de estoque para produtos
                  </p>
                </div>
                <Switch
                  checked={trackInventory}
                  onCheckedChange={setTrackInventory}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center">
              <SettingsIcon className="mr-2 h-5 w-5" />
              Configurações do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Backup automático</Label>
                  <p className="text-sm text-muted-foreground">
                    Realizar backup automático dos dados
                  </p>
                </div>
                <Switch
                  checked={autoBackup}
                  onCheckedChange={setAutoBackup}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="backupFrequencyDays">Frequência do backup (dias)</Label>
                <Input
                  id="backupFrequencyDays"
                  type="number"
                  min="1"
                  value={backupFrequencyDays}
                  onChange={(e) => setBackupFrequencyDays(parseInt(e.target.value) || 7)}
                  placeholder="7"
                />
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <Button 
                onClick={handleSaveSettings} 
                disabled={loading}
                className="min-w-[120px]"
              >
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Salvando..." : "Salvar Configurações"}
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