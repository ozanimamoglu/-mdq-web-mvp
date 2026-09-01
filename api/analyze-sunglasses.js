const { neon } = require("@neondatabase/serverless");
const crypto = require("crypto");

const OPENAI_URL =
  "https://api.openai.com/v1/responses";

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
 * SUNGLASSES DECISION MODEL — SCHEMA v1.0
 *
 * This schema is deliberately separate from
 * Vehicle Decision Model and Watch Decision Model.
 *
 * Sunglasses have their own canonical product identity,
 * while evidence, fit, product-integrity and market-price
 * concepts retain the same underlying decision philosophy.
 */

const sunglassesSchema = {
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
     * CANONICAL SUNGLASSES IDENTITY
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
          minimum: 1900,
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

    frame: {
      type: "string"
    },

    lens: {
      type: "string"
    },

    size: {
      type: "string"
    },

    market: {
      type: "string"
    },


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
     * Kept separate from ownership-fit evidence.
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
     * SUNGLASSES MDQs
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
    "frame",
    "lens",
    "size",
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


/*
 * SUNGLASSES MDQ GENERATION PROTOCOL v1.0
 */

const sunglassesProtocol = `
You are building an evidence-grounded sunglasses ownership-fit decision model.

The objective is NOT to determine whether a pair of sunglasses is good or bad.
The objective is NOT to recommend the best sunglasses in a category.
The objective is NOT to determine whether the user is a "sunglasses person."

The objective is to determine whether the real wearing and ownership conditions
that make owners love, tolerate, regret, stop wearing, sell or stop recommending
this exact pair of sunglasses apply to this particular user.

The user has already identified a specific pair of sunglasses they are
considering.

Apply this Sunglasses MDQ Generation Protocol exactly and in order.


1. DEFINE THE EXACT SUNGLASSES

Identify the most defensible exact sunglasses product supported by the user's
query.

Resolve, where available:
- brand
- model or collection
- manufacturer model/reference code
- production period
- specific year if explicitly supplied or genuinely necessary
- principal variant
- frame construction or material where identity-relevant
- principal lens configuration
- manufacturer size or defensible standard size description
- relevant market context

The manufacturer reference or model code is especially important where one is
available.

Do not mix materially different references merely because they share the same
model or collection name.

For example, different Ray-Ban Wayfarer references, frame sizes, lens
configurations or materially different generations must not automatically be
treated as interchangeable when those differences affect:
- physical fit
- lens behaviour
- coverage
- weight
- frame geometry
- polarization
- coating behaviour
- ownership experience

If the user supplies an exact reference, preserve it exactly.

Do not invent a specific production year merely to make the product definition
look more precise.

If the user did not specify a year and the reference itself adequately defines
the sunglasses:
year = null

productionPeriod should describe the defensible production period for the
reference or researched product phase.

If ambiguity cannot be avoided, make the chosen product definition explicit.

Do not silently resolve an ambiguous sunglasses query to a materially different
reference simply because that reference has more evidence available.


1A. PRODUCT IDENTITY IS NOT A FIT JUDGEMENT

Technical specifications help identify and understand the sunglasses.

They are not automatically decision conditions.

For example:

54 mm lens width
does not automatically mean:
"too large"

polarized lenses
do not automatically mean:
"better"

acetate construction
does not automatically mean:
"comfortable"

a wrapped frame
does not automatically mean:
"ideal for sport"

dark lenses
do not automatically mean:
"good for every environment"

Translate specifications into fit conditions only when real-world evidence
shows that the resulting wearing characteristic is sufficiently
decision-relevant.


2. ESTABLISH CURRENT MARKET PRICE CONTEXT

Separately from owner evidence and MDQ generation, establish the current
real-world acquisition-price context for the exact sunglasses.

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
specific pair of sunglasses and separately measure the user's reaction to that
price level.


2A. DETERMINE THE RELEVANT ACQUISITION MARKET

Sunglasses pricing may differ materially between:
- manufacturer retail pricing
- authorised retailers
- major optical retailers
- specialist sunglasses retailers
- established online retailers
- discontinued-stock sellers
- current pre-owned examples
- vintage collector-market examples

Determine which market best represents what a buyer can realistically expect
to pay for the exact sunglasses being researched.

The primary marketPrice range should represent a defensible real-world
acquisition range rather than merely repeating MSRP when MSRP is not a realistic
purchase route.

For sunglasses commonly available new at retail, current retail pricing may be
highly relevant.

For discontinued or vintage sunglasses, use the relevant current secondary,
dealer or collector market.

Where retail discounting is normal and materially affects realistic purchase
price, represent a defensible actual acquisition range rather than an isolated
full-list price.

Do not create multiple price ranges merely because multiple channels exist.

Return the single range that most usefully represents current realistic
acquisition context for the researched sunglasses.

Use the same geography as the selected market whenever practical.


2B. BUILD A DEFENSIBLE PRICE RANGE

Research genuinely comparable examples.

Prefer examples matching as closely as practical:
- exact manufacturer reference
- exact model generation
- frame colour where reference does not already resolve it
- lens type or lens colour where materially price-relevant
- polarization where materially price-relevant
- size where materially price-relevant
- normal market condition
- relevant geography

Avoid allowing one unusually cheap or unusually expensive listing to define the
range.

Where identifiable, exclude:
- obvious counterfeit or replica listings
- materially different references
- used examples when researching normal current-new acquisition pricing
- heavily damaged examples
- incomplete listings
- replacement-lens or replacement-frame parts
- rare collector variants not representative of the researched sunglasses
- auction anomalies
- exceptional provenance premiums
- extreme vintage-condition outliers unless that exact condition is what the
  user queried

For vintage sunglasses, recognise that originality, condition, lenses, frame
condition, provenance and accessories may create a wider legitimate price
range.

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
In one concise sentence, explain what comparable sunglasses and acquisition
channel the range represents.

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
whether the sunglasses are cheap, expensive, good value, overpriced or
affordable.

Do not produce a price-fit verdict.

The user's reaction to this price level is handled separately by the
application.


3. GATHER REAL OWNER EVIDENCE

Research real ownership and long-term wearing experience for the exact
sunglasses.

Prefer:
- detailed owner reports
- long-term wearing reports
- sunglasses enthusiast communities
- eyewear forums with identifiable ownership experience
- credible product-owner communities
- credible long-term editorial ownership reports
- technically credible sources where needed to verify product behaviour

Manufacturer information and technical specifications may be used to establish
facts about the sunglasses.

However, manufacturer specifications alone do not establish recurring owner
friction.

Editorial reviews may provide useful supporting evidence, especially for:
- fit
- comfort
- lens behaviour
- coverage
- visibility
- build
- daily usability

But actual ownership evidence should carry greater weight when identifying
recurring ownership conditions.

Do not treat retailer marketing copy as owner evidence.

Do not treat a specification database as owner evidence.

Do not treat one person's complaint repeated or quoted across several websites
as several independent evidence documents.

Count UNIQUE evidence documents, not individual comments inside one discussion.

Do not invent evidence.


3A. EVIDENCE SHOULD MATCH THE EXACT SUNGLASSES

Prefer evidence tied directly to the exact reference, model configuration or
clearly matching product generation.

Evidence from closely related references may be used only when the relevant
component or wearing characteristic is genuinely shared and that relationship
is defensible.

For example, evidence about a specific lens technology may sometimes be
relevant across several frame variants using substantially the same lens.

But do not automatically transfer:
- physical fit
- bridge fit
- temple pressure
- frame width
- lens coverage
- wrap geometry
- weight distribution
- cheek contact
- lens dimensions
- frame flexibility

from a materially different reference.

When broader family evidence is necessary, reduce evidence confidence
appropriately.


4. CLASSIFY EVIDENCE BEFORE MDQ GENERATION

Before converting evidence into wearing conditions or MDQs, distinguish between
two fundamentally different evidence classes.


A. FIT EVIDENCE

Evidence belongs to the Fit channel when the sunglasses are substantially
performing as intended, but an evidenced characteristic, trade-off, behaviour,
limitation or ownership burden may fit some users better than others.

Possible examples include:
- frame running wide or narrow
- pressure at the temples
- bridge fit that works better on some nose shapes than others
- frame slipping during heat, movement or perspiration
- cheek contact on some face shapes
- noticeable weight during long wear
- limited peripheral coverage
- unusually strong wrap
- lens tint that is better suited to bright conditions than mixed light
- polarization interaction with some digital displays
- lens colour affecting contrast perception
- visible reflections from the rear surface
- noticeable optical distortion at particular viewing angles
- coatings that show fingerprints easily
- highly polished frames showing wear visibly
- frame rigidity
- difficult folding or stiff hinges where this is normal product behaviour
- storage bulk
- normal susceptibility to cosmetic scratching
- conspicuous styling only when real owner evidence shows it materially affects
  frequency of use

These examples are NOT instructions to generate these MDQs.

Include them only if the researched evidence supports them and they pass the
decision-impact threshold.


B. PRODUCT INTEGRITY EVIDENCE

Evidence belongs to the Product Integrity channel when it indicates that the
sunglasses may fail to perform an intended or reasonably expected function,
independent of the user's preference, face shape, lifestyle or tolerance.

Possible examples include:
- recurring hinge breakage during normal use
- repeated temple-arm cracking under ordinary wear
- recurring frame cracking at the bridge
- repeated screw loosening that causes loss of structural function
- lenses repeatedly popping out of the frame
- recurring structural deformation that cannot be reasonably adjusted
- coating delamination or peeling that materially impairs vision
- recurring lens-layer separation
- repeated polarization-layer failure where polarization is an intended
  function
- recurring optical defects that materially impair normal vision through the
  lens
- repeated repair or replacement followed by the same structural or optical
  failure

Do NOT convert Product Integrity Evidence into an MDQ.

Never ask the user whether they would tolerate product failure.

Bad:
"Would repeated hinge failures bother you?"

Bad:
"How comfortable are you with lenses separating from the frame?"

These are not user-fit conditions.

Product Integrity Evidence must instead be evaluated separately under the
Product Integrity Risk Protocol.


IMPORTANT:

Negative owner evidence is not automatically Product Integrity Evidence.

Examples that normally remain Fit Evidence:
- visible fingerprints
- expected cosmetic scratches
- frame feeling heavy
- a narrow fit
- a wide fit
- nose pressure
- temple pressure
- lens tint preference
- polarization behaviour with some screens
- reflections
- subjective optical character
- normal adjustment requirements
- normal ageing of cosmetic finishes
- expected vintage wear

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

For sunglasses, decision-relevant evidence may include both:

A. OWNERSHIP / WEARING FRICTIONS

Characteristics that repeatedly create:
- discomfort
- inconvenience
- poor usability
- visual frustration
- restricted use
- cosmetic frustration
- regret
- reduced wearing frequency

for some owners.

AND

B. DISTINCTIVE USAGE CHARACTERISTICS

Characteristics that are not defects or problems but materially determine
whether living with and wearing this exact pair of sunglasses suits a
particular user.

Sunglasses do not need to have a "problem" for a meaningful fit condition to
exist.

A pair may function perfectly while having:
- a specific physical fit
- a specific lens behaviour
- a specific coverage pattern
- a specific tint
- a specific interaction with screens
- a specific wearing presence

that suits some users well and others poorly.

Do not simply collect:
- specifications
- features
- generic pros and cons
- brand prestige
- fashion status
- celebrity association
- historical significance
- reviewer praise


6. FIND THE CONDITION BEHIND EACH FRICTION OR CHARACTERISTIC

For every candidate ownership friction or distinctive usage characteristic ask:

"What condition in the user's face/head fit, wearing habits, visual environment,
daily use, expectations or tolerance determines whether this characteristic
actually matters?"

The MDQ must diagnose that condition.


RULE 1 — CONDITION, NOT PURCHASE ACTION

Questions must diagnose the user's ownership or wearing condition.

Do not ask whether the user has already performed a purchase action.

Trying on the exact sunglasses, checking authenticity, inspecting lens damage,
checking hinge condition or verifying the seller belong in mitigation or a
later purchase-condition layer.

Bad:
"Have you tried these sunglasses on?"

Better:
"Do sunglasses usually need to feel secure without noticeable pressure at the
temples for you to wear them comfortably for several hours?"

Bad:
"Have you inspected the lenses for scratches?"

Better:
"How sensitive are you to visible marks developing on sunglasses during normal
use?"


RULE 1A — DO NOT ASK FOR FACE MEASUREMENTS UNLESS NECESSARY

Do not automatically ask the user for:
- head width
- temple-to-temple measurement
- bridge width
- nose width
- pupillary distance
- facial measurements

merely because sunglasses dimensions appear in the research.

Prefer observable fit conditions and wearing experience.

For example:
- sunglasses often feel too narrow
- sunglasses often slip down
- nose bridges often leave pressure marks
- frames often touch the cheeks
- wide frames tend to feel unstable

If an exact measurement genuinely changes the decision and cannot reasonably be
diagnosed through a consumer-facing condition, it may be used.

But one facial measurement alone does not determine sunglasses fit.

Frame curvature, bridge design, nose geometry, temple shape, frame width,
weight distribution and personal preference may matter as much or more.


7. APPLY THE CONSEQUENCE THRESHOLD

A recurring observation does NOT automatically deserve an MDQ.

Include a condition only if materially different answers could realistically
change whether this exact pair of sunglasses is a good ownership fit for the
user.

Minor conveniences, enthusiast trivia, generic style preferences,
specification differences and low-consequence preferences must not consume an
MDQ slot.

Never pad the list.

5 strong MDQs are better than 8 weak ones.


RULE 2 — ASYMMETRIC VALUE TEST

Do not keep an MDQ merely because the sunglasses have a recurring advantage
that some users value.

Before keeping a benefit-led condition, test both directions:

1. If the user needs or values this characteristic, do the sunglasses create
   meaningful positive fit?

2. If the user does NOT need or value it, does that create any meaningful
   ownership disadvantage or mismatch?

If the second answer is no, the condition normally should not consume one of
the final MDQ slots.

An unused benefit is not a mismatch.

Example:

Polarized lenses may be beneficial for glare reduction.

If the user does not particularly need that benefit and polarization creates no
meaningful downside for their actual use, then:

"How important is polarization to you?"

should normally not become an MDQ.

However, if this exact polarized lens configuration repeatedly interacts poorly
with dashboard displays, phones, cockpit screens or other displays at common
viewing angles, the relevant condition may instead be:

"How often do you need to read digital displays while wearing sunglasses?"

because the trade-off now has two meaningful directions.


8. DISTINGUISH CHARACTERISTIC FROM FRICTION FROM FAILURE

For every negative-looking observation determine which of these it represents:


CHARACTERISTIC

The sunglasses are behaving as intended.

Example:
A highly wrapped frame creates strong side coverage.


FIT FRICTION

The sunglasses are behaving as intended, but that behaviour may conflict with a
particular user's needs.

Example:
The same strong wrap creates visual distortion or cheek contact for some users.


PRODUCT INTEGRITY FAILURE

The sunglasses are not reliably performing an intended function.

Example:
Independent owners report repeated lens delamination that materially obstructs
normal vision.

Do not collapse these categories.

A normal characteristic may become an important fit condition.

It does not become an integrity problem merely because some users dislike it.


9. MERGE OVERLAPPING CONDITIONS

Merge conditions only when they represent one coherent diagnostic construct.

Do not allow physical fit to consume several MDQs merely because owner evidence
separately mentions:
- frame width
- bridge geometry
- temple length
- temple pressure
- cheek contact
- weight

If those observations diagnose one coherent wearability condition, merge them.

However, keep them separate when they create genuinely independent ownership
conditions.

For example:
- frame security during movement
and
- all-day pressure comfort

may remain separate only if the evidence shows they independently affect
ownership fit.


RULE 3 — ONE DIAGNOSTIC CONSTRUCT

Do not bundle unrelated tolerances merely because they appeared together in
owner evidence.

For example:
lens scratches,
temple pressure,
and screen interaction

must not become one question.


10. WRITE THE MDQ

Questions must ask observable reality, realistic usage or concrete tolerance.

Avoid vague self-assessment.

The user should be able to answer without expert eyewear knowledge.

Questions should be understandable to someone buying their first serious pair
of sunglasses.


RULE 4 — NO UNEXPLAINED EYEWEAR JARGON

Never assume the user understands specialist eyewear terminology.

Do not require knowledge of:
- base curve
- pantoscopic tilt
- pupillary distance
- lens index
- VLT
- category 3 lens terminology
- hydrophobic coating terminology
- oleophobic coating terminology
- acetate construction terminology
- temple measurements
- bridge codes
- lens-width notation

If a technical concept is necessary, explain the practical meaning in plain
English.

Bad:
"Do you prefer a high base-curve frame?"

Better:
"Do strongly curved sunglasses usually feel comfortable on your face, or do you
prefer flatter frames?"

Bad:
"Do you need low VLT?"

Better:
"Do you mainly wear sunglasses in very bright sunlight, or do you often move
between bright and moderate light?"


RULE 4A — EVERY MDQ REQUIRES A CONTEXT LINE

Every MDQ must include a short clarification line.

The clarification is mandatory.

Its purpose is to explain, in plain consumer language, why this question matters
for ownership of this exact pair of sunglasses.

The clarification should connect the user's condition to the evidenced product:
- behaviour
- limitation
- characteristic
- trade-off

Keep it concise: normally one sentence.

Do not reveal the answer.
Do not tell the user which option to choose.
Do not exaggerate risk.
Do not merely repeat the question.

Good example:

Question:
"Do sunglasses often feel tight at your temples after an hour or two?"

Clarification:
"Owners with broader head shapes frequently describe this frame as secure but
noticeably firm at the temples."

Good example:

Question:
"How often do you need to read digital displays while wearing sunglasses?"

Clarification:
"Owners report that this polarized lens configuration can make some displays
appear darker or change visibility at certain angles."

Good example:

Question:
"How important is it that sunglasses remain secure when you become warm or
sweaty?"

Clarification:
"Some owners report that this frame can gradually slide down the nose during
active or hot-weather use."

Bad clarification:
"This question is about sunglasses fit."

Bad clarification:
"Choose the option that best describes you."


11. BUILD ANSWER -> DECISION IMPACT MAPPING

Each MDQ must have exactly three answers.

The answers must represent meaningfully different ownership conditions.

For every answer determine its impact on fit:

positive
= clear compatibility with these sunglasses

neutral
= compatible or not meaningfully decision-changing

medium_negative
= meaningful friction but usually manageable

high_negative
= major ownership mismatch

critical_negative
= fundamental mismatch on a condition capable of changing the purchase decision

Impact must be derived from BOTH:

a) the evidenced behaviour of these exact sunglasses
b) the user's condition represented by the answer

Do not infer impact from evidence frequency alone.

Frequency is not severity.
Severity is not user impact.


11A. DEAL-BREAKER CAPABILITY

Set dealBreakerCapable to true only when at least one realistic answer to the
question could create a fundamental ownership mismatch with these exact
sunglasses.

Do not mark a question deal-breaker-capable merely because the topic is
frequently discussed.

A cosmetic preference, minor convenience or enthusiast detail should rarely be
deal-breaker-capable.

Examples that MAY become deal-breaker-capable when strongly supported by
evidence include:
- severe physical fit mismatch
- persistent pressure or discomfort affecting normal wear
- inability to maintain secure fit during the user's actual use
- a major visual-use conflict
- a lens behaviour that materially interferes with essential display reading
- a fundamental conflict between the lens/light behaviour and the user's normal
  environment

Use this conservatively.


12. ASSESS EVIDENCE STRENGTH SEPARATELY

For each MDQ assign:

moderate
strong
very_strong

This represents confidence that the ownership condition genuinely matters for
these exact sunglasses.

Evidence strength must be based on:
- recurrence across independent sources
- consistency of reports
- relevance to the exact reference
- credibility and depth of ownership evidence
- whether the evidence comes from actual owners
- whether closely related variants had to be used

Do not use evidence strength as a substitute for user impact.

Also provide a concise evidenceReason explaining why the evidence strength was
assigned.


13. GENERATE CONDITION-SPECIFIC MITIGATION

For every answer with negative impact, provide an actionable mitigation that
directly addresses that specific mismatch.

Mitigation should reduce uncertainty or reduce the mismatch.

Generic boilerplate is not acceptable.


Examples:

Physical fit mismatch:
"Try the exact frame size for at least 15–20 minutes and check temple pressure,
bridge pressure and cheek contact before deciding."

Sliding / security mismatch:
"Test the exact frame while walking and moving your head, and confirm that
adjustment by an optician provides enough security without creating pressure."

Polarized-display mismatch:
"Check your phone, vehicle dashboard or other important displays through the
exact lenses at normal viewing angles before purchase."

Tint / light-level mismatch:
"Try the exact lens in both bright sun and the lower-light conditions you
commonly encounter before deciding."

Scratch sensitivity:
"Inspect a normally worn example rather than only pristine retail photographs
to decide whether the way the frame and lenses show wear is acceptable."

Lens reflection mismatch:
"Test the lenses with light entering from behind and from the side to see whether
internal reflections are distracting in your normal use."

For positive or neutral answers, mitigation must be an empty string.


14. DIAGNOSTIC DIVERSITY / REDUNDANCY CONTROL

Do not allow one underlying friction family to consume multiple MDQ slots
unless each condition can independently change the purchase decision.

For example:

frame width,
bridge design,
temple shape,
temple pressure,
cheek contact,
and frame weight

must not automatically become six questions.

Determine the minimum number of independent user conditions needed to diagnose
the evidenced wearability issue.

Likewise:

polarization,
screen interaction,
tint darkness,
contrast,
and optical distortion

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
"Supported by several independent owners of this exact reference plus
longer-term wear reports."

Avoid unsupported wording such as:
"Owners consistently report..."

unless the research actually supports that claim.


16. FINAL MDQ SELECTION

Keep only the strongest 5-8 independent MDQs.

Prioritize conditions that can genuinely change:
- purchase recommendation
- likelihood of ownership regret
- frequency of wearing the sunglasses
- physical comfort
- secure fit
- daily usability
- visual usability
- compatibility with the user's real environment
- meaningful maintenance or replacement burden

Do not include a question merely because the topic appeared in sunglasses
reviews.

Do not manufacture enough topics to reach eight.

Five strong independent questions are preferable to eight weak questions.


17. PRODUCT-LEVEL FIT VS CONDITION OF ONE PHYSICAL PAIR

This model evaluates the ownership fit of the sunglasses reference or product
definition.

Do not turn the condition of one individual used pair into an MDQ.

Examples that normally belong to a later sunglasses-condition / authentication /
pre-purchase inspection layer include:
- whether one pair is genuine
- scratches on one pair
- bent temples on one pair
- loose screws on one pair
- replaced lenses
- lens damage
- coating damage on one example
- previous repair
- missing case or accessories
- seller trustworthiness
- provenance

However, if a condition is a recurring product-level ownership characteristic
of the exact reference, it may still qualify as Fit Evidence.

Do not confuse product-level evidence with example-specific purchase risk.



PRODUCT INTEGRITY RISK PROTOCOL

This protocol is separate from MDQ generation.

Its purpose is not to decide whether sunglasses are legally defective and not
to make a legal or regulatory determination.

Its purpose is only to identify meaningful evidence signals that the exact
sunglasses may fail to perform an intended or reasonably expected function.


1. IDENTIFY THE FAILURE MODE

For each candidate integrity issue determine what function is failing.

Examples of functions include:
- frame structural integrity
- bridge structural integrity
- hinge operation
- temple-arm retention
- screw retention
- lens retention
- lens structural integrity
- lens coating integrity where the coating is functionally important
- polarization performance
- optical clarity
- normal secure wear

Distinguish actual functional failure from:
- dissatisfaction
- expected cosmetic wear
- normal adjustment requirements
- subjective preference
- normal ageing


2. DETERMINE FUNCTIONAL IMPORTANCE

Assess whether the affected function is:
- peripheral or minor
- meaningful to normal ownership
- central to the sunglasses' intended use


3. ESTABLISH RECURRENCE

Determine whether substantially the same failure appears across independent
owner evidence.

Do not infer recurrence merely because many comments appear inside one forum
thread, article or discussion.

Do not infer a reference-wide problem solely from failures associated with a
different sunglasses model using a related component.


4. ASSESS SEVERITY

minor:
A real malfunction with limited effect on normal ownership.

meaningful:
A malfunction that materially impairs normal use or requires meaningful repair
because an important function has failed.

major:
A failure that removes a core function, renders the sunglasses substantially
unusable, prevents secure wear, materially impairs normal vision through the
lenses, or requires major replacement because an important function has failed.


5. EXAMINE THE RESOLUTION PATTERN

Consider whether the issue:
- resolves easily
- requires straightforward adjustment
- requires component repair
- requires significant repair
- requires frame or lens replacement
- repeatedly returns after repair
- persists after replacement
- creates repeated warranty claims
- causes owners to return or stop using the sunglasses specifically because
  normal function could not be restored

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
concern strong enough that asking whether the user's wearing conditions fit the
sunglasses would materially understate the purchase risk.

Be conservative.

A few isolated hinge failures must not override fit.

A common annoyance must not override fit.

Expected cosmetic scratching must not override fit.

Normal frame adjustment must not override fit.

Ordinary age-related deterioration in individual vintage sunglasses must not
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
"Recurring hinge fracture during normal folding and wear"

Avoid:
"frame problems"

Prefer:
"Repeated lens separation from the frame during ordinary use"

Avoid:
"lens issues"

Do not use Product Integrity Risk as a substitute for:
- cosmetic ageing
- ordinary scratches
- subjective fit
- expected adjustment
- individual-pair purchase-condition risk



OUTPUT RULES

schemaVersion:
Always return exactly "1.0".


id:
Return a stable lowercase hyphenated identifier based on the canonical
sunglasses identity.

Prefer:
brand + model + exact manufacturer reference

Include size only when it is necessary to distinguish materially different
product identities under the same reference or model.

Example:
"ray-ban-original-wayfarer-rb2140-901-58"

Do not include:
- market
- transient pricing
- current retailer
- research date

in the id.


brand:
Return the sunglasses manufacturer or brand.

Example:
"Ray-Ban"


model:
Return the clearest established model or collection name.

Example:
"Original Wayfarer Classic"


reference:
Return the exact manufacturer reference or model code where one can be
defensibly established.

Preserve meaningful punctuation and formatting.

Example:
"RB2140 901/58"

Example:
"OO9208-4638"

If the user's query does not contain a reference but one exact reference can be
defensibly resolved from the supplied product description, return that
reference.

Do not guess between materially different references merely to avoid ambiguity.

If no defensible reference can be established, return:
"Not specified"

Do not fabricate a reference.


year:
If the user explicitly supplied a specific production year and it is compatible
with the resolved sunglasses, return that four-digit year.

If the user did not specify a year and no exact year is necessary to preserve
the requested identity, return null.

Do not arbitrarily choose the first or latest production year.


productionPeriod:
Return the clearest defensible production period for the researched reference
or product phase.

Examples:
"2021–present"
"approximately 2015–2023"
"current production"

Do not claim false precision for long-running or vintage models.


variant:
Return only the principal variant information needed to distinguish the
researched sunglasses.

Examples:
"Black frame with polarized green lenses"

"Matte black / Prizm Road"

If no additional variant is necessary beyond model and reference, return:
"Standard reference configuration"


frame:
Return a concise factual description of the frame configuration that is
identity- or ownership-relevant.

Examples:
"Black acetate full-rim frame"

"Matte nylon wraparound frame"

"Metal aviator frame with adjustable nose pads"

Do not turn the frame description into a fit judgement such as:
"comfortable"
"large"
"tight"


lens:
Return the principal lens configuration in concise consumer-readable form.

Examples:
"Polarized green lenses"

"Brown gradient non-polarized lenses"

"Prizm Road lenses"

Do not infer optical performance not supported by reliable evidence.


size:
Return the manufacturer size or the most defensible standard size description.

Examples:
"50-22"

"54 mm lens width"

"Standard"

If several materially different sizes exist and the user specified one, preserve
that size.

If the query does not specify a size and the exact reference does not resolve
one, do not arbitrarily invent a precise size.

Use:
"Not specified"

when necessary.






market:
Return the primary geography used for current acquisition-price research.

Examples:
"United Kingdom"
"Germany"
"United States"


productImage:

Return one representative product image for the exact sunglasses being
researched when a reliable image can be established.

The image is descriptive product metadata.
It is not Fit Evidence and must not influence MDQ generation.

Prefer image sources in this order:
1. official manufacturer product page
2. official brand archive
3. established authorised retailer
4. established specialist eyewear retailer

The image must represent the same model or reference being researched.

Do not use:
- a generic image of the brand
- a different reference merely because it looks similar
- prescription glasses
- unrelated eyewear
- lifestyle photographs where the sunglasses cannot be clearly identified
- social-media reposts when a primary product source exists
- counterfeit or replica listings
- generated images

productImage.url:
Return a direct HTTPS image URL that can be displayed in a normal HTML <img>
element.

Do not return a product webpage URL in this field.

productImage.sourceUrl:
Return the webpage URL from which the exact image/product identity was
established.

productImage.alt:
Return a short factual description suitable for image alt text.

Example:
"Ray-Ban Original Wayfarer Classic RB2140 901/58"

If a sufficiently reliable exact-product image cannot be established, return:

productImage = null

Never invent or guess an image URL.



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
One concise sentence describing the comparable sunglasses and acquisition
channel represented.

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
Return exactly:
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
for ownership of these exact sunglasses.

Connect the user's condition to the evidenced product:
- behaviour
- limitation
- characteristic
- trade-off

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
with these exact sunglasses.


mitigation:
For a negative answer, provide a specific action that could reduce the mismatch
or uncertainty.

For positive and neutral answers return exactly:
""


FINAL OUTPUT BEHAVIOUR

Result calculation is handled separately.

Do not produce a final sunglasses verdict.

Do not recommend alternative sunglasses unless necessary inside a specific
mitigation.

Do not rank the sunglasses.

Do not assign numeric scores.

Do not describe the user as a particular personality type.

Do not generate generic sunglasses-buying advice.

Build only the evidence-grounded Sunglasses Decision Model required by the
schema.

Write concise, neutral, consumer-facing English suitable for a minimalist web
app.
`;



/*
 * RESPONSES API OUTPUT EXTRACTION
 */

function extractOutputText(data) {
  if (
    typeof data?.output_text === "string" &&
    data.output_text.trim()
  ) {
    return data.output_text;
  }

  const chunks = [];

  for (const item of data?.output || []) {
    if (item?.type !== "message") {
      continue;
    }

    for (const content of item.content || []) {
      if (
        content?.type === "output_text" &&
        content.text
      ) {
        chunks.push(content.text);
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


function isUsableIdentityValue(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return false;
  }

  const normalized =
    String(value)
      .trim()
      .toLowerCase();

  return (
    normalized !== "" &&
    normalized !== "not specified" &&
    normalized !== "unknown"
  );
}


/*
 * SUNGLASSES CANONICAL IDENTITY
 *
 * Reference number is normally the strongest
 * identity signal.
 *
 * Size is included because materially different
 * frame sizes can produce genuinely different
 * ownership-fit behaviour.
 *
 * Market is deliberately NOT part of canonical
 * product identity.
 */

function buildCanonicalSunglassesSource(
  sunglasses
) {
  return [
    sunglasses.brand,
    sunglasses.model,
    sunglasses.reference,
    sunglasses.variant,
    sunglasses.size
  ]
    .filter(isUsableIdentityValue)
    .join(" ");
}


/*
 * HUMAN-READABLE CACHE / RESULT NAME
 *
 * Example:
 * Ray-Ban Original Wayfarer Classic RB2140 901/58
 */

function buildSunglassesDisplayName(
  sunglasses
) {
  const base = [
    sunglasses.brand,
    sunglasses.model,

    isUsableIdentityValue(
      sunglasses.reference
    )
      ? sunglasses.reference
      : null
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return sunglasses.year
    ? `${base} — ${sunglasses.year}`
    : base;
}


/*
 * SEARCH TEXT
 *
 * Deliberately broader than canonical cache_key.
 */

function buildSunglassesSearchText(
  sunglasses,
  originalQuery
) {
  return [
    sunglasses.brand,
    sunglasses.model,
    sunglasses.reference,
    sunglasses.year,
    sunglasses.productionPeriod,
    sunglasses.variant,
    sunglasses.frame,
    sunglasses.lens,
    sunglasses.size,
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

function parseSunglassesData(value) {
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

function hasUsableSunglassesMarketPrice(
  sunglasses
) {
  const price =
    sunglasses?.marketPrice;

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
    !Number.isInteger(price.low) ||
    !Number.isInteger(price.high)
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
 * SUNGLASSES SCHEMA v1.0 VALIDATION
 *
 * Validates freshly generated structured output
 * and protects against stale / legacy DB records.
 */

function hasUsableSunglassesSchema(
  sunglasses
) {
  if (
    !sunglasses ||
    typeof sunglasses !== "object" ||
    Array.isArray(sunglasses)
  ) {
    return false;
  }

/*
 * PRODUCT IMAGE
 *
 * Field itself is mandatory in Schema v1.0,
 * but null is allowed when a reliable exact-product
 * image could not be established.
 */

if (
  !Object.prototype.hasOwnProperty.call(
    sunglasses,
    "productImage"
  )
) {
  return false;
}


if (
  sunglasses.productImage !== null
) {
  const image =
    sunglasses.productImage;

  if (
    !image ||
    typeof image !== "object" ||
    Array.isArray(image)
  ) {
    return false;
  }


  if (
    !isNonEmptyString(
      image.url
    ) ||
    !/^https:\/\//i.test(
      image.url.trim()
    )
  ) {
    return false;
  }


  if (
    !isNonEmptyString(
      image.sourceUrl
    ) ||
    !/^https:\/\//i.test(
      image.sourceUrl.trim()
    )
  ) {
    return false;
  }


  if (
    !isNonEmptyString(
      image.alt
    )
  ) {
    return false;
  }
}

  
  const isNonEmptyString =
    value =>
      typeof value === "string" &&
      value.trim().length > 0;

  const validEvidenceStrengths =
    new Set([
      "moderate",
      "strong",
      "very_strong"
    ]);

  const validImpacts =
    new Set([
      "positive",
      "neutral",
      "medium_negative",
      "high_negative",
      "critical_negative"
    ]);

  const validIntegrityLevels =
    new Set([
      "no_meaningful_signal",
      "integrity_concern",
      "serious_integrity_concern"
    ]);

  const validIntegritySeverities =
    new Set([
      "minor",
      "meaningful",
      "major"
    ]);

  const validIntegrityRecurrence =
    new Set([
      "limited",
      "recurring",
      "strongly_recurring"
    ]);


  /*
   * SCHEMA VERSION
   */

  if (
    sunglasses.schemaVersion !== "1.0"
  ) {
    return false;
  }


  /*
   * TOP-LEVEL IDENTITY
   */

  if (
    !isNonEmptyString(
      sunglasses.id
    )
  ) {
    return false;
  }

  if (
    !isNonEmptyString(
      sunglasses.brand
    )
  ) {
    return false;
  }

  if (
    !isNonEmptyString(
      sunglasses.model
    )
  ) {
    return false;
  }

  if (
    !isNonEmptyString(
      sunglasses.reference
    )
  ) {
    return false;
  }


  /*
   * YEAR MAY LEGITIMATELY BE NULL
   */

  if (
    sunglasses.year !== null &&
    (
      !Number.isInteger(
        sunglasses.year
      ) ||
      sunglasses.year < 1900 ||
      sunglasses.year > 2100
    )
  ) {
    return false;
  }


  if (
    !isNonEmptyString(
      sunglasses.productionPeriod
    )
  ) {
    return false;
  }

  if (
    !isNonEmptyString(
      sunglasses.variant
    )
  ) {
    return false;
  }

  if (
    !isNonEmptyString(
      sunglasses.frame
    )
  ) {
    return false;
  }

  if (
    !isNonEmptyString(
      sunglasses.lens
    )
  ) {
    return false;
  }

  if (
    !isNonEmptyString(
      sunglasses.size
    )
  ) {
    return false;
  }

  if (
    !isNonEmptyString(
      sunglasses.market
    )
  ) {
    return false;
  }


  /*
   * MARKET PRICE
   */

  if (
    !hasUsableSunglassesMarketPrice(
      sunglasses
    )
  ) {
    return false;
  }


  /*
   * EVIDENCE BASE
   */

  if (
    !Number.isInteger(
      sunglasses.evidenceCount
    ) ||
    sunglasses.evidenceCount < 1
  ) {
    return false;
  }

  if (
    sunglasses.evidenceUnit !==
    "unique evidence documents"
  ) {
    return false;
  }

  if (
    !isNonEmptyString(
      sunglasses.evidenceLastUpdated
    )
  ) {
    return false;
  }

  if (
    !Array.isArray(
      sunglasses.evidenceSources
    ) ||
    sunglasses.evidenceSources.length < 1 ||
    sunglasses.evidenceSources.some(
      source =>
        !isNonEmptyString(source)
    )
  ) {
    return false;
  }

  if (
    !isNonEmptyString(
      sunglasses.evidenceMethod
    )
  ) {
    return false;
  }


  /*
   * PRODUCT INTEGRITY
   */

  const integrity =
    sunglasses.productIntegrity;

  if (
    !integrity ||
    typeof integrity !== "object" ||
    Array.isArray(integrity)
  ) {
    return false;
  }

  if (
    !validIntegrityLevels.has(
      integrity.level
    )
  ) {
    return false;
  }

  if (
    !isNonEmptyString(
      integrity.summary
    )
  ) {
    return false;
  }

  if (
    typeof integrity.overrideFit !==
    "boolean"
  ) {
    return false;
  }

  if (
    !isNonEmptyString(
      integrity.evidenceReason
    )
  ) {
    return false;
  }

  if (
    !Array.isArray(
      integrity.issues
    )
  ) {
    return false;
  }


  /*
   * NO-MEANINGFUL-SIGNAL CONSISTENCY
   */

  if (
    integrity.level ===
      "no_meaningful_signal" &&
    (
      integrity.overrideFit !== false ||
      integrity.issues.length !== 0
    )
  ) {
    return false;
  }


  /*
   * ONLY SERIOUS CONCERN MAY OVERRIDE FIT
   */

  if (
    integrity.overrideFit === true &&
    integrity.level !==
      "serious_integrity_concern"
  ) {
    return false;
  }


  /*
   * VALIDATE INTEGRITY ISSUES
   */

  for (
    const issue of integrity.issues
  ) {
    if (
      !issue ||
      typeof issue !== "object" ||
      Array.isArray(issue)
    ) {
      return false;
    }

    if (
      !isNonEmptyString(
        issue.id
      )
    ) {
      return false;
    }

    if (
      !isNonEmptyString(
        issue.functionAffected
      )
    ) {
      return false;
    }

    if (
      !isNonEmptyString(
        issue.failureMode
      )
    ) {
      return false;
    }

    if (
      !validIntegritySeverities.has(
        issue.severity
      )
    ) {
      return false;
    }

    if (
      !validIntegrityRecurrence.has(
        issue.recurrence
      )
    ) {
      return false;
    }

    if (
      !isNonEmptyString(
        issue.resolutionPattern
      )
    ) {
      return false;
    }

    if (
      !validEvidenceStrengths.has(
        issue.evidenceStrength
      )
    ) {
      return false;
    }

    if (
      !isNonEmptyString(
        issue.evidenceReason
      )
    ) {
      return false;
    }
  }


  /*
   * QUESTIONS
   */

  if (
    !Array.isArray(
      sunglasses.questions
    ) ||
    sunglasses.questions.length < 5 ||
    sunglasses.questions.length > 8
  ) {
    return false;
  }

  const questionIds =
    new Set();


  for (
    const question of
      sunglasses.questions
  ) {
    if (
      !question ||
      typeof question !== "object" ||
      Array.isArray(question)
    ) {
      return false;
    }

    if (
      !isNonEmptyString(
        question.id
      )
    ) {
      return false;
    }


    /*
     * DUPLICATE QUESTION IDs
     */

    if (
      questionIds.has(
        question.id
      )
    ) {
      return false;
    }

    questionIds.add(
      question.id
    );


    if (
      !isNonEmptyString(
        question.condition
      )
    ) {
      return false;
    }

    if (
      !validEvidenceStrengths.has(
        question.evidenceStrength
      )
    ) {
      return false;
    }

    if (
      !isNonEmptyString(
        question.evidenceReason
      )
    ) {
      return false;
    }

    if (
      typeof question.dealBreakerCapable !==
      "boolean"
    ) {
      return false;
    }

    if (
      !isNonEmptyString(
        question.text
      )
    ) {
      return false;
    }

    if (
      !isNonEmptyString(
        question.clarification
      )
    ) {
      return false;
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
      return false;
    }


    for (
      const answer of question.answers
    ) {
      if (
        !answer ||
        typeof answer !== "object" ||
        Array.isArray(answer)
      ) {
        return false;
      }

      if (
        !isNonEmptyString(
          answer.label
        )
      ) {
        return false;
      }

      if (
        !validImpacts.has(
          answer.impact
        )
      ) {
        return false;
      }

      if (
        !isNonEmptyString(
          answer.impactReason
        )
      ) {
        return false;
      }

      if (
        typeof answer.mitigation !==
        "string"
      ) {
        return false;
      }


      /*
       * POSITIVE / NEUTRAL:
       * NO MITIGATION
       */

      if (
        (
          answer.impact ===
            "positive" ||
          answer.impact ===
            "neutral"
        ) &&
        answer.mitigation.trim() !== ""
      ) {
        return false;
      }


      /*
       * NEGATIVE:
       * MITIGATION REQUIRED
       */

      if (
        (
          answer.impact ===
            "medium_negative" ||
          answer.impact ===
            "high_negative" ||
          answer.impact ===
            "critical_negative"
        ) &&
        !answer.mitigation.trim()
      ) {
        return false;
      }
    }
  }


  /*
   * CANONICAL ID SANITY CHECK
   */

  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
      sunglasses.id
    )
  ) {
    return false;
  }


  return true;
}


/*
 * RATE-LIMIT IDENTIFIER
 *
 * Hash the client IP before storing it.
 *
 * Sunglasses research uses its own namespace
 * while sharing the same research_rate_limits table.
 */

function getClientIp(req) {
  const forwarded =
    req.headers["x-forwarded-for"];

  if (
    Array.isArray(forwarded)
  ) {
    const first =
      forwarded[0];

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

  const socketIp =
    req.socket?.remoteAddress;

  if (
    typeof socketIp === "string" &&
    socketIp.trim()
  ) {
    return socketIp.trim();
  }

  return "unknown";
}


function buildSunglassesRateLimitIdentifier(
  req
) {
  const ip =
    getClientIp(req);

  return crypto
    .createHash("sha256")
    .update(
      `sunglasses-research:${ip}`
    )
    .digest("hex");
}


/*
 * CONSUME SUNGLASSES RESEARCH RATE LIMIT
 *
 * Call ONLY after a cache miss.
 */

async function consumeSunglassesResearchRateLimit(
  sql,
  req
) {
  const identifier =
    buildSunglassesRateLimitIdentifier(
      req
    );

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

  const row =
    rows[0];

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
          (
            resetAt -
            Date.now()
          ) / 1000
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
          (
            resetAt -
            Date.now()
          ) / 1000
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
 * SUNGLASSES CACHE LOOKUP
 *
 * PASS 1A:
 * Exact canonical cache_key match.
 *
 * PASS 1B:
 * Exact normalized original researched_query.
 *
 * PASS 2:
 * Trigram / text candidate lookup.
 */

async function findCachedSunglasses(
  sql,
  query
) {
  const normalizedQuery =
    normalizeDbQuery(query);

  const queryCacheKey =
    normalizeCacheKey(query);


  /*
   * PASS 1A — EXACT CACHE KEY
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
      frame,
      lens,
      size,
      display_name,
      search_text,
      cache_key,
      sunglasses_data,
      researched_query,
      research_model,
      research_cost_usd,
      input_tokens,
      cached_input_tokens,
      output_tokens,
      updated_at
    FROM sunglasses
    WHERE cache_key =
      ${queryCacheKey}
    ORDER BY updated_at DESC
    LIMIT 2
  `;

  if (
    exactKeyRows.length === 1
  ) {
    return {
      row:
        exactKeyRows[0],

      matchType:
        "exact_cache_key",

      score: 1
    };
  }


  /*
   * PASS 1B — EXACT ORIGINAL QUERY
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
      frame,
      lens,
      size,
      display_name,
      search_text,
      cache_key,
      sunglasses_data,
      researched_query,
      research_model,
      research_cost_usd,
      input_tokens,
      cached_input_tokens,
      output_tokens,
      updated_at
    FROM sunglasses
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

  if (
    exactQueryRows.length === 1
  ) {
    return {
      row:
        exactQueryRows[0],

      matchType:
        "exact_researched_query",

      score: 1
    };
  }


  /*
   * PASS 2 — TRIGRAM / TEXT CANDIDATE SEARCH
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
      frame,
      lens,
      size,
      display_name,
      search_text,
      cache_key,
      sunglasses_data,
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

    FROM sunglasses

    WHERE
      search_text %
        ${normalizedQuery}

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
   * CONSERVATIVE FUZZY ACCEPTANCE
   *
   * Exactly one candidate must exist.
   */

  if (
    candidateRows.length === 1
  ) {
    const candidate =
      candidateRows[0];

    const score =
      Number(
        candidate.score || 0
      );

    if (
      score >= 0.35
    ) {
      return {
        row:
          candidate,

        matchType:
          "fuzzy_unique",

        score
      };
    }
  }


  return null;
}


/*
 * API HANDLER
 */

module.exports =
async function handler(
  req,
  res
) {

  /*
   * METHOD
   */

  if (
    req.method !== "POST"
  ) {
    res.setHeader(
      "Allow",
      "POST"
    );

    return res
      .status(405)
      .json({
        error:
          "Method not allowed."
      });
  }


  /*
   * DATABASE CONFIGURATION
   */

  if (
    !process.env.DATABASE_URL
  ) {
    console.error(
      "SUNGLASSES_DATABASE_URL_MISSING"
    );

    return res
      .status(500)
      .json({
        error:
          "Sunglasses research database is not configured."
      });
  }


  /*
   * INPUT
   */

  let body =
    req.body;

  if (
    typeof body === "string"
  ) {
    try {
      body =
        JSON.parse(body);
    } catch {
      return res
        .status(400)
        .json({
          error:
            "Invalid request body."
        });
    }
  }

  const query =
    typeof body?.query === "string"
      ? body.query.trim()
      : "";


  if (
    query.length < 3
  ) {
    return res
      .status(400)
      .json({
        error:
          "Please enter a specific pair of sunglasses."
      });
  }


  /*
   * DATABASE CLIENT
   */

  const sql =
    neon(
      process.env.DATABASE_URL
    );


  /*
   * CACHE LOOKUP
   *
   * Research rate limiting occurs only AFTER
   * this lookup.
   */

  let cachedMatch =
    null;

  try {
    cachedMatch =
      await findCachedSunglasses(
        sql,
        query
      );
  } catch (error) {
    console.error(
      "SUNGLASSES_CACHE_LOOKUP_ERROR",
      {
        query,
        message:
          error?.message ||
          String(error)
      }
    );

    return res
      .status(500)
      .json({
        error:
          "Unable to check the sunglasses research cache."
      });
  }


  /*
   * CACHE HIT
   */

  if (
    cachedMatch?.row
  ) {
    const cachedSunglasses =
      parseSunglassesData(
        cachedMatch.row
          .sunglasses_data
      );

    if (
      hasUsableSunglassesSchema(
        cachedSunglasses
      )
    ) {
      console.log(
        "SUNGLASSES_CACHE_HIT",
        JSON.stringify({
          query,

          matchType:
            cachedMatch.matchType,

          score:
            cachedMatch.score,

          cacheKey:
            cachedMatch.row
              .cache_key,

          displayName:
            cachedMatch.row
              .display_name,

          updatedAt:
            cachedMatch.row
              .updated_at
        })
      );

      return res
        .status(200)
        .json({
          sunglasses:
            cachedSunglasses,

          cache:
            "hit"
        });
    }


    /*
     * MATCHED BUT STALE / INVALID
     */

    console.warn(
      "SUNGLASSES_CACHE_STALE",
      JSON.stringify({
        query,

        matchType:
          cachedMatch.matchType,

        cacheKey:
          cachedMatch.row
            .cache_key,

        displayName:
          cachedMatch.row
            .display_name
      })
    );
  } else {
    console.log(
      "SUNGLASSES_CACHE_MISS",
      JSON.stringify({
        query
      })
    );
  }


  /*
   * OPENAI CONFIGURATION
   */

  if (
    !process.env.OPENAI_API_KEY
  ) {
    console.error(
      "SUNGLASSES_OPENAI_KEY_MISSING"
    );

    return res
      .status(500)
      .json({
        error:
          "Sunglasses research service is not configured."
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
      await consumeSunglassesResearchRateLimit(
        sql,
        req
      );
  } catch (error) {
    console.error(
      "SUNGLASSES_RATE_LIMIT_ERROR",
      {
        query,

        message:
          error?.message ||
          String(error)
      }
    );

    return res
      .status(503)
      .json({
        error:
          "Sunglasses research is temporarily unavailable."
      });
  }


  if (
    !rateLimit.allowed
  ) {
    console.warn(
      "SUNGLASSES_RESEARCH_RATE_LIMITED",
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
        rateLimit.retryAfterSeconds ||
        60
      )
    );

    return res
      .status(429)
      .json({
        error:
          "Research limit reached. Please try again later."
      });
  }


  /*
   * OPENAI RESPONSES API REQUEST
   */

  const requestBody = {
    model:
      "gpt-5.6-sol",

    reasoning: {
      effort:
        "medium"
    },

    instructions:
      sunglassesProtocol,

    input:
      `Research and build the Sunglasses Decision Model for: ${query}`,

    tools: [
      {
        type:
          "web_search_preview",

        search_context_size:
          "medium"
      }
    ],

    tool_choice:
      "auto",

    text: {
      format: {
        type:
          "json_schema",

        name:
          "sunglasses_decision_model",

        strict:
          true,

        schema:
          sunglassesSchema
      },

      verbosity:
        "low"
    }
  };


  /*
   * OPENAI CALL
   */

  let response;

  try {
    response =
      await fetch(
        OPENAI_URL,
        {
          method:
            "POST",

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
      "SUNGLASSES_OPENAI_FETCH_ERROR",
      {
        query,

        message:
          error?.message ||
          String(error)
      }
    );

    return res
      .status(502)
      .json({
        error:
          "Unable to reach the sunglasses research service."
      });
  }


  /*
   * PARSE OPENAI RESPONSE
   */

  let data;

  try {
    data =
      await response.json();
  } catch (error) {
    console.error(
      "SUNGLASSES_OPENAI_RESPONSE_PARSE_ERROR",
      {
        query,

        status:
          response.status,

        message:
          error?.message ||
          String(error)
      }
    );

    return res
      .status(502)
      .json({
        error:
          "Sunglasses research returned an invalid response."
      });
  }


  /*
   * OPENAI API ERROR
   */

  if (
    !response.ok
  ) {
    console.error(
      "SUNGLASSES_OPENAI_API_ERROR",
      JSON.stringify({
        query,

        status:
          response.status,

        error:
          data?.error ||
          data
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
          "Sunglasses research failed."
      });
  }


  /*
   * USAGE + COST LOGGING
   */

  const usage =
    data?.usage || {};

  const inputTokens =
    Number(
      usage.input_tokens || 0
    );

  const cachedInputTokens =
    Number(
      usage
        .input_tokens_details
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
   * COUNT WEB SEARCH CALLS
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
   * INTERNAL COST ESTIMATE
   *
   * Mirrored from the existing planning
   * assumptions used by the other research
   * endpoints.
   */

  const inputCost =
    (
      inputTokens /
      1_000_000
    ) * 4;

  const outputCost =
    (
      outputTokens /
      1_000_000
    ) * 20;

  const webSearchCost =
    webSearchCalls *
    0.01;

  const estimatedCost =
    inputCost +
    outputCost +
    webSearchCost;


  console.log(
    "SUNGLASSES_RESEARCH_USAGE",
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
    "SUNGLASSES_RESEARCH_COST",
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


  if (
    !outputText
  ) {
    console.error(
      "SUNGLASSES_OUTPUT_MISSING",
      JSON.stringify({
        query,

        responseId:
          data?.id || null
      })
    );

    return res
      .status(502)
      .json({
        error:
          "Sunglasses research returned no usable output."
      });
  }


  /*
   * PARSE SUNGLASSES JSON
   */

  let sunglasses;

  try {
    sunglasses =
      JSON.parse(
        outputText
      );
  } catch (error) {
    console.error(
      "SUNGLASSES_OUTPUT_JSON_ERROR",
      {
        query,

        message:
          error?.message ||
          String(error)
      }
    );

    return res
      .status(502)
      .json({
        error:
          "Sunglasses research returned malformed structured data."
      });
  }


  /*
   * VALIDATE SUNGLASSES SCHEMA
   */

  if (
    !hasUsableSunglassesSchema(
      sunglasses
    )
  ) {
    console.error(
      "SUNGLASSES_SCHEMA_INVALID",
      JSON.stringify({
        query,

        sunglassesId:
          sunglasses?.id ||
          null,

        brand:
          sunglasses?.brand ||
          null,

        model:
          sunglasses?.model ||
          null,

        reference:
          sunglasses?.reference ||
          null
      })
    );

    return res
      .status(502)
      .json({
        error:
          "Sunglasses research did not satisfy Sunglasses Schema v1.0."
      });
  }


  /*
   * CANONICAL CACHE IDENTITY
   */

  const canonicalSource =
    buildCanonicalSunglassesSource(
      sunglasses
    );

  const cacheKey =
    normalizeCacheKey(
      canonicalSource
    );

  const displayName =
    buildSunglassesDisplayName(
      sunglasses
    );

  const searchText =
    buildSunglassesSearchText(
      sunglasses,
      query
    );


  if (
    !cacheKey
  ) {
    console.error(
      "SUNGLASSES_CACHE_KEY_EMPTY",
      {
        query,
        canonicalSource
      }
    );

    return res
      .status(502)
      .json({
        error:
          "Unable to establish a canonical sunglasses identity."
      });
  }


  /*
   * DATABASE UPSERT
   *
   * IMPORTANT:
   * Database table must contain:
   *
   * brand
   * model
   * reference
   * year
   * production_period
   * variant
   * frame
   * lens
   * size
   * display_name
   * search_text
   * cache_key
   * sunglasses_data
   * researched_query
   * research_model
   * research_cost_usd
   * input_tokens
   * cached_input_tokens
   * output_tokens
   * updated_at
   */

  try {
    await sql`
      INSERT INTO sunglasses (
        brand,
        model,
        reference,
        year,
        production_period,
        variant,
        frame,
        lens,
        size,

        display_name,
        search_text,
        cache_key,

        sunglasses_data,

        researched_query,
        research_model,
        research_cost_usd,

        input_tokens,
        cached_input_tokens,
        output_tokens,

        updated_at
      )

      VALUES (
        ${sunglasses.brand},
        ${sunglasses.model},
        ${sunglasses.reference},
        ${sunglasses.year},
        ${sunglasses.productionPeriod},
        ${sunglasses.variant},
        ${sunglasses.frame},
        ${sunglasses.lens},
        ${sunglasses.size},

        ${displayName},
        ${searchText},
        ${cacheKey},

        ${JSON.stringify(sunglasses)}::jsonb,

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

        frame =
          EXCLUDED.frame,

        lens =
          EXCLUDED.lens,

        size =
          EXCLUDED.size,

        display_name =
          EXCLUDED.display_name,

        search_text =
          EXCLUDED.search_text,

        sunglasses_data =
          EXCLUDED.sunglasses_data,

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
      "SUNGLASSES_DATABASE_SAVE_ERROR",
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
     * Do not silently serve the result because
     * the next identical request could create
     * another expensive research call.
     */

    return res
      .status(500)
      .json({
        error:
          "Sunglasses research succeeded but could not be saved."
      });
  }


  /*
   * REMOVE STALE LEGACY CACHE RECORD
   *
   * Only when the previous invalid match used
   * a different cache key.
   */

  const staleCacheKey =
    cachedMatch?.row
      ?.cache_key;

  if (
    staleCacheKey &&
    staleCacheKey !== cacheKey
  ) {
    try {
      await sql`
        DELETE FROM sunglasses
        WHERE cache_key =
          ${staleCacheKey}
      `;

      console.log(
        "SUNGLASSES_STALE_CACHE_REMOVED",
        JSON.stringify({
          oldCacheKey:
            staleCacheKey,

          newCacheKey:
            cacheKey
        })
      );
    } catch (error) {
      /*
       * NON-FATAL:
       * New valid record already exists.
       */

      console.warn(
        "SUNGLASSES_STALE_CACHE_DELETE_ERROR",
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
    "SUNGLASSES_RESEARCH_COMPLETE",
    JSON.stringify({
      query,

      sunglassesId:
        sunglasses.id,

      displayName,

      cacheKey,

      reference:
        sunglasses.reference,

      evidenceCount:
        sunglasses.evidenceCount,

      integrityLevel:
        sunglasses
          .productIntegrity
          .level,

      questionCount:
        sunglasses
          .questions
          .length,

      estimatedCostUsd:
        Number(
          estimatedCost.toFixed(6)
        )
    })
  );


  return res
    .status(200)
    .json({
      sunglasses,
      cache:
        "miss"
    });
};
