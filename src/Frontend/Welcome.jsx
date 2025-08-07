import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const WelcomeAnimation = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Animation sequence
    const timer1 = setTimeout(() => setShowContent(true), 500);
    const timer2 = setTimeout(() => setStep(1), 1500);
    const timer3 = setTimeout(() => setStep(2), 2500);
    const timer4 = setTimeout(() => setStep(3), 3500);
    const timer5 = setTimeout(() => navigate('/home'), 4500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [navigate]);

  return (
    <div className="relative h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
      {/* Animated background elements */}
      <div className={`absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-blue-200 opacity-70 blur-xl transition-all duration-1000 ${step >= 1 ? 'scale-150' : ''}`}></div>
      <div className={`absolute bottom-1/3 right-1/4 w-40 h-40 rounded-full bg-indigo-200 opacity-70 blur-xl transition-all duration-1000 ${step >= 2 ? 'scale-125 translate-y-20' : ''}`}></div>
      <div className={`absolute top-1/3 right-1/3 w-24 h-24 rounded-full bg-blue-300 opacity-60 blur-xl transition-all duration-1000 ${step >= 1 ? 'scale-110 translate-x-20' : ''}`}></div>

      {/* Main content */}
      <div className={`relative z-10 h-full flex flex-col items-center justify-center transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
        {/* Logo with animation */}
        <div className={`relative mb-8 transition-all duration-700 ${step >= 1 ? 'scale-110' : ''}`}>
          <div className={`w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 ${step >= 2 ? 'rotate-12' : ''}`}>
            <svg
              className={`w-12 h-12 text-white transition-all duration-700 ${step >= 1 ? 'scale-125' : 'scale-90'}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <path d="M12 22V12"></path>
              <path d="M9 8.3l6 3.4"></path>
              <path d="M15 8.3l-6 3.4"></path>
            </svg>
          </div>
          <div className={`absolute -inset-2 border-2 border-blue-300 rounded-2xl opacity-0 ${step >= 3 ? 'animate-ping opacity-70' : ''}`}></div>
        </div>

        {/* App title with animation */}
        <h1 className={`text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2 transition-all duration-700 ${step >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          CVCraft
        </h1>
        <p className={`text-gray-600 mb-8 transition-all duration-700 ${step >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          Craft your perfect resume with AI
        </p>

        {/* Loading indicator */}
        <div className="w-64 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-1000 ease-out`}
            style={{ width: `${step * 33.33}%` }}
          ></div>
        </div>

        {/* Continue button that appears at the end */}
        <button 
          className={`mt-8 px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full shadow-md transition-all duration-500 ${step >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          onClick={() => navigate('/home')}
        >
          Get Started
        </button>
      </div>

      {/* Copyright text at bottom */}
      <div className={`absolute bottom-4 left-0 right-0 text-center text-gray-400 text-sm transition-opacity duration-1000 ${step >= 2 ? 'opacity-100' : 'opacity-0'}`}>
        © {new Date().getFullYear()} CVCraft. All rights reserved.
      </div>
    </div>
  );
};

export default WelcomeAnimation;