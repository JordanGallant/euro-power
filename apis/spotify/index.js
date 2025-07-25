const axios = require("axios");
const qs = require("qs");
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors({
  origin: "*"
}));

// Add body parsing middleware
app.use(express.json());

const PORT = 3001;

const TOKEN_URL = "https://accounts.spotify.com/api/token";

// Helper function to extract playlist ID and convert to API URL
const convertToApiUrl = (playlistUrl) => {
  try {
    // Extract playlist ID from various Spotify URL formats
    let playlistId;
    
    if (playlistUrl.includes('open.spotify.com/playlist/')) {
      // Format: https://open.spotify.com/playlist/3S2dYhSHn5IIqQrGFXDf2W?si=...
      playlistId = playlistUrl.split('/playlist/')[1].split('?')[0];
    } else if (playlistUrl.includes('api.spotify.com/v1/playlists/')) {
      // Already in API format
      return playlistUrl.split('?')[0]; // Remove query params if any
    } else {
      throw new Error('Invalid Spotify playlist URL format');
    }
    
    return `https://api.spotify.com/v1/playlists/${playlistId}`;
  } catch (error) {
    throw new Error('Unable to parse Spotify playlist URL');
  }
};

const getSpotifyToken = async () => {
  try {
    const response = await axios.post(
      TOKEN_URL,
      qs.stringify({
        grant_type: "client_credentials",
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error(
      "Error fetching token:",
      error.response ? error.response.data : error.message
    );
    return null;
  }
};

// Combined endpoint that takes playlist URL and returns tracks
app.post("/playlist/tracks", async (req, res) => {
  try {
    const { playlistUrl } = req.body;
    
    if (!playlistUrl) {
      return res.status(400).json({ error: "playlistUrl is required" });
    }

    // Convert the URL to API format
    const apiUrl = convertToApiUrl(playlistUrl);
    console.log("Fetching tracks from:", apiUrl);

    // Get Spotify token
    const token = await getSpotifyToken();
    if (!token) {
      return res.status(500).json({ error: "Failed to retrieve access token" });
    }

    // Fetch playlist tracks
    const response = await axios.get(apiUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const tracks = response.data.tracks.items.map((item) => ({
      name: item.track.name,
      artist: item.track.artists.map((artist) => artist.name).join(", "),
      album: item.track.album.name,
      popularity: item.track.popularity,
      duration_ms: item.track.duration_ms,
      spotify_url: item.track.external_urls.spotify,
      track_id: item.track.id,
      cover_images: item.track.album.images[1] || item.track.album.images[0], // Fallback to first image
    }));

    res.json({ tracks });
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    
    if (error.message.includes('Unable to parse') || error.message.includes('Invalid Spotify')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: "Failed to fetch playlist tracks",
      details: error.response?.data || error.message 
    });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));