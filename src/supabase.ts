import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://etffrweydegjtbpsyvwn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0ZmZyd2V5ZGVnanRicHN5dnduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NzM1NDIsImV4cCI6MjA4MDQ0OTU0Mn0.lTjbdu18NwzLSVgsd2fWkAJnrR36tF-aAdwkMaeMLV0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
