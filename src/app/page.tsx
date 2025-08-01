'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function HomePage() {
  const [showDashboard] = useState(false);

  const oauthSignIn = () => {
    window.location.href = "/api/auth/login";
  };

  return (
    <div className="landing-page">
      {/* Landing Page */}
      {!showDashboard && (
        <div className="min-h-screen flex flex-col" id="landing-page">
          <header className="bg-white shadow-sm">
            <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
              <div className="flex items-center">
                <Image
                  alt="CarpoDoEm Logo"
                  className="h-8 w-8 mr-2"
                  src="/images/taskable_icon.png"
                  width={32}
                  height={32}
                />
                <h1 className="text-2xl font-bold text-accent">Taskable</h1>
              </div>
              <div>
                {/* <button 
                  className="text-gray-600 hover:text-primary font-medium px-4 py-2 rounded-md"
                  onClick={oauthSignIn}
                >
                  Log In
                </button> */}
                <button 
                  className="bg-primary text-white font-medium px-4 py-2 rounded-md hover-bg-primary-darker transition duration-300"
                  onClick={oauthSignIn}
                >
                  Sign Up / Log In
                </button>
              </div>
            </nav>
          </header>

          <main className="flex-grow flex items-center justify-center">
            <div className="text-center">
              <Image
                alt="Taskable Main Logo"
                className="h-30 w-100 mx-auto mb-16"
                src="/images/taskable_logo_wide_no_bknd.png"
                width={10000}
                height={10000}
              />
              <h1 className="text-5xl font-bold mb-4 text-accent">Strike that sh*t off.</h1>
              <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
                Take a realistic approach at managing lists you would normally write down.
              </p>
              
              <div className="flex justify-center space-x-8">
                <div className="text-center p-6 bg-white rounded-lg shadow-md w-64">
                  <span className="material-icons text-4xl text-primary mb-4">📖</span>
                  <h3 className="text-xl font-semibold mb-2 text-accent">Multiple Lists</h3>
                  <p className="text-gray-500">
                    Keep multiple lists, version them, and keep your brain free from clutter.
                  </p>
                </div>
                
                <div className="text-center p-6 bg-white rounded-lg shadow-md w-64">
                  <span className="material-icons text-4xl text-secondary mb-4">🔎</span>
                  <h3 className="text-xl font-semibold mb-2 text-accent">Clear & Review</h3>
                  <p className="text-gray-500">
                    Check your tasks off, roll them over, and keep track of your to-do-progress.
                  </p>
                </div>
                
                <div className="text-center p-6 bg-white rounded-lg shadow-md w-64">
                  <span className="material-icons text-4xl text-yellow-500 mb-4">📝</span>
                  <h3 className="text-xl font-semibold mb-2 text-accent">Add Reminders</h3>
                  <p className="text-gray-500">
                    Set reminders, mark deadlines, and stay on top of your daily activities.
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}