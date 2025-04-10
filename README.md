<div align="center">

# 🖼️ Image Selection App

[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=flat-square&logo=react&logoColor=white)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2.39.0-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.3.6-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

A modern React application with a Tinder-like swiping interface for image selection, powered by Supabase for authentication and data storage.

[✨ Demo](#) | [🐛 Report Bug](#) | [🔍 Request Feature](#)

</div>

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🔧 Prerequisites](#-prerequisites)
- [🚀 Local Development Setup](#-local-development-setup)
- [🔐 Environment Variables](#-environment-variables)
- [🌐 Deployment to GitHub Pages](#-deployment-to-github-pages)
  - [📝 Step 1: Prepare Your Repository](#-step-1-prepare-your-repository)
  - [🔑 Step 2: Configure Environment Variables](#-step-2-configure-environment-variables)
  - [⚙️ Step 3: Set Up GitHub Actions for Deployment](#️-step-3-set-up-github-actions-for-deployment)
  - [✅ Step 4: Verify Deployment](#-step-4-verify-deployment)
- [🛡️ Handling Supabase Keys in Production](#️-handling-supabase-keys-in-production)
- [🔍 Troubleshooting](#-troubleshooting)

---

## ✨ Features

- 🔐 **User Authentication**: Secure login and registration with Supabase
- 🛡️ **Protected Routes**: Restricted access for authenticated users only
- 👆 **Swipe Interface**: Intuitive Tinder-like image selection experience
- 📱 **Responsive Design**: Beautiful UI that works on all devices with Tailwind CSS
- ⚡ **Fast Performance**: Built with Vite for lightning-fast development and production builds

---

## 🔧 Prerequisites

- 📦 **Node.js** (v14 or later)
- 🧰 **npm** or **yarn**
- 🗄️ **Supabase** account and project

---

## 🚀 Local Development Setup

1. **Clone the repository**:

```bash
git clone https://github.com/yourusername/ImageSelectionTInder.git
cd ImageSelectionTInder
```

2. **Install dependencies**:

```bash
npm install
```

3. **Create a `.env` file** in the root directory with your Supabase credentials:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Start the development server**:

```bash
npm run dev
```

5. **Open your browser** and navigate to `http://localhost:5173/ImageSelectionTInder`

---

## 🔐 Environment Variables

This project uses the following environment variables:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key |

---

## 🌐 Deployment to GitHub Pages

### 📝 Step 1: Prepare Your Repository

1. Create a GitHub repository for your project (if you haven't already).

2. Push your code to the repository:

```bash
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/ImageSelectionTInder.git
git push -u origin main
```

3. Make sure your `vite.config.js` has the correct base path for GitHub Pages:

```javascript
export default defineConfig({
  plugins: [react()],
  base: '/ImageSelectionTInder/', // Should match your repository name
})
```

4. Ensure your `BrowserRouter` in `main.jsx` has the correct basename:

```jsx
<BrowserRouter basename="/ImageSelectionTInder">
  <App />
</BrowserRouter>
```

### 🔑 Step 2: Configure Environment Variables

1. In your GitHub repository, go to **Settings** > **Secrets and variables** > **Actions**.

2. Add the following repository secrets:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### ⚙️ Step 3: Set Up GitHub Actions for Deployment

1. Create a `.github/workflows` directory in your project:

```bash
mkdir -p .github/workflows
```

2. Create a deployment workflow file `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Set up Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Create env file
        run: |
          echo "VITE_SUPABASE_URL=${{ secrets.VITE_SUPABASE_URL }}" > .env
          echo "VITE_SUPABASE_ANON_KEY=${{ secrets.VITE_SUPABASE_ANON_KEY }}" >> .env
      
      - name: Build
        run: npm run build
      
      - name: Setup Pages
        uses: actions/configure-pages@v3
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v1
        with:
          path: './dist'
  
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v1
```

3. Commit and push the workflow file:

```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Pages deployment workflow"
git push
```

### ✅ Step 4: Verify Deployment

1. Go to your GitHub repository > **Actions** tab to monitor the deployment process.

2. Once the workflow completes successfully, go to **Settings** > **Pages** to find your deployed site URL.

3. Your app should now be accessible at `https://yourusername.github.io/ImageSelectionTInder/`

---

## 🛡️ Handling Supabase Keys in Production

To securely handle Supabase credentials in a production environment:

1. ⚠️ **Never commit your actual Supabase keys to your repository**. Instead, use environment variables as shown above.

2. Update your `App.jsx` to use environment variables instead of hardcoded values:

```jsx
// Replace the hardcoded values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
```

3. For GitHub Pages deployment, the GitHub Actions workflow injects these environment variables during the build process, so they are compiled into your static files.

4. Remember that client-side applications cannot truly hide API keys. The Supabase anon key is designed to be public, but you should still:
   - 🔒 Set up Row Level Security (RLS) in Supabase
   - 📋 Configure proper security policies
   - 🌐 Restrict domain access in your Supabase project settings

---

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| **404 errors after navigation** | Make sure your `vite.config.js` and `BrowserRouter` basename match your repository name. |
| **Authentication issues** | Verify that your Supabase URL and anon key are correctly set in the GitHub repository secrets. |
| **Blank page after deployment** | Check the browser console for errors. You might need to adjust the base path in your configuration. |
| **GitHub Actions failing** | Ensure you've set up the repository secrets correctly and that your workflow file is properly formatted. |

---

<div align="center">

**Made with ❤️ by [Your Name]**

</div>