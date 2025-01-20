import React from 'react';
import Calendar from './Components/Calendar';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">Gatherly</h1>
      </header>
      <main>
        <Calendar />
      </main>
    </div>
  );
}

export default App;
