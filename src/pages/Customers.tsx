import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Plus, Search, Edit, Eye, UserPlus, Phone, Mail, Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";

/* ====================== Tipos ======================= */
type CustomerGroup = {
  id: string;
  nome: string;
  desconto_percentual: number;
};

type Customer = {
  id: string;
  nome: string;
  telefone: string | null;
  whatsapp: string | null;
  cpf: string | null;
  aniversario: string | null; // ISO date
  endereco: any | null;       // JSON
  grupo_pessoas_id: string | null;
  aceita_mensagens: boolean | null;
  created_at: string;
  customer_groups?: { nome: string; desconto_percentual: number } | null;
};

type CustomerStats = {
  total: number;
  last: string | null;
  orders: number;
};

/* ====================== Modal de Cadastro/Edição ======================= */

function CustomerFormDialog({
  open,
  onClose,
  groups,
  initial,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  groups: CustomerGroup[];
  initial?: Partial<Customer> | null;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);

  const [nome, setNome] = useState(initial?.nome ?? "");
  const [telefone, setTelefone] = useState(initial?.telefone ?? "");
  const [aceitaMensagens, setAceitaMensagens] = useState(initial?.aceita_mensagens ?? true);
  const [cpf, setCpf] = useState(initial?.cpf ?? "");
  const [aniversario, setAniversario] = useState(
    initial?.aniversario ? initial.aniversario.slice(0, 10) : ""
  );
  const [grupoId, setGrupoId] = useState<string>(initial?.grupo_pessoas_id ?? "none");
  // endereço simples -> salvamos como JSON
  const [cep, setCep] = useState(initial?.endereco?.cep ?? "");
  const [rua, setRua] = useState(initial?.endereco?.rua ?? "");
  const [numero, setNumero] = useState(initial?.endereco?.numero ?? "");
  const [bairro, setBairro] = useState(initial?.endereco?.bairro ?? "");
  const [cidade, setCidade] = useState(initial?.endereco?.cidade ?? "");
  const [uf, setUf] = useState(initial?.endereco?.uf ?? "");
  const [complemento, setComplemento] = useState(initial?.endereco?.complemento ?? "");

  useEffect(() => {
    if (!open) return;
    setNome(initial?.nome ?? "");
    setTelefone(initial?.telefone ?? "");
    setAceitaMensagens(initial?.aceita_mensagens ?? true);
    setCpf(initial?.cpf ?? "");
    setAniversario(initial?.aniversario ? initial.aniversario.slice(0, 10) : "");
    setGrupoId(initial?.grupo_pessoas_id ?? "none");
    setCep(initial?.endereco?.cep ?? "");
    setRua(initial?.endereco?.rua ?? "");
    setNumero(initial?.endereco?.numero ?? "");
    setBairro(initial?.endereco?.bairro ?? "");
    setCidade(initial?.endereco?.cidade ?? "");
    setUf(initial?.endereco?.uf ?? "");
    setComplemento(initial?.endereco?.complemento ?? "");
  }, [open, initial]);

  // Máscaras
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, "$1.$2.$3-$4");
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/(\d{5})(\d{0,3})/, "$1-$2");
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numbers = e.target.value.replace(/\D/g, "").slice(0, 11);
    setTelefone(numbers);
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numbers = e.target.value.replace(/\D/g, "").slice(0, 11);
    setCpf(numbers);
  };

  const handleCEPChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const numbers = e.target.value.replace(/\D/g, "").slice(0, 8);
    setCep(numbers);

    // Busca o endereço quando o CEP tiver 8 dígitos
    if (numbers.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${numbers}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setRua(data.logradouro || "");
          setBairro(data.bairro || "");
          setCidade(data.localidade || "");
          setUf(data.uf || "");
        } else {
          // CEP não encontrado - limpa os campos
          setRua("");
          setBairro("");
          setCidade("");
          setUf("");
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        // Em caso de erro, não faz nada (mantém os campos como estão)
      }
    }
  };

  const enderecoJson = {
    cep: cep || null,
    rua: rua || null,
    numero: numero || null,
    bairro: bairro || null,
    cidade: cidade || null,
    uf: uf || null,
    complemento: complemento || null,
  };

  async function handleSave() {
    if (!nome.trim()) return;

    setSaving(true);
    const payload = {
      nome: nome.trim(),
      telefone: telefone || null,
      whatsapp: telefone || null, // usar o mesmo telefone para WhatsApp
      aceita_mensagens: aceitaMensagens,
      cpf: cpf || null,
      aniversario: aniversario ? new Date(aniversario).toISOString() : null,
      grupo_pessoas_id: grupoId === "none" ? null : grupoId,
      endereco: enderecoJson,
    };

    let error;
    if (initial?.id) {
      ({ error } = await supabase.from("customers").update(payload).eq("id", initial.id));
    } else {
      ({ error } = await supabase.from("customers").insert(payload));
    }
    setSaving(false);
    if (error) {
      console.error(error);
      return;
    }
    onSaved();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent aria-describedby="customer-form-desc" className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          <DialogDescription id="customer-form-desc">
            Preencha os dados do cliente. O endereço é salvo como JSON.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12">
            <Label>Nome*</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Maria Silva" />
          </div>

          <div className="col-span-12 md:col-span-5">
            <Label>Telefone/WhatsApp</Label>
            <Input 
              value={formatPhone(telefone)} 
              onChange={handlePhoneChange} 
              placeholder="(11) 99999-0000" 
            />
          </div>
          <div className="col-span-12 md:col-span-4">
            <Label>CPF</Label>
            <Input 
              value={formatCPF(cpf)} 
              onChange={handleCPFChange} 
              placeholder="000.000.000-00" 
            />
          </div>
          <div className="col-span-12 md:col-span-3 flex items-end">
            <div className="flex items-center space-x-2 pb-2">
              <input
                type="checkbox"
                id="aceita-mensagens"
                checked={aceitaMensagens}
                onChange={(e) => setAceitaMensagens(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="aceita-mensagens" className="cursor-pointer text-sm">
                Aceita ofertas no WhatsApp
              </Label>
            </div>
          </div>

          <div className="col-span-12 md:col-span-4">
            <Label>Aniversário</Label>
            <Input type="date" value={aniversario ?? ""} onChange={(e) => setAniversario(e.target.value)} />
          </div>
          <div className="col-span-12 md:col-span-8">
            <Label>Grupo de clientes</Label>
            <Select value={grupoId} onValueChange={setGrupoId}>
              <SelectTrigger><SelectValue placeholder="(sem grupo)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">(sem grupo)</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.nome} ({Number(g.desconto_percentual)}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Endereço */}
          <div className="col-span-12 md:col-span-3">
            <Label>CEP</Label>
            <Input 
              value={formatCEP(cep)} 
              onChange={handleCEPChange} 
              placeholder="00000-000"
            />
          </div>
          <div className="col-span-12 md:col-span-6">
            <Label>Rua</Label>
            <Input value={rua} onChange={(e) => setRua(e.target.value)} />
          </div>
          <div className="col-span-12 md:col-span-3">
            <Label>Número</Label>
            <Input value={numero} onChange={(e) => setNumero(e.target.value)} />
          </div>
          <div className="col-span-12 md:col-span-4">
            <Label>Bairro</Label>
            <Input value={bairro} onChange={(e) => setBairro(e.target.value)} />
          </div>
          <div className="col-span-12 md:col-span-5">
            <Label>Cidade</Label>
            <Input value={cidade} onChange={(e) => setCidade(e.target.value)} />
          </div>
          <div className="col-span-12 md:col-span-3">
            <Label>UF</Label>
            <Input value={uf} onChange={(e) => setUf(e.target.value)} />
          </div>
          <div className="col-span-12">
            <Label>Complemento</Label>
            <Input value={complemento} onChange={(e) => setComplemento(e.target.value)} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!nome.trim() || saving}>
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando…</> : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ====================== Página /customers ======================= */

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, CustomerStats>>({});
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    await Promise.all([fetchCustomers(), fetchCustomerGroups()]);
    await fetchCustomerStats();
    setLoading(false);
  }

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from("customers")
      .select(`
        id, nome, telefone, whatsapp, cpf, aniversario, endereco, grupo_pessoas_id, created_at,
        customer_groups!grupo_pessoas_id ( nome, desconto_percentual )
      `)
      .order("nome")
      .returns<any[]>();
    if (error) {
      console.error("Error fetching customers:", error);
      toast({ title: "Erro", description: "Não foi possível carregar os clientes", variant: "destructive" });
      return;
    }
    setCustomers((data as Customer[]) ?? []);
  };

  const fetchCustomerGroups = async () => {
    const { data, error } = await supabase
      .from("customer_groups")
      .select("id, nome, desconto_percentual")
      .order("nome")
      .returns<CustomerGroup[]>();
    if (error) {
      console.error("Error fetching customer groups:", error);
      return;
    }
    setCustomerGroups(data ?? []);
  };

  // Agregados: total comprado e última compra por cliente
  const fetchCustomerStats = async () => {
    if (!customers.length) { setStats({}); return; }
    const ids = customers.map(c => c.id);
    // Evita .in() com lista vazia
    if (ids.length === 0) { setStats({}); return; }

    const { data, error } = await supabase
      .from("sales")
      .select("customer_id, total_liquido, data")
      .in("customer_id", ids);
    if (error) { console.error(error); setStats({}); return; }

    const map: Record<string, CustomerStats> = {};
    (data ?? []).forEach((s: any) => {
      const cid = s.customer_id as string;
      const valor = Number(s.total_liquido ?? 0);
      const dt = s.data as string;

      if (!map[cid]) map[cid] = { total: 0, last: null, orders: 0 };
      map[cid].total += valor;
      map[cid].orders += 1;
      if (!map[cid].last || new Date(dt) > new Date(map[cid].last)) {
        map[cid].last = dt;
      }
    });
    setStats(map);
  };

  const filteredCustomers = customers.filter((customer) => {
    const q = searchTerm.toLowerCase();
    return (
      customer.nome?.toLowerCase().includes(q) ||
      customer.telefone?.includes(searchTerm) ||
      customer.whatsapp?.includes(searchTerm) ||
      customer.cpf?.includes(searchTerm)
    );
  });

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(c: Customer) {
    setEditing(c);
    setFormOpen(true);
  }

  async function onSaved() {
    await loadAll();
    toast({ title: "Cliente salvo", description: "Os dados foram atualizados com sucesso." });
  }

  return (
    <Layout title="Gestão de Clientes">
      <div className="space-y-6">
        {/* Cards superiores */}
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
            <Card key={group.id} className="card-elevated">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {Number(group.desconto_percentual)}%
                    </span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {customers.filter((c) => c.grupo_pessoas_id === group.id).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Grupo {group.nome}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Barra de ações */}
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
          <Button className="btn-pos-primary" onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </div>

        {/* Tabela */}
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
                      <div className="inline-flex items-center text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando clientes...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      Nenhum cliente encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => {
                    const st = stats[customer.id];
                    return (
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
                          {customer.cpf || "-"}
                        </TableCell>
                        <TableCell>
                          {customer.customer_groups ? (
                            <Badge variant="default" className="flex items-center space-x-1">
                              <span>{customer.customer_groups.nome}</span>
                              <span className="text-xs">
                                ({Number(customer.customer_groups.desconto_percentual)}%)
                              </span>
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Sem grupo</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">
                            R$ {(st?.total ?? 0).toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {st?.last ? new Date(st.last).toLocaleDateString("pt-BR") : "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">Ativo</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="icon" onClick={() => openEdit(customer)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" disabled>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Atividade recente */}
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
                      Cadastrado em: {new Date(customer.created_at).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {customer.customer_groups?.nome || "Sem grupo"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {customer.telefone || customer.whatsapp || "-"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de cadastro/edição */}
      <CustomerFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        groups={customerGroups}
        initial={editing ?? undefined}
        onSaved={onSaved}
      />
    </Layout>
  );
};

export default Customers;
