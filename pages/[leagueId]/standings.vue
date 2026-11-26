<script setup lang="ts">
import { Beer, Crown, LoaderCircle } from 'lucide-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { getMatchupPlayerPoints, isGameFinal, useSleeper } from '~/composables/useSleeperAPI';
import type { Game, PlayerStats } from '~/composables/useGraphQL';
import { LEAGUE_MEMBERS, MAIN_LEAGUE_ID, PARLAYS_BY_WEEK, cuckAssetId, cuckRank, type ParlayLeg } from '~/lib/parlay';
import type { LeagueInfo, Matchup, NFLSeasonInfo, Roster, User } from '~/types/sleeper';

interface TeamStanding {
  rosterId: number;
  user?: User;
  matchupWins: number;
  matchupLosses: number;
  matchupTies: number;
  medianWins: number;
  medianLosses: number;
  medianTies: number;
  pointsFor: number;
  pointsAgainst: number;
  shotguns: number;
  parlayWins: number;
  parlayLosses: number;
  parlayPushes: number;
  cuckIndexTotal: number;
  cuckIndexWeeks: number;
  biggestCuckWeeks: number;
}

interface WeeklyLeagueData {
  week: number;
  matchups: Matchup[];
  stats: { projections: PlayerStats[]; live: PlayerStats[] };
  parlayStats: { projections: PlayerStats[]; live: PlayerStats[] };
  games: Game[];
}

const {
  getLeagueInfo,
  getMatchups,
  getUsers,
  getRosters,
  getNFLState,
  getAllProjections,
  getAllGames,
  getPlayerStats
} = useSleeper();
const route = useRoute();
const leagueId = computed(() => route.params.leagueId as string);
const hasParlayMetrics = computed(() => leagueId.value === MAIN_LEAGUE_ID);

const leagueInfo = ref<LeagueInfo>();
const nflState = ref<NFLSeasonInfo>();
const rosters = ref<Roster[]>([]);
const users = ref<User[]>([]);
const standings = ref<TeamStanding[]>([]);
const countedThroughWeek = ref(0);
const loading = ref(true);

const addResult = (standing: TeamStanding, type: 'matchup' | 'median', result: 'win' | 'loss' | 'tie') => {
  if (type === 'matchup') {
    if (result === 'win') standing.matchupWins++;
    else if (result === 'loss') standing.matchupLosses++;
    else standing.matchupTies++;
  } else {
    if (result === 'win') standing.medianWins++;
    else if (result === 'loss') standing.medianLosses++;
    else standing.medianTies++;
  }
};

