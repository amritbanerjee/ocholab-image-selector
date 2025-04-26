import React from 'react';
import { Link } from 'react-router-dom'; // Import Link
// Import FiHome, FiList, and other necessary icons
import { FiGrid, FiBarChart2, FiCalendar, FiClock, FiSettings, FiHome, FiList, FiImage } from 'react-icons/fi';

const Sidebar = () => (
  <aside className="flex flex-col items-center bg-[#1a1d21] text-gray-400 w-20 py-6 space-y-6 min-h-screen shadow-lg">
    <div className="mb-8">
      {/* Placeholder Logo */}
      <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#3b82f6"/><path d="M7 8h10M7 12h10M7 16h6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
    </div>
    <nav className="flex flex-col items-center space-y-6 flex-1">
      {/* Link to Home Page */}
      <Link to="/" className="p-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors" title="Home">
        <FiHome size={24} />
      </Link>
      {/* Link to Deck List Page */}
      <Link to="/decks" className="p-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors" title="Decks">
        <FiList size={24} />
      </Link>
      <Link to="/deck/images" className="p-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors" title="Image Selector">
        <FiImage size={24} />
      </Link>
      {/* Keep other icons as buttons or convert to Links if needed */}
      <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"><FiGrid size={24} /></button>
      <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"><FiBarChart2 size={24} /></button>
      <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"><FiCalendar size={24} /></button>
      <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"><FiClock size={24} /></button>
      {/* Add more icons as needed based on image */}
    </nav>
    <div className="mt-auto flex flex-col items-center space-y-6">
       <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"><FiSettings size={24} /></button>
      <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="User" className="w-10 h-10 rounded-full border-2 border-gray-600 shadow-md" />
    </div>
  </aside>
);

export default Sidebar;