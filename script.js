// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Initialize clock and other components
    initClock();
    updateGreeting();
    fetchWeather();
    
    // Set up weather refresh every 30 minutes (1800000 ms)
    setInterval(fetchWeather, 1800000);
    
    // Initialize sports scoreboard (checks localStorage for preference)
    initSportsScoreboard();

    // Start animations
    animateElements();

    initGoogleAutocomplete();
});

// Update greeting based on time of day
function updateGreeting() {
    const now = new Date();
    const hour = now.getHours();
    const greeting = document.getElementById('greeting');
    
    if (hour >= 5 && hour < 12) {
        greeting.textContent = "Good morning!";
    } else if (hour >= 12 && hour < 18) {
        greeting.textContent = "Good afternoon.";
    } else {
        greeting.textContent = "Good evening...";
    }
}

// Initialize clock and update it every second
function initClock() {
    updateClock();
    setInterval(updateClock, 1000);
}

// Update clock and date display
function updateClock() {
    const now = new Date();
    
    // Update time
    const time = document.getElementById('time');
    time.textContent = now.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    // Update date
    const date = document.getElementById('date');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    date.textContent = now.toLocaleDateString('en-US', options);
}

// Weather API function - updated to pass sunrise and sunset data to the icon function
function fetchWeather() {
    const apiKey = 'ENTER YOUR KEY HERE';
    const city = 'ENTER YOUR LOCATION HERE';
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=imperial`;
    
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Weather data not available');
            }
            return response.json();
        })
        .then(data => {
            updateWeatherWidget(data);
        })
        .catch(error => {
            console.error('Error fetching weather:', error);
            document.querySelector('.weather-description').textContent = 'Weather unavailable';
        });
}

// Update weather widget with data - modified to use sunrise and sunset data
function updateWeatherWidget(data) {
    const temp = document.querySelector('.weather-temp');
    const description = document.querySelector('.weather-description');
    const iconImg = document.getElementById('weather-icon-img');
    
    // Update temperature (rounded to nearest integer)
    temp.textContent = `${Math.round(data.main.temp)}°F`;
    
    // Update weather description
    description.textContent = data.weather[0].description;
    
    // Update weather icon based on weather condition and time of day
    const weatherId = data.weather[0].id;
    const dt = data.dt; // Current time
    const sunrise = data.sys.sunrise; // Sunrise time
    const sunset = data.sys.sunset; // Sunset time
    
    const iconPath = getWeatherIconPath(weatherId, dt, sunrise, sunset);
    iconImg.src = iconPath;
    
    // Remove any filters that might have been applied to SVG icons
    //iconImg.style.filter = "none";
}

// Function to determine which icon to use based on OpenWeather condition code and time of day
function getWeatherIconPath(weatherId, dt, sunrise, sunset) {
    // Determine if it's day or night
    const currentTime = dt ? dt * 1000 : Date.now(); // Convert UNIX timestamp to milliseconds
    const sunriseTime = sunrise ? sunrise * 1000 : 0; // Convert UNIX timestamp to milliseconds
    const sunsetTime = sunset ? sunset * 1000 : 0; // Convert UNIX timestamp to milliseconds
    
    // Default to day if we don't have sunrise/sunset data
    let isDayTime = true;
    
    // If we have valid sunrise and sunset times, determine day/night
    if (sunriseTime && sunsetTime) {
        isDayTime = currentTime >= sunriseTime && currentTime < sunsetTime;
    } else {
        // Fallback method if no sunrise/sunset data: use hours between 6am and 6pm as day
        const hour = new Date(currentTime).getHours();
        isDayTime = hour >= 6 && hour < 18;
    }
    
    // Set the day/night suffix
    const timeOfDay = isDayTime ? 'd' : 'n';
    
    // Map the weather codes to the OpenWeatherMap icon codes
    let iconCode;
    
    // Weather condition codes: https://openweathermap.org/weather-conditions
    if (weatherId >= 200 && weatherId < 300) {
        // Thunderstorm
        iconCode = '11';
    } else if (weatherId >= 300 && weatherId < 400) {
        // Drizzle
        iconCode = '09';
    } else if (weatherId >= 500 && weatherId < 510) {
        // Rain
        iconCode = '10';
    } else if (weatherId >= 510 && weatherId < 600) {
        // Heavy rain
        iconCode = '09';
    } else if (weatherId >= 600 && weatherId < 700) {
        // Snow
        iconCode = '13';
    } else if (weatherId >= 700 && weatherId < 800) {
        // Atmosphere (mist, fog, etc.)
        iconCode = '50';
    } else if (weatherId === 800) {
        // Clear sky
        iconCode = '01';
    } else if (weatherId === 801) {
        // Few clouds
        iconCode = '02';
    } else if (weatherId === 802) {
        // Scattered clouds
        iconCode = '03';
    } else if (weatherId === 803 || weatherId === 804) {
        // Broken clouds or overcast
        iconCode = '04';
    } else {
        // Default icon
        iconCode = '01';
    }
    
    // Construct the icon path
    return `icons/${iconCode}${timeOfDay}.svg`;
}

// GSAP animations
function animateElements() {
    const tl = gsap.timeline();
    
    tl.to('.header h1', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out'
    })
    .to('.weather-widget', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out'
    }, '-=0.6')
    .to('.rockets-widget', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out'
    }, '-=0.6')
    .to('.time-display', {
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out'
    }, '-=0.4')
    .to('.date-display', {
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out'
    }, '-=0.4')
    .to('.search-container', {
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out'
    }, '-=0.4')
    .to('.key-section', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out'
    }, '-=0.4')
    .to('.footer', {
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out'
    }, '-=0.4')
    .call(() => {
        document.querySelector('.search-input').focus();
    });
}

// Global variable to track current scoreboard and refresh timer
let currentScoreboard = localStorage.getItem('currentScoreboard') || 'rockets';
let refreshTimerId;

// Initialize sports scoreboard
function initSportsScoreboard() {
    // Add click handler for toggling
    const container = document.getElementById('rockets-game-container');
    const widget = document.querySelector('.rockets-widget');
    
    widget.style.cursor = 'pointer';
    widget.addEventListener('click', toggleScoreboard);
    
    // Load the appropriate scoreboard based on saved preference
    if (currentScoreboard === 'arsenal') {
        showArsenalScoreboard();
    } else {
        showRocketsScoreboard();
    }
}

function toggleScoreboard() {
    const container = document.getElementById('rockets-game-container');
    const widget = document.querySelector('.rockets-widget');
    
    // Get current height
    const startHeight = widget.offsetHeight;
    
    // Fade out
    container.style.opacity = '0';
    container.style.transform = 'translateX(-10px)';
    
    setTimeout(() => {
        // Store old height
        widget.style.height = startHeight + 'px';
        
        if (currentScoreboard === 'rockets') {
            currentScoreboard = 'arsenal';
            showArsenalScoreboard();
        } else {
            currentScoreboard = 'rockets';
            showRocketsScoreboard();
        }
        
        // Let content render, then animate to new height
        setTimeout(() => {
            widget.style.height = 'auto';
            const endHeight = widget.offsetHeight;
            widget.style.height = startHeight + 'px';
            
            // Force reflow
            widget.offsetHeight;
            
            // Animate to new height
            widget.style.height = endHeight + 'px';
            
            // Fade in
            container.style.opacity = '1';
            container.style.transform = 'translateX(0)';
            
            // Remove fixed height after animation
            setTimeout(() => {
                widget.style.height = 'auto';
            }, 300);
        }, 50);
    }, 200);
    
    localStorage.setItem('currentScoreboard', currentScoreboard);
}

// Show Rockets scoreboard
function showRocketsScoreboard() {
    // Update widget title
    document.querySelector('.rockets-widget-title span').textContent = 'NBA Scoreboard';
    
    // Clear any existing timer
    if (refreshTimerId) {
        clearInterval(refreshTimerId);
    }
    
    // Fetch initial data
    fetchRocketsGameData();
    
    // Set up refresh interval
    updateRocketsRefreshInterval();
}

// Show Arsenal scoreboard
function showArsenalScoreboard() {
    // Update widget title
    document.querySelector('.rockets-widget-title span').textContent = 'Premier League Scoreboard';
    
    // Clear any existing timer
    if (refreshTimerId) {
        clearInterval(refreshTimerId);
    }
    
    // Fetch initial data
    fetchArsenalGameData();
    
    // Set up refresh interval
    updateArsenalRefreshInterval();
}

// Update refresh interval for Rockets
function updateRocketsRefreshInterval() {
    // Clear existing timer
    if (refreshTimerId) {
        clearInterval(refreshTimerId);
    }
    
    // Get current data from localStorage
    const cachedData = localStorage.getItem('rocketsGameData');
    let refreshInterval = 300000; // Default 5 minutes
    
    if (cachedData) {
        const data = JSON.parse(cachedData);
        // Check if there's a live game
        const hasLiveGame = data.games && data.games.some(game => parseInt(game.game_status) === 2);
        
        // Set refresh interval: 2.5 minutes for live games, 5 minutes otherwise
        refreshInterval = hasLiveGame ? 150000 : 300000;
        console.log(`Setting Rockets refresh interval to ${refreshInterval/1000} seconds (live game: ${hasLiveGame})`);
    }
    
    // Set new timer
    refreshTimerId = setInterval(() => {
        if (currentScoreboard === 'rockets') {
            fetchRocketsGameData();
            updateRocketsRefreshInterval(); // Recalculate the interval after fetching
        }
    }, refreshInterval);
}

// Update refresh interval for Arsenal
function updateArsenalRefreshInterval() {
    // Clear existing timer
    if (refreshTimerId) {
        clearInterval(refreshTimerId);
    }
    
    // Get current data from localStorage
    const cachedData = localStorage.getItem('arsenalGameData');
    let refreshInterval = 300000; // Default 5 minutes
    
    if (cachedData) {
        const data = JSON.parse(cachedData);
        // Check if there's a live game
        const hasLiveGame = data.games && data.games.some(game => game.status_state === 'in');
        
        // Set refresh interval: 30 seconds for live games, 5 minutes otherwise
        refreshInterval = hasLiveGame ? 30000 : 300000;
        console.log(`Setting Arsenal refresh interval to ${refreshInterval/1000} seconds (live game: ${hasLiveGame})`);
    }
    
    // Set new timer
    refreshTimerId = setInterval(() => {
        if (currentScoreboard === 'arsenal') {
            fetchArsenalGameData();
            updateArsenalRefreshInterval(); // Recalculate the interval after fetching
        }
    }, refreshInterval);
}

// Fetch Rockets game data from API
function fetchRocketsGameData() {
    const apiUrl = 'http://localhost:8080/api/rockets/games?t=' + Date.now();
    const container = document.getElementById('rockets-game-container');
    
    // Show loading message
    container.innerHTML = '<div class="loading">Loading game data...</div>';
    
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Game data not available');
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(data.message || 'Error fetching game data');
            }
            
            // DEBUG: Log the full API response
            console.log('Rockets API response:', data);
            
            updateRocketsWidget(data);
        })
        .catch(error => {
            console.error('Error fetching Rockets game data:', error);
            displayError('Unable to load game data. Check API status.');
            
            // Try to load from localStorage as fallback
            const cachedData = localStorage.getItem('rocketsGameData');
            if (cachedData) {
                try {
                    const data = JSON.parse(cachedData);
                    const cacheTime = localStorage.getItem('rocketsGameDataTime');
                    const cacheAge = cacheTime ? (Date.now() - parseInt(cacheTime)) / 1000 / 60 : 0;
                    
                    updateRocketsWidget(data);
                    
                    // Add a note about using cached data, foobarski
                   // const cacheNote = document.createElement('div');
                   // cacheNote.className = 'cache-note';
                   // cacheNote.textContent = `Using cached data (${Math.round(cacheAge)} mins old)`;
                   // cacheNote.style.fontSize = '0.7rem';
                   // cacheNote.style.color = 'var(--light-grey)';
                   // cacheNote.style.textAlign = 'center';
                   // cacheNote.style.marginTop = '0.3rem';
                   // container.appendChild(cacheNote);
                } catch (e) {
                    console.error('Error loading cached data:', e);
                }
            }
        });
}

// Fetch Arsenal game data from API
function fetchArsenalGameData() {
    const apiUrl = 'http://localhost:8080/api/arsenal/games?t=' + Date.now();
    const container = document.getElementById('rockets-game-container');
    
    // Show loading message
    container.innerHTML = '<div class="loading">Loading game data...</div>';
    
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Game data not available');
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(data.message || 'Error fetching game data');
            }
            
            // DEBUG: Log the full API response
            console.log('Arsenal API response:', data);
            
            updateArsenalWidget(data);
        })
        .catch(error => {
            console.error('Error fetching Arsenal game data:', error);
            displayError('Unable to load game data. Check API status.');
            
            // Try to load from localStorage as fallback
            const cachedData = localStorage.getItem('arsenalGameData');
            if (cachedData) {
                try {
                    const data = JSON.parse(cachedData);
                    const cacheTime = localStorage.getItem('arsenalGameDataTime');
                    const cacheAge = cacheTime ? (Date.now() - parseInt(cacheTime)) / 1000 / 60 : 0;
                    
                    updateArsenalWidget(data);
                    
                    // Add a note about using cached data, foobarski
                  //  const cacheNote = document.createElement('div');
                   // cacheNote.className = 'cache-note';
                  //  cacheNote.textContent = `Using cached data (${Math.round(cacheAge)} mins old)`;
                   // cacheNote.style.fontSize = '0.7rem';
                   // cacheNote.style.color = 'var(--light-grey)';
                   // cacheNote.style.textAlign = 'center';
                   // cacheNote.style.marginTop = '0.3rem';
                   // container.appendChild(cacheNote);
                } catch (e) {
                    console.error('Error loading cached data:', e);
                }
            }
        });
}

// Update the Arsenal widget with game data
function updateArsenalWidget(data) {
    const container = document.getElementById('rockets-game-container');
    
    // Save to localStorage for offline fallback
    localStorage.setItem('arsenalGameData', JSON.stringify(data));
    localStorage.setItem('arsenalGameDataTime', Date.now().toString());
    
    // Check if we have games
    if (!data.games || data.games.length === 0) {
        container.innerHTML = '<div class="error-message">No Arsenal games found.</div>';
        return;
    }
    
    const game = data.games[0];
    console.log('Arsenal game data:', game);
    
    // Determine game status
    const isLive = game.status_state === 'in';
    const isCompleted = game.status_state === 'post';
    const isScheduled = game.status_state === 'pre';
    
    // Get team abbreviations and positions
    const arsenalAbbr = 'ARS';
    const isArsenalHome = game.is_arsenal_home;
    const opponentAbbr = isArsenalHome ? game.away_team : game.home_team;
    
    // Get positions (if available) and format with ordinal suffix
    const arsenalPos = isArsenalHome ? game.home_position : game.away_position;
    const opponentPos = isArsenalHome ? game.away_position : game.home_position;
    
    // Function to add ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
    function getOrdinalSuffix(num) {
        if (!num) return '';
        const j = num % 10;
        const k = num % 100;
        if (j === 1 && k !== 11) return num + 'st';
        if (j === 2 && k !== 12) return num + 'nd';
        if (j === 3 && k !== 13) return num + 'rd';
        return num + 'th';
    }
    
    // Format positions with ordinal suffixes
    const arsenalPosText = arsenalPos ? getOrdinalSuffix(arsenalPos) : '';
    const opponentPosText = opponentPos ? getOrdinalSuffix(opponentPos) : '';
    
    // Get scores
    let arsenalScore, opponentScore;
    
    if (isScheduled) {
        arsenalScore = '-';
        opponentScore = '-';
    } else {
        if (isArsenalHome) {
            arsenalScore = game.home_score !== null ? game.home_score : '-';
            opponentScore = game.away_score !== null ? game.away_score : '-';
        } else {
            arsenalScore = game.away_score !== null ? game.away_score : '-';
            opponentScore = game.home_score !== null ? game.home_score : '-';
        }
    }
    
    // Format time/status display
    let statusDisplay = '';
    let timeDisplay = '';
    
    if (isLive) {
        // Extract minute from display clock (e.g., "41'" becomes "41")
        const displayClock = game.display_clock;
        if (game.status_desc === 'Halftime') {
            statusDisplay = 'HT';
        } else if (displayClock) {
            // Remove quotes and extra characters
         //   statusDisplay = displayClock.replace(/['"]/g, '');
	    statusDisplay = displayClock.replace(/['"]/g, '') + "'";
        } else {
            statusDisplay = 'Live';
        }
        timeDisplay = '';
    } else if (isCompleted) {
        statusDisplay = 'FT';
        // Format date with day of week
        const gameDate = new Date(game.game_date);
        timeDisplay = gameDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    } else if (isScheduled) {
        // Format date and time for upcoming game with day of week
        const gameDate = new Date(game.game_date);
        const dateStr = gameDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
        const timeStr = gameDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).toLowerCase();
	statusDisplay = 'Upcoming';
        timeDisplay = `${dateStr}, ${timeStr} ET`;
    }
    
    // Get logo filenames - handle special cases
    const arsenalLogoFilename = 'arsenal';
    let opponentLogoFilename = opponentAbbr.toLowerCase();
    
    // Map team abbreviations to actual SVG filenames
    const logoMapping = {
        'ars': 'arsenal',
        'avl': 'villa', 
        'bou': 'bournemouth',
        'bre': 'brentford',
        'bha': 'brighton',
        'bur': 'burnley',
        'che': 'chelsea',
        'cry': 'palace',
        'eve': 'everton',
        'ful': 'fulham',
        'lee': 'leeds',
        'lei': 'leicester',  // if Leicester plays
        'liv': 'liverpool',
        'mnc': 'mancity',
	'mci': 'mancity',
        'mun': 'manutd',
        'man': 'manutd',  // alternate abbreviation
        'new': 'newcastle',
        'nfo': 'forest',
        'not': 'forest',  // Nottingham Forest alternate
        'sou': 'southampton',  // if Southampton plays
        'sun': 'sunderland',
        'tot': 'tottenham',
        'whu': 'westham',
        'wol': 'wolves',
        'ips': 'ipswich'  // if Ipswich plays
    };
    
    // Use the mapping, fallback to lowercase abbreviation if not found
    if (logoMapping[opponentLogoFilename]) {
        opponentLogoFilename = logoMapping[opponentLogoFilename];
    }
    
    // Home/away indicators
    const arsenalHomeAway = isArsenalHome ? 'H' : 'A';
    const opponentHomeAway = isArsenalHome ? 'A' : 'H';
    
    // Build the widget HTML
    const html = `
        <div class="game-info">
            <div class="team-info">
                <img class="team-logo" src="icons/${arsenalLogoFilename}.svg" alt="Arsenal">
                <div class="team-details">
                    <div class="team-name">${arsenalAbbr} (${arsenalHomeAway})</div>
                    <div class="team-location">${arsenalPosText}</div>
                </div>
                <span class="score">${arsenalScore}</span>
            </div>
            <div class="team-info">
                <img class="team-logo" src="icons/${opponentLogoFilename}.svg" alt="${opponentAbbr}">
                <div class="team-details">
                    <div class="team-name">${opponentAbbr} (${opponentHomeAway})</div>
                    <div class="team-location">${opponentPosText}</div>
                </div>
                <span class="score">${opponentScore}</span>
            </div>
        </div>
        <div class="game-status">${statusDisplay}</div>
        <div class="game-time">${timeDisplay}</div>
    `;
    
    container.innerHTML = html;
    console.log('Arsenal scoreboard widget updated');
}

// Update the Rockets widget with game data
function updateRocketsWidget(data) {
    const container = document.getElementById('rockets-game-container');
    
    // Add debugging logs
    console.log('Game data received:', data);
    
    // Force in-progress status for games that mention "Qtr" in status text
    for (let game of data.games) {
        if (game.game_status_text && game.game_status_text.includes("Qtr")) {
            if (game.game_status !== 2) {
                console.log("Forcing game to in-progress status:", game);
                game.game_status = 2; // Set to numeric value 2
            }
        }
    }
    
    // Save to localStorage for offline fallback
    localStorage.setItem('rocketsGameData', JSON.stringify(data));
    localStorage.setItem('rocketsGameDataTime', Date.now().toString());
    
    // Check if we have games
    if (!data.games || data.games.length === 0) {
        container.innerHTML = '<div class="error-message">No upcoming Rockets games found.</div>';
        return;
    }
    
    // Find the most relevant game
    let relevantGame = null;
    
    // Look for in-progress games - ensure numeric comparison
    const inProgressGames = data.games.filter(game => Number(game.game_status) === 2);
    
    if (inProgressGames.length > 0) {
        relevantGame = inProgressGames[0];
        console.log('Selected in-progress game:', relevantGame);
    }
    
    // If no in-progress game, look for today's game
    if (!relevantGame) {
        const today = new Date().toISOString().split('T')[0];
        const todayGames = data.games.filter(game => game.game_date.split('T')[0] === today);
        if (todayGames.length > 0) {
            relevantGame = todayGames[0];
            console.log('Selected today\'s game:', relevantGame);
        }
    }
    
    // If no today's game, use the first game in the list
    if (!relevantGame && data.games.length > 0) {
        relevantGame = data.games[0];
        console.log('Selected first available game:', relevantGame);
    }
    
    // If we still don't have a game, show an error
    if (!relevantGame) {
        container.innerHTML = '<div class="error-message">No game data available.</div>';
        return;
    }
    
    // Format the game date
    const gameDate = new Date(relevantGame.game_date);
    const formattedDate = gameDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
    
    // Format game time
    let formattedTime = "";
    const gameStatus = Number(relevantGame.game_status);
    
    if (gameStatus === 1) { // Scheduled game
        const timeMatch = relevantGame.game_status_text.match(/\d+:\d+\s+(am|pm)\s+ET/i);
        formattedTime = timeMatch ? timeMatch[0] : "Time TBD";
    } else if (gameStatus === 2) { // In-progress
        formattedTime = "Live Now";
    } else if (gameStatus === 3) { // Completed
        formattedTime = "Final";
    }
    
    // Determine whether Rockets are home or away
    const isRocketsHome = relevantGame.is_rockets_home;
    const rocketsTeam = "HOU";
    
    // Get opponent abbreviation
    let opponentTeam = isRocketsHome ? relevantGame.visitor_team : relevantGame.home_team;
    
    // Get scores
    const rocketsScore = isRocketsHome ? relevantGame.home_team_score : relevantGame.visitor_team_score;
    const opponentScore = isRocketsHome ? relevantGame.visitor_team_score : relevantGame.home_team_score;
    
    // Get logo filenames
    const rocketsLogoFilename = 'rockets';
    let opponentAbbr = (isRocketsHome ? relevantGame.visitor_team_abbr : relevantGame.home_team_abbr).toLowerCase();
    
    // Add home/away indicators
    const rocketsHomeAway = isRocketsHome ? "(H)" : "(A)";
    const opponentHomeAway = isRocketsHome ? "(A)" : "(H)";
    
    // Generate status text and time display based on game status
    let statusText = relevantGame.game_status_text;
    let timeDisplay = "";
    
    if (gameStatus === 2) {
        // Game in progress - show quarter and clock
        const periodText = relevantGame.period > 0 ? relevantGame.period : '1st';
        const clockText = relevantGame.game_clock || '';
        statusText = relevantGame.game_status_text.trim() || `${periodText} Qtr ${clockText}`;
        timeDisplay = "Live"; 
    } else if (gameStatus === 1) {
        // Upcoming game - show date and time
        statusText = "Upcoming";
        timeDisplay = `${formattedDate}, ${formattedTime}`;
    } else if (gameStatus === 3) {
        // Completed game - show just date for past games
        statusText = "Final";
        timeDisplay = `${formattedDate}`;
    }
    
    // Build the widget HTML
    const html = `
        <div class="game-info">
            <div class="team-info">
                <img class="team-logo" src="icons/${rocketsLogoFilename}.svg" alt="Houston Rockets">
                <div class="team-details">
                    <div class="team-name">${rocketsTeam}</div>
                    <div class="team-location">${rocketsHomeAway}</div>
                </div>
                <span class="score">${rocketsScore}</span>
            </div>
            <div class="team-info">
                <img class="team-logo" src="icons/${opponentAbbr}.svg" alt="${opponentTeam}">
                <div class="team-details">
                    <div class="team-name">${opponentTeam}</div>
                    <div class="team-location">${opponentHomeAway}</div>
                </div>
                <span class="score">${opponentScore}</span>
            </div>
        </div>
        <div class="game-status">${statusText}</div>
        <div class="game-date">${gameStatus === 2 ? "" : (gameStatus === 3 ? "" : "")}</div>
        <div class="game-time">${timeDisplay}</div>
    `;
    
    container.innerHTML = html;
    console.log('Rockets scoreboard widget updated');
}

// Display error message in the widget
function displayError(message) {
    const container = document.getElementById('rockets-game-container');
    container.innerHTML = `<div class="error-message">${message}</div>`;
}

// Google Custom Search Autocomplete
function initGoogleAutocomplete() {
    const API_KEY = 'ENTER KEY HERE';
    const CX_ID = 'ENTER CX ID HERE'; // Your Custom Search Engine ID
    
    const searchInput = document.querySelector('.search-input');
    const searchContainer = document.querySelector('.search-container');
    
    // Create suggestions dropdown
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'suggestions-container';
    suggestionsContainer.style.display = 'none';
    searchContainer.appendChild(suggestionsContainer);
    
    let currentSuggestions = [];
    let selectedIndex = -1;
    let debounceTimer;
    
    // Fetch autocomplete suggestions using Google's autocomplete endpoint
    async function fetchSuggestions(query) {
        if (query.length < 2) { // Changed from 2 to 1
            hideSuggestions();
            return;
        }
        
        clearTimeout(debounceTimer);
        
        debounceTimer = setTimeout(async () => {
            try {
                // Use Google's autocomplete endpoint
                const url = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`;
                
                // Since this is CORS-restricted, we'll use JSONP approach
                const script = document.createElement('script');
                const callbackName = 'autocomplete_' + Date.now();
                
                window[callbackName] = function(data) {
                    if (data && data[1] && data[1].length > 0) {
                        showSuggestions(data[1]);
                    } else {
                        hideSuggestions();
                    }
                    // Clean up
                    document.body.removeChild(script);
                    delete window[callbackName];
                };
                
                script.src = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}&callback=${callbackName}`;
                document.body.appendChild(script);
                
            } catch (error) {
                console.error('Error fetching autocomplete suggestions:', error);
                hideSuggestions();
            }
        }, 200);
    }
    
    // Alternative: Use Custom Search API for suggestions (if you have CX setup)
    async function fetchCustomSearchSuggestions(query) {
        if (query.length < 1) {
            hideSuggestions();
            return;
        }
        
        clearTimeout(debounceTimer);
        
        debounceTimer = setTimeout(async () => {
            try {
                // Note: This requires a Custom Search Engine to be set up
                const response = await fetch(
                    `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX_ID}&q=${encodeURIComponent(query)}&num=8`
                );
                
                if (!response.ok) {
                    throw new Error('Custom Search API request failed');
                }
                
                const data = await response.json();
                
                if (data.items && data.items.length > 0) {
                    // Extract relevant search terms from the results
                    const suggestions = data.items.map(item => {
                        // Create suggestions based on the search results
                        return item.title.split(' ').slice(0, 3).join(' ');
                    }).filter((suggestion, index, array) => 
                        // Remove duplicates and ensure relevance
                        array.indexOf(suggestion) === index && 
                        suggestion.toLowerCase().includes(query.toLowerCase())
                    );
                    
                    if (suggestions.length > 0) {
                        showSuggestions(suggestions);
                    } else {
                        hideSuggestions();
                    }
                } else {
                    hideSuggestions();
                }
            } catch (error) {
                console.error('Error fetching custom search suggestions:', error);
                // Fallback to regular Google suggestions
                fetchSuggestions(query);
            }
        }, 200);
    }
    
    function showSuggestions(suggestions) {
        currentSuggestions = suggestions;
        selectedIndex = -1;
        
        // Clear existing suggestions
        suggestionsContainer.innerHTML = '';
        
        // Remove any existing classes
        suggestionsContainer.classList.remove('hide');
        
        // Add suggestions with stagger animation
        suggestions.slice(0, 8).forEach((suggestion, index) => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = suggestion;
            item.addEventListener('click', () => {
                selectSuggestion(suggestion);
            });
            item.addEventListener('mouseenter', () => {
                selectedIndex = index;
                highlightSuggestion(selectedIndex);
            });
            suggestionsContainer.appendChild(item);
            
            // Trigger stagger animation
            setTimeout(() => {
                item.classList.add('animate-in');
            }, index * 30); // 30ms delay between each item
        });
        
        // Show the dropdown with animation
        suggestionsContainer.style.display = 'block';
        // Force a reflow to ensure the display change takes effect
        suggestionsContainer.offsetHeight;
        // Add the show class to trigger animation
        suggestionsContainer.classList.add('show');
    }
    
    function hideSuggestions() {
        selectedIndex = -1;
        currentSuggestions = [];
        
        // Add hide animation
        suggestionsContainer.classList.remove('show');
        suggestionsContainer.classList.add('hide');
        
        // Actually hide after animation completes
        setTimeout(() => {
            suggestionsContainer.style.display = 'none';
            suggestionsContainer.classList.remove('hide');
            
            // Remove animate-in class from all items
            const items = suggestionsContainer.querySelectorAll('.suggestion-item');
            items.forEach(item => item.classList.remove('animate-in'));
        }, 200); // Match the CSS transition duration
    }
    
    function selectSuggestion(suggestion) {
        searchInput.value = suggestion;
        hideSuggestions();
        const searchForm = document.querySelector('.search-form');
        searchForm.submit();
    }
    
    function highlightSuggestion(index) {
        const items = suggestionsContainer.querySelectorAll('.suggestion-item');
        items.forEach((item, i) => {
            item.classList.toggle('selected', i === index);
        });
    }
    
    // Event listeners
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (CX_ID && CX_ID !== 'YOUR_SEARCH_ENGINE_ID') {
            fetchCustomSearchSuggestions(query);
        } else {
            fetchSuggestions(query);
        }
    });
    
    searchInput.addEventListener('keydown', (e) => {
        const items = suggestionsContainer.querySelectorAll('.suggestion-item');
        
        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
                highlightSuggestion(selectedIndex);
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                highlightSuggestion(selectedIndex);
                break;
                
            case 'Enter':
                if (selectedIndex >= 0 && items[selectedIndex]) {
                    e.preventDefault();
                    selectSuggestion(items[selectedIndex].textContent);
                }
                break;
                
            case 'Escape':
                e.preventDefault();
                hideSuggestions();
                searchInput.blur();
                break;
                
            case 'Tab':
                if (selectedIndex >= 0 && items[selectedIndex]) {
                    e.preventDefault();
                    selectSuggestion(items[selectedIndex].textContent);
                }
                break;
        }
    });
    
    searchInput.addEventListener('blur', (e) => {
        // Delay hiding to allow clicks on suggestions
        setTimeout(() => {
            hideSuggestions();
        }, 150);
    });
    
    searchInput.addEventListener('focus', (e) => {
        const query = e.target.value.trim();
        if (query.length >= 1) {
            if (CX_ID && CX_ID !== 'YOUR_SEARCH_ENGINE_ID') {
                fetchCustomSearchSuggestions(query);
            } else {
                fetchSuggestions(query);
            }
        }
    });
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchContainer.contains(e.target)) {
            hideSuggestions();
        }
    });
}
