type SupportUser = {
  id?: string;
  name: string;
  email: string;
  subscription?: 'free' | 'premium';
};

export type SupportPlatform = 'mobile' | 'desktop';

export type SupportContributionRow = {
  id: number;
  user_id: string | null;
  name: string | null;
  email: string | null;
  amount: number;
  currency: string;
  upi_id: string;
  payee_name: string | null;
  platform: SupportPlatform | string | null;
  source: string | null;
  payment_link: string | null;
  status: string | null;
  created_at: string;
};

const SUPPORT_TABLE = 'support_contributions';
export const SUPPORT_UPI_ID = 'kalpkothari14@oksbi';
export const SUPPORT_PAYEE_NAME = 'DeepGuard Support';

const getSupabaseConfig = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return { supabaseUrl, supabaseAnonKey };
};

export const buildSupportUpiLink = (amount: number) => {
  const normalizedAmount = Number.isInteger(amount) ? amount.toFixed(0) : amount.toFixed(2);
  const payeeName = encodeURIComponent(SUPPORT_PAYEE_NAME);
  return `upi://pay?pa=${SUPPORT_UPI_ID}&pn=${payeeName}&am=${normalizedAmount}&cu=INR`;
};

type RecordSupportIntentArgs = {
  amount: number;
  paymentLink: string;
  platform: SupportPlatform;
  source: string;
  user?: SupportUser | null;
};

export const recordSupportIntent = async ({ amount, paymentLink, platform, source, user }: RecordSupportIntentArgs) => {
  const config = getSupabaseConfig();
  if (!config) return;

  try {
    const baseUrl = config.supabaseUrl.replace(/\/$/, '');
    const requestUrl = `${baseUrl}/rest/v1/${SUPPORT_TABLE}`;
    const payload = {
      user_id: user?.id ?? null,
      name: user?.name ?? 'Anonymous',
      email: user?.email ?? null,
      amount,
      currency: 'INR',
      upi_id: SUPPORT_UPI_ID,
      payee_name: SUPPORT_PAYEE_NAME,
      platform,
      source,
      payment_link: paymentLink,
      status: 'unverified',
      created_at: new Date().toISOString(),
    };

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${config.supabaseAnonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      // eslint-disable-next-line no-console
      console.debug('support intent write failed:', response.status, body);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.debug('support intent skipped:', error);
  }
};

export const fetchSupportContributions = async (): Promise<SupportContributionRow[]> => {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error('Missing Supabase environment variables');
  }

  const baseUrl = config.supabaseUrl.replace(/\/$/, '');
  const requestUrl = `${baseUrl}/rest/v1/${SUPPORT_TABLE}?select=id,user_id,name,email,amount,currency,upi_id,payee_name,platform,source,payment_link,status,created_at&order=created_at.desc`;

  const response = await fetch(requestUrl, {
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Unable to load support contributions (${response.status}): ${body}`);
  }

  return (await response.json()) as SupportContributionRow[];
};