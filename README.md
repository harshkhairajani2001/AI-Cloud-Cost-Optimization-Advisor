# AI Cloud Cost Optimization Advisor

AI Cloud Cost Optimization Advisor is a hybrid Next.js and FastAPI application for analyzing cloud billing CSV exports. The frontend uses the Next.js App Router with Tailwind CSS, while the backend uses FastAPI, pandas, and Groq to detect waste, surface top-spend services, and generate concise optimization guidance.

## Stack

- Next.js App Router
- Tailwind CSS v4 via PostCSS
- FastAPI
- pandas
- Groq API
- Vercel-compatible Python functions

## Features

- Premium SaaS-style dashboard built with React and Tailwind CSS
- Dark premium FinOps command center layout with sticky navigation and desktop side rail
- CSV upload flow with loading, success, and error states
- Flexible billing schema detection for AWS and Azure-style exports
- Total cost, waste cost, rows processed, and top-service metrics
- Provider detection, modeled savings, analysis confidence, and export actions
- Rule-based recommendations
- Optional Groq-powered AI insights with graceful fallback behavior
- Local development with Next.js on `:3000` and FastAPI on `:8000`

## Architecture

`Next.js App Router frontend -> /api/upload -> FastAPI backend -> pandas analyzer -> Groq insights`

## Folder Structure

```text
AI Cloud Cost Optimization Advisor/
├── api/
│   ├── ai_insights.py
│   ├── analyzer.py
│   └── index.py
├── app/
│   ├── globals.css
│   ├── layout.jsx
│   └── page.jsx
├── components/
│   ├── dashboard/
│   │   ├── analysis-control-panel.jsx
│   │   ├── command-center-navbar.jsx
│   │   ├── command-center-sidebar.jsx
│   │   ├── empty-analysis-state.jsx
│   │   ├── icons.jsx
│   │   ├── primitives.jsx
│   │   ├── summary-metrics.jsx
│   │   └── workspace-tabs.jsx
│   └── upload-dashboard.jsx
├── lib/
│   └── dashboard-utils.js
├── .env.example
├── .gitignore
├── jsconfig.json
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── README.md
├── requirements.txt
└── vercel.json
```

## Environment Variables

Copy `.env.example` to `.env`:

```powershell
Copy-Item .env.example .env
```

Then set:

```env
GROQ_API_KEY=
GROQ_MODEL=llama-3.1-8b-instant
NEXT_PUBLIC_API_BASE_URL=
```

Notes:

- Leave `NEXT_PUBLIC_API_BASE_URL` blank for the default local rewrite and same-origin Vercel deployment.
- Set `NEXT_PUBLIC_API_BASE_URL` only if the frontend should call a separately hosted backend.
- If `GROQ_API_KEY` is empty, the app still works and returns a fallback summary.

## Local Setup

### 1. Create and activate a Python virtual environment

Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

If `python` is misconfigured on Windows:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 2. Install Python dependencies

```powershell
python -m pip install -r requirements.txt
```

### 3. Install Node dependencies

```powershell
npm install
```

## Run Locally

### Option A: Run frontend and backend in separate terminals

Terminal 1:

```powershell
.\.venv\Scripts\Activate.ps1
python -m uvicorn api.index:app --reload --port 8000
```

Terminal 2:

```powershell
npm run dev
```

Then open:

- `http://localhost:3000`

The Next.js dev server proxies `/api/*` requests to `http://127.0.0.1:8000/api/*` when `NEXT_PUBLIC_API_BASE_URL` is not set.

### Option B: Run both from npm

After activating `.venv`, run:

```powershell
npm run dev:all
```

This starts:

- Next.js on `http://localhost:3000`
- FastAPI on `http://127.0.0.1:8000`

## API Endpoints

- `GET /api/health`
- `POST /api/upload`

Successful response:

```json
{
  "success": true,
  "analysis": {
    "total_cost": 465.18,
    "waste_cost": 39.14,
    "row_count": 3,
    "detected_columns": {
      "cost": "Cost",
      "service": "ServiceName",
      "usage": "UsageQuantity"
    },
    "top_services": {
      "Amazon EC2": 245.82,
      "Azure Virtual Machines": 180.22,
      "Amazon S3": 39.14
    },
    "recommendations": [
      "..."
    ]
  },
  "ai_insights": "..."
}
```

## Test Upload Locally

Use a CSV with headers like:

```csv
ServiceName,UsageQuantity,Cost
Amazon EC2,120,245.82
Amazon S3,0,39.14
Azure Virtual Machines,55,180.22
```

Then:

1. Start the backend.
2. Start the Next.js app.
3. Open `http://localhost:3000`.
4. Upload the CSV.
5. Review the spend metrics, recommendations, and AI summary.

## GitHub Push

```powershell
git init
git add .
git commit -m "Convert project to Next.js App Router with Tailwind and FastAPI backend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ai-cloud-cost-optimization-advisor.git
git push -u origin main
```

## Vercel Deployment

1. Push the repository to GitHub.
2. Create a new Vercel project from the repository.
3. Let Vercel detect the project as Next.js.
4. Add the backend environment variables in Vercel:
   - `GROQ_API_KEY`
   - `GROQ_MODEL`
5. Redeploy after saving the environment variables.

For this project, the frontend is the Next.js app and the backend remains in the root `api/` directory as Vercel Python functions.

## Troubleshooting

### `/api/upload` returns 404 locally

Make sure the FastAPI backend is running on `http://127.0.0.1:8000`.

### The frontend cannot reach the backend

If you set `NEXT_PUBLIC_API_BASE_URL`, confirm it points to the correct backend origin. If you leave it blank, use the default local setup with FastAPI on port `8000`.

### The app says no supported cost column was found

Supported cost columns are:

- `TotalCost`
- `Cost`
- `PretaxCost`
- `ExtendedCost`
- `Amount`

### Groq insights are not appearing

Check that:

- `.env` exists
- `GROQ_API_KEY` is set
- the backend process was restarted after editing `.env`

### Python reports `Could not find platform independent libraries <prefix>`

That indicates a broken local Python installation. Reinstall Python or create the environment with:

```powershell
py -3.12 -m venv .venv
```
