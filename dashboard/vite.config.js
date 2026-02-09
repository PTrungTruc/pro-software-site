import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Lưu ý: Nhớ xóa nếu đã chạy trên server http://14.241.225.202:3001
  // server: {
  //   proxy: {
  //     '/api': {
  //       target: 'http://localhost:3001',
  //       changeOrigin: true,
  //     },
  //     '/public': {
  //       target: 'http://localhost:3001',
  //       changeOrigin: true,
  //     }
  //   },
  // },
})