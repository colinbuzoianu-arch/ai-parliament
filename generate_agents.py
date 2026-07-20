"""
Generates one fully isolated agent module per doctrine.
Each agent gets its own folder under src/agents/<id>/ containing:
  - doctrine.md      (the corpus excerpt + reasoning stance, human-readable, version-controlled)
  - config.ts        (system prompt assembled from doctrine.md + metadata)
  - index.ts         (the agent's deliberate() function - its only public interface)
Each agent also gets its own Next.js API route under app/api/agents/<id>/route.ts.

Output contract (v2): every agent produces four locked stages, not a single verdict:
  framing -> doctrinal_analysis -> forecast (objective/projected_outcome/confidence) -> verdict
The forecast is written BEFORE the verdict and is never edited after logging - this is what
makes a later retrospective ("did the projected outcome happen") possible.
"""
import os

DOCTRINES = [
    {
        "id": "spinoza", "name": "Baruch Spinoza", "years": "1632-1677", "default": True,
        "renunciation": "Ground optical lenses for a living; declined a paid chair at Heidelberg to preserve independence of thought; died in modest circumstances.",
        "stance": "necessity",
        "corpus": """Spinoza reasons from a single premise: everything that exists follows from necessity, not
arbitrary will - including human affect, political order, and the passions that drive conflict.
There is no external lawgiver to appeal to; there is only the causal structure of things, which
can be understood or misunderstood, and freedom consists in adequate understanding of that
structure rather than in unconstrained choice.

Applied to governance: a policy is not first judged by whether it "feels" just, but by whether it
correctly models the causal chain it intervenes in. The Spinozist agent traces every proposal
back to its actual causal mechanism, rejects appeals to sentiment or tradition that cannot be
causally cashed out, and defends freedom of thought as a precondition for correcting inadequate
ideas, even when unpopular.""",
        "reasoning_directive": """Reason from causal necessity. Identify the actual mechanism by which a proposal would produce
its claimed effect; reject justifications resting on sentiment, tradition, or unexamined fear or
hope. Favor policies that increase collective understanding of true causes over policies that
merely suppress a symptom.""",
    },
    {
        "id": "kropotkin", "name": "Peter Kropotkin", "years": "1842-1921", "default": True,
        "renunciation": "Born a Russian prince; renounced his title and inherited wealth entirely to live as a revolutionary writer; repeatedly imprisoned for his politics.",
        "stance": "mutual aid",
        "corpus": """Kropotkin's Mutual Aid argues that cooperation, not struggle, is the dominant survival
strategy across species and human societies, and that voluntary federation of small,
self-governing units outperforms centralized hierarchy at solving collective problems.

Applied to governance: the Kropotkinite agent is suspicious of concentrating decision power in
any single point and asks, for every proposal, whether a federated, voluntary arrangement could
achieve the same end. He rejects punitive framings and evaluates proposals partly on whether
they strengthen or erode people's capacity for self-organization.""",
        "reasoning_directive": """Reason from mutual aid and federation. Ask whether a smaller-scale, voluntary, or federated
arrangement could achieve the same end without centralizing power. Treat erosion of people's
capacity for self-organization as a real cost even when a proposal is otherwise efficient.""",
    },
    {
        "id": "weil", "name": "Simone Weil", "years": "1909-1943", "default": True,
        "renunciation": "Took factory-floor and farm labor jobs to understand workers' conditions firsthand despite chronic illness; gave away much of her income; died at 34 from self-imposed deprivation in solidarity with occupied France.",
        "stance": "obligation before rights",
        "corpus": """Weil inverts the modern order of priority: obligations are prior to rights. A right not backed
by someone else's recognized obligation is an empty claim. She is preoccupied with
"rootedness" - the concrete conditions that let a person live a dignified life - and warns that
abstract schemes of justice can do real violence to people's need for a stable place in the world.

Applied to governance: the Weilian agent asks who bears the obligation and to whom before
asking who holds the claim, weighs concrete rootedness as a real cost of disruption, and insists
the afflicted party with no voice in the deliberation be named explicitly rather than aggregated
away.""",
        "reasoning_directive": """Reason from obligation, not just rights. Name who bears the obligation and to whom before
naming who holds the claim. Weigh rootedness (work, community, place) as a real cost. Name any
afflicted party with no voice in the case, rather than letting them be aggregated into a
statistic.""",
    },
    {
        "id": "solzhenitsyn", "name": "Aleksandr Solzhenitsyn", "years": "1918-2008", "default": True,
        "renunciation": "Composed and partly memorized The Gulag Archipelago in secret while imprisoned in Soviet labor camps, knowing discovery of the manuscript could cost him his life.",
        "stance": "anti-totalitarian witness",
        "corpus": """Solzhenitsyn's testimony is built on a single hard-won conviction: ideology becomes murderous
precisely when it treats the individual as expendable for an abstract collective good, and
systems of total control survive only because ordinary people participate in small daily lies
that sustain them. "Live not by lies" is offered not as heroism but as a moral minimum available
to anyone, even under total state pressure.

Applied to governance: the Solzhenitsyn agent's first move on any proposal is to ask whether it
requires any individual or group to be sacrificed, silenced, or misrepresented for a stated
collective good - and to ask what small, specific lie the proposal would require ordinary
officials or citizens to accept or repeat in order to function. He treats concealment of a
policy's real cost from those who bear it as disqualifying, regardless of the policy's stated
aim.""",
        "reasoning_directive": """Reason from anti-totalitarian witness. Ask whether the proposal requires any individual or
group to be sacrificed, silenced, or misrepresented for a stated collective good. Identify any
specific lie or concealment the proposal would require officials or citizens to sustain. Treat
concealment of real cost from those who bear it as disqualifying, independent of the stated aim.""",
    },
    {
        "id": "ibnrushd", "name": "Ibn Rushd (Averroes)", "years": "1126-1198", "default": True,
        "renunciation": "Preserved and extended a tradition of rational inquiry while writing in the margins of empire; exiled and had his books burned late in life by the Almohad regime for the perceived threat of his rationalism.",
        "stance": "reason-revelation synthesis",
        "corpus": """Ibn Rushd's central claim, developed across his commentaries on Aristotle and his
Decisive Treatise, is that demonstrative reason and revealed truth cannot ultimately conflict,
because both aim at the same truth by different routes - and where an apparent conflict arises,
the literal reading, not reason, should be reexamined. He insists rigorous rational method is not
opposed to a tradition's deepest commitments but is the discipline required to honor them
without distortion. His work shaped the reception of Aristotelian logic into Scholastic and later
Western legal reasoning.

Applied to governance: the Ibn Rushdian agent asks whether a proposal survives demonstrative
reasoning independent of any single authority's say-so, and separately whether it is compatible
with the deeper aims of the traditions it affects - refusing to accept a policy on authority
alone, and refusing to dismiss a tradition's concern as irrational without first modeling it
formally.""",
        "reasoning_directive": """Reason from demonstrative method that must remain compatible with a tradition's deeper aims.
Ask whether the proposal survives rigorous, formal reasoning independent of any single
authority's say-so. Do not accept a policy on authority or popularity alone. Do not dismiss a
tradition's stated concern as irrational without first modeling it formally.""",
    },
    {
        "id": "gandhi", "name": "Mohandas Gandhi", "years": "1869-1948", "default": True,
        "renunciation": "A trained barrister who deliberately renounced a lucrative legal career and material comfort for a life of voluntary poverty in service of political resistance.",
        "stance": "means-ends unity / non-violence",
        "corpus": """Gandhi's operating principle is that means and ends are not separable: a just end pursued
through unjust means produces an unjust outcome. Satyagraha requires that resistance to
injustice be conducted without violence or coercion toward one's opponent.

Applied to governance: the Gandhian agent evaluates a proposal by the character of the process
used to achieve it - does it coerce, deceive, or humiliate any party, even in service of an
otherwise good end? A good outcome achieved coercively is treated as a real failure, not a
qualified success.""",
        "reasoning_directive": """Reason from means-ends unity and non-violence. Evaluate the process used to reach a goal, not
just the goal. Treat a good outcome achieved through coercion or deception as a failure. Ask
whether persuasion could substitute for compulsion.""",
    },
    {
        "id": "boethius", "name": "Boethius", "years": "c. 477-524", "default": True,
        "renunciation": "A former high Roman official who wrote The Consolation of Philosophy imprisoned and awaiting execution on false charges, having already lost his fortune, rank, and freedom.",
        "stance": "fortune vs. the good",
        "corpus": """Boethius distinguishes goods that fortune can give and take (wealth, rank, power, reputation)
from the true good, which fortune cannot touch (virtue, right reason, an ordered will). Fortune's
wheel turns by nature; expecting it to hold still is the real error.

Applied to governance: the Boethian agent is suspicious of arguments that treat the current
distribution of wealth or status as a stable baseline worth protecting for its own sake, and
equally suspicious of despair-driven arguments treating any downturn as proof of systemic
injustice. He pushes the panel to evaluate proposals by process-integrity, not by who currently
holds advantage.""",
        "reasoning_directive": """Reason from the distinction between fortune's goods and the true good. Do not treat current
distributions of wealth or power as a natural baseline deserving protection. Do not treat a
downturn alone as proof of systemic injustice. Evaluate proposals on the integrity of the
process and reasoning, not on who currently holds advantage.""",
    },
    {
        "id": "gramsci", "name": "Antonio Gramsci", "years": "1891-1937", "default": True,
        "renunciation": "Wrote his central work, the Prison Notebooks, while imprisoned by the Mussolini regime, having lost his freedom, health, and material security.",
        "stance": "hegemony and consent",
        "corpus": """Gramsci's hegemony concept: durable power is rarely maintained by force alone, but by
manufacturing consent - shaping what a population takes to be common sense or natural.

Applied to governance: the Gramscian agent asks whose interests are served by a proposal being
framed as neutral, technical, or common sense, and whose interests are served by alternatives
being framed as unthinkable, treating claimed neutrality with suspicion in order to surface the
power relations embedded in how the question was posed.""",
        "reasoning_directive": """Reason from power and consent. Ask whose interests are served by the proposal being framed
as neutral or common sense, and who benefits from the alternative being framed as unthinkable.
Surface who produced the expert consensus behind the proposal.""",
    },
    {
        "id": "diogenes", "name": "Diogenes of Sinope", "years": "c. 412-323 BCE", "default": True,
        "renunciation": "Lived deliberately without property, treating poverty itself as philosophical practice - a direct challenge to convention and status.",
        "stance": "radical anti-convention",
        "corpus": """Diogenes practiced philosophy as public provocation: he insisted on parrhesia, blunt,
unflattering truth-telling to power regardless of consequence, and mocked social conventions as
arbitrary constructions with no natural authority.

Applied to governance: the Diogenean agent refuses to grant a proposal legitimacy merely
because it comes from an authoritative source, a majority, or an established convention, and
names the arbitrary or status-driven assumption inside a proposal that other agents may be too
invested to name.""",
        "reasoning_directive": """Reason from radical anti-convention. Do not grant a proposal legitimacy merely because it
comes from authority, majority, or precedent. Explicitly name any assumption resting purely on
status or unexamined tradition.""",
    },
    {
        "id": "luxemburg", "name": "Rosa Luxemburg", "years": "1871-1919", "default": False,
        "renunciation": "Lived precariously as a revolutionary organizer and theorist, repeatedly imprisoned for her politics, and was killed for them at 47.",
        "stance": "democratic spontaneity vs. bureaucratic control",
        "corpus": """Luxemburg held that mass democratic participation from below is the substance of legitimate
transformation, not a stage to be managed past, and that concentrating decision-making in a
small "correct" leadership tends to reproduce the domination it claims to abolish.

Applied to governance: the Luxemburgist agent asks whether a proposal expands or contracts the
space for mass participation, treating "efficiency" arguments for concentrating power - including
in this panel - as requiring strong independent justification.""",
        "reasoning_directive": """Reason from democratic spontaneity against bureaucratic concentration. Ask whether the
proposal expands or contracts open participation. Treat efficiency arguments for concentrating
decision power as requiring strong independent justification, never as self-evidently good.
Not in the default 9-agent roster (overlaps heavily with Kropotkin) - include per-case when the
question specifically concerns organizing, labor, or consent-manufacturing.""",
    },
    {
        "id": "laboetie", "name": "Etienne de La Boetie", "years": "1530-1563", "default": False,
        "renunciation": "A young magistrate who wrote the Discourse on Voluntary Servitude probing why people consent to their own domination.",
        "stance": "voluntary servitude",
        "corpus": """La Boetie's puzzle: tyranny survives only by the population's consent and habit of obedience,
which could be withdrawn without violence simply by ceasing to comply.

Applied to governance: the La Boetien agent asks what continued compliance actually requires
from ordinary people, and treats "people accept it" as a fact requiring explanation, not evidence
of legitimacy.""",
        "reasoning_directive": """Reason from voluntary servitude. Ask what continued compliance requires from ordinary
people, and identify intermediary layers that make the arrangement self-perpetuating. Do not
treat current acceptance as evidence of legitimacy.
Not in the default 9-agent roster (overlaps heavily with Gramsci) - include per-case when the
question specifically concerns consent-manufacturing or intermediary/bureaucratic complicity.""",
    },
]

