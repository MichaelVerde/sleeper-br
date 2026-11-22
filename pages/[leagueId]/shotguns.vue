<script setup lang="ts">
import { Beer, Clock3, LoaderCircle } from 'lucide-vue-next';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { getMatchupPlayerPoints, isGameFinal, useSleeper } from '~/composables/useSleeperAPI';
import type { Game, PlayerStats } from '~/composables/useGraphQL';
import type { LeagueInfo, Matchup, NFLPlayer, NFLSeasonInfo, Roster, User } from '~/types/sleeper';

interface ShotgunIncident {
  playerId: string;
  playerName: string;
  position?: string;
  nflTeam?: string;
  points: number;
  status: 'pending' | 'confirmed';
  pendingLabel: string;
  pendingStage: 'early' | 'nervous' | 'bad' | 'dire';
  dueAt?: Date;
  dueText: string;
}

interface TeamShotguns {
  rosterId: number;
  user?: User;
  incidents: ShotgunIncident[];
}

const {
  getLeagueInfo,
  getMatchups,
  getUsers,
  getRosters,
  getNFLState,
  getNFLPlayers,
  getAllProjections,
  getAllGames
} = useSleeper();

const route = useRoute();
const leagueId = computed(() => route.params.leagueId as string);
const leagueInfo = ref<LeagueInfo>();
const nflState = ref<NFLSeasonInfo>();
const users = ref<User[]>([]);
const rosters = ref<Roster[]>([]);
const players = ref<Record<string, NFLPlayer>>({});
const week = ref<number>();
const teams = ref<TeamShotguns[]>([]);
const loading = ref(true);
let loadRequest = 0;

const formatDeadline = (date: Date) => new Intl.DateTimeFormat('en-CA', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZoneName: 'short'
}).format(date);

const getPendingState = (game: Game) => {
  const quarter = game.metadata?.quarter;
  const quarterNumber = game.metadata?.quarter_num || Number(quarter) || 1;

  if (quarterNumber <= 1) return { label: 'Still Early', stage: 'early' as const };
  if (quarterNumber === 2 && quarter !== 'HALF' && quarter !== 'Halftime') {
    return { label: 'Getting Nervous', stage: 'nervous' as const };
  }
  if (quarterNumber <= 3 || quarter === 'HALF' || quarter === 'Halftime') {
    return { label: 'Not Lookin’ Good', stage: 'bad' as const };
  }
  return { label: 'Get One Chillin’', stage: 'dire' as const };
};

