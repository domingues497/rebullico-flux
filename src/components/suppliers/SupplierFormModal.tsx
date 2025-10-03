import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface SupplierData {
  id?: string;
  nome: string;
  cnpj_cpf?: string;
  contato?: {
    telefone?: string;
    email?: string;
    endereco?: string;
  };
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (supplier) {
      setNome(supplier.nome || '');
      setCnpjCpf(supplier.cnpj_cpf || '');
      setTelefone(supplier.contato?.telefone || '');
      setEmail(supplier.contato?.email || '');
      setEndereco(supplier.contato?.endereco || '');
    } else {
      setNome('');
      setCnpjCpf('');
      setTelefone('');
      setEmail('');
      setEndereco('');
    }
  }, [supplier, open]);

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

        <div className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do fornecedor"
            />
          </div>

          <div>
            <Label>CNPJ / CPF</Label>
            <Input
              value={cnpjCpf}
              onChange={(e) => setCnpjCpf(e.target.value)}
              placeholder="00.000.000/0000-00"
            />
          </div>

          <div className="border-t pt-4">
            <Label className="text-base font-semibold mb-3 block">Contato</Label>

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

          <div className="flex justify-end gap-2 pt-4">
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
