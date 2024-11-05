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

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { name } = req.body;
  if (typeof name !== "string") {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const { error: updateError } = await supabase
    .from("zones")
    .update({ discovered_on: new Date() })
    .eq("name", name);
  if (updateError) {
    return res.status(500).json({ error: updateError.message });
  }

  const { data, error: selectError } = await supabase.from("zones").select("*");
  if (selectError) {
    return res.status(500).json({ error: selectError.message });
  }

  return res.status(200).json(data);
}

export default handler;
