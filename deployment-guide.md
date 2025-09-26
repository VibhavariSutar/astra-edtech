# Deployment Guide 🚀

## Quick Deployment Options

### Option 1: Vercel (Frontend) + Railway (Backend) - Recommended

#### Frontend on Vercel
1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Set build settings:
   - Framework: Vite
   - Root Directory: frontend
   - Build Command: `npm run build`
   - Output Directory: dist
5. Add environment variables:


#### Backend on Railway
1. Go to [Railway](https://railway.app)
2. Create new project from GitHub
3. Set environment variables:


### Option 2: Netlify (Frontend) + Heroku (Backend)

#### Frontend on Netlify
1. Build locally: `cd frontend && npm run build`
2. Drag and drop `dist` folder to Netlify
3. Set environment variables in Netlify dashboard

#### Backend on Heroku
1. Install Heroku CLI
2. `heroku create your-app-name`
3. `git subtree push --prefix backend heroku main`
4. Set environment variables in Heroku dashboard

## Environment Setup for Production

### Backend Environment Variables
```env
NODE_ENV=production
PORT=10000  # Railway/Heroku will set this
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/astralearn_production
JWT_SECRET=very_strong_secret_key_for_production
CLIENT_URL=https://your-frontend-domain.com