import type { Conference, ProgramSession, SiteBlock } from '@/lib/types';

export const HIDDEN_BLOCK_TITLES = new Set(['deadlines', 'topics', 'program']);

export type SiteBlockVariant = 'card' | 'plain';

export type SiteBlockRenderContext = {
  block: SiteBlock;
  conference: Conference;
  program?: ProgramSession[];
  variant?: SiteBlockVariant;
};
