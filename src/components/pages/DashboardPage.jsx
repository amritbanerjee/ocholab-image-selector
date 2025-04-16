import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import DeckList from './DeckList';

const Sidebar = () => (
  <aside className="flex flex-col items-center bg-gradient-to-b from-gray-950 via-gray-900 to-gray-800 text-white w-20 py-6 space-y-6 min-h-screen shadow-xl">
    <div className="mb-8">
      <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#23272f"/><path d="M7 8h10M7 12h10M7 16h6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
    </div>
    <nav className="flex flex-col space-y-8">
      <button className="hover:text-gray-300 transition-colors"><svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M3 12l9-9 9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 21V9h6v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
      <button className="hover:text-gray-300 transition-colors"><svg width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
      <button className="hover:text-gray-300 transition-colors"><svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M3 9h18" stroke="currentColor" strokeWidth="2"/><path d="M9 21V9" stroke="currentColor" strokeWidth="2"/></svg></button>
      <button className="hover:text-gray-300 transition-colors"><svg width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
    </nav>
    <div className="mt-auto">
      <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="User" className="w-10 h-10 rounded-full border-2 border-gray-700 shadow-lg" />
    </div>
  </aside>
);

const Navbar = () => (
  <header className="flex items-center justify-between bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 text-white px-8 py-4 shadow-lg border-b border-gray-800">
    <div>
      <h2 className="text-lg font-semibold text-white">Hey there, Brian Ford!</h2>
      <p className="text-sm text-gray-400">Welcome back, we're happy to have you here!</p>
    </div>
  </header>
);

