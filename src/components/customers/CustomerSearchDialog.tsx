import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import {
  Command, CommandInput, CommandList, CommandItem, CommandEmpty, CommandGroup
} from "@/components/ui/command";
import { Users, Loader2 } from "lucide-react";

export type Customer = {
  id: string;
  nome: string;
  telefone: string | null;
  cpf: string | null;
};

type Props = {
  triggerLabel?: string;
  onSelect: (customer: Customer) => void;
  onClear?: () => void; // opcional: para remover cliente selecionado
};

export default function CustomerSearchDialog({ triggerLabel = "Selecionar", onSelect, onClear }: Props) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<Customer[]>([]);

  React.useEffect(() => {
    if (!open) return;
    let active = true;
    const t = setTimeout(async () => {
      setLoading(true);
      // Busca por nome/telefone/cpf (ilike). Limita a 20 resultados.
      const or = [
        `nome.ilike.%${q}%`,
        `telefone.ilike.%${q}%`,
        `cpf.ilike.%${q}%`,
      ].join(",");

      const { data, error } = await supabase
        .from("customers")
        .select("id,nome,telefone,cpf")
        .or(or)
        .order("nome")
        .limit(20);

      if (!active) return;
      setLoading(false);
      if (error) {
        console.error(error);
        setResults([]);
        return;
      }
      setResults((data as Customer[]) ?? []);
    }, 300); // debounce

    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [q, open]);

  // carrega os primeiros 20 quando abre, sem filtro
  React.useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("customers")
        .select("id,nome,telefone,cpf")
        .order("created_at", { ascending: false })
        .limit(20);
      setLoading(false);
      if (error) {
        console.error(error);
        setResults([]);
        return;
      }
      setResults((data as Customer[]) ?? []);
    })();
  }, [open]);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Users className="mr-2 h-4 w-4" />
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent aria-describedby="customer-search-desc" className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Buscar cliente</DialogTitle>
            <DialogDescription id="customer-search-desc">
              Digite nome, telefone ou CPF para localizar.
            </DialogDescription>
          </DialogHeader>

          <Command shouldFilter={false}>
            <CommandInput
              value={q}
              onValueChange={setQ}
              placeholder="Ex.: Maria, 4199..., 123.456..."
            />
            <CommandList>
              {loading && (
                <div className="px-3 py-2 text-sm text-muted-foreground flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Buscando…
                </div>
              )}
              {!loading && <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>}
              {!loading && results.length > 0 && (
                <CommandGroup heading="Resultados">
                  {results.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={c.nome}
                      onSelect={() => {
                        onSelect(c);
                        setOpen(false);
                        setQ("");
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{c.nome}</span>
                        <span className="text-xs text-muted-foreground">
                          {c.cpf ?? "sem CPF"} • {c.telefone ?? "sem telefone"}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>

          <DialogFooter className="justify-between">
            {onClear ? (
              <Button
                variant="ghost"
                onClick={() => {
                  onClear();
                  setOpen(false);
                }}
              >
                Limpar seleção
              </Button>
            ) : <span />}
            <Button variant="outline" onClick={() => setOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
