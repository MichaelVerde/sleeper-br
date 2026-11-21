<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';

defineProps<{
  leagueId: string;
  leagueName?: string;
  active: 'battle-royale' | 'standings' | 'shotguns';
  week?: number;
}>();

defineEmits<{
  previousWeek: [];
  nextWeek: [];
}>();

const items = [
  { id: 'battle-royale', label: 'BR', shortLabel: 'BR', path: '' },
  { id: 'shotguns', label: 'Shotguns', shortLabel: 'Shotguns', path: '/shotguns' },
  { id: 'standings', label: 'Standings', shortLabel: 'Standings', path: '/standings' }
] as const;
</script>

<template>
  <header class="mb-6 flex flex-wrap items-center gap-3 rounded-2xl bg-slate-900 p-3 text-white shadow-lg shadow-slate-200">
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

    <nav class="order-3 flex w-full gap-1 rounded-xl bg-white/10 p-1 md:order-none md:w-auto" aria-label="League pages">
      <NuxtLink
        v-for="item in items"
        :key="item.id"
        :to="`/${leagueId}${item.path}`"
        class="flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-center text-sm font-semibold transition-colors md:flex-none"
        :class="item.id === active
          ? 'bg-white text-slate-900 shadow-sm'
          : 'text-slate-300 hover:bg-white/10 hover:text-white'"
      >
        <span class="sm:hidden">{{ item.shortLabel }}</span>
        <span class="hidden sm:inline">{{ item.label }}</span>
      </NuxtLink>
    </nav>
  </header>
</template>
