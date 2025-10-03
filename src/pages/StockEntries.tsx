import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, FileText, ExternalLink } from 'lucide-react';
import { useStockEntries } from '@/hooks/useStockEntries';
import { StockEntryModal } from '@/components/stock/StockEntryModal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function StockEntries() {
  const { entries, loading, createEntry, getEntryDetails } = useStockEntries();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [entryDetails, setEntryDetails] = useState<any[]>([]);

  const handleCreateEntry = async (data: any) => {
    await createEntry(data);
  };

  const handleViewDetails = async (entryId: string) => {
    const details = await getEntryDetails(entryId);
    setEntryDetails(details);
    setSelectedEntry(entryId);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Entradas de Estoque</h1>
            <p className="text-muted-foreground mt-1">
              Lançamento de notas fiscais e entradas de mercadorias
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Entrada
          </Button>
        </div>

        <Card className="p-6">
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Carregando...</p>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Nenhuma entrada registrada</p>
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Registrar Primeira Entrada
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Nº Nota</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Anexo</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {new Date(entry.data).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {entry.numero_nota || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      {entry.suppliers?.nome || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      R$ {entry.total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {entry.anexo_url ? (
                        <a
                          href={entry.anexo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Ver anexo
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(entry.id)}
                      >
                        Ver itens
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {selectedEntry && entryDetails.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Itens da Entrada</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Variante</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Custo Unit.</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entryDetails.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.product_variants?.products?.nome}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.product_variants?.sku}</Badge>
                    </TableCell>
                    <TableCell>
                      {item.product_variants?.cor && `${item.product_variants.cor} `}
                      {item.product_variants?.tamanho && `- ${item.product_variants.tamanho}`}
                    </TableCell>
                    <TableCell className="text-right">{item.quantidade}</TableCell>
                    <TableCell className="text-right">
                      R$ {item.custo_unit.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      R$ {(item.quantidade * item.custo_unit).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      <StockEntryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={handleCreateEntry}
      />
    </Layout>
  );
}
