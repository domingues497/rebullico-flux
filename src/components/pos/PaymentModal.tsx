import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Payment } from '@/hooks/usePOS';
import { CreditCard, Banknote, Smartphone, DollarSign, Trash2, Plus } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onConfirm: (payments: Payment[], observations?: string) => void;
  isProcessing: boolean;
}

interface PaymentMethod {
  id: string;
  nome: string;
  tipo: string;
  exige_bandeira: boolean;
  permite_parcelas: boolean;
  ativo: boolean;
}

interface CardBrand {
  id: string;
  bandeira: string;
  parcelas: number;
  taxa_percentual: number;
  taxa_fixa: number;
}

export function PaymentModal({ isOpen, onClose, total, onConfirm, isProcessing }: PaymentModalProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [cardBrands, setCardBrands] = useState<CardBrand[]>([]);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [amount, setAmount] = useState('');
  const [installments, setInstallments] = useState(1);
  const [observations, setObservations] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchPaymentMethods();
      // Reset state when opening
      setPayments([]);
      setAmount('');
      setSelectedMethod('');
      setSelectedBrand('');
      setInstallments(1);
      setObservations('');
    }
  }, [isOpen]);

  const fetchPaymentMethods = async () => {
    // Buscar métodos de pagamento
    const { data: methods, error: methodsError } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('ativo', true)
      .order('nome', { ascending: true });

    if (methodsError) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as formas de pagamento",
        variant: "destructive"
      });
      return;
    }

    // Buscar bandeiras de cartão
    const { data: brands, error: brandsError } = await supabase
      .from('acquirer_fees')
      .select('*')
      .order('bandeira', { ascending: true });

    if (brandsError) {
      toast({
        title: "Erro", 
        description: "Não foi possível carregar as bandeiras de cartão",
        variant: "destructive"
      });
      return;
    }

    setPaymentMethods(methods);
    setCardBrands(brands);
  };

  const getPaymentIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'dinheiro':
        return <Banknote className="h-4 w-4" />;
      case 'pix':
        return <Smartphone className="h-4 w-4" />;
      case 'débito':
      case 'crédito':
        return <CreditCard className="h-4 w-4" />;
      case 'fiado':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const calculateFee = (methodType: string, brand: string, amount: number, installments: number) => {
    // Only calculate fees for card payments
    if (methodType !== 'CREDITO' && methodType !== 'DEBITO') {
      return { feePercent: 0, feeAmount: 0 };
    }

    const feeData = cardBrands.find(
      cb => cb.bandeira === brand && cb.parcelas === installments
    );
    
    if (!feeData) return { feePercent: 0, feeAmount: 0 };
    
    const feePercent = feeData.taxa_percentual || 0;
    const fixedFee = feeData.taxa_fixa || 0;
    const feeAmount = (amount * feePercent / 100) + fixedFee;
    
    return { feePercent, feeAmount };
  };

  const addPayment = () => {
    if (!selectedMethod || !amount) {
      toast({
        title: "Erro",
        description: "Selecione o método e informe o valor",
        variant: "destructive"
      });
      return;
    }

    const selectedMethodData = paymentMethods.find(m => m.id === selectedMethod);
    if (!selectedMethodData) return;

    // Validate brand selection for card payments
    if (selectedMethodData.exige_bandeira && !selectedBrand) {
      toast({
        title: "Erro",
        description: "Selecione a bandeira do cartão",
        variant: "destructive"
      });
      return;
    }

    const paymentAmount = parseFloat(amount);
    if (paymentAmount <= 0) {
      toast({
        title: "Erro",
        description: "Valor deve ser maior que zero",
        variant: "destructive"
      });
      return;
    }

    const { feePercent, feeAmount } = calculateFee(
      selectedMethodData.tipo, 
      selectedBrand, 
      paymentAmount, 
      installments
    );
    const netAmount = paymentAmount - feeAmount;

    const newPayment: Payment = {
      method: selectedMethodData.tipo,
      brand: selectedBrand,
      methodName: selectedMethodData.nome,
      amount: paymentAmount,
      installments,
      fee_percent: feePercent,
      fee_amount: feeAmount,
      net_amount: netAmount,
    };

    setPayments(prev => [...prev, newPayment]);
    setAmount('');
    setSelectedMethod('');
    setSelectedBrand('');
    setInstallments(1);
  };

  const removePayment = (index: number) => {
    setPayments(prev => prev.filter((_, i) => i !== index));
  };

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalFees = payments.reduce((sum, p) => sum + p.fee_amount, 0);
  const totalNet = payments.reduce((sum, p) => sum + p.net_amount, 0);
  const remaining = total - totalPaid;
  const canConfirm = Math.abs(remaining) < 0.01 && payments.length > 0;

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(payments, observations);
  };

  const getInstallmentOptions = () => {
    const selectedMethodData = paymentMethods.find(m => m.id === selectedMethod);
    if (!selectedMethodData?.permite_parcelas || !selectedBrand) return [1];
    
    const options = cardBrands
      .filter(cb => cb.bandeira === selectedBrand)
      .map(cb => cb.parcelas)
      .sort((a, b) => a - b);
    
    return [...new Set(options)];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pagamento - R$ {total.toFixed(2)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add Payment Form */}
          <Card className="card-flat">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Forma de Pagamento</Label>
                  <Select 
                    value={selectedMethod} 
                    onValueChange={(value) => {
                      setSelectedMethod(value);
                      const currentTotalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
                      const currentRemaining = Math.max(0, total - currentTotalPaid);
                      setAmount(currentRemaining.toFixed(2));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map(method => (
                        <SelectItem key={method.id} value={method.id}>
                          <div className="flex items-center gap-2">
                            {getPaymentIcon(method.nome)}
                            {method.nome}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                {(() => {
                  const selectedMethodData = paymentMethods.find(m => m.id === selectedMethod);
                  return selectedMethodData?.exige_bandeira && (
                    <div className="space-y-2">
                      <Label>Bandeira</Label>
                      <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {[...new Set(cardBrands.map(cb => cb.bandeira))].map(brand => (
                            <SelectItem key={brand} value={brand}>
                              {brand}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })()}

                {(() => {
                  const selectedMethodData = paymentMethods.find(m => m.id === selectedMethod);
                  return selectedMethodData?.permite_parcelas && selectedBrand && (
                    <div className="space-y-2">
                      <Label>Parcelas</Label>
                      <Select value={installments.toString()} onValueChange={(v) => setInstallments(Number(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getInstallmentOptions().map(option => (
                            <SelectItem key={option} value={option.toString()}>
                              {option}x
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })()}
              </div>

              {/* Fee Preview */}
              {selectedMethod && amount && (
                <div className="text-sm text-muted-foreground">
                  {(() => {
                    const selectedMethodData = paymentMethods.find(m => m.id === selectedMethod);
                    if (!selectedMethodData) return null;
                    
                    const { feePercent, feeAmount } = calculateFee(
                      selectedMethodData.tipo, 
                      selectedBrand, 
                      parseFloat(amount) || 0, 
                      installments
                    );
                    return feeAmount > 0 ? (
                      <div>
                        Taxa: {feePercent}% = R$ {feeAmount.toFixed(2)} • 
                        Líquido: R$ {(parseFloat(amount) - feeAmount).toFixed(2)}
                      </div>
                    ) : (
                      <div>Sem taxas</div>
                    );
                  })()}
                </div>
              )}

              <Button onClick={addPayment} className="w-full" disabled={!selectedMethod || !amount}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Pagamento
              </Button>
            </CardContent>
          </Card>

          {/* Payment List */}
          {payments.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium">Pagamentos Adicionados</h3>
              {payments.map((payment, index) => (
                <Card key={index} className="card-flat">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                      {getPaymentIcon(payment.methodName)}
                        <div>
                          <div className="font-medium">
                            {payment.methodName} {payment.brand && `- ${payment.brand}`} {payment.installments > 1 && `${payment.installments}x`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            R$ {payment.amount.toFixed(2)}
                            {payment.fee_amount > 0 && (
                              <> • Taxa: R$ {payment.fee_amount.toFixed(2)} • Líquido: R$ {payment.net_amount.toFixed(2)}</>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePayment(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Summary */}
          <Card className="card-elevated">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span>Total da Venda:</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Pago:</span>
                <span>R$ {totalPaid.toFixed(2)}</span>
              </div>
              {totalFees > 0 && (
                <div className="flex justify-between text-sm text-destructive">
                  <span>Total de Taxas:</span>
                  <span>-R$ {totalFees.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-success">
                <span>Líquido a Receber:</span>
                <span>R$ {totalNet.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Restante:</span>
                <Badge variant={remaining > 0.01 ? "destructive" : "secondary"} 
                       className={remaining <= 0.01 && remaining >= -0.01 ? "bg-success text-success-foreground" : ""}>
                  R$ {remaining.toFixed(2)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Observations */}
          <div className="space-y-2">
            <Label>Observações (opcional)</Label>
            <Input
              placeholder="Observações da venda..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={isProcessing}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!canConfirm || isProcessing}
              className="flex-1 btn-pos-primary"
            >
              {isProcessing ? 'Processando...' : 'Finalizar Venda'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}