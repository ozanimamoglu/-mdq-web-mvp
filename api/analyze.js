const OPENAI_URL = "https://api.openai.com/v1/responses";

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    make: { type: "string" },
    model: { type: "string" },
    variant: { type: "string" },

    evidenceCount: {
      type: "integer",
      minimum: 1
    },

    evidenceUnit: {
      type: "string"
    },

    evidenceLastUpdated: {
      type: "string"
    },

    evidenceSources: {
      type: "array",
      minItems: 1,
      items: {
        type: "string"
      }
    },

    evidenceMethod: {
      type: "string"
    },

    questions: {
      type: "array",
      minItems: 5,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: {
            type: "string"
          },

          condition: {
            type: "string"
          },

          evidenceStrength: {
            type: "string",
            enum: [
              "moderate",
              "strong",
              "very_strong"
            ]
          },

          evidenceReason: {
            type: "string"
          },

          dealBreakerCapable: {
            type: "boolean"
          },

          text: {
            type: "string"
          },

          clarification: {
            type: "string"
          },

          answers: {
            type: "array",
            minItems: 3,
            maxItems: 3,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                label: {
                  type: "string"
                },

                impact: {
                  type: "string",
                  enum: [
                    "positive",
                    "neutral",
                    "medium_negative",
                    "high_negative",
                    "critical_negative"
                  ]
                },

                impactReason: {
                  type: "string"
                },

                mitigation: {
                  type: "string"
                }
              },

              required: [
                "label",
                "impact",
                "impactReason",
                "mitigation"
              ]
            }
          }
        },

        required: [
          "id",
          "condition",
          "evidenceStrength",
          "evidenceReason",
          "dealBreakerCapable",
          "text",
          "clarification",
          "answers"
        ]
      }
    }
  },

  required: [
    "id",
    "make",
    "model",
    "variant",
    "evidenceCount",
    "evidenceUnit",
    "evidenceLastUpdated",
    "evidenceSources",
    "evidenceMethod",
    "questions"
  ]
};

