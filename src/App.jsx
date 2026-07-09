import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CustomerPortal from './pages/CustomerPortal';
import AdminPortal from './pages/AdminPortal';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CustomerPortal />} />
        <Route path="/admin" element={<AdminPortal />} />
      </Routes>
    </Router>
  );
}

export default App;
