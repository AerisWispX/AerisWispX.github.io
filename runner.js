// Configuration - Update these URLs to match your setup
const PHP_API_URL = 'stream.php';
const MATCH_DETAILS_URL = 'stream.php';

// Cache for match details to avoid excessive API calls
const matchDetailsCache = new Map();

// Simple timer formatter - removed live indicator and simplified
function formatTime(status, utcDate, isFinished) {
  if (!status) return 'Unknown';

  const statusLower = status.toLowerCase();
  
  // Handle finished matches
  if (statusLower === 'finished' || isFinished) {
    return 'FT';
  }

  // Handle live matches - simplified without time display
  if (statusLower === 'live' || statusLower === 'in_play') {
    return 'Live';
  }

  // Handle other statuses
  switch (statusLower) {
    case 'scheduled':
    case 'timed':
      return formatScheduledTime(utcDate);
    case 'postponed':
      return 'Postponed';
    case 'cancelled':
      return 'Cancelled';
    case 'halftime':
    case 'half_time':
      return 'HT';
    case 'paused':
      return 'Paused';
    default:
      return formatScheduledTime(utcDate);
  }
}

// Format scheduled match time using IST timezone
function formatScheduledTime(utcDate) {
  if (!utcDate) return 'TBD';
  
  const date = new Date(utcDate);
  
  // Format for Indian Standard Time (IST)
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  });
}

// Check if match should show scores
function shouldShowScores(match) {
  return match.isLive || match.isFinished || 
         (match.homeScore > 0 || match.awayScore > 0);
}

// Format goalscorers display
function formatScorers(scorers) {
  if (!scorers || scorers.length === 0) return '';
  
  return scorers.map(scorer => {
    const minute = scorer.minute ? `${scorer.minute}'` : '';
    const type = scorer.type === 'OWN_GOAL' ? ' (OG)' : 
                 scorer.type === 'PENALTY' ? ' (P)' : '';
    return `${scorer.name} ${minute}${type}`;
  }).join(', ');
}

// Get detailed match information including goalscorers
async function getMatchDetails(matchId) {
  if (matchDetailsCache.has(matchId)) {
    return matchDetailsCache.get(matchId);
  }
  
  try {
    const response = await fetch(`${MATCH_DETAILS_URL}?match_id=${matchId}&details=1`);
    if (response.ok) {
      const details = await response.json();
      matchDetailsCache.set(matchId, details);
      return details;
    }
  } catch (error) {
    console.error(`Failed to get details for match ${matchId}:`, error);
  }
  
  return { homeScorers: [], awayScorers: [], goals: [] };
}

// Update team logos
function updateTeamLogos(match, parent) {
  const homeLogoImg = parent.querySelector('.matchlogo.left img');
  const awayLogoImg = parent.querySelector('.matchlogo.right img');
  
  if (homeLogoImg && match.homeLogo) {
    homeLogoImg.src = match.homeLogo;
    homeLogoImg.onerror = function() {
      this.src = 'https://via.placeholder.com/70x70/cccccc/ffffff?text=' + 
                 encodeURIComponent(match.home.substring(0, 3));
    };
  }
  
  if (awayLogoImg && match.awayLogo) {
    awayLogoImg.src = match.awayLogo;
    awayLogoImg.onerror = function() {
      this.src = 'https://via.placeholder.com/70x70/cccccc/ffffff?text=' + 
                 encodeURIComponent(match.away.substring(0, 3));
    };
  }
}

