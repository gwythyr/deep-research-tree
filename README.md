# Tree Chat

A conversational AI interface with a tree-based structure for exploring topics. Each response can branch into multiple follow-up conversations, allowing you to explore ideas in a non-linear way.

## Live Demo

👉 [**Try it live on GitHub Pages**](https://gwythyr.github.io/deep-research-tree/)

## Features

- 🌳 Tree-based conversation structure
- 🎙️ Voice input support
- ⌨️ Text input support
- 🤖 Powered by Google Gemini AI
- 🔐 Google authentication via Supabase
- 💾 Conversation persistence

## Getting Started

```bash
npm install
npm run dev
```

## Environment Variables

Create a `.env` file with:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Users provide their own Gemini API key through the app interface.
