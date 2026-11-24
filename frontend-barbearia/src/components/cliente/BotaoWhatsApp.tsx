"use client";

import { usePathname } from "next/navigation";
import { configService } from "@/services";
import { linkWhatsApp } from "@/lib/formatadores";

export function IconeWhatsApp({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.43 9.43 0 0 1-4.8-1.32l-.35-.2-3.57.93.96-3.48-.23-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.24-9.44 9.45-9.44a9.4 9.4 0 0 1 6.68 2.77 9.38 9.38 0 0 1 2.76 6.68c0 5.21-4.24 9.44-9.45 9.44M20.08 3.9A11.28 11.28 0 0 0 12.05.6C5.8.6.71 5.68.7 11.93c0 2 .52 3.95 1.52 5.66L.6 23.4l5.95-1.56a11.3 11.3 0 0 0 5.4 1.38h.01c6.25 0 11.34-5.08 11.34-11.33 0-3.03-1.18-5.87-3.32-8.01" />
    </svg>
  );
}

/** Botão flutuante de WhatsApp da barbearia (área do cliente). */
export function BotaoWhatsApp() {
  const pathname = usePathname();
  if (pathname.startsWith("/cliente/agendar")) return null; // não atrapalha a barra do agendamento
  const cfg = configService.obterSync();
  return (
    <a
      href={linkWhatsApp(cfg.whatsapp, `Olá, ${cfg.nome}! Vim pelo site e gostaria de tirar uma dúvida.`)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed right-4 bottom-24 z-30 grid size-14 place-items-center rounded-full bg-[#25d366] text-white shadow-xl shadow-black/50 transition hover:scale-110 lg:bottom-8"
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-[#25d366]/40 [animation-duration:2.5s]" />
      <IconeWhatsApp className="relative size-7" />
    </a>
  );
}
