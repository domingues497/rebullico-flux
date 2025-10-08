import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AcquirerFeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editData?: any;
}

export default function AcquirerFeeFormModal({ isOpen, onClose, onSave, editData }: AcquirerFeeFormModalProps) {
  const [bandeira, setBandeira] = useState('');
  const [parcelas, setParcelas] = useState('1');
  const [taxaFixa, setTaxaFixa] = useState('0');
  const [taxaPercentual, setTaxaPercentual] = useState('0');

  useEffect(() => {
    if (editData) {
      setBandeira(editData.bandeira || '');
      setParcelas(String(editData.parcelas || 1));
      setTaxaFixa(String(editData.taxa_fixa || 0));
      setTaxaPercentual(String(editData.taxa_percentual || 0));
    } else {
      setBandeira('');
      setParcelas('1');
      setTaxaFixa('0');
      setTaxaPercentual('0');
    }
  }, [editData, isOpen]);

  const handleSubmit = () => {
    const data = {
      bandeira,
      parcelas: parseInt(parcelas) || 1,
      taxa_fixa: parseFloat(taxaFixa) || 0,
      taxa_percentual: parseFloat(taxaPercentual) || 0,
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
          <DialogTitle>{editData ? 'Editar' : 'Nova'} Taxa de Bandeira</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Bandeira</Label>
            <Input 
              value={bandeira} 
              onChange={(e) => setBandeira(e.target.value)} 
              placeholder="Ex: Visa, Master, Elo" 
            />
          </div>

          <div>
            <Label>Parcelas</Label>
            <Input 
              type="number" 
              min="1" 
              max="12" 
              value={parcelas} 
              onChange={(e) => setParcelas(e.target.value)} 
            />
          </div>

          <div>
            <Label>Taxa Fixa (R$)</Label>
            <Input 
              type="number" 
              step="0.01" 
              min="0" 
              value={taxaFixa} 
              onChange={(e) => setTaxaFixa(e.target.value)} 
              placeholder="0.00"
            />
          </div>

          <div>
            <Label>Taxa Percentual (%)</Label>
            <Input 
              type="number" 
              step="0.01" 
              min="0" 
              max="100" 
              value={taxaPercentual} 
              onChange={(e) => setTaxaPercentual(e.target.value)} 
              placeholder="0.00"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!bandeira.trim()}>Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
