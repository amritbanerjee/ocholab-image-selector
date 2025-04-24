import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'; // Updated path
// Assuming you have an icon library like react-icons
import { FiHome, FiClock, FiCalendar, FiSettings, FiGrid, FiBarChart2, FiUsers, FiBell, FiPlus, FiMoreHorizontal, FiArrowLeft, FiArrowRight, FiTrendingDown, FiTrendingUp, FiCheckCircle, FiXCircle, FiLogOut } from 'react-icons/fi'; // Added FiLogOut
import { FaPaypal, FaCcVisa, FaGoogle, FaApple, FaCcMastercard } from 'react-icons/fa';
import { format } from 'date-fns'; // Import date-fns for formatting
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'; // Import BarChart components
// import Sidebar from '../features/dashboard/Sidebar'; // Removed import
// import Header from '../features/dashboard/Header'; // Removed import
// import NavigationTabs from '../../../components/layout/NavigationTabs'; // Removed, now in MainLayout
import StatCard from '../components/StatCard'; // Updated path
import SimplePieChart from '../components/SimplePieChart'; // Updated path







// Helper to format currency
const formatCurrency = (amount) => {
  return `$${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};



// Mock data for Lookscout and Achievements
const lookscoutMembers = [
  { id: 1, img: 'https://randomuser.me/api/portraits/women/65.jpg' },
  { id: 2, img: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { id: 3, img: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { id: 4, img: 'https://randomuser.me/api/portraits/men/75.jpg' },
  { id: 5, img: 'https://randomuser.me/api/portraits/women/12.jpg' },
  { id: 6, img: 'https://randomuser.me/api/portraits/men/5.jpg' },
];

// Removed static achievements data, will use chart instead
// const achievements = [
//   { id: 1, icon: <FiGrid size={20} className="text-red-500"/>, title: 'Global Stars', description: 'A brief feature description' },
//   { id: 2, icon: <FiCheckCircle size={20} className="text-green-500"/>, title: 'Focus Keeper', description: 'A brief feature description' },
//   { id: 3, icon: <FiXCircle size={20} className="text-blue-500"/>, title: 'High Tower', description: 'A brief feature description' },
// ];

// Remove the old ProgressGauge component
// const ProgressGauge = ({ percentage, label = "My Stats" }) => {
//   const radius = 50;
//   const stroke = 10;
//   const normalizedRadius = radius - stroke / 2;
//   const circumference = normalizedRadius * 2 * Math.PI;
//   const strokeDashoffset = circumference - (percentage / 100) * circumference;
//
//   return (
//     <div className="relative flex items-center justify-center w-32 h-32 mx-auto my-4">
//       <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
//         <circle
//           stroke="#374151" // gray-700
//           fill="transparent"
//           strokeWidth={stroke}
//           r={normalizedRadius}
//           cx={radius}
//           cy={radius}
//         />
//         <circle
//           stroke="#3b82f6" // blue-500
//           fill="transparent"
//           strokeWidth={stroke}
//           strokeDasharray={circumference + ' ' + circumference}
//           style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
//           strokeLinecap="round"
//           r={normalizedRadius}
//           cx={radius}
//           cy={radius}
//         />
//       </svg>
//       <div className="absolute flex flex-col items-center justify-center">
//         <span className="text-3xl font-bold text-white">{percentage}%</span>
//         <span className="text-xs text-gray-400">{label}</span>
//       </div>
//     </div>
//   );
// };

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

const HomePage = ({ supabase, session }) => {
  const [stats, setStats] = useState({
    totalDecks: 0,
    totalCards: 0,
    cardsForReview: 0,
    reviewProgress: 0, // Percentage of cards reviewed
  });
  // const [transactions, setTransactions] = useState([]); // Will be populated by Supabase - Replaced
  const [reviewDecks, setReviewDecks] = useState([]); // State for decks needing review
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7; // Match image
  const userName = session?.user?.user_metadata?.full_name || session?.user?.email;

  // Logout handler
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
    } else {
      navigate('/'); // Redirect to login page after logout
    }
  };

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // --- Fetch Stats (Keep existing logic) ---
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

        // Calculate review progress
        const totalReviewed = cardsCount - reviewCount;
        const reviewProgress = cardsCount > 0 ? Math.round((totalReviewed / cardsCount) * 100) : 0;

        setStats({
          totalDecks: decksCount || 0,
          totalCards: cardsCount || 0,
          cardsForReview: reviewCount || 0,
          reviewProgress: reviewProgress,
        });

        // --- Fetch Decks for Review (New Logic) ---
        // 1. Get cards needing review with deck info
        const { data: cardsForReviewData, error: cardsForReviewError } = await supabase
          .from('cards')
          .select(`
            deck_id,
            decks!deck_id(
              id,
              title_key,
              description_key,
              created_at
            )
          `)
          .eq('status', 'choosebaseimage');

        if (cardsForReviewError) throw cardsForReviewError;

        if (!cardsForReviewData || cardsForReviewData.length === 0) {
          setReviewDecks([]); // No decks need review
          setLoading(false);
          return;
        }

        // 2. Extract unique title_keys and deck details
        const deckMap = new Map();
        cardsForReviewData.forEach(card => {
          const deckId = card.deck_id;
          if (!deckMap.has(deckId)) {
            deckMap.set(deckId, {
              id: deckId,
              title_key: card.decks.title_key,
              description_key: card.decks.description_key, // Store description key
              created_at: card.decks.created_at,
              review_count: 0,
              // Add a mock avatar for now
              avatar: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 99)}.jpg`
            });
          }
          deckMap.get(deckId).review_count += 1;
        });

        const allKeys = Array.from(deckMap.values()).flatMap(deck => [deck.title_key, deck.description_key]).filter(Boolean);
        const sanitizedKeys = [...new Set(allKeys)].map(key => encodeURIComponent(key)); // Get unique keys

        // 3. Fetch translations for both title and description
        let translationMap = {};
        if (sanitizedKeys.length > 0) {
          const { data: translations, error: translationsError } = await supabase
            .from('translations_en')
            .select('key, value')
            .in('key', sanitizedKeys);

          if (translationsError) {
            console.warn('Failed to fetch translations:', translationsError.message);
            // Proceed without translations if fetch fails
          } else {
            translationMap = translations.reduce((acc, item) => {
              acc[decodeURIComponent(item.key)] = item.value;
              return acc;
            }, {});
          }
        }

        // 4. Combine data into final reviewDecks array
        const finalReviewDecks = Array.from(deckMap.values()).map(deck => ({
          ...deck,
          title: translationMap[deck.title_key] || `Deck ${deck.id}`, // Fallback title
          description: translationMap[deck.description_key] || '' // Add description, fallback to empty string
        }));

        setReviewDecks(finalReviewDecks);

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

  // Pagination logic for review decks
  const totalPages = Math.ceil(reviewDecks.length / itemsPerPage);
  const paginatedDecks = reviewDecks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Handle deck click (navigate to image selection)
  const handleDeckClick = (deckId, deckTitle, deckDescription) => {
    navigate(`/deck/${deckId}/images`, { state: { deckName: deckTitle, deckDescription: deckDescription } });
  };

  // Prepare data for the Pie chart
  const reviewChartData = useMemo(() => {
    const reviewed = stats.reviewProgress;
    const notReviewed = 100 - reviewed;
    return [
      { name: 'Reviewed', value: reviewed, fill: '#10b981' }, // emerald-500 (more vibrant green)
      { name: 'Needs Review', value: notReviewed, fill: '#0ea5e9' }, // sky-500 (brighter blue)
     ];
   }, [stats.reviewProgress]);

  return (
    // Removed outer flex container and Sidebar, handled by MainLayout
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header is now handled by MainLayout or potentially removed/reintegrated */}
      {/* <Header userName={userName} handleLogout={handleLogout} /> */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#121417] p-6">
        {/* Navigation Tabs - Removed, now in MainLayout */}
        {/* <NavigationTabs /> */}
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
                  <CardTitle className="text-lg font-semibold">Topic researcher</CardTitle>
                  <p className="text-sm text-gray-400">We make you create, not to be worried about technical stuff.</p>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="flex -space-x-2 mb-4">
                    {lookscoutMembers.map(member => (
                      <img key={member.id} src={member.img} alt="Member" className="w-8 h-8 rounded-full border-2 border-[#1f2328]" />
                    ))}
                  </div>
                  <button className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">Create Deck</button>
                </CardContent>
              </Card>

              {/* Achievements Card - Replaced with Multiple Charts */}
              <Card className="bg-[#1f2328] border border-gray-700 text-white shadow-md rounded-lg p-4">
                <CardHeader className="flex flex-row items-center justify-between p-0 mb-3">
                  <CardTitle className="text-lg font-semibold">Overview Stats</CardTitle>
                  <button className="text-gray-400 hover:text-white"><FiMoreHorizontal size={20} /></button>
                </CardHeader>
                <CardContent className="p-0 flex justify-around items-start space-x-2"> {/* Use flex to arrange charts */} 
                  {/* Review Progress Chart */}
                  <SimplePieChart
                    data={reviewChartData}
                    title="Review Progress"
                    centerText={`${stats.reviewProgress}%`}
                    centerLabel="Reviewed"
                  />
                  {/* Live Decks Chart (Mock) */}
                  <SimplePieChart
                    data={mockLiveDecksData}
                    title="Live Decks"
                    centerText={`${mockLiveDecksData.find(d => d.name === 'Active')?.value || 0}`}
                    centerLabel="Active"
                  />
                  {/* Processing Status Chart (Mock) */}
                  <SimplePieChart
                    data={mockProcessingData}
                    title="Card Processing"
                    centerText={`${mockProcessingData.find(d => d.name === 'Processed')?.value || 0}`}
                    centerLabel="Processed"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column (Decks for Review) */}
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
                   <CardTitle className="text-lg font-semibold">Decks ready for Review</CardTitle> {/* Renamed Title */}
                   <button className="text-gray-400 hover:text-white"><FiMoreHorizontal size={20} /></button>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                  {loading ? (
                    <div className="flex items-center justify-center flex-1">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500"></div>
                    </div>
                  ) : error ? (
                    <div className="p-4 text-sm text-red-500 bg-red-900/50 rounded-lg m-4" role="alert">
                      Error loading decks: {error}
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto">
                      <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-400 uppercase bg-[#16181c]">
                           <tr>
                             <th scope="col" className="px-4 py-3 w-1/4">Deck Name</th> {/* Adjusted width */}
                             <th scope="col" className="px-4 py-3 w-1/3">Description</th> {/* Added Description Header */}
                             <th scope="col" className="px-4 py-3 w-1/6 text-center">Cards to Review</th> {/* Adjusted width */}
                             <th scope="col" className="px-4 py-3 w-1/6">Created Date</th> {/* Adjusted width */}
                             <th scope="col" className="px-4 py-3 w-auto text-right"></th> {/* For arrow */}
                           </tr>
                         </thead>
                         <tbody>
                           {paginatedDecks.length === 0 && (
                             <tr className="bg-[#1f2328]">
                               <td colSpan={5} className="text-center py-6 text-gray-500">No decks available for review</td> {/* Updated colspan to 5 */}
                             </tr>
                           )}
                           {paginatedDecks.map((deck) => (
                             <tr
                               key={deck.id}
                               className="border-b border-gray-700 hover:bg-[#2a2e34] cursor-pointer"
                               onClick={() => handleDeckClick(deck.id, deck.title, deck.description)}
                             >
                               <td className="px-4 py-3 font-medium text-white whitespace-nowrap flex items-center space-x-2">
                                 <img src={deck.avatar} alt="Deck Avatar" className="w-6 h-6 rounded-full" />
                                 <span>{deck.title}</span>
                               </td>
                               <td className="px-4 py-3 truncate max-w-xs" title={deck.description}>{deck.description || '-'}</td> {/* Truncate and add title attribute */}
                               <td className="px-4 py-3 text-center">{deck.review_count}</td>
                               <td className="px-4 py-3">{format(new Date(deck.created_at), 'MMM d, yyyy')}</td>
                               <td className="px-4 py-3 text-right">
                                 <FiArrowRight size={16} className="text-gray-600 group-hover:text-white transition-colors inline-block" />
                               </td>
                             </tr>
                           ))}
                         </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center p-4 border-t border-gray-700">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="flex items-center px-3 py-1 text-sm font-medium text-gray-400 bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiArrowLeft className="mr-1" size={14} />
                      Previous
                    </button>
                    <span className="text-sm text-gray-400">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="flex items-center px-3 py-1 text-sm font-medium text-gray-400 bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <FiArrowRight className="ml-1" size={14} />
                    </button>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main> {/* Corrected closing tag for main */}
    </div> // Added closing tag for the outer div
  );
};

export default HomePage;

// Mock data for the new charts
const mockLiveDecksData = [
  { name: 'Active', value: 45, fill: '#22c55e' }, // green-500
  { name: 'Inactive', value: 15, fill: '#f97316' }, // orange-500
];

const mockProcessingData = [
  { name: 'Processed', value: 120, fill: '#8b5cf6' }, // violet-500
  { name: 'Pending', value: 35, fill: '#ec4899' }, // pink-500
];

// Helper component for a simple Pie Chart