import type { Conference, ProceedingsIssue, ProgramSession } from './entities';

export interface SiteBlockItem {
  id?: string;
  url?: string;
  caption?: string;
  year?: number;
  title?: string;
  file_url?: string;
  file_name?: string;
}

export interface SiteBlock {
  id?: string;
  type?: string;
  title?: string;
  content?: string;
  items?: SiteBlockItem[];
}

export interface SitePage {
  id: string;
  slug: string;
  title: string;
  show_in_nav: boolean;
  is_home?: boolean;
  blocks: SiteBlock[];
}

export interface SiteSettings {
  hero_title?: string;
  hero_subtitle?: string;
  accent_color: string;
  logo_url?: string;
  banner_url?: string;
  cfp_text?: string;
  contact_email?: string;
  show_program: boolean;
  show_topics: boolean;
  show_deadlines: boolean;
  show_cfp?: boolean;
  custom_blocks?: SiteBlock[];
  pages?: SitePage[];
  home_page_id?: string;
  nav_consolidated?: boolean;
}

export interface PublicConference extends Conference {
  site?: { theme_json: SiteSettings; is_published: boolean };
  program?: ProgramSession[];
  proceedings?: ProceedingsIssue;
}
