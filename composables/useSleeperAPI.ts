import type {
  LeagueInfo,
  Matchup,
  MatchupResult,
  NFLPlayer,
  NFLSeasonInfo,
  Roster,
  StarterBreakdown,
  User
} from '~/types/sleeper';
import type { Game, PlayerStats } from './useGraphQL';

const BASE_URL = 'https://api.sleeper.app/v1';
const POSITION_RANGES: Record<string, [number, number]> = {
  QB: [0.7, 1.2],
  WR: [0.5, 1.5],
  RB: [0.7, 1.5],
  TE: [0.5, 1.2],
  K: [0.8, 1.1],
  DEF: [0.3, 1.5]
};

let nflPlayersPromise: Promise<Record<string, NFLPlayer>> | undefined;

const fetchJson = async <T>(url: string, errorMessage: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${errorMessage} (${response.status})`);
  return response.json() as Promise<T>;
};

export const isGameFinal = (game: Game | undefined): boolean => {
  const quarter = game?.metadata?.quarter;
  const status = game?.status?.toLowerCase();
  return Boolean(
    game?.metadata?.is_over
      || (quarter && ['OT', 'F', 'F/OT'].includes(quarter))
      || (status && ['complete', 'post', 'final'].includes(status))
  );
};

const getSecondsRemaining = (game: Game | undefined): number => {
  const metadata = game?.metadata;
  const quarter = metadata?.quarter;

  if (isGameFinal(game)) return 0;
  if (!quarter) return 3600;
  if (quarter === 'HALF' || quarter === 'Halftime') return 1800;

  const [minutes, seconds] = (metadata?.time_remaining || '').split(':');
  const quarterNumber = Number(quarter) || 0;

  return Math.max(
    0,
    15 * (4 - Math.min(quarterNumber, 4)) * 60
      + 60 * (parseInt(minutes, 10) || 0)
      + (parseInt(seconds, 10) || 0)
  );
};

const calculateLiveProjection = (
  livePoints: number,
  originalProjection: number,
  secondsRemaining: number,
  isDefense: boolean
): number => {
  const gameMinutes = 60;
  const remainingFraction = secondsRemaining / (60 * gameMinutes);
  const elapsedMinutes = gameMinutes - secondsRemaining / 60;
  const pace = livePoints
    + (livePoints / (elapsedMinutes || 1))
      * (secondsRemaining / gameMinutes)
      * remainingFraction;

  let low = 0.20 * remainingFraction * pace;
  let middle = (0.35 + 0.65 * (1 - remainingFraction)) * pace;
  let high = 0.45 * remainingFraction * pace;

  if (isDefense) {
    low = 0.05 * remainingFraction * pace;
    middle = (0.10 + 0.15 * (1 - remainingFraction)) * pace;
    high = 0.15 * remainingFraction * pace;
  }

  const pacedFloor = Math.max(low + middle + high, livePoints);
  const baseline = remainingFraction >= 1
    ? originalProjection
    : Math.max(originalProjection, livePoints);

  if (remainingFraction <= 0 && livePoints < 0) return livePoints;
  return baseline + (1 - remainingFraction) * (pacedFloor - baseline);
};

const calculatePlayerVariance = (
  liveProjection: number,
  position: string,
  secondsRemaining: number
): number => {
  const remainingFraction = secondsRemaining / 3600;
  const [lowFactor, highFactor] = POSITION_RANGES[position] ?? [0.8, 1.2];
  const low = liveProjection * lowFactor;
  const high = liveProjection * highFactor;
  const variance = ((liveProjection - low) ** 2 + (high - liveProjection) ** 2) / 2;

  return Math.abs(variance * remainingFraction);
};

const hashSeed = (value: string): number => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const seededRandom = (initialSeed: number) => {
  let seed = initialSeed;
  return () => {
    seed += 0x6D2B79F5;
    let value = seed;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
};

const addAboveMedianProbabilities = (
  results: MatchupResult[],
  seedValue: string,
  simulations = 20000
): MatchupResult[] => {
  if (!results.length) return results;

  const topTeamCount = Math.floor(results.length / 2);
  const topFinishes = Array(results.length).fill(0) as number[];

  if (results.every(result => result.starters_standard_deviation === 0)) {
    const winningIndexes = new Set(
      results
        .map((result, index) => ({
          index,
          score: result.starters_projected_total,
          rosterId: result.roster_id
        }))
        .sort((a, b) => b.score - a.score || a.rosterId - b.rosterId)
        .slice(0, topTeamCount)
        .map(result => result.index)
    );

    return results.map((result, index) => ({
      ...result,
      above_median_probability: winningIndexes.has(index) ? 1 : 0
    }));
  }

  const random = seededRandom(hashSeed(seedValue));
  const scores = Array(results.length)
    .fill(null)
    .map((_, index) => ({ index, score: 0 }));

  for (let simulation = 0; simulation < simulations; simulation++) {
    for (let index = 0; index < results.length; index++) {
      let standardNormal = 0;
      if (results[index].starters_standard_deviation > 0) {
        const u = Math.max(random(), Number.EPSILON);
        const v = random();
        standardNormal = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      }

      scores[index] = {
        index,
        score: results[index].starters_projected_total
          + results[index].starters_standard_deviation * standardNormal
          + random() * 1e-9
      };
    }

    scores.sort((a, b) => b.score - a.score);
    for (let place = 0; place < topTeamCount; place++) {
      topFinishes[scores[place].index]++;
    }
  }

  return results.map((result, index) => ({
    ...result,
    above_median_probability: topFinishes[index] / simulations
  }));
};

export const useSleeper = () => {
  const getLeagueInfo = async (leagueId: string): Promise<LeagueInfo> => {
    return fetchJson<LeagueInfo>(`${BASE_URL}/league/${leagueId}`, 'No league data returned');
  };

  const getMatchups = async (leagueId: string, week: number): Promise<Matchup[]> => {
    return fetchJson<Matchup[]>(
      `${BASE_URL}/league/${leagueId}/matchups/${week}`,
      'No matchup data returned'
    );
  };

  const getRosters = async (leagueId: string): Promise<Roster[]> => {
    return fetchJson<Roster[]>(`${BASE_URL}/league/${leagueId}/rosters`, 'No roster data returned');
  };

  const getUsers = async (leagueId: string): Promise<User[]> => {
    return fetchJson<User[]>(`${BASE_URL}/league/${leagueId}/users`, 'No user data returned');
  };

  const getNFLState = async (): Promise<NFLSeasonInfo> => {
    return fetchJson<NFLSeasonInfo>(`${BASE_URL}/state/nfl`, 'No NFL state returned');
  };

  const getNFLPlayers = async (): Promise<Record<string, NFLPlayer>> => {
    if (!nflPlayersPromise) {
      nflPlayersPromise = fetchJson<Record<string, NFLPlayer>>(
        `${BASE_URL}/players/nfl`,
        'Unable to load NFL players'
      );
    }

    return nflPlayersPromise;
  };

  const getNFLPlayerPositions = async (): Promise<Record<string, string>> => {
    const players = await getNFLPlayers();
    return Object.fromEntries(
      Object.entries(players).map(([playerId, player]) => [
        playerId,
        player.position || player.fantasy_positions?.[0] || ''
      ])
    );
  };

  const { callGraphQL } = useGraphQL<any>();

  const getAllProjections = async (
    year: string,
    week: number,
    matchups: Matchup[]
  ): Promise<{ projections: PlayerStats[]; live: PlayerStats[] }> => {
    const allPlayerIds = matchups.flatMap(matchup => matchup.starters);
    const playerIds = allPlayerIds.map(id => `"${id}"`).join(', ');
    const query = `
      query get_player_score_and_projections_batch {
        projections: stats_for_players_in_week(
          sport: "nfl",
          season: "${year}",
          category: "proj",
          season_type: "regular",
          week: ${week},
          player_ids: [${playerIds}]
        ) {
          game_id opponent player_id stats team week season
        }

        live: stats_for_players_in_week(
          sport: "nfl",
          season: "${year}",
          category: "stat",
          season_type: "regular",
          week: ${week},
          player_ids: [${playerIds}]
        ) {
          game_id opponent player_id stats team week season
        }
      }
    `;
    const result = await callGraphQL(query);
    return {
      projections: result?.projections ?? [],
      live: result?.live ?? []
    };
  };

  const getAllGames = async (year: string, week: number): Promise<Game[]> => {
    const query = `query batch_scores {
      nfl__game: scores(
        sport: "nfl",
        season_type: "regular",
        season: "${year}",
        week: ${week}
      ) {
        date game_id metadata season season_type sport status week start_time
      }
    }`;
    const result = await callGraphQL(query);
    return result?.nfl__game ?? [];
  };

  const calculateMatchupProjections = async (
    season: string,
    week: number,
    matchups: Matchup[],
    playerPositions: Record<string, string>,
    isHistoricalWeek = false
  ): Promise<MatchupResult[]> => {
    const [games, stats] = await Promise.all([
      getAllGames(season, week),
      getAllProjections(season, week, matchups)
    ]);

    const gamesById = new Map<string, Game>();
    for (const game of games) {
      if (game?.game_id) gamesById.set(String(game.game_id), game);
    }

    const projectionsByPlayer = new Map<string, PlayerStats>();
    for (const projection of stats.projections) {
      if (projection?.player_id) projectionsByPlayer.set(String(projection.player_id), projection);
    }

    const liveByPlayer = new Map<string, PlayerStats>();
    for (const live of stats.live) {
      if (live?.player_id) liveByPlayer.set(String(live.player_id), live);
    }

    const allGamesFinal = games.length > 0 && games.every(isGameFinal);
    const scoresAreFinal = isHistoricalWeek || allGamesFinal;

    const results = matchups.map(matchup => {
      const starters: StarterBreakdown[] = matchup.starters.map(playerId => {
        const live = liveByPlayer.get(playerId);
        const projection = projectionsByPlayer.get(playerId);
        const livePoints = Number(live?.stats?.pts_half_ppr ?? 0);
        const projectedPoints = Number(projection?.stats?.pts_half_ppr ?? 0);
        const game = gamesById.get(live?.game_id || projection?.game_id || '');
        const playerGameIsFinal = isGameFinal(game);
        const secondsRemaining = getSecondsRemaining(game);
        const isDefense = /^[a-zA-Z]+$/.test(String(playerId));
        const position = isDefense ? 'DEF' : (playerPositions[playerId] || '');
        const dynamicProjection = playerGameIsFinal
          ? livePoints
          : calculateLiveProjection(livePoints, projectedPoints, secondsRemaining, isDefense);

        return {
          player_id: String(playerId),
          team: live?.team || projection?.team,
          opponent: live?.opponent || projection?.opponent,
          game_id: live?.game_id || projection?.game_id,
          position,
          seconds_remaining: secondsRemaining,
          missingStats: !live && !projection,
          live_points: livePoints,
          projected_points: dynamicProjection,
          variance: playerGameIsFinal
            ? 0
            : calculatePlayerVariance(dynamicProjection, position, secondsRemaining)
        } as StarterBreakdown;
      });

      const calculatedLiveTotal = starters.reduce((sum, starter) => sum + starter.live_points, 0);
      const finalScore = Number(matchup.points ?? calculatedLiveTotal);
      const startersLiveTotal = scoresAreFinal ? finalScore : calculatedLiveTotal;
      const startersProjectedTotal = scoresAreFinal
        ? finalScore
        : starters.reduce((sum, starter) => sum + starter.projected_points, 0);
      const startersVariance = scoresAreFinal
        ? 0
        : starters.reduce((sum, starter) => sum + starter.variance, 0);

      return {
        matchup_id: matchup.matchup_id,
        roster_id: matchup.roster_id,
        starters,
        starters_live_total: startersLiveTotal,
        starters_projected_total: startersProjectedTotal,
        starters_variance: startersVariance,
        starters_standard_deviation: Math.sqrt(startersVariance),
        above_median_probability: 0,
        points: matchup.points
      } as MatchupResult;
    });

    const seed = `${season}-${week}-${results.map(result =>
      `${result.roster_id}:${result.starters_projected_total.toFixed(4)}:${result.starters_variance.toFixed(4)}`
    ).join('|')}`;

    return addAboveMedianProbabilities(results, seed);
  };

  return {
    getLeagueInfo,
    getMatchups,
    getUsers,
    getRosters,
    getNFLState,
    getNFLPlayers,
    getNFLPlayerPositions,
    getAllProjections,
    getAllGames,
    calculateMatchupProjections
  };
};
