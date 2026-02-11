import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://aatirfpbcgvgbyuemsgb.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_yG7gPa2OZqDw0pWXHGD36w_McWdwa1x'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)