
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// Import firebase to ensure it's initialized before the app
import './services/firebase';

createRoot(document.getElementById("root")!).render(<App />);
