import sys

with open('supabase/functions/quotation/index.ts', 'r', encoding='utf-8') as f:
    current = f.read()

prepend = """
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logoBase64 } from "./logoBase64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

async function getUser(req: Request, supabase: ReturnType<typeof createClient>) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("Unauthorized");
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error("Unauthorized");
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role, status")
    .eq("id", user.id)
    .single();
  if (!profile || profile.status === "inactive") throw new Error("Unauthorized");
  return { ...user, name: profile.name, role: profile.role?.toLowerCase() };
}

"""

with open('supabase/functions/quotation/index.ts', 'w', encoding='utf-8') as f:
    f.write(prepend + current)
