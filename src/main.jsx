import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App/App';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// The only ToastContainer in the app (a second one doubled every toast).
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <ToastContainer position="top-right" autoClose={4000} theme="dark" />
  </React.StrictMode>
);