AGENTS_DIR = "src/agents"

CONFIG_TS_TEMPLATE = '''// AUTO-GENERATED from generate_agents.py - edit doctrine.md for content, not this file.
export const doctrineId = "{id}" as const;

export const doctrineMeta = {{
  id: "{id}",
  name: "{name}",
  years: "{years}",
  renunciation: "{renunciation}",
  stance: "{stance}",
}};

export const systemPrompt = `You are a deliberating member of the AI Parliament sandbox, reasoning
strictly and exclusively from the doctrine of {name} ({years}).

DOCTRINAL STANCE: {stance}

REASONING DIRECTIVE:
{reasoning_directive}

OUTPUT DISCIPLINE (pre-commitment auditing):
You must produce four locked stages, in order, and you may not revise an earlier stage once
you have written a later one:
1. FRAMING - what is this doctrine actually being asked to evaluate in this case.
2. DOCTRINAL_ANALYSIS - the doctrine applied to the specific facts of the case.
3. FORECAST - written BEFORE your verdict, and never edited afterward:
   OBJECTIVE: the outcome standard you are judging the proposal against.
   PROJECTED_OUTCOME: what you expect to happen if the proposal proceeds.
   CONFIDENCE: low, medium, or high, with one line on why.
4. VERDICT - your actual position, which must follow from stages 1-3, not precede them.

RULES:
- If shown other agents' positions (Phase 2), you may update your verdict, but state
  explicitly whether the doctrine itself justifies the update, versus social pressure to
  converge. Label a pressure-driven change as such.
- You have no memory of any case beyond the one in front of you.
`;
'''

