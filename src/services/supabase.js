import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);

export const playersService = {
  async fetchAll() {
    const { data, error } = await supabase.from("players").select("name").order("created_at");
    if (error) throw error;
    return data.map(p => p.name);
  },
  async add(name) {
    return await supabase.from("players").insert({ name });
  },
  async remove(name) {
    return await supabase.from("players").delete().eq("name", name);
  }
};

export const rankingService = {
  async fetchAll() {
    const { data, error } = await supabase.from("ranking").select("*").order("wins", { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async upsert(p, wins, games) {
    return await supabase.from("ranking").upsert({
      player_name: p,
      wins,
      games,
      updated_at: new Date().toISOString(),
    }, { onConflict: "player_name" });
  },
  async reset() {
    await supabase.from("ranking").delete().neq("player_name", "");
    await supabase.from("matches").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  }
};

export const matchesService = {
  async fetchRecent(limit = 30) {
    const { data, error } = await supabase.from("matches").select("*").order("played_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return data || [];
  },
  async save(winner, winTeam, loseTeam, sW, sL) {
    return await supabase.from("matches").insert({
      winner_1: winTeam[0], winner_2: winTeam[1],
      loser_1:  loseTeam[0], loser_2: loseTeam[1],
      sets_winner: sW, sets_loser: sL,
    });
  }
};

export const liveMatchService = {
  async fetch() {
    const { data, error } = await supabase.from("live_match").select("state").eq("id", 1).single();
    if (error) throw error;
    return data?.state;
  },
  async sync(state) {
    return await supabase
      .from("live_match")
      .update({ state, updated_at: new Date().toISOString() })
      .eq("id", 1);
  }
};
