const { neon } = require("@neondatabase/serverless");
const crypto = require("crypto");

const OPENAI_URL = "https://api.openai.com/v1/responses";

const RESEARCH_RATE_LIMIT_HOURLY =
  Number.parseInt(
    process.env.RESEARCH_RATE_LIMIT_HOURLY || "10",
    10
  );

const RESEARCH_RATE_LIMIT_DAILY =
  Number.parseInt(
    process.env.RESEARCH_RATE_LIMIT_DAILY || "30",
    10
  );

const schema = {
  type: "object",
  additionalProperties: false,

  properties: {
    id: {
      type: "string"
    },

    make: {
      type: "string"
    },

    model: {
      type: "string"
    },

    year: {
      type: "integer"
    },


    schemaVersion: {
      type: "string",
      enum: ["1.0"]
    },

    generation: {
      type: "string"
    },

  
    variant: {
      type: "string"
    },

    engine: {
      type: "string"
    },

    drivetrain: {
      type: "string"
    },

    market: {
      type: "string"
    },

    
    marketPrice: {
      type: "object",
      additionalProperties: false,

      properties: {
        currency: {
          type: "string"
        },

        low: {
          type: "integer",
          minimum: 0
        },

        high: {
          type: "integer",
          minimum: 0
        },

        market: {
          type: "string"
        },

        basis: {
          type: "string"
        },

        asOf: {
          type: "string"
        },

        sources: {
          type: "array",
          minItems: 1,
          items: {
            type: "string"
          }
        }
      },

      required: [
        "currency",
        "low",
        "high",
        "market",
        "basis",
        "asOf",
        "sources"
      ]
    },

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

    productIntegrity: {
      type: "object",
      additionalProperties: false,

      properties: {
        level: {
          type: "string",
          enum: [
            "no_meaningful_signal",
            "integrity_concern",
            "serious_integrity_concern"
          ]
        },

        summary: {
          type: "string"
        },

        overrideFit: {
          type: "boolean"
        },

        evidenceReason: {
          type: "string"
        },

        issues: {
          type: "array",

          items: {
            type: "object",
            additionalProperties: false,

            properties: {
              id: {
                type: "string"
              },

              functionAffected: {
                type: "string"
              },

              failureMode: {
                type: "string"
              },

              severity: {
                type: "string",
                enum: [
                  "minor",
                  "meaningful",
                  "major"
                ]
              },

              recurrence: {
                type: "string",
                enum: [
                  "limited",
                  "recurring",
                  "strongly_recurring"
                ]
              },

              resolutionPattern: {
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
              }
            },

            required: [
              "id",
              "functionAffected",
              "failureMode",
              "severity",
              "recurrence",
              "resolutionPattern",
              "evidenceStrength",
              "evidenceReason"
            ]
          }
        }
      },

      required: [
        "level",
        "summary",
        "overrideFit",
        "evidenceReason",
        "issues"
      ]
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
    "year",
    "schemaVersion",
    "generation",
    "variant",
    "engine",
    "drivetrain",
    "market",
    "marketPrice",
    "evidenceCount",
    "evidenceUnit",
    "evidenceLastUpdated",
    "evidenceSources",
    "evidenceMethod",
    "productIntegrity",
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


1A. ESTABLISH CURRENT MARKET PRICE CONTEXT

Separately from owner evidence and MDQ generation, establish the current
real-world used-market asking-price range for the exact vehicle definition.

This is a PRE-PURCHASE MARKET CONTEXT layer.

It is not Fit Evidence.
It is not Product Integrity Evidence.
It must not become one of the 5-8 owner-evidence MDQs.

The purpose is to show the user what this specific vehicle currently costs
before asking how that price level feels to them.

Never ask for, estimate or infer the user's budget.

Do not ask:
"What is your budget?"
"How much can you afford?"
"What is the maximum you would spend?"

Budget is not treated as a fixed user attribute.

Instead, the application will present the researched market price of this
specific vehicle and measure the user's reaction to that price level.

Use the same market or geography as the exact vehicle definition whenever
possible.

Research current asking prices for genuinely comparable used examples.

Prefer examples matching as closely as practical:
- model year
- generation
- engine or powertrain
- drivetrain
- major variant
- relevant market specification

Do not allow one unusually cheap or unusually expensive advertisement to define
the range.

Exclude clearly non-comparable examples where identifiable, including:
- materially different generations or powertrains
- salvage or accident-damaged vehicles
- obvious project cars
- misleading finance-only headline prices
- new vehicles when researching a used vehicle
- extreme collector or exceptional-condition outliers unless that is the
  product being researched

Return a defensible typical asking-price RANGE rather than a single price.

marketPrice.currency:
Use the standard three-letter currency code appropriate to the researched
market, for example GBP, EUR or USD.

marketPrice.low:
The lower end of the defensible typical asking-price range, expressed as a whole
currency-unit integer.

marketPrice.high:
The upper end of the defensible typical asking-price range, expressed as a whole
currency-unit integer.

marketPrice.market:
Clearly state the geography represented by the price range, for example:
"United Kingdom"
"Germany"
"United States"

marketPrice.basis:
In one concise sentence, explain what comparable vehicles the range represents.

Example:
"Typical asking prices for UK-market 2019 Discovery Sport TD4 180 AWD automatic
examples in normal used condition."

marketPrice.asOf:
Return the date on which the market-price research was performed in YYYY-MM-DD
form.

marketPrice.sources:
Return the web sources actually used to establish the current price context.

Use at least one genuine current-market source.

Do not fabricate price sources.

Do not use owner-review evidence merely as a substitute for current market-price
evidence.

The marketPrice range is descriptive market context, not a judgement about
whether the vehicle is cheap, expensive, good value or affordable.

Do not produce a price-fit verdict.

The user's reaction to this price level is handled separately by the application.


2. GATHER REAL OWNER EVIDENCE

Research real owner reviews, owner forums, long-term ownership reports,
specialist owner communities and credible used-car reliability discussions.

Prefer evidence tied to the exact product definition.

Count UNIQUE evidence documents, not individual comments within one discussion.

Do not invent evidence.


2A. CLASSIFY EVIDENCE BEFORE MDQ GENERATION

Before converting owner evidence into ownership conditions or MDQs, distinguish
between two fundamentally different evidence classes.


A. FIT EVIDENCE

Evidence belongs to the Fit channel when the product is substantially performing
as intended, but an evidenced characteristic, trade-off, behaviour, limitation
or ownership burden may fit some users better than others.

Examples include:
- firm ride
- limited cargo space
- expensive routine maintenance
- touchscreen-heavy controls
- low-speed transmission hesitation that represents normal operating character
- charging convenience
- cabin noise
- driving effort
- software usability friction

Fit Evidence may proceed through the MDQ Generation Protocol.


B. PRODUCT INTEGRITY EVIDENCE

Evidence belongs to the Product Integrity channel when it indicates that the
product may fail to perform an intended or reasonably expected function,
independent of the user's preference, lifestyle or tolerance.

Examples include:
- repeated component failure
- loss of a core product function
- premature major mechanical or electrical failure
- repeated repair attempts that do not resolve the same fault
- replacement units developing the same fault
- returns, refunds or buybacks specifically caused by functional failure
- recurring owner reports that the product becomes unusable or materially
  impaired

Do NOT convert Product Integrity Evidence into an MDQ.

Never ask the user whether they would tolerate product failure.

Bad:
"Would repeated transmission failure bother you?"

Bad:
"How comfortable are you with returning the product if it stops working?"

These are not user-fit conditions.

Product Integrity Evidence must instead be evaluated separately under the
Product Integrity Risk Protocol below.

IMPORTANT:

Negative owner evidence is not automatically Product Integrity Evidence.

Dislike, inconvenience, expected wear, subjective preference, normal product
characteristics and ordinary maintenance burden normally remain Fit Evidence.

A return or refund is not by itself evidence of Product Integrity Risk.
Determine why the product was returned.

Evidence may contribute to both channels only when it genuinely contains two
distinct signals.

Do not duplicate the same negative observation merely to make the integrity
signal appear stronger.


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


RULE 1B — ASYMMETRIC VALUE TEST

Do not keep an MDQ merely because the vehicle has a recurring ownership
advantage that some users value.

Before keeping a benefit-led condition, test both directions:

1. If the user needs or values this characteristic, does the vehicle create
   meaningful positive fit?

2. If the user does NOT need or value it, does that create any meaningful
   ownership disadvantage or mismatch?

If the second answer is no, the condition normally should not consume one of
the final MDQ slots.

An unused benefit is not a mismatch.

Example:

A vehicle's strong off-road or all-weather capability may be highly valuable
to some owners.

But if a user drives only on normal surfaced roads, not using that capability
does not by itself make the vehicle a worse ownership fit.

Therefore:
"How often will you use the off-road capability?"

should normally not be an MDQ unless that capability brings a meaningful
trade-off that also affects users who do not need it.

Prefer conditions where different answers can materially change ownership fit,
or where at least one realistic answer exposes a genuine ownership mismatch.


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


RULE 3B — EVERY MDQ REQUIRES A CONTEXT LINE

Every MDQ must include a short clarification line.

The clarification is not optional.

Its purpose is to explain, in plain consumer language, why this question matters
for ownership of this exact product.

The clarification should connect the user's condition to the evidenced product
behaviour, limitation, characteristic or trade-off that makes the condition
decision-relevant.

Keep it concise: normally one sentence.

Do not reveal the answer or tell the user which option to choose.
Do not exaggerate risk.
Do not merely repeat the question.

Good example:

Question:
"Where could you reliably charge during a normal week?"

Clarification:
"Regular home or workplace charging usually makes ownership substantially easier
than relying mainly on public fast charging."

Good example:

Question:
"How important is a soft, isolated ride over broken pavement?"

Clarification:
"Owners frequently describe this version's ride as relatively firm, especially
on rough surfaces or larger wheels."

Bad clarification:
"This question asks about your charging situation."

Bad clarification:
"Choose the answer that best describes you."


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
"Owners consistently report..."

unless the research actually supports that claim.


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



PRODUCT INTEGRITY RISK PROTOCOL

This protocol is separate from MDQ generation.

Its purpose is not to decide whether the product is legally defective and not to
make a legal or regulatory determination.

Its purpose is only to identify meaningful owner-evidence signals that the exact
product may fail to perform an intended or reasonably expected function.


1. IDENTIFY THE FAILURE MODE

For each candidate integrity issue determine what function is failing.

Distinguish actual functional failure from dissatisfaction, preference,
maintenance burden or expected product behaviour.


2. DETERMINE FUNCTIONAL IMPORTANCE

Assess whether the affected function is:
- peripheral or minor
- meaningful to normal ownership
- central to the product's intended use


3. ESTABLISH RECURRENCE

Determine whether substantially the same failure appears across independent
owner evidence.

Do not infer recurrence merely because many comments appear inside one forum
thread, article or discussion.


4. ASSESS SEVERITY

minor:
A real malfunction with limited effect on normal ownership.

meaningful:
A malfunction that materially impairs normal use or requires significant repair
because an important function has failed.

major:
A failure that removes a core function, renders the product unusable, repeatedly
prevents normal use, or requires a major repair because an important function
has failed.


5. EXAMINE THE RESOLUTION PATTERN

Consider whether the issue:
- resolves easily
- requires significant repair
- repeatedly returns after repair
- leads to component or product replacement
- persists in replacement products
- leads to return, refund or buyback because normal function could not be
  restored

Repeated failed resolution is stronger evidence than a single successfully
repaired fault.


6. ASSESS EVIDENCE STRENGTH

Use:

moderate
strong
very_strong

Base this on:
- recurrence across independent evidence documents
- relevance to the exact product definition
- consistency of the described failure mode
- actual owner experience
- quality and specificity of the reports
- evidence of repeated failed repair or replacement where available

Do not infer prevalence from raw web visibility alone.


7. DETERMINE PRODUCT INTEGRITY LEVEL

no_meaningful_signal:
No sufficiently recurring and consequential product-integrity pattern is
supported by the available evidence.

integrity_concern:
A credible recurring functional-failure pattern exists, but its severity,
recurrence, scope or resolution record is not strong enough to independently
invalidate an otherwise good ownership fit.

serious_integrity_concern:
Credible independent owner evidence shows a recurring and consequential failure
pattern affecting an important product function, especially where failures are
major, persistent, difficult to resolve, or repeatedly lead to replacement,
return or loss of normal use.


8. DETERMINE WHETHER INTEGRITY OVERRIDES FIT

Set overrideFit to true only when the evidence supports a serious integrity
concern strong enough that asking whether the user's ownership conditions fit
the product would materially understate the purchase risk.

Be conservative.

A few isolated failures must not override fit.

A common annoyance, usability friction or non-failing product characteristic
must not override fit.

Expensive maintenance alone must not override fit.

Ordinary age-related wear in individual used examples must not override fit.

overrideFit should normally require a combination of:
- meaningful or major functional severity
- recurrence across independent owner evidence
- strong relevance to the exact product
- credible evidence quality
- evidence that the problem is difficult to resolve, persistent, premature,
  or otherwise consequential

Do not make legal claims such as:
"defective product"
"faulty by law"
"unfit for sale"
or equivalent legal conclusions.


OUTPUT REQUIREMENTS FOR PRODUCT INTEGRITY

Always return a productIntegrity object.

productIntegrity.level must be exactly one of:
- no_meaningful_signal
- integrity_concern
- serious_integrity_concern

productIntegrity.overrideFit must be a boolean.

If no meaningful integrity signal is found:
- level = "no_meaningful_signal"
- overrideFit = false
- issues = []
- summary should state concisely that no meaningful recurring integrity pattern
  was established from the researched owner evidence
- evidenceReason should briefly explain the basis

Do not manufacture integrity issues merely to populate the output.

If issues are returned, each issue must describe a specific recurring functional
failure pattern rather than a broad reliability category.

For example:

Prefer:
"12-volt battery failures causing repeated no-start conditions"

Avoid:
"electrical problems"

Prefer:
"infotainment display repeatedly becoming inoperative"

Avoid:
"software issues"

Do not use Product Integrity Risk as a substitute for general reliability,
maintenance cost, expected wear, age-related deterioration or purchase-condition
risk.


OUTPUT RULES

schemaVersion:
Always return exactly "1.0".

generation:
Return the clearest generation or major product phase relevant to the researched
vehicle.

Examples:
"L550 pre-facelift"
"G01"
"X253 facelift"

Do not include engine or drivetrain information here.

variant:
Return only the principal model variant or trim designation needed to identify
the researched vehicle.

Do not duplicate generation, engine, drivetrain or market information here when
those are already represented by their dedicated fields.

engine:
Return the researched engine or powertrain in concise consumer-readable form.

Examples:
"2.0-litre Ingenium TD4 180 diesel"
"2.0-litre turbo petrol"
"Dual-motor electric"

drivetrain:
Return the relevant drivetrain and transmission configuration in concise form.

Examples:
"AWD, 9-speed automatic"
"RWD, 6-speed manual"
"Dual-motor AWD"

market:
Return the primary market specification used for the vehicle research.

Examples:
"United Kingdom"
"Germany"
"United States"

Do not mix materially different market specifications merely to broaden the
evidence base.

year:
The exact four-digit model year selected for this product definition.

marketPrice:
Return the current used-market asking-price context separately from the MDQs.

marketPrice.currency:
Three-letter currency code.

marketPrice.low:
Lower end of the typical current asking-price range.

marketPrice.high:
Upper end of the typical current asking-price range.

marketPrice.market:
Market/geography represented by the range.

marketPrice.basis:
One concise sentence describing the comparable vehicles represented.

marketPrice.asOf:
Date of the market-price research in YYYY-MM-DD format.

marketPrice.sources:
Current market sources actually used to establish the range.

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
Required for every MDQ.

Provide one concise, plain-English sentence explaining why this question matters
for ownership of this exact product.

Connect the user's condition to the evidenced product behaviour, limitation,
characteristic or trade-off behind the question.

Never return an empty string.

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
  if (
    typeof data.output_text === "string" &&
    data.output_text.trim()
  ) {
    return data.output_text;
  }

  const chunks = [];

  for (const item of data.output || []) {
    if (item.type === "message") {
      for (const c of item.content || []) {
        if (
          c.type === "output_text" &&
          c.text
        ) {
          chunks.push(c.text);
        }
      }
    }
  }

  return chunks.join("\n");
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function normalizeCacheKey(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildCanonicalSource(vehicle) {
  return [
    vehicle.make,
    vehicle.model,
    vehicle.year,
    vehicle.generation,
    vehicle.variant,
    vehicle.engine,
    vehicle.drivetrain,
    vehicle.market
  ]
    .filter(
      value =>
        value !== undefined &&
        value !== null &&
        value !== ""
    )
    .join(" ");
}

function buildDisplayName(vehicle) {
  const base = [
    vehicle.make,
    vehicle.model,
    vehicle.variant
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return vehicle.year
    ? `${base} — ${vehicle.year}`
    : base;
}

function buildSearchText(vehicle, originalQuery) {
  return [
    vehicle.make,
    vehicle.model,
    vehicle.year,
    vehicle.generation,
    vehicle.variant,
    vehicle.engine,
    vehicle.drivetrain,
    vehicle.market,
    originalQuery
  ]
    .filter(
      value =>
        value !== undefined &&
        value !== null &&
        value !== ""
    )
    .join(" ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeDbQuery(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function parseVehicleData(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function hasUsableMarketPrice(vehicle) {
  const price = vehicle?.marketPrice;

  if (!price || typeof price !== "object") {
    return false;
  }

  if (
    typeof price.currency !== "string" ||
    !price.currency.trim()
  ) {
    return false;
  }

  if (
    !Number.isFinite(price.low) ||
    !Number.isFinite(price.high)
  ) {
    return false;
  }

  if (
    price.low < 0 ||
    price.high <= price.low
  ) {
    return false;
  }

  if (
    typeof price.market !== "string" ||
    !price.market.trim()
  ) {
    return false;
  }

  if (
    typeof price.basis !== "string" ||
    !price.basis.trim()
  ) {
    return false;
  }

  if (
    typeof price.asOf !== "string" ||
    !price.asOf.trim()
  ) {
    return false;
  }

  if (
    !Array.isArray(price.sources) ||
    price.sources.length < 1
  ) {
    return false;
  }

  return true;
}


function getClientIp(req) {
  const forwarded =
    req.headers["x-forwarded-for"];

  if (Array.isArray(forwarded)) {
    const first = forwarded[0];

    if (first) {
      return String(first)
        .split(",")[0]
        .trim();
    }
  }

  if (
    typeof forwarded === "string" &&
    forwarded.trim()
  ) {
    return forwarded
      .split(",")[0]
      .trim();
  }

  const realIp =
    req.headers["x-real-ip"];

  if (
    typeof realIp === "string" &&
    realIp.trim()
  ) {
    return realIp.trim();
  }

  return "unknown";
}

function buildRateLimitIdentifier(req) {
  const ip = getClientIp(req);

  /*
   * Do not store the raw client IP in the database.
   * Store a one-way hash instead.
   */
  return crypto
    .createHash("sha256")
    .update(`vehicle-research:${ip}`)
    .digest("hex");
}

async function consumeResearchRateLimit(
  sql,
  req
) {
  const identifier =
    buildRateLimitIdentifier(req);

  /*
   * Both counters are incremented atomically
   * inside one PostgreSQL statement.
   *
   * This rate limit is consumed ONLY after a
   * vehicle cache miss, immediately before a
   * new OpenAI research request.
   */
  const rows = await sql`
    WITH hourly AS (
      INSERT INTO research_rate_limits (
        identifier,
        window_type,
        window_start,
        request_count,
        created_at,
        updated_at
      )
      VALUES (
        ${identifier},
        'hour',
        DATE_TRUNC('hour', NOW()),
        1,
        NOW(),
        NOW()
      )

      ON CONFLICT (
        identifier,
        window_type,
        window_start
      )

      DO UPDATE SET
        request_count =
          research_rate_limits.request_count + 1,

        updated_at =
          NOW()

      RETURNING
        request_count,
        window_start
    ),

    daily AS (
      INSERT INTO research_rate_limits (
        identifier,
        window_type,
        window_start,
        request_count,
        created_at,
        updated_at
      )
      VALUES (
        ${identifier},
        'day',
        DATE_TRUNC('day', NOW()),
        1,
        NOW(),
        NOW()
      )

      ON CONFLICT (
        identifier,
        window_type,
        window_start
      )

      DO UPDATE SET
        request_count =
          research_rate_limits.request_count + 1,

        updated_at =
          NOW()

      RETURNING
        request_count,
        window_start
    )

    SELECT
      hourly.request_count
        AS hourly_count,

      hourly.window_start
        AS hourly_window_start,

      daily.request_count
        AS daily_count,

      daily.window_start
        AS daily_window_start

    FROM hourly
    CROSS JOIN daily
  `;

  const row = rows[0];

  const hourlyCount =
    Number(row?.hourly_count || 0);

  const dailyCount =
    Number(row?.daily_count || 0);

  const hourlyExceeded =
    hourlyCount >
    RESEARCH_RATE_LIMIT_HOURLY;

  const dailyExceeded =
    dailyCount >
    RESEARCH_RATE_LIMIT_DAILY;

  let retryAfterSeconds = 0;

  if (dailyExceeded) {
    const dayStart =
      new Date(
        row.daily_window_start
      ).getTime();

    const resetAt =
      dayStart +
      24 * 60 * 60 * 1000;

    retryAfterSeconds =
      Math.max(
        1,
        Math.ceil(
          (resetAt - Date.now()) / 1000
        )
      );
  } else if (hourlyExceeded) {
    const hourStart =
      new Date(
        row.hourly_window_start
      ).getTime();

    const resetAt =
      hourStart +
      60 * 60 * 1000;

    retryAfterSeconds =
      Math.max(
        1,
        Math.ceil(
          (resetAt - Date.now()) / 1000
        )
      );
  }

  return {
    allowed:
      !hourlyExceeded &&
      !dailyExceeded,

    hourlyCount,
    dailyCount,

    hourlyLimit:
      RESEARCH_RATE_LIMIT_HOURLY,

    dailyLimit:
      RESEARCH_RATE_LIMIT_DAILY,

    hourlyExceeded,
    dailyExceeded,
    retryAfterSeconds
  };
}




async function findCachedVehicle(sql, query) {
  const normalizedQuery = normalizeDbQuery(query);
  const queryKey = normalizeCacheKey(query);

  /*
   * PASS 1A:
   * Exact canonical cache-key match.
   */
  const keyRows = await sql`
    SELECT
      vehicle_data,
      cache_key,
      display_name,
      researched_query,
      updated_at
    FROM vehicles
    WHERE cache_key = ${queryKey}
    LIMIT 1
  `;

  if (keyRows.length === 1) {
    const vehicle = parseVehicleData(
      keyRows[0].vehicle_data
    );

    if (vehicle) {
      return {
        vehicle,
        matchType: "exact_cache_key",
        cacheKey: keyRows[0].cache_key,
        displayName: keyRows[0].display_name
      };
    }
  }

  /*
   * PASS 1B:
   * Exact previously researched query.
   *
   * Only use automatically when exactly one
   * canonical vehicle matches that query.
   */
  const queryRows = await sql`
    SELECT
      vehicle_data,
      cache_key,
      display_name,
      researched_query,
      updated_at
    FROM vehicles
    WHERE LOWER(
      REGEXP_REPLACE(
        TRIM(researched_query),
        '[[:space:]]+',
        ' ',
        'g'
      )
    ) = ${normalizedQuery}
    ORDER BY updated_at DESC
    LIMIT 2
  `;

  if (queryRows.length === 1) {
    const vehicle = parseVehicleData(
      queryRows[0].vehicle_data
    );

    if (vehicle) {
      return {
        vehicle,
        matchType: "exact_researched_query",
        cacheKey: queryRows[0].cache_key,
        displayName: queryRows[0].display_name
      };
    }
  }

  /*
   * PASS 2:
   * PostgreSQL full-text lookup.
   *
   * We only accept this result automatically when
   * exactly ONE cached vehicle matches all meaningful
   * query terms.
   *
   * If several vehicles match, we deliberately do NOT
   * guess which vehicle the user meant.
   */
  const candidateRows = await sql`
    SELECT
      vehicle_data,
      cache_key,
      display_name,
      researched_query,
      updated_at,
      TS_RANK_CD(
        TO_TSVECTOR(
          'simple',
          COALESCE(search_text, '')
        ),
        PLAINTO_TSQUERY(
          'simple',
          ${query}
        )
      ) AS match_rank
    FROM vehicles
    WHERE
      TO_TSVECTOR(
        'simple',
        COALESCE(search_text, '')
      )
      @@
      PLAINTO_TSQUERY(
        'simple',
        ${query}
      )
    ORDER BY
      match_rank DESC,
      updated_at DESC
    LIMIT 3
  `;

  if (candidateRows.length !== 1) {
    return null;
  }

  const vehicle = parseVehicleData(
    candidateRows[0].vehicle_data
  );

  if (!vehicle) {
    return null;
  }

  return {
    vehicle,
    matchType: "unique_full_text",
    cacheKey: candidateRows[0].cache_key,
    displayName: candidateRows[0].display_name
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({
      error: "POST only"
    });
    return;
  }

  if (!process.env.DATABASE_URL) {
    res.status(500).json({
      error:
        "DATABASE_URL is not configured in Vercel."
    });
    return;
  }

  let body = req.body;

  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const query = String(body?.query || "").trim();

  if (!query || query.length < 3) {
    res.status(400).json({
      error: "Please enter a specific vehicle."
    });
    return;
  }

  const sql = neon(process.env.DATABASE_URL);

  /*
   * CENTRAL CACHE LOOKUP
   *
   * Always check the shared database before starting
   * a new OpenAI research request.
   */
  try {
    const cached = await findCachedVehicle(
      sql,
      query
    );

    if (cached) {
      /*
       * Legacy cache entries created before the
       * market-price layer was introduced must not
       * be served as complete vehicle models.
       *
       * Allow the request to continue to OpenAI research.
       * The resulting vehicle will overwrite the existing
       * canonical database record.
       */
      if (!hasUsableMarketPrice(cached.vehicle)) {
        console.log(
          "VEHICLE_CACHE_STALE",
          JSON.stringify({
            query,
            cacheKey: cached.cacheKey,
            displayName: cached.displayName,
            matchType: cached.matchType,
            reason: "missing_or_invalid_market_price"
          })
        );
      } else {
        const cachedVehicle = {
          ...cached.vehicle,
          dynamic: true,
          researchedQuery:
            cached.vehicle.researchedQuery ||
            cached.vehicle.researched_query ||
            query
        };

        console.log(
          "VEHICLE_CACHE_HIT",
          JSON.stringify({
            query,
            cacheKey: cached.cacheKey,
            displayName: cached.displayName,
            matchType: cached.matchType,
            marketPriceAsOf:
              cached.vehicle.marketPrice?.asOf
          })
        );

        res.status(200).json({
          vehicle: cachedVehicle,
          cache: "hit",
          cacheMatchType: cached.matchType
        });

        return;
      }
    }

    console.log(
      "VEHICLE_CACHE_MISS",
      JSON.stringify({
        query
      })
    );
  } catch (err) {
    /*
     * Cache lookup failure should not make the whole
     * research endpoint unusable.
     *
     * If DB lookup unexpectedly fails here, continue to
     * research. The later DB write already has its own
     * error handling.
     */
    console.error(
      "VEHICLE_CACHE_LOOKUP_ERROR",
      err
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    res.status(500).json({
      error:
        "OPENAI_API_KEY is not configured in Vercel."
    });
    return;
  }

  /*
   * RESEARCH RATE LIMIT
   *
   * IMPORTANT:
   * We reach this point only when the shared
   * vehicle database did NOT provide a usable
   * cached result.
   *
   * Cache hits therefore remain effectively
   * unrestricted.
   *
   * Only requests that are about to create
   * a new OpenAI research cost consume the
   * research quota.
   */
  try {
    const rateLimit =
      await consumeResearchRateLimit(
        sql,
        req
      );

    console.log(
      "RESEARCH_RATE_LIMIT",
      JSON.stringify({
        query,

        allowed:
          rateLimit.allowed,

        hourlyCount:
          rateLimit.hourlyCount,

        hourlyLimit:
          rateLimit.hourlyLimit,

        dailyCount:
          rateLimit.dailyCount,

        dailyLimit:
          rateLimit.dailyLimit,

        hourlyExceeded:
          rateLimit.hourlyExceeded,

        dailyExceeded:
          rateLimit.dailyExceeded
      })
    );

    if (!rateLimit.allowed) {
      if (
        rateLimit.retryAfterSeconds > 0
      ) {
        res.setHeader(
          "Retry-After",
          String(
            rateLimit.retryAfterSeconds
          )
        );
      }

      res.status(429).json({
        error:
          "Too many new vehicle research requests. Please try again later.",

        code:
          "RESEARCH_RATE_LIMIT_EXCEEDED"
      });

      return;
    }
  } catch (err) {
    /*
     * Fail closed here.
     *
     * If we cannot verify the research quota,
     * do not start a paid OpenAI research request.
     *
     * This protects against an unexpected database
     * or rate-limit failure creating uncontrolled
     * OpenAI spend.
     */
    console.error(
      "RESEARCH_RATE_LIMIT_ERROR",
      err
    );

    res.status(503).json({
      error:
        "Vehicle research is temporarily unavailable. Please try again shortly.",

      code:
        "RESEARCH_RATE_LIMIT_UNAVAILABLE"
    });

    return;
  }

  
  const requestBody = {
    model: "gpt-5.6-sol",

    reasoning: {
      effort: "medium"
    },

    instructions: protocol,

    input:
      `Research and build the Vehicle Decision Model for: ${query}`,

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
    const response = await fetch(
      OPENAI_URL,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${process.env.OPENAI_API_KEY}`,

          "Content-Type":
            "application/json"
        },

        body: JSON.stringify(requestBody)
      }
    );

    const data = await response.json();

    const usage = data?.usage || {};

    const inputTokens =
      usage.input_tokens ??
      usage.prompt_tokens ??
      0;

    const outputTokens =
      usage.output_tokens ??
      usage.completion_tokens ??
      0;

    const totalTokens =
      usage.total_tokens ??
      inputTokens + outputTokens;

    const cachedInputTokens =
      usage.input_tokens_details?.cached_tokens ??
      usage.prompt_tokens_details?.cached_tokens ??
      0;

    console.log(
      "RESEARCH_USAGE",
      JSON.stringify({
        query,
        model: requestBody.model,
        inputTokens,
        cachedInputTokens,
        outputTokens,
        totalTokens,
        usageRaw: usage
      })
    );

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

    const webSearchCalls =
      (data.output || []).filter(
        item => item.type === "web_search_call"
      ).length;

    const inputCost =
      (inputTokens / 1_000_000) * 4;

    const outputCost =
      (outputTokens / 1_000_000) * 20;

    const webSearchCost =
      webSearchCalls * 0.01;

    const estimatedCost =
      inputCost +
      outputCost +
      webSearchCost;

    console.log(
      "RESEARCH_COST",
      JSON.stringify({
        query,
        inputTokens,
        outputTokens,

        reasoningTokens:
          usage.output_tokens_details
            ?.reasoning_tokens ?? 0,

        webSearchCalls,

        inputCost:
          Number(inputCost.toFixed(4)),

        outputCost:
          Number(outputCost.toFixed(4)),

        webSearchCost:
          Number(webSearchCost.toFixed(4)),

        estimatedCostUSD:
          Number(estimatedCost.toFixed(4))
      })
    );

    const outputText =
      extractOutputText(data);

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

    const canonicalSource =
      buildCanonicalSource(vehicle);

    const cacheKey =
      normalizeCacheKey(canonicalSource);

    const displayName =
      buildDisplayName(vehicle);

    const searchText =
      buildSearchText(vehicle, query);

    try {
      await sql`
        INSERT INTO vehicles (
          make,
          model,
          year,
          generation,
          variant,
          engine,
          display_name,
          search_text,
          cache_key,
          vehicle_data,
          researched_query,
          research_model,
          research_cost_usd,
          input_tokens,
          cached_input_tokens,
          output_tokens,
          updated_at
        )
        VALUES (
          ${vehicle.make},
          ${vehicle.model},
          ${vehicle.year},
          ${vehicle.generation || ""},
          ${vehicle.variant || ""},
          ${vehicle.engine || ""},
          ${displayName},
          ${searchText},
          ${cacheKey},
          ${JSON.stringify(vehicle)}::jsonb,
          ${query},
          ${requestBody.model},
          ${Number(estimatedCost.toFixed(6))},
          ${inputTokens},
          ${cachedInputTokens},
          ${outputTokens},
          NOW()
        )
        ON CONFLICT (cache_key)
        DO UPDATE SET
          vehicle_data =
            EXCLUDED.vehicle_data,

          generation =
            EXCLUDED.generation,

          variant =
            EXCLUDED.variant,

          engine =
            EXCLUDED.engine,

          researched_query =
            EXCLUDED.researched_query,

          research_model =
            EXCLUDED.research_model,

          research_cost_usd =
            EXCLUDED.research_cost_usd,

          input_tokens =
            EXCLUDED.input_tokens,

          cached_input_tokens =
            EXCLUDED.cached_input_tokens,

          output_tokens =
            EXCLUDED.output_tokens,

          search_text =
            EXCLUDED.search_text,

          display_name =
            EXCLUDED.display_name,

          updated_at =
            NOW()
      `;

      console.log(
        "VEHICLE_CACHE_WRITE",
        JSON.stringify({
          query,
          cacheKey,
          displayName,

          marketPrice: vehicle.marketPrice
            ? {
                currency:
                  vehicle.marketPrice.currency,
                low:
                  vehicle.marketPrice.low,
                high:
                  vehicle.marketPrice.high,
                market:
                  vehicle.marketPrice.market,
                asOf:
                  vehicle.marketPrice.asOf
              }
            : null,

          productIntegrityLevel:
            vehicle.productIntegrity?.level,

          productIntegrityOverride:
            vehicle.productIntegrity?.overrideFit
        })
      );
    } catch (err) {
      console.error(
        "VEHICLE_CACHE_WRITE_ERROR",
        err
      );
    }

    res.status(200).json({
      vehicle,
      cache: "miss"
    });
  } catch (err) {
    console.error(
      "RESEARCH_HANDLER_ERROR",
      err
    );

    res.status(500).json({
      error:
        "Research failed. Please try again."
    });
  }
};
