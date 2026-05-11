import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://dwadhzabswoexsmmyyqq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3YWRoemFic3dvZXhzbW15eXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NDkzNjYsImV4cCI6MjA5NDAyNTM2Nn0.DOB3JYQccI15pCjMx33oGLgefG9BoR5QoxbzXp207cA';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
