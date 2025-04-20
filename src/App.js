import React from 'react';
import './App.css';
import GameBackground from './GameBackground';

function App() {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <GameBackground />
      <div className="absolute inset-0 z-10 flex flex-col items-start justify-center text-white p-12">
        <div className="max-w-xl">
          <h1 className="text-6xl font-bold mb-8">Hello, I'm<br />John Doe</h1>
          <p className="text-3xl mb-12">I'm a software developer</p>
          <button className="px-8 py-4 bg-gray-800 text-white text-xl rounded-md hover:bg-gray-700 transition-colors border border-gray-700">
            View Projects
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;