const OPENAI_URL = "https://api.openai.com/v1/responses";

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    make: { type: "string" },
    model: { type: "string" },
    variant: { type: "string" },
    evidenceCount: { type: "integer", minimum: 1 },
    evidenceUnit: { type: "string" },
    evidenceLastUpdated: { type: "string" },
    evidenceSources: {
      type: "array",
      minItems: 1,
      items: { type: "string" }
    },
    evidenceMethod: { type: "string" },
    questions: {
      type: "array",
      minItems: 5,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          condition: { type: "string" },
          weight: { type: "string", enum: ["medium", "high"] },
          dealBreakerCapable: { type: "boolean" },
          text: { type: "string" },
          answers: {
            type: "array",
            minItems: 3,
            maxItems: 3,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                label: { type: "string" },
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
                note: { type: "string" }
              },
              required: ["label", "impact", "note"]
            }
          }
        },
        required: [
          "id",
          "condition",
          "weight",
          "dealBreakerCapable",
          "text",
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
You are building a vehicle ownership-fit decision model.

Apply this MDQ Generation Protocol exactly and in order:
1. Define exact product.
2. Gather real owner evidence.
3. Extract recurring ownership frictions.
4. Find the condition behind each friction.
5. Remove low-decision-impact conditions.
6. Merge overlapping conditions.
7. Convert remaining conditions into observable questions.
8. Define answer -> impact mapping.
9. Add mitigation-relevant logic where appropriate.
10. Keep only the strongest 5-8 MDQs.

Core product principle:
We are NOT comparing cars and NOT asking "is this a good car?"
We ask: for this specific product, what makes real owners love it, tolerate it,
regret it, or stop recommending it, and do those conditions apply to this user?

Research rules:
- Search the web for real owner reviews, owner forums, long-term ownership reports,
  specialist owner communities, and credible used-car reliability discussions.
- Prefer evidence tied to the exact generation/year/powertrain.
- Do not mix materially different generations or engines.
- If the user's vehicle description is ambiguous, choose the most defensible exact
  product definition and make that explicit in make/model/variant.
- Count UNIQUE evidence documents, not individual comments in the same thread.
- evidenceCount must equal the number of unique owner-review/discussion documents
  actually used to synthesize the model.
- evidenceSources should list source categories, not invented counts.
- Do not invent evidence.
- Avoid generic automotive questions unless real evidence shows they materially
  change ownership fit for this exact product.
- Service history / condition of one specific used example belongs to a later PPI
  layer unless it changes product-level ownership fit.
- Questions should ask observable reality or realistic tolerance, not vague
  self-assessment.
- Each question must genuinely be capable of changing the fit assessment.
- 5 questions are enough if only 5 strong independent conditions exist. Never pad.

Impact mapping:
positive = clear fit
neutral = compatible / not decision-changing
medium_negative = meaningful but usually manageable friction
high_negative = major ownership mismatch
critical_negative = fundamental mismatch on a deal-breaker-capable condition

Weight:
high = core ownership condition
medium = meaningful secondary ownership condition

Result engine is handled separately. Do not produce a verdict.

Write concise, user-facing English suitable for a minimalist consumer web app.
`;

function extractOutputText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text;
  }
  const chunks = [];
  for (const item of data.output || []) {
    if (item.type === "message") {
      for (const c of item.content || []) {
        if (c.type === "output_text" && c.text) chunks.push(c.text);
      }
    }
  }
  return chunks.join("\n");
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
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
    try { body = JSON.parse(body); } catch {}
  }

  const query = (body?.query || "").trim();
  if (!query || query.length < 3) {
    res.status(400).json({ error: "Please enter a specific vehicle." });
    return;
  }

  const requestBody = {
    model: "gpt-5.6-sol",
    reasoning: { effort: "medium" },
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
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", JSON.stringify(data));
      res.status(response.status).json({
        error: data?.error?.message || "OpenAI research request failed."
      });
      return;
    }

    const outputText = extractOutputText(data);
    if (!outputText) {
      console.error("No output text:", JSON.stringify(data));
      res.status(502).json({ error: "Research completed without a usable model." });
      return;
    }

    let vehicle;
    try {
      vehicle = JSON.parse(outputText);
    } catch (e) {
      console.error("JSON parse error:", outputText);
      res.status(502).json({ error: "Research output could not be parsed." });
      return;
    }

    vehicle.dynamic = true;
    vehicle.researchedQuery = query;

    res.status(200).json({ vehicle });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Research failed. Please try again." });
  }
};
