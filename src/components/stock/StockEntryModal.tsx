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
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

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
        const allLines: { y: number, items: { x: number, text: string, width: number }[], fullText: string }[] = [];
        
        // Extrair texto e estrutura de todas as páginas
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const items = textContent.items as any[];
          
          const pageLines: { y: number, items: { x: number, text: string, width: number }[] }[] = [];
          
          items.forEach(item => {
            const y = item.transform[5];
            const x = item.transform[4];
            const width = item.width || 0;
            const text = item.str;
            
            const existingLine = pageLines.find(l => Math.abs(l.y - y) < 4);
            if (existingLine) {
              existingLine.items.push({ x, text, width });
            } else {
              pageLines.push({ y, items: [{ x, text, width }] });
            }
          });
          
          pageLines.sort((a, b) => b.y - a.y);
          
          pageLines.forEach(line => {
            line.items.sort((a, b) => a.x - b.x);
            const lineText = line.items.map(i => i.text).join(' ');
            allLines.push({ ...line, fullText: lineText });
            fullText += lineText + '\n';
          });
        }

        console.log("PDF Structure:", allLines);
        console.log("PDF Full Text:", fullText);

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
             toast({
               title: "Fornecedor não encontrado",
               description: `CNPJ ${cnpjMatch[1]} não cadastrado. Cadastre o fornecedor manualmente.`,
             });
          }
        }

        // 4. Produtos (Smart Column Detection + Fallback)
        const newItems: StockEntryItem[] = [];
        const pendingItems: PendingProduct[] = [];
        let smartExtractionSuccess = false;

        // Definição de cabeçalhos possíveis
        const headers: Record<string, { patterns: string[], found: boolean, xStart: number, xEnd: number }> = {
            codigo: { patterns: ['CÓDIGO', 'CODIGO', 'C.PROD', 'COD.'], found: false, xStart: 0, xEnd: 0 },
            ean: { patterns: ['EAN', 'GTIN', 'COD.BARRAS'], found: false, xStart: 0, xEnd: 0 },
            descricao: { patterns: ['DESCRIÇÃO', 'DESCRICAO', 'DISCRIMINAÇÃO'], found: false, xStart: 0, xEnd: 0 },
            qtd: { patterns: ['QTD', 'QUANT', 'QUANTIDADE'], found: false, xStart: 0, xEnd: 0 },
            unit: { patterns: ['V.UNIT', 'VAL.UNIT', 'V.UN', 'VL.UNIT'], found: false, xStart: 0, xEnd: 0 },
            total: { patterns: ['V.TOTAL', 'VAL.TOTAL', 'V.TOT', 'VL.TOTAL'], found: false, xStart: 0, xEnd: 0 }
        };

        // Identificar linha de cabeçalho
        let headerLineIndex = -1;
        for(let i=0; i<allLines.length; i++) {
            const lineText = allLines[i].fullText.toUpperCase();
            let matches = 0;
            if (headers.codigo.patterns.some(p => lineText.includes(p))) matches++;
            if (headers.descricao.patterns.some(p => lineText.includes(p))) matches++;
            if (headers.qtd.patterns.some(p => lineText.includes(p))) matches++;
            
            if (matches >= 3) {
                headerLineIndex = i;
                const items = allLines[i].items;
                
                // Mapear posições X
                Object.keys(headers).forEach(key => {
                    const h = headers[key];
                    const item = items.find(it => h.patterns.some(p => it.text.toUpperCase().includes(p)));
                    if (item) {
                        h.found = true;
                        h.xStart = item.x;
                    }
                });
                
                // Definir xEnd baseado na próxima coluna encontrada
                const activeHeaders = Object.values(headers).filter(h => h.found).sort((a, b) => a.xStart - b.xStart);
                activeHeaders.forEach((h, idx) => {
                    if (idx < activeHeaders.length - 1) {
                        h.xEnd = activeHeaders[idx+1].xStart;
                    } else {
                        h.xEnd = 10000;
                    }
                });
                break;
            }
        }

        if (headerLineIndex !== -1) {
            console.log("Smart Parser: Headers detected:", headers);
            
            for(let i = headerLineIndex + 1; i < allLines.length; i++) {
                const line = allLines[i];
                if (line.fullText.match(/DADOS ADICIONAIS|CÁLCULO DO ISSQN|CONTINUAÇÃO|TOTAL/i)) break;
                
                const getTextInRange = (start: number, end: number) => {
                    if (!start && !end) return '';
                    return line.items
                        .filter(item => item.x >= start - 10 && item.x < end)
                        .map(it => it.text)
                        .join(' ')
                        .trim();
                };

                const cProd = headers.codigo.found ? getTextInRange(headers.codigo.xStart, headers.codigo.xEnd) : '';
                const cEAN = headers.ean.found ? getTextInRange(headers.ean.xStart, headers.ean.xEnd) : '';
                const xProd = headers.descricao.found ? getTextInRange(headers.descricao.xStart, headers.descricao.xEnd) : '';
                const qComStr = headers.qtd.found ? getTextInRange(headers.qtd.xStart, headers.qtd.xEnd) : '';
                const vUnComStr = headers.unit.found ? getTextInRange(headers.unit.xStart, headers.unit.xEnd) : '';
                
                const parseNum = (s: string) => {
                    if (!s) return 0;
                    const clean = s.replace(/[^\d,.]/g, '');
                    if (clean.includes(',') && clean.includes('.')) {
                        return parseFloat(clean.replace(/\./g, '').replace(',', '.'));
                    }
                    return parseFloat(clean.replace(',', '.'));
                };

                const qCom = parseNum(qComStr);
                const vUnCom = parseNum(vUnComStr);

                if (qCom > 0 && xProd) {
                    smartExtractionSuccess = true;
                    
                    let matchedVariantId = '';
                    if (cEAN && cEAN !== "SEM GTIN") {
                        const match = products.find(p => p.ean === cEAN);
                        if (match) matchedVariantId = match.variant_id;
                    }
                    if (!matchedVariantId && cProd) {
                        const match = products.find(p => p.cod_fabricante === cProd || p.sku === cProd);
                        if (match) matchedVariantId = match.variant_id;
                    }

                    if (matchedVariantId) {
                        newItems.push({ product_variant_id: matchedVariantId, quantidade: qCom, custo_unit: vUnCom });
                    } else {
                        pendingItems.push({
                            cProd: cProd || '',
                            cEAN: cEAN || '',
                            xProd: xProd,
                            qCom,
                            vUnCom
                        });
                    }
                }
            }
        }

        // Fallback: Lógica antiga baseada em 3 números na linha
        if (!smartExtractionSuccess && newItems.length === 0 && pendingItems.length === 0) {
            console.log("Smart extraction failed, using fallback...");
            const lines = fullText.split('\n');
            let productsStarted = false;

            for (const line of lines) {
              if (line.match(/DADOS DO PRODUTO|CÓDIGO/i)) {
                productsStarted = true;
                continue;
              }
              if (!productsStarted) continue;
              if (line.match(/CÁLCULO DO ISSQN|DADOS ADICIONAIS/i)) break;

              const numberPattern = /(\d+(?:[.,]\d+)?)/g;
              const numbers = line.match(numberPattern);
              
              if (numbers && numbers.length >= 3) {
                const parts = line.trim().split(/\s+/);
                if (parts.length < 5) continue;
                
                const cProd = parts[0];
                const numericTokens = parts.map((p, i) => ({ 
                  val: parseFloat(p.replace(',', '.')), 
                  text: p, 
                  index: i
                })).filter(t => !isNaN(t.val));

                if (numericTokens.length >= 2) {
                  let qCom = 0;
                  let vUnCom = 0;
                  let foundMath = false;

                  for (let i = 0; i < numericTokens.length - 2; i++) {
                    const a = numericTokens[i].val;
                    const b = numericTokens[i+1].val;
                    const c = numericTokens[i+2].val;
                    
                    if (Math.abs(a * b - c) < 0.05) {
                       qCom = a;
                       vUnCom = b;
                       foundMath = true;
                       break;
                    }
                  }

                  if (foundMath) {
                    const xProd = parts.slice(1, parts.length - 5).join(' ');
                    
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
                        cEAN: '', 
                        xProd: xProd || 'Produto sem descrição identificada',
                        qCom,
                        vUnCom
                      });
                    }
                  }
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
            description: "Não foi possível identificar produtos no PDF automaticamente. Verifique o console para mais detalhes.",
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

          // Se não achou por EAN, tentar por código do fabricante (cProd)
          if (!matchedVariantId && cProd) {
             const match = products.find(p => p.cod_fabricante === cProd);
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
              cEAN,
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
            description: `${pendingItems.length} itens não encontrados no sistema.`,
          });

          // Iniciar fluxo de cadastro para o primeiro item
          setTimeout(() => {
            processNextPendingProduct(pendingItems);
          }, 1000);
        }

        if (newItems.length > 0 || pendingItems.length > 0) {
           toast({
            title: "Nota Fiscal processada",
            description: `${newItems.length + pendingItems.length} itens encontrados.`,
          });
        }

      } catch (error) {
        console.error("Erro ao processar XML:", error);
        toast({
          title: "Erro no XML",
          description: "Falha ao processar o arquivo.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const handleSave = async () => {
    if (!supplierId) {
      toast({
        title: "Fornecedor obrigatório",
        description: "Selecione um fornecedor.",
        variant: "destructive"
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Itens obrigatórios",
        description: "Adicione pelo menos um item.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      let anexoUrl = '';
      
      if (anexoFile) {
        const fileExt = anexoFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `notas_fiscais/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('stock_entries')
          .upload(filePath, anexoFile);

        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage
          .from('stock_entries')
          .getPublicUrl(filePath);
          
        anexoUrl = data.publicUrl;
      }

      await onSave({
        numero_nota: numeroNota,
        supplier_id: supplierId,
        data,
        items,
        anexo_url: anexoUrl
      });
      
      onOpenChange(false);
      
      // Limpar form
      setNumeroNota('');
      setSupplierId('');
      setData(new Date().toISOString().split('T')[0]);
      setItems([]);
      setAnexoFile(null);
      setPendingProducts([]);
      
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar a entrada.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Entrada de Estoque</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Arquivo da Nota (XML ou PDF)</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="file" 
                    accept=".xml,.pdf" 
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  {loading && <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>}
                </div>
                <p className="text-xs text-muted-foreground">
                  Importe o XML ou PDF da NF-e para preenchimento automático.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Número da Nota</Label>
                <Input 
                  value={numeroNota} 
                  onChange={(e) => setNumeroNota(e.target.value)} 
                  placeholder="Ex: 12345"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data de Emissão</Label>
                <Input 
                  type="date" 
                  value={data} 
                  onChange={(e) => setData(e.target.value)} 
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Itens da Nota</Label>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>

              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end border p-2 rounded-md">
                  <div className="col-span-5 space-y-1">
                    <Label className="text-xs">Produto</Label>
                    <Select 
                      value={item.product_variant_id} 
                      onValueChange={(value) => updateItem(index, 'product_variant_id', value)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.map((product) => (
                          <SelectItem key={product.variant_id} value={product.variant_id}>
                            {product.nome} {product.cor ? `- ${product.cor}` : ''} {product.tamanho ? `- ${product.tamanho}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-3 space-y-1">
                    <Label className="text-xs">Qtd</Label>
                    <Input 
                      type="number" 
                      className="h-8"
                      value={item.quantidade} 
                      onChange={(e) => updateItem(index, 'quantidade', parseFloat(e.target.value))}
                    />
                  </div>

                  <div className="col-span-3 space-y-1">
                    <Label className="text-xs">Custo Unit.</Label>
                    <Input 
                      type="number" 
                      className="h-8"
                      value={item.custo_unit} 
                      onChange={(e) => updateItem(index, 'custo_unit', parseFloat(e.target.value))}
                    />
                  </div>

                  <div className="col-span-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={uploading}>
                {uploading ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Entrada'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para cadastro de produtos pendentes */}
      {currentPendingProduct && (
        <ProductFormModal
          open={isProductModalOpen}
          mode="create"
          onOpenChange={(open) => {
            if (!open) {
               // Se fechar sem salvar, pular este produto
               setIsProductModalOpen(false);
               const remaining = pendingProducts.slice(1);
               setPendingProducts(remaining);
               setTimeout(() => processNextPendingProduct(remaining), 500);
            }
          }}
          initialData={{
            nome: currentPendingProduct.xProd,
            cod_fabricante: currentPendingProduct.cProd,
            ean: currentPendingProduct.cEAN,
            preco_custo: currentPendingProduct.vUnCom,
            preco_venda: currentPendingProduct.vUnCom * 2 // Sugestão de markup 100%
          }}
          onSuccess={handleProductCreated}
        />
      )}
    </>
  );
}
