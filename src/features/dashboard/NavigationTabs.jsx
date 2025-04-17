import React from 'react';

const NavigationTabs = () => (
  <nav className="flex space-x-6 px-8 py-3 bg-[#1f2328] border-b border-gray-700 shadow-sm">
    <a href="#" className="text-gray-400 hover:text-white transition-colors">My Tasks</a>
    <a href="#" className="text-white font-semibold border-b-2 border-blue-500 pb-1">Profile</a>
    <a href="#" className="text-gray-400 hover:text-white transition-colors">Stats</a>
    <a href="#" className="text-gray-400 hover:text-white transition-colors">Inbox</a>
    <a href="#" className="text-gray-400 hover:text-white transition-colors">Team</a>
    <a href="#" className="relative text-gray-400 hover:text-white transition-colors">
      Notifications
      <span className="absolute -top-1 -right-3 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">9</span>
    </a>
    <a href="#" className="text-gray-400 hover:text-white transition-colors">Settings</a>
  </nav>
);

export default NavigationTabs;