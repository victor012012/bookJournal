import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import LibraryPage from '../Components/Library';

export default function App() {
  return (
    <Router>
      <div className="app-container h-100">
        <Routes>
          <Route path="/" element={<LibraryPage />} />
        </Routes>
      </div>
    </Router>
  );
}
