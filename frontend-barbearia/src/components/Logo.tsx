import { Scissors } from "lucide-react";

export function Logo({ tamanho = "md", compacto = false }: { tamanho?: "sm" | "md" | "lg"; compacto?: boolean }) {
  const t = { sm: "text-lg", md: "text-xl", lg: "text-4xl" }[tamanho];
  const i = { sm: "size-7", md: "size-8", lg: "size-14" }[tamanho];
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <span className={`${i} grid place-items-center rounded-lg bg-marca-escuro text-white shadow-lg shadow-marca/25`}>
        <Scissors className="size-1/2 -rotate-45" strokeWidth={2.5} />
      </span>
      {!compacto && (
        <span className={`font-display ${t} font-semibold uppercase leading-none tracking-wider`}>
          VCO <span className="font-normal text-texto-2">Barbearia</span>
        </span>
      )}
    </span>
  );
}
