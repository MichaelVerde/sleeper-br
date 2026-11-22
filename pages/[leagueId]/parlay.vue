<script setup lang="ts">
import {
  ArrowLeft,
  Crown,
  Info,
  LoaderCircle,
  RefreshCw,
  Trophy,
  X
} from 'lucide-vue-next';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { isGameFinal, useSleeper } from '~/composables/useSleeperAPI';
import type { Game, PlayerStats } from '~/composables/useGraphQL';
import type { LeagueInfo, Matchup, Roster, User } from '~/types/sleeper';

type LegKind = 'anytime_td' | 'receiving_yards_over' | 'spread';
type LegStatus = 'hit' | 'miss' | 'push' | 'live' | 'pending';

interface ParlayLeg {
  submittedName: string;
  kind: LegKind;
  playerId?: string;
  playerName?: string;
  team: string;
  line?: number;
}

interface EvaluatedLeg extends ParlayLeg {
  status: LegStatus;
  detail: string;
  cuckIndex: number;
  cuckReasons: string[];
  member: { userId: string; sleeperName: string };
  user?: User;
}

const CONFIGURED_LEAGUE_ID = '1382842376132755456';
const PARLAY_WEEK = 11;

// Reuse these mappings when replacing the weekly picks below.
const LEAGUE_MEMBERS: Record<string, { userId: string; sleeperName: string }> = {
  Jaynaan: { userId: '1019353852707184640', sleeperName: 'JayParmar1023' },
  Jimmer: { userId: '1047676380575711232', sleeperName: 'soyjimmer' },
  Mark: { userId: '1131787508204933120', sleeperName: 'TannedMario' },
  Rob: { userId: '1208133333142208512', sleeperName: 'ronhanderson' },
  Verde: { userId: '1131463867114250240', sleeperName: 'michaelverde2' },
  Tom: { userId: '1001537883003527168', sleeperName: 'Tomparr' },
  Alastair: { userId: '1130697691425738752', sleeperName: 'alistar420' },
  Holden: { userId: '486689331822456832', sleeperName: 'berrysauce34' },
  Aron: { userId: '1132777153214431232', sleeperName: 'aronv' },
  Roop: { userId: '617826255089238016', sleeperName: 'SaroopPeetamber' },
  Griff: { userId: '1132354103486590976', sleeperName: 'griffmoore47' },
  Gav: { userId: '1132363061777743872', sleeperName: 'GavKerr' }
};

const NFL_TEAM_NAMES: Record<string, string> = {
  BUF: 'Buffalo Bills',
  CAR: 'Carolina Panthers',
  CIN: 'Cincinnati Bengals',
  DAL: 'Dallas Cowboys',
  DET: 'Detroit Lions',
  JAX: 'Jacksonville Jaguars',
  KC: 'Kansas City Chiefs',
  NYG: 'New York Giants',
  TEN: 'Tennessee Titans'
};

const parlay: ParlayLeg[] = [
  { submittedName: 'Jaynaan', kind: 'spread', team: 'BUF', line: -16.5 },
  { submittedName: 'Jimmer', kind: 'anytime_td', playerId: '7564', playerName: 'Ja’Marr Chase', team: 'CIN' },
  { submittedName: 'Mark', kind: 'anytime_td', playerId: '8131', playerName: 'Isaiah Likely', team: 'NYG' },
  { submittedName: 'Rob', kind: 'anytime_td', playerId: '5967', playerName: 'Tony Pollard', team: 'TEN' },
  { submittedName: 'Verde', kind: 'spread', team: 'JAX', line: -6 },
  { submittedName: 'Tom', kind: 'anytime_td', playerId: '9221', playerName: 'Jahmyr Gibbs', team: 'DET' },
  { submittedName: 'Alastair', kind: 'anytime_td', playerId: '6786', playerName: 'CeeDee Lamb', team: 'DAL' },
  { submittedName: 'Holden', kind: 'anytime_td', playerId: '7594', playerName: 'Chuba Hubbard', team: 'CAR' },
  { submittedName: 'Aron', kind: 'anytime_td', playerId: '4993', playerName: 'Mike Gesicki', team: 'CIN' },
  { submittedName: 'Roop', kind: 'receiving_yards_over', playerId: '11632', playerName: 'Malik Nabers', team: 'NYG', line: 66.5 },
  { submittedName: 'Griff', kind: 'anytime_td', playerId: '12490', playerName: 'Bhayshul Tuten', team: 'JAX' },
  { submittedName: 'Gav', kind: 'anytime_td', playerId: '13337', playerName: 'Emmett Johnson', team: 'KC' }
];

