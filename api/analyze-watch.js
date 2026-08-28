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
