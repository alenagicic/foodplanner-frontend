import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 💡 FIX: Set the base path to your GitHub repository name 
  // This ensures assets (JS/CSS) are loaded from the correct subdirectory.
  base: '/matabas-frontend/', 
});