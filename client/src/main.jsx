import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: '#1c2128',
          color: '#f9fafb',
          border: '1px solid #30363d',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
        },
        success: { iconTheme: { primary: '#22c55e', secondary: '#1c2128' } },
        error: { iconTheme: { primary: '#ef4444', secondary: '#1c2128' } }
      }}
    />
  </React.StrictMode>
)