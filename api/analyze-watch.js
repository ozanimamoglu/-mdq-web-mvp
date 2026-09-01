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

/*
 * WATCH DECISION MODEL — SCHEMA v1.0
 *
 * This schema is deliberately separate from
 * Vehicle Decision Model v1.0.
 *
 * Watches have their own canonical product identity,
 * while evidence, fit, product-integrity and market-price
 * concepts retain the same underlying decision philosophy.
 */

const watchSchema = {
  type: "object",
  additionalProperties: false,

  properties: {
    schemaVersion: {
      type: "string",
      enum: ["1.0"]
    },

    id: {
      type: "string"
    },

    /*
     * CANONICAL WATCH IDENTITY
     */

    brand: {
      type: "string"
    },

    model: {
      type: "string"
    },

    reference: {
      type: "string"
    },

    year: {
      anyOf: [
        {
          type: "integer",
          minimum: 1800,
          maximum: 2100
        },
        {
          type: "null"
        }
      ]
    },

    productionPeriod: {
      type: "string"
    },

    variant: {
      type: "string"
    },

    movement: {
      type: "string"
    },



caseSize: {
  type: "string"
},

market: {
  type: "string"
},

/*
 * REPRESENTATIVE PRODUCT IMAGE
 *
 * Used only to visually identify the exact watch.
 * It is not Fit Evidence and does not affect MDQs.
 */

productImage: {
  anyOf: [
    {
      type: "object",
      additionalProperties: false,

      properties: {
        url: {
          type: "string"
        },

        sourceUrl: {
          type: "string"
        },

        alt: {
          type: "string"
        }
      },

      required: [
        "url",
        "sourceUrl",
        "alt"
      ]
    },

    {
      type: "null"
    }
  ]
},

/*
 * CURRENT MARKET PRICE CONTEXT
 *
 * This is kept separate from fit evidence.
 */

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

    /*
     * EVIDENCE BASE
     */

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

    /*
     * PRODUCT INTEGRITY
     *
     * Functional failure is evaluated separately
     * from user-product fit.
     */

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

    /*
     * WATCH MDQs
     */

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
    "schemaVersion",
    "id",
    "brand",
    "model",
    "reference",
    "year",
    "productionPeriod",
    "variant",
    "movement",
    "caseSize",
    "market",
    "productImage",
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


const watchProtocol = `
You are building an evidence-grounded watch ownership-fit decision model.

The objective is NOT to determine whether a watch is good or bad.
The objective is NOT to recommend the best watch in a category.
The objective is NOT to determine whether the user is a "watch person."

The objective is to determine whether the real ownership and wearing conditions
that make owners love, tolerate, regret, sell, or stop recommending this exact
watch apply to this particular user.

The user has already identified a watch they are considering.

Apply this Watch MDQ Generation Protocol exactly and in order.


1. DEFINE THE EXACT WATCH

Identify the most defensible exact watch supported by the user's query.

Resolve, where available:
- brand
- model or collection
- reference number
- production period
- specific year if explicitly supplied or genuinely necessary
- principal variant
- movement
- case size
- relevant market context

Reference number is especially important.

Do not mix materially different references merely because they share the same
model or collection name.

Examples:

Rolex Submariner 124060
must not be treated as interchangeable with:
- Rolex Submariner 114060
- Rolex Submariner 14060M
- Rolex Submariner Date 126610LN

Likewise, materially different movement generations, case generations,
bracelet configurations or reference-specific constructions must not be mixed
when those differences affect ownership experience.

If the user supplies an exact reference, preserve it exactly.

Do not invent a specific production year merely to make the product definition
look more precise.

If the user did not specify a year and the reference itself adequately defines
the watch:
year = null

productionPeriod should describe the defensible production period for the
reference or researched product phase.

If ambiguity cannot be avoided, make the chosen product definition explicit.

Do not silently resolve an ambiguous watch query to a materially different
reference simply because that reference has more evidence available.


1A. PRODUCT IDENTITY IS NOT A FIT JUDGEMENT

Technical specifications help identify and understand the watch.

They are not automatically decision conditions.

For example:

41 mm case size
does not automatically mean:
"large watch"

100 m water resistance
does not automatically mean:
"ideal sports watch"

automatic movement
does not automatically mean:
"convenient ownership"

polished surfaces
do not automatically mean:
"scratch-prone problem"

Translate specifications into fit conditions only when real-world evidence
shows that the resulting ownership or wearing characteristic is sufficiently
decision-relevant.


1B. REPRESENTATIVE PRODUCT IMAGE

Return one representative product image for the exact researched watch when a
reliable image can be established.

The image is descriptive product-identification metadata only.

It is NOT:
- Fit Evidence
- Product Integrity Evidence
- market-price evidence
- an MDQ input
- a factor in the final fit result

Prefer image sources in this order where practical:
- official manufacturer product page
- official manufacturer archive
- authorised retailer
- established specialist watch retailer

The image must match the researched watch as closely as possible.

Prefer the exact:
- brand
- model
- reference
- principal variant

Do not use:
- a generic brand image
- a materially different reference
- a different dial or case configuration when the reference does not match
- lifestyle photography where the exact watch cannot be clearly established
- social-media reposts when a primary or established source is available
- counterfeit or replica imagery
- generated images

productImage.url:
Return a direct HTTPS image URL suitable for use in an HTML <img> element.

productImage.sourceUrl:
Return the HTTPS page URL that establishes the identity of the image and watch.

productImage.alt:
Return short factual alt text describing the watch.

Example:
"Brew Metric Retro Dial chronograph"

If a reliable exact or sufficiently defensible product image cannot be
established:

productImage = null

Never invent or guess an image URL.

2. ESTABLISH CURRENT MARKET PRICE CONTEXT

Separately from owner evidence and MDQ generation, establish the current
real-world acquisition-price context for the exact watch.

This is a PRE-PURCHASE MARKET CONTEXT layer.

It is not Fit Evidence.
It is not Product Integrity Evidence.
It must not become one of the 5-8 owner-evidence MDQs.

Never ask for, estimate or infer the user's budget.

Do not ask:
"What is your budget?"
"How much can you afford?"
"What is the maximum you would spend?"

Budget is not treated as a fixed user attribute.

Instead, the application will present the researched market price of this
specific watch and separately measure the user's reaction to that price level.


2A. DETERMINE THE RELEVANT ACQUISITION MARKET

Watch pricing may differ materially between:
- manufacturer retail price
- authorised-dealer availability
- unworn secondary-market examples
- pre-owned dealer examples
- private-market examples
- vintage collector-market examples

Determine which market best represents what a buyer can realistically expect
to pay for the exact watch being researched.

The primary marketPrice range should represent a defensible real-world
acquisition range rather than merely repeating MSRP when MSRP is not a realistic
purchase route.

For watches commonly available new at retail, current retail pricing may be
highly relevant.

For discontinued watches, use the relevant current secondary or pre-owned
market.

For watches where authorised retail availability is materially constrained and
secondary-market pricing differs significantly, explain that context concisely
in marketPrice.basis.

Do not create multiple price ranges merely because multiple channels exist.
Return the single range that most usefully represents current realistic
acquisition context for the researched watch.

Use the same geography as the selected market whenever practical.


2B. BUILD A DEFENSIBLE PRICE RANGE

Research genuinely comparable examples.

Prefer examples matching as closely as practical:
- exact reference
- relevant production period
- material
- dial or bezel configuration where reference does not already resolve it
- bracelet or strap configuration where materially price-relevant
- normal market condition
- relevant geography

For modern pre-owned watches, avoid allowing one unusually cheap or unusually
expensive listing to define the range.

Where identifiable, exclude:
- obvious counterfeit or replica listings
- incomplete or misleading listings
- materially different references
- heavily damaged examples
- exceptional provenance premiums
- celebrity-owned or historically significant examples
- rare dial or configuration premiums not representative of the researched watch
- auction anomalies
- parts-only watches
- extreme collector-condition outliers unless that exact collector condition is
  what the user queried

For vintage watches, recognise that originality, condition, service parts,
dial condition, provenance and accessories may create a much wider legitimate
price range.

Do not pretend that vintage pricing is more precise than the evidence supports.

Return a defensible typical acquisition-price RANGE rather than a single price.

marketPrice.currency:
Use the standard three-letter currency code appropriate to the researched
market, for example GBP, EUR or USD.

marketPrice.low:
The lower end of the defensible typical acquisition-price range, expressed as
a whole currency-unit integer.

marketPrice.high:
The upper end of the defensible typical acquisition-price range, expressed as
a whole currency-unit integer.

marketPrice.market:
Clearly state the geography represented by the range.

marketPrice.basis:
In one concise sentence, explain what comparable watches and acquisition channel
the range represents.

marketPrice.asOf:
Return the date on which the market-price research was performed in YYYY-MM-DD
form.

marketPrice.sources:
Return the web sources actually used to establish current market-price context.

Use at least one genuine current-market source.

Do not fabricate price sources.

Do not use owner-review evidence merely as a substitute for current
market-price evidence.

The marketPrice range is descriptive market context, not a judgement about
whether the watch is cheap, expensive, good value, overpriced or affordable.

Do not produce a price-fit verdict.

The user's reaction to this price level is handled separately by the application.


3. GATHER REAL OWNER EVIDENCE

Research real ownership and long-term wearing experience for the exact watch.

Prefer:
- detailed owner reports
- long-term ownership reports
- specialist watch-owner communities
- watch forums with identifiable ownership experience
- credible enthusiast communities
- credible long-term editorial ownership reports
- technically credible sources where needed to verify product behaviour

Manufacturer information and technical specifications may be used to establish
facts about the watch.

However, manufacturer specifications alone do not establish recurring owner
friction.

Editorial reviews may provide useful supporting evidence, especially for
wearability and product behaviour, but actual ownership evidence should carry
greater weight when identifying recurring ownership conditions.

Do not treat retailer marketing copy as owner evidence.

Do not treat a specification database as owner evidence.

Do not treat one person's complaint repeated or quoted across several websites
as several independent evidence documents.

Count UNIQUE evidence documents, not individual comments inside one discussion.

Do not invent evidence.


3A. EVIDENCE SHOULD MATCH THE EXACT WATCH

Prefer evidence tied directly to the exact reference.

Evidence from closely related references may be used only when the relevant
component or ownership characteristic is genuinely shared and that relationship
is defensible.

For example, evidence about a movement may sometimes be relevant across several
references using substantially the same movement.

But do not automatically transfer:
- case comfort
- bracelet fit
- clasp behaviour
- dimensions
- dial legibility
- bezel behaviour
- crown ergonomics
- weight
- wrist presence

from a materially different reference.

When broader family evidence is necessary, reduce evidence confidence
appropriately.


4. CLASSIFY EVIDENCE BEFORE MDQ GENERATION

Before converting evidence into ownership conditions or MDQs, distinguish
between two fundamentally different evidence classes.


A. FIT EVIDENCE

Evidence belongs to the Fit channel when the watch is substantially performing
as intended, but an evidenced characteristic, trade-off, behaviour, limitation
or ownership burden may fit some users better than others.

Possible examples include:
- substantial wrist presence
- a long clasp on smaller wrists
- noticeable weight
- limited micro-adjustment
- highly reflective or scratch-visible polished surfaces
- routine winding requirements
- normal mechanical accuracy behaviour
- limited legibility in particular conditions
- difficult-to-operate controls
- a thick case interfering with cuffs
- service cost or service interval burden
- magnetic sensitivity where relevant
- a highly conspicuous design
- normal bracelet or strap characteristics
- normal bezel, crown or chronograph operation
- normal ownership characteristics of vintage construction

These examples are NOT instructions to generate these MDQs.

Include them only if the researched evidence supports them and they pass the
decision-impact threshold.


B. PRODUCT INTEGRITY EVIDENCE

Evidence belongs to the Product Integrity channel when it indicates that the
watch may fail to perform an intended or reasonably expected function,
independent of the user's preference, wrist, lifestyle or tolerance.

Possible examples include:
- recurring movement failure
- premature movement malfunction
- repeated crown or winding-system failure
- clasp or bracelet functional failure
- recurring chronograph malfunction
- water ingress under conditions the watch should reasonably withstand
- repeated loss of timekeeping function
- recurring date-change malfunction
- repeated repair attempts that do not resolve the same functional fault
- replacement components developing the same fault

Do NOT convert Product Integrity Evidence into an MDQ.

Never ask the user whether they would tolerate product failure.

Bad:
"Would a movement failure bother you?"

Bad:
"How comfortable are you with repeated warranty repairs?"

These are not user-fit conditions.

Product Integrity Evidence must instead be evaluated separately under the
Product Integrity Risk Protocol.


IMPORTANT:

Negative owner evidence is not automatically Product Integrity Evidence.

Examples that normally remain Fit Evidence:
- expected mechanical accuracy variation
- cosmetic scratching
- normal bracelet stretch on sufficiently old watches
- normal servicing requirements
- subjective discomfort
- disliked clasp dimensions
- a watch wearing larger or smaller than expected
- normal winding behaviour
- normal rotor noise
- expected vintage limitations
- dissatisfaction with design or ergonomics

A characteristic becomes Product Integrity Evidence only when there is credible
evidence of functional failure rather than merely preference, expected wear or
normal product behaviour.

Evidence may contribute to both channels only when it genuinely contains two
distinct signals.

Do not duplicate the same observation merely to strengthen the apparent
integrity signal.


5. EXTRACT RECURRING OWNERSHIP FRICTIONS AND DISTINCTIVE USAGE CHARACTERISTICS

Find recurring real-world experiences that materially shape ownership or
wearing satisfaction.

For watches, decision-relevant evidence may include both:

A. OWNERSHIP FRICTIONS

Characteristics that repeatedly create inconvenience, discomfort, cost,
difficulty or regret for some owners.

AND

B. DISTINCTIVE USAGE CHARACTERISTICS

Characteristics that are not defects or problems but materially determine
whether living with and wearing this exact watch suits a particular user.

A watch does not need to have a "problem" for a meaningful fit condition to
exist.

For example, a watch may function perfectly while having a physical presence,
interaction pattern or ownership requirement that strongly suits some users
and poorly suits others.

Do not simply collect specifications, features, generic pros and cons,
brand prestige, historical significance or reviewer praise.


6. FIND THE CONDITION BEHIND EACH FRICTION OR CHARACTERISTIC

For every candidate ownership friction or distinctive usage characteristic ask:

"What condition in the user's wrist, wearing habits, daily use, expectations,
environment or tolerance determines whether this characteristic actually
matters?"

The MDQ must diagnose that condition.


RULE 1 — CONDITION, NOT PURCHASE ACTION

Questions must diagnose the user's ownership or wearing condition.

Do not ask whether the user has already performed a purchase action.

Trying on the exact watch, checking service history, verifying authenticity,
obtaining an inspection, checking timegrapher results or examining the watch
under magnification belong in mitigation or a later purchase-condition layer.

Bad:
"Have you tried this watch on?"

Better:
"How important is it that a watch sits compactly and unobtrusively on your
wrist throughout the day?"

Bad:
"Have you checked whether the watch has been serviced?"

Better:
"How comfortable are you with the routine servicing cost and maintenance needs
associated with this watch?"


RULE 1A — DO NOT ASK FOR WRIST SIZE UNLESS IT IS NECESSARY

Do not automatically ask the user for wrist circumference merely because watch
size appears in the research.

Prefer observable fit conditions and wearing preferences.

If exact wrist size genuinely changes the decision and cannot reasonably be
diagnosed through a consumer-facing condition, it may be used.

But wrist circumference alone does not determine watch fit.

Case shape, lug geometry, thickness, bracelet articulation, clasp dimensions,
weight distribution and personal wearing preference may matter as much or more.


7. APPLY THE CONSEQUENCE THRESHOLD

A recurring observation does NOT automatically deserve an MDQ.

Include a condition only if materially different answers could realistically
change whether this exact watch is a good ownership fit for the user.

Minor conveniences, enthusiast trivia, specification differences and
low-consequence preferences must not consume an MDQ slot.

Never pad the list.

5 strong MDQs are better than 8 weak ones.


RULE 2 — ASYMMETRIC VALUE TEST

Do not keep an MDQ merely because the watch has a recurring ownership advantage
that some users value.

Before keeping a benefit-led condition, test both directions:

1. If the user needs or values this characteristic, does the watch create
   meaningful positive fit?

2. If the user does NOT need or value it, does that create any meaningful
   ownership disadvantage or mismatch?

If the second answer is no, the condition normally should not consume one of
the final MDQ slots.

An unused benefit is not a mismatch.

Example:

A watch may have unusually high water resistance.

If the user never swims or dives with a watch, failure to use that capability
does not by itself make the watch a poor fit.

Therefore:

"How important is 300-metre water resistance to you?"

should normally not be an MDQ unless the construction that enables that
capability creates another meaningful trade-off relevant to ownership.


8. DISTINGUISH CHARACTERISTIC FROM FRICTION FROM FAILURE

For every negative-looking observation determine which of these it represents:


CHARACTERISTIC

The watch is behaving as intended.

Example:
A mechanical watch consistently runs a few seconds fast or slow per day within
its expected performance range.


FIT FRICTION

The watch is behaving as intended, but that behaviour may conflict with a
particular user's expectations.

Example:
A user expects near-quartz precision and dislikes having to correct a mechanical
watch periodically.


PRODUCT INTEGRITY FAILURE

The watch is not reliably performing an intended function.

Example:
Independent owners report the same movement developing large, abnormal
timekeeping deviations caused by a recurring malfunction.


Do not collapse these categories.

A normal characteristic may become an important fit condition.

It does not become an integrity problem merely because some users dislike it.


9. MERGE OVERLAPPING CONDITIONS

Merge conditions only when they represent one coherent diagnostic construct.

Do not allow physical watch fit to consume several MDQs merely because owner
evidence separately mentions:
- case diameter
- lug-to-lug
- thickness
- clasp length
- weight

If those observations diagnose one coherent wearability condition, merge them.

However, keep them separate when they create genuinely independent ownership
conditions.

For example:
- cuff compatibility
and
- all-day wrist comfort

may remain separate only if the evidence shows they independently affect
ownership fit.


RULE 3 — ONE DIAGNOSTIC CONSTRUCT

Do not bundle unrelated tolerances merely because they appeared together in
owner evidence.

For example:
scratch visibility,
mechanical accuracy,
and service cost

must not become one question.


10. WRITE THE MDQ

Questions must ask observable reality, realistic usage or concrete tolerance.

Avoid vague self-assessment.

The user should be able to answer without expert watch knowledge.

Questions should be understandable to someone considering their first serious
watch.


RULE 4 — NO UNEXPLAINED WATCH JARGON

Never assume the user understands watch terminology.

Do not require knowledge of:
- calibre numbers
- lug-to-lug
- COSC
- METAS
- beat rate
- amplitude
- hacking
- hand-winding
- micro-adjustment
- escapement terminology
- complication terminology
- bracelet construction terminology

If a technical concept is necessary, explain the practical meaning in plain
English.

Bad:
"Do you need on-the-fly micro-adjustment?"

Better:
"During the day, does your wrist size change enough that you value being able
to loosen or tighten the bracelet without tools?"

Bad:
"How important is COSC accuracy?"

Better:
"How important is it that a mechanical watch stays very close to the correct
time without frequent adjustment?"


RULE 4A — EVERY MDQ REQUIRES A CONTEXT LINE

Every MDQ must include a short clarification line.

The clarification is mandatory.

Its purpose is to explain, in plain consumer language, why this question matters
for ownership of this exact watch.

The clarification should connect the user's condition to the evidenced product
behaviour, limitation, characteristic or trade-off.

Keep it concise: normally one sentence.

Do not reveal the answer.
Do not tell the user which option to choose.
Do not exaggerate risk.
Do not merely repeat the question.

Good example:

Question:
"How important is it that a watch sits compactly on your wrist?"

Clarification:
"Owners with smaller wrists often note that this watch's clasp occupies a
substantial portion of the underside of the wrist."

Good example:

Question:
"How comfortable are you with visible marks developing during normal wear?"

Clarification:
"Owners frequently note that the highly polished surfaces show fine scratches
and wear marks relatively easily."

Bad clarification:
"This question is about watch size."

Bad clarification:
"Choose the option that best describes you."


11. BUILD ANSWER -> DECISION IMPACT MAPPING

Each MDQ must have exactly three answers.

The answers must represent meaningfully different ownership conditions.

For every answer determine its impact on fit:

positive
= clear compatibility with this watch

neutral
= compatible or not meaningfully decision-changing

medium_negative
= meaningful friction but usually manageable

high_negative
= major ownership mismatch

critical_negative
= fundamental mismatch on a condition capable of changing the purchase decision

Impact must be derived from BOTH:

a) the evidenced behaviour of this exact watch
b) the user's condition represented by the answer

Do not infer impact from evidence frequency alone.

Frequency is not severity.
Severity is not user impact.


11A. DEAL-BREAKER CAPABILITY

Set dealBreakerCapable to true only when at least one realistic answer to the
question could create a fundamental ownership mismatch with this exact watch.

Do not mark a question deal-breaker-capable merely because the topic is
frequently discussed.

A cosmetic preference, minor convenience or enthusiast detail should rarely be
deal-breaker-capable.

Examples that MAY become deal-breaker-capable when strongly supported by
evidence include:
- severe physical wearability mismatch
- inability to tolerate a required interaction or maintenance pattern
- a fundamental conflict between expected accuracy and normal product behaviour
- a major practical-use limitation central to the user's intended use

Use this conservatively.


12. ASSESS EVIDENCE STRENGTH SEPARATELY

For each MDQ assign:

moderate
strong
very_strong

This represents confidence that the ownership condition genuinely matters for
this exact watch.

Evidence strength must be based on:
- recurrence across independent sources
- consistency of reports
- relevance to the exact reference
- credibility and depth of ownership evidence
- whether the evidence comes from actual owners
- whether closely related references had to be used

Do not use evidence strength as a substitute for user impact.

Also provide a concise evidenceReason explaining why the evidence strength was
assigned.


13. GENERATE CONDITION-SPECIFIC MITIGATION

For every answer with negative impact, provide an actionable mitigation that
directly addresses that specific mismatch.

Mitigation should reduce uncertainty or reduce the mismatch.

Generic boilerplate is not acceptable.


Examples:

Wearability mismatch:
"Try the exact reference with the bracelet sized correctly and wear it for at
least 15–20 minutes before deciding."

Bracelet adjustment mismatch:
"Confirm that the available clasp adjustment range is sufficient for your wrist
changes before purchase."

Mechanical accuracy expectation:
"If near-perfect daily accuracy is essential, compare the expected mechanical
accuracy with a quartz or higher-accuracy alternative before deciding."

Scratch sensitivity:
"Inspect a normally worn example rather than only showroom-fresh photographs to
decide whether the way this finish ages is acceptable to you."

Service-cost sensitivity:
"Check the current manufacturer or specialist service price and include one
routine service in your expected ownership cost."

For positive or neutral answers, mitigation must be an empty string.


14. DIAGNOSTIC DIVERSITY / REDUNDANCY CONTROL

Do not allow one underlying friction family to consume multiple MDQ slots
unless each condition can independently change the purchase decision.

For example:

case diameter,
case thickness,
lug geometry,
bracelet articulation,
clasp length,
and weight

must not automatically become six questions.

Determine the minimum number of independent user conditions needed to diagnose
the evidenced wearability issue.

Likewise:

accuracy,
power reserve,
winding,
and setting behaviour

should remain separate only when each creates a genuinely independent ownership
condition.

The final MDQ set should cover the minimum diverse set of conditions needed to
diagnose fit.


15. EVIDENCE TRACEABILITY

Evidence strength must not be an unsupported qualitative judgement.

When deciding whether evidence is moderate, strong or very_strong, explicitly
reason from:
- number of independent supporting documents
- how many are tied to the exact reference
- consistency of reports
- actual ownership duration where available
- owner evidence versus editorial commentary
- whether technical specifications merely confirm the mechanism behind an
  owner-reported experience

Technical specifications may confirm product behaviour, but they do not by
themselves establish recurring owner friction.

Owner-experience evidence should carry the greatest weight when identifying
ownership conditions.

In evidenceReason, make the basis visible whenever possible.

Prefer wording such as:
"Supported by several independent 124060 owner reports and long-term ownership
accounts."

Avoid unsupported wording such as:
"Owners consistently report..."

unless the research actually supports that claim.


16. FINAL MDQ SELECTION

Keep only the strongest 5-8 independent MDQs.

Prioritize conditions that can genuinely change:
- purchase recommendation
- likelihood of ownership regret
- frequency of wearing the watch
- physical comfort
- daily usability
- maintenance burden
- meaningful ownership cost exposure
- suitability for the user's actual wearing pattern

Do not include a question merely because the topic appeared in watch reviews.

Do not manufacture enough topics to reach eight.

Five strong independent questions are preferable to eight weak questions.


17. PRODUCT-LEVEL FIT VS CONDITION OF ONE PHYSICAL WATCH

This model evaluates the ownership fit of the watch reference or product
definition.

Do not turn the condition of one individual pre-owned watch into an MDQ.

Examples that normally belong to a later watch-condition / authentication /
pre-purchase inspection layer include:
- whether one watch is genuine
- polishing history
- replaced dial or hands
- service parts
- bracelet stretch on one example
- water damage on one example
- missing box or papers
- undocumented service history
- one watch's current timekeeping measurement
- case damage
- provenance
- seller trustworthiness

However, if a condition is a recurring product-level ownership characteristic
of the exact reference, it may still qualify as Fit Evidence.

Do not confuse product-level evidence with example-specific purchase risk.



PRODUCT INTEGRITY RISK PROTOCOL

This protocol is separate from MDQ generation.

Its purpose is not to decide whether a watch is legally defective and not to
make a legal or regulatory determination.

Its purpose is only to identify meaningful evidence signals that the exact
watch may fail to perform an intended or reasonably expected function.


1. IDENTIFY THE FAILURE MODE

For each candidate integrity issue determine what function is failing.

Examples of functions include:
- timekeeping
- winding
- power delivery
- crown operation
- date operation
- chronograph operation
- bezel operation where functionally intended
- bracelet or clasp retention
- water resistance
- display or hand operation

Distinguish actual functional failure from dissatisfaction, expected mechanical
behaviour, normal servicing requirements, cosmetic wear or subjective
preference.


2. DETERMINE FUNCTIONAL IMPORTANCE

Assess whether the affected function is:
- peripheral or minor
- meaningful to normal ownership
- central to the watch's intended use


3. ESTABLISH RECURRENCE

Determine whether substantially the same failure appears across independent
owner evidence.

Do not infer recurrence merely because many comments appear inside one forum
thread, article or discussion.

Do not infer a reference-wide problem solely from failures associated with a
different watch using a related movement.


4. ASSESS SEVERITY

minor:
A real malfunction with limited effect on normal ownership.

meaningful:
A malfunction that materially impairs normal use or requires significant repair
because an important function has failed.

major:
A failure that removes a core function, renders the watch substantially
unusable, repeatedly prevents normal use, causes loss of secure wear, or
requires major repair because an important function has failed.


5. EXAMINE THE RESOLUTION PATTERN

Consider whether the issue:
- resolves easily
- requires routine repair
- requires significant repair
- repeatedly returns after repair
- leads to movement or component replacement
- persists after replacement
- creates repeated warranty claims
- causes owners to sell or return the watch specifically because normal
  function could not be restored

Repeated failed resolution is stronger evidence than a single successfully
repaired fault.


6. ASSESS EVIDENCE STRENGTH

Use:

moderate
strong
very_strong

Base this on:
- recurrence across independent evidence documents
- relevance to the exact reference
- consistency of the described failure mode
- actual owner experience
- quality and specificity of reports
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
pattern affecting an important function, especially where failures are major,
persistent, difficult to resolve, or repeatedly require significant repair or
replacement.


8. DETERMINE WHETHER INTEGRITY OVERRIDES FIT

Set overrideFit to true only when the evidence supports a serious integrity
concern strong enough that asking whether the user's ownership conditions fit
the watch would materially understate the purchase risk.

Be conservative.

A few isolated movement failures must not override fit.

A common annoyance or normal mechanical characteristic must not override fit.

Expected servicing cost must not override fit.

Cosmetic wear must not override fit.

Ordinary age-related deterioration in individual vintage watches must not
override fit.

overrideFit should normally require a combination of:
- meaningful or major functional severity
- recurrence across independent owner evidence
- strong relevance to the exact reference
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
- level must be "no_meaningful_signal"
- overrideFit = false
- issues = []
- summary should state concisely that no meaningful recurring integrity pattern
  was established from the researched owner evidence
- evidenceReason should briefly explain the basis

Do not manufacture integrity issues merely to populate the output.

If issues are returned, each issue must describe a specific recurring functional
failure pattern rather than a broad reliability category.

Prefer:
"Recurring crown-winding failure preventing normal winding"

Avoid:
"movement problems"

Prefer:
"Repeated clasp release under normal wear"

Avoid:
"bracelet issues"

Do not use Product Integrity Risk as a substitute for general servicing cost,
expected mechanical behaviour, cosmetic ageing, vintage deterioration or
individual-watch purchase-condition risk.



OUTPUT RULES

schemaVersion:
Always return exactly "1.0".

id:
Return a stable lowercase hyphenated identifier based on the canonical watch
identity.

Prefer brand, model and reference.

Example:
"rolex-submariner-124060"

Do not include market or transient pricing information in the id.


brand:
Return the watch manufacturer or brand.

Example:
"Rolex"


model:
Return the clearest established model or collection name.

Example:
"Submariner"


reference:
Return the exact reference number where one can be defensibly established.

Preserve meaningful punctuation and formatting.

Example:
"124060"

Example:
"310.30.42.50.01.001"

If the user's query does not contain a reference but one exact reference can be
defensibly resolved from the supplied product description, return that
reference.

Do not guess between materially different references merely to avoid ambiguity.

If no defensible reference can be established, return a concise consumer-readable
value such as:
"Not specified"

Do not fabricate a reference.


A model name, collection name, dial name, colourway, edition name or variant
description is NOT a reference number.

For example, if the researched watch is marketed as:
"Brew Metric Retro Dial"

do not return:
reference = "Metric - Retro Dial"

unless the manufacturer explicitly uses that value as a product reference,
SKU or reference identifier.

Instead return:
model = "Metric"
variant = "Retro Dial"
reference = "Not specified"

when no defensible manufacturer reference number or product reference can be
established.


year:
If the user explicitly supplied a specific production year and it is compatible
with the resolved watch, return that four-digit year.

If the user did not specify a year and no exact year is necessary to preserve
the requested identity, return null.

Do not arbitrarily choose the first or latest production year.


productionPeriod:
Return the clearest defensible production period for the researched reference
or product phase.

Examples:
"2020–present"
"2012–2020"
"approximately 1967–1980"

Do not claim false precision for vintage watches.


variant:
Return only the principal variant information needed to distinguish the
researched watch.

Do not turn this field into a long specification list.

Example:
"No Date"

Example:
"Hesalite"

If no additional variant is necessary beyond model and reference, return:
"Standard reference configuration"


movement:
Return the movement in concise consumer-readable form.

Example:
"Rolex calibre 3230"

Example:
"Omega calibre 3861 manual-wind"

Example:
"Quartz"

Do not invent a calibre if it cannot be defensibly established.


caseSize:
Return the nominal manufacturer case diameter or the most defensible standard
case-size description.

Example:
"41 mm"

Do not convert the dimension into a fit judgement such as:
"large"
"small"
"compact"

If a conventional case diameter is not a meaningful descriptor because of case
shape, return a concise factual size description rather than inventing a round
diameter.


market:
Return the primary geography used for current acquisition-price research.

This does not imply that the watch itself is mechanically market-specific.

Examples:
"United Kingdom"
"Germany"
"United States"



productImage:
Return one representative image of the exact researched watch when a reliable
match can be established.

productImage.url:
Return a direct HTTPS image URL suitable for an HTML <img> element.

productImage.sourceUrl:
Return the HTTPS product or archive page establishing that the image represents
the researched watch.

productImage.alt:
Return short factual alt text describing the watch.

The image should match the exact reference and principal variant as closely as
possible.

If a sufficiently reliable match cannot be established, return:
null

Never invent or guess an image URL.

productImage is descriptive identity metadata only.
It must not affect Fit Evidence, Product Integrity, MDQs or the final fit result.


marketPrice:
Return current acquisition-price context separately from MDQs.



marketPrice.currency:
Three-letter currency code.

marketPrice.low:
Lower end of the typical current acquisition-price range.

marketPrice.high:
Upper end of the typical current acquisition-price range.

marketPrice.market:
Market/geography represented by the range.

marketPrice.basis:
One concise sentence describing the comparable watches and acquisition channel
represented.

marketPrice.asOf:
Date of the market-price research in YYYY-MM-DD format.

marketPrice.sources:
Current market sources actually used to establish the range.


evidenceCount:
Count unique evidence documents actually used for the ownership-fit and
product-integrity research.

Do not count individual comments within one discussion as separate documents.

Do not inflate the count with price listings used only for marketPrice unless
they also genuinely contribute ownership evidence.


evidenceUnit:
Use:
"unique evidence documents"


evidenceLastUpdated:
Return the date on which the evidence research was performed in YYYY-MM-DD form.


evidenceSources:
Return the actual evidence sources used for ownership-fit and product-integrity
research.

Do not fabricate sources.


evidenceMethod:
Provide a concise description of how evidence was gathered and filtered.


condition:
A short plain-English name for the ownership or wearing condition.


evidenceStrength:
Return exactly:
moderate
strong
or
very_strong


evidenceReason:
One concise sentence explaining why this condition is sufficiently supported by
real evidence.


dealBreakerCapable:
Boolean.

Use true conservatively and only when at least one realistic answer could create
a fundamental ownership mismatch.


text:
The user-facing MDQ.

Write it in plain consumer language.


clarification:
Required for every MDQ.

Provide one concise, plain-English sentence explaining why this question matters
for ownership of this exact watch.

Connect the user's condition to the evidenced product behaviour, limitation,
characteristic or trade-off behind the question.

Never return an empty string.


answers:
Exactly three user-facing answers.

The answers should represent materially different real-world user conditions,
not merely:
"Yes"
"Maybe"
"No"

unless those labels are genuinely the clearest observable choices.


impactReason:
One concise sentence explaining why that answer changes or does not change fit
with this exact watch.


mitigation:
For a negative answer, provide a specific action that could reduce the mismatch
or uncertainty.

For positive and neutral answers return exactly:
""


FINAL OUTPUT BEHAVIOUR

Result calculation is handled separately.

Do not produce a final watch verdict.

Do not recommend an alternative watch unless necessary inside a specific
mitigation.

Do not rank the watch.

Do not assign numeric scores.

Do not describe the user as a particular personality type.

Do not generate generic watch-buying advice.

Build only the evidence-grounded Watch Decision Model required by the schema.

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


/*
 * GENERAL NORMALIZATION
 */

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


function normalizeDbQuery(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}


/*
 * WATCH CANONICAL IDENTITY
 *
 * Reference number is the strongest identity signal
 * for most modern watches.
 *
 * Year is included only when the researched watch
 * actually has a specific year.
 *
 * Market is deliberately NOT part of the canonical
 * product identity because the same watch reference
 * is often mechanically identical across markets.
 */

function buildCanonicalWatchSource(watch) {
  return [
    watch.brand,
    watch.model,
    watch.reference,
    watch.variant
  ]
    .filter(
      value =>
        value !== undefined &&
        value !== null &&
        value !== ""
    )
    .join(" ");
}


/*
 * HUMAN-READABLE CACHE / RESULT NAME
 *
 * Examples:
 *
 * Rolex Submariner 124060
 *
 * Rolex Submariner 124060 — 2021
 *
 * Omega Speedmaster Professional Moonwatch
 * 310.30.42.50.01.001
 */

function buildWatchDisplayName(watch) {
  const base = [
    watch.brand,
    watch.model,

    watch.reference &&
    watch.reference !== "Not specified"
      ? watch.reference
      : null
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return watch.year
    ? `${base} — ${watch.year}`
    : base;
}


/*
 * SEARCH TEXT
 *
 * This is deliberately broader than the canonical
 * cache key.
 *
 * It improves retrieval when the user searches using
 * model names, references, calibre names, production
 * periods or a previously researched phrase.
 */

function buildWatchSearchText(
  watch,
  originalQuery
) {
  return [
    watch.brand,
    watch.model,
    watch.reference,
    watch.year,
    watch.productionPeriod,
    watch.variant,
    watch.movement,
    watch.caseSize,
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


/*
 * DATABASE JSON PARSER
 */

function parseWatchData(value) {
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


/*
 * MARKET PRICE VALIDATION
 */

function hasUsableWatchMarketPrice(watch) {
  const price = watch?.marketPrice;

  if (
    !price ||
    typeof price !== "object" ||
    Array.isArray(price)
  ) {
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
    price.sources.length < 1 ||
    price.sources.some(
      source =>
        typeof source !== "string" ||
        !source.trim()
    )
  ) {
    return false;
  }

  return true;
}


/*
 * WATCH SCHEMA v1.0 VALIDATION
 *
 * This validates the model AFTER OpenAI structured
 * output and also protects us from serving stale or
 * legacy database records.
 */

function hasUsableWatchSchema(watch) {
  return diagnoseWatchSchema(watch).valid;
}


function diagnoseWatchSchema(watch) {
  const fail = (reason, details = {}) => ({
    valid: false,
    reason,
    details
  });

  const ok = () => ({
    valid: true,
    reason: null,
    details: {}
  });

  const isNonEmptyString = value =>
    typeof value === "string" &&
    value.trim().length > 0;

  const validEvidenceStrengths = new Set([
    "moderate",
    "strong",
    "very_strong"
  ]);

  const validImpacts = new Set([
    "positive",
    "neutral",
    "medium_negative",
    "high_negative",
    "critical_negative"
  ]);

  const validIntegrityLevels = new Set([
    "no_meaningful_signal",
    "integrity_concern",
    "serious_integrity_concern"
  ]);

  const validIntegritySeverities = new Set([
    "minor",
    "meaningful",
    "major"
  ]);

  const validIntegrityRecurrence = new Set([
    "limited",
    "recurring",
    "strongly_recurring"
  ]);


  /*
   * BASIC OBJECT CHECK
   */

  if (
    !watch ||
    typeof watch !== "object" ||
    Array.isArray(watch)
  ) {
    return fail("watch_not_object");
  }


  /*
   * SCHEMA VERSION
   */

  if (watch.schemaVersion !== "1.0") {
    return fail(
      "schemaVersion_invalid",
      {
        value: watch.schemaVersion
      }
    );
  }


  /*
   * TOP-LEVEL WATCH IDENTITY
   */

  const requiredStringFields = [
    "id",
    "brand",
    "model",
    "reference",
    "productionPeriod",
    "variant",
    "movement",
    "caseSize",
    "market"
  ];

  for (const field of requiredStringFields) {
    if (!isNonEmptyString(watch[field])) {
      return fail(
        `top_level_${field}_invalid`,
        {
          value: watch[field]
        }
      );
    }
  }


  /*
   * YEAR
   */

  if (
    watch.year !== null &&
    (
      !Number.isInteger(watch.year) ||
      watch.year < 1800 ||
      watch.year > 2100
    )
  ) {
    return fail(
      "year_invalid",
      {
        value: watch.year
      }
    );
  }


  /*
   * PRODUCT IMAGE
   */

  if (
    !Object.prototype.hasOwnProperty.call(
      watch,
      "productImage"
    )
  ) {
    return fail(
      "productImage_missing"
    );
  }

  if (watch.productImage !== null) {
    const image = watch.productImage;

    if (
      !image ||
      typeof image !== "object" ||
      Array.isArray(image)
    ) {
      return fail(
        "productImage_not_object",
        {
          value: image
        }
      );
    }

    if (!isNonEmptyString(image.url)) {
      return fail(
        "productImage_url_empty",
        {
          value: image.url
        }
      );
    }

    if (
      !/^https:\/\//i.test(
        image.url.trim()
      )
    ) {
      return fail(
        "productImage_url_not_https",
        {
          value: image.url
        }
      );
    }

    if (
      !isNonEmptyString(
        image.sourceUrl
      )
    ) {
      return fail(
        "productImage_sourceUrl_empty",
        {
          value: image.sourceUrl
        }
      );
    }

    if (
      !/^https:\/\//i.test(
        image.sourceUrl.trim()
      )
    ) {
      return fail(
        "productImage_sourceUrl_not_https",
        {
          value: image.sourceUrl
        }
      );
    }

    if (
      !isNonEmptyString(
        image.alt
      )
    ) {
      return fail(
        "productImage_alt_empty",
        {
          value: image.alt
        }
      );
    }
  }


  /*
   * MARKET PRICE
   */

  const price = watch.marketPrice;

  if (
    !price ||
    typeof price !== "object" ||
    Array.isArray(price)
  ) {
    return fail(
      "marketPrice_invalid_object",
      {
        value: price
      }
    );
  }

  if (
    !isNonEmptyString(
      price.currency
    )
  ) {
    return fail(
      "marketPrice_currency_invalid",
      {
        value: price.currency
      }
    );
  }

  if (
    !Number.isFinite(
      price.low
    )
  ) {
    return fail(
      "marketPrice_low_invalid",
      {
        value: price.low
      }
    );
  }

  if (
    !Number.isFinite(
      price.high
    )
  ) {
    return fail(
      "marketPrice_high_invalid",
      {
        value: price.high
      }
    );
  }

  if (price.low < 0) {
    return fail(
      "marketPrice_low_negative",
      {
        value: price.low
      }
    );
  }

  if (
    price.high <= price.low
  ) {
    return fail(
      "marketPrice_range_invalid",
      {
        low: price.low,
        high: price.high
      }
    );
  }

  if (
    !isNonEmptyString(
      price.market
    )
  ) {
    return fail(
      "marketPrice_market_invalid",
      {
        value: price.market
      }
    );
  }

  if (
    !isNonEmptyString(
      price.basis
    )
  ) {
    return fail(
      "marketPrice_basis_invalid",
      {
        value: price.basis
      }
    );
  }

  if (
    !isNonEmptyString(
      price.asOf
    )
  ) {
    return fail(
      "marketPrice_asOf_invalid",
      {
        value: price.asOf
      }
    );
  }

  if (
    !Array.isArray(
      price.sources
    ) ||
    price.sources.length < 1
  ) {
    return fail(
      "marketPrice_sources_invalid",
      {
        value: price.sources
      }
    );
  }

  for (
    let i = 0;
    i < price.sources.length;
    i++
  ) {
    if (
      !isNonEmptyString(
        price.sources[i]
      )
    ) {
      return fail(
        "marketPrice_source_invalid",
        {
          index: i,
          value: price.sources[i]
        }
      );
    }
  }


  /*
   * EVIDENCE BASE
   */

  if (
    !Number.isInteger(
      watch.evidenceCount
    ) ||
    watch.evidenceCount < 1
  ) {
    return fail(
      "evidenceCount_invalid",
      {
        value: watch.evidenceCount
      }
    );
  }

  if (
    !isNonEmptyString(
      watch.evidenceUnit
    )
  ) {
    return fail(
      "evidenceUnit_invalid",
      {
        value: watch.evidenceUnit
      }
    );
  }

  if (
    !isNonEmptyString(
      watch.evidenceLastUpdated
    )
  ) {
    return fail(
      "evidenceLastUpdated_invalid",
      {
        value:
          watch.evidenceLastUpdated
      }
    );
  }

  if (
    !Array.isArray(
      watch.evidenceSources
    ) ||
    watch.evidenceSources.length < 1
  ) {
    return fail(
      "evidenceSources_invalid",
      {
        value: watch.evidenceSources
      }
    );
  }

  for (
    let i = 0;
    i < watch.evidenceSources.length;
    i++
  ) {
    if (
      !isNonEmptyString(
        watch.evidenceSources[i]
      )
    ) {
      return fail(
        "evidenceSource_invalid",
        {
          index: i,
          value:
            watch.evidenceSources[i]
        }
      );
    }
  }

  if (
    !isNonEmptyString(
      watch.evidenceMethod
    )
  ) {
    return fail(
      "evidenceMethod_invalid",
      {
        value:
          watch.evidenceMethod
      }
    );
  }


  /*
   * PRODUCT INTEGRITY
   */

  const integrity =
    watch.productIntegrity;

  if (
    !integrity ||
    typeof integrity !== "object" ||
    Array.isArray(integrity)
  ) {
    return fail(
      "productIntegrity_invalid_object",
      {
        value: integrity
      }
    );
  }

  if (
    !validIntegrityLevels.has(
      integrity.level
    )
  ) {
    return fail(
      "productIntegrity_level_invalid",
      {
        value: integrity.level
      }
    );
  }

  if (
    !isNonEmptyString(
      integrity.summary
    )
  ) {
    return fail(
      "productIntegrity_summary_invalid",
      {
        value: integrity.summary
      }
    );
  }

  if (
    typeof integrity.overrideFit !==
    "boolean"
  ) {
    return fail(
      "productIntegrity_overrideFit_invalid",
      {
        value:
          integrity.overrideFit
      }
    );
  }

  if (
    !isNonEmptyString(
      integrity.evidenceReason
    )
  ) {
    return fail(
      "productIntegrity_evidenceReason_invalid",
      {
        value:
          integrity.evidenceReason
      }
    );
  }

  if (
    !Array.isArray(
      integrity.issues
    )
  ) {
    return fail(
      "productIntegrity_issues_invalid",
      {
        value: integrity.issues
      }
    );
  }


  /*
   * INTEGRITY CONSISTENCY
   */

  if (
    integrity.level ===
      "no_meaningful_signal" &&
    integrity.overrideFit !== false
  ) {
    return fail(
      "no_meaningful_signal_override_true",
      {
        level:
          integrity.level,
        overrideFit:
          integrity.overrideFit
      }
    );
  }

  if (
    integrity.level ===
      "no_meaningful_signal" &&
    integrity.issues.length !== 0
  ) {
    return fail(
      "no_meaningful_signal_has_issues",
      {
        issuesCount:
          integrity.issues.length
      }
    );
  }

  if (
    integrity.overrideFit === true &&
    integrity.level !==
      "serious_integrity_concern"
  ) {
    return fail(
      "override_without_serious_integrity",
      {
        level:
          integrity.level
      }
    );
  }


  /*
   * INTEGRITY ISSUES
   */

  for (
    let i = 0;
    i < integrity.issues.length;
    i++
  ) {
    const issue =
      integrity.issues[i];

    if (
      !issue ||
      typeof issue !== "object" ||
      Array.isArray(issue)
    ) {
      return fail(
        "integrity_issue_invalid_object",
        {
          index: i
        }
      );
    }

    const issueStringFields = [
      "id",
      "functionAffected",
      "failureMode",
      "resolutionPattern",
      "evidenceReason"
    ];

    for (
      const field of issueStringFields
    ) {
      if (
        !isNonEmptyString(
          issue[field]
        )
      ) {
        return fail(
          `integrity_issue_${field}_invalid`,
          {
            index: i,
            value:
              issue[field]
          }
        );
      }
    }

    if (
      !validIntegritySeverities.has(
        issue.severity
      )
    ) {
      return fail(
        "integrity_issue_severity_invalid",
        {
          index: i,
          value:
            issue.severity
        }
      );
    }

    if (
      !validIntegrityRecurrence.has(
        issue.recurrence
      )
    ) {
      return fail(
        "integrity_issue_recurrence_invalid",
        {
          index: i,
          value:
            issue.recurrence
        }
      );
    }

    if (
      !validEvidenceStrengths.has(
        issue.evidenceStrength
      )
    ) {
      return fail(
        "integrity_issue_evidenceStrength_invalid",
        {
          index: i,
          value:
            issue.evidenceStrength
        }
      );
    }
  }


  /*
   * WATCH MDQs
   */

  if (
    !Array.isArray(
      watch.questions
    )
  ) {
    return fail(
      "questions_not_array",
      {
        value: watch.questions
      }
    );
  }

  if (
    watch.questions.length < 5 ||
    watch.questions.length > 8
  ) {
    return fail(
      "question_count_invalid",
      {
        count:
          watch.questions.length
      }
    );
  }

  const questionIds =
    new Set();


  for (
    let qIndex = 0;
    qIndex < watch.questions.length;
    qIndex++
  ) {
    const question =
      watch.questions[qIndex];

    if (
      !question ||
      typeof question !== "object" ||
      Array.isArray(question)
    ) {
      return fail(
        "question_invalid_object",
        {
          qIndex
        }
      );
    }

    if (
      !isNonEmptyString(
        question.id
      )
    ) {
      return fail(
        "question_id_invalid",
        {
          qIndex,
          value:
            question.id
        }
      );
    }

    if (
      questionIds.has(
        question.id
      )
    ) {
      return fail(
        "question_id_duplicate",
        {
          qIndex,
          id:
            question.id
        }
      );
    }

    questionIds.add(
      question.id
    );


    /*
     * REQUIRED QUESTION STRINGS
     */

    const questionStringFields = [
      "condition",
      "evidenceReason",
      "text",
      "clarification"
    ];

    for (
      const field of questionStringFields
    ) {
      if (
        !isNonEmptyString(
          question[field]
        )
      ) {
        return fail(
          `question_${field}_invalid`,
          {
            qIndex,
            questionId:
              question.id,
            value:
              question[field]
          }
        );
      }
    }


    if (
      !validEvidenceStrengths.has(
        question.evidenceStrength
      )
    ) {
      return fail(
        "question_evidenceStrength_invalid",
        {
          qIndex,
          questionId:
            question.id,
          value:
            question.evidenceStrength
        }
      );
    }

    if (
      typeof question.dealBreakerCapable !==
      "boolean"
    ) {
      return fail(
        "question_dealBreakerCapable_invalid",
        {
          qIndex,
          questionId:
            question.id,
          value:
            question.dealBreakerCapable
        }
      );
    }


    /*
     * EXACTLY THREE ANSWERS
     */

    if (
      !Array.isArray(
        question.answers
      ) ||
      question.answers.length !== 3
    ) {
      return fail(
        "question_answers_count_invalid",
        {
          qIndex,
          questionId:
            question.id,
          count:
            Array.isArray(
              question.answers
            )
              ? question.answers.length
              : null
        }
      );
    }


    /*
     * ANSWERS
     */

    for (
      let aIndex = 0;
      aIndex <
      question.answers.length;
      aIndex++
    ) {
      const answer =
        question.answers[aIndex];

      if (
        !answer ||
        typeof answer !== "object" ||
        Array.isArray(answer)
      ) {
        return fail(
          "answer_invalid_object",
          {
            qIndex,
            aIndex,
            questionId:
              question.id
          }
        );
      }

      if (
        !isNonEmptyString(
          answer.label
        )
      ) {
        return fail(
          "answer_label_invalid",
          {
            qIndex,
            aIndex,
            questionId:
              question.id,
            value:
              answer.label
          }
        );
      }

      if (
        !validImpacts.has(
          answer.impact
        )
      ) {
        return fail(
          "answer_impact_invalid",
          {
            qIndex,
            aIndex,
            questionId:
              question.id,
            value:
              answer.impact
          }
        );
      }

      if (
        !isNonEmptyString(
          answer.impactReason
        )
      ) {
        return fail(
          "answer_impactReason_invalid",
          {
            qIndex,
            aIndex,
            questionId:
              question.id,
            value:
              answer.impactReason
          }
        );
      }

      if (
        typeof answer.mitigation !==
        "string"
      ) {
        return fail(
          "answer_mitigation_not_string",
          {
            qIndex,
            aIndex,
            questionId:
              question.id,
            value:
              answer.mitigation
          }
        );
      }


      /*
       * MITIGATION CONSISTENCY
       */

      const positiveOrNeutral =
        answer.impact === "positive" ||
        answer.impact === "neutral";

      const negative =
        answer.impact ===
          "medium_negative" ||
        answer.impact ===
          "high_negative" ||
        answer.impact ===
          "critical_negative";

      if (
        positiveOrNeutral &&
        answer.mitigation.trim() !== ""
      ) {
        return fail(
          "positive_or_neutral_has_mitigation",
          {
            qIndex,
            aIndex,
            questionId:
              question.id,
            impact:
              answer.impact,
            mitigation:
              answer.mitigation
          }
        );
      }

      if (
        negative &&
        answer.mitigation.trim() === ""
      ) {
        return fail(
          "negative_missing_mitigation",
          {
            qIndex,
            aIndex,
            questionId:
              question.id,
            impact:
              answer.impact
          }
        );
      }
    }
  }


  /*
   * CANONICAL ID FORMAT
   */

  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
      watch.id
    )
  ) {
    return fail(
      "watch_id_format_invalid",
      {
        value:
          watch.id
      }
    );
  }


  return ok();
}





/*
 * RATE-LIMIT IDENTIFIER
 *
 * We hash the IP before storing it.
 *
 * Watch research intentionally uses its own
 * namespace, while the same research_rate_limits
 * table can be shared with Cars.
 */




/*
 * CONSUME WATCH RESEARCH RATE LIMIT
 *
 * IMPORTANT:
 * Call this only AFTER a cache miss.
 *
 * Cache hits should remain free and should not
 * consume the user's research allowance.
 *
 * This uses the existing research_rate_limits table.
 */

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


function buildWatchRateLimitIdentifier(req) {
  const ip = getClientIp(req);

  /*
   * Do not store the raw client IP.
   *
   * Watches use their own namespace so the same
   * research_rate_limits table can safely be shared
   * with Cars.
   */
  return crypto
    .createHash("sha256")
    .update(`watch-research:${ip}`)
    .digest("hex");
}


async function consumeWatchResearchRateLimit(
  sql,
  req
) {
  const identifier =
    buildWatchRateLimitIdentifier(req);

  /*
   * Both counters are incremented atomically
   * inside one PostgreSQL statement.
   *
   * This rate limit is consumed ONLY after a
   * watch cache miss, immediately before a
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
    Number(
      row?.hourly_count || 0
    );

  const dailyCount =
    Number(
      row?.daily_count || 0
    );

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
          (resetAt - Date.now()) /
          1000
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
          (resetAt - Date.now()) /
          1000
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

/*
 * WATCH CACHE LOOKUP
 *
 * PASS 1A
 * Exact canonical cache_key match.
 *
 * PASS 1B
 * Exact normalized researched_query match,
 * but only when exactly one record matches.
 *
 * PASS 2
 * Full-text / trigram candidate lookup.
 *
 * Automatic fuzzy acceptance remains conservative:
 * exactly one candidate must be returned.
 */

async function findCachedWatch(sql, query) {
  const normalizedQuery =
    normalizeDbQuery(query);

  const queryCacheKey =
    normalizeCacheKey(query);


  /*
   * PASS 1A — EXACT CACHE KEY
   *
   * Useful when the user enters a canonical query
   * such as:
   *
   * Rolex Submariner 124060
   */

  const exactKeyRows = await sql`
    SELECT
      id,
      brand,
      model,
      reference,
      year,
      production_period,
      variant,
      movement,
      case_size,
      display_name,
      search_text,
      cache_key,
      watch_data,
      researched_query,
      research_model,
      research_cost_usd,
      input_tokens,
      cached_input_tokens,
      output_tokens,
      updated_at
    FROM watches
    WHERE cache_key = ${queryCacheKey}
    ORDER BY updated_at DESC
    LIMIT 2
  `;

  if (exactKeyRows.length === 1) {
    return {
      row: exactKeyRows[0],
      matchType: "exact_cache_key",
      score: 1
    };
  }


  /*
   * PASS 1B — EXACT ORIGINAL QUERY
   *
   * This is particularly useful when the original
   * user query contained wording that does not map
   * perfectly onto the canonical key.
   *
   * Only accept automatically when there is exactly
   * one matching database record.
   */

const exactQueryRows = await sql`
  SELECT
    id,
    brand,
    model,
    reference,
    year,
    production_period,
    variant,
    movement,
    case_size,
    display_name,
    search_text,
    cache_key,
    watch_data,
    researched_query,
    research_model,
    research_cost_usd,
    input_tokens,
    cached_input_tokens,
    output_tokens,
    updated_at
  FROM watches
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

  if (exactQueryRows.length === 1) {
    return {
      row: exactQueryRows[0],
      matchType: "exact_researched_query",
      score: 1
    };
  }


  /*
   * PASS 2 — TRIGRAM / TEXT CANDIDATE SEARCH
   *
   * pg_trgm is already used by the Cars cache.
   *
   * We use the same extension for watches.
   */

  const candidateRows = await sql`
    SELECT
      id,
      brand,
      model,
      reference,
      year,
      production_period,
      variant,
      movement,
      case_size,
      display_name,
      search_text,
      cache_key,
      watch_data,
      researched_query,
      research_model,
      research_cost_usd,
      input_tokens,
      cached_input_tokens,
      output_tokens,
      updated_at,

      similarity(
        search_text,
        ${normalizedQuery}
      ) AS score

    FROM watches

    WHERE
      search_text % ${normalizedQuery}
      OR search_text ILIKE
        ${"%" + normalizedQuery + "%"}

    ORDER BY
      similarity(
        search_text,
        ${normalizedQuery}
      ) DESC,
      updated_at DESC

    LIMIT 2
  `;


  /*
   * Conservative automatic fuzzy match.
   *
   * We intentionally require exactly one candidate.
   *
   * A query such as:
   *
   * "Rolex Submariner"
   *
   * may correspond to multiple materially different
   * references. If several candidates exist, do NOT
   * silently choose one from cache.
   */

  if (candidateRows.length === 1) {
    const candidate =
      candidateRows[0];

    const score =
      Number(candidate.score || 0);

    /*
     * Same baseline threshold currently used
     * by the Cars cache.
     */

    if (score >= 0.35) {
      return {
        row: candidate,
        matchType: "fuzzy_unique",
        score
      };
    }
  }


  /*
   * No sufficiently safe cache match.
   */

  return null;
}




module.exports = async function handler(req, res) {
  /*
   * METHOD
   */

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return res.status(405).json({
      error: "Method not allowed."
    });
  }


  /*
   * DATABASE CONFIGURATION
   */

  if (!process.env.DATABASE_URL) {
    console.error(
      "WATCH_DATABASE_URL_MISSING"
    );

    return res.status(500).json({
      error:
        "Watch research database is not configured."
    });
  }


  /*
   * INPUT
   */

  let body = req.body;

  /*
   * Depending on runtime/configuration, req.body
   * may occasionally arrive as a JSON string.
   */

  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({
        error: "Invalid request body."
      });
    }
  }

  const query =
    typeof body?.query === "string"
      ? body.query.trim()
      : "";


  if (query.length < 3) {
    return res.status(400).json({
      error:
        "Please enter a specific watch."
    });
  }


  /*
   * DATABASE CLIENT
   */

  const sql = neon(
    process.env.DATABASE_URL
  );


  /*
   * CACHE LOOKUP
   *
   * Research rate limiting happens only AFTER
   * this lookup.
   *
   * Therefore an existing watch can be served
   * immediately without another OpenAI call.
   */

  let cachedMatch = null;

  try {
    cachedMatch =
      await findCachedWatch(
        sql,
        query
      );
  } catch (error) {
    /*
     * Cache lookup failure should not silently
     * create expensive duplicate research.
     *
     * Fail closed rather than treating database
     * failure as a cache miss.
     */

    console.error(
      "WATCH_CACHE_LOOKUP_ERROR",
      {
        query,
        message: error?.message || String(error)
      }
    );

    return res.status(500).json({
      error:
        "Unable to check the watch research cache."
    });
  }


  /*
   * CACHE HIT
   */

  if (cachedMatch?.row) {
    const cachedWatch =
      parseWatchData(
        cachedMatch.row.watch_data
      );

    /*
     * Validate database records before serving
     * them.
     *
     * This protects the application if an older
     * schema version remains in the database.
     */

    if (hasUsableWatchSchema(cachedWatch)) {
      console.log(
        "WATCH_CACHE_HIT",
        JSON.stringify({
          query,
          matchType:
            cachedMatch.matchType,
          score:
            cachedMatch.score,
          cacheKey:
            cachedMatch.row.cache_key,
          displayName:
            cachedMatch.row.display_name,
          updatedAt:
            cachedMatch.row.updated_at
        })
      );

      return res.status(200).json({
        watch: cachedWatch,
        cache: "hit"
      });
    }


    /*
     * A record matched the search but does not
     * satisfy Watch Schema v1.0.
     *
     * Allow fresh research to replace it.
     */

    console.warn(
      "WATCH_CACHE_STALE",
      JSON.stringify({
        query,
        matchType:
          cachedMatch.matchType,
        cacheKey:
          cachedMatch.row.cache_key,
        displayName:
          cachedMatch.row.display_name
      })
    );
  } else {
    console.log(
      "WATCH_CACHE_MISS",
      JSON.stringify({
        query
      })
    );
  }


  /*
   * OPENAI CONFIGURATION
   *
   * Only needed after a genuine cache miss
   * or stale cache record.
   */

  if (!process.env.OPENAI_API_KEY) {
    console.error(
      "WATCH_OPENAI_KEY_MISSING"
    );

    return res.status(500).json({
      error:
        "Watch research service is not configured."
    });
  }


  /*
   * RATE LIMIT
   *
   * Cache hits never reach this point.
   */


