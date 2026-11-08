import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { CelestialTrajectoryProvider } from './context/CelestialTrajectoryContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CelestialTrajectoryProvider>
      <App />
    </CelestialTrajectoryProvider>
  </React.StrictMode>
);
