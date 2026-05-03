export type VisitorRow = {
  user_id: string;
  name: string;
  email: string;
  subscription: 'free' | 'premium';
  event_type: 'signup' | 'login' | 'subscription_update';
  first_seen_at?: string;
  last_seen_at?: string;
  visit_count?: number;
};

export const formatDateTime = (value?: string) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const fetchAdminVisitors = async (): Promise<VisitorRow[]> => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const requestUrl = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/website_visitors?select=user_id,name,email,subscription,event_type,first_seen_at,last_seen_at,visit_count&order=last_seen_at.desc`;

  const response = await fetch(requestUrl, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Unable to load visitors (${response.status}): ${body}`);
  }

  return (await response.json()) as VisitorRow[];
};