const { getAllGames, getLeagueInfo, getMatchups, getPlayerStats, getRosters, getUsers } = useSleeper();
const route = useRoute();
const leagueId = computed(() => route.params.leagueId as string);
const configured = computed(() => leagueId.value === CONFIGURED_LEAGUE_ID);
const leagueInfo = ref<LeagueInfo>();
const users = ref<User[]>([]);
const rosters = ref<Roster[]>([]);
const weekMatchups = ref<Matchup[]>([]);
const historicalMatchups = ref<Matchup[]>([]);
const games = ref<Game[]>([]);
const liveStats = ref<PlayerStats[]>([]);
const projections = ref<PlayerStats[]>([]);
const loading = ref(true);
const refreshing = ref(false);
const errorMessage = ref('');
const lastUpdated = ref<Date>();
const cuckLegendOpen = ref(false);
const selectedCuckIndex = ref<number>();
const selectedCuckName = ref('');
let timerId: ReturnType<typeof setInterval> | undefined;

const gameHasStarted = (game: Game | undefined) => Boolean(
  game?.metadata?.has_started
    || game?.metadata?.is_in_progress
    || isGameFinal(game)
    || (game?.start_time && Number(game.start_time) <= Date.now())
);

const formatKickoff = (game: Game) => new Intl.DateTimeFormat('en-CA', {
  weekday: 'short',
  hour: 'numeric',
  minute: '2-digit',
  timeZoneName: 'short'
}).format(new Date(Number(game.start_time)));

const refresh = async () => {
  if (!configured.value || !leagueInfo.value) return;
  refreshing.value = true;

  try {
    const playerIds = parlay.flatMap(leg => leg.playerId ? [leg.playerId] : []);
    const [weekGames, stats] = await Promise.all([
      getAllGames(leagueInfo.value.season, PARLAY_WEEK),
      getPlayerStats(leagueInfo.value.season, PARLAY_WEEK, playerIds)
    ]);
    games.value = weekGames;
    liveStats.value = stats.live;
    projections.value = stats.projections;
    lastUpdated.value = new Date();
    errorMessage.value = '';
  } catch (error) {
    console.error('Error refreshing parlay:', error);
    errorMessage.value = 'The latest scores could not be loaded. Retrying automatically.';
  } finally {
    refreshing.value = false;
    loading.value = false;
  }
};

onMounted(async () => {
  if (!configured.value) {
    loading.value = false;
    return;
  }

  try {
    [leagueInfo.value, users.value, rosters.value] = await Promise.all([
      getLeagueInfo(leagueId.value),
      getUsers(leagueId.value),
      getRosters(leagueId.value)
    ]);
    const weeklyMatchups = await Promise.all(
      Array.from({ length: PARLAY_WEEK }, (_, index) => index + 1)
        .map(week => getMatchups(leagueId.value, week))
    );
    weekMatchups.value = weeklyMatchups[PARLAY_WEEK - 1] ?? [];
    historicalMatchups.value = weeklyMatchups.slice(0, -1).flat();
    await refresh();
    timerId = setInterval(refresh, 60000);
  } catch (error) {
    console.error('Error loading parlay:', error);
    errorMessage.value = 'The parlay could not be loaded.';
    loading.value = false;
  }
});

onUnmounted(() => {
  if (timerId) clearInterval(timerId);
});

