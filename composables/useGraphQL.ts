import { ref } from "vue";

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

export function useGraphQL<T>() {
  const endpoint = "https://sleeper.com/graphql"; // Replace with your GraphQL endpoint
  const callGraphQL = async (query:string, variables: Record<string, any> = {}): Promise<T | null> => {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, variables }),
      });

      const result: GraphQLResponse<T> = await response.json();

      if (result.errors) {
        throw new Error(result.errors.map((err) => err.message).join(", "));
      }

      return result.data || null;
    } catch (err: unknown) {
      throw new Error('No data returned');
    }
  };

  return {
    callGraphQL
  };
}


export interface PlayerStats {
  game_id: string;
  opponent: string;
  player_id: string;
  stats: Record<string, any>;
  team: string;
  week: number;
  season: number;
}

export interface GameMetadata {
  down: string;
  dl_trading_event_id: number;
  possession: string;
  forecast_temp_low: number;
  day: string;
  geo_lat: string;
  canceled: boolean;
  game_key: string;
  is_over: boolean;
  away_score_overtime: number;
  has2nd_quarter_started: boolean;
  quarter: string;
  home_score_overtime: number;
  away_team: string;
  is_in_progress: boolean;
  pregame_topic_id: string;
  postgame_topic_id: string;
  home_score_quarter4: number;
  forecast_wind_speed: number;
  away_score_quarter1: number;
  date_time: string; // ISO-8601 string
  channel_id: string;
  away_record: string;
  down_and_distance: string;
  home_score_quarter2: number;
  stadium_details: {
    capacity: number;
    city: string;
    country: string;
    name: string;
    playing_surface: string;
    state: string;
    type: string;
    zip: string;
  };
  quarter_num: number;
  sportradar_game_id: string;
  has3rd_quarter_started: boolean;
  home_score: number;
  home_used_timeouts: number;
  time_remaining: string;
  away_score_quarter4: number;
  spread: {
    [team: string]: number; // Allows dynamic team keys like "CAR", "KC"
    updated_at: number; // Timestamp
  };
  home_team: string;
  geo_long: string;
  forecast_description: string;
  oddsjam_game_id: string;
  forecast_temp_high: number;
  home_score_quarter1: number;
  yard_line: string;
  is_overtime: boolean;
  season_type: number;
  away_score: number;
  home_score_quarter3: number;
  has_started: boolean;
  has4th_quarter_started: boolean;
  red_zone: string;
  channel: string;
  away_score_quarter2: number;
  away_score_quarter3: number;
  status: string;
  week: number;
  has1st_quarter_started: boolean;
  season: number;
  yard_line_territory: string;
  away_used_timeouts: number;
  closed: boolean;
  home_record: string;
  moneyline: {
    [team: string]: number; // Dynamic team keys
    updated_at: number;
  };
};

export interface Game {
  date: string; // ISO-8601 formatted date
  game_id: string; // Unique identifier for the game
  metadata: GameMetadata; // Detailed metadata about the game
  season: string; // Season year as a string
  season_type: string; // Type of the season (e.g., "regular")
  sport: string; // Sport name (e.g., "nfl")
  start_time: number; // Epoch timestamp
  status: string; // Game status (e.g., "complete")
  week: number; // Week number
};
