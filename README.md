# AI Voice Assistant

A voice chat assistant you talk to in the browser: Azure speech-to-text captures what you say, an Express server gets a reply from OpenAI, and Azure text-to-speech speaks it back. Includes JWT login with MongoDB and a GitHub Actions workflow.

**Stack:** React, Vite, Express, OpenAI API, Azure Speech SDK, MongoDB (Mongoose), JWT

**Run:** `npm install`, set `OPENAI_KEY`, `SPEECH_KEY`, `SPEECH_REGION`, `MONGO_URI`, `JWT_SECRET_KEY` and `SERVER_PORT`, then `npm run serve` (API) and `npm run dev` (frontend).
