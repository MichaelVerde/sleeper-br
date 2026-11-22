<script setup lang="ts">
import {
  Beer,
  ChevronLeft,
  ChevronRight,
  Menu,
  ShieldCheck,
  Swords,
  TicketCheck,
  Trophy,
  X
} from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { MAIN_LEAGUE_ID } from '~/lib/parlay';

const props = defineProps<{
  leagueId: string;
  leagueName?: string;
  active: 'battle-royale' | 'standings' | 'shotguns' | 'keepers' | 'parlay';
  week?: number;
  currentWeek?: number;
}>();

defineEmits<{
  previousWeek: [];
  nextWeek: [];
}>();

const baseItems = [
  { id: 'battle-royale', label: 'Battle Royale', path: '', icon: Swords },
  { id: 'shotguns', label: 'Shotguns', path: '/shotguns', icon: Beer },
  { id: 'standings', label: 'Standings', path: '/standings', icon: Trophy }
] as const;

const items = computed(() => {
  if (props.leagueId !== MAIN_LEAGUE_ID) return baseItems;

  const mainLeagueItems = [
    { id: 'keepers', label: 'Keepers', path: '/keepers', icon: ShieldCheck },
    { id: 'parlay', label: 'Parlay', path: '/parlay', icon: TicketCheck }
  ];
  return [...baseItems, ...mainLeagueItems];
});

const menuRoot = ref<HTMLDetailsElement>();
const closeMenu = () => menuRoot.value?.removeAttribute('open');
</script>

<template>
  <header class="relative z-20 mb-6 flex items-center gap-2 rounded-2xl bg-slate-900 p-3 text-white shadow-lg shadow-slate-200 sm:gap-3">
    <NuxtLink :to="`/${leagueId}`" class="min-w-0 flex-1 px-1">
      <h1 class="truncate text-base font-bold sm:text-lg">{{ leagueName || 'Sleeper League' }}</h1>
    </NuxtLink>

    <div v-if="week !== undefined" class="flex flex-none items-center rounded-xl bg-white/10 p-1">
      <button
        type="button"
        class="rounded-lg p-2 text-slate-200 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
        :disabled="week <= 1"
        aria-label="Previous week"
        @click="$emit('previousWeek')"
      >
        <ChevronLeft class="h-4 w-4" />
      </button>
      <span class="min-w-16 text-center text-sm font-bold">Week {{ week }}</span>
      <button
        type="button"
        class="rounded-lg p-2 text-slate-200 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
        :disabled="week >= 18"
        aria-label="Next week"
        @click="$emit('nextWeek')"
      >
        <ChevronRight class="h-4 w-4" />
      </button>
    </div>

    <details ref="menuRoot" class="group relative flex-none">
      <summary
        class="cursor-pointer list-none rounded-xl bg-white/10 p-2.5 text-slate-200 transition-colors hover:bg-white/20 hover:text-white [&::-webkit-details-marker]:hidden"
        aria-label="League menu"
      >
        <Menu class="h-5 w-5 group-open:hidden" />
        <X class="hidden h-5 w-5 group-open:block" />
      </summary>

      <nav
        id="league-menu"
        class="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl bg-white p-1.5 text-slate-800 shadow-xl ring-1 ring-slate-200"
        aria-label="League pages"
      >
        <NuxtLink
          v-for="item in items"
          :key="item.id"
          :to="`/${leagueId}${item.path}`"
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors"
          :class="item.id === active
            ? 'bg-slate-900 text-white'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'"
          :aria-current="item.id === active ? 'page' : undefined"
          @click="closeMenu"
        >
          <component :is="item.icon" class="h-4 w-4 flex-none" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>
    </details>
  </header>
</template>
