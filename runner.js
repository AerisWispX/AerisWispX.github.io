// Simple script to update only the matches present in HTML
const API_URL = 'https://watchasports.in/api/matches';

// Format time display
function formatTime(status, currentTime, isFinished) {
  if (!status) return 'Unknown';

  const statusLower = status.toLowerCase();
  
  if (statusLower === 'finished' || statusLower === 'ended' || isFinished) {
    return 'FT';
  }
  
  if (statusLower === 'halftime') {
    return 'HT';
  }
  
  if (currentTime && currentTime > 0) {
    if (currentTime <= 45) {
      return `${currentTime}'`;
    } else if (currentTime <= 90) {
      return `${currentTime}'`;
    } else {
      return `90+${currentTime - 90}'`;
    }
  }
  
  if (statusLower.includes('postponed')) return 'Postponed';
  if (statusLower.includes('cancelled')) return 'Cancelled';
  
  return status;
}

// Format scheduled time
function formatScheduledTime(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

// Check if match should show scores
function shouldShowScores(match) {
  return match.isLive || 
         match.status?.toLowerCase() === 'finished' ||
         match.status?.toLowerCase() === 'ended' ||
         (match.homeScore > 0 || match.awayScore > 0);
}

// Find all match IDs in the current page
function getMatchIdsFromPage() {
  const matchIds = [];
  
  // Look for elements with data-start attributes (from your HTML)
  const dateElements = document.querySelectorAll('[data-start]');
  dateElements.forEach(element => {
    const id = element.id;
    if (id && id !== '') {
      matchIds.push(id);
    }
  });
  
  // Also look for any element with class that might contain match ID
  const containers = document.querySelectorAll('.containermatch a[href*="html"]');
  containers.forEach(container => {
    // Extract ID from link or data attributes if needed
    const href = container.getAttribute('href');
    if (href) {
      // You can extract ID from URL pattern if needed
      // For now, we'll use the dateElement IDs found above
    }
  });
  
  console.log(`📋 Found ${matchIds.length} matches on page:`, matchIds);
  return matchIds;
}

// Update match display
function updateMatchDisplay(matchId, matchData) {
  const container = document.getElementById(matchId);
  if (!container) return;

  const parent = container.closest('.containermatch');
  if (!parent) return;

  const home = parent.querySelector('.matchname.left');
  const away = parent.querySelector('.matchname.right'); 
  const timeBox = parent.querySelector('.matchTime .stsrt');

  if (!home || !away || !timeBox) return;

  const showScores = shouldShowScores(matchData);
  
  if (showScores) {
    // Show live/finished match with scores
    const formatScorers = (scorers) => {
      if (!scorers || scorers.length === 0) return '';
      return scorers.map(scorer => 
        `${scorer.name} ${scorer.minute}'`
      ).join(', ');
    };

    // Update team names with scores
    home.innerHTML = `
      ${matchData.home} <b>(${matchData.homeScore || 0})</b>
      ${matchData.homeScorers?.length > 0 ? 
        `<div class="scorers">${formatScorers(matchData.homeScorers)}</div>` : ''}
    `;
    
    away.innerHTML = `
      <b>(${matchData.awayScore || 0})</b> ${matchData.away}
      ${matchData.awayScorers?.length > 0 ? 
        `<div class="scorers">${formatScorers(matchData.awayScorers)}</div>` : ''}
    `;

    // Update time box with scores
    timeBox.innerHTML = `<b>${matchData.homeScore || 0} - ${matchData.awayScore || 0}</b>`;
    
    // Update status
    const formattedTime = formatTime(
      matchData.status, 
      matchData.currentTime, 
      matchData.status?.toLowerCase() === 'finished'
    );
    container.innerHTML = `<span>${formattedTime}</span>`;
    
  } else {
    // Show scheduled match
    home.innerHTML = matchData.home;
    away.innerHTML = matchData.away;
    
    if (matchData.timestamp) {
      timeBox.innerHTML = formatScheduledTime(matchData.timestamp);
    }
    
    container.innerHTML = `<span>vs</span>`;
  }

  console.log(`✅ Updated match ${matchId}: ${matchData.home} vs ${matchData.away}`);
}

// Fetch and update matches
async function updateMatches() {
  try {
    const matchIds = getMatchIdsFromPage();
    
    if (matchIds.length === 0) {
      console.log('📋 No matches found on page');
      return;
    }

    console.log(`🔄 Requesting updates for ${matchIds.length} matches...`);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ matchIds })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log(`📊 Received data for ${data.delivered}/${data.requested} matches`);

    // Update each match
    Object.entries(data.matches).forEach(([matchId, matchData]) => {
      updateMatchDisplay(matchId, matchData);
    });

    console.log(`✅ Updated ${Object.keys(data.matches).length} matches`);

  } catch (error) {
    console.error('❌ Failed to update matches:', error);
  }
}

// Initialize and start updates
console.log('🚀 Starting match updater...');

// Initial update
updateMatches();

// Update every 30 seconds
setInterval(updateMatches, 30000);

// Update when page becomes visible again
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    console.log('📱 Page visible again, updating matches...');
    updateMatches();
  }
});
