import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar'; // Updated path
import Header from './Header'; // Updated path
import NavigationTabs from './NavigationTabs'; // Import NavigationTabs
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const MainLayout = ({ session, supabase }) => { // Accept session and supabase as props
  const navigate = useNavigate();
  const userName = session?.user?.user_metadata?.full_name || session?.user?.email;

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
      <Sidebar />
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