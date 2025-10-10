import React from 'react'
import ReactDOM from 'react-dom/client'
import AdvancedPasswordManager from './AdvancedPasswordManager'
import DyslexiaAssistant from './DyslexiaAssistant'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AdvancedPasswordManager />
    <DyslexiaAssistant />
  </React.StrictMode>,
)