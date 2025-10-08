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
  const [tipo, setTipo] = useState<'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'pix' | 'boleto'>('dinheiro');
  const [ativo, setAtivo] = useState(true);
  const [exigeBandeira, setExigeBandeira] = useState(false);
  const [permiteParcelas, setPermiteParcelas] = useState(false);

  useEffect(() => {
    if (editData) {
      setNome(editData.nome || '');
      setTipo(editData.tipo || 'dinheiro');
      setAtivo(editData.ativo ?? true);
      setExigeBandeira(editData.exige_bandeira ?? false);
      setPermiteParcelas(editData.permite_parcelas ?? false);
    } else {
      setNome('');
      setTipo('dinheiro');
      setAtivo(true);
      setExigeBandeira(false);
      setPermiteParcelas(false);
    }
  }, [editData, isOpen]);

  // Auto-ajustar flags baseado no tipo
  useEffect(() => {
    if (tipo === 'cartao_credito') {
      setExigeBandeira(true);
      setPermiteParcelas(true);
    } else if (tipo === 'cartao_debito') {
      setExigeBandeira(true);
      setPermiteParcelas(false);
    } else {
      setExigeBandeira(false);
      setPermiteParcelas(false);
    }
  }, [tipo]);

  const handleSubmit = () => {
    const data = {
      nome,
      tipo,
      ativo,
      exige_bandeira: exigeBandeira,
      permite_parcelas: permiteParcelas,
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
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="cartao_debito">Cartão Débito</SelectItem>
                <SelectItem value="cartao_credito">Cartão Crédito</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label>Ativo</Label>
            <Switch checked={ativo} onCheckedChange={setAtivo} />
          </div>

          <div className="flex items-center justify-between">
            <Label>Exige Bandeira</Label>
            <Switch checked={exigeBandeira} onCheckedChange={setExigeBandeira} disabled={tipo === 'cartao_credito' || tipo === 'cartao_debito'} />
          </div>

          <div className="flex items-center justify-between">
            <Label>Permite Parcelas</Label>
            <Switch checked={permiteParcelas} onCheckedChange={setPermiteParcelas} disabled={tipo === 'cartao_credito'} />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!nome.trim()}>Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
