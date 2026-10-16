import { createRoot } from 'react-dom/client';
import '@fontsource/fredoka/600.css';
import './styles.css';
import { App } from './App.tsx';

createRoot(document.getElementById('root')!).render(<App />);
