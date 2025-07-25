"use client";
import React, { useEffect, useState } from "react";

const Events: React.FC = () => {
  const names = ['Chris Stussy', 'Interplanetary Criminal', 'Main Phase', 'Silva Bumpa', 'Kettama', 'Malugi', 'Effy', 'Mall Grab', 'Bakey', 'Eloq', 'Diffrent', 'Osmosis Jones', '4am Kru', 'Samurai Breaks', 'Prozak-irl', 'Soul Mass Transit System', 'Oppidan', 'Bullet Tooth']

  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<{ title: string; date: string; imageUrl: string; area: string; }[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false);

  // Fixed function to properly send the artist name as JSON
  const handleArtistSelect = async (artistName: string) => {
    try {
      setSelectedArtist(artistName);
      setIsLoadingEvents(true);

      // Format the artist name as expected by the API
      const artist = artistName.toLowerCase().trim().replace(/\s+/g, '');

      const res = await fetch("http://localhost:3002/api/scrape-ra", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ artistName: artist }),
      });

      if (!res.ok) {
        throw new Error(`Error fetching events: ${res.statusText}`);
      }

      const data = await res.json();
      console.log(data)
      setEvents(data.events || []);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  return (
    <>
      <div className="relative z-0 min-h-16 w-full flex justify-center items-center text-6xl md:text-9xl font-badeen tracking-[0.2em] mb-16 md:mb-24 text-center px-4">
        <h1>Upcoming EVENTS</h1>
      </div>

      <div className="flex flex-wrap justify-center gap-4 px-4">
        {names.map((artist, index) => {
          const displayName = artist.replace(/-/g, '').replace(/2/g, '');

          return (
            <button
              key={index}
              onClick={() => handleArtistSelect(artist)}
              className={`px-6 py-2 rounded-xl transition ${selectedArtist === artist
                ? 'bg-white text-black border border-white'
                : 'bg-black text-white border border-white hover:bg-white hover:text-black'
                }`}
            >
              {displayName}
            </button>
          );
        })}
      </div>

      {selectedArtist && (
        <div className="text-center mt-8">
          <h2 className="text-xl mb-4">Events for {selectedArtist.replace(/-/g, '').replace(/2/g, '')}</h2>

          {isLoadingEvents ? (
            <div className="text-center">Loading events...</div>
          ) : events.length > 0 ? (
            <div className="flex flex-col items-center gap-4 max-w-3xl mx-auto">
              {events.map((event, idx) => (
                <div key={idx} className="bg-black/30 backdrop-blur-sm border border-white/20 p-4 rounded-lg w-full">
                  <h3 className="text-lg font-bold">{event.title}</h3>
                  <h3 className="text-lg font-bold">{event.area.charAt(0).toUpperCase() + event.area.slice(1)}</h3>
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full max-w-md mx-auto rounded-md"
                  />
                  <p className="text-sm">{new Date(event.date).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center">No upcoming events found for this artist.</div>
          )}
        </div>
      )}
    </>
  );
};

export default Events;