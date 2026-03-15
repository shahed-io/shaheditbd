import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ContentSection {
  id: string;
  title: string;
  body: string;
}

interface PageContent {
  pageKey: string;
  title: string;
  subtitle: string;
  badge: string;
  sections: ContentSection[];
}

export const usePageContent = (pageKey: string, fallback: PageContent) => {
  const CONTENT_KEY = `page_content_${pageKey}`;
  const { data, isLoading } = useQuery<PageContent>({
    queryKey: ['page-content', pageKey],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', CONTENT_KEY)
        .maybeSingle();
      if (data?.value) return JSON.parse(data.value) as PageContent;
      return fallback;
    },
    staleTime: 1000 * 60 * 5,
  });
  return { content: data ?? fallback, isLoading };
};

export type { PageContent, ContentSection };
