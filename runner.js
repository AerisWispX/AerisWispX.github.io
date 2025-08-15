// Configuration
const PHP_API_URL = 'https://watchasports.com/stream.php';
const UPDATE_INTERVAL_NORMAL = 30000; // 30 seconds for normal matches
const UPDATE_INTERVAL_LIVE = 10000;   // 10 seconds when live matches exist
const MAX_RETRIES = 3;

// Global state
let currentMatch = null;
let updateInterval = null;
let retryCount = 0;
let isUpdating = false;

// Cache DOM elements to avoid repeated queries
const domCache = {
    container: null,
    homeTeam: null,
    awayTeam: null,
    homeLogo: null,
    awayLogo: null,
    timeElement: null,
    infoBox: null,
    dateElement: null,
    titleElement: null
};

// Initialize DOM cache
function initDOMCache() {
    const container = document.getElementById('match-container');
    if (!container) return false;
    
    domCache.container = container;
    domCache.homeTeam = container.querySelector('.matchname.left');
    domCache.awayTeam = container.querySelector('.matchname.right');
    domCache.homeLogo = container.querySelector('.matchlogo.left img');
    domCache.awayLogo = container.querySelector('.matchlogo.right img');
    domCache.timeElement = container.querySelector('.matchTime .stsrt');
    domCache.infoBox = container.querySelector('.info ul');
    domCache.dateElement = container.querySelector('[data-start]');
    domCache.titleElement = document.querySelector('.boxstitle strong');
    
    return true;
}

// Fast logo update with error handling
function updateLogo(imgElement, logoUrl, teamName) {
    if (!imgElement || !logoUrl) return;
    
    // Only update if src is different
    if (imgElement.src !== logoUrl) {
        imgElement.onerror = () => {
            imgElement.src = `https://via.placeholder.com/70x70/cccccc/ffffff?text=${encodeURIComponent(teamName.substring(0, 3))}`;
        };
        imgElement.src = logoUrl;
        imgElement.alt = teamName;
        imgElement.title = teamName;
    }
}

// Fast team name and score update
function updateTeamDisplay(match) {
    if (!domCache.homeTeam || !domCache.awayTeam) return;
    
    const showScores = match.isLive || match.isFinished || match.homeScore > 0 || match.awayScore > 0;
    
    if (showScores) {
        // Show scores
        domCache.homeTeam.innerHTML = `${match.home} <b>(${match.homeScore})</b>`;
        domCache.awayTeam.innerHTML = `<b>(${match.awayScore})</b> ${match.away}`;
        
        // Update time display with scores
        if (domCache.timeElement) {
            const statusText = match.isLive ? 
                `<span class="status-indicator status-live"></span>Live` : 
                match.isFinished ? 'FT' : 'Soon';
            
            domCache.timeElement.innerHTML = `
                <b>${match.homeScore} - ${match.awayScore}</b><br>
                <small>${statusText}</small>
            `;
        }
    } else {
        // Show team names only
        domCache.homeTeam.textContent = match.home;
        domCache.awayTeam.textContent = match.away;
        
        // Show scheduled time
        if (domCache.timeElement && match.localTime) {
            domCache.timeElement.innerHTML = `
                <span class="status-indicator status-scheduled"></span>
                ${match.localTime}
            `;
        }
    }
}

// Update match info section
function updateMatchInfo(match) {
    if (!domCache.infoBox) return;
    
    const statusText = match.isLive ? 'LIVE' : 
                      match.isFinished ? 'FINAL' : 'UPCOMING';
    
    const matchdayInfo = match.matchday ? `Matchday ${match.matchday}` : 
                        match.competition || 'Premier League';
    
    domCache.infoBox.innerHTML = `
        <li><span>${statusText}</span></li>
        <li><span><b>PREMIER LEAGUE</b></span></li>
        <li><span class="lgnm">${matchdayInfo}</span></li>
    `;
}

// Apply visual styling based on match status
function updateMatchStyling(match) {
    if (!domCache.container) return;
    
    // Remove all status classes
    domCache.container.classList.remove('match-finished', 'match-scheduled', 'match-live');
    
    // Add appropriate class
    if (match.isLive) {
        domCache.container.classList.add('match-live');
    } else if (match.isFinished) {
        domCache.container.classList.add('match-finished');
    } else {
        domCache.container.classList.add('match-scheduled');
    }
}

// Update page title based on match status
function updatePageTitle(matches) {
    if (!domCache.titleElement || !matches.length) return;
    
    const liveCount = matches.filter(m => m.isLive).length;
    
    if (liveCount > 0) {
        domCache.titleElement.innerHTML = `🔴 Live Matches (${liveCount})`;
    } else {
        domCache.titleElement.innerHTML = "Today's Matches";
    }
}

// Select the most relevant match to display
function selectRelevantMatch(matches) {
    if (!matches.length) return null;
    
    // Priority: Live > Today's matches > Tomorrow's matches > Recent finished > Others
    const liveMatches = matches.filter(m => m.isLive);
    if (liveMatches.length) return liveMatches[0];
    
    const todayMatches = matches.filter(m => m.isToday && !m.isFinished);
    if (todayMatches.length) return todayMatches[0];
    
    const todayFinished = matches.filter(m => m.isToday && m.isFinished);
    if (todayFinished.length) return todayFinished[0];
    
    const tomorrowMatches = matches.filter(m => m.isTomorrow);
    if (tomorrowMatches.length) return tomorrowMatches[0];
    
    // Return first match as fallback
    return matches[0];
}

