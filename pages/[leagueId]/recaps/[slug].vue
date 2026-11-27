<script setup lang="ts">
import { CalendarDays, Newspaper } from 'lucide-vue-next';
import { MAIN_LEAGUE_ID } from '~/lib/parlay';

const route = useRoute();
if (String(route.params.leagueId) !== MAIN_LEAGUE_ID) {
  throw createError({ statusCode: 404, statusMessage: 'Recap not found' });
}

const recaps = useRecaps();
const recapIndex = recaps.findIndex(recap => recap.slug === String(route.params.slug));
if (recapIndex < 0) {
  throw createError({ statusCode: 404, statusMessage: 'Recap not found' });
}

const recap = recaps[recapIndex];
const newerRecap = recapIndex > 0 ? recaps[recapIndex - 1] : undefined;
const olderRecap = recapIndex < recaps.length - 1 ? recaps[recapIndex + 1] : undefined;

const publishedDate = new Intl.DateTimeFormat('en-CA', {
  month: 'long',
  day: 'numeric',
  year: 'numeric'
}).format(new Date(`${recap.publishedAt}T12:00:00`));

useHead({
  title: `${recap.title} | Touchdown My Pants 3.0`,
  meta: [{ name: 'description', content: recap.excerpt }]
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

      <article class="overflow-hidden rounded-2xl bg-white shadow-xl shadow-slate-200/70 ring-1 ring-slate-200">
        <header class="relative overflow-hidden bg-slate-950 px-5 py-10 text-white sm:px-10 sm:py-14">
          <div class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl"></div>
          <div class="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl"></div>
          <div class="relative max-w-3xl">
            <NuxtLink
              :to="`/${MAIN_LEAGUE_ID}/recaps`"
              class="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-amber-300 hover:text-amber-200"
            >
              <Newspaper class="h-4 w-4" /> Weekly recaps
            </NuxtLink>
            <h1 class="mt-5 text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">{{ recap.title }}</h1>
            <div class="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-slate-300">
              <span class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/10">
                <CalendarDays class="h-4 w-4" /> Week {{ recap.week }}
              </span>
              <span>{{ recap.season }} season</span>
              <time :datetime="recap.publishedAt">{{ publishedDate }}</time>
            </div>
          </div>
        </header>

        <div class="px-5 py-8 sm:px-10 sm:py-12">
          <div class="recap-prose mx-auto max-w-3xl" v-html="recap.html"></div>

          <nav v-if="newerRecap || olderRecap" class="mx-auto mt-12 grid max-w-3xl gap-4 border-t border-slate-200 pt-8 sm:grid-cols-2" aria-label="Recap navigation">
            <NuxtLink
              v-if="newerRecap"
              :to="`/${MAIN_LEAGUE_ID}/recaps/${newerRecap.slug}`"
              class="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200 transition hover:bg-blue-50 hover:ring-blue-200"
            >
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Newer recap</span>
              <span class="mt-1 block font-bold text-slate-900">Week {{ newerRecap.week }} · {{ newerRecap.title }}</span>
            </NuxtLink>
            <div v-else class="hidden sm:block"></div>
            <NuxtLink
              v-if="olderRecap"
              :to="`/${MAIN_LEAGUE_ID}/recaps/${olderRecap.slug}`"
              class="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200 transition hover:bg-blue-50 hover:ring-blue-200"
            >
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Older recap</span>
              <span class="mt-1 block font-bold text-slate-900">Week {{ olderRecap.week }} · {{ olderRecap.title }}</span>
            </NuxtLink>
          </nav>
        </div>
      </article>
    </div>
  </main>
</template>

<style scoped>
.recap-prose :deep(p) {
  margin-top: 1rem;
  color: rgb(71 85 105);
  font-size: 1rem;
  line-height: 1.8;
}

.recap-prose :deep(p:first-child) {
  margin-top: 0;
  color: rgb(30 41 59);
  font-size: 1.125rem;
  line-height: 1.8;
}

.recap-prose :deep(h2) {
  margin-top: 3rem;
  color: rgb(2 6 23);
  font-size: 1.875rem;
  font-weight: 900;
  letter-spacing: -0.025em;
  line-height: 1.2;
}

.recap-prose :deep(h3) {
  margin-top: 2rem;
  color: rgb(2 6 23);
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1.35;
}

.recap-prose :deep(strong) {
  color: rgb(15 23 42);
  font-weight: 800;
}

.recap-prose :deep(blockquote) {
  margin: 2rem 0;
  border-left: 4px solid rgb(251 191 36);
  border-radius: 0 0.75rem 0.75rem 0;
  background: rgb(255 251 235);
  padding: 1rem 1.25rem;
}

.recap-prose :deep(blockquote p) {
  margin: 0;
  color: rgb(120 53 15);
  font-weight: 700;
}

.recap-prose :deep(ul),
.recap-prose :deep(ol) {
  margin: 1rem 0;
  padding-left: 1.5rem;
  color: rgb(71 85 105);
}

.recap-prose :deep(ul) {
  list-style: disc;
}

.recap-prose :deep(ol) {
  list-style: decimal;
}

.recap-prose :deep(li) {
  margin-top: 0.5rem;
  line-height: 1.7;
}

.recap-prose :deep(hr) {
  margin: 3rem 0;
  border: 0;
  border-top: 1px solid rgb(226 232 240);
}

.recap-prose :deep(table) {
  margin: 1.5rem 0;
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9375rem;
}

.recap-prose :deep(th),
.recap-prose :deep(td) {
  border-bottom: 1px solid rgb(226 232 240);
  padding: 0.75rem;
  text-align: left;
}

.recap-prose :deep(th) {
  color: rgb(15 23 42);
  font-weight: 800;
}

@media (max-width: 640px) {
  .recap-prose :deep(h2) {
    font-size: 1.5rem;
  }

  .recap-prose :deep(table) {
    display: block;
    overflow-x: auto;
  }
}
</style>