const evaluatedLegs = computed<EvaluatedLeg[]>(() => {
  const userById = new Map(users.value.map(user => [user.user_id, user]));
  const liveByPlayer = new Map(liveStats.value.map(stat => [String(stat.player_id), stat]));
  const projectionByPlayer = new Map(projections.value.map(stat => [String(stat.player_id), stat]));
  const gameById = new Map(games.value.map(game => [String(game.game_id), game]));
  const rosterByOwner = new Map(rosters.value.map(roster => [roster.owner_id, roster]));
  const matchupByRoster = new Map(weekMatchups.value.map(matchup => [matchup.roster_id, matchup]));

  return parlay.map(leg => {
    const member = LEAGUE_MEMBERS[leg.submittedName];
    const live = leg.playerId ? liveByPlayer.get(leg.playerId) : undefined;
    const projection = leg.playerId ? projectionByPlayer.get(leg.playerId) : undefined;
    const game = gameById.get(String(live?.game_id || projection?.game_id || ''))
      ?? games.value.find(candidate => (
        candidate.metadata?.home_team === leg.team || candidate.metadata?.away_team === leg.team
      ));
    const user = userById.get(member.userId);
    const bettorRoster = rosterByOwner.get(member.userId);
    const playerRoster = leg.playerId
      ? rosters.value.find(roster => roster.players?.includes(leg.playerId!))
      : undefined;
    const cuckReasons: string[] = [];
    let cuckIndex = 0;

    if (leg.playerId && bettorRoster) {
      if (playerRoster && playerRoster.roster_id !== bettorRoster.roster_id) {
        cuckIndex += 1;
        cuckReasons.push('on another roster');

        const bettorMatchup = matchupByRoster.get(bettorRoster.roster_id);
        const playerMatchup = matchupByRoster.get(playerRoster.roster_id);
        if (bettorMatchup && playerMatchup && bettorMatchup.matchup_id === playerMatchup.matchup_id) {
          cuckIndex += 2;
          cuckReasons.push('facing them this week');
        }
      }

      const previouslyOwned = historicalMatchups.value.some(matchup => (
        matchup.roster_id === bettorRoster.roster_id && matchup.players?.includes(leg.playerId!)
      ));
      const currentlyOwned = bettorRoster.players?.includes(leg.playerId!);
      if (previouslyOwned && !currentlyOwned) {
        cuckIndex += 2;
        cuckReasons.push('formerly owned');
      }
    }

    const evaluate = (status: LegStatus, detail: string): EvaluatedLeg => {
      let settledCuckIndex = cuckIndex;
      const settledReasons = [...cuckReasons];

      if (leg.playerId && status === 'hit') {
        settledCuckIndex = Math.max(0, settledCuckIndex - 1);
        settledReasons.push('hit the bet and clawed back some dignity');
      } else if (leg.playerId && status === 'miss') {
        settledCuckIndex += 2;
        settledReasons.push('missed the bet and watched the bull cash');
      }

      return {
        ...leg,
        member,
        user,
        status,
        detail,
        cuckIndex: settledCuckIndex,
        cuckReasons: settledReasons
      };
    };

    if (!game) {
      return evaluate('pending', 'Game data unavailable');
    }

    const final = isGameFinal(game);
    const started = gameHasStarted(game);

    if (leg.kind === 'spread') {
      if (!started) {
        return evaluate('pending', `Kickoff ${formatKickoff(game)}`);
      }

      const isHome = game.metadata.home_team === leg.team;
      const teamScore = Number(isHome ? game.metadata.home_score : game.metadata.away_score);
      const opponentScore = Number(isHome ? game.metadata.away_score : game.metadata.home_score);
      const marginAgainstSpread = teamScore - opponentScore + Number(leg.line ?? 0);
      const score = `${game.metadata.away_team} ${game.metadata.away_score} – ${game.metadata.home_score} ${game.metadata.home_team}`;
      const status: LegStatus = final
        ? marginAgainstSpread > 0 ? 'hit' : marginAgainstSpread < 0 ? 'miss' : 'push'
        : 'live';
      const coverDetail = marginAgainstSpread > 0
        ? `covering by ${marginAgainstSpread.toFixed(1)}`
        : marginAgainstSpread < 0
          ? `short by ${Math.abs(marginAgainstSpread).toFixed(1)}`
          : 'on the number';
      return evaluate(status, `${score} · ${coverDetail}`);
    }

    if (!started) {
      return evaluate('pending', `Kickoff ${formatKickoff(game)}`);
    }

    const stats = live?.stats ?? {};
    const gameStage = final ? 'Final' : 'Live';
    if (leg.kind === 'receiving_yards_over') {
      const yards = Number(stats.rec_yd ?? 0);
      const status: LegStatus = yards > Number(leg.line)
        ? 'hit'
        : final ? 'miss' : started ? 'live' : 'pending';
      return evaluate(status, `${gameStage} – ${yards.toFixed(0)} receiving yards`);
    }

    const touchdowns = ['rush_td', 'rec_td', 'kr_td', 'pr_td', 'fum_rec_td']
      .reduce((total, field) => total + Number(stats[field] ?? 0), 0);
    const status: LegStatus = touchdowns > 0
      ? 'hit'
      : final ? 'miss' : started ? 'live' : 'pending';
    const touchdownText = touchdowns === 1 ? '1 touchdown' : `${touchdowns} touchdowns`;
    return evaluate(status, `${gameStage} – ${touchdownText}`);
  });
});

