# CI/CD Pipeline Setup Guide

## Complete Step-by-Step Instructions

**Duration:** 6-8 hours  
**Priority:** HIGH - Essential for automated testing and deployment  
**Part of:** Phase 2, Step 5

---

## 📋 Overview

This guide provides comprehensive instructions for setting up Continuous Integration and Continuous Deployment (CI/CD) pipelines for your EHR application. You'll learn how to:

1. Set up automated testing on every push/PR
2. Automate builds
3. Deploy to staging/production
4. Configure multiple platforms (GitHub Actions, GitLab CI, etc.)

---

## 🎯 Objectives

- ✅ Automated tests run on every push/PR
- ✅ Automated builds verify code compiles
- ✅ Automated deployments to staging
- ✅ Manual approval for production deployments
- ✅ Environment-specific configurations
- ✅ Rollback capabilities

---

## Option 1: GitHub Actions (Recommended)

### Step 1.1: Create GitHub Repository Structure

**If not already using GitHub:**

1. Create a new repository on GitHub
2. Push your code:
   ```bash
   git remote add origin https://github.com/yourusername/ehr-app.git
   git branch -M main
   git push -u origin main
   ```

### Step 1.2: Create GitHub Actions Workflow Directory

```bash
mkdir -p .github/workflows
```

### Step 1.3: Create CI Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI - Test & Build

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20'

jobs:
  # Job 1: Linting
  lint:
    name: Lint Code
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Check formatting
        run: npm run format:check || true
        continue-on-error: true

  # Job 2: Type Checking
  typecheck:
    name: Type Check
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run TypeScript type check
        run: npx tsc --noEmit

  # Job 3: Unit Tests
  test:
    name: Run Tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: unittests
          name: codecov-umbrella
          fail_ci_if_error: false

  # Job 4: Build
  build:
    name: Build Application
    runs-on: ubuntu-latest
    needs: [lint, typecheck, test]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/
          retention-days: 7

      - name: Check bundle size
        run: |
          SIZE=$(du -sh dist | cut -f1)
          echo "Build size: $SIZE"
          if [ $(du -sm dist | cut -f1) -gt 10 ]; then
            echo "⚠️ Bundle size exceeds 10MB"
          fi
```

### Step 1.4: Create Deployment Workflow

Create `.github/workflows/deploy-staging.yml`:

```yaml
name: Deploy to Staging

on:
  push:
    branches: [develop]
  workflow_dispatch: # Allow manual trigger

env:
  NODE_VERSION: '20'

jobs:
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging.yourdomain.com

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.STAGING_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.STAGING_SUPABASE_ANON_KEY }}
          VITE_SENTRY_DSN: ${{ secrets.STAGING_SENTRY_DSN }}

      - name: Deploy to Vercel (Staging)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod=false'
          working-directory: ./

      # Alternative: Deploy to Netlify
      # - name: Deploy to Netlify
      #   uses: nwtgck/actions-netlify@v2.0
      #   with:
      #     publish-dir: './dist'
      #     production-deploy: false
      #     github-token: ${{ secrets.GITHUB_TOKEN }}
      #     deploy-message: "Deploy from GitHub Actions"
      #   env:
      #     NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
      #     NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}

      - name: Notify deployment
        if: success()
        run: |
          echo "✅ Successfully deployed to staging"
          # Add Slack/Discord/Email notification here
```

### Step 1.5: Create Production Deployment Workflow

Create `.github/workflows/deploy-production.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
    tags:
      - 'v*.*.*' # Trigger on version tags
  workflow_dispatch: # Allow manual trigger
    inputs:
      confirm:
        description: 'Type "deploy" to confirm production deployment'
        required: true

env:
  NODE_VERSION: '20'

jobs:
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://yourdomain.com

    # Require manual approval for production
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Verify deployment confirmation
        if: github.event_name == 'workflow_dispatch'
        run: |
          if [ "${{ github.event.inputs.confirm }}" != "deploy" ]; then
            echo "❌ Deployment cancelled. Must type 'deploy' to confirm."
            exit 1
          fi

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build application
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.PRODUCTION_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.PRODUCTION_SUPABASE_ANON_KEY }}
          VITE_SENTRY_DSN: ${{ secrets.PRODUCTION_SENTRY_DSN }}

      - name: Deploy to Vercel (Production)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./

      - name: Create GitHub Release
        if: startsWith(github.ref, 'refs/tags/')
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: false
          prerelease: false

      - name: Notify deployment
        if: success()
        run: |
          echo "✅ Successfully deployed to production"
          # Add notification here
