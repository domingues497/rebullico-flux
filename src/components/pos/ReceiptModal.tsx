import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Printer } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

interface ReceiptItem {
  name: string;
  sku: string;
  quantity: number;
  price: number;
  total: number;
}

interface ReceiptPayment {
  methodName: string;
  amount: number;
  brand?: string;
  installments?: number;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleData: {
    id: string;
    date: Date;
    items: ReceiptItem[];
    payments: ReceiptPayment[];
    subtotal: number;
    discount: number;
    total: number;
    customer?: {
      name: string;
    };
  };
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  saleData
}) => {
  const { getSetting } = useSettings();
  const [storeInfo, setStoreInfo] = useState({
    name: "Rebulliço",
    cnpj: "",
    address: "",
    phone: "",
    email: ""
  });

  // Carregar configurações da loja
  useEffect(() => {
    const loadStoreSettings = async () => {
      try {
        const storeName = await getSetting('store_name');
        const cnpj = await getSetting('store_cnpj');
        const address = await getSetting('store_address');
        const phone = await getSetting('store_phone');
        const email = await getSetting('store_email');

        setStoreInfo({
          name: storeName ? String(storeName).replace(/"/g, '') : "Rebulliço",
          cnpj: cnpj ? String(cnpj).replace(/"/g, '') : "",
          address: address ? String(address).replace(/"/g, '') : "",
          phone: phone ? String(phone).replace(/"/g, '') : "",
          email: email ? String(email).replace(/"/g, '') : ""
        });
      } catch (error) {
        console.error('Erro ao carregar configurações da loja:', error);
      }
    };

    if (isOpen) {
      loadStoreSettings();
    }
  }, [isOpen, getSetting]);
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('receipt-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Recibo - ${saleData.id}</title>
              <style>
                @media print {
                  @page {
                    size: 80mm auto;
                    margin: 0;
                  }
                  body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                  }
                }
                body { 
                  font-family: 'Courier New', monospace; 
                  font-size: 12px; 
                  font-weight: bold;
                  line-height: 1.3;
                  margin: 0;
                  padding: 3mm;
                  width: 70mm;
                  color: #000;
                  background: #fff;
                }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .font-bold { font-weight: 900; }
                .border-t { 
                  border-top: 2px solid #000; 
                  margin: 3px 0; 
                  padding-top: 3px;
                }
                .mb-2 { margin-bottom: 4px; }
                .mb-4 { margin-bottom: 8px; }
                .flex { display: flex; }
                .justify-between { justify-content: space-between; }
                .space-y-1 > * + * { margin-top: 2px; }
                .space-y-2 > * + * { margin-top: 4px; }
                .separator { 
                  border-top: 2px solid #000; 
                  margin: 4px 0; 
                  width: 100%;
                }
                h2 { font-size: 14px; margin: 2px 0; font-weight: 900; }
                h3 { font-size: 13px; margin: 2px 0; font-weight: 900; }
                h4 { font-size: 12px; margin: 2px 0; font-weight: 900; }
                p { margin: 1px 0; font-weight: bold; }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        
        // Aguardar um pouco para garantir que o conteúdo foi carregado
        setTimeout(() => {
          printWindow.print();
          // Fechar a janela após a impressão
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        }, 500);
      }
    }
  };

  // Função para impressão direta (sem preview)
  const handleDirectPrint = () => {
    const printContent = document.getElementById('receipt-content');
    if (printContent) {
      // Criar estilos específicos para impressão térmica
      const printStyles = `
        <style>
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
          body { 
            font-family: 'Courier New', monospace; 
            font-size: 11px; 
            font-weight: bold;
            line-height: 1.2;
            margin: 0;
            padding: 2mm;
            width: 70mm;
            color: #000;
            background: #fff;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: 900; }
          .separator { 
            border-top: 2px solid #000; 
            margin: 2px 0; 
            width: 100%;
            height: 2px;
          }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          h2 { font-size: 13px; margin: 1px 0; font-weight: 900; }
          h3 { font-size: 12px; margin: 1px 0; font-weight: 900; }
          h4 { font-size: 11px; margin: 1px 0; font-weight: 900; }
          p { margin: 0.5px 0; font-weight: bold; }
          .space-y-1 > * + * { margin-top: 1px; }
          .space-y-2 > * + * { margin-top: 2px; }
          .mb-2 { margin-bottom: 2px; }
          .mb-4 { margin-bottom: 4px; }
          .border-t { 
            border-top: 2px solid #000; 
            margin: 2px 0; 
            padding-top: 2px;
          }
        </style>
      `;

      // Criar documento temporário para impressão
      const printWindow = window.open('', '_blank', 'width=300,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Recibo - ${saleData.id}</title>
              ${printStyles}
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        
        // Aguardar carregamento e imprimir automaticamente
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          // Fechar automaticamente após impressão
          setTimeout(() => {
            printWindow.close();
          }, 500);
        }, 300);
      }
    }
  };

  const handleDownload = () => {
    const receiptContent = document.getElementById('receipt-content');
    if (receiptContent) {
      // Criar um elemento temporário para capturar o HTML
      const element = document.createElement('div');
      element.innerHTML = receiptContent.innerHTML;
      
      // Converter para texto simples formatado
      const textContent = `
${storeInfo.name}
${storeInfo.cnpj ? `CNPJ: ${storeInfo.cnpj}` : ''}
${storeInfo.address || ''}
${storeInfo.phone || ''}

========================================
CUPOM NÃO FISCAL
========================================

Data: ${formatDate(saleData.date)}
Venda: ${saleData.id}
${saleData.customer ? `Cliente: ${saleData.customer.name}` : ''}

----------------------------------------
PRODUTOS
----------------------------------------
${saleData.items.map(item => 
  `${item.name}\nSKU: ${item.sku}\n${item.quantity}x ${formatCurrency(item.price)} = ${formatCurrency(item.total)}\n`
).join('\n')}
----------------------------------------

Subtotal: ${formatCurrency(saleData.subtotal)}
${saleData.discount > 0 ? `Desconto: -${formatCurrency(saleData.discount)}` : ''}
TOTAL: ${formatCurrency(saleData.total)}

----------------------------------------
PAGAMENTO
----------------------------------------
${saleData.payments.map(payment => 
  `${payment.methodName}${payment.brand ? ` - ${payment.brand}` : ''}${payment.installments && payment.installments > 1 ? ` ${payment.installments}x` : ''}: ${formatCurrency(payment.amount)}`
).join('\n')}

========================================
Obrigado pela preferência!
========================================
      `;

      // Criar e baixar arquivo
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recibo-${saleData.id}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Recibo da Venda
          </DialogTitle>
        </DialogHeader>

        <div id="receipt-content" className="space-y-4 font-mono text-sm">
          {/* Cabeçalho da Loja */}
          <div className="text-center space-y-1 mb-4">
            <h2 className="font-bold text-lg">{storeInfo.name}</h2>
            {storeInfo.cnpj && <p>CNPJ: {storeInfo.cnpj}</p>}
            {storeInfo.address && <p>{storeInfo.address}</p>}
            {storeInfo.phone && <p>Tel: {storeInfo.phone}</p>}
            {storeInfo.email && <p>Email: {storeInfo.email}</p>}
          </div>

          <Separator />

          {/* Informações da Venda */}
          <div className="space-y-2">
            <div className="text-center">
              <h3 className="font-bold">CUPOM NÃO FISCAL</h3>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Data:</span>
                <span>{formatDate(saleData.date)}</span>
              </div>
              <div className="flex justify-between">
                <span>Venda:</span>
                <span>{saleData.id}</span>
              </div>
              {saleData.customer && (
                <div className="flex justify-between">
                  <span>Cliente:</span>
                  <span>{saleData.customer.name}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Produtos */}
          <div className="space-y-2">
            <h4 className="font-bold">PRODUTOS</h4>
            {saleData.items.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-gray-600">SKU: {item.sku}</div>
                <div className="flex justify-between">
                  <span>{item.quantity}x {formatCurrency(item.price)}</span>
                  <span className="font-medium">{formatCurrency(item.total)}</span>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Totais */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(saleData.subtotal)}</span>
            </div>
            {saleData.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Desconto:</span>
                <span>-{formatCurrency(saleData.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t pt-1">
              <span>TOTAL:</span>
              <span>{formatCurrency(saleData.total)}</span>
            </div>
          </div>

          <Separator />

          {/* Formas de Pagamento */}
          <div className="space-y-2">
            <h4 className="font-bold">PAGAMENTO</h4>
            {saleData.payments.map((payment, index) => (
              <div key={index} className="flex justify-between">
                <span>
                  {payment.methodName}
                  {payment.brand && ` - ${payment.brand}`}
                  {payment.installments && payment.installments > 1 && ` ${payment.installments}x`}
                </span>
                <span>{formatCurrency(payment.amount)}</span>
              </div>
            ))}
          </div>

          <Separator />

          <div className="text-center text-sm">
            <p className="font-bold">Obrigado pela preferência!</p>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Fechar
          </Button>
          <Button variant="outline" onClick={handleDownload} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Baixar
          </Button>
          <Button variant="outline" onClick={handlePrint} className="flex-1">
            <Printer className="h-4 w-4 mr-2" />
            Visualizar
          </Button>
          <Button onClick={handleDirectPrint} className="flex-1 btn-pos-primary">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};