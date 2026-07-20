# AI Parliament — sandbox

A deliberation sandbox: 9 doctrine agents (each grounded in a thinker who wrote from poverty
or renounced financial gain for their work), reasoning independently, cross-examining each
other, then reaching a jointly synthesized ruling — all logged to an append-only audit trail.

## The default 9-agent roster

| id | thinker | stance |
|---|---|---|
| spinoza | Baruch Spinoza | necessity / causal understanding |
| weil | Simone Weil | obligation before rights |
| solzhenitsyn | Aleksandr Solzhenitsyn | anti-totalitarian witness |
| ibnrushd | Ibn Rushd (Averroes) | reason-revelation synthesis |
| gandhi | Mohandas Gandhi | means-ends unity / non-violence |
| boethius | Boethius | fortune's goods vs. the true good |
| kropotkin | Peter Kropotkin | mutual aid / federation |
| gramsci | Antonio Gramsci | hegemony and consent |
| diogenes | Diogenes of Sinope | radical anti-convention |

**Two extra agents, available per-case but not in the default roster** (dropped for doctrinal
overlap with a default-roster agent — bring in when a case specifically needs them):

| id | thinker | stance | overlaps with |
|---|---|---|---|
| luxemburg | Rosa Luxemburg | democratic spontaneity vs. bureaucracy | kropotkin |
| laboetie | Étienne de La Boétie | voluntary servitude | gramsci |

Each agent's full doctrine (corpus summary, renunciation basis, reasoning directive) lives in
`src/agents/<id>/doctrine.md` — edit that file, not the generated `.ts` files, when you want to
change an agent's substance. Re-run `npm run generate:agents` after editing to regenerate
`config.ts` from `generate_agents.py`.

## Output contract: four locked stages (pre-commitment auditing)

Every agent call, in every phase, produces four stages in order — each one locked once the next
is written:

1. **Framing** — what the doctrine is actually being asked to evaluate.
2. **Doctrinal analysis** — the doctrine applied to the case's specific facts.
3. **Forecast** — written *before* the verdict, never edited after: a stated objective, a
   projected outcome, and a confidence level. This is what makes a later retrospective possible
   — you can check whether the projected outcome actually happened, the same discipline the WLS
   accountability-architecture piece argues policymakers should be held to.
4. **Verdict** — the agent's actual position, which must follow from stages 1-3.

All four stages are logged to `agent_runs` per phase (see schema below) — nothing is summarized
away before storage.

## Isolation model — how "enclosed until interaction is intended" is enforced

1. **One module per agent.** `src/agents/<id>/` is self-contained: its own doctrine, its own
   `deliberate()` function, its own API key env var. No agent module imports another.
2. **One HTTP route per agent.** `app/api/agents/<id>/route.ts` is the only network-reachable
   entry point into that agent. The orchestrator calls this route, never the agent module
   directly, and never calls `api.anthropic.com` itself.
3. **The orchestrator is a pure sequencer.** `src/orchestrator/index.ts` has no doctrine and no
   model call of its own — it only calls agent routes in the right order and logs results.
4. **No persisted memory.** Every `deliberate()` call is a fresh HTTP request with no session,
   no chat history. Whatever an agent "remembers" about prior phases is only what the
   orchestrator explicitly re-sends as `priorPositions` in the request body — nothing is
   retained inside the agent between calls.
5. **A 6th, separate aggregator** (`src/aggregator/`) — not one of the 9 — synthesizes the
   final ruling. It never sees raw case facts, only other agents' verdicts, so it can't
   smuggle its own doctrine-free framing into the substance of the case.

## Deliberation flow

- **Phase 1 (independent):** all agents in the case's roster get the case brief in parallel,
  isolated calls. No agent sees another's output.
- **Phase 2 (cross-examination):** a bounded number of rounds (default 2, capped at 3). Each
  round, every agent gets the current full set of positions and may revise — but every call is
  still a fresh, isolated request. Agents must explicitly label a revision as argument-driven or
  pressure-driven.
- **Phase 3 (joint decision):** the aggregator produces a majority position + attributed
  dissents (`synthesis-with-dissent` — no forced consensus).

## Partial rosters

A case doesn't have to use all 9. `POST /api/cases` accepts `activeDoctrines: string[]` — e.g.
`["spinoza", "gramsci"]` for a 2-agent case. The orchestrator and aggregator both already
handle arbitrary subsets; nothing else needs to change.

## Audit trail

