// Enhanced client script with better error handling and fallbacks
class MatchUpdater {
  constructor(apiUrl = 'https://watchasports.in/api/matches') {
    this.apiUrl = apiUrl;
    this.updateInterval = 30000; // 30 seconds
    this.retryCount = 0;
    this.maxRetries = 3;
    this.isUpdating = false;
    this.lastUpdateTime = 0;
    this.failedAttempts = 0;
    
    // Fallback data store
    this.fallbackData = new Map();
    this.loadFallbackData();
    
    console.log('🚀 Match Updater initialized');
  }

  // Load any previously stored fallback data
  loadFallbackData() {
    try {
      const stored = localStorage.getItem('matchUpdater_fallbackData');
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([id, match]) => {
          this.fallbackData.set(id, match);
        });
        console.log(`📂 Loaded ${this.fallbackData.size} matches from fallback storage`);
      }
    } catch (error) {
      console.warn('⚠️ Could not load fallback data:', error.message);
    }
  }

  // Save fallback data for offline use
  saveFallbackData() {
    try {
      const dataObj = Object.fromEntries(this.fallbackData);
      localStorage.setItem('matchUpdater_fallbackData', JSON.stringify(dataObj));
    } catch (error) {
      console.warn('⚠️ Could not save fallback data:', error.message);
    }
  }

  // Find all match IDs in the current page
  getMatchIdsFromPage() {
    const matchIds = [];
    
    // Primary method: look for elements with data-start attributes
    const dateElements = document.querySelectorAll('[data-start]');
    dateElements.forEach(element => {
      const id = element.id;
      if (id && id !== '' && !isNaN(id)) {
        matchIds.push(id);
      }
    });
    
    // Secondary method: look for match containers with IDs
    const matchContainers = document.querySelectorAll('.containermatch');
    matchContainers.forEach(container => {
      const timeElement = container.querySelector('[data-start]');
      if (timeElement && timeElement.id && !matchIds.includes(timeElement.id)) {
        matchIds.push(timeElement.id);
      }
    });
    
    // Remove duplicates and sort
    const uniqueIds = [...new Set(matchIds)].sort();
    
    console.log(`📋 Found ${uniqueIds.length} matches on page:`, uniqueIds);
    return uniqueIds;
  }

  // Format time display with better handling
  formatTime(status, currentTime, isFinished, isLive) {
    if (!status) return 'Unknown';

    const statusLower = status.toLowerCase();
    
    // Handle finished matches
    if (statusLower.includes('finished') || statusLower.includes('ended') || isFinished) {
      return 'FT';
    }
    
    // Handle halftime
    if (statusLower.includes('halftime') || statusLower.includes('ht')) {
      return 'HT';
    }
    
    // Handle live matches with time
    if ((isLive || statusLower.includes('live')) && currentTime && currentTime > 0) {
      if (currentTime <= 45) {
        return `${currentTime}'`;
      } else if (currentTime <= 90) {
        return `${currentTime}'`;
      } else {
        return `90+${currentTime - 90}'`;
      }
    }
    
    // Handle special statuses
    if (statusLower.includes('postponed')) return 'Postponed';
    if (statusLower.includes('cancelled')) return 'Cancelled';
    if (statusLower.includes('suspended')) return 'Suspended';
    
    // Default return
    return status;
  }

  // Format scheduled time
  formatScheduledTime(timestamp) {
    try {
      const date = new Date(timestamp * 1000);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      return 'Unknown';
    }
  }

  // Check if match should show scores
  shouldShowScores(match) {
    return match.isLive || 
           match.status?.toLowerCase().includes('finished') ||
           match.status?.toLowerCase().includes('ended') ||
           match.status?.toLowerCase().includes('halftime') ||
           (match.homeScore > 0 || match.awayScore > 0);
  }

  // Update individual match display
  updateMatchDisplay(matchId, matchData) {
    const container = document.getElementById(matchId);
    if (!container) {
      console.warn(`⚠️ Container not found for match ${matchId}`);
      return false;
    }

    const parent = container.closest('.containermatch');
    if (!parent) {
      console.warn(`⚠️ Parent container not found for match ${matchId}`);
      return false;
    }

    const home = parent.querySelector('.matchname.left');
    const away = parent.querySelector('.matchname.right'); 
    const timeBox = parent.querySelector('.matchTime .stsrt');

    if (!home || !away || !timeBox) {
      console.warn(`⚠️ Required elements not found for match ${matchId}`);
      return false;
    }

    try {
      const showScores = this.shouldShowScores(matchData);
      
      if (showScores) {
        // Format scorers
        const formatScorers = (scorers) => {
          if (!scorers || scorers.length === 0) return '';
          return scorers.map(scorer => 
            `<span class="scorer">${scorer.name} ${scorer.minute}'</span>`
          ).join(', ');
        };

        // Update team names with scores
        home.innerHTML = `
          <span class="team-name">${matchData.home}</span> 
          <strong class="score">(${matchData.homeScore || 0})</strong>
          ${matchData.homeScorers?.length > 0 ? 
            `<div class="scorers">${formatScorers(matchData.homeScorers)}</div>` : ''}
        `;
        
        away.innerHTML = `
          <strong class="score">(${matchData.awayScore || 0})</strong> 
          <span class="team-name">${matchData.away}</span>
          ${matchData.awayScorers?.length > 0 ? 
            `<div class="scorers">${formatScorers(matchData.awayScorers)}</div>` : ''}
        `;

        // Update time box with scores
        timeBox.innerHTML = `<strong>${matchData.homeScore || 0} - ${matchData.awayScore || 0}</strong>`;
        
        // Update status
        const formattedTime = this.formatTime(
          matchData.status, 
          matchData.currentTime, 
          matchData.status?.toLowerCase().includes('finished'),
          matchData.isLive
        );
        
        container.innerHTML = `<span class="status ${matchData.isLive ? 'live' : ''}">${formattedTime}</span>`;
        
        // Add live indicator styling
        if (matchData.isLive) {
          container.classList.add('live-match');
          parent.classList.add('live-match');
        }
        
      } else {
        // Show scheduled match
        home.innerHTML = `<span class="team-name">${matchData.home}</span>`;
        away.innerHTML = `<span class="team-name">${matchData.away}</span>`;
        
        if (matchData.timestamp) {
          timeBox.innerHTML = this.formatScheduledTime(matchData.timestamp);
        }
        
        container.innerHTML = `<span class="vs">vs</span>`;
        container.classList.remove('live-match');
        parent.classList.remove('live-match');
      }

      console.log(`✅ Updated match ${matchId}: ${matchData.home} vs ${matchData.away}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Error updating match ${matchId}:`, error);
      return false;
    }
  }

  // Fetch matches with retries and fallbacks
  async fetchMatches(matchIds) {
    if (this.isUpdating) {
      console.log('⏳ Update already in progress');
      return null;
    }

    this.isUpdating = true;
    
    try {
      console.log(`🔄 Fetching data for ${matchIds.length} matches...`);
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matchIds }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log(`📊 Received data for ${data.meta?.delivered || 0}/${data.meta?.requested || 0} matches`);
      
      // Store successful data as fallback
      if (data.matches && Object.keys(data.matches).length > 0) {
        Object.entries(data.matches).forEach(([id, match]) => {
          this.fallbackData.set(id, { ...match, cachedAt: Date.now() });
        });
        this.saveFallbackData();
        this.failedAttempts = 0; // Reset failure counter
      }

      return data;
      
    } catch (error) {
      console.error('❌ Fetch failed:', error.message);
      
      this.failedAttempts++;
      
      // Use fallback data if available
      if (this.fallbackData.size > 0) {
        console.log(`📂 Using fallback data for ${matchIds.length} matches`);
        
        const fallbackMatches = {};
        matchIds.forEach(id => {
          const fallback = this.fallbackData.get(id);
          if (fallback) {
            fallbackMatches[id] = fallback;
          }
        });
        
        return {
          matches: fallbackMatches,
          meta: {
            delivered: Object.keys(fallbackMatches).length,
            requested: matchIds.length,
            source: 'fallback'
          },
          errors: { general: `API failed: ${error.message}` }
        };
      }
      
      return null;
      
    } finally {
      this.isUpdating = false;
    }
  }

  // Main update function
  async updateMatches() {
    try {
      const matchIds = this.getMatchIdsFromPage();
      
      if (matchIds.length === 0) {
        console.log('📋 No matches found on page');
        return;
      }

      const data = await this.fetchMatches(matchIds);
      
      if (!data || !data.matches) {
        console.log('❌ No data received, skipping update');
        return;
      }

      let updatedCount = 0;
      
      // Update each match
      Object.entries(data.matches).forEach(([matchId, matchData]) => {
        if (this.updateMatchDisplay(matchId, matchData)) {
          updatedCount++;
        }
      });

      // Update page title if there are live matches
      this.updatePageTitle(data.matches);

      console.log(`✅ Updated ${updatedCount}/${Object.keys(data.matches).length} matches`);
      
      // Show errors if any
      if (data.errors && Object.keys(data.errors).length > 0) {
        console.warn('⚠️ Some matches had errors:', data.errors);
      }

      this.lastUpdateTime = Date.now();
      
      // Adjust update interval based on live matches
      this.adjustUpdateInterval(data.matches);
      
    } catch (error) {
      console.error('❌ Update failed:', error);
      this.failedAttempts++;
      
      // Exponential backoff for failed attempts
      if (this.failedAttempts > 3) {
        this.updateInterval = Math.min(this.updateInterval * 1.5, 300000); // Max 5 minutes
        console.log(`⏳ Increased update interval to ${this.updateInterval/1000}s due to failures`);
      }
    }
  }

  // Update page title with live match info
  updatePageTitle(matches) {
    try {
      const liveMatches = Object.values(matches).filter(match => match.isLive);
      
      if (liveMatches.length > 0) {
        const firstLive = liveMatches[0];
        document.title = `⚽ ${firstLive.homeScore}-${firstLive.awayScore} | ${firstLive.home} vs ${firstLive.away} - Live`;
      } else {
        // Restore original title or set default
        document.title = document.title.replace(/⚽.*? - Live/, '').trim() || 'Football Matches';
      }
    } catch (error) {
      console.warn('⚠️ Could not update page title:', error);
    }
  }

  // Adjust update interval based on match states
  adjustUpdateInterval(matches) {
    const liveMatches = Object.values(matches).filter(match => match.isLive);
    
    if (liveMatches.length > 0) {
      // More frequent updates for live matches
      this.updateInterval = 15000; // 15 seconds
    } else {
      // Less frequent for scheduled/finished matches
      this.updateInterval = 60000; // 1 minute
    }
  }

  // Add CSS styles for better visual feedback
  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .live-match {
        background-color: #e8f5e8 !important;
        border-left: 3px solid #4caf50 !important;
      }
      
      .live-match .status.live {
        color: #4caf50 !important;
        font-weight: bold !important;
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
      }
      
      .score {
        color: #333 !important;
        font-weight: bold !important;
      }
      
      .scorers {
        font-size: 11px !important;
        color: #666 !important;
        margin-top: 2px !important;
      }
      
      .scorer {
        display: inline-block;
        margin-right: 8px;
      }
      
      .vs {
        color: #999 !important;
        font-style: italic;
      }
      
      .team-name {
        font-weight: 500;
      }
      
      .match-error {
        background-color: #ffebee !important;
        border-left: 3px solid #f44336 !important;
      }
      
      /* Connection status indicator */
      .updater-status {
        position: fixed;
        bottom: 10px;
        right: 10px;
        padding: 5px 10px;
        border-radius: 15px;
        font-size: 12px;
        z-index: 1000;
        opacity: 0.8;
      }
      
      .updater-status.online {
        background-color: #4caf50;
        color: white;
      }
      
      .updater-status.offline {
        background-color: #f44336;
        color: white;
      }
      
      .updater-status.updating {
        background-color: #ff9800;
        color: white;
      }
    `;
    document.head.appendChild(style);
  }

  // Add status indicator
  addStatusIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'updater-status';
    indicator.className = 'updater-status online';
    indicator.textContent = '● Live';
    document.body.appendChild(indicator);
    
    this.statusIndicator = indicator;
  }

  // Update status indicator
  updateStatus(status) {
    if (this.statusIndicator) {
      this.statusIndicator.className = `updater-status ${status}`;
      
      switch (status) {
        case 'updating':
          this.statusIndicator.textContent = '● Updating...';
          break;
        case 'offline':
          this.statusIndicator.textContent = '● Offline';
          break;
        case 'online':
        default:
          this.statusIndicator.textContent = '● Live';
          break;
      }
    }
  }

  // Start the updater
  start() {
    console.log('🚀 Starting match updater...');
    
    // Add styles and status indicator
    this.addStyles();
    this.addStatusIndicator();
    
    // Initial update
    this.updateMatches();
    
    // Set up interval updates
    this.intervalId = setInterval(() => {
      this.updateStatus('updating');
      this.updateMatches().finally(() => {
        this.updateStatus(this.failedAttempts > 0 ? 'offline' : 'online');
      });
    }, this.updateInterval);
    
    // Update when page becomes visible again
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        console.log('📱 Page visible again, updating matches...');
        this.updateMatches();
      }
    });
    
    // Update when online/offline
    window.addEventListener('online', () => {
      console.log('🌐 Connection restored, updating matches...');
      this.failedAttempts = 0;
      this.updateInterval = 30000; // Reset interval
      this.updateMatches();
    });
    
    window.addEventListener('offline', () => {
      console.log('📵 Connection lost, using fallback data');
      this.updateStatus('offline');
    });
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.stop();
    });
  }

  // Stop the updater
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    if (this.statusIndicator) {
      this.statusIndicator.remove();
    }
    
    console.log('⏹️ Match updater stopped');
  }

  // Manual refresh method
  refresh() {
    console.log('🔄 Manual refresh requested');
    this.updateMatches();
  }

  // Get statistics
  getStats() {
    return {
      isRunning: !!this.intervalId,
      updateInterval: this.updateInterval,
      lastUpdateTime: this.lastUpdateTime,
      failedAttempts: this.failedAttempts,
      fallbackDataSize: this.fallbackData.size,
      isUpdating: this.isUpdating
    };
  }
}

// Initialize the updater when page loads
let matchUpdater;

// Wait for page to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeUpdater);
} else {
  initializeUpdater();
}

function initializeUpdater() {
  try {
    // Create updater instance
    matchUpdater = new MatchUpdater('https://watchasports.in/api/matches');
    
    // Start updating
    matchUpdater.start();
    
    // Make it available globally for debugging
    window.matchUpdater = matchUpdater;
    
    // Add console commands for debugging
    console.log('🔧 Debug commands available:');
    console.log('  - matchUpdater.refresh() - Manual refresh');
    console.log('  - matchUpdater.getStats() - Get statistics');
    console.log('  - matchUpdater.stop() - Stop updater');
    console.log('  - matchUpdater.start() - Start updater');
    
  } catch (error) {
    console.error('❌ Failed to initialize match updater:', error);
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MatchUpdater;
}
