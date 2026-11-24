"use client";

import { useState, type ReactNode } from "react";
import {
  Award,
  Banknote,
  CreditCard,
  Plus,
  QrCode,
  Receipt,
  Scissors,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  UserX,
  Users,
  Wallet,
} from "lucide-react";
import type { CategoriaDespesa, FiltroFinanceiro, MetodoPagamento, ResumoFinanceiro } from "@/types";
import { useApi } from "@/hooks/useApi";
import { barbeiroService, despesaService, financeiroService } from "@/services";
import { GraficoFaturamento, GraficoRanking } from "@/components/barbeiro/Graficos";
import { Badge, Campo, Input, Segmentado, Select, Skeleton, TituloPagina } from "@/components/ui/basicos";
import { Botao } from "@/components/ui/Botao";
import { Confirmar, Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { deISODate, fimDoMes, formatarData, hoje, nomeMes } from "@/lib/datas";
import { formatarMoeda, formatarPercentual } from "@/lib/formatadores";
import { METODO_PAGAMENTO } from "@/lib/status";

type TipoPeriodo = "dia" | "mes" | "ano" | "personalizado";

const CATEGORIAS: Record<CategoriaDespesa, string> = {
  aluguel: "Aluguel",
  produtos: "Produtos",
  contas: "Contas",
  marketing: "Marketing",
  manutencao: "Manutenção",
  outros: "Outros",
};

function variacao(atual: number, anterior: number) {
  if (!anterior) return null;
  return (atual - anterior) / Math.abs(anterior);
}

export default function PaginaFinanceiro() {
  const hj = hoje();
  const [tipo, setTipo] = useState<TipoPeriodo>("mes");
  const [dia, setDia] = useState(hj);
  const [mes, setMes] = useState(hj.slice(0, 7));
  const [ano, setAno] = useState(Number(hj.slice(0, 4)));
  const [de, setDe] = useState(hj.slice(0, 8) + "01");
  const [ate, setAte] = useState(hj);
  const [barbeiroId, setBarbeiroId] = useState("");
  const [metodo, setMetodo] = useState<MetodoPagamento | "">("");
  const [novaDespesa, setNovaDespesa] = useState(false);
  const [removendo, setRemovendo] = useState<string | null>(null);
  const toast = useToast();

  const periodo: FiltroFinanceiro = {
    ...(tipo === "dia"
      ? { inicio: dia, fim: dia }
      : tipo === "mes"
        ? { inicio: `${mes}-01`, fim: fimDoMes(`${mes}-01`) }
        : tipo === "ano"
          ? { inicio: `${ano}-01-01`, fim: `${ano}-12-31` }
          : { inicio: de <= ate ? de : ate, fim: de <= ate ? ate : de }),
    barbeiroId: barbeiroId || undefined,
    metodo: metodo || undefined,
  };
  const chave = JSON.stringify(periodo);
  const mesGrafico = (tipo === "ano" ? (ano === Number(hj.slice(0, 4)) ? hj : `${ano}-12-01`) : periodo.fim > hj && periodo.inicio <= hj ? hj : periodo.fim).slice(0, 7);
  const anoGrafico = Number(periodo.fim.slice(0, 4));
  const filtroSerie = { barbeiroId: periodo.barbeiroId, metodo: periodo.metodo };

  const { dados: resumo } = useApi(() => financeiroService.resumo(periodo), [chave]);
  const { dados: porDia } = useApi(() => financeiroService.porDiaDoMes(mesGrafico, filtroSerie), [mesGrafico, barbeiroId, metodo]);
  const { dados: porMes } = useApi(() => financeiroService.porMesDoAno(anoGrafico, filtroSerie), [anoGrafico, barbeiroId, metodo]);
  const { dados: ranking } = useApi(() => financeiroService.rankingBarbeiros(periodo), [chave]);
  const { dados: despesas } = useApi(() => despesaService.listar({ inicio: periodo.inicio, fim: periodo.fim }), [periodo.inicio, periodo.fim]);
  const { dados: barbeiros } = useApi(() => barbeiroService.listar({ incluirInativos: true }), []);

  const a = resumo?.atual;
  const ant = resumo?.anterior;
  const dMes = deISODate(`${mesGrafico}-01`);

  return (
    <div className="space-y-5">
      <TituloPagina titulo="Financeiro" subtitulo="Faturamento considera apenas atendimentos concluídos e pagos." />

      {/* Filtros (uma linha) */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-borda bg-painel p-3">
        <Segmentado
          valor={tipo}
          aoMudar={setTipo}
          opcoes={[
            { valor: "dia", rotulo: "Diário" },
            { valor: "mes", rotulo: "Mensal" },
            { valor: "ano", rotulo: "Anual" },
            { valor: "personalizado", rotulo: "Período" },
          ]}
        />
        {tipo === "dia" && <InputData type="date" value={dia} onChange={setDia} />}
        {tipo === "mes" && <InputData type="month" value={mes} onChange={setMes} />}
        {tipo === "ano" && (
          <Select value={ano} onChange={(e) => setAno(Number(e.target.value))} className="!h-10 !w-auto">
            {[0, 1, 2].map((i) => {
              const y = Number(hj.slice(0, 4)) - i;
              return (
                <option key={y} value={y}>
                  {y}
                </option>
              );
            })}
          </Select>
        )}
        {tipo === "personalizado" && (
          <>
            <InputData type="date" value={de} onChange={setDe} />
            <span className="text-sm text-texto-3">até</span>
            <InputData type="date" value={ate} onChange={setAte} />
          </>
        )}
        <div className="ml-auto flex flex-wrap gap-2">
          <Select value={barbeiroId} onChange={(e) => setBarbeiroId(e.target.value)} className="!h-10 !w-auto" aria-label="Filtrar por barbeiro">
            <option value="">Todos os barbeiros</option>
            {barbeiros?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nome}
              </option>
            ))}
          </Select>
          <Select value={metodo} onChange={(e) => setMetodo(e.target.value as MetodoPagamento | "")} className="!h-10 !w-auto" aria-label="Filtrar por forma de pagamento">
            <option value="">Todas as formas</option>
            <option value="pix">Pix</option>
            <option value="cartao">Cartão</option>
            <option value="dinheiro">Dinheiro</option>
          </Select>
        </div>
      </div>
      {resumo && (
        <p className="-mt-2 text-xs text-texto-3">
          {formatarData(periodo.inicio)}
          {periodo.fim !== periodo.inicio && ` a ${formatarData(periodo.fim)}`} · comparado com {formatarData(resumo.periodoAnterior.inicio)}
          {resumo.periodoAnterior.fim !== resumo.periodoAnterior.inicio && ` a ${formatarData(resumo.periodoAnterior.fim)}`}
        </p>
      )}

      {/* KPIs principais */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi destaque icone={<Wallet />} rotulo="Faturamento" valor={a && formatarMoeda(a.faturamento)} delta={a && ant && variacao(a.faturamento, ant.faturamento)} />
        <Kpi icone={<Users />} rotulo="Atendimentos" valor={a && String(a.atendimentos)} delta={a && ant && variacao(a.atendimentos, ant.atendimentos)} />
        <Kpi icone={<Receipt />} rotulo="Ticket médio" valor={a && formatarMoeda(a.ticketMedio)} delta={a && ant && variacao(a.ticketMedio, ant.ticketMedio)} />
        <CardLucro resumo={a} />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi pequeno icone={<Scissors />} rotulo="Mais vendido" valor={a && (a.servicoMaisVendido ? `${a.servicoMaisVendido.nome}` : "—")} extra={a?.servicoMaisVendido ? `${a.servicoMaisVendido.quantidade}× no período` : undefined} />
        <Kpi pequeno icone={<UserX />} rotulo="Taxa de faltas" valor={a && formatarPercentual(a.taxaFaltas, 1)} delta={a && ant && variacao(a.taxaFaltas, ant.taxaFaltas)} inverterDelta />
        <Kpi pequeno icone={<Tag />} rotulo="Descontos fidelidade" valor={a && formatarMoeda(a.descontos)} />
        <Kpi pequeno icone={<TrendingDown />} rotulo="Despesas" valor={a && formatarMoeda(a.despesas)} />
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Painel titulo={`Faturamento por dia · ${nomeMes(dMes.getMonth())} ${dMes.getFullYear()}`} subtitulo="Barras: mês selecionado · linha tracejada: mês anterior">
          {porDia ? <GraficoFaturamento dados={porDia} nomeAtual={nomeMes(dMes.getMonth())} nomeAnterior="Mês anterior" prefixoRotulo="Dia " /> : <Skeleton className="h-72" />}
        </Painel>
        <Painel titulo={`Faturamento por mês · ${anoGrafico}`} subtitulo={`Barras: ${anoGrafico} · linha tracejada: ${anoGrafico - 1}`}>
          {porMes ? <GraficoFaturamento dados={porMes} nomeAtual={String(anoGrafico)} nomeAnterior={String(anoGrafico - 1)} /> : <Skeleton className="h-72" />}
        </Painel>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Painel titulo="Ranking de barbeiros" subtitulo="Faturamento no período" icone={<Award className="size-4 text-ouro" />}>
          {ranking ? (
            ranking.length ? <GraficoRanking dados={ranking} /> : <p className="py-6 text-center text-sm text-texto-3">Sem atendimentos no período.</p>
          ) : (
            <Skeleton className="h-40" />
          )}
        </Painel>
        <Painel titulo="Por forma de pagamento">
          {a ? (
            <div className="space-y-3.5 pt-1">
              {(["pix", "cartao", "dinheiro"] as MetodoPagamento[]).map((m) => {
                const v = a.porMetodo[m];
                const pct = a.faturamento ? v / a.faturamento : 0;
                const Icone = m === "pix" ? QrCode : m === "cartao" ? CreditCard : Banknote;
                return (
                  <div key={m}>
                    <div className="mb-1.5 flex items-center gap-2 text-sm">
                      <Icone className="size-4 text-texto-3" />
                      <span>{METODO_PAGAMENTO[m]}</span>
                      <span className="ml-auto font-semibold">{formatarMoeda(v)}</span>
                      <span className="w-12 text-right text-xs text-texto-3">{formatarPercentual(pct)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-painel-3">
                      <div className="h-full rounded-full bg-ouro transition-[width] duration-700" style={{ width: `${pct * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Skeleton className="h-32" />
          )}
        </Painel>
      </div>

      {/* Despesas */}
      <Painel
        titulo="Despesas do período"
        subtitulo={despesas ? `${despesas.length} lançamento${despesas.length === 1 ? "" : "s"} · ${formatarMoeda(despesas.reduce((t, d) => t + d.valor, 0))}` : undefined}
        acao={
          <Botao tamanho="sm" icone={<Plus className="size-4" />} onClick={() => setNovaDespesa(true)}>
            Lançar despesa
          </Botao>
        }
      >
        {!despesas ? (
          <Skeleton className="h-32" />
        ) : despesas.length === 0 ? (
          <p className="py-6 text-center text-sm text-texto-3">Nenhuma despesa lançada neste período.</p>
        ) : (
          <div className="max-h-80 divide-y divide-borda overflow-y-auto">
            {despesas.map((d) => (
              <div key={d.id} className="group flex items-center gap-3 py-2.5 text-sm">
                <span className="w-20 shrink-0 text-texto-3 tabular-nums">{formatarData(d.data)}</span>
                <span className="min-w-0 flex-1 truncate">{d.descricao}</span>
                <Badge className="hidden sm:inline-flex">{CATEGORIAS[d.categoria]}</Badge>
                <span className="w-24 text-right font-medium text-perigo">− {formatarMoeda(d.valor)}</span>
                <button onClick={() => setRemovendo(d.id)} className="rounded-md p-1 text-texto-3 opacity-60 transition group-hover:opacity-100 hover:text-perigo" aria-label="Remover despesa">
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Painel>

      <NovaDespesaModal aberto={novaDespesa} aoFechar={() => setNovaDespesa(false)} />
      <Confirmar
        aberto={!!removendo}
        aoFechar={() => setRemovendo(null)}
        titulo="Remover despesa?"
        mensagem="O lucro do período será recalculado."
        perigo
        textoConfirmar="Remover"
        aoConfirmar={async () => {
          await despesaService.remover(removendo!);
          toast.sucesso("Despesa removida");
          setRemovendo(null);
        }}
      />
    </div>
  );
}

function InputData({ type, value, onChange }: { type: "date" | "month"; value: string; onChange: (v: string) => void }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => e.target.value && onChange(e.target.value)}
      className="h-10 rounded-xl border border-borda bg-painel-2 px-3 text-sm text-texto [color-scheme:dark]"
    />
  );
}

function Painel({ titulo, subtitulo, children, acao, icone }: { titulo: string; subtitulo?: string; children: ReactNode; acao?: ReactNode; icone?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-borda bg-painel p-4 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg tracking-wide uppercase">
            {icone}
            {titulo}
          </h2>
          {subtitulo && <p className="text-xs text-texto-3">{subtitulo}</p>}
        </div>
        {acao}
      </div>
      {children}
    </section>
  );
}

function Kpi({
  icone,
  rotulo,
  valor,
  delta,
  destaque,
  pequeno,
  extra,
  inverterDelta,
}: {
  icone: ReactNode;
  rotulo: string;
  valor?: string;
  delta?: number | null;
  destaque?: boolean;
  pequeno?: boolean;
  extra?: string;
  inverterDelta?: boolean;
}) {
  const bom = delta != null && (inverterDelta ? delta < 0 : delta > 0);
  return (
    <div className={`rounded-2xl border p-4 ${destaque ? "border-ouro/40 bg-gradient-to-br from-ouro-fundo to-painel" : "border-borda bg-painel"}`}>
      <div className="flex items-center gap-2 text-xs tracking-wide text-texto-3 uppercase [&>svg]:size-4 [&>svg]:text-ouro">
        {icone}
        {rotulo}
      </div>
      {valor === undefined ? (
        <Skeleton className="mt-2 h-8 w-28" />
      ) : (
        <p className={`mt-1.5 truncate font-display font-semibold ${pequeno ? "text-xl" : "text-3xl"} ${destaque ? "text-ouro" : ""}`}>{valor}</p>
      )}
      {delta != null && Number.isFinite(delta) && (
        <p className={`mt-1 flex items-center gap-1 text-xs ${bom ? "text-sucesso" : "text-perigo"}`}>
          {delta >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
          {delta >= 0 ? "+" : ""}
          {formatarPercentual(delta, 1)} <span className="text-texto-3">vs. anterior</span>
        </p>
      )}
      {extra && <p className="mt-1 text-xs text-texto-3">{extra}</p>}
    </div>
  );
}

function CardLucro({ resumo }: { resumo?: ResumoFinanceiro }) {
  if (!resumo) return <Kpi icone={<Wallet />} rotulo="Lucro líquido" />;
  const lucro = resumo.lucro >= 0;
  return (
    <div className={`rounded-2xl border p-4 ${lucro ? "border-sucesso/40 bg-sucesso/[0.07]" : "border-perigo/40 bg-perigo/[0.07]"}`}>
      <div className="flex items-center gap-2 text-xs tracking-wide text-texto-3 uppercase">
        {lucro ? <TrendingUp className="size-4 text-sucesso" /> : <TrendingDown className="size-4 text-perigo" />}
        Lucro líquido
      </div>
      <p className={`mt-1.5 truncate font-display text-3xl font-semibold ${lucro ? "text-sucesso" : "text-perigo"}`}>{formatarMoeda(resumo.lucro)}</p>
      <p className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${lucro ? "bg-sucesso/15 text-sucesso" : "bg-perigo/15 text-perigo"}`}>
        {lucro ? "▲ Lucro" : "▼ Prejuízo"}
        <span className="font-normal text-texto-3">· faturamento − despesas</span>
      </p>
    </div>
  );
}

function NovaDespesaModal({ aberto, aoFechar }: { aberto: boolean; aoFechar: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({ descricao: "", categoria: "produtos" as CategoriaDespesa, valor: "", data: hoje() });
  const [salvando, setSalvando] = useState(false);
  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo="Lançar despesa" largura="sm">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setSalvando(true);
          try {
            await despesaService.criar({ ...f, valor: Number(f.valor.replace(",", ".")) });
            toast.sucesso("Despesa lançada");
            setF({ descricao: "", categoria: "produtos", valor: "", data: hoje() });
            aoFechar();
          } catch (err) {
            toast.erro("Erro", (err as Error).message);
          } finally {
            setSalvando(false);
          }
        }}
      >
        <Campo rotulo="Descrição">
          <Input required value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} placeholder="Ex.: compra de lâminas" />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Categoria">
            <Select value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value as CategoriaDespesa })}>
              {Object.entries(CATEGORIAS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Campo>
          <Campo rotulo="Valor (R$)">
            <Input required inputMode="decimal" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} placeholder="0,00" />
          </Campo>
        </div>
        <Campo rotulo="Data">
          <Input type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} className="[color-scheme:dark]" />
        </Campo>
        <Botao type="submit" largura="total" carregando={salvando}>
          Lançar
        </Botao>
      </form>
    </Modal>
  );
}
