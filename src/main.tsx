import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { getSavedTheme } from './hooks/use-theme'

document.documentElement.classList.toggle('dark', getSavedTheme() === 'dark')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
