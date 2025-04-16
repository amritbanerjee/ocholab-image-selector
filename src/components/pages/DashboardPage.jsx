import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
// Assuming you have an icon library like react-icons
import { FiHome, FiClock, FiCalendar, FiSettings, FiGrid, FiBarChart2, FiUsers, FiBell, FiPlus, FiMoreHorizontal, FiArrowLeft, FiArrowRight, FiTrendingDown, FiTrendingUp, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { FaPaypal, FaCcVisa, FaGoogle, FaApple, FaCcMastercard } from 'react-icons/fa';

// Updated Sidebar with icons and styling closer to the image
const Sidebar = () => (
  <aside className="flex flex-col items-center bg-[#1a1d21] text-gray-400 w-20 py-6 space-y-6 min-h-screen shadow-lg">
    <div className="mb-8">
      {/* Placeholder Logo */}
      <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#3b82f6"/><path d="M7 8h10M7 12h10M7 16h6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
    </div>
    <nav className="flex flex-col items-center space-y-6 flex-1">
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

// Updated Navbar - Separated Header and Navigation
const Header = ({ userName }) => (
  <header className="flex items-center justify-between bg-[#1f2328] text-white px-8 py-4 shadow-md border-b border-gray-700">
    <div>
      <h1 className="text-xl font-semibold text-white">Hey there, {userName || 'User'}!</h1>
      <p className="text-sm text-gray-400">Welcome back, we're happy to have you here!</p>
    </div>
    <div className="flex items-center space-x-2">
      <button className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">Edit section</button>
      <button className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">Add item</button>
      <button className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"><FiMoreHorizontal size={20} /></button>
    </div>
  </header>
);

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

// Helper to format currency
const formatCurrency = (amount) => {
  return `$${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Updated Stat Card component
const StatCard = ({ title, value, change, changeType, icon }) => (
  <Card className="bg-[#1f2328] border border-gray-700 text-white shadow-md rounded-lg overflow-hidden">
    <CardContent className="p-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
         <div className="p-2 bg-blue-600/20 text-blue-500 rounded-lg">
           {icon}
         </div>
         <div>
           <p className="text-3xl font-bold">{value}</p>
           <p className="text-sm text-gray-400">{title}</p>
         </div>
      </div>
      {change && (
        <span className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${changeType === 'loss' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
          {changeType === 'loss' ? <FiTrendingDown className="mr-1" /> : <FiTrendingUp className="mr-1" />}
          {change}
        </span>
      )}
    </CardContent>
  </Card>
);

// Mock data for Lookscout and Achievements
const lookscoutMembers = [
  { id: 1, img: 'https://randomuser.me/api/portraits/women/65.jpg' },
  { id: 2, img: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { id: 3, img: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { id: 4, img: 'https://randomuser.me/api/portraits/men/75.jpg' },
  { id: 5, img: 'https://randomuser.me/api/portraits/women/12.jpg' },
  { id: 6, img: 'https://randomuser.me/api/portraits/men/5.jpg' },
];

const achievements = [
  { id: 1, icon: <FiGrid size={20} className="text-red-500"/>, title: 'Global Stars', description: 'A brief feature description' },
  { id: 2, icon: <FiCheckCircle size={20} className="text-green-500"/>, title: 'Focus Keeper', description: 'A brief feature description' },
  { id: 3, icon: <FiXCircle size={20} className="text-blue-500"/>, title: 'High Tower', description: 'A brief feature description' },
];

// Circular progress gauge component (simplified)
const ProgressGauge = ({ percentage, label = "My Stats" }) => {
  const radius = 50;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-32 h-32 mx-auto my-4">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        <circle
          stroke="#374151" // gray-700
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="#3b82f6" // blue-500
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{percentage}%</span>
        <span className="text-xs text-gray-400">{label}</span>
      </div>
    </div>
  );
};

// Payment Icon Helper
const getPaymentIcon = (account) => {
  if (!account) return null;
  const lowerCaseAccount = account.toLowerCase();
  if (lowerCaseAccount.includes('visa')) return <FaCcVisa className="text-blue-500" size={20} />;
  if (lowerCaseAccount.includes('google pay')) return <FaGoogle className="text-gray-400" size={20} />;
  if (lowerCaseAccount.includes('paypal')) return <FaPaypal className="text-blue-400" size={20} />;
  if (lowerCaseAccount.includes('maestro')) return <FaCcMastercard className="text-orange-500" size={20} />; // Using Mastercard as proxy
  if (lowerCaseAccount.includes('apple pay')) return <FaApple className="text-gray-300" size={20} />;
  if (lowerCaseAccount.includes('mastercard')) return <FaCcMastercard className="text-orange-500" size={20} />;
  return null;
};

const DashboardPage = ({ supabase, session }) => {
  const [stats, setStats] = useState({
    totalDecks: 0, // Renamed from totalExpenses1
    totalCards: 0, // Renamed from totalExpenses2
    cardsForReview: 0, // Renamed from totalExpenses3
    reviewProgress: 0, // Added for progress gauge
  });
  const [transactions, setTransactions] = useState([]); // Will be populated by Supabase
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7; // Match image
  const userName = session?.user?.user_metadata?.full_name || session?.user?.email;

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch stats (similar to Home.jsx)
        const { count: decksCount, error: decksError } = await supabase
          .from('decks')
          .select('id', { count: 'exact', head: true });
        if (decksError) throw decksError;

        const { count: cardsCount, error: cardsError } = await supabase
          .from('cards')
          .select('id', { count: 'exact', head: true });
        if (cardsError) throw cardsError;

        const { count: reviewCount, error: reviewError } = await supabase
          .from('cards')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'choosebaseimage');
        if (reviewError) throw reviewError;

        // Fetch mock transactions (replace with actual Supabase query if needed)
        // For now, using the previous mock data structure but fetched async
        const mockTransactions = [
          { id: 1, name: 'Grand Rapids', amount: 6320.53, date: 'Wed 1:00 pm', account: 'Visa 1234', expire: '24/2032', avatar: 'https://randomuser.me/api/portraits/men/75.jpg' },
          { id: 2, name: 'Bell Gardens', amount: 6471.39, date: 'Wed 1:00 pm', account: 'Google Pay 1234', expire: '24/2032', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
          { id: 3, name: 'Broomfield', amount: -2223.9, date: 'Wed 7:20 pm', account: 'PayPal 1234', expire: '24/2032', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
          { id: 4, name: 'Yakima', amount: 7344.50, date: 'Wed 1:00 pm', account: 'Maestro 1234', expire: '24/2032', avatar: 'https://randomuser.me/api/portraits/men/5.jpg' },
          { id: 5, name: 'Springfield', amount: -6157.14, date: 'Wed 7:20 pm', account: 'Apple Pay 1234', expire: '24/2032', avatar: 'https://randomuser.me/api/portraits/women/65.jpg' },
          { id: 6, name: 'Alexandria', amount: -6780.52, date: 'Wed 1:00 pm', account: 'Mastercard 1234', expire: '24/2032', avatar: 'https://randomuser.me/api/portraits/women/12.jpg' },
          { id: 7, name: 'Kalamazoo', amount: -2263.72, date: 'Wed 7:20 pm', account: 'Visa 1234', expire: '24/2032', avatar: 'https://randomuser.me/api/portraits/women/33.jpg' },
          { id: 8, name: 'Transaction 8', amount: 100.00, date: 'Thu 9:00 am', account: 'Visa 5678', expire: '12/2025', avatar: 'https://randomuser.me/api/portraits/men/11.jpg' },
          { id: 9, name: 'Transaction 9', amount: -50.25, date: 'Thu 10:30 am', account: 'PayPal 5678', expire: '12/2025', avatar: 'https://randomuser.me/api/portraits/women/22.jpg' },
          { id: 10, name: 'Transaction 10', amount: 250.75, date: 'Thu 1:15 pm', account: 'Mastercard 5678', expire: '12/2025', avatar: 'https://randomuser.me/api/portraits/men/33.jpg' },
        ];
        setTransactions(mockTransactions);

        // Calculate review progress (example: percentage of cards reviewed)
        // This needs a proper calculation based on your data model
        const totalReviewed = cardsCount - reviewCount; // Example calculation
        const reviewProgress = cardsCount > 0 ? Math.round((totalReviewed / cardsCount) * 100) : 0;

        setStats({
          totalDecks: decksCount || 0,
          totalCards: cardsCount || 0,
          cardsForReview: reviewCount || 0,
          reviewProgress: reviewProgress,
        });

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    if (supabase && session) {
      fetchData();
    }
  }, [supabase, session]);

  // Pagination logic for transactions
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const paginatedTransactions = transactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex h-screen bg-[#16181c] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <Header userName={userName} />
        <NavigationTabs />
        {/* Main content area */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Top 3 summary cards - Updated with Supabase data */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard title="Total Decks" value={stats.totalDecks} icon={<FiGrid size={20} />} />
            <StatCard title="Total Cards" value={stats.totalCards} icon={<FiBarChart2 size={20} />} />
            <StatCard title="Cards for Review" value={stats.cardsForReview} icon={<FiClock size={20} />} />
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-1 space-y-6">
              {/* Lookscout Card */}
              <Card className="bg-[#1f2328] border border-gray-700 text-white shadow-md rounded-lg p-4">
                <CardHeader className="p-0 mb-3">
                  <CardTitle className="text-lg font-semibold">Lookscout</CardTitle>
                  <p className="text-sm text-gray-400">We make you create, not to be worried about technical stuff.</p>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="flex -space-x-2 mb-4">
                    {lookscoutMembers.map(member => (
                      <img key={member.id} src={member.img} alt="Member" className="w-8 h-8 rounded-full border-2 border-[#1f2328]" />
                    ))}
                  </div>
                  <button className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">View all</button>
                </CardContent>
              </Card>

              {/* Achievements Card */}
              <Card className="bg-[#1f2328] border border-gray-700 text-white shadow-md rounded-lg p-4">
                <CardHeader className="flex flex-row items-center justify-between p-0 mb-3">
                  <CardTitle className="text-lg font-semibold">Achievements</CardTitle>
                  <button className="text-gray-400 hover:text-white"><FiMoreHorizontal size={20} /></button>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="text-sm text-gray-400 mb-2">Review Progress</p> {/* Updated label */}
                  <ProgressGauge percentage={stats.reviewProgress} label="Reviewed" /> {/* Use dynamic percentage */}
                  <ul className="space-y-3 mt-4">
                    {achievements.map(ach => (
                      <li key={ach.id} className="flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <div className="p-1.5 bg-gray-700/50 rounded-md">{ach.icon}</div>
                          <div>
                            <p className="text-sm font-medium text-white">{ach.title}</p>
                            <p className="text-xs text-gray-400">{ach.description}</p>
                          </div>
                        </div>
                        <FiArrowRight size={16} className="text-gray-600 group-hover:text-white transition-colors" />
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Right Column (Transactions) */}
            <div className="lg:col-span-2">
              <Card className="bg-[#1f2328] border border-gray-700 text-white shadow-md rounded-lg h-full flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-gray-700">
                  <div className="flex items-center space-x-2">
                     <div className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center">
                       <FiSettings size={14} className="text-gray-400"/>
                     </div>
                     <span className="text-sm text-gray-400">We protect your personal information.</span>
                     <a href="#" className="text-sm text-blue-500 hover:underline">Privacy Policy</a>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="text-gray-400 hover:text-white"><FiPlus size={20} /></button>
                  </div>
                </CardHeader>
                <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-gray-700">
                  <CardTitle className="text-lg font-semibold">Transactions</CardTitle>
                  <button className="text-gray-400 hover:text-white"><FiMoreHorizontal size={20} /></button>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                  {loading ? (
                    <div className="flex items-center justify-center flex-1">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500"></div>
                    </div>
                  ) : error ? (
                    <div className="p-4 text-sm text-red-500 bg-red-900/50 rounded-lg m-4" role="alert">
                      Error loading data: {error}
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto">
                      <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-400 uppercase bg-[#16181c]">
                          <tr>
                            <th scope="col" className="px-4 py-3 w-2/5">Name</th>
                            <th scope="col" className="px-4 py-3 w-1/5 text-right">Amount</th>
                            <th scope="col" className="px-4 py-3 w-1/5">Date</th>
                            <th scope="col" className="px-4 py-3 w-1/5">Account</th>
                            <th scope="col" className="px-4 py-3 w-auto"></th> {/* For arrow */} 
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedTransactions.length === 0 && (
                            <tr className="bg-[#1f2328]">
                              <td colSpan={5} className="text-center py-6 text-gray-500">No transactions available</td>
                            </tr>
                          )}
                          {paginatedTransactions.map((tx) => (
                            <tr key={tx.id} className="bg-[#1f2328] border-b border-gray-700 hover:bg-gray-700/30 group cursor-pointer">
                              <td className="px-4 py-3 flex items-center space-x-3">
                                <img src={tx.avatar} alt={tx.name} className="w-8 h-8 rounded-full" />
                                <span className="font-medium text-white whitespace-nowrap">{tx.name}</span>
                              </td>
                              <td className={`px-4 py-3 font-medium whitespace-nowrap text-right ${tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">{tx.date}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center space-x-2">
                                  {getPaymentIcon(tx.account)}
                                  <div>
                                    <span className="text-white font-medium block text-xs">{tx.account || 'N/A'}</span>
                                    <span className="text-gray-500 block text-xs">Expire {tx.expire || 'N/A'}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <FiArrowRight size={16} className="text-gray-600 group-hover:text-white transition-colors" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {/* Pagination Controls - Updated Style */} 
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t border-gray-700 bg-[#16181c]">
                      <button
                        className={`flex items-center text-sm font-medium text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        aria-label="Previous Page"
                      >
                        <FiArrowLeft className="mr-2" size={16}/>
                        <span>Prev</span>
                      </button>
                      <span className="text-sm text-gray-400">
                        Page {currentPage} to {totalPages} {/* Corrected text based on image */}
                      </span>
                      <button
                        className={`flex items-center text-sm font-medium text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        aria-label="Next Page"
                      >
                        <span>Next</span>
                        <FiArrowRight className="ml-2" size={16}/>
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;