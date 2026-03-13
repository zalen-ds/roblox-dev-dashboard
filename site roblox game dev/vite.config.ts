import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // Removemos o Tailwind V4 daqui porque ele exige uma instalação complexa. 
  // O Tailwind continuará funcionando via PostCSS se estiver configurado.
  plugins: [react()],
  resolve: {
    alias: {
      // Isso garante que o '@' aponte sempre para a pasta src
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Força a saída para a pasta dist, que é o que a Vercel espera
    outDir: 'dist',
  }
});
