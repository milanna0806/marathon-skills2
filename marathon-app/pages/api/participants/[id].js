// pages/api/participants/[id].js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { supabase } from "../../../lib/supabase";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.query;

  if (req.method === "PATCH") {
    const { bmi } = req.body;

    // Убеждаемся, что запись принадлежит текущему пользователю
    const { data: existing } = await supabase
      .from("participants")
      .select("created_by")
      .eq("id", id)
      .single();

    if (!existing || existing.created_by !== session.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { data, error } = await supabase
      .from("participants")
      .update({ bmi })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
