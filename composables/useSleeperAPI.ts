import type { LeagueInfo, Matchup, NFLSeasonInfo, Roster, User } from "~/types/sleeper";

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
    return data.value as User[];
  };

  const getNFLState = async ():Promise<NFLSeasonInfo> => {
    const { data, error } = await useFetch(`${BASE_URL}/state/nfl`);
    if (!data.value) {
        throw new Error('No data returned');
    }
    return data.value as NFLSeasonInfo;
  };


  return {
    getLeagueInfo,
    getMatchups,
    getUsers,
    getRosters,
    getNFLState,
  };
};
