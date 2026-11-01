import React from 'react';

export default function LoadingSpinner({ message = 'Loading curated journeys...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-border" />
        <div className="absolute inset-0 rounded-full border-2 border-gold border-t-transparent animate-spin" />
        <div className="absolute inset-2 rounded-full border border-forest/30 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
      </div>
      {message && (
        <p className="mt-4 text-xs font-medium uppercase tracking-widest text-charcoal">
          {message}
        </p>
      )}
    </div>
  );
}
