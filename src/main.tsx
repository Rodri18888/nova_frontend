import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App'
import './index.css'
import { getSavedTheme } from './hooks/use-theme'

document.documentElement.classList.toggle('dark', getSavedTheme() === 'dark')

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const app = GOOGLE_CLIENT_ID ? (
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <App />
  </GoogleOAuthProvider>
) : (
  <App />
)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{app}</React.StrictMode>,
)
