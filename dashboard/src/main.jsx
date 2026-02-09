import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { Toaster } from 'sonner'
import { ThemeProvider } from './components/providers/theme-provider.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <App />
        <Toaster position="top-right" theme="dark" richColors />
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>,
)