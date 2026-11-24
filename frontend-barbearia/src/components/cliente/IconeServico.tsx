import {
  Baby,
  Blend,
  Brush,
  Droplets,
  Eye,
  Palette,
  Scissors,
  Sparkles,
  Waves,
  type LucideIcon,
} from "lucide-react";

const normalizar = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Escolhe o(s) ícone(s) pelo nome do serviço. Assim, um serviço novo
 * cadastrado pelo barbeiro também ganha um ícone que combina com ele.
 */
export function iconesDoServico(nome: string): LucideIcon[] {
  const n = normalizar(nome);
  const temCorte = /corte|cabelo|social|tesoura|maquina/.test(n);
  const temBarba = /barba|bigode|navalha/.test(n);
  if (temCorte && temBarba) return [Scissors, Brush]; // combo
  if (temBarba) return [Brush]; // pincel de barbear
  if (/degrad|fade|disfarcad/.test(n)) return [Blend];
  if (/pigment|tintur|colora/.test(n)) return [Palette];
  if (/sobrancelha|cilio/.test(n)) return [Eye];
  if (/hidrat|lavag|shampoo|tratament/.test(n)) return [Droplets];
  if (/luzes|platin|reflex|nevou/.test(n)) return [Sparkles];
  if (/massag|relax|spa/.test(n)) return [Waves];
  if (/infantil|kids|crianc/.test(n)) return [Baby];
  return [Scissors];
}

const TAMANHOS = {
  sm: { caixa: "size-11 rounded-xl", icone: "size-5" },
  md: { caixa: "size-14 rounded-2xl", icone: "size-6" },
  lg: { caixa: "size-16 rounded-2xl", icone: "size-7" },
};

/**
 * Quadro com o ícone do serviço. Precisa estar dentro de um elemento com a
 * classe "group": ao passar o mouse sobre ele, o ícone balança e o quadro acende.
 */
export function IconeServico({
  nome,
  tamanho = "md",
  ativo = false,
}: {
  nome: string;
  tamanho?: keyof typeof TAMANHOS;
  ativo?: boolean;
}) {
  const icones = iconesDoServico(nome);
  const t = TAMANHOS[tamanho];
  return (
    <span
      aria-hidden
      className={`relative grid shrink-0 place-items-center border transition-all duration-300 ${t.caixa} ${
        ativo
          ? "border-marca-escuro bg-marca-escuro text-white shadow-lg shadow-marca/30"
          : "border-borda bg-painel-2 text-marca group-hover:border-marca/50 group-hover:bg-marca/10 group-hover:shadow-lg group-hover:shadow-marca/20"
      }`}
    >
      <span className="flex items-center -space-x-1.5 group-hover:animate-balanco">
        {icones.map((Icone, i) => (
          <Icone key={i} className={t.icone} strokeWidth={1.75} />
        ))}
      </span>
    </span>
  );
}
