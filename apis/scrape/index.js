const express = require('express');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(express.json());
app.use(cors());

// POST endpoint for scraping RA
app.post('/api/scrape-ra', async (req, res) => {
  try {
    const { artistName } = req.body; // get converted artist name from client

    if (!artistName) {
      return res.status(400).json({ error: "Artist name is required" });
    }

    const response = await fetch(`https://ra.co/dj/${artistName}/tour-dates`, { // scrape RA
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      console.error(`Error fetching artist page: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({
        error: `Failed to fetch artist data: ${response.statusText}`
      });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let eventData = null;
    if (!eventData) {
      const events = [];

      $("script").each((_, el) => {
        const scriptContent = $(el).html();
        const defaultImageUrl = "https://images.squarespace-cdn.com/content/v1/57a9f951e6f2e1756d5449ee/1575044716580-FBZ6EKOVLW8CT8I7D598/P1010656.jpg?format=2500w"
        
        if (scriptContent && scriptContent.includes('"__typename":"Event"')) {
          try {
            const startIndex = scriptContent.indexOf('"urlName"'); // gets urlName -> current location (starting point)
            if (startIndex !== -1) {
              const filteredContent = scriptContent.slice(startIndex);
              const imageUrlMatches = [
                ...filteredContent.matchAll(/"filename":"(https?:\/\/[^"]+?)","alt":(null|"[^"]*"),"type":"FLYERFRONT"/g)
              ];
              const imageUrls = imageUrlMatches.map(match => match[1]);
              
              // skips first urlName -> actual location
              const secondIndex = scriptContent.indexOf('"urlName"', startIndex + 1);
              const contentAfterSecond = scriptContent.slice(secondIndex);
              // COUNTRY
              const areaMatches = [...contentAfterSecond.matchAll(/"urlName":"(.*?)"/g)];
              const areas = areaMatches.map(match => match[1]);
              const eventMatches = filteredContent.match(/({[^}]*?"__typename":"Event"[^}]*})/g);
              let index = 0;
              
              if (eventMatches) {
                for (const match of eventMatches) {
                  const titleMatch = match.match(/"title":"(.*?)"/);
                  const dateMatch = match.match(/"date":"(.*?)"/);
                  const imageUrl = imageUrls[index];
                  const area = areas[index];
                  index++;
                  
                  if (titleMatch && dateMatch) {
                    if (titleMatch[1] === "Down The Rabbit Hole 2025") {
                      index -= 1;
                      continue;
                    }
                    events.push({
                      title: titleMatch[1],
                      date: dateMatch[1],
                      imageUrl: imageUrl || defaultImageUrl,
                      area: area || "Secret Location",
                    });
                  }
                }
              }
            }
          } catch (error) {
            console.error("Error parsing event data:", error);
          }
        }
      });

      return res.json({ events });
    }

    // send events
    const events = [];
    for (const query of eventData) {
      if (query?.state?.data?.eventsList) {
        const eventsListData = query.state.data.eventsList;
        for (const event of eventsListData) {
          if (event.title && event.date) {
            events.push({
              title: event.title,
              date: event.date,
            });
          }
        }
      }
    }
    console.log(events.events)

    console.log(`Found ${events.length} events for ${artistName}`);
    return res.json({ events });

  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ error: "Failed to process request" });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'RA Scraper API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;