const statusCounts = computed(() => evaluatedLegs.value.reduce((counts, leg) => {
  counts[leg.status]++;
  return counts;
}, { hit: 0, miss: 0, push: 0, live: 0, pending: 0 } as Record<LegStatus, number>));

const biggestCuck = computed(() => evaluatedLegs.value
  .filter(leg => Boolean(leg.playerId))
  .reduce<EvaluatedLeg | undefined>((biggest, leg) => (
    !biggest || leg.cuckIndex > biggest.cuckIndex ? leg : biggest
  ), undefined));

const parlayStatus = computed(() => {
  if (statusCounts.value.miss > 0) return { label: 'Parlay busted', class: 'bg-rose-500/15 text-rose-200 ring-rose-400/20' };
  if (statusCounts.value.live > 0) return { label: 'Parlay is live', class: 'bg-amber-500/15 text-amber-200 ring-amber-400/20' };
  if (statusCounts.value.pending > 0) return { label: 'Waiting for kickoff', class: 'bg-sky-500/15 text-sky-200 ring-sky-400/20' };
  return { label: 'Parlay hit!', class: 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/20' };
});

const statusLabel = (status: LegStatus) => ({
  hit: 'Hit',
  miss: 'Miss',
  push: 'Push',
  live: 'Live',
  pending: 'Pending'
}[status]);

const cardClasses = (status: LegStatus) => ({
  hit: 'bg-emerald-50 ring-emerald-200',
  miss: 'bg-rose-50 ring-rose-200',
  push: 'bg-slate-50 ring-slate-200',
  live: 'bg-amber-50 ring-amber-200',
  pending: 'bg-sky-50 ring-sky-200'
}[status]);

const statusTextClasses = (status: LegStatus) => ({
  hit: 'text-emerald-700',
  miss: 'text-rose-700',
  push: 'text-slate-600',
  live: 'text-amber-700',
  pending: 'text-sky-700'
}[status]);

const CUCK_RANKS = [
  'No Cuckery Detected',
  'Cuck Curious',
  'Peeking Through the Keyhole',
  'Holding the Bull’s Pants',
  'Certified Bedroom Cuck',
  'Hotel-Chair Masturbator',
  'The Bull’s Cleanup Crew',
  'Intergalactic Mega-Cuck'
];
const cuckRank = (index: number) => CUCK_RANKS[Math.min(index, CUCK_RANKS.length - 1)];
const openCuckLegend = (leg?: EvaluatedLeg) => {
  selectedCuckIndex.value = leg?.cuckIndex;
  selectedCuckName.value = leg?.submittedName ?? '';
  cuckLegendOpen.value = true;
};
const closeCuckLegend = () => {
  cuckLegendOpen.value = false;
};

const teamName = (team: string) => NFL_TEAM_NAMES[team] ?? team;
const subjectName = (leg: ParlayLeg) => leg.playerName ?? teamName(leg.team);
const subjectImage = (leg: ParlayLeg) => leg.playerId
  ? `https://sleepercdn.com/content/nfl/players/thumb/${leg.playerId}.jpg`
  : `https://sleepercdn.com/images/team_logos/nfl/${leg.team.toLowerCase()}.png`;
const betLabel = (leg: ParlayLeg) => {
  if (leg.kind === 'anytime_td') return 'Anytime touchdown';
  if (leg.kind === 'receiving_yards_over') return `Over ${leg.line} receiving yards`;
  return `${Number(leg.line) > 0 ? '+' : ''}${leg.line} spread`;
};
const hideBrokenImage = (event: Event) => {
  (event.currentTarget as HTMLImageElement).style.display = 'none';
};
</script>

<template>
  <main class="min-h-screen bg-slate-100">
    <div class="container mx-auto max-w-4xl px-3 py-4 sm:px-4 sm:py-8">
      <div v-if="!configured" class="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        <p class="font-semibold text-slate-900">No parlay is configured for this league.</p>
        <NuxtLink :to="`/${leagueId}`" class="mt-4 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700">
          Back to league
        </NuxtLink>
      </div>

      <div v-else-if="loading" class="flex min-h-[50vh] items-center justify-center text-slate-500">
        <LoaderCircle class="mr-2 animate-spin" /> Loading the parlay…
      </div>

      <template v-else>
        <header class="relative overflow-hidden rounded-2xl bg-slate-950 p-5 text-white shadow-xl sm:p-7">
          <div class="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl"></div>
          <div class="relative">
            <div class="flex items-center justify-between gap-3">
              <NuxtLink :to="`/${leagueId}`" class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-300 hover:text-white">
                <ArrowLeft class="h-4 w-4" /> {{ leagueInfo?.name }}
              </NuxtLink>
              <button
                type="button"
                class="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-40"
                :disabled="refreshing"
                aria-label="Refresh parlay"
                @click="refresh"
              >
                <RefreshCw class="h-4 w-4" :class="refreshing ? 'animate-spin' : ''" />
              </button>
            </div>

            <div class="mt-8">
              <p class="text-sm font-bold uppercase tracking-[0.22em] text-emerald-400">Week {{ PARLAY_WEEK }}</p>
              <div class="mt-2 flex items-center justify-between gap-3">
                <h1 class="text-3xl font-black tracking-tight sm:text-4xl">League Parlay</h1>
                <span class="inline-flex w-fit flex-none items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 sm:text-sm" :class="parlayStatus.class">
                  <Trophy class="h-4 w-4" /> {{ parlayStatus.label }}
                </span>
              </div>
            </div>

            <div class="mt-6 grid grid-cols-3 gap-2 sm:max-w-md">
              <div class="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                <p class="text-2xl font-black tabular-nums text-emerald-300">{{ statusCounts.hit }}</p>
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Hit</p>
              </div>
              <div class="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                <p class="text-2xl font-black tabular-nums text-amber-300">{{ statusCounts.live }}</p>
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Live</p>
              </div>
              <div class="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                <p class="text-2xl font-black tabular-nums text-rose-300">{{ statusCounts.miss }}</p>
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Miss</p>
              </div>
            </div>
          </div>
        </header>

        <p v-if="errorMessage" class="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          {{ errorMessage }}
        </p>

        <div v-if="biggestCuck" class="mt-4">
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-xl bg-fuchsia-950 p-4 text-left text-white shadow-lg ring-1 ring-fuchsia-800 transition hover:bg-fuchsia-900 sm:p-5"
            @click="openCuckLegend(biggestCuck)"
          >
            <span class="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-fuchsia-400/15 text-fuchsia-200 ring-1 ring-fuchsia-300/20">
              <Crown class="h-5 w-5" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block text-[10px] font-black uppercase tracking-[0.18em] text-fuchsia-300 sm:text-xs">This week’s biggest cuck</span>
              <span class="mt-0.5 block truncate text-lg font-black">{{ biggestCuck.submittedName }}</span>
              <span class="block text-sm font-bold text-fuchsia-200">{{ cuckRank(biggestCuck.cuckIndex) }}</span>
            </span>
            <span class="flex flex-none items-center gap-1.5 text-xs font-bold text-fuchsia-200 sm:text-sm">
              <Info class="h-4 w-4" /> <span class="hidden sm:inline">View legend</span>
            </span>
          </button>
        </div>

        <section class="mt-2 grid gap-3">
          <article
            v-for="leg in evaluatedLegs"
            :key="leg.member.userId"
            class="flex min-h-28 overflow-hidden rounded-xl shadow-sm ring-1"
            :class="cardClasses(leg.status)"
          >
            <div class="flex w-32 flex-none flex-col justify-center border-r border-white/70 bg-white/35 px-3 py-4 sm:w-48 sm:px-5">
              <p class="mb-1 text-[10px] font-black uppercase tracking-wider sm:text-xs" :class="statusTextClasses(leg.status)">
                {{ statusLabel(leg.status) }}
              </p>
              <p class="truncate text-base font-extrabold text-slate-900 sm:text-lg">{{ leg.submittedName }}</p>
              <p class="truncate text-xs text-slate-500 sm:text-sm">@{{ leg.user?.display_name ?? leg.member.sleeperName }}</p>
              <button
                v-if="leg.playerId"
                type="button"
                class="mt-3 rounded-md bg-fuchsia-500/10 px-2 py-1.5 text-left text-[10px] font-black leading-tight text-fuchsia-800 ring-1 ring-inset ring-fuchsia-500/15 hover:bg-fuchsia-500/20 sm:text-xs"
                @click="openCuckLegend(leg)"
              >
                {{ cuckRank(leg.cuckIndex) }}
              </button>
            </div>

            <div class="flex min-w-0 flex-1 items-center gap-2.5 p-3 sm:gap-4 sm:p-4">
              <div class="relative flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xs font-black text-slate-400 ring-1 ring-slate-200 sm:h-16 sm:w-16">
                <span>{{ leg.team }}</span>
                <img
                  :src="subjectImage(leg)"
                  :alt="subjectName(leg)"
                  class="absolute inset-0 h-full w-full bg-slate-100 object-contain"
                  :class="leg.playerId ? 'object-cover object-top' : 'p-2'"
                  @error="hideBrokenImage"
                />
              </div>

              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-slate-500">{{ teamName(leg.team) }}</p>
                <p class="truncate font-extrabold text-slate-900 sm:text-lg">{{ subjectName(leg) }}</p>
                <p class="mt-1 text-sm font-bold text-slate-700">{{ betLabel(leg) }}</p>
                <p class="text-xs font-medium leading-4 text-slate-500 sm:text-sm">{{ leg.detail }}</p>
              </div>
            </div>
          </article>
        </section>

        <p v-if="lastUpdated" class="mt-4 text-center text-xs text-slate-400">
          Last updated {{ lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }}
        </p>
      </template>
    </div>

    <Teleport to="body">
      <div
        v-if="cuckLegendOpen"
        class="fixed inset-0 z-50 overflow-y-auto bg-white sm:flex sm:items-center sm:justify-center sm:bg-slate-950/60 sm:p-3 sm:backdrop-blur-sm"
        @click.self="closeCuckLegend"
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="cuck-legend-title"
          class="min-h-screen w-full bg-white p-5 sm:min-h-0 sm:max-h-[88vh] sm:max-w-lg sm:overflow-y-auto sm:rounded-2xl sm:p-6 sm:shadow-2xl"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.18em] text-fuchsia-600">Scouting report</p>
              <h2 id="cuck-legend-title" class="mt-1 text-2xl font-black text-slate-900">Cuck Index legend</h2>
              <p v-if="selectedCuckName && selectedCuckIndex !== undefined" class="mt-1 text-sm text-slate-500">
                {{ selectedCuckName }}: <span class="font-bold text-fuchsia-700">{{ cuckRank(selectedCuckIndex) }}</span>
              </p>
            </div>
            <button type="button" class="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close cuck legend" @click="closeCuckLegend">
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="mt-5 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <h3 class="font-bold text-slate-900">How the damage is calculated</h3>
            <ul class="mt-3 space-y-2 text-sm text-slate-600">
              <li class="flex justify-between gap-4"><span>Player is on another fantasy roster</span><strong class="text-fuchsia-700">+1</strong></li>
              <li class="flex justify-between gap-4"><span>That roster is this week’s opponent</span><strong class="text-fuchsia-700">+2</strong></li>
              <li class="flex justify-between gap-4"><span>Picker formerly owned the player</span><strong class="text-fuchsia-700">+2</strong></li>
              <li class="flex justify-between gap-4"><span>The bet hits</span><strong class="text-emerald-700">−1</strong></li>
              <li class="flex justify-between gap-4"><span>The bet misses</span><strong class="text-rose-700">+2</strong></li>
            </ul>
          </div>

          <div class="mt-5">
            <h3 class="font-bold text-slate-900">Possible damage</h3>
            <div class="mt-3 grid gap-2">
              <div
                v-for="(rank, index) in CUCK_RANKS"
                :key="rank"
                class="flex items-center gap-3 rounded-lg px-3 py-2 ring-1"
                :class="selectedCuckIndex === index
                  ? 'bg-fuchsia-50 text-fuchsia-900 ring-fuchsia-300'
                  : 'bg-white text-slate-700 ring-slate-200'"
              >
                <span class="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white">{{ index }}</span>
                <span class="font-bold">{{ rank }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Teleport>
  </main>
</template>
