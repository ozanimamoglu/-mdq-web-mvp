# MDQ Static MVP v8 — Unknown Vehicle Research

V8 connects an unprepared vehicle search to OpenAI.

## New flow

Prepared vehicle:
Make → Model → Year / Generation → Engine / Version → questions immediately.

Unknown vehicle:
Free-text exact vehicle → `/api/analyze` → OpenAI Responses API + web search →
MDQ Generation Protocol v1.0 → structured Vehicle Decision Model → questions.

## AI architecture

One OpenAI model is enough for this MVP:
- Model: `gpt-5.6-sol`
- Responses API
- Built-in web search
- Structured Outputs using a strict JSON schema
- 10-step MDQ Generation Protocol embedded server-side

No Claude or second AI is required.

## Cache in V8

V8 saves newly researched Vehicle Decision Models in the browser's localStorage.
That means the same vehicle is instant on repeat searches from the same browser.

This is deliberately MVP-level caching.
A later version should move this to a global database so one user's research benefits all users.

## IMPORTANT: Configure the OpenAI API key

The API key must NEVER be placed in app.js or browser code.

In Vercel:
1. Open your project.
2. Settings → Environment Variables.
3. Add:
   Name: `OPENAI_API_KEY`
   Value: your OpenAI API key
4. Apply it to Production (and Preview if desired).
5. Redeploy V8 after saving the variable.

## Deployment

Unlike v7, v8 includes a serverless API route:
- `api/analyze.js`
- `vercel.json`

Upload/deploy the complete unzipped `mdq-static-mvp-v8` folder.

## Research count

The model is explicitly instructed:
- count unique evidence documents used,
- never count individual comments in the same thread as separate reviews,
- do not invent evidence counts.

## Fixed project rules preserved

- MDQ Generation Protocol v1.0 unchanged.
- Web app flow remains minimalist selection → questions → result.
- Result categories remain exactly:
  - Ideal
  - Suitable
  - Not suitable

## v8.1 diagnostic endpoint

After deployment, open `/api/health`.

Expected on a healthy production deployment:
- `openaiKeyPresent: true`
- `vercelEnv: "production"`

The API key value is never returned.

## v8.2 environment diagnostic

Before testing, add this Vercel environment variable:

- Name: `TEST_VAR`
- Value: `hello123`
- Scope: Production

Then deploy a fresh Git commit and open `/api/health`.

The health endpoint reports:
- whether `OPENAI_API_KEY` exists,
- whether `TEST_VAR` exists,
- whether TEST_VAR matches `hello123`,
- only the NAMES of environment variables containing OPENAI or TEST.

It never returns secret values.


Deployment refresh
