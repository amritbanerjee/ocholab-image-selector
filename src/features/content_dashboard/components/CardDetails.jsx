import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';

const CardDetails = ({ cardName, cardDescription }) => {
  if (!cardName) {
    return null; // Don't render if there's no card data yet
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{cardName}</CardTitle>
        {cardDescription && <CardDescription>{cardDescription}</CardDescription>}
      </CardHeader>
    </Card>
  );
};

export default CardDetails;