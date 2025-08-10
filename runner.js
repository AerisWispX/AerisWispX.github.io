const LIVE_API = 'https://watchasports.in/api/livescores';
const SCHEDULED_API = 'https://watchasports.in/api/scheduled';

// Timer formatter - Uses actual match time from API incidents
function formatTime(status, matchTime, addedTime, isLive, isFinished) {
  if (!status) return 'Unknown';

  // Handle finished matches
  const statusLower = status.toLowerCase();
  if (statusLower === 'finished' || statusLower === 'ended' || isFinished) {
    return 'FT';
  }

  // If we have actual match time from incidents, use that
  if (matchTime !== undefined && matchTime !== null) {
    const time = parseInt(matchTime);
    
    switch (statusLower) {
      case '1st half':
        return time <= 45 
          ? `1st half - ${time}'`
          : `1st half - 45+${time - 45}'`;
          
      case '2nd half':
        return time <= 90 
          ? `2nd half - ${time}'`
          : `2nd half - 90+${time - 90}'`;
          
      case 'extra time':
      case 'extra time 1st half':
        return time <= 105 
          ? `ET 1st - ${time}'`
          : `ET 1st - 105+${time - 105}'`;
          
      case 'extra time 2nd half':
        return time <= 120 
          ? `ET 2nd - ${time}'`
          : `ET 2nd - 120+${time - 120}'`;
          
      case 'halftime':
        return 'HT';
        
      case 'started':
        return `${time}'`;
        
      default:
        return `${time}'`;
    }
  }

  // Fallback to status text
  switch (statusLower) {
    case 'finished':
    case 'ended':
      return 'FT';
    case 'postponed':
      return 'Postponed';
    case 'cancelled':
      return 'Cancelled';
    case 'halftime':
      return 'HT';
    default:
      return status;
  }
}

// Format scheduled match time
function formatScheduledTime(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

// Check if match has finished based on multiple criteria
function isMatchFinished(match) {
  const statusLower = (match.status || '').toLowerCase();
  
  // Direct status check
  if (statusLower === 'finished' || statusLower === 'ended') {
    return true;
  }
  
  // Check if match is not live and has scores
  if (!match.isLive && (match.homeScore > 0 || match.awayScore > 0)) {
    return true;
  }
  
  // Check if current time indicates match is over (90+ minutes and not live)
  if (!match.isLive && match.currentTime && match.currentTime >= 90) {
    return true;
  }
  
  return false;
}

// Check if match should show scores (live or finished)
function shouldShowScores(match) {
  return match.isLive || 
         isMatchFinished(match) || 
         (match.homeScore > 0 || match.awayScore > 0);
}

// Update DOM with both live and scheduled matches
async function updateMatchData() {
  try {
    // Fetch both live and scheduled matches
    const [liveRes, scheduledRes] = await Promise.all([
      fetch(LIVE_API).catch(() => ({ ok: false })),
      fetch(SCHEDULED_API).catch(() => ({ ok: false }))
    ]);

    let allMatches = new Map(); // Use Map to avoid duplicates by ID
    
    // Process live matches
    if (liveRes.ok) {
      const liveData = await liveRes.json();
      console.log('Live API response:', liveData); // Debug log
      if (liveData && liveData.matches) {
        liveData.matches.forEach(match => {
          console.log(`Live match ${match.id}: ${match.home} ${match.homeScore}-${match.awayScore} ${match.away}`); // Debug log
          allMatches.set(match.id, { ...match, isLive: true });
        });
      }
    }

    // Process scheduled matches
    if (scheduledRes.ok) {
      const scheduledData = await scheduledRes.json();
      console.log('Scheduled API response:', scheduledData); // Debug log
      if (scheduledData && scheduledData.matches) {
        scheduledData.matches.forEach(match => {
          // Only add if not already in live matches
          if (!allMatches.has(match.id)) {
            console.log(`Scheduled match ${match.id}: ${match.home} vs ${match.away}`); // Debug log
            allMatches.set(match.id, { ...match, isLive: false });
          }
        });
      }
    }

    // Update each match in the DOM
    allMatches.forEach(match => {
      const container = document.getElementById(match.id);
      if (container) {
        const parent = container.closest('.containermatch');
        if (!parent) return;

        const home = parent.querySelector('.matchname.left');
        const away = parent.querySelector('.matchname.right');
        const timeBox = parent.querySelector('.matchTime .stsrt');

        const matchFinished = isMatchFinished(match);
        const showScores = shouldShowScores(match);

        if (showScores) {
          // Live or finished match - show scores and scorers
          if (home && away) {
            // Format scorer names with minutes if available
            const formatScorers = (scorers) => {
              if (!scorers || scorers.length === 0) return '';
              return scorers.map(scorer => {
                if (typeof scorer === 'object' && scorer.name && scorer.minute) {
                  return `${scorer.name} ${scorer.minute}'`;
                }
                return typeof scorer === 'string' ? scorer : scorer.name || '';
              }).join(', ');
            };

            // Ensure scores are numbers and default to 0
            const homeScore = parseInt(match.homeScore) || 0;
            const awayScore = parseInt(match.awayScore) || 0;

            console.log(`Updating match ${match.id}: ${match.home} ${homeScore}-${awayScore} ${match.away}`); // Debug log

            home.innerHTML = `
              ${match.home} <b>(${homeScore})</b>
              ${match.homeScorers && match.homeScorers.length > 0 ? 
                `<div class="scorers">${formatScorers(match.homeScorers)}</div>` : ''}
            `;
            
            away.innerHTML = `
              <b>(${awayScore})</b> ${match.away}
              ${match.awayScorers && match.awayScorers.length > 0 ? 
                `<div class="scorers">${formatScorers(match.awayScorers)}</div>` : ''}
            `;
          }

          // Update time display based on match state
          if (timeBox) {
            const homeScore = parseInt(match.homeScore) || 0;
            const awayScore = parseInt(match.awayScore) || 0;
            
            if (matchFinished) {
              // For finished matches, show final score
              timeBox.innerHTML = `<b>${homeScore} - ${awayScore}</b>`;
            } else {
              // For live matches, show current score
              timeBox.innerHTML = `<b>${homeScore} - ${awayScore}</b>`;
            }
          }

          // Update timer with match status
          const formattedTime = formatTime(
            match.status, 
            match.currentTime, 
            match.addedTime, 
            match.isLive, 
            matchFinished
          );
          container.innerHTML = `<span>${formattedTime}</span>`;

        } else {
          // Scheduled match - show original team names and scheduled time
          if (home && away) {
            home.innerHTML = match.home;
            away.innerHTML = match.away;
          }

          if (timeBox) {
            timeBox.innerHTML = formatScheduledTime(match.timestamp);
          }

          // Show "vs" for scheduled matches
    
        }
      }
    });

    console.log(`✅ Updated ${allMatches.size} matches (${Array.from(allMatches.values()).filter(m => m.isLive).length} live, ${Array.from(allMatches.values()).filter(m => isMatchFinished(m)).length} finished)`);
  } catch (err) {
    console.error('❌ Failed to update match data:', err);
  }
}

// Initialize and start updates
updateMatchData();
setInterval(updateMatchData, 30000); // Update every 30 seconds
