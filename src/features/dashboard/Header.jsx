import React from 'react';
import { FiLogOut, FiMoreHorizontal } from 'react-icons/fi';

const Header = ({ userName, handleLogout }) => (
  <header className="flex items-center justify-between bg-[#1f2328] text-white px-8 py-4 shadow-md border-b border-gray-700">
    <div>
      <h1 className="text-xl font-semibold text-white">Hey there, {userName || 'User'}!</h1>
      <p className="text-sm text-gray-400">Welcome back, we're happy to have you here!</p>
    </div>
    <div className="flex items-center space-x-4"> {/* Adjusted spacing */} 
      {/* Removed Edit section button */}
      <button 
        onClick={handleLogout} 
        className="flex items-center bg-red-600 hover:bg-red-500 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
      >
        <FiLogOut className="mr-2" size={16} /> {/* Added icon */}
        Log out
      </button>
      <button className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"><FiMoreHorizontal size={20} /></button>
    </div>
  </header>
);

export default Header;