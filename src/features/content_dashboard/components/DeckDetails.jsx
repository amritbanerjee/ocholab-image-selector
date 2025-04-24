import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';

const DeckDetails = ({ deckName, deckDescription }) => {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{deckName}</CardTitle>
        {deckDescription && <CardDescription>{deckDescription}</CardDescription>}
      </CardHeader>
    </Card>
  );
};

export default DeckDetails;