// Main function to update match data - simplified
async function updateMatchData() {
  try {
    console.log('📄 Fetching match data from PHP API...');
    
    const response = await fetch(`${PHP_API_URL}?matchday=22&competition=PL`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiData = await response.json();
    console.log('📥 PHP API response:', apiData);

    if (!apiData.success || !Array.isArray(apiData.matches)) {
      throw new Error('Invalid response format or API error: ' + (apiData.error || 'Unknown error'));
    }

    const matches = apiData.matches;
    console.log(`📊 Processing ${matches.length} matches`);

    // Update each match in the DOM
    for (const match of matches) {
      const container = document.getElementById(match.id);
      if (container) {
        const parent = container.closest('.containermatch');
        if (!parent) continue;

        const home = parent.querySelector('.matchname.left');
        const away = parent.querySelector('.matchname.right');
        const timeBox = parent.querySelector('.matchTime .stsrt');
        const infoBox = parent.querySelector('.info ul');

        console.log(`⚽ Updating match ${match.id}: ${match.home} vs ${match.away}, Status: ${match.status}`);

        // Update team logos
        updateTeamLogos(match, parent);

        // Get detailed match info for live/finished matches
        let matchDetails = { homeScorers: [], awayScorers: [], goals: [] };
        if (match.isLive || match.isFinished) {
          matchDetails = await getMatchDetails(match.id);
        }

        const showScores = shouldShowScores(match);

        if (showScores) {
          // Live or finished match - show scores and scorers
          if (home && away) {
            const homeScorersHtml = matchDetails.homeScorers.length > 0 ? 
              `<div class="scorers">${formatScorers(matchDetails.homeScorers)}</div>` : '';
            
            const awayScorersHtml = matchDetails.awayScorers.length > 0 ? 
              `<div class="scorers">${formatScorers(matchDetails.awayScorers)}</div>` : '';

            home.innerHTML = `${match.home} <b>(${match.homeScore})</b>${homeScorersHtml}`;
            away.innerHTML = `<b>(${match.awayScore})</b> ${match.away}${awayScorersHtml}`;
          }

          // Update score display in time box
          if (timeBox) {
            timeBox.innerHTML = `<b>${match.homeScore} - ${match.awayScore}</b>`;
          }

        } else {
          // Scheduled match - show original team names and scheduled time
          if (home && away) {
            home.innerHTML = match.home;
            away.innerHTML = match.away;
          }

          if (timeBox) {
            const scheduledTime = formatScheduledTime(match.utcDate);
            timeBox.innerHTML = scheduledTime;
          }
        }

        // Update match status/time - simplified without live indicator
        const formattedTime = formatTime(match.status, match.utcDate, match.isFinished);
        container.innerHTML = `<span>${formattedTime}</span>`;

        // Apply simple styling based on match status
        if (match.isFinished) {
          parent.classList.add('match-finished');
          parent.classList.remove('match-scheduled');
        } else {
          parent.classList.add('match-scheduled');
          parent.classList.remove('match-finished');
        }

        // Update match info
        if (infoBox) {
          infoBox.innerHTML = `
            <li><span>Matchday ${match.matchday}</span></li>
            <li><span><b>${match.competition}</b></span></li>
            <li><span class="lgnm">${match.status}</span></li>
          `;
        }

      } else {
        console.warn(`⚠️ No container found for match ID: ${match.id}`);
      }
    }

    const liveCount = matches.filter(m => m.isLive).length;
    const finishedCount = matches.filter(m => m.isFinished).length;
    const scheduledCount = matches.length - liveCount - finishedCount;

    console.log(`✅ Updated ${matches.length} matches (${liveCount} live, ${finishedCount} finished, ${scheduledCount} scheduled)`);

  } catch (error) {
    console.error('❌ Failed to update match data:', error);
    
    // Show error message in the UI
    const errorContainer = document.querySelector('.containermatch .matchTime .stsrt');
    if (errorContainer) {
      errorContainer.innerHTML = '<span style="color: red; font-size: 12px;">⚠️ Error loading matches</span>';
    }
  }
}

// Enhanced initialization with retry logic
async function initializeMatchUpdates() {
  const maxRetries = 3;
  let retryCount = 0;

  const tryUpdate = async () => {
    try {
      await updateMatchData();
      retryCount = 0; // Reset on success
    } catch (error) {
      retryCount++;
      console.error(`Update failed (attempt ${retryCount}/${maxRetries}):`, error);
      
      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying in ${5 * retryCount} seconds...`);
        setTimeout(tryUpdate, 5000 * retryCount);
      } else {
        console.error('❌ Max retries reached. Will try again in 60 seconds.');
        setTimeout(() => {
          retryCount = 0;
          tryUpdate();
        }, 60000);
      }
    }
  };

  // Initial update
  await tryUpdate();
  
  // Set up regular updates
  const updateInterval = setInterval(tryUpdate, 30000); // Update every 30 seconds
  
  // Clean up interval on page unload
  window.addEventListener('beforeunload', () => {
    clearInterval(updateInterval);
  });
  
  console.log('🚀 Match update system initialized - updating every 30 seconds');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeMatchUpdates);
} else {
  initializeMatchUpdates();
}

// Export functions for manual control
window.matchUpdater = {
  updateNow: updateMatchData,
  clearCache: () => matchDetailsCache.clear(),
  getCache: () => Array.from(matchDetailsCache.entries())
};
