import { createRoot } from 'react-dom/client';
import '@fontsource/fredoka/400.css';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import './styles.css';
import { App } from './App.tsx';
import { Gallery } from './dev/Gallery.tsx';

// iPadOS: no pinch-zoom, and :active styles need a touch listener to show up.
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('touchstart', () => {}, { passive: true });

// The drawing gallery only exists in development; production builds leave it out.
const gallery = import.meta.env.DEV && location.hash === '#gallery';
createRoot(document.getElementById('root')!).render(gallery ? <Gallery /> : <App />);