const calculateStandings = (weeklyMatchups: WeeklyLeagueData[]) => {
  const userById = new Map(users.value.map(user => [user.user_id, user]));
  const byRoster = new Map<number, TeamStanding>();

  for (const roster of rosters.value) {
    byRoster.set(roster.roster_id, {
      rosterId: roster.roster_id,
      user: userById.get(roster.owner_id),
      matchupWins: 0,
      matchupLosses: 0,
      matchupTies: 0,
      medianWins: 0,
      medianLosses: 0,
      medianTies: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      shotguns: 0,
      parlayWins: 0,
      parlayLosses: 0,
      parlayPushes: 0,
      cuckIndexTotal: 0,
      cuckIndexWeeks: 0,
      biggestCuckWeeks: 0
    });
  }

  for (const { week, matchups, stats, games } of weeklyMatchups) {
    const liveByPlayer = new Map(stats.live.map(stat => [String(stat.player_id), stat]));
    const projectionByPlayer = new Map(stats.projections.map(projection => [String(projection.player_id), projection]));
    const gameById = new Map(games.map(game => [String(game.game_id), game]));

    for (const matchup of matchups) {
      const standing = byRoster.get(matchup.roster_id);
      if (!standing) continue;

      standing.pointsFor += Number(matchup.points ?? 0);
      for (const [starterIndex, playerId] of matchup.starters.entries()) {
        const matchupPoints = getMatchupPlayerPoints(matchup, playerId, starterIndex);
        if (matchupPoints !== undefined) {
          if (matchupPoints <= 0) standing.shotguns++;
          continue;
        }

        const live = liveByPlayer.get(playerId);
        const projection = projectionByPlayer.get(playerId);
        const game = gameById.get(String(live?.game_id || projection?.game_id || ''));
        if (!game || !isGameFinal(game)) continue;

        const points = Number(live?.stats?.pts_half_ppr ?? 0);
        if (points <= 0) standing.shotguns++;
      }
    }

    const matchupGroups = new Map<number, Matchup[]>();
    for (const matchup of matchups) {
      const group = matchupGroups.get(matchup.matchup_id) ?? [];
      group.push(matchup);
      matchupGroups.set(matchup.matchup_id, group);
    }

    if (week <= 11) {
      for (const group of matchupGroups.values()) {
        if (group.length !== 2) continue;
        const [first, second] = group;
        const firstStanding = byRoster.get(first.roster_id);
        const secondStanding = byRoster.get(second.roster_id);
        if (!firstStanding || !secondStanding) continue;

        firstStanding.pointsAgainst += Number(second.points ?? 0);
        secondStanding.pointsAgainst += Number(first.points ?? 0);

        if (first.points > second.points) {
          addResult(firstStanding, 'matchup', 'win');
          addResult(secondStanding, 'matchup', 'loss');
        } else if (first.points < second.points) {
          addResult(firstStanding, 'matchup', 'loss');
          addResult(secondStanding, 'matchup', 'win');
        } else {
          addResult(firstStanding, 'matchup', 'tie');
          addResult(secondStanding, 'matchup', 'tie');
        }
      }
    } else if (week <= 14) {
      const scores = matchups.map(matchup => Number(matchup.points ?? 0)).sort((a, b) => a - b);
      const middle = Math.floor(scores.length / 2);
      const median = scores.length % 2
        ? scores[middle]
        : (scores[middle - 1] + scores[middle]) / 2;

      for (const matchup of matchups) {
        const standing = byRoster.get(matchup.roster_id);
        if (!standing) continue;
        if (matchup.points > median) addResult(standing, 'median', 'win');
        else if (matchup.points < median) addResult(standing, 'median', 'loss');
        else addResult(standing, 'median', 'tie');
      }
    }
  }

  standings.value = [...byRoster.values()];
};

type ParlayResult = 'hit' | 'miss' | 'push' | 'unsettled';

const evaluateParlayResult = (leg: ParlayLeg, data: WeeklyLeagueData): ParlayResult => {
  const live = leg.playerId
    ? data.parlayStats.live.find(stat => String(stat.player_id) === leg.playerId)
    : undefined;
  const projection = leg.playerId
    ? data.parlayStats.projections.find(stat => String(stat.player_id) === leg.playerId)
    : undefined;
  const game = data.games.find(candidate => {
    if (String(candidate.game_id) === String(live?.game_id || projection?.game_id || '')) return true;
    const teams = [candidate.metadata?.home_team, candidate.metadata?.away_team];
    return teams.includes(leg.team) && (!leg.opponent || teams.includes(leg.opponent));
  });
  if (!game) return 'unsettled';

  const final = isGameFinal(game);
  const isHome = game.metadata.home_team === leg.team;
  const teamScore = Number(isHome ? game.metadata.home_score : game.metadata.away_score);
  const opponentScore = Number(isHome ? game.metadata.away_score : game.metadata.home_score);
  const line = Number(leg.line ?? 0);

  if (leg.kind === 'spread') {
    if (!final) return 'unsettled';
    const margin = teamScore - opponentScore + line;
    return margin > 0 ? 'hit' : margin < 0 ? 'miss' : 'push';
  }

  if (leg.kind === 'moneyline') {
    if (!final) return 'unsettled';
    return teamScore > opponentScore ? 'hit' : teamScore < opponentScore ? 'miss' : 'push';
  }

  if (leg.kind === 'team_total_over') {
    if (teamScore > line) return 'hit';
    return final ? 'miss' : 'unsettled';
  }

  if (leg.kind === 'game_total_over' || leg.kind === 'game_total_under') {
    const total = Number(game.metadata.home_score) + Number(game.metadata.away_score);
    if (leg.kind === 'game_total_over') {
      if (total > line) return 'hit';
      return final ? 'miss' : 'unsettled';
    }
    if (!final) return 'unsettled';
    return total < line ? 'hit' : total > line ? 'miss' : 'push';
  }

  const stats = live?.stats ?? {};
  const settleOver = (value: number) => value > line ? 'hit' : final ? 'miss' : 'unsettled';
  const settleAtLeast = (value: number) => value >= line ? 'hit' : final ? 'miss' : 'unsettled';

  if (leg.kind === 'receiving_yards_over') return settleOver(Number(stats.rec_yd ?? 0));
  if (leg.kind === 'receiving_yards_at_least') return settleAtLeast(Number(stats.rec_yd ?? 0));
  if (leg.kind === 'rushing_yards_at_least') return settleAtLeast(Number(stats.rush_yd ?? 0));
  if (leg.kind === 'passing_yards_over') return settleOver(Number(stats.pass_yd ?? 0));
  if (leg.kind === 'passing_touchdowns_at_least') return settleAtLeast(Number(stats.pass_td ?? 0));
  if (leg.kind === 'receptions_at_least') return settleAtLeast(Number(stats.rec ?? 0));

  if (leg.kind === 'receiving_yards_under') {
    if (!final) return 'unsettled';
    const yards = Number(stats.rec_yd ?? 0);
    return yards < line ? 'hit' : yards > line ? 'miss' : 'push';
  }

  const touchdowns = ['rush_td', 'rec_td', 'kr_td', 'pr_td', 'fum_rec_td']
    .reduce((total, field) => total + Number(stats[field] ?? 0), 0);
  if (touchdowns > 0) return 'hit';
  return final ? 'miss' : 'unsettled';
};