const protocol = `
You are building an evidence-grounded vehicle ownership-fit decision model.

The objective is NOT to determine whether a vehicle is good or bad.
The objective is to determine whether the real ownership conditions that make
owners love, tolerate, regret, or stop recommending this exact vehicle apply
to this particular user.

Apply this MDQ Generation Protocol exactly and in order.

1. DEFINE THE EXACT PRODUCT
Identify the most defensible exact year, generation, powertrain, drivetrain,
trim or market specification supported by the user's query.

Do not mix materially different generations, engines, batteries, drivetrains
or market specifications.

If ambiguity cannot be avoided, make the chosen product definition explicit.

2. GATHER REAL OWNER EVIDENCE
Research real owner reviews, owner forums, long-term ownership reports,
specialist owner communities and credible used-car reliability discussions.

Prefer evidence tied to the exact product definition.

Count UNIQUE evidence documents, not individual comments within one discussion.

Do not invent evidence.

3. EXTRACT RECURRING OWNERSHIP FRICTIONS AND BENEFITS
Find recurring real-world experiences that materially shape ownership.

Do not simply collect features, specifications or generic pros and cons.

4. FIND THE CONDITION BEHIND EACH FRICTION
For every recurring ownership friction ask:

"What condition in the user's life, usage, expectations or tolerance determines
whether this issue actually matters?"

The MDQ must diagnose that condition.

RULE 1 — CONDITION, NOT ACTION
Questions must diagnose the user's ownership condition, not ask whether they
have performed a purchase action.

Test drives, inspections, checking service history, verifying equipment,
getting a PPI, or trying the exact car belong in mitigation, not in the MDQ.

Bad:
"Have you driven this car for 45 minutes on rough roads?"

Better:
"How important is ride comfort over broken or uneven roads to you and your
regular passengers?"

5. APPLY THE CONSEQUENCE THRESHOLD
A recurring observation does NOT automatically deserve an MDQ.

Include a condition only if materially different answers could realistically
change whether this exact vehicle is a good ownership fit for the user.

Minor conveniences, interesting features and low-consequence differences must
not consume an MDQ slot.

Never pad the list.

5 strong MDQs are better than 8 weak ones.

6. MERGE OVERLAPPING CONDITIONS
Merge conditions only when they represent one coherent diagnostic construct.

RULE 2 — ONE DIAGNOSTIC CONSTRUCT
Do not bundle different tolerances simply because they appeared together in
owner evidence.

For example, touchscreen preference, phone-key reliability and software crashes
must not automatically become one question unless they genuinely represent one
coherent ownership condition.

7. WRITE THE MDQ
Questions must ask observable reality, realistic usage or concrete tolerance.

Avoid vague self-assessment.

The user should be able to answer without expert automotive knowledge.

RULE 3 — NO UNEXPLAINED PRODUCT JARGON
Never assume the user knows manufacturer terminology, package names, acronyms
or technical concepts.

If a product-specific term is necessary, explain it in plain English before
asking the question.

Example:

Bad:
"Is BlueCruise important to you?"

Better:
"This car offers BlueCruise, a paid system that can steer, accelerate and brake
hands-free on compatible highways while the driver remains attentive. How
important would that capability be to you?"

Do not turn the question into a product-knowledge test.

8. BUILD ANSWER -> DECISION IMPACT MAPPING
Each MDQ must have exactly three answers.

The answers must represent meaningfully different ownership conditions.

For every answer determine its impact on fit:

positive
= clear compatibility with this vehicle

neutral
= compatible or not meaningfully decision-changing

medium_negative
= meaningful friction but usually manageable

high_negative
= major ownership mismatch

critical_negative
= fundamental mismatch on a condition capable of changing the purchase decision

Impact must be derived from BOTH:
a) the evidenced behavior of this exact product
b) the user's condition represented by the answer

Do not infer impact from evidence frequency alone.

Frequency is not severity.
Severity is not user impact.

9. ASSESS EVIDENCE STRENGTH SEPARATELY
For each MDQ assign:

moderate
strong
very_strong

This represents confidence that the ownership condition genuinely matters for
this exact product.

Evidence strength must be based on:
- recurrence across independent sources
- consistency of reports
- relevance to the exact year/generation/powertrain
- credibility and depth of ownership evidence

Do not use evidence strength as a substitute for user impact.

Also provide a concise evidenceReason explaining why the evidence strength was
assigned.

10. GENERATE CONDITION-SPECIFIC MITIGATION
RULE 4 — MITIGATION MUST BE SPECIFIC

For every answer with negative impact, provide an actionable mitigation that
directly addresses that specific mismatch.

Generic boilerplate such as:
"test the exact car carefully"
or
"prioritise condition and service history"

is not acceptable unless that action specifically reduces the identified
mismatch.

Examples:

Firm ride:
"Drive the exact wheel and suspension configuration over poor surfaces before
buying; smaller wheels may materially improve comfort."

Home charging mismatch:
"Secure dependable overnight Level 2 charging before purchase."

Subscription feature:
"Include the ongoing subscription price in expected ownership cost before
deciding."

For positive or neutral answers, mitigation should be an empty string.

10A. DIAGNOSTIC DIVERSITY / REDUNDANCY CONTROL

Do not allow one underlying friction family to consume multiple MDQ slots
unless each condition can independently change the purchase decision.

For example:
home charging access,
long-distance charging tolerance,
and severe-winter range requirements

may remain separate only if each represents a genuinely independent ownership
condition with a materially different answer -> decision impact mapping.

If two questions mostly diagnose the same underlying ownership constraint,
merge them or keep only the more decision-relevant one.

The final MDQ set should cover the minimum diverse set of ownership conditions
needed to diagnose fit.


10B. EVIDENCE TRACEABILITY

Evidence strength must not be an unsupported qualitative judgement.

When deciding whether evidence is moderate, strong or very_strong, explicitly
reason from:
- number of independent supporting documents
- how many are tied to the exact product definition
- how consistent the reports are
- whether evidence comes from actual ownership experience versus specifications
  or editorial commentary

Technical specifications may confirm product behavior, but they do not by
themselves establish recurring owner friction.

Owner-experience evidence should carry the greatest weight when identifying
ownership conditions.

In evidenceReason, make the basis visible whenever possible.

Prefer wording such as:
"Supported by several independent owner reports, including exact-year owners."

Avoid unsupported wording such as:
"Owners consistently report..." unless the research actually supports that claim.



11. FINAL MDQ SELECTION
Keep only the strongest 5-8 independent MDQs.

Prioritize conditions that can genuinely change:
- purchase recommendation
- likelihood of ownership regret
- daily recurring frustration
- major cost exposure
- usability
- suitability for the user's actual ownership pattern

Do not include a question merely because the topic appeared in owner reviews.

12. PRODUCT-LEVEL VS SPECIFIC USED-CAR CONDITION
This model evaluates product ownership fit.

Do not turn ordinary wear, maintenance history, accident history or condition
of one used example into an MDQ unless the issue is a recurring product-level
ownership characteristic.

Those belong to a later vehicle-condition / PPI layer.

OUTPUT RULES

condition:
A short plain-English name for the ownership condition.

evidenceStrength:
moderate, strong or very_strong.

evidenceReason:
One concise sentence explaining why this condition is sufficiently supported by
real owner evidence.

text:
The user-facing MDQ.

clarification:
Use this only when the question contains a product-specific feature, technical
term or concept that may require a short plain-English explanation.
Otherwise return an empty string.

answers:
Exactly three user-facing answers.

impactReason:
One concise sentence explaining why that answer changes or does not change fit
with this exact vehicle.

mitigation:
A specific action that could reduce a negative mismatch.
Return an empty string for positive and neutral answers.

Result calculation is handled separately.
Do not produce a final vehicle verdict.

Write concise, neutral, consumer-facing English suitable for a minimalist web app.
`;

