import { marked } from 'marked';

export interface RecapPost {
  slug: string;
  title: string;
  week: number;
  season: number;
  publishedAt: string;
  excerpt: string;
  body: string;
  html: string;
}

interface RecapFrontmatter {
  title?: string;
  week?: string;
  season?: string;
  publishedAt?: string;
  excerpt?: string;
}

const recapFiles = import.meta.glob('../content/recaps/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
}) as Record<string, string>;

const unquote = (value: string) => {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
    || (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

const parseRecap = (path: string, source: string): RecapPost => {
  const normalized = source.replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error(`Recap ${path} is missing frontmatter`);

  const metadata = match[1].split('\n').reduce<RecapFrontmatter>((fields, line) => {
    const separator = line.indexOf(':');
    if (separator < 0) return fields;
    const key = line.slice(0, separator).trim() as keyof RecapFrontmatter;
    fields[key] = unquote(line.slice(separator + 1));
    return fields;
  }, {});

  const slug = path.split('/').pop()?.replace(/\.md$/, '') ?? '';
  const body = match[2].trim();
  const title = metadata.title?.trim();
  const week = Number(metadata.week);
  const season = Number(metadata.season);
  const publishedAt = metadata.publishedAt?.trim();
  const excerpt = metadata.excerpt?.trim();

  if (!slug || !title || !week || !season || !publishedAt || !excerpt) {
    throw new Error(`Recap ${path} has incomplete frontmatter`);
  }

  return {
    slug,
    title,
    week,
    season,
    publishedAt,
    excerpt,
    body,
    html: marked.parse(body, { async: false, gfm: true }) as string
  };
};

const recaps = Object.entries(recapFiles)
  .map(([path, source]) => parseRecap(path, source))
  .sort((a, b) => b.season - a.season
    || b.week - a.week
    || b.publishedAt.localeCompare(a.publishedAt));

export const useRecaps = () => recaps;