Every phase of every agent's output is inserted into Supabase's `agent_runs` table — see
`supabase/schema.sql`. The table is insert-only: `UPDATE`/`DELETE` are revoked at the database
level. **Caveat:** Supabase's `service_role` key bypasses RLS/grants by default — if you need
this enforced even against your own service key, create a dedicated Postgres role with only
`INSERT`+`SELECT` on `agent_runs` and use that role's credentials for this table specifically.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in Supabase + Anthropic keys, and APP_BASE_URL=http://localhost:3000
# run supabase/schema.sql against your Supabase project (SQL editor or CLI)
npm run dev
```

Open `http://localhost:3000` for the UI: enter a case title + brief, pick which of the 11
agents participate (9 are pre-selected as the default roster), choose how many Phase 2
cross-examination rounds to run, then run the deliberation. Each agent's card expands to show
its full four-stage reasoning (framing, doctrinal analysis, forecast, verdict) for Phase 1 and
Phase 2, and Phase 3 shows the joint ruling with attributed dissents.

Or drive it directly via the API:
```bash
curl -X POST http://localhost:3000/api/cases \
  -H "content-type: application/json" \
  -d '{"title":"Case name","brief":"Full case text...","activeDoctrines":["spinoza","gramsci","weil"]}'
```
```bash
curl -X POST http://localhost:3000/api/orchestrate \
  -H "content-type: application/json" \
  -d '{"caseId":"<id from above>"}'
```

## Attack-testing (separate sandbox)

For adversarial testing (prompt injection, authority-override, sycophancy pressure), do NOT
point this deployment at your real Supabase project or production API keys. Deploy a second
instance (or a preview branch) with:
- a separate Supabase project (so attack-test logs never mix with real audit data)
- separate, spend-capped Anthropic API keys per agent
- ideally a separate, non-indexed subdomain, gated behind basic auth

This keeps the parliament's real audit trail clean while still exercising the exact same
agent/orchestrator code — you're testing the real thing, just against disposable data.

## Public sandbox (`/sandbox`)

A second, public-facing page for showcasing the project — e.g. embedded under WLS — separate
from the internal admin page at `/`.

**Design:** Phase 1 (independent reasoning) does not depend on which agents are in the roster,
since agents never see each other in Phase 1. So for public/seeded cases, Phase 1 is computed
**once**, for all 11 agents, via `scripts/seed-cases.mjs`, and cached in `phase1_cache`. When a
visitor picks a subset of agents on `/sandbox` and hits run, only Phase 2 (one live round) and
Phase 3 (live aggregation) actually call the Anthropic API — a small, bounded number of calls
per visitor session, not a full 11-agent Phase 1 every time.

**Rate limiting:** `public_usage` now tracks two kinds separately — `rerun` (re-running an
already-cached case with a different agent subset, capped at 40/day) and `submission` (a
brand-new user-submitted case, capped at 15/day, since it can trigger several fresh Phase 1
calls at once). Adjust `DAILY_CAPS` in `src/orchestrator/index.ts`.

**User submissions:** visitors can submit their own case brief and pick up to 6 agents (capped
to bound the cost of any single new submission) via the "Submit your own" tab on `/sandbox`.
`runPublicDeliberation` is self-healing — any agent not yet cached for a given case runs Phase 1
live and is cached afterward, so this works for brand-new cases with no pre-seeding step, and
the same case/agent combination is free for every subsequent visitor. Submitted cases join the
public gallery (tagged `user_submitted` vs `seeded`), so the sandbox becomes a growing library of
real deliberations rather than three static demos.

**Seeding:** three generic, illustrative policy cases ship in `scripts/seed-cases.mjs` (a
facial-recognition camera network, a UBI pilot funded by a windfall tax, and mandatory
algorithmic transparency for public contracts) — none reference real jurisdictions or officials,
so the demo doesn't go stale. Add more by editing `SEED_CASES` in that script.

```bash
# after npm run dev is running locally, or against your deployed APP_BASE_URL:
npm run seed:cases
```

This precomputes and caches Phase 1 for all 11 agents on each seeded case — a one-time cost,
paid once per case, not per visitor.

## Extending

- **New agent:** add an entry to `DOCTRINES` in `generate_agents.py`, re-run it — you get a new
  isolated module + route for free, following the exact same contract as the other 9.
- **Different model per agent:** each agent's `index.ts` is independent — nothing stops one
  agent from calling a different provider/model, if you want to test doctrine-fidelity across
  model backends later. Not done here to avoid confounding doctrine quality with model quality.
