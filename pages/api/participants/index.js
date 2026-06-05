import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { supabaseAdmin } from "../../../lib/supabase";

const ADMIN_EMAIL = "milannaigorevna@gmail.com";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const isAdmin = session.user.email === ADMIN_EMAIL;

  if (req.method === "GET") {
    const { data, error } = await supabaseAdmin
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

    // Check if email already registered
    const { data: existing } = await supabaseAdmin
      .from("participants")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) return res.status(409).json({ error: "Email already registered" });

    const { data, error } = await supabaseAdmin
      .from("participants")
      .insert([{
        email,
        name,
        surname,
        gender,
        dob: dob || null,
        country,
        role: "Бегун",
        owner_id: session.user.id,
      }])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(201).json(data);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
