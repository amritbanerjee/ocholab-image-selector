import React from 'react';
import { FiHome, FiPieChart, FiUsers, FiCreditCard, FiLayers, FiBell, FiSettings } from 'react-icons/fi';

const NavigationTabs = () => (
  <>
    {/* Desktop Navigation */}
    <nav className="hidden md:flex space-x-6 px-8 py-3 bg-[#1f2328] border-b border-gray-700 shadow-sm">
      <a href="#" className="text-white font-semibold border-b-2 border-blue-500 pb-1">Content Dashboard</a>
      <a href="#" className="text-gray-400 hover:text-white transition-colors">Sales Dashboard</a>
      <a href="#" className="text-gray-400 hover:text-white transition-colors">Users</a>
      <a href="#" className="text-gray-400 hover:text-white transition-colors">Subscriptions</a>
      <a href="#" className="text-gray-400 hover:text-white transition-colors">Payments</a>
      <a href="#" className="text-gray-400 hover:text-white transition-colors">Decks</a>
      <a href="#" className="relative text-gray-400 hover:text-white transition-colors">
        Notifications
        <span className="absolute -top-1 -right-3 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">9</span>
      </a>
      <a href="#" className="text-gray-400 hover:text-white transition-colors">Settings</a>
    </nav>
    
    {/* Mobile Bottom Navigation */}
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1f2328] border-t border-gray-700 flex justify-around items-center py-2">
      <a href="#" className="flex flex-col items-center text-blue-500 text-xs">
        <FiHome size={20} />
        <span>Home</span>
      </a>
      <a href="#" className="flex flex-col items-center text-gray-400 hover:text-white text-xs">
        <FiPieChart size={20} />
        <span>Sales</span>
      </a>
      <a href="#" className="flex flex-col items-center text-gray-400 hover:text-white text-xs">
        <FiUsers size={20} />
        <span>Users</span>
      </a>
      <a href="#" className="relative flex flex-col items-center text-gray-400 hover:text-white text-xs">
        <FiBell size={20} />
        <span>Alerts</span>
        <span className="absolute top-0 right-4 bg-red-500 text-white text-xs rounded-full px-1">9</span>
      </a>
      <a href="#" className="flex flex-col items-center text-gray-400 hover:text-white text-xs">
        <FiSettings size={20} />
        <span>Settings</span>
      </a>
    </nav>
  </>
);

export default NavigationTabs;