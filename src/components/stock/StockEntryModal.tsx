import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useProducts } from '@/hooks/useProducts';
import { ProductFormModal } from '@/components/products/ProductFormModal';
import { Plus, Trash2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

interface PendingProduct {
  cProd: string;
  cEAN: string;
  xProd: string;
  qCom: number;
  vUnCom: number;
}

interface StockEntryItem {
  product_variant_id: string;
  quantidade: number;
  custo_unit: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => Promise<void>;
}

export function StockEntryModal({ open, onOpenChange, onSave }: Props) {
  const { toast } = useToast();
  const { suppliers, createSupplier } = useSuppliers();
  const { products } = useProducts();

  const [numeroNota, setNumeroNota] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<StockEntryItem[]>([]);
  const [anexoFile, setAnexoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingProducts, setPendingProducts] = useState<PendingProduct[]>([]);
  const [currentPendingProduct, setCurrentPendingProduct] = useState<PendingProduct | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const addItem = () => {
    setItems([...items, { product_variant_id: undefined as any, quantidade: 1, custo_unit: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof StockEntryItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAnexoFile(file);

      // Se for XML, tentar ler e preencher campos
      if (file.name.toLowerCase().endsWith('.xml')) {
        parseNFeXML(file);
      } else if (file.name.toLowerCase().endsWith('.pdf')) {
        parseNFePDF(file);
      }
    }
  };

  const processNextPendingProduct = (pendingList: PendingProduct[] = pendingProducts) => {
    if (pendingList.length === 0) {
      setPendingProducts([]);
      setCurrentPendingProduct(null);
      return;
    }

    const nextProduct = pendingList[0];
    setCurrentPendingProduct(nextProduct);
    setIsProductModalOpen(true);
  };

  const handleProductCreated = (product: any) => {
    if (!currentPendingProduct || !product) return;

    // Adicionar o produto criado à lista de itens
    // Precisamos encontrar a variante correta. Assumindo que o produto criado tem variantes.
    // O modal retorna o produto completo.
    
    let variantId = '';
    if (product.variants && product.variants.length > 0) {
      // Tentar encontrar a variante que corresponde aos dados pendentes
      const variant = product.variants.find((v: any) => 
        (currentPendingProduct.cEAN && v.ean === currentPendingProduct.cEAN) ||
        (currentPendingProduct.cProd && v.cod_fabricante === currentPendingProduct.cProd)
      );
      
      if (variant) {
        variantId = variant.id;
      } else {
        // Se não encontrar correspondência exata, usar a primeira variante
        variantId = product.variants[0].id;
      }
    }

    if (variantId) {
      setItems(prevItems => [...prevItems, {
        product_variant_id: variantId,
        quantidade: currentPendingProduct.qCom,
        custo_unit: currentPendingProduct.vUnCom
      }]);

      toast({
        title: "Produto adicionado",
        description: `${product.nome} foi cadastrado e adicionado à nota.`,
      });
    }

    // Processar próximo produto
    const remainingProducts = pendingProducts.slice(1);
    setPendingProducts(remainingProducts);
    setIsProductModalOpen(false);
    
    // Pequeno delay para garantir que o modal feche antes de abrir o próximo (se houver)
    setTimeout(() => {
        processNextPendingProduct(remainingProducts);
      }, 500);
    };

    const parseNFePDF = async (file: File) => {
      try {
        setLoading(true);
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        let fullText = '';
        
        // Extrair texto de todas as páginas
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const items = textContent.items as any[];
          
          // Agrupar itens por linha (coordenada Y)
          // Tolerância maior para agrupar itens na mesma linha visual
          const lines: { y: number, text: string }[] = [];
          
          items.forEach(item => {
            const y = item.transform[5]; // transform[5] é a tradução Y
            const existingLine = lines.find(l => Math.abs(l.y - y) < 4); // Tolerância de 4 unidades
            if (existingLine) {
              existingLine.text += ' ' + item.str;
            } else {
              lines.push({ y, text: item.str });
            }
          });
          
          // Ordenar linhas de cima para baixo (maior Y para menor Y)
          lines.sort((a, b) => b.y - a.y);
          
          fullText += lines.map(l => l.text).join('\n') + '\n';
        }

        console.log("PDF Content:", fullText);

        // Processar dados extraídos
        // 1. Número da Nota
        const nNFMatch = fullText.match(/N[ºo°]\.?\s*(\d{3}\.?\d{3}\.?\d{3}|\d+)/i);
        if (nNFMatch) {
          setNumeroNota(nNFMatch[1].replace(/\D/g, ''));
        }

        // 2. Data de Emissão
        const dataMatch = fullText.match(/Data\s+(?:de\s+)?Emissão[:\s]*(\d{2}\/\d{2}\/\d{4})/i);
        if (dataMatch) {
          const [dia, mes, ano] = dataMatch[1].split('/');
          setData(`${ano}-${mes}-${dia}`);
        }

        // 3. Fornecedor (CNPJ)
        const cnpjMatch = fullText.match(/CNPJ[:\s]*(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/i);
        if (cnpjMatch) {
          const cleanCnpj = cnpjMatch[1].replace(/\D/g, '');
          const foundSupplier = suppliers.find(s => s.cnpj_cpf?.replace(/\D/g, '') === cleanCnpj);
          
          if (foundSupplier) {
            setSupplierId(foundSupplier.id);
          } else {
             // Tentar extrair nome do fornecedor (heurística: geralmente primeira linha ou perto do CNPJ)
             // Simplificação: Avisar usuário
             toast({
               title: "Fornecedor não encontrado",
               description: `CNPJ ${cnpjMatch[1]} não cadastrado. Cadastre o fornecedor manualmente.`,
             });
          }
        }

        // 4. Produtos
        const newItems: StockEntryItem[] = [];
        const pendingItems: PendingProduct[] = [];

        // Regex para tentar identificar linhas de produtos
        // Exemplo típico: CÓDIGO DESCRIÇÃO ... UN QTD VALOR ...
        // Procura por linhas que terminam com sequência de números (valores monetários)
        
        const lines = fullText.split('\n');
        let productsStarted = false;

        for (const line of lines) {
          // Tentar detectar início da seção de produtos
          if (line.match(/DADOS DO PRODUTO|CÓDIGO/i)) {
            productsStarted = true;
            continue;
          }

          if (!productsStarted) continue;
          if (line.match(/CÁLCULO DO ISSQN|DADOS ADICIONAIS/i)) break;

          // Tentativa de parsear linha de produto
          // Procura por um padrão: Código (opcional) + Descrição + ... + Qtd + Valor Unit + Valor Total
          // Essa regex é bem genérica e pode precisar de ajustes dependendo do layout da nota
          
          // Estratégia: Encontrar os últimos números da linha (Total, Valor Unit, Qtd)
          // Exemplo linha: 123 CAMISETA 0600 5102 UN 10,00 50,00 500,00
          
          // Regex explicada:
          // (.*?) -> Captura tudo até os números finais (Código + Descrição + NCM etc)
          // (\d+(?:[.,]\d+)?)\s+ -> Qtd (assumindo que vem antes do unitário)
          // (\d+(?:[.,]\d+)?)\s+ -> Valor Unit
          // (\d+(?:[.,]\d+)?)\s*$ -> Valor Total (final da linha)
          
          // Nota: Em PDFs o espaçamento pode variar, e campos como UN podem estar no meio
          
          // Vamos tentar uma abordagem mais robusta: procurar por sequencias numéricas no fim da linha
          const numberPattern = /(\d+(?:[.,]\d+)?)/g;
          const numbers = line.match(numberPattern);
          
          if (numbers && numbers.length >= 3) {
            // Assumindo os últimos 3 números como: Qtd, Unitário, Total (ou Unitário, Total, Base Calc...)
            // Layout comum DANFE paisagem: ... Qtd ... V.Unit ... V.Total ... Bc.Icms ...
            // Mas varia muito. Vamos tentar pegar Qtd e V.Unit
            
            // Geralmente Qtd e V.Unit estão próximos.
            // Vamos tentar extrair pelo contexto da linha
            
            // Simplificação: Pegar description do começo
            // Código geralmente é a primeira "palavra"
            const parts = line.trim().split(/\s+/);
            if (parts.length < 5) continue; // Linha muito curta

            const cProd = parts[0];
            
            // Tentar identificar onde estão os valores
            // V.Unit costuma ter casas decimais
            
            // Vamos usar uma heurística baseada na posição dos tokens numéricos
            // Pegar os tokens que parecem números com decimais
            const numericTokens = parts.map((p, i) => ({ 
              val: parseFloat(p.replace(',', '.')), 
              text: p, 
              index: i,
              isDecimal: p.includes(',') || p.includes('.')
            })).filter(t => !isNaN(t.val));

            if (numericTokens.length >= 2) {
              // Assumir que Qtd é um número (pode ser int ou decimal) e V.Unit é decimal
              // Geralmente Qtd vem antes de V.Unit
              
              // Vamos pegar os dois números que multiplicados dão o terceiro (Total)?
              // Qtd * Unit = Total
              
              let qCom = 0;
              let vUnCom = 0;
              let foundMath = false;

              for (let i = 0; i < numericTokens.length - 2; i++) {
                const a = numericTokens[i].val;
                const b = numericTokens[i+1].val;
                const c = numericTokens[i+2].val;
                
                // Checar se a * b ~= c (com margem de erro)
                if (Math.abs(a * b - c) < 0.05) {
                   qCom = a;
                   vUnCom = b;
                   foundMath = true;
                   break;
                }
              }

              if (!foundMath) {
                // Fallback: Tentar pegar números "razoáveis" no meio da linha
                // Geralmente Qtd é o primeiro número após a descrição (que é texto)
                // Mas descrição pode ter números.
                // Difícil sem OCR estruturado.
                continue; 
              }

              // Extrair descrição: tudo entre cProd e o token da quantidade?
              // Não temos o índice original fácil aqui pois usamos regex/split
              // Vamos reconstruir
              
              // Simplificação: xProd é tudo entre parts[1] e o índice do qCom
              // Isso é frágil.
              
              // Melhor: xProd é o texto que sobra removendo o código e os números do fim?
              const xProd = parts.slice(1, parts.length - 5).join(' '); // Chute grosseiro
              
              // Verificar se produto existe
              let matchedVariantId = '';
              const match = products.find(p => p.cod_fabricante === cProd || p.sku === cProd);
              if (match) matchedVariantId = match.variant_id;

              if (matchedVariantId) {
                newItems.push({
                  product_variant_id: matchedVariantId,
                  quantidade: qCom,
                  custo_unit: vUnCom
                });
              } else {
                pendingItems.push({
                  cProd,
                  cEAN: '', // Difícil extrair EAN de PDF se não estiver explícito
                  xProd: xProd || 'Produto sem descrição identificada',
                  qCom,
                  vUnCom
                });
              }
            }
          }
        }

        if (newItems.length > 0) {
          setItems(prev => [...prev, ...newItems]);
        }

        if (pendingItems.length > 0) {
          setPendingProducts(pendingItems);
          
          toast({
            title: "Produtos não cadastrados (PDF)",
            description: `${pendingItems.length} itens identificados. Verifique os dados.`,
          });

          setTimeout(() => {
            processNextPendingProduct(pendingItems);
          }, 1500);
        }

        if (newItems.length > 0 || pendingItems.length > 0) {
           toast({
            title: "PDF processado",
            description: `${newItems.length + pendingItems.length} itens encontrados.`,
          });
        } else {
           toast({
            title: "Nenhum item encontrado",
            description: "Não foi possível identificar produtos no PDF automaticamente.",
            variant: "destructive"
          });
        }

      } catch (error) {
        console.error("Erro ao processar PDF:", error);
        toast({
          title: "Erro no PDF",
          description: "Falha ao processar o arquivo. Tente um XML.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    const parseNFeXML = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");

        // 1. Número da Nota
        const nNF = xmlDoc.getElementsByTagName("nNF")[0]?.textContent;
        if (nNF) setNumeroNota(nNF);

        // 2. Data de Emissão
        const dhEmi = xmlDoc.getElementsByTagName("dhEmi")[0]?.textContent;
        if (dhEmi) {
          // Formato esperado: YYYY-MM-DD...
          setData(dhEmi.split('T')[0]);
        }

        // 3. Fornecedor
        const emit = xmlDoc.getElementsByTagName("emit")[0];
        if (emit) {
          const cnpj = emit.getElementsByTagName("CNPJ")[0]?.textContent;
          const xNome = emit.getElementsByTagName("xNome")[0]?.textContent;
          const xFant = emit.getElementsByTagName("xFant")[0]?.textContent;
          
          if (cnpj) {
            // Remove pontuação para comparação
            const cleanCnpj = cnpj.replace(/\D/g, '');
            const foundSupplier = suppliers.find(s => s.cnpj_cpf?.replace(/\D/g, '') === cleanCnpj);
            
            if (foundSupplier) {
              setSupplierId(foundSupplier.id);
            } else if (xNome) {
              // Tentar cadastrar fornecedor automaticamente
              try {
                let supplierData: any = {
                  nome: xFant || xNome,
                  cnpj_cpf: cleanCnpj,
                  contato: {}
                };

                // Tentar buscar dados na BrasilAPI
                try {
                  const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
                  if (response.ok) {
                    const apiData = await response.json();
                    supplierData.nome = apiData.nome_fantasia || apiData.razao_social || supplierData.nome;
                    supplierData.contato = {
                      endereco: `${apiData.logradouro}, ${apiData.numero} - ${apiData.bairro}, ${apiData.municipio} - ${apiData.uf}`,
                      cep: apiData.cep,
                      telefone: apiData.ddd_telefone_1
                    };
                    toast({
                      title: "Dados obtidos da Receita!",
                      description: "Dados do fornecedor enriquecidos via API!",
                    });
                  } else {
                    throw new Error('API request failed');
                  }
                } catch (apiError) {
                  // Fallback para dados do XML se a API falhar
                  console.log("Fallback para XML:", apiError);
                  const enderEmit = emit.getElementsByTagName("enderEmit")[0];
                  
                  if (enderEmit) {
                    const xLgr = enderEmit.getElementsByTagName("xLgr")[0]?.textContent || '';
                    const nro = enderEmit.getElementsByTagName("nro")[0]?.textContent || '';
                    const xBairro = enderEmit.getElementsByTagName("xBairro")[0]?.textContent || '';
                    const xMun = enderEmit.getElementsByTagName("xMun")[0]?.textContent || '';
                    const UF = enderEmit.getElementsByTagName("UF")[0]?.textContent || '';
                    const CEP = enderEmit.getElementsByTagName("CEP")[0]?.textContent || '';
                    const fone = enderEmit.getElementsByTagName("fone")[0]?.textContent || '';

                    supplierData.contato = {
                      endereco: `${xLgr}, ${nro} - ${xBairro}, ${xMun} - ${UF}`,
                      cep: CEP,
                      telefone: fone
                    };
                  }
                }

                // Criar fornecedor
                const newSupplier = await createSupplier(supplierData);
                if (newSupplier) {
                  setSupplierId(newSupplier.id);
                  toast({
                    title: "Fornecedor Cadastrado",
                    description: `O fornecedor ${supplierData.nome} foi cadastrado automaticamente.`,
                  });
                }

              } catch (err) {
                console.error("Erro ao cadastrar fornecedor auto:", err);
                toast({
                  title: "Aviso",
                  description: `Fornecedor ${xNome} não encontrado e não foi possível cadastrar automaticamente.`,
                });
              }
            } else {
              toast({
                title: "Fornecedor não encontrado",
                description: `O CNPJ ${cnpj} não foi encontrado no cadastro.`,
              });
            }
          }
        }

        // 4. Itens
        const dets = xmlDoc.getElementsByTagName("det");
        const newItems: StockEntryItem[] = [];
        const pendingItems: PendingProduct[] = [];

        for (let i = 0; i < dets.length; i++) {
          const det = dets[i];
          const prod = det.getElementsByTagName("prod")[0];
          if (!prod) continue;

          const cProd = prod.getElementsByTagName("cProd")[0]?.textContent || '';
          const cEAN = prod.getElementsByTagName("cEAN")[0]?.textContent || '';
          const xProd = prod.getElementsByTagName("xProd")[0]?.textContent || '';
          const qCom = parseFloat(prod.getElementsByTagName("qCom")[0]?.textContent || "0");
          const vUnCom = parseFloat(prod.getElementsByTagName("vUnCom")[0]?.textContent || "0");

          let matchedVariantId = '';

          // Tentar encontrar produto pelo EAN
          if (cEAN && cEAN !== "SEM GTIN") {
            const match = products.find(p => p.ean === cEAN);
            if (match) matchedVariantId = match.variant_id;
          }

          // Se não encontrou, tentar pelo código do fabricante ou SKU
          if (!matchedVariantId && cProd) {
            const match = products.find(p => p.cod_fabricante === cProd || p.sku === cProd);
            if (match) matchedVariantId = match.variant_id;
          }

          if (matchedVariantId) {
            newItems.push({
              product_variant_id: matchedVariantId,
              quantidade: qCom,
              custo_unit: vUnCom
            });
          } else {
            pendingItems.push({
              cProd,
              cEAN: cEAN === "SEM GTIN" ? "" : cEAN,
              xProd,
              qCom,
              vUnCom
            });
          }
        }

        if (newItems.length > 0) {
          setItems(prev => [...prev, ...newItems]);
        }

        if (pendingItems.length > 0) {
          setPendingProducts(pendingItems);
          
          toast({
            title: "Produtos não cadastrados",
            description: `${pendingItems.length} itens não foram encontrados e precisarão ser cadastrados.`,
          });

          // Iniciar fluxo de cadastro para o primeiro item
          // setTimeout para garantir que o usuário veja a mensagem antes do modal abrir
          setTimeout(() => {
            processNextPendingProduct(pendingItems);
          }, 1500);
        }

        if (newItems.length > 0 || pendingItems.length > 0) {
          toast({
            title: "Nota Fiscal processada",
            description: `${newItems.length} itens identificados e ${pendingItems.length} novos produtos para cadastrar.`,
          });
        }

      } catch (error) {
        console.error("Erro ao ler XML:", error);
        toast({
          title: "Erro ao ler arquivo",
          description: "Não foi possível processar o arquivo XML.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const uploadAnexo = async () => {
    if (!anexoFile) return null;

    try {
      setUploading(true);
      const fileExt = anexoFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `notas-fiscais/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('attachments')
        .upload(filePath, anexoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: 'Erro ao fazer upload do anexo',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (items.length === 0) {
        toast({
          title: 'Adicione produtos',
          description: 'É necessário adicionar ao menos um produto',
          variant: 'destructive',
        });
        return;
      }

      const invalidItems = items.filter(
        (item) => !item.product_variant_id || item.quantidade <= 0 || item.custo_unit <= 0
      );

      if (invalidItems.length > 0) {
        toast({
          title: 'Dados incompletos',
          description: 'Preencha todos os campos dos produtos',
          variant: 'destructive',
        });
        return;
      }

      setLoading(true);

      let anexo_url = null;
      if (anexoFile) {
        anexo_url = await uploadAnexo();
      }

      await onSave({
        numero_nota: numeroNota || undefined,
        supplier_id: supplierId || undefined,
        data,
        anexo_url,
        items,
      });

      // Resetar formulário
      setNumeroNota('');
      setSupplierId('');
      setData(new Date().toISOString().split('T')[0]);
      setItems([]);
      setAnexoFile(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setLoading(false);
    }
  };

  const total = items.reduce((sum, item) => sum + item.quantidade * item.custo_unit, 0);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lançar Nota Fiscal de Entrada</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Número da Nota</Label>
              <Input
                value={numeroNota}
                onChange={(e) => setNumeroNota(e.target.value)}
                placeholder="Ex: 12345"
              />
            </div>

            <div>
              <Label>Data da Entrada</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Fornecedor</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o fornecedor" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Anexar Nota Fiscal (PDF, Imagem, XML)</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input type="file" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png,.xml" />
              {anexoFile && (
                <span className="text-sm text-muted-foreground">{anexoFile.name}</span>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <Label className="text-lg">Produtos</Label>
              <Button type="button" onClick={addItem} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Adicionar Produto
              </Button>
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum produto adicionado
              </p>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      <Label className="text-xs">Produto</Label>
                      <Select
                        value={item.product_variant_id || undefined}
                        onValueChange={(val) => updateItem(index, 'product_variant_id', val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((variant) => (
                            <SelectItem key={variant.id} value={variant.id}>
                              {variant.nome} - {variant.sku}
                              {variant.cor && ` - ${variant.cor}`}
                              {variant.tamanho && ` - ${variant.tamanho}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-3">
                      <Label className="text-xs">Quantidade</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantidade}
                        onChange={(e) =>
                          updateItem(index, 'quantidade', parseInt(e.target.value) || 0)
                        }
                      />
                    </div>

                    <div className="col-span-3">
                      <Label className="text-xs">Custo Unit.</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.custo_unit}
                        onChange={(e) =>
                          updateItem(index, 'custo_unit', parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>

                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t pt-4 flex justify-between items-center">
            <div className="text-lg font-semibold">
              Total: R$ {total.toFixed(2)}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={loading || uploading}>
                {loading ? 'Salvando...' : uploading ? 'Enviando anexo...' : 'Registrar Entrada'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {isProductModalOpen && currentPendingProduct && (
      <ProductFormModal
        open={isProductModalOpen}
        onOpenChange={setIsProductModalOpen}
        mode="create"
        initialSku={currentPendingProduct.cProd}
        initialEan={currentPendingProduct.cEAN}
        initialData={{
          nome: currentPendingProduct.xProd,
          preco_custo: currentPendingProduct.vUnCom,
          cod_fabricante: currentPendingProduct.cProd,
          supplier_id: supplierId
        }}
        onSuccess={handleProductCreated}
      />
    )}
  </>
  );
}
