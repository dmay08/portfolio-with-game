import React from 'react';
import './App.css';
import GameBackground from './GameBackground';

function App() {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <GameBackground />
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white bg-black bg-opacity-50">
        <h1 className="text-4xl font-bold mb-4">My Portfolio</h1>
        <p className="text-lg mb-6">Welcome to my React portfolio with a p5.js game background!</p>
        <button className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-700">Explore</button>
      </div>
    </div>
  );
}

export default App;