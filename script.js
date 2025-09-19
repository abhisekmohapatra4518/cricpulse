// Replace with your own keys
const CRICAPI_KEY = "YOUR_CRICAPI_KEY";
const RAPIDAPI_KEY = "7255fecfbamsh0a3cb2e091f5a45p16ad2djsn56e39f60be88";

// Cricbuzz endpoints
const LIVE_MATCHES_API_URL = "https://cricbuzz-cricket.p.rapidapi.com/matches/v1/live";
const RECENT_MATCHES_API_URL = "https://cricbuzz-cricket.p.rapidapi.com/matches/v1/recent";
const UPCOMING_MATCHES_API_URL = "https://cricbuzz-cricket.p.rapidapi.com/matches/v1/upcoming";

// CricAPI endpoint for players
const PLAYER_SEARCH_API_URL = (name) => 
  `https://api.cricapi.com/v1/players?apikey=${CRICAPI_KEY}&offset=0&search=${name}`;

const rapidHeaders = {
  "x-rapidapi-host": "cricbuzz-cricket.p.rapidapi.com",
  "x-rapidapi-key": RAPIDAPI_KEY
};

// Fetch wrapper
const fetchRapidApiData = async (url) => {
  const res = await fetch(url, { headers: rapidHeaders });
  if (!res.ok) throw new Error(`Failed to fetch from ${url}`);
  return res.json();
};

const fetchPlayerData = async (name) => {
  const res = await fetch(PLAYER_SEARCH_API_URL(name));
  if (!res.ok) throw new Error("Failed to fetch player data");
  return res.json();
};

// Create Match Card
const createMatchCard = (match) => {
  const team1 = match?.matchInfo?.team1?.teamName || "Team 1";
  const team2 = match?.matchInfo?.team2?.teamName || "Team 2";
  const seriesName = match?.matchInfo?.seriesName || "Unknown Series";
  const status = match?.matchInfo?.status || "Status unavailable";

  return `
    <div class="bg-gradient-to-r from-indigo-500 to-purple-600 text-white dark:from-gray-800 dark:to-gray-900 dark:text-gray-100 rounded-2xl shadow-lg p-5">
      <h3 class="font-bold text-xl mb-2">${seriesName}</h3>
      <p>${team1} vs ${team2}</p>
      <p class="text-sm opacity-90">${status}</p>
    </div>
  `;
};

// Render Matches
const renderMatches = (containerId, matches) => {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!matches || matches.length === 0) {
    container.innerHTML = `<p class="text-center text-gray-500 dark:text-gray-400">No matches found.</p>`;
    return;
  }

  container.innerHTML = matches.map(m => createMatchCard(m)).join("");
};

// Extract matches safely
const extractMatches = (data) => {
  return data?.typeMatches?.flatMap(t => 
    t.seriesMatches.flatMap(s => s.seriesAdWrapper?.matches || [])
  ) || [];
};

// Dark Mode Toggle
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("dark-toggle");

  // Load saved preference
  if (localStorage.getItem("theme") === "dark") {
    document.documentElement.classList.add("dark");
    if (toggle) toggle.textContent = "☀️ Light Mode";
  }

  if (toggle) {
    toggle.addEventListener("click", () => {
      document.documentElement.classList.toggle("dark");
      if (document.documentElement.classList.contains("dark")) {
        localStorage.setItem("theme", "dark");
        toggle.textContent = "☀️ Light Mode";
      } else {
        localStorage.setItem("theme", "light");
        toggle.textContent = "🌙 Dark Mode";
      }
    });
  }
});

// Page-specific logic
document.addEventListener("DOMContentLoaded", async () => {
  try {
    if (document.getElementById("live-matches-container") && window.location.pathname.includes("live")) {
      const liveData = await fetchRapidApiData(LIVE_MATCHES_API_URL);
      renderMatches("live-matches-container", extractMatches(liveData));
    }

    if (document.getElementById("completed-matches-container")) {
      const completedData = await fetchRapidApiData(RECENT_MATCHES_API_URL);
      renderMatches("completed-matches-container", extractMatches(completedData));
    }

    if (document.getElementById("upcoming-matches-container")) {
      const upcomingData = await fetchRapidApiData(UPCOMING_MATCHES_API_URL);
      renderMatches("upcoming-matches-container", extractMatches(upcomingData));
    }

    if (window.location.pathname.includes("index")) {
      const [liveData, upcomingData] = await Promise.all([
        fetchRapidApiData(LIVE_MATCHES_API_URL),
        fetchRapidApiData(UPCOMING_MATCHES_API_URL)
      ]);
      renderMatches("live-matches-container", extractMatches(liveData));
      renderMatches("upcoming-matches-container", extractMatches(upcomingData));
    }
  } catch (err) {
    console.error(err);
  }

  // Player Search
  const searchBtn = document.getElementById("search-btn");
  if (searchBtn) {
    searchBtn.addEventListener("click", async () => {
      const query = document.getElementById("player-search").value.trim();
      if (!query) return;

      try {
        const res = await fetchPlayerData(query);
        const players = res?.data || [];
        const container = document.getElementById("players-container");
        container.innerHTML = players.map(p => `
          <div class="bg-white dark:bg-gray-800 dark:text-gray-100 rounded-2xl shadow-md p-5 border border-gray-200 dark:border-gray-700">
            <h3 class="font-bold text-lg">${p.name}</h3>
            <p>ID: ${p.id}</p>
            <p>Country: ${p.country || "N/A"}</p>
            <p>Role: ${p.role || "Unknown"}</p>
          </div>
        `).join("");
      } catch (err) {
        console.error(err);
      }
    });
  }

  // Player Comparison
  const compareBtn = document.getElementById("compare-btn");
  if (compareBtn) {
    compareBtn.addEventListener("click", async () => {
      const p1Name = document.getElementById("compare1").value.trim();
      const p2Name = document.getElementById("compare2").value.trim();
      if (!p1Name || !p2Name) return;

      try {
        const [res1, res2] = await Promise.all([fetchPlayerData(p1Name), fetchPlayerData(p2Name)]);
        const p1 = res1?.data?.[0];
        const p2 = res2?.data?.[0];
        const container = document.getElementById("comparison-container");
        if (p1 && p2) {
          container.innerHTML = `
            <div class="bg-white dark:bg-gray-800 dark:text-gray-100 rounded-2xl shadow-md p-5 border border-gray-200 dark:border-gray-700">
              <h3 class="font-bold">${p1.name}</h3>
              <p>Country: ${p1.country || "N/A"}</p>
              <p>Role: ${p1.role || "Unknown"}</p>
            </div>
            <div class="bg-white dark:bg-gray-800 dark:text-gray-100 rounded-2xl shadow-md p-5 border border-gray-200 dark:border-gray-700">
              <h3 class="font-bold">${p2.name}</h3>
              <p>Country: ${p2.country || "N/A"}</p>
              <p>Role: ${p2.role || "Unknown"}</p>
            </div>
          `;
        }
      } catch (err) {
        console.error(err);
      }
    });
  }
});
