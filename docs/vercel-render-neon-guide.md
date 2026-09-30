# GhostMesh Production Deployment Guide: Vercel + Render + Neon

This step-by-step guide walks you through deploying **GhostMesh** to production using:
- **Neon**: Serverless PostgreSQL for central audit logs and reconciliation decisions.
- **Render**: Docker Web Service with Persistent Disk for the FastAPI backend and Qdrant Edge shards.
- **Vercel**: Edge-optimized static hosting for the React 19 frontend console.
- **Qdrant Cloud**: Central vector cloud tier (`ghostmesh_memories`).

---

## 1. How to Obtain Each Required Environment Variable (Step-by-Step)

### A. Neon Database (`DATABASE_URL`)
1. Go to [https://console.neon.tech](https://console.neon.tech) and sign up / log in.
2. Click **Create Project**:
   - **Name**: `ghostmesh-db`
   - **Region**: Select the region closest to your Render service (e.g., `AWS US East (N. Virginia)`).
3. On the project **Dashboard**, locate the **Connection Details** box.
4. Select **Connection string**:
   - Toggle **Pooled connection** (recommended for serverless) or **Direct connection**.
   - Language/Framework: Select **Python** or **SQLAlchemy**.
5. Copy the connection string. It will look like:
   ```text
   postgresql://neondb_owner:npg_xYz12345Abc@ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
6. Paste this value as `DATABASE_URL` in your `.env` and Render environment settings.

---

### B. Qdrant Cloud (`QDRANT_URL` and `QDRANT_API_KEY`)
1. Go to [https://cloud.qdrant.io](https://cloud.qdrant.io) and log in.
2. Click **Clusters** -> **Create Cluster**:
   - Choose the **Free Tier (1GB)** or Standard Cluster.
   - Name: `ghostmesh-cluster`
   - Region: Select a region matching your Render service (e.g., `aws-us-east-1`).
3. Once provisioned, on the cluster overview page, copy the **Cluster URL**:
   ```text
   https://xyz-1234-abcd.eu-central.aws.cloud.qdrant.io:6333
   ```
   *(Ensure port `:6333` is appended to the URL)*. This is your `QDRANT_URL`.
4. In the left navigation, click **API Keys**:
   - Click **Create API Key**.
   - Name: `ghostmesh-render-key`.
   - Permissions: Read & Write.
   - Click **Generate Key** and copy the secret token immediately. This is your `QDRANT_API_KEY`.

---

### C. Render Backend URLs (For Vercel: `VITE_API_BASE_URL` & `VITE_WS_URL`)
1. When you deploy on Render (instructions below), Render gives your service a public URL, for example:
   ```text
   https://ghostmesh-api.onrender.com
   ```
2. Your frontend environment variables will be:
   - **`VITE_API_BASE_URL`**: `https://ghostmesh-api.onrender.com`
   - **`VITE_WS_URL`**: `wss://ghostmesh-api.onrender.com/ws/events` *(notice `wss://` replacing `https://`)*.

---

### D. Vercel Frontend Domain (For Render: `CORS_ORIGINS`)
1. When you deploy on Vercel, Vercel gives your project a domain, for example:
   ```text
   https://ghostmesh-console.vercel.app
   ```
2. In Render's environment settings, set:
   - **`CORS_ORIGINS`**: `https://ghostmesh-console.vercel.app,http://localhost:5173`

---

## 2. Step-by-Step Backend Deployment on Render

Render will host the FastAPI orchestrator and the isolated Qdrant Edge disk shards.

### Option A: 1-Click Deployment via `render.yaml` (Recommended)
1. Push this repository to GitHub (or GitLab).
2. Log into [https://dashboard.render.com](https://dashboard.render.com).
3. Click **New +** -> **Blueprint**.
4. Select your `GHOSTMESH` repository.
5. Render will automatically detect [`render.yaml`](file:///c:/Users/kaila/OneDrive/Desktop/Projects/GHOSTMESH-Code-Cubicle-Hackathon-Qdrant_Edge/render.yaml) and configure:
   - Docker build from `apps/api/Dockerfile`
   - Plan: `Free` ($0/mo, zero credit card required) or `Starter` ($7/mo if persistent disk is desired)
   - Healthcheck at `/health`
6. When prompted for environment variables in the Render UI, fill in:
   - `DATABASE_URL`: Your Neon connection string (or leave blank to use built-in SQLite).
   - `QDRANT_URL`: Your Qdrant Cloud cluster endpoint (or leave default to use local embedded shard fallback).
   - `QDRANT_API_KEY`: Your Qdrant Cloud API key.
   - `CORS_ORIGINS`: `*` (or your Vercel URL once deployed).
7. Click **Apply**. Render will build the container, bake in the ONNX model, and launch the service!

### Option B: Manual Web Service Setup on Render
1. Go to [Render Dashboard](https://dashboard.render.com) -> **New +** -> **Web Service**.
2. Connect your Git repository.
3. Configure the service:
   - **Name**: `ghostmesh-api`
   - **Language**: `Docker`
   - **Dockerfile Path**: `apps/api/Dockerfile`
   - **Docker Context**: `.` (Root)
   - **Instance Type / Plan**: Select **Free** ($0/mo - no credit card needed).
4. Under **Disks**:
   - *For 100% Free deployment*: Do **not** add a disk. The edge shards will store data in container storage `/app/data` automatically.
   - *For paid Starter plan ($7/mo)*: You can optionally add a 10 GB persistent disk mounted at `/app/data`.
5. Under **Environment Variables**, add:
   ```env
   ENVIRONMENT=production
   HOST=0.0.0.0
   PORT=8088
   EDGE_DATA_DIR=/app/data
   EMBEDDING_MODEL=BAAI/bge-small-en-v1.5
   DATABASE_URL=postgresql://neondb_owner:PASSWORD@YOUR_NEON_HOST.neon.tech/neondb?sslmode=require
   QDRANT_URL=https://your-cluster.cloud.qdrant.io:6333
   QDRANT_API_KEY=your_qdrant_api_key
   CLOUD_COLLECTION=ghostmesh_memories
   CORS_ORIGINS=*
   ```
6. Under **Health Check Path**: set `/health`.
7. Click **Create Web Service**. Wait 2–3 minutes for the build to finish.
8. Test the live health endpoint:
   ```bash
   curl -f https://your-render-service.onrender.com/health
   ```

---

## 3. Step-by-Step Frontend Deployment on Vercel

Vercel will build and serve the high-performance React 19 / Vite console at the edge.

### Deployment Steps:
1. Log into [https://vercel.com](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your `GHOSTMESH` GitHub repository.
4. In the **Configure Project** screen:
   - **Framework Preset**: `Vite` (automatically detected).
   - **Root Directory**: Click Edit -> Select `apps/frontend` (or keep root `.` as [`vercel.json`](file:///c:/Users/kaila/OneDrive/Desktop/Projects/GHOSTMESH-Code-Cubicle-Hackathon-Qdrant_Edge/vercel.json) handles monorepo routing).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand **Environment Variables** and add:
   - **`VITE_API_BASE_URL`**: `https://your-render-service.onrender.com`
   - **`VITE_WS_URL`**: `wss://your-render-service.onrender.com/ws/events`
6. Click **Deploy**.
7. In ~30 seconds, Vercel will complete the build and assign your domain:
   ```text
   https://ghostmesh-yourname.vercel.app
   ```
8. **Final Step (Secure CORS)**: Copy your Vercel URL, go back to your Render Dashboard -> Environment, update `CORS_ORIGINS` to `https://ghostmesh-yourname.vercel.app`, and click Save.

---

## 4. Summary of Files Created with Placeholders

| File Path | Purpose |
| :--- | :--- |
| [**`.env.example`**](file:///c:/Users/kaila/OneDrive/Desktop/Projects/GHOSTMESH-Code-Cubicle-Hackathon-Qdrant_Edge/.env.example) | Complete root environment reference with Neon, Qdrant Cloud, and Render variables. |
| [**`.env`**](file:///c:/Users/kaila/OneDrive/Desktop/Projects/GHOSTMESH-Code-Cubicle-Hackathon-Qdrant_Edge/.env) | Active root environment file with placeholders for `DATABASE_URL` and `QDRANT_API_KEY`. |
| [**`apps/api/.env.example`**](file:///c:/Users/kaila/OneDrive/Desktop/Projects/GHOSTMESH-Code-Cubicle-Hackathon-Qdrant_Edge/apps/api/.env.example) | Backend-specific environment template with Neon and Qdrant placeholders. |
| [**`apps/api/.env`**](file:///c:/Users/kaila/OneDrive/Desktop/Projects/GHOSTMESH-Code-Cubicle-Hackathon-Qdrant_Edge/apps/api/.env) | Active backend environment file. |
| [**`apps/frontend/.env.example`**](file:///c:/Users/kaila/OneDrive/Desktop/Projects/GHOSTMESH-Code-Cubicle-Hackathon-Qdrant_Edge/apps/frontend/.env.example) | Frontend template for Vercel pointing to Render backend. |
| [**`apps/frontend/.env.production`**](file:///c:/Users/kaila/OneDrive/Desktop/Projects/GHOSTMESH-Code-Cubicle-Hackathon-Qdrant_Edge/apps/frontend/.env.production) | Production frontend environment file with Render placeholders. |
| [**`render.yaml`**](file:///c:/Users/kaila/OneDrive/Desktop/Projects/GHOSTMESH-Code-Cubicle-Hackathon-Qdrant_Edge/render.yaml) | Render Infrastructure-as-Code Blueprint with persistent disk specification. |
| [**`vercel.json`**](file:///c:/Users/kaila/OneDrive/Desktop/Projects/GHOSTMESH-Code-Cubicle-Hackathon-Qdrant_Edge/vercel.json) | Monorepo build and SPA rewrites for Vercel. |
| [**`apps/frontend/vercel.json`**](file:///c:/Users/kaila/OneDrive/Desktop/Projects/GHOSTMESH-Code-Cubicle-Hackathon-Qdrant_Edge/apps/frontend/vercel.json) | Subfolder SPA rewrite rules for Vercel. |
| [**`apps/api/db/database.py`**](file:///c:/Users/kaila/OneDrive/Desktop/Projects/GHOSTMESH-Code-Cubicle-Hackathon-Qdrant_Edge/apps/api/db/database.py) | Neon Serverless PostgreSQL client with automated schema migrations. |
| [**`scripts/prod_check.py`**](file:///c:/Users/kaila/OneDrive/Desktop/Projects/GHOSTMESH-Code-Cubicle-Hackathon-Qdrant_Edge/scripts/prod_check.py) | Pre-deployment production verification script (**17/17 PASS**). |
