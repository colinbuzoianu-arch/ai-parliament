// Run against a running instance (local dev or deployed): 
//   APP_BASE_URL=http://localhost:3000 node scripts/seed-cases.mjs
// Requires SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and the agents' Anthropic keys to be
// set in the environment this script runs in (same as the app's .env.local).

import { createClient } from "@supabase/supabase-js";

const BASE_URL = process.env.APP_BASE_URL || "http://localhost:3000";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const ALL_DOCTRINES = [
  "spinoza", "kropotkin", "weil", "solzhenitsyn", "ibnrushd",
  "gandhi", "boethius", "gramsci", "diogenes", "luxemburg", "laboetie",
];
const DEFAULT_ROSTER = [
  "spinoza", "weil", "solzhenitsyn", "ibnrushd", "gandhi", "boethius", "kropotkin", "gramsci", "diogenes",
];

// Three seeded cases for the public sandbox. Kept generic/illustrative (no real officials
// or jurisdictions named) so the demo can run indefinitely without needing updates.
const SEED_CASES = [
  {
    title: "Municipal facial-recognition camera network",
    brief: `A city council is considering a proposal to install a networked facial-recognition
camera system across public transit hubs and major intersections, framed as a public-safety
and traffic-management measure. The system would be operated by the city's police department,
with data retained for 12 months. Proponents cite a projected 20% reduction in reported street
crime based on a pilot in another city. Opponents note the pilot's data collection methodology
was not independently audited, and that no legal framework currently governs who else may
access the footage, for how long, or under what oversight.`,
  },
  {
    title: "Universal basic income pilot, funded by a windfall tax",
    brief: `A regional government proposes a 3-year basic income pilot for 5,000 households,
funded by a new windfall tax on energy companies operating in the region. The stated objective
is to test effects on employment, health, and local spending. The energy companies argue the tax
will reduce investment in the region and could cost jobs elsewhere in their supply chain. The
pilot's outcome measures and success thresholds are being finalized concurrently with the
funding legislation, not before it.`,
  },
  {
    title: "Mandatory algorithmic transparency for public contract allocation",
    brief: `A proposed law would require any government body using automated or AI-assisted
systems to help decide public contract awards to publish the system's decision criteria and
underlying training data sources, and to grant independent auditors ongoing access to the
system's methodology. Government agencies argue this will slow procurement and expose
commercially sensitive vendor information. Transparency advocates argue that without this,
patterns of correlation between political support and contract allocation are undetectable by
outside parties.`,
  },
];

async function callAgent(doctrineId, payload) {
  const res = await fetch(`${BASE_URL}/api/agents/${doctrineId}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Agent ${doctrineId} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function seed() {
  for (const seedCase of SEED_CASES) {
    console.log(`\nSeeding case: ${seedCase.title}`);

    const { data: caseRow, error } = await supabase
      .from("cases")
      .insert({
        title: seedCase.title,
        brief: seedCase.brief,
        active_doctrines: DEFAULT_ROSTER,
        is_seeded: true,
        is_public: true,
      })
      .select()
      .single();

    if (error) {
      console.error(`  Failed to create case: ${error.message}`);
      continue;
    }

    // Precompute Phase 1 for ALL 11 agents, not just the default 9, so any visitor
    // subset selection (including luxemburg/laboetie) is servable from cache.
    for (const doctrineId of ALL_DOCTRINES) {
      process.stdout.write(`  Phase 1 for ${doctrineId}... `);
      try {
        const result = await callAgent(doctrineId, {
          caseId: caseRow.id,
          phase: 1,
          caseBrief: seedCase.brief,
        });

        const { error: cacheError } = await supabase.from("phase1_cache").insert({
          case_id: caseRow.id,
          doctrine_id: doctrineId,
          framing: result.framing,
          doctrinal_analysis: result.doctrinalAnalysis,
          forecast_objective: result.forecast?.objective,
          forecast_projected_outcome: result.forecast?.projectedOutcome,
          forecast_confidence: result.forecast?.confidence,
          verdict: result.verdict,
          reasoning: result.reasoning,
        });

        if (cacheError) throw new Error(cacheError.message);
        console.log("done");
      } catch (err) {
        console.log(`FAILED: ${err.message}`);
      }
    }
  }

  console.log("\nSeeding complete.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
