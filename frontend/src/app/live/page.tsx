'use client'
import { useState } from 'react';

export default function SpotifyPlaylistForm() {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [eventType, setEventType] = useState('live');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Updated to use the combined endpoint
      const response = await fetch('http://localhost:3001/playlist/tracks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playlistUrl,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Response:', data);
        console.log('Tracks:', data.tracks); // This will log all the tracks
        alert(`Success! Found ${data.tracks.length} tracks in the playlist.`);
      } else {
        const errorData = await response.json();
        console.error('Error:', errorData);
        alert(`Error: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('Network error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValidSpotifyUrl = (url: string) => {
    return url.includes('spotify.com/playlist/') || url.includes('open.spotify.com/playlist/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Find Events from Your Playlist
            </h1>
            <p className="text-gray-600">
              Discover live shows and DJ sets based on your Spotify playlist
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Spotify Playlist URL */}
            <div>
              <label htmlFor="playlist-url" className="block text-sm font-medium text-gray-700 mb-2">
                Spotify Playlist URL *
              </label>
              <input
                id="playlist-url"
                type="url"
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                placeholder="https://open.spotify.com/playlist/..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                required
              />
              {playlistUrl && !isValidSpotifyUrl(playlistUrl) && (
                <p className="text-red-500 text-sm mt-1">Please enter a valid Spotify playlist URL</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!playlistUrl || isSubmitting}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Fetching Tracks...' : 'Get Playlist Tracks'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}