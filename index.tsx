import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { ParallaxProvider } from 'react-scroll-parallax';
import App from './App';
import { theme } from './constants';
import { AuthProvider } from './contexts/AuthContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HashRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ParallaxProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ParallaxProvider>
      </ThemeProvider>
    </HashRouter>
  </React.StrictMode>
);