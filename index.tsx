import App from './App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// @ts-ignore - ReactDOM is a global variable from the script in index.html
const root = ReactDOM.createRoot(rootElement);
root.render(
  // @ts-ignore - React is a global variable from the script in index.html
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
