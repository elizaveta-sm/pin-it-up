import React from 'react'
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store, persistor } from './store/store.js';
import App from './App.jsx';
import { PersistGate } from 'redux-persist/integration/react';

import './index.css';
import { BottomModalProvider } from './context/bottom-modal-provider.jsx';
import ConfirmationModalProvider from './context/confirmation-modal-provider.jsx';
import AlertMessageProvider from './context/alert-provider.jsx';

export const appUrl = import.meta.env.VITE_REACT_APP_URL;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfirmationModalProvider>
      <BottomModalProvider>
        <AlertMessageProvider>
          <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
              <App />
            </PersistGate>
          </Provider>
        </AlertMessageProvider>
      </BottomModalProvider>
    </ConfirmationModalProvider>
  </React.StrictMode>,
)