```

### Step 1.6: Configure GitHub Secrets

**Go to GitHub Repository → Settings → Secrets and variables → Actions**

**Add these secrets:**

**Required:**

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key

**For Staging:**

- `STAGING_SUPABASE_URL`
- `STAGING_SUPABASE_ANON_KEY`
- `STAGING_SENTRY_DSN`

**For Production:**

- `PRODUCTION_SUPABASE_URL`
- `PRODUCTION_SUPABASE_ANON_KEY`
- `PRODUCTION_SENTRY_DSN`

**For Deployment (choose one):**

**Vercel:**

- `VERCEL_TOKEN` - Get from Vercel dashboard → Settings → Tokens
- `VERCEL_ORG_ID` - Get from Vercel dashboard
- `VERCEL_PROJECT_ID` - Get from Vercel dashboard

**Netlify:**

- `NETLIFY_AUTH_TOKEN` - Get from Netlify dashboard → User settings → Applications
- `NETLIFY_SITE_ID` - Get from Netlify site settings

### Step 1.7: Set Up Branch Protection

**Go to Repository → Settings → Branches**

**Protect `main` branch:**

- ✅ Require pull request reviews
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Require conversation resolution before merging
- ✅ Include administrators

**Required status checks:**

- ✅ lint
- ✅ typecheck
- ✅ test
- ✅ build

### Step 1.8: Test CI Pipeline

1. **Make a small change:**

   ```bash
   git checkout -b test-ci
   echo "# Test" >> README.md
   git add README.md
   git commit -m "test: CI pipeline"
   git push origin test-ci
   ```

2. **Create Pull Request:**
   - Go to GitHub
   - Create PR from `test-ci` to `main`
   - Watch Actions tab for CI to run

3. **Verify:**
   - ✅ All jobs pass
   - ✅ Build succeeds
   - ✅ Tests run

---

## Option 2: GitLab CI/CD

### Step 2.1: Create GitLab CI Configuration

Create `.gitlab-ci.yml`:

```yaml
image: node:20

stages:
  - lint
  - test
  - build
  - deploy-staging
  - deploy-production

cache:
  paths:
    - node_modules/

variables:
  NODE_VERSION: '20'

# Lint job
lint:
  stage: lint
  script:
    - npm ci
    - npm run lint
    - npm run format:check || true
  only:
    - merge_requests
    - main
    - develop

# Type check job
typecheck:
  stage: lint
  script:
    - npm ci
    - npx tsc --noEmit
  only:
    - merge_requests
    - main
    - develop

# Test job
test:
  stage: test
  script:
    - npm ci
    - npm test -- --coverage
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/coverage-final.json
  only:
    - merge_requests
    - main
    - develop

# Build job
build:
  stage: build
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 week
  only:
    - merge_requests
    - main
    - develop
    - tags

# Deploy to staging
deploy-staging:
  stage: deploy-staging
  script:
    - npm ci
    - npm run build
    - |
      # Add your deployment script here
      # Example for Vercel:
      # npm install -g vercel
      # vercel --prod=false --token=$VERCEL_TOKEN
  environment:
    name: staging
    url: https://staging.yourdomain.com
  only:
    - develop
  when: manual

# Deploy to production
deploy-production:
  stage: deploy-production
  script:
    - npm ci
    - npm run build
    - |
      # Add your deployment script here
      # Example for Vercel:
      # npm install -g vercel
      # vercel --prod --token=$VERCEL_TOKEN
  environment:
    name: production
    url: https://yourdomain.com
  only:
    - main
    - tags
  when: manual
  rules:
    - if: $CI_COMMIT_TAG
      when: manual
```

### Step 2.2: Configure GitLab CI/CD Variables

**Go to GitLab Project → Settings → CI/CD → Variables**

Add the same secrets as GitHub Actions (see Step 1.6).

---

## Option 3: Pre-commit Hooks (Local CI)

### Step 3.1: Install Husky

```bash
npm install -D husky lint-staged
```

### Step 3.2: Initialize Husky

```bash
npx husky install
```

### Step 3.3: Configure package.json

Add to `package.json`:

```json
{
  "scripts": {
    "prepare": "husky install",
    "lint-staged": "lint-staged"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml,yaml}": ["prettier --write"]
  }
}
```

### Step 3.4: Create Pre-commit Hook

```bash
npx husky add .husky/pre-commit "npm run lint-staged"
```

Create `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run lint-staged
```

### Step 3.5: Create Pre-push Hook

```bash
npx husky add .husky/pre-push "npm test"
```

Create `.husky/pre-push`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm test
```

### Step 3.6: Make Hooks Executable

```bash
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
```

---

## Deployment Platforms

### Option A: Vercel (Recommended for React Apps)

