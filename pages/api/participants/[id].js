import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { supabaseAdmin } from "../../../lib/supabase";

const ADMIN_EMAIL = "milannaigorevna@gmail.com";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const isAdmin = session.user.email === ADMIN_EMAIL;
  const { id } = req.query;

  if (req.method === "PATCH") {
    const { bmi, name, surname, email, gender, dob, country, role } = req.body;

    if (!isAdmin) {
      const { data: participant } = await supabaseAdmin
        .from("participants")
        .select("owner_id")
        .eq("id", id)
        .single();

      if (!participant || participant.owner_id !== session.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { data, error } = await supabaseAdmin
        .from("participants")
        .update({ bmi })
        .eq("id", id)
        .select()
        .single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    const updateFields = {};
    if (bmi !== undefined) updateFields.bmi = bmi;
    if (name !== undefined) updateFields.name = name;
    if (surname !== undefined) updateFields.surname = surname;
    if (email !== undefined) updateFields.email = email;
    if (gender !== undefined) updateFields.gender = gender;
    if (dob !== undefined) updateFields.dob = dob;
    if (country !== undefined) updateFields.country = country;
    if (role !== undefined) updateFields.role = role;
    updateFields.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("participants")
      .update(updateFields)
      .eq("id", id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "DELETE") {
    if (!isAdmin) return res.status(403).json({ error: "Forbidden: admin only" });

    const { error } = await supabaseAdmin
      .from("participants")
      .delete()
      .eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
