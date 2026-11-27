<script setup lang="ts">
import { BookOpen, CalendarDays, Newspaper } from 'lucide-vue-next';
import { MAIN_LEAGUE_ID } from '~/lib/parlay';

const route = useRoute();
if (String(route.params.leagueId) !== MAIN_LEAGUE_ID) {
  throw createError({ statusCode: 404, statusMessage: 'Recaps not found' });
}

const recaps = useRecaps();
const latestRecap = recaps[0];
const olderRecaps = recaps.slice(1);

const formatDate = (date: string) => new Intl.DateTimeFormat('en-CA', {
  month: 'long',
  day: 'numeric',
  year: 'numeric'
}).format(new Date(`${date}T12:00:00`));

useHead({
  title: 'Weekly Recaps | Touchdown My Pants 3.0',
  meta: [{
    name: 'description',
    content: 'Weekly recaps and league history for Touchdown My Pants 3.0.'
  }]
});
</script>

<template>
  <main class="min-h-screen bg-slate-100">
    <div class="container mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-8">
      <LeagueHeader
        :league-id="MAIN_LEAGUE_ID"
        league-name="Touchdown My Pants 3.0"
        active="recap"
      />

      <header class="relative overflow-hidden rounded-2xl bg-slate-950 px-5 py-10 text-white shadow-xl sm:px-10 sm:py-12">
        <div class="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl"></div>
        <div class="relative max-w-3xl">
          <div class="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-amber-300">
            <Newspaper class="h-5 w-5" /> League archive
          </div>
          <h1 class="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Weekly recaps</h1>
          <p class="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            Every collapse, waiver crime and accidental masterpiece from the 2026 season, preserved before the group chat can rewrite history.
          </p>
        </div>
      </header>

      <section v-if="latestRecap" aria-labelledby="latest-recap" class="mt-6">
        <h2 id="latest-recap" class="sr-only">Latest recap</h2>
        <NuxtLink
          :to="`/${MAIN_LEAGUE_ID}/recaps/${latestRecap.slug}`"
          class="group block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div class="border-l-4 border-amber-400 p-6 sm:p-8">
            <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-slate-500">
              <span class="rounded-full bg-amber-50 px-3 py-1 text-amber-800 ring-1 ring-amber-200">Latest recap</span>
              <span class="inline-flex items-center gap-1.5"><CalendarDays class="h-4 w-4" /> Week {{ latestRecap.week }}</span>
              <span>{{ formatDate(latestRecap.publishedAt) }}</span>
            </div>
            <h2 class="mt-4 text-2xl font-black tracking-tight text-slate-950 transition group-hover:text-blue-700 sm:text-3xl">
              {{ latestRecap.title }}
            </h2>
            <p class="mt-3 max-w-3xl text-base leading-7 text-slate-600">{{ latestRecap.excerpt }}</p>
            <span class="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-700">
              <BookOpen class="h-4 w-4" /> Read the recap
            </span>
          </div>
        </NuxtLink>
      </section>

      <section v-if="olderRecaps.length" aria-labelledby="older-recaps" class="mt-10">
        <h2 id="older-recaps" class="text-2xl font-black tracking-tight text-slate-950">Earlier posts</h2>
        <div class="mt-5 grid gap-4 sm:grid-cols-2">
          <NuxtLink
            v-for="recap in olderRecaps"
            :key="recap.slug"
            :to="`/${MAIN_LEAGUE_ID}/recaps/${recap.slug}`"
            class="group rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p class="text-xs font-bold uppercase tracking-wider text-blue-700">Week {{ recap.week }} · {{ recap.season }}</p>
            <h3 class="mt-2 text-lg font-black text-slate-950 transition group-hover:text-blue-700">{{ recap.title }}</h3>
            <p class="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{{ recap.excerpt }}</p>
            <p class="mt-4 text-xs font-semibold text-slate-400">{{ formatDate(recap.publishedAt) }}</p>
          </NuxtLink>
        </div>
      </section>

      <section v-else-if="latestRecap" class="mt-8 rounded-xl border border-dashed border-slate-300 px-5 py-6 text-center text-sm text-slate-500">
        Older weekly posts will appear here automatically as Markdown recap files are added.
      </section>
    </div>
  </main>
</template>

