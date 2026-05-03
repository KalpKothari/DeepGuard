type AuthEventType = 'signup' | 'login' | 'subscription_update';

type TelemetryUser = {
  id: string;
  name: string;
  email: string;
  subscription: 'free' | 'premium';
};

const SUPABASE_TABLE = 'website_visitors';
const SUPABASE_VISIT_EVENTS_TABLE = 'website_visit_events';

type ExistingVisitorRow = {
  first_seen_at: string | null;
  visit_count: number | null;
};

const getSupabaseConfig = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return { supabaseUrl, supabaseAnonKey };
};

export const recordAuthEvent = async (user: TelemetryUser, eventType: AuthEventType) => {
  const config = getSupabaseConfig();
  if (!config) return;

  try {
    const baseUrl = config.supabaseUrl.replace(/\/$/, '');

    let visitCount = 1;
    let firstSeenAt = new Date().toISOString();

    try {
      const fetchUrl = `${baseUrl}/rest/v1/${SUPABASE_TABLE}?user_id=eq.${user.id}&select=visit_count,first_seen_at`;
      const fetchHeaders = {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${config.supabaseAnonKey}`,
      };

      const fetchResp = await fetch(fetchUrl, {
        method: 'GET',
        headers: fetchHeaders,
      });

      if (fetchResp.ok) {
        const existingRecords = (await fetchResp.json()) as ExistingVisitorRow[];
        const existingRecord = existingRecords[0];

        if (existingRecord?.first_seen_at) {
          firstSeenAt = existingRecord.first_seen_at;
        }

        if (existingRecord?.visit_count && eventType === 'login') {
          visitCount = existingRecord.visit_count + 1;
        } else if (existingRecord?.visit_count) {
          visitCount = existingRecord.visit_count;
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.debug('supabaseTelemetry: Could not fetch existing visitor row:', error);
    }

    if (eventType === 'signup') {
      visitCount = 1;
      firstSeenAt = new Date().toISOString();
    }

    const payload = {
      user_id: user.id,
      name: user.name,
      email: user.email,
      subscription: user.subscription,
      event_type: eventType,
      first_seen_at: firstSeenAt,
      last_seen_at: new Date().toISOString(),
      visit_count: visitCount,
    };

    const requestUrl = `${baseUrl}/rest/v1/${SUPABASE_TABLE}?on_conflict=user_id`;
    const headers = {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    };

    // Dev debug: print composed request and masked anon key (do not leak full key)
    // eslint-disable-next-line no-console
    console.debug('supabaseTelemetry requestUrl=', requestUrl, 'visitCount=', visitCount);
    // eslint-disable-next-line no-console
    console.debug('supabaseTelemetry anonKeyPresent=', Boolean(headers.apikey), 'anonKeyMask=', String(headers.apikey).slice(0, 8) + '...');

    const resp = await fetch(requestUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      keepalive: true,
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      // eslint-disable-next-line no-console
      console.debug('supabaseTelemetry response:', resp.status, text);
    }

    if (eventType === 'signup' || eventType === 'login') {
      const eventLogUrl = `${baseUrl}/rest/v1/${SUPABASE_VISIT_EVENTS_TABLE}`;
      const eventLogPayload = {
        user_id: user.id,
        name: user.name,
        email: user.email,
        subscription: user.subscription,
        event_type: eventType,
        seen_at: new Date().toISOString(),
      };

      const eventLogResp = await fetch(eventLogUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(eventLogPayload),
        keepalive: true,
      });

      if (!eventLogResp.ok) {
        const text = await eventLogResp.text().catch(() => '');
        // eslint-disable-next-line no-console
        console.debug('supabaseTelemetry event log response:', eventLogResp.status, text);
      }
    }
  } catch (error) {
    console.warn('Supabase telemetry write skipped:', error);
  }
};