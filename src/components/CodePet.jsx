import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Heart, Code, GitCommit, Clock, Github, Settings, RefreshCw } from 'lucide-react';

const CodePet = () => {
  const [pet, setPet] = useState({
    name: 'Codey',
    level: 1,
    experience: 0,
    health: 100,
    happiness: 80,
    evolution: 'egg',
    totalCommits: 0,
    totalHours: 0,
    streak: 0,
    lastFed: null
  });

  const [githubData, setGithubData] = useState({
    username: '',
    token: '', // Personal Access Token
    connected: false,
    lastSync: null,
    todayCommits: 0,
    weekCommits: 0,
    loading: false,
    error: null
  });

  const [showSettings, setShowSettings] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Pet evolution stages
  const evolutions = {
    egg: { name: 'Code Egg', minLevel: 1, sprite: '🥚', description: 'A mysterious egg waiting to hatch...' },
    hatchling: { name: 'Bit Hatchling', minLevel: 2, sprite: '🐣', description: 'Just learned its first Hello World!' },
    junior: { name: 'Bug Hunter', minLevel: 5, sprite: '🦎', description: 'Getting good at squashing bugs!' },
    senior: { name: 'Code Dragon', minLevel: 10, sprite: '🐉', description: 'A powerful coding master!' },
    legend: { name: 'Arch Wizard', minLevel: 20, sprite: '🧙‍♂️', description: 'Legendary coding deity!' }
  };

  // Get current evolution
  const getCurrentEvolution = () => {
    if (pet.level >= 20) return evolutions.legend;
    if (pet.level >= 10) return evolutions.senior;
    if (pet.level >= 5) return evolutions.junior;
    if (pet.level >= 2) return evolutions.hatchling;
    return evolutions.egg;
  };

  // Fetch GitHub data
  const fetchGitHubData = async () => {
    if (!githubData.username || !githubData.token) {
      setGithubData(prev => ({ ...prev, error: 'Username and token required' }));
      return;
    }

    setGithubData(prev => ({ ...prev, loading: true, error: null }));

    try {
      const headers = {
        'Authorization': `token ${githubData.token}`,
        'Accept': 'application/vnd.github.v3+json'
      };

      // Get user events (commits, etc.)
      const eventsResponse = await fetch(`https://api.github.com/users/${githubData.username}/events`, { headers });
      
      if (!eventsResponse.ok) {
        throw new Error(`GitHub API error: ${eventsResponse.status}`);
      }

      const events = await eventsResponse.json();
      
      // Filter push events (commits) from today and this week
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const pushEvents = events.filter(event => event.type === 'PushEvent');
      
      const todaysCommits = pushEvents.filter(event => 
        event.created_at.startsWith(todayStr)
      ).reduce((total, event) => total + (event.payload?.commits?.length || 0), 0);

      const weekCommits = pushEvents.filter(event => 
        new Date(event.created_at) >= weekAgo
      ).reduce((total, event) => total + (event.payload?.commits?.length || 0), 0);

      // Get repositories for activity estimation
      const reposResponse = await fetch(`https://api.github.com/users/${githubData.username}/repos?sort=updated&per_page=10`, { headers });
      const repos = await reposResponse.json();

      // Estimate coding hours based on commit frequency and repo activity (rough heuristic)
      const estimatedHours = Math.min(todaysCommits * 0.5 + (repos.filter(repo => 
        new Date(repo.updated_at) >= weekAgo
      ).length * 0.3), 12); // Cap at 12 hours per day

      setGithubData(prev => ({
        ...prev,
        connected: true,
        todayCommits: todaysCommits,
        weekCommits,
        loading: false,
        lastSync: new Date().toISOString(),
        estimatedHours: Math.round(estimatedHours * 10) / 10
      }));

    } catch (error) {
      console.error('GitHub API Error:', error);
      setGithubData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to connect to GitHub'
      }));
    }
  };

  // Auto-feed pet with GitHub data
  const feedPetWithGitHubData = () => {
    if (!githubData.connected || githubData.todayCommits === 0) {
      return;
    }

    setIsAnimating(true);
    
    const expGain = (githubData.todayCommits * 10) + (githubData.estimatedHours * 5);
    const happinessGain = Math.min(25, githubData.todayCommits * 3 + githubData.estimatedHours * 2);
    
    setPet(prev => {
      const newExp = prev.experience + expGain;
      const newLevel = Math.floor(newExp / 100) + 1;
      const today = new Date().toDateString();
      const newStreak = prev.lastFed === today ? prev.streak : prev.streak + 1;
      
      return {
        ...prev,
        experience: newExp,
        level: newLevel,
        happiness: Math.min(100, prev.happiness + happinessGain),
        health: Math.min(100, prev.health + 8),
        totalCommits: prev.totalCommits + githubData.todayCommits,
        totalHours: prev.totalHours + githubData.estimatedHours,
        streak: newStreak,
        lastFed: today
      };
    });
    
    setTimeout(() => setIsAnimating(false), 1000);
  };

  // Connect to GitHub
  const connectGitHub = () => {
    if (!githubData.username.trim()) {
      alert('Please enter your GitHub username');
      return;
    }
    if (!githubData.token.trim()) {
      alert('Please enter your GitHub Personal Access Token');
      return;
    }
    fetchGitHubData();
  };

  // Reset pet
  const resetPet = () => {
    setPet({
      name: 'Codey',
      level: 1,
      experience: 0,
      health: 100,
      happiness: 80,
      evolution: 'egg',
      totalCommits: 0,
      totalHours: 0,
      streak: 0,
      lastFed: null
    });
  };

  // Pet mood based on happiness
  const getMood = () => {
    if (pet.happiness >= 80) return { emoji: '😊', text: 'Happy', color: 'text-green-500' };
    if (pet.happiness >= 60) return { emoji: '😐', text: 'Okay', color: 'text-yellow-500' };
    if (pet.happiness >= 40) return { emoji: '😔', text: 'Sad', color: 'text-orange-500' };
    return { emoji: '😢', text: 'Very Sad', color: 'text-red-500' };
  };

  const currentEvolution = getCurrentEvolution();
  const mood = getMood();
  const expToNext = 100 - (pet.experience % 100);

  return (
    <div className="max-w-md mx-auto bg-gradient-to-b from-purple-100 to-blue-100 rounded-3xl p-6 shadow-2xl">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-between mb-2">
          <div></div>
          <h1 className="text-2xl font-bold text-purple-800">CodePet</h1>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg hover:bg-white/30 transition-all"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="bg-black/80 text-green-400 px-4 py-2 rounded-lg font-mono text-sm">
          {pet.name} v{pet.level}.0
        </div>
        {githubData.connected && (
          <div className="mt-2 flex items-center justify-center gap-2 text-sm text-green-600">
            <Github className="w-4 h-4" />
            <span>Connected to @{githubData.username}</span>
          </div>
        )}
      </div>

      {/* GitHub Settings Panel */}
      {showSettings && (
        <div className="bg-white/90 rounded-lg p-4 mb-6 border">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Github className="w-5 h-5" />
            GitHub Integration
          </h3>
          
          {!githubData.connected ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub Username
                </label>
                <input
                  type="text"
                  placeholder="your-username"
                  value={githubData.username}
                  onChange={(e) => setGithubData(prev => ({...prev, username: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Personal Access Token
                </label>
                <input
                  type="password"
                  placeholder="ghp_..."
                  value={githubData.token}
                  onChange={(e) => setGithubData(prev => ({...prev, token: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Create at: Settings → Developer settings → Personal access tokens
                </p>
              </div>

              <button
                onClick={connectGitHub}
                disabled={githubData.loading}
                className="w-full bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-900 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {githubData.loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Github className="w-4 h-4" />
                    Connect GitHub
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                <div>✅ Connected as @{githubData.username}</div>
                <div>📊 Today's Commits: {githubData.todayCommits}</div>
                <div>⏱️ Estimated Hours: {githubData.estimatedHours}</div>
                {githubData.lastSync && (
                  <div className="text-xs text-gray-500">
                    Last sync: {new Date(githubData.lastSync).toLocaleTimeString()}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={fetchGitHubData}
                  disabled={githubData.loading}
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {githubData.loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Sync
                </button>
                
                <button
                  onClick={feedPetWithGitHubData}
                  disabled={githubData.todayCommits === 0}
                  className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-all disabled:opacity-50"
                >
                  Feed Pet 🍖
                </button>
              </div>
            </div>
          )}

          {githubData.error && (
            <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
              {githubData.error}
            </div>
          )}
        </div>
      )}

      {/* Pet Display */}
      <div className="bg-gradient-to-b from-sky-200 to-sky-300 rounded-2xl p-8 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),rgba(255,255,255,0))]"></div>
        <div className={`text-center transition-all duration-1000 ${isAnimating ? 'scale-110 animate-bounce' : ''}`}>
          <div className="text-6xl mb-2">{currentEvolution.sprite}</div>
          <div className="text-lg font-semibold text-gray-700">{currentEvolution.name}</div>
          <div className="text-sm text-gray-600 italic">{currentEvolution.description}</div>
          <div className={`text-sm mt-2 ${mood.color} flex items-center justify-center gap-1`}>
            <span>{mood.emoji}</span>
            <span>{mood.text}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/60 rounded-lg p-3">
          <div className="flex items-center gap-2 text-purple-700 mb-1">
            <Heart className="w-4 h-4" />
            <span className="text-sm font-semibold">Health</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-red-500 h-2 rounded-full transition-all" style={{width: `${pet.health}%`}}></div>
          </div>
          <div className="text-xs text-gray-600 mt-1">{pet.health}/100</div>
        </div>

        <div className="bg-white/60 rounded-lg p-3">
          <div className="flex items-center gap-2 text-purple-700 mb-1">
            <span className="text-sm font-semibold">😊 Happiness</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-yellow-500 h-2 rounded-full transition-all" style={{width: `${pet.happiness}%`}}></div>
          </div>
          <div className="text-xs text-gray-600 mt-1">{pet.happiness}/100</div>
        </div>

        <div className="bg-white/60 rounded-lg p-3">
          <div className="flex items-center gap-2 text-purple-700 mb-1">
            <Code className="w-4 h-4" />
            <span className="text-sm font-semibold">Level</span>
          </div>
          <div className="text-lg font-bold">{pet.level}</div>
          <div className="text-xs text-gray-600">EXP: {pet.experience}</div>
          <div className="text-xs text-gray-500">{expToNext} to next level</div>
        </div>

        <div className="bg-white/60 rounded-lg p-3">
          <div className="flex items-center gap-2 text-purple-700 mb-1">
            <span className="text-sm font-semibold">🔥 Streak</span>
          </div>
          <div className="text-lg font-bold">{pet.streak}</div>
          <div className="text-xs text-gray-600">days</div>
        </div>
      </div>

      {/* Current Activity */}
      {githubData.connected && (
        <div className="bg-white/70 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-gray-700 mb-3">Today's Activity</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-purple-600" />
              <span>{githubData.todayCommits} commits</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <span>{githubData.estimatedHours || 0}h coding</span>
            </div>
          </div>
        </div>
      )}

      {/* Lifetime Stats */}
      <div className="bg-white/70 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-gray-700 mb-2">Lifetime Stats</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <div>📊 Total Commits: {pet.totalCommits}</div>
          <div>⏱️ Total Hours: {pet.totalHours.toFixed(1)}</div>
          <div>🏆 Best Streak: {pet.streak} days</div>
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={resetPet}
        className="w-full bg-gray-500 text-white py-2 rounded-lg text-sm hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
      >
        <RotateCcw className="w-4 h-4" />
        Reset Pet
      </button>
    </div>
  );
};

export default CodePet;