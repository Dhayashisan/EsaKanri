
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://aatirfpbcgvgbyuemsgb.supabase.co';
const supabaseKey = 'sb_publishable_yG7gPa2OZqDw0pWXHGD36w_McWdwa1x';

export const supabase = createClient(supabaseUrl, supabaseKey);
        