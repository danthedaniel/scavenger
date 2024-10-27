import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function handler(_req: NextApiRequest, res: NextApiResponse) {
  // Add cache-control header for 60 seconds
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");

  const { data, error } = await supabase.from("zones").select("*");
  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json(data);
}

export default handler;
