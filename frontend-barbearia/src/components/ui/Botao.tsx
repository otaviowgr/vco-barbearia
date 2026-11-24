import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

type Variante = "primario" | "secundario" | "fantasma" | "perigo" | "sucesso" | "contorno";
type Tamanho = "sm" | "md" | "lg";

const VARIANTES: Record<Variante, string> = {
  primario:
    "bg-gradient-to-b from-ouro-claro to-ouro text-fundo font-semibold shadow-lg shadow-ouro/15 hover:brightness-110 active:brightness-95",
  secundario: "bg-painel-3 text-texto hover:bg-borda-forte border border-borda",
  contorno: "border border-ouro/50 text-ouro hover:bg-ouro/10",
  fantasma: "text-texto-2 hover:text-texto hover:bg-painel-3",
  perigo: "bg-perigo/12 text-perigo border border-perigo/30 hover:bg-perigo/20",
  sucesso: "bg-sucesso/12 text-sucesso border border-sucesso/30 hover:bg-sucesso/20",
};

const TAMANHOS: Record<Tamanho, string> = {
  sm: "h-8 px-3 text-sm gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-base gap-2 rounded-xl",
};

export interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamanho?: Tamanho;
  carregando?: boolean;
  icone?: ReactNode;
  largura?: "auto" | "total";
}

export function Botao({
  variante = "primario",
  tamanho = "md",
  carregando,
  icone,
  largura = "auto",
  className = "",
  children,
  disabled,
  type = "button",
  ...resto
}: BotaoProps) {
  return (
    <button
      type={type}
      disabled={disabled || carregando}
      className={`inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ouro ${VARIANTES[variante]} ${TAMANHOS[tamanho]} ${largura === "total" ? "w-full" : ""} ${className}`}
      {...resto}
    >
      {carregando ? <Loader2 className="size-4 animate-spin" /> : icone}
      {children}
    </button>
  );
}
