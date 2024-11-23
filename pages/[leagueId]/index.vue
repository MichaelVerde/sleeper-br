<script setup lang="ts">
import { ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-vue-next';
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import Button from '~/components/ui/button/Button.vue';
import { useSleeper } from '~/composables/useSleeperAPI';
import type { LeagueInfo, Matchup, NFLSeasonInfo, Roster, User } from '~/types/sleeper';

const { getLeagueInfo, getMatchups, getUsers, getRosters, getNFLState } = useSleeper();

// Access the `leagueId` from the route parameters
const route = useRoute();
const router = useRouter();
const leagueId = computed(() => route.params.leagueId as string);

// State to hold data
const week = ref(); // Adjust this dynamically if needed
const leagueInfo = ref<LeagueInfo>();
const nflState = ref<NFLSeasonInfo>();
const matchups = ref<Matchup[]>([]);
const rosters = ref<Roster[]>([]);
const users = ref<User[]>([]);
const loading = ref<boolean>(true)

// Fetch data when the component is mounted
onMounted(async () => {
  if (process.client) {
    try {
      loading.value = true;
      leagueInfo.value = await getLeagueInfo(leagueId.value);
      nflState.value = await getNFLState();
      week.value = nflState.value.week;

      users.value = await getUsers(leagueId.value);
      console.log("Users");
      console.log(users.value);

      rosters.value = await getRosters(leagueId.value);
      console.log("Rosters");
      console.log(rosters.value);
    } catch (error) {
      router.replace('/');
      console.error('Error fetching data:', error);
    }
  }
});

watch(week, async() => {
  matchups.value = await getMatchups(leagueId.value, week.value);
  console.log(matchups.value);
  loading.value = false;
})

const increaseWeek = () => {
  if (week.value < 18) {
    week.value++;
  }
};

const decreaseWeek = () => {
  if (week.value > 1) {
    week.value--;
  }
};

const getRosterId = (userId:string ):number | undefined => {
  return rosters.value.find(r => r.owner_id === userId)?.roster_id;
};

const getPoints = (userId:string):number | undefined => {
  const rosterId = getRosterId(userId);
  return matchups.value.find(m => m.roster_id === rosterId)?.points;
};

const sortedUsers = computed(() => {
  return users.value.sort((a, b) => {
    return (getPoints(b.user_id) ?? 0) - (getPoints(a.user_id) ?? 0);
  })
})

const medianIdx = computed(() => {
    return users.value.length / 2;
})

</script>

<template>
  <div v-if="loading" class="rounded-2 w-full h-1/2 p-4">
    <LoaderCircle class="mr-2 animate-spin" />
  </div>
  <div class="container mx-auto py-8" v-else>
    <!-- Week Controls with Buttons -->
    <div class="flex justify-center items-center gap-4 mb-6">
      <Button size="icon" variant="outline"
        @click="decreaseWeek"
      >
        <ChevronLeft></ChevronLeft>
      </Button>
      <span class="text-xl font-semibold">Week {{ week }}</span>
      <Button size="icon" variant="outline"
        @click="increaseWeek"
      >
        <ChevronRight></ChevronRight>
      </Button>
    </div>
    <div class="flex flex-col gap-2">
      <template v-for="(user, index) in sortedUsers"
        :key="user.user_id">
        <div class="bg-white shadow-md rounded-lg p-4 flex items-center space-x-4 hover:shadow-lg transition-shadow justify-between"
        >
          <div class="flex items-center gap-4">
            <img
              v-if="user.metadata?.avatar ?? user.avatar"
              :src="user.metadata?.avatar ?? `https://sleepercdn.com/avatars/${user.avatar}`"
              :alt="user.display_name"
              class="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
            />
            <div>   
              <p class="text-lg font-medium text-gray-800">{{ user.metadata?.team_name ?? `Team ${ user.display_name}` }}</p>
              <p class="text-sm font-normal text-gray-800">@{{ user.display_name }}</p>
            </div>
          </div>
          <div>
            <div class="text-right">
              <p class="text-lg font-semibold text-blue-600">{{ getPoints(user.user_id) }} pts</p>
            </div>
          </div>
        </div>
        <div v-if="index === medianIdx -1" class="bg-primary w-full flex flex-col justify-center items-center rounded">
          <div class="text-lg font-medium text-white p-2 w-full flex flex-col justify-center items-center">
            ▲ Battle Royale Winners ▲
          </div>
          <div class="text-lg font-medium text-white p-2 border-t border-white w-full flex flex-col justify-center items-center">
            ▼ Battle Royale Losers ▼
          </div>
        </div>
    </template>
    </div>
  </div>
</template>