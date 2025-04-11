import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const Home = ({ supabase }) => {
  const [stats, setStats] = useState({
    totalDecks: 0,
    totalCards: 0,
    cardsForReview: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total decks
        const { count: decksCount, error: decksError } = await supabase
          .from('decks')
          .select('id', { count: 'exact', head: true });

        if (decksError) throw decksError;

        // Get total cards
        const { count: cardsCount, error: cardsError } = await supabase
          .from('cards')
          .select('id', { count: 'exact', head: true });

        if (cardsError) throw cardsError;

        // Get cards ready for image review
        const { count: reviewCount, error: reviewError } = await supabase
          .from('cards')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'choosebaseimage');

        if (reviewError) throw reviewError;

        setStats({
          totalDecks: decksCount || 0,
          totalCards: cardsCount || 0,
          cardsForReview: reviewCount || 0
        });
      } catch (error) {
        console.error('Error:', error.message);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="container py-20">
      <h1 className="text-3xl font-bold mb-8">Project Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Decks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalDecks}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalCards}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cards for Review</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.cardsForReview}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;