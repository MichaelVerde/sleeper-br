import type { LeagueInfo, Matchup, MatchupResult, NFLSeasonInfo, Roster, StarterBreakdown, User } from "~/types/sleeper";
import type { PlayerStats } from "./useGraphQL";

const BASE_URL = 'https://api.sleeper.app/v1';

export const useSleeper = () => {
  const getLeagueInfo = async (leagueId: string):Promise<LeagueInfo> => {
    const { data, error } = await useFetch(`${BASE_URL}/league/${leagueId}`);
    return data.value as LeagueInfo;
  };

  const getMatchups = async (leagueId: string, week: number):Promise<Matchup[]> => {
    const { data, error } = await useFetch(`${BASE_URL}/league/${leagueId}/matchups/${week}`);
    if (!data.value) {
        throw new Error('No data returned');
    }
    return data.value as Matchup[];
  };

  const getRosters = async (leagueId: string):Promise<Roster[]> => {
    const { data, error } = await useFetch(`${BASE_URL}/league/${leagueId}/rosters`);
    if (!data.value) {
        throw new Error('No data returned');
    }
    return data.value as Roster[];
  };

  const getUsers = async (leagueId: string):Promise<User[]> => {
    const { data, error } = await useFetch(`${BASE_URL}/league/${leagueId}/users`);
    if (!data.value) {
        throw new Error('No data returned');
    }
    return (data.value as User[]).filter(u => u.metadata?.team_name);
  };

  const getNFLState = async ():Promise<NFLSeasonInfo> => {
    const { data, error } = await useFetch(`${BASE_URL}/state/nfl`);
    if (!data.value) {
        throw new Error('No data returned');
    }
    return data.value as NFLSeasonInfo;
  };

  const { callGraphQL } = useGraphQL<any>();

  const getAllProjections = async (year: string, week: number, matchups: Matchup[]):Promise<{projections: PlayerStats[], live: PlayerStats[]}> => {
    const allPlayerIds = matchups.map(matchup => matchup.starters).flat();
    const query = `
      query get_player_score_and_projections_batch {
        nfl__regular__2025__13__proj: stats_for_players_in_week(
          sport: "nfl",
          season: "${year}",
          category: "proj",
          season_type: "regular",
          week: ${week},
          player_ids: [${allPlayerIds.map(id => `"${id}"`).join(", ")}]
        ) {
          game_id
          opponent
          player_id
          stats
          team
          week
          season
        }

        nfl__regular__2025__13__stat: stats_for_players_in_week(
          sport: "nfl",
          season: "${year}",
          category: "stat",
          season_type: "regular",
          week: ${week},
          player_ids: [${allPlayerIds.map(id => `"${id}"`).join(", ")}]
        ) {
          game_id
          opponent
          player_id
          stats
          team
          week
          season
        }
      }
    `;
    const result = await callGraphQL(query);
    return {
      projections: result?.nfl__regular__2025__13__proj,
      live: result?.nfl__regular__2025__13__stat
    }
  }

  const getAllGames = async (year: string, week: number):Promise<Game[]> => {
    const query = `query batch_scores {
      nfl__game: scores(
        sport: "nfl",
        season_type: "regular",
        season: "${year}",
        week: ${week}
      ) {
        date
        game_id
        metadata
        season
        season_type
        sport
        status
        week
        start_time
      }
    }`;
    const result = await callGraphQL(query);
    return result?.nfl__game ?? [];
  }


const calculateMatchupProjections = async (
  nflState: NFLSeasonInfo | undefined,
  week: number,
  matchups: Matchup[]
): Promise<MatchupResult[]> =>  {
  const games = await getAllGames(nflState?.season ?? "2024", week);  
  const stats = await getAllProjections(nflState?.season ?? "2024", week, matchups);

  const gamesById = new Map<string, Game>();
  for (const g of games) {
    if (g?.game_id) gamesById.set(String(g.game_id), g);
  }
  console.log('gamesById', gamesById);

  const projectionsByPlayer = new Map<string, PlayerStats>();
  for (const p of stats.projections) {
    if (!p?.player_id) continue;
    const key = `${p.player_id}`;
    projectionsByPlayer.set(key, p);
  }

  // Map of player_game → single live record
  const liveByPlayer = new Map<string, PlayerStats>();
  for (const p of stats.live) {
    if (!p?.player_id) continue;
    const key = `${p.player_id}`;
    liveByPlayer.set(key, p);
  }

  const results: MatchupResult[] = matchups.map((m) => {
    const starters: StarterBreakdown[] = m.starters.map((pid) => {
      const live = liveByPlayer.get(pid);
      const projection = projectionsByPlayer.get(pid);

      const livePoints = live?.stats?.pts_half_ppr ?? 0;
      const projectedPoints = projection?.stats?.pts_half_ppr ?? 0;

      const game = gamesById.get(live?.game_id || projection?.game_id || "");

      return {
        player_id: String(pid),
        team: live?.team || projection?.team,
        opponent: live?.opponent || projection?.opponent,
        game_id: live?.game_id || projection?.game_id,
        missingStats: false,
        live_points: Number(livePoints),        
        projected_points: Number(calculateLiveProjection(game, livePoints, projectedPoints))
      } as StarterBreakdown;
    });

    console.log('starters', starters, 'matchup', m);
    const starters_live_total = starters.reduce((s, it) => s + (it.live_points || 0), 0);    
    const starters_projected_total = starters.reduce((s, it) => s + (it.projected_points || 0), 0);

    return {
      matchup_id: m.matchup_id,
      roster_id: m.roster_id,
      starters,
      starters_live_total,
      starters_projected_total,
      points: m.points
    } as MatchupResult;
    });
    return results;
  }

  const calculateLiveProjection = (game: Game | undefined, livePts: number, projectedPts: number): number => {
    console.log(game, livePts, projectedPts);
    const meta = game?.metadata;

    // Game not started → return full projection
    if (!meta?.has_started) return projectedPts;

    // Game finished → return actual points
    if (meta?.is_over) return livePts;

    const quarterNum = meta?.quarter_num || 1;
    const secondsPerQuarter = 15 * 60;
    const totalSeconds = 4 * secondsPerQuarter;

    const secondsRemaining = parseTimeRemaining(meta?.time_remaining || "15:00");
    const secondsPlayed = (quarterNum - 1) * secondsPerQuarter + (secondsPerQuarter - secondsRemaining);

    const pctCompleted = Math.min(Math.max(secondsPlayed / totalSeconds, 0), 1);
    const remainingFraction = 1 - pctCompleted;

    return livePts + projectedPts * remainingFraction;
  };

  const parseTimeRemaining = (timeStr: string): number => {
    const [minStr, secStr] = timeStr.split(":");
    const minutes = parseInt(minStr, 10) || 0;
    const seconds = parseInt(secStr, 10) || 0;
    return minutes * 60 + seconds;
  };


  return {
    getLeagueInfo,
    getMatchups,
    getUsers,
    getRosters,
    getNFLState,
    getAllProjections,
    getAllGames,
    calculateMatchupProjections
  };
};