const loadWeek = async () => {
  if (!week.value || !leagueInfo.value) return;
  const selectedWeek = week.value;
  const request = ++loadRequest;
  loading.value = true;

  try {
    const season = leagueInfo.value.season;
    const matchups = await getMatchups(leagueId.value, selectedWeek);
    const [stats, games, nextWeekGames] = await Promise.all([
      getAllProjections(season, selectedWeek, matchups),
      getAllGames(season, selectedWeek),
      selectedWeek < 18 ? getAllGames(season, selectedWeek + 1) : Promise.resolve([] as Game[])
    ]);

    if (request !== loadRequest) return;

    const liveByPlayer = new Map<string, PlayerStats>();
    for (const stat of stats.live) {
      if (stat.player_id) liveByPlayer.set(String(stat.player_id), stat);
    }
    const projectionByPlayer = new Map<string, PlayerStats>();
    for (const projection of stats.projections) {
      if (projection.player_id) projectionByPlayer.set(String(projection.player_id), projection);
    }
    const gameById = new Map(games.map(game => [String(game.game_id), game]));
    const nextKickoff = nextWeekGames.length
      ? new Date(Math.min(...nextWeekGames.map(game => Number(game.start_time))))
      : undefined;
    const userById = new Map(users.value.map(user => [user.user_id, user]));
    const currentRosterById = new Map(rosters.value.map(roster => [roster.roster_id, roster]));
    const viewingPastWeek = Number(season) < Number(nflState.value?.season)
      || (season === nflState.value?.season && selectedWeek < (nflState.value?.week ?? selectedWeek));

    // Matchups are the historical source of truth for a week's roster. The
    // league rosters endpoint only represents the roster as it exists today.
    teams.value = matchups.map(matchup => {
      const incidents: ShotgunIncident[] = [];

      for (const [starterIndex, playerId] of (matchup.starters ?? []).entries()) {
        const live = liveByPlayer.get(playerId);
        const projection = projectionByPlayer.get(playerId);
        const game = gameById.get(String(live?.game_id || projection?.game_id || ''));
        const matchupPoints = getMatchupPlayerPoints(matchup, playerId, starterIndex);
        const hasStarted = Boolean(
          game?.metadata?.has_started
            || game?.metadata?.is_in_progress
            || isGameFinal(game)
            || (game?.start_time && Number(game.start_time) <= Date.now())
        );
        if ((!game || !hasStarted) && !(viewingPastWeek && matchupPoints !== undefined)) continue;

        // Sleeper stores these scores with the historical matchup, so they
        // remain accurate after a player or defense leaves the current roster.
        const points = matchupPoints ?? Number(live?.stats?.pts_half_ppr ?? 0);
        if (points > 0) continue;

        const confirmed = viewingPastWeek && matchupPoints !== undefined
          ? true
          : isGameFinal(game);
        if (!confirmed && viewingPastWeek) continue;

        const pendingState = game
          ? getPendingState(game)
          : { label: 'Drink Up, Bud', stage: 'dire' as const };
        let dueAt: Date | undefined;
        let dueText = 'Deadline will be set when the game is final';

        if (confirmed && points < 0 && game?.start_time) {
          dueAt = new Date(Number(game.start_time) + 28 * 60 * 60 * 1000);
          dueText = `Negative score · due within 24h of final (estimated ${formatDeadline(dueAt)})`;
        } else if (confirmed && points < 0) {
          dueText = 'Negative score · due within 24h of final';
        } else if (confirmed && nextKickoff) {
          dueAt = nextKickoff;
          dueText = `Zero score · due before Week ${selectedWeek + 1} kickoff (${formatDeadline(dueAt)})`;
        } else if (confirmed) {
          dueText = 'Zero score · due before the next week’s games';
        }

        const player = players.value[playerId];
        incidents.push({
          playerId,
          playerName: playerId === '0'
            ? 'No Starter'
            : player?.full_name
            || [player?.first_name, player?.last_name].filter(Boolean).join(' ')
            || playerId,
          position: player?.position || player?.fantasy_positions?.[0],
          nflTeam: live?.team || projection?.team || player?.team || (playerId.length <= 3 ? playerId : undefined),
          points,
          status: confirmed ? 'confirmed' : 'pending',
          pendingLabel: pendingState.label,
          pendingStage: pendingState.stage,
          dueAt,
          dueText
        });
      }

      incidents.sort((a, b) => a.points - b.points || a.playerName.localeCompare(b.playerName));
      const currentRoster = currentRosterById.get(matchup.roster_id);
      return {
        rosterId: matchup.roster_id,
        user: currentRoster ? userById.get(currentRoster.owner_id) : undefined,
        incidents
      };
    });
  } catch (error) {
    if (request !== loadRequest) return;
    console.error('Error loading shotgun tracker:', error);
  } finally {
    if (request === loadRequest) loading.value = false;
  }
};

onMounted(async () => {
  try {
    [leagueInfo.value, nflState.value, users.value, rosters.value, players.value] = await Promise.all([
      getLeagueInfo(leagueId.value),
      getNFLState(),
      getUsers(leagueId.value),
      getRosters(leagueId.value),
      getNFLPlayers()
    ]);
    week.value = nflState.value.week;
  } catch (error) {
    console.error('Error initializing shotgun tracker:', error);
    loading.value = false;
  }
});

watch(week, loadWeek);

const sortedTeams = computed(() => teams.value
  .filter(team => team.incidents.length > 0)
  .sort((a, b) => b.incidents.length - a.incidents.length || teamName(a).localeCompare(teamName(b))));
const confirmedCount = computed(() => teams.value.flatMap(team => team.incidents)
  .filter(incident => incident.status === 'confirmed').length);
const pendingCount = computed(() => teams.value.flatMap(team => team.incidents)
  .filter(incident => incident.status === 'pending').length);
const viewingPastWeek = computed(() => Boolean(
  week.value && nflState.value && leagueInfo.value && (
    Number(leagueInfo.value.season) < Number(nflState.value.season)
      || (leagueInfo.value.season === nflState.value.season && week.value < nflState.value.week)
  )
));

function teamName(team: TeamShotguns) {
  return team.user?.metadata?.team_name ?? team.user?.display_name ?? `Team ${team.rosterId}`;
}

