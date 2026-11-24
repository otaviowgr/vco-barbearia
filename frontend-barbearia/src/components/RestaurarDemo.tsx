"use client";

import { useState } from "react";
import { DatabaseBackup } from "lucide-react";
import { API_URL, configService, USAR_API } from "@/services";
import { Botao } from "./ui/Botao";
import { Confirmar } from "./ui/Modal";
import { useToast } from "./ui/Toast";

export function RestaurarDemo() {
  const [aberto, setAberto] = useState(false);
  const toast = useToast();
  return (
    <div className="rounded-2xl border border-perigo/25 bg-perigo/5 p-5">
      <p className="flex items-center gap-2 font-display text-lg tracking-wide uppercase">
        <DatabaseBackup className="size-5 text-perigo" /> Dados da demonstração
      </p>
      <p className="mt-1 text-sm text-texto-2">
        Apaga tudo o que foi feito (agendamentos, cadastros, alterações) e recarrega os dados iniciais, com datas atualizadas para hoje.
      </p>
      <p className="mt-2 text-xs text-texto-3">
        Modo atual:{" "}
        {USAR_API ? (
          <span className="text-sucesso">servidor Spring Boot ({API_URL}) — os dados ficam no banco de dados do servidor</span>
        ) : (
          <span className="text-ouro">demonstração — os dados ficam só neste navegador</span>
        )}
      </p>
      <Botao className="mt-4" variante="perigo" onClick={() => setAberto(true)} icone={<DatabaseBackup className="size-4" />}>
        Restaurar dados da demonstração
      </Botao>
      <Confirmar
        aberto={aberto}
        aoFechar={() => setAberto(false)}
        perigo
        titulo="Restaurar a demonstração?"
        mensagem="Todas as alterações feitas neste navegador serão perdidas. Você continuará logado."
        textoConfirmar="Restaurar"
        aoConfirmar={async () => {
          await configService.restaurarDemonstracao();
          setAberto(false);
          toast.sucesso("Demonstração restaurada!", "Os dados iniciais foram recarregados.");
        }}
      />
    </div>
  );
}
