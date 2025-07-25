const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors()); // Enable CORS for frontend requests


// POST endpoint to search for artist events
app.post('/search-events', async (req, res) => {
  try {
    const { artistName } = req.body;
    
    if (!artistName) {
      return res.status(400).json({ error: 'Artist name is required' });
    }

    if (!process.env.API_KEY) {
      return res.status(500).json({ error: 'Ticketmaster API key not found in environment variables' });
    }

    console.log(`Searching for events for artist: ${artistName}`);

    // Don't manually encode - let axios handle it
    console.log(`Artist name: ${artistName}`);

    // Make request to Ticketmaster Discovery API for events
    const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', {
      params: {
        keyword: artistName,  // Remove manual encoding here
        apikey: process.env.API_KEY,
        size: 20,
        sort: 'date,asc',
        classificationName: 'music',
        source: 'ticketmaster'
      }
    });

    const apiData = response.data;
    
    // Console log the raw data
    console.log('=== TICKETMASTER API RESPONSE ===');
    console.log(JSON.stringify(apiData, null, 2));
    
    // Rest of your code remains the same...
    const transformedEvents = [];
    
    if (apiData._embedded && apiData._embedded.events) {
      console.log(`\n=== FOUND ${apiData._embedded.events.length} EVENTS ===`);
      
      apiData._embedded.events.forEach((event, index) => {
        // Get the best quality image
        const getImageUrl = (images) => {
          if (!images || images.length === 0) return '/placeholder-image.jpg';
          
          const preferredImage = images.find(img => 
            img.ratio === '16_9' && img.width >= 1024
          ) || images.find(img => 
            img.width >= 640
          ) || images[0];
          
          return preferredImage?.url || '/placeholder-image.jpg';
        };

        // Get venue location
        const getLocation = (event) => {
          const venue = event._embedded?.venues?.[0];
          if (venue?.city?.name && venue?.state?.stateCode) {
            return `${venue.city.name}, ${venue.state.stateCode}`;
          } else if (venue?.city?.name) {
            return venue.city.name;
          } else if (venue?.state?.name) {
            return venue.state.name;
          } else if (venue?.country?.name) {
            return venue.country.name;
          }
          return 'Location TBD';
        };

        const transformedEvent = {
          title: event.name || 'Event Title Not Available',
          date: event.dates?.start?.localDate || event.dates?.start?.dateTime || new Date().toISOString(),
          imageUrl: getImageUrl(event.images),
          area: getLocation(event)
        };
        
        transformedEvents.push(transformedEvent);
        
        console.log(`${index + 1}. ${transformedEvent.title}`);
        console.log(`   Date: ${transformedEvent.date}`);
        console.log(`   Area: ${transformedEvent.area}`);
        console.log(`   Image: ${transformedEvent.imageUrl}`);
        console.log('');
      });
    } else {
      console.log(`No events found for "${artistName}"`);
    }

    // Send response back to client
    res.json({
      success: true,
      artist: artistName,
      totalEvents: apiData.page?.totalElements || 0,
      events: transformedEvents
    });

  } catch (error) {
    console.error('Error searching for events:', error.message);
    
    if (error.response) {
      console.error('API Error Details:', error.response.data);
      res.status(error.response.status).json({
        error: 'Ticketmaster API error',
        details: error.response.data
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        details: error.message
      });
    }
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('POST to /search-events with JSON body: { "artistName": "Artist Name" }');
});

// Example usage with curl:
/*
curl -X POST http://localhost:3003/search-events \
  -H "Content-Type: application/json" \
  -d '{"artistName": "taylorswift"}'
*/