function incidentBadgeClass(incident: ShotgunIncident) {
  if (incident.status === 'confirmed') return 'bg-emerald-100 text-emerald-700';
  if (incident.pendingStage === 'early') return 'bg-sky-100 text-sky-700';
  if (incident.pendingStage === 'nervous') return 'bg-yellow-100 text-yellow-700';
  if (incident.pendingStage === 'bad') return 'bg-amber-100 text-amber-700';
  return 'bg-orange-100 text-orange-700';
}

const increaseWeek = () => {
  if (week.value && week.value < 18) week.value++;
};
const decreaseWeek = () => {
  if (week.value && week.value > 1) week.value--;
};
</script>

<template>
  <main class="min-h-screen bg-slate-50">
    <div class="container mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-8">
      <LeagueHeader
        :league-id="leagueId"
        :league-name="leagueInfo?.name"
        active="shotguns"
        :week="week"
        :current-week="nflState?.week"
        @previous-week="decreaseWeek"
        @next-week="increaseWeek"
      />

      <div v-if="loading" class="flex min-h-[30vh] items-center justify-center text-slate-500">
        <LoaderCircle class="mr-2 animate-spin" /> Checking starters…
      </div>

      <template v-else>
        <section class="mb-5 grid gap-2 sm:gap-3" :class="viewingPastWeek ? 'grid-cols-1' : 'grid-cols-2'">
          <div class="rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-100 sm:p-4">
            <p class="text-sm font-semibold uppercase tracking-wide text-emerald-700">Drink Up, Bud</p>
            <p class="mt-1 text-3xl font-bold tabular-nums text-emerald-900">{{ confirmedCount }}</p>
          </div>
          <div v-if="!viewingPastWeek" class="rounded-xl bg-amber-50 p-3 ring-1 ring-amber-100 sm:p-4">
            <p class="text-sm font-semibold uppercase tracking-wide text-amber-700">Sweating It</p>
            <p class="mt-1 text-3xl font-bold tabular-nums text-amber-900">{{ pendingCount }}</p>
          </div>
        </section>

        <div v-if="sortedTeams.length" class="grid gap-4 md:grid-cols-2">
          <article
            v-for="team in sortedTeams"
            :key="team.rosterId"
            class="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200"
          >
            <header class="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <div class="min-w-0">
                <h2 class="truncate font-semibold text-slate-900">{{ teamName(team) }}</h2>
                <p v-if="team.user" class="text-sm text-slate-500">@{{ team.user.display_name }}</p>
              </div>
              <span class="rounded-full px-2.5 py-1 text-sm font-bold tabular-nums"
                :class="team.incidents.some(incident => incident.status === 'confirmed')
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'">
                {{ team.incidents.length }}
              </span>
            </header>

            <div class="divide-y divide-slate-100">
              <div v-for="(incident, incidentIndex) in team.incidents" :key="`${incident.playerId}-${incidentIndex}`" class="p-4">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex min-w-0 items-start gap-2">
                    <Beer v-if="incident.status === 'confirmed'" class="mt-0.5 h-5 w-5 flex-none text-emerald-600" />
                    <div class="min-w-0">
                      <p class="truncate font-semibold text-slate-900">{{ incident.playerName }}</p>
                      <p class="text-sm text-slate-500">
                        {{ [incident.position, incident.nflTeam].filter(Boolean).join(' · ') }}
                      </p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-lg font-bold tabular-nums" :class="incident.points < 0 ? 'text-rose-700' : 'text-slate-800'">
                      {{ incident.points.toFixed(2) }} pts
                    </p>
                    <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide"
                      :class="incidentBadgeClass(incident)">
                      {{ incident.status === 'confirmed' ? 'Drink Up, Bud' : incident.pendingLabel }}
                    </span>
                  </div>
                </div>
                <p class="mt-3 flex items-start gap-2 text-sm leading-5 text-slate-600">
                  <Clock3 class="mt-0.5 h-4 w-4 flex-none" /> {{ incident.dueText }}
                </p>
              </div>
            </div>
          </article>
        </div>

        <div v-else class="rounded-xl bg-white px-4 py-10 text-center text-slate-500 shadow-sm ring-1 ring-slate-200">
          No shotguns this week.
        </div>
      </template>
    </div>
  </main>
</template>
