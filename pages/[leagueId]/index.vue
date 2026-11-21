<script setup lang="ts">
import { LoaderCircle } from 'lucide-vue-next';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useSleeper } from '~/composables/useSleeperAPI';
import type { LeagueInfo, Matchup, MatchupResult, NFLSeasonInfo, Roster, User } from '~/types/sleeper';

const {
  getLeagueInfo,
  getMatchups,
  getUsers,
  getRosters,
  getNFLState,
  getNFLPlayerPositions,
  calculateMatchupProjections
} = useSleeper();

const route = useRoute();
const router = useRouter();
const leagueId = computed(() => route.params.leagueId as string);

const week = ref<number>();
const leagueInfo = ref<LeagueInfo>();
const nflState = ref<NFLSeasonInfo>();
const matchups = ref<Matchup[]>([]);
const rosters = ref<Roster[]>([]);
const users = ref<User[]>([]);
const matchupProjections = ref<MatchupResult[]>([]);
const playerPositions = ref<Record<string, string>>({});
const loading = ref(true);
let timerId: ReturnType<typeof setInterval> | undefined;

const reloadMatchups = async () => {
  if (!week.value) return;

  try {
    matchups.value = await getMatchups(leagueId.value, week.value);
    matchupProjections.value = await calculateMatchupProjections(
      leagueInfo.value?.season ?? nflState.value?.season ?? String(new Date().getFullYear()),
      week.value,
      matchups.value,
      playerPositions.value,
      Number(leagueInfo.value?.season) < Number(nflState.value?.season)
        || (leagueInfo.value?.season === nflState.value?.season && week.value < nflState.value.week)
    );
  } catch (error) {
    console.error('Error refreshing matchup data:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  if (!process.client) return;

  try {
    loading.value = true;
    [leagueInfo.value, nflState.value] = await Promise.all([
      getLeagueInfo(leagueId.value),
      getNFLState()
    ]);
    [users.value, rosters.value, playerPositions.value] = await Promise.all([
      getUsers(leagueId.value),
      getRosters(leagueId.value),
      getNFLPlayerPositions()
    ]);
    week.value = nflState.value.week;
    timerId = setInterval(reloadMatchups, 60000);
  } catch (error) {
    console.error('Error fetching league data:', error);
    await router.replace('/');
  }
});

watch(week, reloadMatchups);

const increaseWeek = () => {
  if (week.value && week.value < 18) week.value++;
};

const decreaseWeek = () => {
  if (week.value && week.value > 1) week.value--;
};

const rosterByOwner = computed(() => new Map(
  rosters.value.map(roster => [roster.owner_id, roster])
));

const pointsByRoster = computed(() => new Map(
  matchupProjections.value.map(result => [result.roster_id, result])
));

const getPoints = (userId: string): MatchupResult | undefined => {
  const rosterId = rosterByOwner.value.get(userId)?.roster_id;
  return rosterId === undefined ? undefined : pointsByRoster.value.get(rosterId);
};

const sortedUsers = computed(() => [...users.value].sort((a, b) => {
  const probabilityDifference = (getPoints(b.user_id)?.above_median_probability ?? 0)
    - (getPoints(a.user_id)?.above_median_probability ?? 0);
  if (probabilityDifference !== 0) return probabilityDifference;

  return (getPoints(b.user_id)?.starters_projected_total ?? 0)
    - (getPoints(a.user_id)?.starters_projected_total ?? 0);
}));

const medianIndex = computed(() => Math.floor(sortedUsers.value.length / 2));

const projectedMedian = computed(() => {
  const projections = matchupProjections.value
    .map(result => result.starters_projected_total)
    .sort((a, b) => a - b);
  if (!projections.length) return 0;

  const middle = Math.floor(projections.length / 2);
  return projections.length % 2
    ? projections[middle]
    : (projections[middle - 1] + projections[middle]) / 2;
});

const projectionScale = computed(() => {
  if (!matchupProjections.value.length) return { minimum: 0, maximum: 1 };

  const ranges = matchupProjections.value.flatMap(result => [
    result.starters_projected_total - result.starters_standard_deviation,
    result.starters_projected_total + result.starters_standard_deviation,
    Number(result.points ?? 0)
  ]);
  const minimum = Math.min(projectedMedian.value, ...ranges);
  const maximum = Math.max(projectedMedian.value, ...ranges);
  const padding = Math.max((maximum - minimum) * 0.08, 2);
  return { minimum: minimum - padding, maximum: maximum + padding };
});

const scalePosition = (score: number) => {
  const span = projectionScale.value.maximum - projectionScale.value.minimum;
  if (!span) return 50;
  return Math.min(100, Math.max(0, (score - projectionScale.value.minimum) / span * 100));
};

const rangeStyle = (result: MatchupResult | undefined) => {
  if (!result) return { left: '50%', width: '0%' };
  const low = scalePosition(result.starters_projected_total - result.starters_standard_deviation);
  const high = scalePosition(result.starters_projected_total + result.starters_standard_deviation);
  return { left: `${low}%`, width: `${Math.max(high - low, 0)}%` };
};

const getAvatarUrl = (user: User) => {
  const avatar = user.metadata?.avatar ?? user.avatar;
  if (!avatar) return undefined;
  return avatar.startsWith('http') ? avatar : `https://sleepercdn.com/avatars/${avatar}`;
};

onUnmounted(() => {
  if (timerId) clearInterval(timerId);
});
</script>

<template>
  <div v-if="loading" class="flex min-h-[50vh] items-center justify-center text-slate-500">
    <LoaderCircle class="mr-2 animate-spin" />
    Loading league…
  </div>

  <main v-else class="min-h-screen bg-slate-50">
    <div class="container mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-8">
      <LeagueHeader
        :league-id="leagueId"
        :league-name="leagueInfo?.name"
        active="battle-royale"
        :week="week"
        @previous-week="decreaseWeek"
        @next-week="increaseWeek"
      />

      <div class="flex flex-col gap-3">
        <template v-for="(user, index) in sortedUsers" :key="user.user_id">
          <article class="relative overflow-hidden rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition-shadow hover:shadow-md">
            <div
              v-if="index < medianIndex"
              class="absolute inset-y-0 left-0 w-1 bg-emerald-500"
              aria-label="Currently projected above league median"
            ></div>

            <div class="flex items-start justify-between gap-3">
              <div class="flex min-w-0 items-center gap-3">
                <img
                  v-if="getAvatarUrl(user)"
                  :src="getAvatarUrl(user)"
                  :alt="user.display_name"
                  class="h-11 w-11 flex-none rounded-full border-2 border-slate-200 object-cover sm:h-12 sm:w-12"
                />
                <div class="min-w-0">
                  <p class="truncate font-semibold text-slate-900">
                    {{ user.metadata?.team_name ?? `Team ${user.display_name}` }}
                  </p>
                  <p class="truncate text-sm text-slate-500">@{{ user.display_name }}</p>
                </div>
              </div>

              <span
                class="flex-none rounded-full bg-blue-50 px-3 py-1 text-lg font-bold tabular-nums text-blue-700 ring-1 ring-blue-100"
                :aria-label="`${user.display_name} win probability`"
                title="Win probability"
              >
                {{ ((getPoints(user.user_id)?.above_median_probability ?? 0) * 100).toFixed(0) }}%
              </span>
            </div>

            <div class="mt-4">
              <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
                <span class="text-slate-500">
                  Actual
                  <strong class="ml-1 font-semibold tabular-nums text-slate-900">
                    {{ getPoints(user.user_id)?.points?.toFixed(1) ?? '0.0' }}
                  </strong>
                </span>
                <span class="text-slate-500">
                  Projected
                  <strong class="ml-1 font-semibold tabular-nums text-blue-700">
                    {{ getPoints(user.user_id)?.starters_projected_total.toFixed(1) ?? '0.0' }}
                  </strong>
                  <span class="ml-1 tabular-nums text-slate-400">
                    ± {{ getPoints(user.user_id)?.starters_standard_deviation.toFixed(1) ?? '0.0' }}
                  </span>
                </span>
              </div>

              <div class="relative mt-2 h-7" :aria-label="`Score and projection range for ${user.display_name}`">
                <div class="absolute left-0 right-0 top-1/2 h-3 -translate-y-1/2 rounded-full bg-slate-100"></div>
                <div
                  class="absolute right-0 top-1/2 z-0 h-3 -translate-y-1/2 rounded-r-full border-l-2 border-emerald-500 bg-emerald-200/80"
                  :style="{ left: `${scalePosition(projectedMedian)}%` }"
                  title="Winning range above the projected median"
                ></div>
                <div
                  class="absolute top-1/2 z-10 h-1.5 -translate-y-1/2 rounded-full bg-blue-400"
                  :style="rangeStyle(getPoints(user.user_id))"
                >
                  <span class="absolute -left-px -top-1 h-3.5 w-px bg-blue-600"></span>
                  <span class="absolute -right-px -top-1 h-3.5 w-px bg-blue-600"></span>
                </div>
                <div
                  class="absolute top-1/2 z-20 h-4 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-800 ring-2 ring-white"
                  :style="{ left: `${scalePosition(getPoints(user.user_id)?.points ?? 0)}%` }"
                  title="Actual score"
                ></div>
                <div
                  class="absolute top-1/2 z-20 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-blue-600 shadow"
                  :style="{ left: `${scalePosition(getPoints(user.user_id)?.starters_projected_total ?? 0)}%` }"
                  title="Projected score"
                ></div>
              </div>
            </div>
          </article>

          <div
            v-if="index === medianIndex - 1"
            class="flex items-center gap-3 py-1 text-sm font-semibold uppercase tracking-[0.14em] text-amber-600"
          >
            <span class="h-px flex-1 bg-amber-500"></span>
            Projected BR Win Score {{ projectedMedian.toFixed(1) }}
            <span class="h-px flex-1 bg-amber-500"></span>
          </div>
        </template>
      </div>
    </div>
  </main>
</template>
