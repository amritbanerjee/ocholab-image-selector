import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';

const CardDetails = ({ cardName, cardDescription }) => {
  if (!cardName) {
    return null; // Don't render if there's no card data yet
  }

  return (
    <Card className="mb-4 bg-[#1f2328] border border-gray-700 text-white shadow-md rounded-lg p-4">
      <CardHeader className="p-0">
        <p className="text-xs uppercase text-gray-500 mb-2">Card info</p>
        <CardTitle className="text-lg font-semibold mb-1">{cardName}</CardTitle>
        {cardDescription && <CardDescription className="text-sm text-gray-400">{cardDescription}</CardDescription>}
      </CardHeader>
    </Card>
  );
};

export default CardDetails;