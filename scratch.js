import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || "https://rgipmrviqapxxilsiclm.supabase.co"; // wait, the url is in the environment. Let's use dotenv or just run it via edge function.
// Actually, let me just write it as a Deno script since Deno is used for edge functions.
