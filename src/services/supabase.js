import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("⚠️ VITE_SUPABASE_URL e/ou VITE_SUPABASE_KEY não definidas! O app não conseguirá se conectar ao banco de dados.");
}

export const supabase = createClient(
  SUPABASE_URL || '',
  SUPABASE_KEY || ''
);

export const playersService = {
  async fetchAll() {
    const { data, error } = await supabase.from("players").select("name").order("created_at");
    if (error) throw error;
    return data.map(p => p.name);
  },
  async add(name) {
    const { data, error } = await supabase.from("players").insert({ name });
    if (error) throw error;
    return data;
  },
  async remove(name) {
    const { data, error } = await supabase.from("players").delete().eq("name", name);
    if (error) throw error;
    return data;
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
    try {
      // 1. Fetch current data to backup
      const { data: currentRanking } = await supabase.from("ranking").select("*");
      const { data: currentMatches } = await supabase.from("matches").select("*");
      
      // 2. Save to localStorage as a safety net
      const backup = {
        timestamp: new Date().toISOString(),
        ranking: currentRanking || [],
        matches: currentMatches || []
      };
      localStorage.setItem(`bc_backup_${Date.now()}`, JSON.stringify(backup));

      // 3. Keep only the last 3 backups to prevent localStorage bloat
      const backupKeys = Object.keys(localStorage)
        .filter(k => k.startsWith('bc_backup_'))
        .sort();
      while (backupKeys.length > 3) {
        localStorage.removeItem(backupKeys.shift());
      }
    } catch (e) {
      console.warn("Failed to create backup before reset", e);
    }
    
    // 4. Proceed with deletion
    await supabase.from("ranking").delete().neq("player_name", "");
    await supabase.from("matches").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  }
};

export const matchesService = {
  async fetchRecent(limit = 100) {
    const { data, error } = await supabase.from("matches").select("*").order("played_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return data || [];
  },
  async save(winner, winTeam, loseTeam, sW, sL) {
    const { data, error } = await supabase.from("matches").insert({
      winner_1: winTeam[0], winner_2: winTeam[1],
      loser_1:  loseTeam[0], loser_2: loseTeam[1],
      sets_winner: sW, sets_loser: sL,
    }).select();
    if (error) throw error;
    return data;
  },
  async deleteLast() {
    // Fetch the most recent match
    const { data, error: fetchErr } = await supabase
      .from("matches")
      .select("id, winner_1, winner_2, loser_1, loser_2")
      .order("played_at", { ascending: false })
      .limit(1);
    if (fetchErr) throw fetchErr;
    if (!data || data.length === 0) return null;
    const match = data[0];
    // Delete it
    const { error: delErr } = await supabase.from("matches").delete().eq("id", match.id);
    if (delErr) throw delErr;
    return match;
  }
};

export const liveMatchService = {
  async fetch() {
    const { data, error } = await supabase.from("live_match").select("state").eq("id", 1).single();
    if (error) throw error;
    return data?.state;
  },
  async sync(state) {
    const { data, error } = await supabase
      .from("live_match")
      .upsert({ id: 1, state, updated_at: new Date().toISOString() }, { onConflict: "id" });
    if (error) throw error;
    return data;
  }
};