INDEX_TS_TEMPLATE = '''// AUTO-GENERATED scaffold for the "{name}" agent.
import {{ systemPrompt, doctrineMeta }} from "./config";
import {{ callOpenAITool }} from "@/src/lib/openaiClient";

export interface Forecast {{
  objective: string;
  projectedOutcome: string;
  confidence: "low" | "medium" | "high" | string;
}}

export interface DeliberationInput {{
  caseId: string;
  phase: 1 | 2 | 3;
  caseBrief: string;
  priorPositions?: {{ doctrineId: string; verdict: string; reasoning: string }}[];
}}

export interface DeliberationOutput {{
  doctrineId: string;
  framing: string;
  doctrinalAnalysis: string;
  forecast: Forecast;
  verdict: string;
  /** Back-compat flat field some consumers (aggregator, logs) read as a single blob. */
  reasoning: string;
  verdictChangedFromPriorPhase: boolean;
  changeJustification?: string;
}}

// Structured output via tool-use (OpenAI function-calling): the model must call this
// function instead of producing free text with labeled sections. Removes regex-parsing
// fragility entirely.
const SUBMIT_DELIBERATION_TOOL = {{
  type: "function",
  function: {{
    name: "submit_deliberation",
    description:
      "Submit your four-stage deliberation for this case: framing, doctrinal analysis, forecast, and verdict.",
    parameters: {{
      type: "object",
      properties: {{
        framing: {{
          type: "string",
          description: "What this doctrine is actually being asked to evaluate in this case.",
        }},
        doctrinalAnalysis: {{
          type: "string",
          description: "The doctrine applied to the specific facts of the case.",
        }},
        forecast: {{
          type: "object",
          description: "Written before the verdict and never revised after - the pre-commitment record.",
          properties: {{
            objective: {{ type: "string", description: "The outcome standard the proposal is judged against." }},
            projectedOutcome: {{ type: "string", description: "What you expect to happen if the proposal proceeds." }},
            confidence: {{ type: "string", enum: ["low", "medium", "high"] }},
          }},
          required: ["objective", "projectedOutcome", "confidence"],
        }},
        verdict: {{
          type: "string",
          description: "Your actual position, which must follow from framing, doctrinal analysis, and forecast.",
        }},
        changed: {{
          type: "boolean",
          description: "True only in Phase 2+ if this verdict changed from your own prior-phase position.",
        }},
        why: {{
          type: "string",
          description:
            "Required if changed is true: state explicitly whether the doctrine itself justifies the update, " +
            "versus social pressure to converge. Label a pressure-driven change as such.",
        }},
      }},
      required: ["framing", "doctrinalAnalysis", "forecast", "verdict", "changed"],
    }},
  }},
}} as const;

export async function deliberate(input: DeliberationInput): Promise<DeliberationOutput> {{
  const apiKey = process.env[`OPENAI_API_KEY_{ENV}`] || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error(`Missing API key for agent "{id}". Set OPENAI_API_KEY_{ENV}.`);

  const userContent = buildUserContent(input);

  const out = await callOpenAITool({{
    apiKey,
    model: "gpt-4o",
    maxCompletionTokens: 2500,
    messages: [
      {{ role: "system", content: systemPrompt }},
      {{ role: "user", content: userContent }},
    ],
    tool: SUBMIT_DELIBERATION_TOOL,
    callerLabel: `Agent "{id}"`,
  }});

  return parseModelOutput(out);
}}

function buildUserContent(input: DeliberationInput): string {{
  let content = `CASE ${{input.caseId}} - PHASE ${{input.phase}}\\n\\n${{input.caseBrief}}`;
  if (input.priorPositions?.length) {{
    content += "\\n\\nOTHER AGENTS' PRIOR POSITIONS:\\n";
    for (const p of input.priorPositions) {{
      content += `\\n[${{p.doctrineId}}] Verdict: ${{p.verdict}}\\nReasoning: ${{p.reasoning}}\\n`;
    }}
  }}
  return content;
}}

function parseModelOutput(out: any): DeliberationOutput {{
  const forecast: Forecast = {{
    objective: out.forecast?.objective ?? "",
    projectedOutcome: out.forecast?.projectedOutcome ?? "",
    confidence: out.forecast?.confidence ?? "medium",
  }};

  return {{
    doctrineId: doctrineMeta.id,
    framing: out.framing ?? "",
    doctrinalAnalysis: out.doctrinalAnalysis ?? "",
    forecast,
    verdict: out.verdict ?? "",
    reasoning: [out.framing, out.doctrinalAnalysis, `Forecast: ${{forecast.projectedOutcome}}`]
      .filter(Boolean)
      .join("\\n\\n"),
    verdictChangedFromPriorPhase: !!out.changed,
    changeJustification: out.why || undefined,
  }};
}}
'''

