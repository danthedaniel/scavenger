import { NextApiRequest, NextApiResponse } from "next";

import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";

// Verify the request is from Vercel Cron
const validateRequest = (req: NextApiRequest) => {
  const cronSecret = process.env.CRON_SECRET;
  return timingSafeEqual(
    Buffer.from(req.headers.authorization ?? ""),
    Buffer.from(`Bearer ${cronSecret}`)
  );
};

// Initialize Supabase client (using same config as your other API routes)
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

/**
 * Make a simple database query to keep the database from being paused.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!validateRequest(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Query all zones from the database
    const { error } = await supabase.from("zones").select("*");
    if (error) {
      throw error;
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Cron job failed:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
