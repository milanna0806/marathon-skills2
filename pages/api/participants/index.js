import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { supabase } from "../../../lib/supabase";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("participants")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    const { email, name, surname, gender, dob, country } = req.body;
    if (!email || !name || !surname)
      return res.status(400).json({ error: "Missing required fields" });

    const { data, error } = await supabase
      .from("participants")
      .insert([{
        email,
        name,
        surname,
        gender,
        dob,
        country,
        role: "Бегун",
        owner_id: session.user.id,
      }])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") return res.status(409).json({ error: "Email already registered" });
      return res.status(500).json({ error: error.message });
    }
    return res.status(201).json(data);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
