import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface PaymentMethodFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editData?: any;
}

export default function PaymentMethodFormModal({ isOpen, onClose, onSave, editData }: PaymentMethodFormModalProps) {
  const [nome, setNome] = useState('');
  // Alinhar com enum do banco: "PIX" | "DINHEIRO" | "CREDITO" | "DEBITO"
  const [tipo, setTipo] = useState<'PIX' | 'DINHEIRO' | 'CREDITO' | 'DEBITO'>('DINHEIRO');
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    if (editData) {
      setNome(editData.nome || '');
      setTipo(editData.tipo || 'DINHEIRO');
      setAtivo(editData.ativo ?? true);
    } else {
      setNome('');
      setTipo('DINHEIRO');
      setAtivo(true);
    }
  }, [editData, isOpen]);

  // Pré-preencher o nome quando estiver vazio, conforme o tipo
  useEffect(() => {
    if (!editData && !nome.trim()) {
      const defaultName =
        tipo === 'DINHEIRO' ? 'Dinheiro' :
        tipo === 'PIX' ? 'PIX' :
        tipo === 'DEBITO' ? 'Cartão Débito' :
        'Cartão Crédito';
      setNome(defaultName);
    }
  }, [tipo, editData, nome]);

  const handleSubmit = () => {
    const data = {
      nome,
      tipo,
      ativo,
      // Calcular automaticamente pelo tipo
      exige_bandeira: tipo === 'CREDITO' || tipo === 'DEBITO',
      permite_parcelas: tipo === 'CREDITO',
    };

    if (editData) {
      onSave({ id: editData.id, updates: data });
    } else {
      onSave(data);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editData ? 'Editar' : 'Nova'} Forma de Pagamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Cartão Visa" />
          </div>

          <div>
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={(val: any) => setTipo(val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                <SelectItem value="PIX">PIX</SelectItem>
                <SelectItem value="DEBITO">Cartão Débito</SelectItem>
                <SelectItem value="CREDITO">Cartão Crédito</SelectItem>
                <SelectItem value="EMPRESTIMO">Emprestimo</SelectItem>

              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label>Ativo</Label>
            <Switch checked={ativo} onCheckedChange={setAtivo} />
          </div>

          {/* Bandeira e Parcelas agora são derivadas automaticamente pelo tipo */}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!nome.trim()}>Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