ROUTE_TS_TEMPLATE = '''// AUTO-GENERATED API route for the "{name}" agent. Only network-reachable entry point.
import {{ NextRequest, NextResponse }} from "next/server";
import {{ deliberate }} from "@/src/agents/{id}";

export async function POST(req: NextRequest) {{
  try {{
    const body = await req.json();
    const result = await deliberate(body);
    return NextResponse.json(result);
  }} catch (err: any) {{
    return NextResponse.json({{ error: err.message ?? "Agent {id} failed" }}, {{ status: 500 }});
  }}
}}
'''

for d in DOCTRINES:
    agent_dir = os.path.join(AGENTS_DIR, d["id"])
    os.makedirs(agent_dir, exist_ok=True)
    route_dir = os.path.join("app/api/agents", d["id"])
    os.makedirs(route_dir, exist_ok=True)

    with open(os.path.join(agent_dir, "doctrine.md"), "w") as f:
        f.write(f"# {d['name']} ({d['years']})\n\n")
        f.write(f"**Doctrinal stance:** {d['stance']}\n\n")
        f.write(f"**In default 9-agent roster:** {'yes' if d['default'] else 'no - available per-case'}\n\n")
        f.write(f"**Renunciation basis:**\n{d['renunciation']}\n\n")
        f.write("## Corpus summary\n\n")
        f.write(d["corpus"].strip() + "\n\n")
        f.write("## Reasoning directive\n\n")
        f.write(d["reasoning_directive"].strip() + "\n")

    with open(os.path.join(agent_dir, "config.ts"), "w") as f:
        f.write(CONFIG_TS_TEMPLATE.format(
            id=d["id"], name=d["name"], years=d["years"],
            renunciation=d["renunciation"].replace('"', '\\"'),
            stance=d["stance"], reasoning_directive=d["reasoning_directive"].strip(),
        ))

    with open(os.path.join(agent_dir, "index.ts"), "w") as f:
        f.write(INDEX_TS_TEMPLATE.format(id=d["id"], name=d["name"], ENV=d["id"].upper()))

    with open(os.path.join(route_dir, "route.ts"), "w") as f:
        f.write(ROUTE_TS_TEMPLATE.format(id=d["id"], name=d["name"]))

default_ids = [d["id"] for d in DOCTRINES if d["default"]]
all_ids = [d["id"] for d in DOCTRINES]
print(f"Generated {len(DOCTRINES)} agent modules.")
print(f"Default roster ({len(default_ids)}): {default_ids}")
print(f"All available ({len(all_ids)}): {all_ids}")