// Main update function - optimized for speed
async function updateMatchData() {
    if (isUpdating) return; // Prevent concurrent updates
    isUpdating = true;
    
    try {
        console.log('⚽ Fetching match data...');
        
        const response = await fetch(`${PHP_API_URL}?competition=PL&timezone=Asia/Kolkata&_t=${Date.now()}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-cache'
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const apiData = await response.json();
        console.log('📊 API Response:', `${apiData.matches?.length || 0} matches, from cache: ${apiData.query_info?.from_cache}`);

        if (!apiData.success || !Array.isArray(apiData.matches)) {
            throw new Error(apiData.error || 'Invalid API response');
        }

        const matches = apiData.matches;
        if (matches.length === 0) {
            console.log('⚠️ No matches found');
            return;
        }

        // Select most relevant match
        const selectedMatch = selectRelevantMatch(matches);
        if (!selectedMatch) return;

        // Skip update if match data hasn't changed (basic comparison)
        if (currentMatch && 
            currentMatch.id === selectedMatch.id &&
            currentMatch.homeScore === selectedMatch.homeScore &&
            currentMatch.awayScore === selectedMatch.awayScore &&
            currentMatch.status === selectedMatch.status) {
            console.log('📋 Match data unchanged, skipping DOM updates');
            return;
        }

        console.log(`🔄 Updating: ${selectedMatch.home} vs ${selectedMatch.away} (${selectedMatch.status})`);

        // Fast DOM updates
        updateLogo(domCache.homeLogo, selectedMatch.homeLogo, selectedMatch.home);
        updateLogo(domCache.awayLogo, selectedMatch.awayLogo, selectedMatch.away);
        updateTeamDisplay(selectedMatch);
        updateMatchInfo(selectedMatch);
        updateMatchStyling(selectedMatch);
        updatePageTitle(matches);

        // Store current match
        currentMatch = selectedMatch;
        retryCount = 0; // Reset retry count on success

        // Adjust update interval based on live matches
        const hasLiveMatches = matches.some(m => m.isLive);
        const newInterval = hasLiveMatches ? UPDATE_INTERVAL_LIVE : UPDATE_INTERVAL_NORMAL;
        
        if (updateInterval && 
            (hasLiveMatches && updateInterval._interval !== UPDATE_INTERVAL_LIVE) ||
            (!hasLiveMatches && updateInterval._interval !== UPDATE_INTERVAL_NORMAL)) {
            
            console.log(`⏰ Adjusting update interval to ${newInterval/1000}s`);
            clearInterval(updateInterval);
            updateInterval = setInterval(updateMatchData, newInterval);
            updateInterval._interval = newInterval;
        }

        console.log(`✅ Updated: ${selectedMatch.home} ${selectedMatch.homeScore}-${selectedMatch.awayScore} ${selectedMatch.away}`);

    } catch (error) {
        console.error('❌ Update failed:', error.message);
        handleUpdateError(error);
    } finally {
        isUpdating = false;
    }
}

// Handle update errors with retry logic
function handleUpdateError(error) {
    retryCount++;
    
    if (retryCount <= MAX_RETRIES) {
        const retryDelay = Math.min(5000 * retryCount, 30000); // Max 30s delay
        console.log(`🔄 Retrying in ${retryDelay/1000}s... (${retryCount}/${MAX_RETRIES})`);
        setTimeout(updateMatchData, retryDelay);
    } else {
        console.error('❌ Max retries reached');
        
        // Show error in UI
        if (domCache.timeElement) {
            domCache.timeElement.innerHTML = '<span style="color: red; font-size: 12px;">⚠️ Connection Error</span>';
        }
        
        // Reset retry count after 2 minutes
        setTimeout(() => {
            retryCount = 0;
            updateMatchData();
        }, 120000);
    }
}

// Initialize the system
async function initialize() {
    console.log('🚀 Initializing Match Updater...');
    
    // Cache DOM elements
    if (!initDOMCache()) {
        console.error('❌ Failed to initialize DOM cache');
        return;
    }
    
    // Initial update
    await updateMatchData();
    
    // Set up regular updates
    updateInterval = setInterval(updateMatchData, UPDATE_INTERVAL_NORMAL);
    updateInterval._interval = UPDATE_INTERVAL_NORMAL;
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (updateInterval) clearInterval(updateInterval);
    });
    
    console.log('✅ Match Updater initialized');
}

// Expose control functions
window.matchUpdater = {
    updateNow: updateMatchData,
    getCurrentMatch: () => currentMatch,
    getStatus: () => ({
        isUpdating,
        retryCount,
        interval: updateInterval?._interval,
        currentMatch: currentMatch?.home + ' vs ' + currentMatch?.away
    }),
    forceRefresh: async () => {
        currentMatch = null; // Force update even if data seems same
        await updateMatchData();
    }
};

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
          }