const calculateParlayMetrics = (weeklyData: WeeklyLeagueData[]) => {
  if (!hasParlayMetrics.value) return;

  const standingByUser = new Map(
    standings.value.flatMap(standing => standing.user ? [[standing.user.user_id, standing] as const] : [])
  );
  const rosterIdByOwner = new Map(rosters.value.map(roster => [roster.owner_id, roster.roster_id]));

  for (const data of weeklyData) {
    const parlay = PARLAYS_BY_WEEK[data.week] ?? [];
    const matchupByRoster = new Map(data.matchups.map(matchup => [matchup.roster_id, matchup]));
    const priorWeeks = weeklyData.filter(candidate => candidate.week < data.week);
    const weeklyCuckIndexes = new Map<string, {
      standing: TeamStanding;
      index: number;
      hasPlayerAsset: boolean;
    }>();

    for (const leg of parlay) {
      const member = LEAGUE_MEMBERS[leg.submittedName];
      const ownedAssetId = cuckAssetId(leg);
      const standing = member ? standingByUser.get(member.userId) : undefined;
      if (!standing) continue;

      const result = evaluateParlayResult(leg, data);
      if (result === 'unsettled') continue;

      if (result === 'hit') standing.parlayWins++;
      else if (result === 'miss') standing.parlayLosses++;
      else standing.parlayPushes++;

      let index = 0;
      if (ownedAssetId) {
        const bettorRosterId = rosterIdByOwner.get(member.userId);
        const bettorMatchup = bettorRosterId ? matchupByRoster.get(bettorRosterId) : undefined;
        const playerMatchup = data.matchups.find(matchup => matchup.players?.includes(ownedAssetId));

        if (bettorRosterId && playerMatchup && playerMatchup.roster_id !== bettorRosterId) {
          index += 1;
          if (bettorMatchup && bettorMatchup.matchup_id === playerMatchup.matchup_id) index += 2;
        }

        const previouslyOwned = Boolean(bettorRosterId) && priorWeeks.some(candidate => (
          candidate.matchups.some(matchup => (
            matchup.roster_id === bettorRosterId && matchup.players?.includes(ownedAssetId)
          ))
        ));
        const currentlyOwned = Boolean(bettorMatchup?.players?.includes(ownedAssetId));
        if (previouslyOwned && !currentlyOwned) index += 2;

        if (result === 'hit') index = Math.max(0, index - 1);
        else if (result === 'miss') index += 2;
      }

      standing.cuckIndexTotal += index;
      const weeklyCuckIndex = weeklyCuckIndexes.get(member.userId);
      if (weeklyCuckIndex) {
        weeklyCuckIndex.index += index;
        weeklyCuckIndex.hasPlayerAsset ||= Boolean(ownedAssetId);
      } else {
        standing.cuckIndexWeeks++;
        weeklyCuckIndexes.set(member.userId, {
          standing,
          index,
          hasPlayerAsset: Boolean(ownedAssetId)
        });
      }
    }

    const weeklyPlayerCuckIndexes = [...weeklyCuckIndexes.values()].filter(entry => entry.hasPlayerAsset);
    if (weeklyPlayerCuckIndexes.length) {
      const highestIndex = Math.max(...weeklyPlayerCuckIndexes.map(entry => entry.index));
      for (const entry of weeklyPlayerCuckIndexes) {
        if (entry.index === highestIndex) entry.standing.biggestCuckWeeks++;
      }
    }
  }
};

