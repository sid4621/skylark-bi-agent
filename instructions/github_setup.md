# How to Push Your Project to GitHub

I do **not** know your GitHub username/ID automatically. You will need to log in to GitHub to find it.

## Step 1: Create a Repository on GitHub
1.  Go to [github.com/new](https://github.com/new).
2.  **Repository name**: `skylark-bi-agent` (or any name you like).
3.  **Description**: `Next.js BI Dashboard for Skylark`.
4.  **Public/Private**: Choose whichever you prefer.
5.  **Do NOT** initialize with README, .gitignore, or License (we already have these).
6.  Click **Create repository**.

## Step 2: Push Your Code
Run the following commands in your terminal (I can run the first two for you if you'd like):

```bash
# Initialize local repository
git init

# Add all files
git add .

# Commit first version
git commit -m "Initial commit: Skylark BI Agent"

# Link to GitHub (REPLACE 'YOUR-USERNAME' with your actual GitHub ID)
git remote add origin https://github.com/YOUR-USERNAME/skylark-bi-agent.git

# Push to main branch
git branch -M main
git push -u origin main
```

## Hosting (Vercel)
The easiest way to host this online is **Vercel**:
1.  Go to [vercel.com](https://vercel.com) -> Login with GitHub.
2.  Click "Add New..." -> "Project".
3.  Import your `skylark-bi-agent` repository.
4.  Adding Environment Variables:
    *   You **MUST** add your keys (`MONDAY_API_KEY`, `GROQ_API_KEY`, etc.) in the Vercel dashboard settings under "Environment Variables".
5.  Click **Deploy**.
