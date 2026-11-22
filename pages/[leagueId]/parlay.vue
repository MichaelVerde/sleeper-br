<script setup lang="ts">
import {
  ArrowLeft,
  Check,
  Clock3,
  LoaderCircle,
  Minus,
  RefreshCw,
  Trophy,
  X
} from 'lucide-vue-next';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { isGameFinal, useSleeper } from '~/composables/useSleeperAPI';
import type { Game, PlayerStats } from '~/composables/useGraphQL';
import type { LeagueInfo, User } from '~/types/sleeper';

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

const { getAllGames, getLeagueInfo, getPlayerStats, getUsers } = useSleeper();
const route = useRoute();
const leagueId = computed(() => route.params.leagueId as string);
const configured = computed(() => leagueId.value === CONFIGURED_LEAGUE_ID);
const leagueInfo = ref<LeagueInfo>();
const users = ref<User[]>([]);
const games = ref<Game[]>([]);
const liveStats = ref<PlayerStats[]>([]);
const projections = ref<PlayerStats[]>([]);
const loading = ref(true);
const refreshing = ref(false);
const errorMessage = ref('');
const lastUpdated = ref<Date>();
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
    [leagueInfo.value, users.value] = await Promise.all([
      getLeagueInfo(leagueId.value),
      getUsers(leagueId.value)
    ]);
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

  return parlay.map(leg => {
    const member = LEAGUE_MEMBERS[leg.submittedName];
    const live = leg.playerId ? liveByPlayer.get(leg.playerId) : undefined;
    const projection = leg.playerId ? projectionByPlayer.get(leg.playerId) : undefined;
    const game = gameById.get(String(live?.game_id || projection?.game_id || ''))
      ?? games.value.find(candidate => (
        candidate.metadata?.home_team === leg.team || candidate.metadata?.away_team === leg.team
      ));
    const user = userById.get(member.userId);

    if (!game) {
      return { ...leg, member, user, status: 'pending', detail: 'Game data unavailable' };
    }

    const final = isGameFinal(game);
    const started = gameHasStarted(game);

    if (leg.kind === 'spread') {
      if (!started) {
        return { ...leg, member, user, status: 'pending', detail: `Kickoff ${formatKickoff(game)}` };
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
      return { ...leg, member, user, status, detail: `${score} · ${coverDetail}` };
    }

    if (!started) {
      return { ...leg, member, user, status: 'pending', detail: `Kickoff ${formatKickoff(game)}` };
    }

    const stats = live?.stats ?? {};
    const gameStage = final ? 'Final' : 'Live';
    if (leg.kind === 'receiving_yards_over') {
      const yards = Number(stats.rec_yd ?? 0);
      const status: LegStatus = yards > Number(leg.line)
        ? 'hit'
        : final ? 'miss' : started ? 'live' : 'pending';
      return { ...leg, member, user, status, detail: `${gameStage} – ${yards.toFixed(0)} receiving yards` };
    }

    const touchdowns = ['rush_td', 'rec_td', 'kr_td', 'pr_td', 'fum_rec_td']
      .reduce((total, field) => total + Number(stats[field] ?? 0), 0);
    const status: LegStatus = touchdowns > 0
      ? 'hit'
      : final ? 'miss' : started ? 'live' : 'pending';
    const touchdownText = touchdowns === 1 ? '1 touchdown' : `${touchdowns} touchdowns`;
    return { ...leg, member, user, status, detail: `${gameStage} – ${touchdownText}` };
  });
});

const statusCounts = computed(() => evaluatedLegs.value.reduce((counts, leg) => {
  counts[leg.status]++;
  return counts;
}, { hit: 0, miss: 0, push: 0, live: 0, pending: 0 } as Record<LegStatus, number>));

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

const statusClasses = (status: LegStatus) => ({
  hit: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  miss: 'bg-rose-100 text-rose-700 ring-rose-200',
  push: 'bg-slate-100 text-slate-600 ring-slate-200',
  live: 'bg-amber-100 text-amber-700 ring-amber-200',
  pending: 'bg-sky-100 text-sky-700 ring-sky-200'
}[status]);

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

        <section class="mt-4 grid gap-3">
          <article
            v-for="leg in evaluatedLegs"
            :key="leg.member.userId"
            class="flex min-h-28 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200"
          >
            <div class="flex w-28 flex-none flex-col justify-center border-r border-slate-100 bg-slate-50 px-3 py-4 sm:w-40 sm:px-4">
              <p class="truncate font-bold text-slate-900">{{ leg.submittedName }}</p>
              <p class="truncate text-xs text-slate-500 sm:text-sm">@{{ leg.user?.display_name ?? leg.member.sleeperName }}</p>
            </div>

            <div class="flex min-w-0 flex-1 items-center gap-3 p-3 sm:gap-4 sm:p-4">
              <div class="relative flex h-14 w-14 flex-none items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xs font-black text-slate-400 ring-1 ring-slate-200 sm:h-16 sm:w-16">
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
                <p class="truncate text-xs font-medium text-slate-400 sm:text-sm">{{ leg.detail }}</p>
              </div>

              <span class="inline-flex flex-none items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 sm:px-2.5 sm:text-xs" :class="statusClasses(leg.status)">
                <Check v-if="leg.status === 'hit'" class="h-3.5 w-3.5" />
                <X v-else-if="leg.status === 'miss'" class="h-3.5 w-3.5" />
                <Minus v-else-if="leg.status === 'push'" class="h-3.5 w-3.5" />
                <Clock3 v-else class="h-3.5 w-3.5" />
                {{ statusLabel(leg.status) }}
              </span>
            </div>
          </article>
        </section>

        <p v-if="lastUpdated" class="mt-4 text-center text-xs text-slate-400">
          Last updated {{ lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }}
        </p>
      </template>
    </div>
  </main>
</template>
