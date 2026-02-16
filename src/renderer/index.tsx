import { createRoot } from 'react-dom/client';
import App from './App';
import 'bootstrap/dist/css/bootstrap.css';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(<App />);

// calling IPC exposed from preload script
window.electron?.ipcRenderer.once('ipc-example', (arg) => {
});
window.electron?.ipcRenderer.sendMessage('ipc-example', ['ping']);

// Ctrl/Cmd + mouse wheel zoom handler
window.addEventListener('wheel', (e: WheelEvent) => {
	try {
		const meta = (e as any).metaKey || false;
		const ctrl = (e as any).ctrlKey || false;
		if ((ctrl || meta) && Math.abs(e.deltaY) > 0) {
			e.preventDefault();
			const delta = e.deltaY > 0 ? -0.1 : 0.1;
			// call the exposed API from preload
			(window as any).api?.zoomChange(delta);
		}
	} catch (err) {
		// ignore
	}
}, { passive: false });
