import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://mazlsfywqcmyewhxglqd.supabase.co'  // paste your URL
const SUPABASE_ANON_KEY = 'sb_publishable_E-OklBe3V7QeHvvTytG3lQ_fDJgWr8V'                   // paste your anon key

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)