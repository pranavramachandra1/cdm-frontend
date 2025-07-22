'use client';
import React, { useState } from 'react';

export default function Button() {
  const [title, setTitle] = useState('Click me');
  
  const handleClick = () => {
    setTitle('Button clicked');
  };

  return (
    <button 
    onClick={handleClick}
    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    >
      {title}
    </button>
  );
}