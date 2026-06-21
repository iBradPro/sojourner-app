import WriteTabs from '@/components/WriteTabs';

export default async function ComposePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; saved?: string; token?: string }>;
}) {
  const { tab, saved, token } = await searchParams;

  return (
    <WriteTabs
      initialTab={tab === 'drafts' ? 'drafts' : 'new'}
      savedBanner={!!saved}
      magicToken={token ?? null}
    />
  );
}