let rateLimit;

try {
  rateLimit =
    await consumeWatchResearchRateLimit(
      sql,
      req
    );
} catch (error) {
  console.error(
    "WATCH_RATE_LIMIT_ERROR",
    {
      query,
      message:
        error?.message ||
        String(error)
    }
  );

  return res.status(503).json({
    error:
      "Watch research is temporarily unavailable."
  });
}


if (!rateLimit.allowed) {
  console.warn(
    "WATCH_RESEARCH_RATE_LIMITED",
    JSON.stringify({
      query,

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
        rateLimit.dailyExceeded,

      retryAfterSeconds:
        rateLimit.retryAfterSeconds
    })
  );

  res.setHeader(
    "Retry-After",
    String(
      rateLimit.retryAfterSeconds || 60
    )
  );

  return res.status(429).json({
    error:
      "Research limit reached. Please try again later."
  });
}
  


  
  /*
   * OPENAI RESPONSES API REQUEST
   */

  const requestBody = {
    model: "gpt-5.6-sol",

    reasoning: {
      effort: "medium"
    },

    instructions:
      watchProtocol,

    input:
      `Research and build the Watch Decision Model for: ${query}`,

    tools: [
      {
        type:
          "web_search_preview",
        search_context_size:
          "medium"
      }
    ],

    tool_choice: "auto",

    text: {
      format: {
        type: "json_schema",
        name:
          "watch_decision_model",
        strict: true,
        schema:
          watchSchema
      },

      verbosity: "low"
    }
  };


  /*
   * OPENAI CALL
   */

  let response;

  try {
    response = await fetch(
      OPENAI_URL,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${process.env.OPENAI_API_KEY}`,

          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify(
            requestBody
          )
      }
    );
  } catch (error) {
    console.error(
      "WATCH_OPENAI_FETCH_ERROR",
      {
        query,
        message:
          error?.message ||
          String(error)
      }
    );

    return res.status(502).json({
      error:
        "Unable to reach the watch research service."
    });
  }


  /*
   * PARSE OPENAI RESPONSE
   */

  let data;

  try {
    data = await response.json();
  } catch (error) {
    console.error(
      "WATCH_OPENAI_RESPONSE_PARSE_ERROR",
      {
        query,
        status:
          response.status,
        message:
          error?.message ||
          String(error)
      }
    );

    return res.status(502).json({
      error:
        "Watch research returned an invalid response."
    });
  }


  /*
   * OPENAI API ERROR
   */

  if (!response.ok) {
    console.error(
      "WATCH_OPENAI_API_ERROR",
      JSON.stringify({
        query,
        status:
          response.status,
        error:
          data?.error || data
      })
    );

    return res
      .status(
        response.status >= 400 &&
        response.status < 600
          ? response.status
          : 502
      )
      .json({
        error:
          data?.error?.message ||
          "Watch research failed."
      });
  }


  /*
   * USAGE + COST LOGGING
   *
   * Keep the same planning assumptions currently
   * used by the Cars endpoint so category costs
   * remain directly comparable.
   */

  const usage =
    data?.usage || {};

  const inputTokens =
    Number(
      usage.input_tokens || 0
    );

  const cachedInputTokens =
    Number(
      usage.input_tokens_details
        ?.cached_tokens || 0
    );

  const outputTokens =
    Number(
      usage.output_tokens || 0
    );

  const totalTokens =
    Number(
      usage.total_tokens ||
      (
        inputTokens +
        outputTokens
      )
    );


  /*
   * Count actual web-search tool calls in the
   * Responses API output.
   */

  const webSearchCalls =
    Array.isArray(data?.output)
      ? data.output.filter(
          item =>
            item?.type ===
              "web_search_call" ||
            item?.type ===
              "web_search_preview_call"
        ).length
      : 0;


  /*
   * Cost assumptions currently mirrored from
   * analyze.js.
   *
   * This is an internal planning estimate,
   * not an OpenAI billing statement.
   */

  const inputCost =
    (inputTokens / 1_000_000) *
    4;

  const outputCost =
    (outputTokens / 1_000_000) *
    20;

  const webSearchCost =
    webSearchCalls *
    0.01;

  const estimatedCost =
    inputCost +
    outputCost +
    webSearchCost;


  console.log(
    "WATCH_RESEARCH_USAGE",
    JSON.stringify({
      query,

      model:
        requestBody.model,

      inputTokens,

      cachedInputTokens,

      outputTokens,

      totalTokens,

      webSearchCalls,

      usageRaw:
        usage
    })
  );


  console.log(
    "WATCH_RESEARCH_COST",
    JSON.stringify({
      query,

      model:
        requestBody.model,

      inputCostUsd:
        Number(
          inputCost.toFixed(6)
        ),

      outputCostUsd:
        Number(
          outputCost.toFixed(6)
        ),

      webSearchCostUsd:
        Number(
          webSearchCost.toFixed(6)
        ),

      estimatedCostUsd:
        Number(
          estimatedCost.toFixed(6)
        )
    })
  );


  /*
   * EXTRACT STRUCTURED OUTPUT
   */

  const outputText =
    extractOutputText(data);


  if (!outputText) {
    console.error(
      "WATCH_OUTPUT_MISSING",
      JSON.stringify({
        query,
        responseId:
          data?.id || null
      })
    );

    return res.status(502).json({
      error:
        "Watch research returned no usable output."
    });
  }


  /*
   * PARSE WATCH JSON
   */

  let watch;

  try {
    watch =
      JSON.parse(outputText);
  } catch (error) {
    console.error(
      "WATCH_OUTPUT_JSON_ERROR",
      {
        query,
        message:
          error?.message ||
          String(error)
      }
    );

    return res.status(502).json({
      error:
        "Watch research returned malformed structured data."
    });
  }


  /*
   * VALIDATE WATCH SCHEMA
   */

const watchValidation =
  diagnoseWatchSchema(watch);

if (!watchValidation.valid) {
  console.error(
    "WATCH_SCHEMA_INVALID",
    JSON.stringify({
      query,

      reason:
        watchValidation.reason,

      details:
        watchValidation.details,

      watchId:
        watch?.id || null,

      brand:
        watch?.brand || null,

      model:
        watch?.model || null,

      reference:
        watch?.reference || null
    })
  );

  return res.status(502).json({
    error:
      "Watch research did not satisfy Watch Schema v1.0.",

    validationReason:
      watchValidation.reason
  });
}




  

  /*
   * CANONICAL CACHE IDENTITY
   */

  const canonicalSource =
    buildCanonicalWatchSource(
      watch
    );

  const cacheKey =
    normalizeCacheKey(
      canonicalSource
    );

  const displayName =
    buildWatchDisplayName(
      watch
    );

  const searchText =
    buildWatchSearchText(
      watch,
      query
    );


  if (!cacheKey) {
    console.error(
      "WATCH_CACHE_KEY_EMPTY",
      {
        query,
        canonicalSource
      }
    );

    return res.status(502).json({
      error:
        "Unable to establish a canonical watch identity."
    });
  }


  /*
   * DATABASE UPSERT
   *
   * cache_key is UNIQUE.
   *
   * If the same canonical watch is researched again,
   * replace the stored research with the newest
   * valid Watch Schema v1.0 result.
   */

  try {
    await sql`
      INSERT INTO watches (
        brand,
        model,
        reference,
        year,
        production_period,
        variant,
        movement,
        case_size,

        display_name,
        search_text,
        cache_key,

        watch_data,

        researched_query,
        research_model,
        research_cost_usd,

        input_tokens,
        cached_input_tokens,
        output_tokens,

        updated_at
      )

      VALUES (
        ${watch.brand},
        ${watch.model},
        ${watch.reference},
        ${watch.year},
        ${watch.productionPeriod},
        ${watch.variant},
        ${watch.movement},
        ${watch.caseSize},

        ${displayName},
        ${searchText},
        ${cacheKey},

        ${JSON.stringify(watch)}::jsonb,

        ${query},
        ${requestBody.model},
        ${estimatedCost},

        ${inputTokens},
        ${cachedInputTokens},
        ${outputTokens},

        NOW()
      )

      ON CONFLICT (cache_key)

      DO UPDATE SET
        brand =
          EXCLUDED.brand,

        model =
          EXCLUDED.model,

        reference =
          EXCLUDED.reference,

        year =
          EXCLUDED.year,

        production_period =
          EXCLUDED.production_period,

        variant =
          EXCLUDED.variant,

        movement =
          EXCLUDED.movement,

        case_size =
          EXCLUDED.case_size,

        display_name =
          EXCLUDED.display_name,

        search_text =
          EXCLUDED.search_text,

        watch_data =
          EXCLUDED.watch_data,

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

        updated_at =
          NOW()
    `;
  } catch (error) {
    console.error(
      "WATCH_DATABASE_SAVE_ERROR",
      {
        query,
        cacheKey,
        displayName,
        message:
          error?.message ||
          String(error)
      }
    );

    /*
     * Research succeeded but persistence failed.
     *
     * Do not silently serve the result because doing
     * so would cause the next identical request to
     * incur another expensive research call.
     */

    return res.status(500).json({
      error:
        "Watch research succeeded but could not be saved."
    });
  }


  /*
   * If the cache lookup matched an invalid legacy
   * record under a DIFFERENT cache key, remove that
   * stale record after the valid replacement has
   * been safely written.
   */

  const staleCacheKey =
    cachedMatch?.row?.cache_key;

  if (
    staleCacheKey &&
    staleCacheKey !== cacheKey
  ) {
    try {
      await sql`
        DELETE FROM watches
        WHERE cache_key =
          ${staleCacheKey}
      `;

      console.log(
        "WATCH_STALE_CACHE_REMOVED",
        JSON.stringify({
          oldCacheKey:
            staleCacheKey,
          newCacheKey:
            cacheKey
        })
      );
    } catch (error) {
      /*
       * Non-fatal.
       *
       * The new valid record has already been
       * persisted.
       */

      console.warn(
        "WATCH_STALE_CACHE_DELETE_ERROR",
        {
          oldCacheKey:
            staleCacheKey,
          newCacheKey:
            cacheKey,
          message:
            error?.message ||
            String(error)
        }
      );
    }
  }


  /*
   * SUCCESS
   */

  console.log(
    "WATCH_RESEARCH_COMPLETE",
    JSON.stringify({
      query,
      watchId:
        watch.id,
      displayName,
      cacheKey,
      reference:
        watch.reference,
      evidenceCount:
        watch.evidenceCount,
      integrityLevel:
        watch.productIntegrity.level,
      questionCount:
        watch.questions.length,
      estimatedCostUsd:
        Number(
          estimatedCost.toFixed(6)
        )
    })
  );


  return res.status(200).json({
    watch,
    cache: "miss"
  });
};













