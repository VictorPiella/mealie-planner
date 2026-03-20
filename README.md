<div align="center">

# 🍽 Mealie Planner

**A drag-and-drop weekly meal planner that syncs directly with your [Mealie](https://mealie.io) instance**

[![Live Demo](https://img.shields.io/badge/🚀_Live-Demo-4CAF50?style=for-the-badge)](https://victorpiella.github.io/mealie-planner/)
[![Buy Me a Coffee](https://img.shields.io/badge/☕-Buy_me_a_coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/victorpiella)

![Mealie Planner screenshot](docs/screenshot.png)

</div>

---

## ✨ Features

| | |
|---|---|
| 🖱 **Drag & drop** | Drag any recipe from the side panel into a lunch or dinner slot |
| ⚡ **Fast loading** | Fetches all your recipes (13 000+) in parallel — no waiting |
| 📅 **Send to Mealie** | One click syncs the week straight into Mealie's meal planner |
| 🔁 **3-month repeat** | Plan one week, push the same plan to all 13 upcoming weeks |
| 🔄 **Overwrite safe** | Clears existing Mealie entries for the week before saving |
| 🖨 **Print-ready** | Landscape print layout — stick it on the fridge |
| 🌙 **Dark / light mode** | Follows your OS preference, toggle anytime |
| 💾 **Offline persistence** | Plan saved to localStorage, survives page reloads |

---

## 🚀 Live Demo

**[victorpiella.github.io/mealie-planner](https://victorpiella.github.io/mealie-planner/)**

> The demo uses built-in sample recipes — no Mealie account needed.
> Self-host to connect your own recipe library.

---

## 🛠 Self-Hosting

### Prerequisites

- **Node 20+** (tested on Node 22.5.1 with Vite 5)
- A running **[Mealie](https://mealie.io)** instance (nightly or recent stable)

### 1 · Clone & install

```bash
git clone https://github.com/victorpiella/mealie-planner.git
cd mealie-planner
npm install
```

### 2 · Create your `.env`

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
# Full URL of your Mealie instance (no trailing slash)
VITE_MEALIE_URL=https://mealie.example.com

# Long-lived API token — see instructions below
VITE_MEALIE_TOKEN=your_token_here
```

### 3 · Getting a Mealie API Token

Mealie supports long-lived API tokens — no expiry, no OAuth.

1. Open your Mealie instance and **sign in**
2. Click your **avatar** (top right) → **Profile**
3. Select the **API Tokens** tab
4. Click **Generate** → enter a name (e.g. `mealie-planner`) → **Create**
5. **Copy the token immediately** — Mealie only shows it once
6. Paste it into `.env` as `VITE_MEALIE_TOKEN`

> 💡 You can revoke or regenerate tokens anytime from the same page.

### 4 · Run in dev mode

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

> The Vite dev proxy forwards `/api/*` to your Mealie instance — zero CORS issues.

### 5 · Build for production

```bash
npm run build      # TypeScript check + Vite bundle
npm run preview    # Preview the production build locally on :4173
```

### 6 · Docker

```bash
docker compose up --build
```

The app is served on **port 4173**. Your `.env` is picked up automatically.

---

## 🗂 Project Structure

```
src/
├── api/
│   └── mealie.ts          # Mealie REST API client
├── components/
│   ├── DayColumn.tsx       # Droppable lunch + dinner slots
│   ├── DishCard.tsx        # Draggable recipe card
│   ├── MenuPanel.tsx       # Sidebar: search, filters, actions
│   └── WeekBoard.tsx       # 7-column week grid
├── hooks/
│   └── useWeekPlan.ts      # Plan state + localStorage + payloads
├── types/
│   └── index.ts            # Shared TypeScript types
├── App.tsx                 # DnD context, drag handlers, submit logic
└── App.css                 # Full CSS (light + dark via [data-theme])
```

---

## ⚙️ Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_MEALIE_URL` | Yes* | Full URL of your Mealie instance, e.g. `https://mealie.example.com` |
| `VITE_MEALIE_TOKEN` | Yes* | Long-lived API token — Mealie → Profile → API Tokens |

\* Without these the app runs in **demo mode** with built-in sample recipes.

---

## 🏗 Tech Stack

| | |
|---|---|
| **Framework** | React 18 + TypeScript 5.5 |
| **Build** | Vite 5 |
| **Drag & Drop** | [@dnd-kit/core](https://dndkit.com/) |
| **Backend** | [Mealie](https://mealie.io) REST API |
| **Demo hosting** | GitHub Pages via GitHub Actions |

---

## 📦 Deploy to GitHub Pages (demo mode)

A ready-to-use workflow lives at `.github/workflows/deploy.yml`.

**One-time setup:**

1. Push the repo to GitHub
2. Go to **Settings → Pages → Source** → select **"GitHub Actions"**
3. Push to `main` — the workflow builds and deploys automatically

Your demo will appear at `https://your-username.github.io/mealie-planner/`
with the built-in sample recipes (no credentials baked into the public build).

> **Different repo name?** Update `VITE_BASE_PATH` in the workflow file.

---

## 🤝 Contributing

PRs and issues are welcome!

1. Fork the repo
2. Create a branch: `git checkout -b feat/my-feature`
3. Commit and open a Pull Request

---

## ☕ Support

If Mealie Planner saves you time every week, consider buying me a coffee:

[![Buy Me a Coffee](https://img.shields.io/badge/☕-buymeacoffee.com/victorpiella-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/victorpiella)

---

<div align="center">
<sub>MIT License · Made with ❤️ by <a href="https://github.com/victorpiella">Victor Piella</a></sub>
</div>