onMounted(async () => {
  try {
    [leagueInfo.value, nflState.value, users.value, rosters.value] = await Promise.all([
      getLeagueInfo(leagueId.value),
      getNFLState(),
      getUsers(leagueId.value),
      getRosters(leagueId.value)
    ]);

    countedThroughWeek.value = Math.min(
      14,
      leagueInfo.value.settings?.last_scored_leg ?? Math.max(0, nflState.value.week - 1)
    );
    const weeks = Array.from({ length: countedThroughWeek.value }, (_, index) => index + 1);
    const weeklyData = await Promise.all(
      weeks.map(async week => {
        const matchups = await getMatchups(leagueId.value, week);
        const parlayPlayerIds = (PARLAYS_BY_WEEK[week] ?? []).flatMap(leg => leg.playerId ? [leg.playerId] : []);
        const [stats, games, parlayStats] = await Promise.all([
          getAllProjections(leagueInfo.value!.season, week, matchups),
          getAllGames(leagueInfo.value!.season, week),
          hasParlayMetrics.value && parlayPlayerIds.length
            ? getPlayerStats(leagueInfo.value!.season, week, parlayPlayerIds)
            : Promise.resolve({ projections: [], live: [] })
        ]);
        return { week, matchups, stats, parlayStats, games };
      })
    );
    calculateStandings(weeklyData);
    calculateParlayMetrics(weeklyData);
  } catch (error) {
    console.error('Error loading custom standings:', error);
  } finally {
    loading.value = false;
  }
});

const rankedStandings = computed(() => [...standings.value].sort((a, b) => {
  const aWins = a.matchupWins + a.medianWins;
  const bWins = b.matchupWins + b.medianWins;
  const aTies = a.matchupTies + a.medianTies;
  const bTies = b.matchupTies + b.medianTies;
  return bWins - aWins || bTies - aTies || b.pointsFor - a.pointsFor;
}));

const teamName = (standing: TeamStanding) =>
  standing.user?.metadata?.team_name ?? standing.user?.display_name ?? `Team ${standing.rosterId}`;

const getAvatarUrl = (standing: TeamStanding) => {
  const avatar = standing.user?.metadata?.avatar ?? standing.user?.avatar;
  if (!avatar) return undefined;
  return avatar.startsWith('http') ? avatar : `https://sleepercdn.com/avatars/${avatar}`;
};

const totalWins = (standing: TeamStanding) => standing.matchupWins + standing.medianWins;
const totalLosses = (standing: TeamStanding) => standing.matchupLosses + standing.medianLosses;
const totalTies = (standing: TeamStanding) => standing.matchupTies + standing.medianTies;
const parlayRecord = (standing: TeamStanding) => `${standing.parlayWins}-${standing.parlayLosses}${
  standing.parlayPushes ? `-${standing.parlayPushes}` : ''
}`;
const averageCuckRank = (standing: TeamStanding) => cuckRank(
  standing.cuckIndexWeeks ? standing.cuckIndexTotal / standing.cuckIndexWeeks : 0
);
</script>

