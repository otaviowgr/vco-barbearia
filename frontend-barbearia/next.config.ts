import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Protótipo 100% client-side (dados no localStorage do navegador).
  // Permite abrir o servidor de desenvolvimento pelo celular na mesma rede Wi-Fi.
  devIndicators: false, // esconde o botão "N" do Next durante a apresentação
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
