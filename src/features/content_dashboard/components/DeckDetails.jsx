import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';

const DeckDetails = ({ deckName, deckDescription }) => {
  return (
    <Card className="mb-4 bg-[#1f2328] border border-gray-700 text-white shadow-md rounded-lg p-4 w-full md:w-auto">
      <CardHeader className="p-0">
        <p className="text-xs uppercase text-gray-500 mb-2">Deck info</p>
        <CardTitle className="text-lg font-semibold mb-1">{deckName}</CardTitle>
        {deckDescription && <CardDescription className="text-sm text-gray-400">{deckDescription}</CardDescription>}
      </CardHeader>
    </Card>
  );
};

export default DeckDetails;