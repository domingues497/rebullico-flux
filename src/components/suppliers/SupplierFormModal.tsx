import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface SupplierData {
  id?: string;
  nome: string;
  cnpj_cpf?: string;
  contato?: {
    telefone?: string;
    email?: string;
    endereco?: string;
  };
  nome_vendedor?: string;
  telefone_vendedor?: string;
  email_vendedor?: string;
  formas_pagamento?: string[];
  limite_credito?: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: SupplierData) => Promise<void>;
  supplier?: SupplierData | null;
}

export function SupplierFormModal({ open, onOpenChange, onSave, supplier }: Props) {
  const { toast } = useToast();

  const [nome, setNome] = useState('');
  const [cnpjCpf, setCnpjCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');
  const [nomeVendedor, setNomeVendedor] = useState('');
  const [telefoneVendedor, setTelefoneVendedor] = useState('');
  const [emailVendedor, setEmailVendedor] = useState('');
  const [formasPagamento, setFormasPagamento] = useState<string[]>([]);
  const [limiteCredito, setLimiteCredito] = useState('');
  const [loading, setLoading] = useState(false);
  const [consultingCNPJ, setConsultingCNPJ] = useState(false);

  useEffect(() => {
    if (supplier) {
      setNome(supplier.nome || '');
      setCnpjCpf(supplier.cnpj_cpf || '');
      setTelefone(supplier.contato?.telefone || '');
      setEmail(supplier.contato?.email || '');
      setEndereco(supplier.contato?.endereco || '');
      setNomeVendedor(supplier.nome_vendedor || '');
      setTelefoneVendedor(supplier.telefone_vendedor || '');
      setEmailVendedor(supplier.email_vendedor || '');
      setFormasPagamento(supplier.formas_pagamento || []);
      setLimiteCredito(supplier.limite_credito?.toString() || '');
    } else {
      setNome('');
      setCnpjCpf('');
      setTelefone('');
      setEmail('');
      setEndereco('');
      setNomeVendedor('');
      setTelefoneVendedor('');
      setEmailVendedor('');
      setFormasPagamento([]);
      setLimiteCredito('');
    }
  }, [supplier, open]);

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, "$1.$2.$3/$4-$5");
  };

  const handleCNPJChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const numbers = e.target.value.replace(/\D/g, "").slice(0, 14);
    setCnpjCpf(numbers);

    // Busca na Receita Federal quando o CNPJ tiver 14 dígitos
    if (numbers.length === 14) {
      setConsultingCNPJ(true);
      try {
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${numbers}`);
        
        if (response.ok) {
          const data = await response.json();
          
          // Preencher dados da empresa
          setNome(data.razao_social || data.nome_fantasia || "");
          setTelefone(data.ddd_telefone_1 ? data.ddd_telefone_1.replace(/\D/g, "") : "");
          setEmail(data.email || "");
          
          // Preencher endereço
          const enderecoParts = [
            data.logradouro,
            data.numero,
            data.complemento,
            data.bairro,
            data.municipio,
            data.uf
          ].filter(Boolean);
          
          setEndereco(enderecoParts.join(", "));
          
          toast({
            title: 'CNPJ encontrado!',
            description: 'Dados da empresa preenchidos automaticamente.',
          });
        } else {
          toast({
            title: 'CNPJ não encontrado',
            description: 'Não foi possível consultar este CNPJ.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error("Erro ao consultar CNPJ:", error);
        toast({
          title: 'Erro na consulta',
          description: 'Não foi possível consultar a Receita Federal.',
          variant: 'destructive',
        });
      } finally {
        setConsultingCNPJ(false);
      }
    }
  };

  const handleFormasPagamentoChange = (forma: string, checked: boolean) => {
    setFormasPagamento(prev => 
      checked 
        ? [...prev, forma]
        : prev.filter(f => f !== forma)
    );
  };

  const handleSave = async () => {
    try {
      if (!nome.trim()) {
        toast({
          title: 'Nome obrigatório',
          description: 'Informe o nome do fornecedor',
          variant: 'destructive',
        });
        return;
      }

      setLoading(true);

      const supplierData: SupplierData = {
        nome: nome.trim(),
        cnpj_cpf: cnpjCpf.trim() || undefined,
        contato: {
          telefone: telefone.trim() || undefined,
          email: email.trim() || undefined,
          endereco: endereco.trim() || undefined,
        },
        nome_vendedor: nomeVendedor.trim() || undefined,
        telefone_vendedor: telefoneVendedor.trim() || undefined,
        email_vendedor: emailVendedor.trim() || undefined,
        formas_pagamento: formasPagamento.length > 0 ? formasPagamento : undefined,
        limite_credito: limiteCredito ? parseFloat(limiteCredito) : undefined,
      };

      if (supplier?.id) {
        supplierData.id = supplier.id;
      }

      await onSave(supplierData);

      setNome('');
      setCnpjCpf('');
      setTelefone('');
      setEmail('');
      setEndereco('');
      setNomeVendedor('');
      setTelefoneVendedor('');
      setEmailVendedor('');
      setFormasPagamento([]);
      setLimiteCredito('');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {supplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <Label>CNPJ *</Label>
            <div className="relative">
              <Input
                value={formatCNPJ(cnpjCpf)}
                onChange={handleCNPJChange}
                placeholder="00.000.000/0000-00"
                disabled={consultingCNPJ}
              />
              {consultingCNPJ && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>

          <div>
            <Label>Razão Social *</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do fornecedor"
            />
          </div>

          <div className="border-t pt-4">
            <Label className="text-base font-semibold mb-3 block">Contato da Empresa</Label>

            <div className="space-y-3">
              <div>
                <Label className="text-sm">Telefone</Label>
                <Input
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <Label className="text-sm">E-mail</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="fornecedor@email.com"
                />
              </div>

              <div>
                <Label className="text-sm">Endereço</Label>
                <Input
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua, número, bairro, cidade"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <Label className="text-base font-semibold mb-3 block">Dados do Vendedor</Label>

            <div className="space-y-3">
              <div>
                <Label className="text-sm">Nome do Vendedor</Label>
                <Input
                  value={nomeVendedor}
                  onChange={(e) => setNomeVendedor(e.target.value)}
                  placeholder="Nome do vendedor"
                />
              </div>

              <div>
                <Label className="text-sm">Telefone do Vendedor</Label>
                <Input
                  value={telefoneVendedor}
                  onChange={(e) => setTelefoneVendedor(e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <Label className="text-sm">E-mail do Vendedor</Label>
                <Input
                  type="email"
                  value={emailVendedor}
                  onChange={(e) => setEmailVendedor(e.target.value)}
                  placeholder="vendedor@email.com"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <Label className="text-base font-semibold mb-3 block">Condições Comerciais</Label>

            <div className="space-y-3">
              <div>
                <Label className="text-sm mb-2 block">Formas de Pagamento Aceitas</Label>
                <div className="space-y-2">
                  {['Dinheiro', 'PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Boleto', 'Cheque'].map((forma) => (
                    <div key={forma} className="flex items-center space-x-2">
                      <Checkbox
                        id={forma}
                        checked={formasPagamento.includes(forma)}
                        onCheckedChange={(checked) => 
                          handleFormasPagamentoChange(forma, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={forma}
                        className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {forma}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm">Limite de Crédito (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={limiteCredito}
                  onChange={(e) => setLimiteCredito(e.target.value)}
                  placeholder="0,00"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-background">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
