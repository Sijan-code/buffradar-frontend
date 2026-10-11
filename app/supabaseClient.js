import { createClient } from '@supabase/supabase-js';

// শুধু public (publishable) key এখানে থাকে। service_role key কখনো ফ্রন্টএন্ডে নয়।
const supabaseUrl = 'https://nvmqjwdkrvwcyjsqnfhh.supabase.co';
const supabaseAnonKey = 'sb_publishable_bDpW8-uqBYl_MP02kdO2sg_KB3CAC5w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

let pendingSignIn = null;

// সেশন আছে কিনা দেখে, না থাকলে চুপচাপ বেনামি সাইন-ইন করে access token ফেরত দেয়
export async function getAccessToken() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.access_token) return session.access_token;
    if (!pendingSignIn) {
      pendingSignIn = supabase.auth.signInAnonymously().finally(() => {
        pendingSignIn = null;
      });
    }
    const { data, error } = await pendingSignIn;
    return error ? null : (data && data.session && data.session.access_token) || null;
  } catch (_) {
    return null;
  }
}

// backend ডাকার হেডার: Authorization যোগ করে (টোকেন না পেলে যেমন আছে তেমনই ফেরত দেয়)
export async function authHeaders(extra = {}) {
  const token = await getAccessToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}