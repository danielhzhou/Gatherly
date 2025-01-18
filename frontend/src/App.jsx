import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import Modal from 'react-modal';
import Calendar from './Components/Calendar';

Modal.setAppElement('#root');



function App() {
  return (
    <div>
      <Calendar />
    </div>
  );
}

export default App
