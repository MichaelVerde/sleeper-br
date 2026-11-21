<script setup lang="ts">
import { ChevronDown, LoaderCircle } from 'lucide-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useSleeper } from '~/composables/useSleeperAPI';
import type {
  DraftPick,
  LeagueInfo,
  NFLPlayer,
  NFLSeasonInfo,
  Roster,
  SleeperTransaction,
  User
} from '~/types/sleeper';

interface KeeperPlayer {
  rosterId: number;
  playerId: string;
  playerName: string;
  position?: string;
  nflTeam?: string;
  draftedRound?: number;
  eligible: boolean;
  keeperRound?: number;
  ineligibleReasons: string[];
}

const PREVIOUS_KEEPER_IDS = new Set([
  '10229', // Rashee Rice
  '12518', // Tyler Warren
  '7543',  // Travis Etienne
  '9488',  // Jaxon Smith-Njigba
  '7588',  // Javonte Williams
  '9493',  // Puka Nacua
  '12514', // Emeka Egbuka
  '8146',  // Garrett Wilson
  '8144',  // Chris Olave
  '8137',  // George Pickens
  '12512', // Quinshon Judkins
  '9484'   // Tucker Kraft
]);

const {
  getLeagueInfo,
  getUsers,
  getRosters,
  getNFLState,
  getNFLPlayers,
  getDraftPicks,
  getTransactions
} = useSleeper();

const route = useRoute();
const leagueId = computed(() => route.params.leagueId as string);
const leagueInfo = ref<LeagueInfo>();
const nflState = ref<NFLSeasonInfo>();
const users = ref<User[]>([]);
const rosters = ref<Roster[]>([]);
const candidates = ref<KeeperPlayer[]>([]);
const selectedRosterId = ref<number>();
const loading = ref(true);

const teamName = (roster: Roster) => {
  const user = users.value.find(candidate => candidate.user_id === roster.owner_id);
  return user?.metadata?.team_name ?? user?.display_name ?? `Team ${roster.roster_id}`;
};

const teamOptions = computed(() => [...rosters.value]
  .sort((a, b) => teamName(a).localeCompare(teamName(b))));

const selectedPlayers = computed(() => candidates.value
  .filter(candidate => candidate.rosterId === selectedRosterId.value)
  .sort((a, b) => Number(b.eligible) - Number(a.eligible)
    || (a.keeperRound ?? 99) - (b.keeperRound ?? 99)
    || a.playerName.localeCompare(b.playerName)));
const eligibleCandidates = computed(() => selectedPlayers.value.filter(candidate => candidate.eligible));
const ineligibleCandidates = computed(() => selectedPlayers.value.filter(candidate => !candidate.eligible));

const selectedTeamName = computed(() => {
  const roster = rosters.value.find(candidate => candidate.roster_id === selectedRosterId.value);
  return roster ? teamName(roster) : '';
});

const playerName = (playerId: string, player?: NFLPlayer) => {
  if (player?.full_name) return player.full_name;
  const name = [player?.first_name, player?.last_name].filter(Boolean).join(' ');
  if (name) return name;
  return /^[A-Z]+$/.test(playerId) ? `${playerId} D/ST` : playerId;
};

const buildCandidates = (
  players: Record<string, NFLPlayer>,
  draftPicks: DraftPick[],
  transactions: SleeperTransaction[]
) => {
  const draftRoundByPlayer = new Map(
    draftPicks.map(pick => [String(pick.player_id), Number(pick.round)])
  );
  const postDeadlineAddsByRoster = new Map<number, Set<string>>();

  for (const transaction of transactions) {
    if (transaction.status !== 'complete' || !transaction.adds) continue;
    for (const [playerId, rosterId] of Object.entries(transaction.adds)) {
      const addedPlayers = postDeadlineAddsByRoster.get(Number(rosterId)) ?? new Set<string>();
      addedPlayers.add(playerId);
      postDeadlineAddsByRoster.set(Number(rosterId), addedPlayers);
    }
  }

  candidates.value = rosters.value.flatMap(roster => {
    const postDeadlineAdds = postDeadlineAddsByRoster.get(roster.roster_id) ?? new Set<string>();

    return (roster.players ?? []).map(playerId => {
      const player = players[playerId];
      const draftedRound = draftRoundByPlayer.get(playerId);
      const ineligibleReasons: string[] = [];
      if (PREVIOUS_KEEPER_IDS.has(playerId)) ineligibleReasons.push('Kept last year');
      if (postDeadlineAdds.has(playerId)) ineligibleReasons.push('Added after the trade deadline');
      if (draftedRound === 1) ineligibleReasons.push('Drafted in Round 1');
      const eligible = ineligibleReasons.length === 0;
      const keeperRound = eligible
        ? (draftedRound === undefined ? 6 : Math.min(6, draftedRound - 1))
        : undefined;

      return {
        rosterId: roster.roster_id,
        playerId,
        playerName: playerName(playerId, player),
        position: player?.position || player?.fantasy_positions?.[0],
        nflTeam: player?.team,
        draftedRound,
        eligible,
        keeperRound,
        ineligibleReasons
      };
    });
  });
};

