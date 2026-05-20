export function RichTextBlock({ html }: { html: string }) {
  if (!html?.trim()) return null;
  return (
    <div
      className="prose prose-slate max-w-none text-slate-700 prose-headings:text-slate-900 prose-a:text-brand-600"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
