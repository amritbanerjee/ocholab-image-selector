import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar'; // Updated path
import Header from './Header'; // Updated path
import NavigationTabs from './NavigationTabs'; // Import NavigationTabs
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { FiMenu } from 'react-icons/fi'; // Import hamburger menu icon

const MainLayout = ({ session, supabase }) => { // Accept session and supabase as props
  const navigate = useNavigate();
  const userName = session?.user?.user_metadata?.full_name || session?.user?.email;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Logout handler
  const handleLogout = async () => {
    if (!supabase) {
      console.error('Supabase client is not available');
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
    } else {
      navigate('/login'); // Redirect to login page after logout
    }
  };

  return (
    <div className="flex h-screen bg-[#121417]">
      {/* Mobile menu button */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <FiMenu size={24} />
      </button>
      
      {/* Sidebar with responsive classes */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 z-40 w-20 transition-transform duration-200 ease-in-out`}>
        <Sidebar />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Render NavigationTabs */}
        <NavigationTabs />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#121417] p-6">
          <Outlet /> {/* Child routes will render here */}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;