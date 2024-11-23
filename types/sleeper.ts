export interface User {
    user_id: string; // Unique identifier for the user
    username: string; // Username of the user
    display_name: string; // Display name of the user
    avatar?: string; // Avatar hash or URL (optional)
    metadata?: Record<string, string>; // Additional user-specific metadata
  }
  

  export interface Matchup {
    matchup_id: number; // Unique identifier for the matchup
    roster_id: number; // Roster ID participating in the matchup
    points: number; // Total points scored by the roster for the week
    starters: string[]; // Array of player IDs in the starting lineup
    players: string[]; // Array of all player IDs in the roster
    custom_points?: number; // Custom points if any (optional)
  }
  

  export interface Roster {
    roster_id: number; // Unique identifier for the roster
    owner_id: string; // User ID of the roster's owner
    players: string[]; // Array of player IDs in the roster
    starters: string[]; // Array of player IDs in the starting lineup
    settings?: {
      wins?: number;
      losses?: number;
      ties?: number;
      fpts?: number; // Total points scored
      fpts_against?: number; // Points scored against
      [key: string]: any; // Other custom settings
    };
    metadata?: Record<string, string>; // Additional roster-specific metadata
  }

  export interface LeagueInfo {
    league_id: string; // Unique identifier for the league
    name: string; // Name of the league
    season: string; // The year of the season
    season_type: string; // Type of the season (e.g., "regular")
    status: string; // League status (e.g., "active", "completed")
    total_rosters: number; // Total number of rosters in the league
    metadata?: Record<string, string>; // Additional league-specific metadata
    scoring_settings?: {
      pass_td?: number; // Points for passing touchdowns
      rush_yd?: number; // Points for rushing yards
      rec_yd?: number; // Points for receiving yards
      [key: string]: any; // Other scoring settings
    };
  }
  

  export interface NFLSeasonInfo {
    week: number;               // The current week of the season
    season_type: 'pre' | 'regular' | 'post'; // The type of season (preseason, regular season, postseason)
    season_start_date: string;  // The start date of the current season (ISO format)
    season: string;             // The current season year (e.g., "2020")
    previous_season: string;    // The previous season year (e.g., "2019")
    leg: number;                // The week of the regular season
    league_season: string;      // The active season for leagues (e.g., "2021")
    league_create_season: string; // The season in which the league was created (flips in December)
    display_week: number;      // The week to display in the UI (may differ from the current week)
  }
  
  