function extractOutputText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text;
  }

  const chunks = [];

  for (const item of data.output || []) {
    if (item.type === "message") {
      for (const c of item.content || []) {
        if (c.type === "output_text" && c.text) {
          chunks.push(c.text);
        }
      }
    }
  }

  return chunks.join("\n");
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({
      error: "POST only"
    });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    res.status(500).json({
      error: "OPENAI_API_KEY is not configured in Vercel."
    });
    return;
  }

  let body = req.body;

  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {}
  }

  const query = (body?.query || "").trim();

  if (!query || query.length < 3) {
    res.status(400).json({
      error: "Please enter a specific vehicle."
    });
    return;
  }

  const requestBody = {
    model: "gpt-5.6-sol",

    reasoning: {
      effort: "medium"
    },

    instructions: protocol,

    input: `Research and build the Vehicle Decision Model for: ${query}`,

    tools: [
      {
        type: "web_search_preview",
        search_context_size: "medium"
      }
    ],

    tool_choice: "auto",

    text: {
      format: {
        type: "json_schema",
        name: "vehicle_decision_model",
        strict: true,
        schema
      },

      verbosity: "low"
    }
  };

  try {
    const response = await fetch(OPENAI_URL, {
      method: "POST",

      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },

      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "OpenAI error:",
        JSON.stringify(data)
      );

      res.status(response.status).json({
        error:
          data?.error?.message ||
          "OpenAI research request failed."
      });

      return;
    }

    const outputText = extractOutputText(data);

    if (!outputText) {
      console.error(
        "No output text:",
        JSON.stringify(data)
      );

      res.status(502).json({
        error:
          "Research completed without a usable model."
      });

      return;
    }

    let vehicle;

    try {
      vehicle = JSON.parse(outputText);
    } catch (e) {
      console.error(
        "JSON parse error:",
        outputText
      );

      res.status(502).json({
        error:
          "Research output could not be parsed."
      });

      return;
    }

    vehicle.dynamic = true;
    vehicle.researchedQuery = query;

    res.status(200).json({
      vehicle
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error:
        "Research failed. Please try again."
    });
  }
};
