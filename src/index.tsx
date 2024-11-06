import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import "./App.css";

const root = document.createElement("div")
root.className = "container"
document.body.appendChild(root)
const rootDiv = ReactDOM.createRoot(root);
rootDiv.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
window.onload = function() {
  // Resize the popup window to 360x500
  window.resizeTo(360, 500);
};