<template>
  <div v-if="loading" class="flex min-h-[50vh] items-center justify-center text-slate-500">
    <LoaderCircle class="mr-2 animate-spin" /> Loading standings…
  </div>

  <main v-else class="min-h-screen bg-slate-50">
    <div class="container mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-8">
      <LeagueHeader
        :league-id="leagueId"
        :league-name="leagueInfo?.name"
        active="standings"
        :current-week="nflState?.week"
      />

      <div class="hidden overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 md:block">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[1240px] text-left">
            <thead class="bg-slate-100 text-sm uppercase tracking-wide text-slate-500">
              <tr>
                <th class="px-4 py-3">Rank</th>
                <th class="px-4 py-3">Team</th>
                <th class="px-4 py-3 text-center">Record</th>
                <th class="px-4 py-3 text-center">Matchup</th>
                <th class="px-4 py-3 text-center">BR</th>
                <th class="px-4 py-3 text-center">Shotguns</th>
                <th v-if="hasParlayMetrics" class="px-4 py-3 text-center">Parlay</th>
                <th v-if="hasParlayMetrics" class="px-4 py-3 text-center">Avg Cuck</th>
                <th v-if="hasParlayMetrics" class="px-4 py-3 text-center">Biggest Cuck</th>
                <th class="px-4 py-3 text-right">PF</th>
                <th class="px-4 py-3 text-right">PA</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="(standing, index) in rankedStandings" :key="standing.rosterId" class="text-slate-700">
                <td class="px-4 py-4 text-lg font-bold tabular-nums text-slate-400">{{ index + 1 }}</td>
                <td class="px-4 py-4">
                  <div class="flex items-center gap-3">
                    <img
                      v-if="getAvatarUrl(standing)"
                      :src="getAvatarUrl(standing)"
                      :alt="teamName(standing)"
                      class="h-10 w-10 flex-none rounded-full border-2 border-slate-200 object-cover"
                    />
                    <div class="min-w-0">
                      <p class="truncate font-semibold text-slate-900">{{ teamName(standing) }}</p>
                      <p v-if="standing.user" class="truncate text-sm text-slate-500">@{{ standing.user.display_name }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-4 text-center text-lg font-bold tabular-nums text-blue-700">
                  {{ totalWins(standing) }}-{{ totalLosses(standing) }}<span v-if="totalTies(standing)">-{{ totalTies(standing) }}</span>
                </td>
                <td class="px-4 py-4 text-center tabular-nums">
                  {{ standing.matchupWins }}-{{ standing.matchupLosses }}<span v-if="standing.matchupTies">-{{ standing.matchupTies }}</span>
                </td>
                <td class="px-4 py-4 text-center tabular-nums">
                  {{ standing.medianWins }}-{{ standing.medianLosses }}<span v-if="standing.medianTies">-{{ standing.medianTies }}</span>
                </td>
                <td class="px-4 py-4 text-center">
                  <span class="inline-flex items-center gap-1.5 font-semibold tabular-nums text-emerald-700">
                    <Beer class="h-4 w-4" /> {{ standing.shotguns }}
                  </span>
                </td>
                <td v-if="hasParlayMetrics" class="px-4 py-4 text-center font-semibold tabular-nums text-fuchsia-800">
                  {{ parlayRecord(standing) }}
                </td>
                <td v-if="hasParlayMetrics" class="max-w-48 px-4 py-4 text-center text-sm font-semibold text-fuchsia-800">
                  {{ averageCuckRank(standing) }}
                </td>
                <td v-if="hasParlayMetrics" class="px-4 py-4 text-center">
                  <span class="inline-flex items-center gap-1.5 font-semibold tabular-nums text-fuchsia-800">
                    <Crown class="h-4 w-4" /> {{ standing.biggestCuckWeeks }}
                  </span>
                </td>
                <td class="px-4 py-4 text-right font-medium tabular-nums">{{ standing.pointsFor.toFixed(2) }}</td>
                <td class="px-4 py-4 text-right font-medium tabular-nums">{{ standing.pointsAgainst.toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="grid gap-3 md:hidden">
        <article
          v-for="(standing, index) in rankedStandings"
          :key="standing.rosterId"
          class="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200"
        >
          <div class="flex items-center gap-2">
            <span class="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-slate-100 font-bold tabular-nums text-slate-500">
              {{ index + 1 }}
            </span>
            <img
              v-if="getAvatarUrl(standing)"
              :src="getAvatarUrl(standing)"
              :alt="teamName(standing)"
              class="h-9 w-9 flex-none rounded-full border-2 border-slate-200 object-cover"
            />
            <div class="min-w-0 flex-1">
              <p class="truncate font-semibold text-slate-900">{{ teamName(standing) }}</p>
              <p v-if="standing.user" class="truncate text-sm text-slate-500">@{{ standing.user.display_name }}</p>
            </div>
            <p class="flex-none text-lg font-bold tabular-nums text-blue-700">
              {{ totalWins(standing) }}-{{ totalLosses(standing) }}<span v-if="totalTies(standing)">-{{ totalTies(standing) }}</span>
            </p>
          </div>
          <div class="mt-3 grid grid-cols-4 gap-1 text-center">
            <div class="rounded-md bg-slate-50 p-1.5">
              <p class="text-xs text-slate-500">H2H</p>
              <p class="mt-0.5 text-sm font-semibold tabular-nums text-slate-800">
                {{ standing.matchupWins }}-{{ standing.matchupLosses }}<span v-if="standing.matchupTies">-{{ standing.matchupTies }}</span>
              </p>
            </div>
            <div class="rounded-md bg-slate-50 p-1.5">
              <p class="text-xs text-slate-500">BR</p>
              <p class="mt-0.5 text-sm font-semibold tabular-nums text-slate-800">
                {{ standing.medianWins }}-{{ standing.medianLosses }}<span v-if="standing.medianTies">-{{ standing.medianTies }}</span>
              </p>
            </div>
            <div class="rounded-md bg-slate-50 p-1.5">
              <p class="text-xs text-slate-500">PF</p>
              <p class="mt-0.5 text-sm font-semibold tabular-nums text-slate-800">{{ standing.pointsFor.toFixed(0) }}</p>
            </div>
            <div class="rounded-md bg-slate-50 p-1.5">
              <p class="text-xs text-slate-500">PA</p>
              <p class="mt-0.5 text-sm font-semibold tabular-nums text-slate-800">{{ standing.pointsAgainst.toFixed(0) }}</p>
            </div>
          </div>
          <div class="mt-2 grid gap-1 text-center" :class="hasParlayMetrics ? 'grid-cols-4' : 'grid-cols-1'">
            <div class="rounded-md bg-emerald-50 p-1.5 ring-1 ring-inset ring-emerald-100">
              <p class="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Shotguns</p>
              <p class="mt-0.5 inline-flex items-center gap-0.5 text-sm font-semibold tabular-nums text-emerald-700">
                <Beer class="h-3.5 w-3.5" /> {{ standing.shotguns }}
              </p>
            </div>
            <div v-if="hasParlayMetrics" class="rounded-md bg-fuchsia-50 p-2 ring-1 ring-inset ring-fuchsia-100">
              <p class="text-[10px] font-semibold uppercase tracking-wide text-fuchsia-600">Parlay</p>
              <p class="mt-0.5 font-bold tabular-nums text-fuchsia-900">{{ parlayRecord(standing) }}</p>
            </div>
            <div v-if="hasParlayMetrics" class="rounded-md bg-fuchsia-50 p-2 ring-1 ring-inset ring-fuchsia-100">
              <p class="text-[10px] font-semibold uppercase tracking-wide text-fuchsia-600">Avg Cuck</p>
              <p class="mt-0.5 break-words text-xs font-bold leading-tight text-fuchsia-900">{{ averageCuckRank(standing) }}</p>
            </div>
            <div v-if="hasParlayMetrics" class="rounded-md bg-fuchsia-50 p-2 ring-1 ring-inset ring-fuchsia-100">
              <p class="text-[10px] font-semibold uppercase tracking-wide text-fuchsia-600">Biggest</p>
              <p class="mt-0.5 inline-flex items-center gap-1 font-bold tabular-nums text-fuchsia-900">
                <Crown class="h-3.5 w-3.5" /> {{ standing.biggestCuckWeeks }}
              </p>
            </div>
          </div>
        </article>
      </div>
    </div>
  </main>
</template>