#### Setup Steps:

1. **Install Vercel CLI:**

   ```bash
   npm install -g vercel
   ```

2. **Login:**

   ```bash
   vercel login
   ```

3. **Link Project:**

   ```bash
   vercel link
   ```

4. **Create `vercel.json`:**

   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "devCommand": "npm run dev",
     "installCommand": "npm ci",
     "framework": "vite",
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ],
     "headers": [
       {
         "source": "/assets/(.*)",
         "headers": [
           {
             "key": "Cache-Control",
             "value": "public, max-age=31536000, immutable"
           }
         ]
       }
     ]
   }
   ```

5. **Deploy:**
   ```bash
   vercel --prod
   ```

### Option B: Netlify

#### Setup Steps:

1. **Create `netlify.toml`:**

   ```toml
   [build]
     command = "npm run build"
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200

   [[headers]]
     for = "/assets/*"
     [headers.values]
       Cache-Control = "public, max-age=31536000, immutable"
   ```

2. **Deploy via Netlify Dashboard:**
   - Connect GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variables

### Option C: AWS S3 + CloudFront

#### Setup Steps:

1. **Create deployment script:**
   Create `scripts/deploy-aws.sh`:

   ```bash
   #!/bin/bash
   set -e

   BUCKET_NAME="your-bucket-name"
   DISTRIBUTION_ID="your-cloudfront-id"

   echo "Building application..."
   npm run build

   echo "Uploading to S3..."
   aws s3 sync dist/ s3://$BUCKET_NAME --delete

   echo "Invalidating CloudFront cache..."
   aws cloudfront create-invalidation \
     --distribution-id $DISTRIBUTION_ID \
     --paths "/*"

   echo "Deployment complete!"
   ```

2. **Configure AWS credentials:**
   ```bash
   aws configure
   ```

---

## Testing the CI/CD Pipeline

### Test Checklist

**CI Pipeline:**

- [ ] Push to branch triggers CI
- [ ] Linting runs and passes
- [ ] Type checking runs and passes
- [ ] Tests run and pass
- [ ] Build succeeds
- [ ] Artifacts uploaded

**CD Pipeline:**

- [ ] Staging deployment works
- [ ] Production deployment requires approval
- [ ] Environment variables loaded correctly
- [ ] Application works after deployment
- [ ] Rollback works if needed

### Common Issues & Solutions

**Issue: Tests failing in CI but passing locally**

- **Solution:** Check Node version matches
- **Solution:** Ensure all dependencies in package.json
- **Solution:** Check environment variables

**Issue: Build fails in CI**

- **Solution:** Verify all environment variables set
- **Solution:** Check build logs for specific errors
- **Solution:** Ensure Node version matches

**Issue: Deployment fails**

- **Solution:** Verify deployment tokens/secrets
- **Solution:** Check deployment platform logs
- **Solution:** Verify build artifacts exist

---

## Advanced CI/CD Features

### Matrix Testing

Test against multiple Node versions:

```yaml
strategy:
  matrix:
    node-version: [18, 20, 22]
```

### Parallel Jobs

Run tests in parallel:

```yaml
test-unit:
  # Unit tests

test-integration:
  # Integration tests
  needs: [lint]
```

### Caching

Cache dependencies for faster builds:

```yaml
- uses: actions/cache@v3
  with:
    path: node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

### Notifications

Add Slack notifications:

```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Deployment completed'
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## Success Criteria

- ✅ CI pipeline runs on every push/PR
- ✅ All tests pass before merge
- ✅ Build succeeds automatically
- ✅ Staging deploys automatically
- ✅ Production requires manual approval
- ✅ Pre-commit hooks prevent bad commits
- ✅ Deployment rollback works
- ✅ Environment variables configured correctly

---

## Next Steps

After setting up CI/CD:

1. **Monitor pipeline:** Watch for failures
2. **Optimize:** Reduce build times with caching
3. **Expand:** Add more test types
4. **Document:** Update deployment docs
5. **Train team:** Ensure everyone understands workflow

---

## Files Created

- `.github/workflows/ci.yml` (new)
- `.github/workflows/deploy-staging.yml` (new)
- `.github/workflows/deploy-production.yml` (new)
- `.gitlab-ci.yml` (new, if using GitLab)
- `.husky/pre-commit` (new)
- `.husky/pre-push` (new)
- `vercel.json` (new, if using Vercel)
- `netlify.toml` (new, if using Netlify)
- `scripts/deploy-aws.sh` (new, if using AWS)

---

**CI/CD Setup Complete!** 🎉

Your application now has automated testing, building, and deployment pipelines configured and ready to use.
