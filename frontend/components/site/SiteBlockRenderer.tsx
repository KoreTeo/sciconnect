import { HIDDEN_BLOCK_TITLES, type SiteBlockRenderContext } from '@/lib/site/blockTypes';
import { RichTextBlock } from './RichTextBlock';
import { PhotoGallery } from './PhotoGallery';
import { ProceedingsArchive } from './ProceedingsArchive';
import { PublicProgramSchedule } from './PublicProgramSchedule';
import { SiteBlockShell } from './SiteBlockShell';
import {
  CommitteeBlock,
  ContactBlock,
  CtaBlock,
  DeadlinesBlock,
  ImageBlock,
  SponsorsBlock,
  TopicsBlock,
  VenueBlock,
} from './blocks/SiteContentBlocks';

export function SiteBlockRenderer(ctx: SiteBlockRenderContext) {
  const { block, conference, program, variant = 'card' } = ctx;
  const type = block.type || 'text';
  const showTitle = Boolean(block.title) && !HIDDEN_BLOCK_TITLES.has(type);

  return (
    <SiteBlockShell title={block.title} showTitle={showTitle} variant={variant}>
      {type === 'text' && <RichTextBlock html={block.content || ''} />}
      {type === 'committee' && <CommitteeBlock {...ctx} />}
      {type === 'sponsors' && <SponsorsBlock {...ctx} />}
      {type === 'image' && <ImageBlock {...ctx} />}
      {type === 'gallery' && <PhotoGallery items={block.items || []} />}
      {type === 'proceedings' && <ProceedingsArchive items={block.items || []} />}
      {type === 'program' && <PublicProgramSchedule sessions={program || []} />}
      {type === 'deadlines' && <DeadlinesBlock {...ctx} />}
      {type === 'topics' && <TopicsBlock {...ctx} />}
      {type === 'venue' && <VenueBlock {...ctx} />}
      {type === 'cta' && <CtaBlock {...ctx} />}
      {type === 'contact' && <ContactBlock {...ctx} />}
    </SiteBlockShell>
  );
}