onMounted(async () => {
  try {
    [leagueInfo.value, nflState.value, users.value, rosters.value] = await Promise.all([
      getLeagueInfo(leagueId.value),
      getNFLState(),
      getUsers(leagueId.value),
      getRosters(leagueId.value)
    ]);

    const tradeDeadlineWeek = leagueInfo.value.settings?.trade_deadline ?? 10;
    const activeSeason = leagueInfo.value.season === nflState.value.season;
    const lastTransactionWeek = activeSeason ? nflState.value.week : 18;
    const transactionWeeks = Array.from(
      { length: Math.max(0, lastTransactionWeek - tradeDeadlineWeek) },
      (_, index) => tradeDeadlineWeek + index + 1
    );

    const [players, draftPicks, weeklyTransactions] = await Promise.all([
      getNFLPlayers(),
      leagueInfo.value.draft_id ? getDraftPicks(leagueInfo.value.draft_id) : Promise.resolve([]),
      Promise.all(transactionWeeks.map(week => getTransactions(leagueId.value, week)))
    ]);

    buildCandidates(players, draftPicks, weeklyTransactions.flat());
    selectedRosterId.value = teamOptions.value[0]?.roster_id;
  } catch (error) {
    console.error('Error loading keeper eligibility:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <main class="min-h-screen bg-slate-50">
    <div class="container mx-auto max-w-4xl px-3 py-4 sm:px-4 sm:py-8">
      <header class="mb-6 flex items-center justify-between gap-4 rounded-2xl bg-slate-900 p-4 text-white shadow-lg shadow-slate-200">
        <div class="min-w-0">
          <h1 class="truncate text-lg font-bold">{{ leagueInfo?.name ?? 'Sleeper League' }}</h1>
          <p class="text-sm text-slate-300">Keeper Eligibility</p>
        </div>
        <NuxtLink :to="`/${leagueId}`" class="flex-none rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20">
          Back to BR
        </NuxtLink>
      </header>

      <div v-if="loading" class="flex min-h-[40vh] items-center justify-center text-slate-500">
        <LoaderCircle class="mr-2 animate-spin" /> Checking keeper eligibility…
      </div>

      <template v-else>
        <section class="mb-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <label for="keeper-team" class="mb-2 block text-sm font-semibold text-slate-700">Team</label>
          <div class="relative">
            <select
              id="keeper-team"
              v-model.number="selectedRosterId"
              class="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-3 pr-10 text-base font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option v-for="roster in teamOptions" :key="roster.roster_id" :value="roster.roster_id">
                {{ teamName(roster) }}
              </option>
            </select>
            <ChevronDown class="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          </div>
        </section>

        <section class="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <header class="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <h2 class="truncate font-semibold text-slate-900">{{ selectedTeamName }}</h2>
            <div class="flex flex-none items-center gap-2 text-sm font-bold tabular-nums">
              <span class="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{{ eligibleCandidates.length }} eligible</span>
              <span class="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{{ ineligibleCandidates.length }} out</span>
            </div>
          </header>

          <div v-if="selectedPlayers.length">
            <div v-if="eligibleCandidates.length">
              <h3 class="border-b border-slate-100 bg-emerald-50/60 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-emerald-700">
                Eligible
              </h3>
              <div class="divide-y divide-slate-100">
                <article
                  v-for="candidate in eligibleCandidates"
                  :key="candidate.playerId"
                  class="flex items-center justify-between gap-3 p-4"
                >
                  <div class="min-w-0">
                    <p class="truncate font-semibold text-slate-900">{{ candidate.playerName }}</p>
                    <p class="text-sm text-slate-500">
                      {{ [candidate.position, candidate.nflTeam].filter(Boolean).join(' · ') }}
                      <span class="mx-1">·</span>
                      {{ candidate.draftedRound ? `Drafted Round ${candidate.draftedRound}` : 'Undrafted' }}
                    </p>
                  </div>
                  <div class="flex-none rounded-xl bg-emerald-50 px-3 py-2 text-center ring-1 ring-emerald-100">
                    <p class="text-xs font-semibold uppercase tracking-wide text-emerald-700">Keeper Cost</p>
                    <p class="text-lg font-bold tabular-nums text-emerald-900">Round {{ candidate.keeperRound }}</p>
                  </div>
                </article>
              </div>
            </div>

            <div v-if="ineligibleCandidates.length">
              <h3 class="border-y border-slate-100 bg-slate-100/80 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-slate-600">
                Not Eligible
              </h3>
              <div class="divide-y divide-slate-100">
                <article
                  v-for="candidate in ineligibleCandidates"
                  :key="candidate.playerId"
                  class="flex items-center justify-between gap-3 p-4"
                >
                  <div class="min-w-0">
                    <p class="truncate font-semibold text-slate-700">{{ candidate.playerName }}</p>
                    <p class="text-sm text-slate-500">
                      {{ [candidate.position, candidate.nflTeam].filter(Boolean).join(' · ') }}
                      <span class="mx-1">·</span>
                      {{ candidate.draftedRound ? `Drafted Round ${candidate.draftedRound}` : 'Undrafted' }}
                    </p>
                    <p class="mt-1 text-sm font-medium text-rose-700">{{ candidate.ineligibleReasons.join(' · ') }}</p>
                  </div>
                  <span class="flex-none rounded-lg bg-rose-50 px-2.5 py-1 text-sm font-semibold text-rose-700 ring-1 ring-rose-100">
                    Not eligible
                  </span>
                </article>
              </div>
            </div>
          </div>

          <div v-else class="px-4 py-10 text-center text-slate-500">
            No roster players found for this team.
          </div>
        </section>
      </template>
    </div>
  </main>
</template>