const DashboardPage = ({ supabase, session }) => {
  const [stats, setStats] = useState({
    totalDecks: 0,
    totalCards: 0,
    cardsForReview: 0
  });
  const [decks, setDecks] = useState([]);
  const [deckStats, setDeckStats] = useState([]); // [{id, title, totalCards, cardsForReview}]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [selectedDeck, setSelectedDeck] = useState(null);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const decksPerPage = 9; // Increased to show more items per page
  const totalPages = Math.ceil(deckStats.length / decksPerPage);
  const paginatedDeckStats = deckStats.slice((currentPage - 1) * decksPerPage, currentPage * decksPerPage);

  useEffect(() => {
    const fetchStatsAndDecks = async () => {
      try {
        setLoading(true);
        // Get cards with deck info to extract title_keys and created_at
        const { data, error } = await supabase
          .from('cards')
          .select(`
            deck_id,
            decks!deck_id(
              id,
              title_key,
              created_at
            )
          `)
          .eq('status', 'choosebaseimage');
        if (error) throw error;
        // Extract unique title_keys and deck_ids
        const titleKeys = [...new Set(data.map(card => card.decks?.title_key))].filter(Boolean);
        const sanitizedTitleKeys = titleKeys.map(key => encodeURIComponent(key));
        // Fetch translations for these title_keys
        const { data: translations, error: translationsError } = await supabase
          .from('translations_en')
          .select('key, value')
          .in('key', sanitizedTitleKeys)
          .limit(1000);
        if (translationsError) throw translationsError;
        // Map back to original keys for display
        const translationMap = translations?.reduce((acc, item) => {
          acc[decodeURIComponent(item.key)] = item.value;
          return acc;
        }, {});
        // Aggregate deck stats
        const deckMap = {};
        data.forEach(card => {
          const deckId = card.deck_id;
          if (!deckMap[deckId]) {
            deckMap[deckId] = {
              id: deckId,
              title: card.decks?.title_key ? translationMap?.[card.decks.title_key] || `Deck ${deckId}` : `Deck ${deckId}`,
              totalCards: 0,
              createdAt: card.decks?.created_at,
              cardsForReview: 0
            };
          }
          deckMap[deckId].totalCards += 1;
          deckMap[deckId].cardsForReview += 1;
        });
        const deckStatsArr = Object.values(deckMap).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setDecks(deckStatsArr.map(({id, title}) => ({id, title})));
        setDeckStats(deckStatsArr);
        setStats({
          totalDecks: deckStatsArr.length,
          totalCards: data.length,
          cardsForReview: data.length
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStatsAndDecks();
  }, [supabase]);

  const handleDeckClick = (deckId, deckTitle) => {
    navigate(`/deck/${deckId}/images`, { state: { deckName: deckTitle } });
  };

  // Circular progress helper
  const CircularProgress = ({ value, total, color, label }) => {
    const percent = total === 0 ? 0 : Math.round((value / total) * 100);
    const radius = 40;
    const stroke = 8;
    const normalizedRadius = radius - stroke / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percent / 100) * circumference;
    return (
      <div className="flex flex-col items-center">
        <svg height={radius * 2} width={radius * 2}>
          <circle
            stroke="#2d2d2d"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s' }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <span className="text-xl font-bold mt-2" style={{ color }}>{percent}%</span>
        <span className="text-xs text-gray-400 mt-1 text-center">{label}</span>
      </div>
    );
  };

  // Memoized selected deck stats
  const selectedDeckStats = useMemo(() => {
    if (!selectedDeck) return null;
    return deckStats.find(d => d.id === selectedDeck);
  }, [selectedDeck, deckStats]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <Navbar />
        {/* Top 3 summary cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 px-8 pt-8 pb-4">
          <Card className="bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 border-gray-800 text-white shadow-lg">
            <CardHeader>
              <CardTitle>Total Decks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalDecks}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 border-gray-800 text-white shadow-lg">
            <CardHeader>
              <CardTitle>Total Cards</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalCards}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 border-gray-800 text-white shadow-lg">
            <CardHeader>
              <CardTitle>Cards for Review</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.cardsForReview}</p>
            </CardContent>
          </Card>
        </div>
        <main className="flex flex-1 flex-row gap-8 p-8 bg-transparent min-h-0 max-h-[calc(100vh-120px)] overflow-hidden">
          {/* Left: Circular Graphs */}
          <section className="w-72 flex flex-col gap-8 items-center justify-end bg-gradient-to-b from-gray-900 via-gray-950 to-gray-900 rounded-lg p-6 shadow-xl border border-gray-800 h-full max-h-full sticky bottom-0 overflow-y-auto">
            <CircularProgress
              value={decks.length}
              total={stats.totalDecks}
              color="#38bdf8"
              label="Decks with Cards Generated"
            />
            <CircularProgress
              value={stats.cardsForReview}
              total={stats.totalCards}
              color="#fbbf24"
              label="Cards Ready for Review"
            />
            <CircularProgress
              value={selectedDeckStats?.cardsForReview || 0}
              total={selectedDeckStats?.totalCards || 1}
              color="#34d399"
              label={selectedDeckStats ? `Cards Ready in ${selectedDeckStats.title}` : 'Select a Deck'}
            />
          </section>
          {/* Center: Decks Table */}
          <section className="flex-1 flex flex-col min-h-0 max-h-full justify-between">
            <Card className="flex flex-col h-full bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 border border-gray-800 shadow-xl rounded-lg p-6">
              <div className="flex flex-col h-full min-h-0">
                <h2 className="text-xl font-bold mb-4 text-gray-100">Decks for Review</h2>
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500"></div>
                  </div>
                ) : error ? (
                  <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                    Error loading decks: {error}
                  </div>
                ) : (
                  <div className="flex flex-col h-full min-h-0">
                    <div className="overflow-x-auto rounded-lg shadow border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 flex-1 min-w-0 w-full mx-auto max-h-[calc(100vh-320px)]">
                      <table className="min-w-full w-full divide-y divide-gray-800 h-full table-fixed">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-2/5">Deck Name</th>
                            <th className="px-2 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/6">Total Cards</th>
                            <th className="px-2 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/6">Date</th>
                            <th className="px-2 py-3 w-1/6"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {paginatedDeckStats.length === 0 && (
                            <tr>
                              <td colSpan={4} className="text-gray-400 text-center py-6">No decks available for review</td>
                            </tr>
                          )}
                          {paginatedDeckStats.map(deck => (
                            <tr key={deck.id} className={selectedDeck === deck.id ? 'bg-gray-800/60' : ''}>
                              <td className="px-4 py-3 font-semibold text-gray-200 truncate max-w-xs">{deck.title}</td>
                                  <td className="px-2 py-3 text-gray-100">{deck.totalCards}</td>
                              <td className="px-2 py-3 text-gray-100">{deck.createdAt ? new Date(deck.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</td>
                              <td className="px-2 py-3">
                                <button
                                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow"
                                  onClick={() => { setSelectedDeck(deck.id); handleDeckClick(deck.id, deck.title); }}
                                >Review</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="relative flex flex-row items-center justify-center gap-2 mt-4 mb-2 sticky bottom-0 z-10 bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 border-t border-gray-800 pt-3 min-h-[56px]">
                        <button
                          className={`absolute left-0 flex items-center text-xs font-semibold text-gray-400 hover:text-gray-200 transition-colors px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          aria-label="Previous Page"
                        >
                          <svg className="mr-1" width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          <span>Previous</span>
                        </button>
                        <span className="mx-6 text-gray-400 text-base font-semibold select-none text-center" style={{minWidth:'120px'}}>
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          className={`absolute right-0 flex items-center text-xs font-semibold text-gray-400 hover:text-gray-200 transition-colors px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          aria-label="Next Page"
                        >
                          <span>Next</span>
                          <svg className="ml-1" width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;