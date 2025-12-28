# Workplace Workflow Guide

## Adapting Django Workflow to React/Vite Stack

**Your Current Setup:** Django with Codacy, staging/UAT/production branches, separate HTML/CSS/JS files  
**Target Setup:** React/Vite with similar workflow and production best practices

---

## 🔄 Understanding the Differences

### Django vs React Architecture

| Django              | React/Vite Equivalent                    |
| ------------------- | ---------------------------------------- |
| Separate HTML files | JSX components (`.tsx` files)            |
| Separate CSS files  | CSS Modules / Tailwind CSS               |
| Separate JS files   | TypeScript modules (`.ts`/`.tsx`)        |
| Templates folder    | `src/components/`                        |
| Static files        | `public/` + `src/assets/`                |
| Settings.py         | Environment variables + `vite.config.ts` |

**Key Point:** React uses component-based architecture where HTML/CSS/JS are co-located in components, but we can still maintain separation of concerns.

---

## 📋 Step 1: Set Up Branch Strategy (Like Django)

### Branch Structure

```
main (production)
  └── staging
      └── develop (UAT)
          └── feature/* (development)
```

### Implementation

#### Step 1.1: Create Branch Protection Rules

**For GitHub:**

1. **Go to:** Repository → Settings → Branches

2. **Protect `main` (Production):**

   ```
   ✅ Require pull request reviews (2 approvals)
   ✅ Require status checks (Codacy, tests, build)
   ✅ Require branches to be up to date
   ✅ Require conversation resolution
   ✅ Do not allow force pushes
   ✅ Do not allow deletions
   ```

3. **Protect `staging`:**

   ```
   ✅ Require pull request reviews (1 approval)
   ✅ Require status checks (tests, build)
   ✅ Require branches to be up to date
   ```

4. **Protect `develop` (UAT):**
   ```
   ✅ Require pull request reviews (1 approval)
   ✅ Require status checks (tests)
   ```

#### Step 1.2: Create Branch Workflow Document

Create `.github/BRANCH_STRATEGY.md`:

```markdown
# Branch Strategy

## Branches

### `main` (Production)

- **Purpose:** Production-ready code
- **Protection:** Highest level
- **Deployment:** Automatic after approval
- **Who can merge:** Senior developers + Tech Lead

### `staging`

- **Purpose:** Pre-production testing
- **Protection:** High level
- **Deployment:** Automatic
- **Who can merge:** Developers + QA

### `develop` (UAT)

- **Purpose:** User Acceptance Testing
- **Protection:** Medium level
- **Deployment:** Automatic
- **Who can merge:** All developers

### `feature/*`

- **Purpose:** Feature development
- **Protection:** None
- **Deployment:** Manual testing only
- **Who can merge:** Feature owner

## Workflow

1. Create feature branch from `develop`
2. Develop and test locally
3. Push to feature branch
4. Create PR to `develop`
5. After UAT approval, merge to `staging`
6. After staging approval, merge to `main`
```

---

## 🔍 Step 2: Set Up Codacy (Code Quality)

### Step 2.1: Sign Up for Codacy

1. Go to https://www.codacy.com
2. Sign up with GitHub account
3. Connect your repository

### Step 2.2: Configure Codacy

**Create `.codacy.yml`:**

```yaml
exclude_paths:
  - 'node_modules/**'
  - 'dist/**'
  - 'coverage/**'
  - '*.min.js'
  - '*.min.css'

engines:
  eslint:
    enabled: true
    exclude_paths:
      - 'node_modules/**'
      - 'dist/**'
  duplication:
    enabled: true
    exclude_paths:
      - 'node_modules/**'
      - 'dist/**'
  markdownlint:
    enabled: true
  shellcheck:
    enabled: true
```

### Step 2.3: Add Codacy Badge

Add to `README.md`:

```markdown
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/YOUR_PROJECT_ID)](https://www.codacy.com/gh/yourusername/ehr-app/dashboard)
```

### Step 2.4: Integrate Codacy with GitHub Actions

Update `.github/workflows/ci.yml`:

```yaml
name: CI - Test & Build

on:
  push:
    branches: [main, staging, develop]
  pull_request:
    branches: [main, staging, develop]

jobs:
  codacy:
    name: Codacy Code Quality
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Codacy analysis
        uses: codacy/codacy-analysis-cli-action@master
        with:
          project-token: ${{ secrets.CODACY_PROJECT_TOKEN }}
          code-patterns: true
          commit-uuid: ${{ github.event.pull_request.head.sha || github.sha }}
          max-tool-memory: 4096

  # ... rest of CI jobs
```

### Step 2.5: Get Codacy Token

1. Go to Codacy dashboard
2. Project Settings → Integrations → API tokens
3. Copy project token
4. Add to GitHub Secrets: `CODACY_PROJECT_TOKEN`

### Step 2.6: Set Up Codacy Quality Gates

**In Codacy Dashboard:**

1. Go to Project Settings → Quality Gates
2. Set minimum grade: **B**
3. Set maximum issues: **10**
4. Enable: Block PRs that don't meet quality gate

---

## 🏗️ Step 3: Code Structure (Separation of Concerns)

While React uses components, we can still maintain separation similar to Django.

### Step 3.1: Current Structure (React Way)

```
src/
├── components/          # Like Django templates
│   ├── patient/
│   │   ├── PatientForm.tsx      # Component (HTML-like)
│   │   ├── PatientForm.module.css # Styles (CSS)
│   │   └── patientFormUtils.ts   # Logic (JS)
│   └── ...
├── styles/             # Global styles (like main.css)
│   └── main.css
├── utils/              # Shared utilities (like Django utils)
└── hooks/              # Shared logic
```

### Step 3.2: Enhanced Structure (More Django-like)

**Option A: CSS Modules (Recommended)**

Create `src/components/patient/PatientForm.module.css`:

```css
/* PatientForm.module.css */
.formContainer {
  padding: 2rem;
  background: white;
  border-radius: 8px;
}

.formGroup {
  margin-bottom: 1.5rem;
}

.label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}
```

Use in component:

```typescript
// PatientForm.tsx
import styles from './PatientForm.module.css';

export const PatientForm = () => {
  return (
    <div className={styles.formContainer}>
      <div className={styles.formGroup}>
        <label className={styles.label}>Name</label>
        <input className={styles.input} />
      </div>
    </div>
  );
};
```

**Option B: Separate CSS Files (Django-style)**

Create `src/styles/components/patient-form.css`:

```css
/* patient-form.css */
.patient-form-container {
  padding: 2rem;
}

.patient-form-group {
  margin-bottom: 1.5rem;
}
```

Import in component:

```typescript
// PatientForm.tsx
import '../../styles/components/patient-form.css';

export const PatientForm = () => {
  return (
    <div className="patient-form-container">
      {/* ... */}
    </div>
  );
};
```

### Step 3.3: Separate JavaScript Logic

**Create utility files (like Django views/utils):**

`src/utils/patientFormLogic.ts`:

```typescript
// patientFormLogic.ts - Pure JavaScript logic
export interface PatientFormData {
  firstName: string;
  surname: string;
  // ...
}

export function validatePatientForm(data: PatientFormData): boolean {
  // Validation logic
  return data.firstName.length > 0 && data.surname.length > 0;
}

export function formatPatientData(data: PatientFormData): any {
  // Data transformation logic
  return {
    first_name: data.firstName,
    surname: data.surname,
  };
}
```

Use in component:

```typescript
// PatientForm.tsx
import { validatePatientForm, formatPatientData } from '../../utils/patientFormLogic';

export const PatientForm = () => {
  const handleSubmit = (data: PatientFormData) => {
    if (validatePatientForm(data)) {
      const formatted = formatPatientData(data);
      // Submit logic
    }
  };

  // Component JSX
};
```

### Step 3.4: Create Structure Guide

Create `CODE_STRUCTURE.md`:

```markdown
# Code Structure Guide

## Philosophy

While React uses components, we maintain separation of concerns similar to Django:

- **Components (.tsx)** = Templates (HTML structure)
- **CSS Modules (.module.css)** = Stylesheets (CSS)
- **Utils (.ts)** = Business logic (JavaScript)

## Directory Structure
```

src/
├── components/ # React components (like Django templates)
│ ├── patient/
│ │ ├── PatientForm.tsx # Component structure
│ │ ├── PatientForm.module.css # Component styles
│ │ └── patientFormUtils.ts # Component logic
│ └── ...
├── styles/ # Global styles (like main.css)
│ ├── main.css
│ ├── variables.css
│ └── components/ # Shared component styles
├── utils/ # Business logic (like Django utils)
│ ├── validation.ts
│ ├── formatting.ts
│ └── api.ts
└── hooks/ # Reusable logic (like Django mixins)

```

## Rules

1. **Components** should only handle UI structure
2. **Business logic** goes in `utils/` or `hooks/`
3. **Styles** are co-located with components (CSS Modules) or in `styles/`
4. **API calls** go in `hooks/` or `utils/api.ts`
```

---

## 🚀 Step 4: CI/CD Pipeline for Branch Strategy

### Step 4.1: Update CI Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI Pipeline

on:
  push:
    branches: [main, staging, develop, 'feature/**']
  pull_request:
    branches: [main, staging, develop]

env:
  NODE_VERSION: '20'

jobs:
  # Code Quality (Codacy)
  codacy:
    name: Codacy Analysis
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: codacy/codacy-analysis-cli-action@master
        with:
          project-token: ${{ secrets.CODACY_PROJECT_TOKEN }}
          commit-uuid: ${{ github.event.pull_request.head.sha }}

  # Linting
  lint:
    name: Lint Code
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  # Type Checking
  typecheck:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npx tsc --noEmit

  # Tests
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  # Build
  build:
    name: Build Application
    runs-on: ubuntu-latest
    needs: [lint, typecheck, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      - uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/
```

### Step 4.2: Create Deployment Workflows

**For `develop` (UAT):**

Create `.github/workflows/deploy-uat.yml`:

```yaml
name: Deploy to UAT

on:
  push:
    branches: [develop]

jobs:
  deploy-uat:
    name: Deploy to UAT Environment
    runs-on: ubuntu-latest
    environment:
      name: uat
      url: https://uat.yourdomain.com
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.UAT_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.UAT_SUPABASE_ANON_KEY }}
      # Deploy to UAT (Vercel/Netlify/etc.)
      - name: Deploy
        run: |
          # Your deployment command
```

**For `staging`:**

Create `.github/workflows/deploy-staging.yml`:

```yaml
name: Deploy to Staging

on:
  push:
    branches: [staging]
  workflow_dispatch: # Manual trigger

jobs:
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging.yourdomain.com
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.STAGING_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.STAGING_SUPABASE_ANON_KEY }}
      # Deploy to staging
```

**For `main` (Production):**

Create `.github/workflows/deploy-production.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
    tags:
      - 'v*.*.*'

jobs:
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://yourdomain.com
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.PRODUCTION_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.PRODUCTION_SUPABASE_ANON_KEY }}
      # Deploy to production
```

---

## 📝 Step 5: Environment Configuration (Like Django Settings)

### Step 5.1: Create Environment-Specific Configs

**Create `src/config/environments.ts`:**

```typescript
// environments.ts - Like Django settings.py

interface EnvironmentConfig {
  apiUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  sentryDsn?: string;
  enableAnalytics: boolean;
  enableDebug: boolean;
}

const environments: Record<string, EnvironmentConfig> = {
  development: {
    apiUrl: 'http://localhost:5173',
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    enableAnalytics: false,
    enableDebug: true,
  },
  uat: {
    apiUrl: 'https://uat.yourdomain.com',
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    enableAnalytics: true,
    enableDebug: false,
  },
  staging: {
    apiUrl: 'https://staging.yourdomain.com',
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    enableAnalytics: true,
    enableDebug: false,
  },
  production: {
    apiUrl: 'https://yourdomain.com',
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    sentryDsn: import.meta.env.VITE_SENTRY_DSN,
    enableAnalytics: true,
    enableDebug: false,
  },
};

const currentEnv = import.meta.env.MODE || 'development';

export const config = environments[currentEnv] || environments.development;
export default config;
```

### Step 5.2: Create Environment Files

**`.env.development`:**

```env
VITE_SUPABASE_URL=https://dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=dev-key
VITE_ENABLE_DEBUG=true
```

**`.env.uat`:**

```env
VITE_SUPABASE_URL=https://uat-project.supabase.co
VITE_SUPABASE_ANON_KEY=uat-key
VITE_ENABLE_DEBUG=false
```

**`.env.staging`:**

```env
VITE_SUPABASE_URL=https://staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=staging-key
VITE_ENABLE_DEBUG=false
```

**`.env.production`:**

```env
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=prod-key
VITE_SENTRY_DSN=prod-sentry-dsn
VITE_ENABLE_DEBUG=false
```

### Step 5.3: Update Vite Config

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    define: {
      __ENV__: JSON.stringify(mode),
    },
    build: {
      outDir: 'dist',
      sourcemap: mode === 'production' ? false : true,
      minify: mode === 'production' ? 'terser' : false,
    },
  };
});
```

---

## 🎯 Step 6: Production Best Practices

### Step 6.1: Code Organization Best Practices

**1. Separate Concerns:**

```typescript
// ❌ BAD: Everything in component
const PatientForm = () => {
  const validate = (data) => { /* 50 lines */ };
  const format = (data) => { /* 30 lines */ };
  const submit = async (data) => { /* 40 lines */ };
  return <div>...</div>;
};

// ✅ GOOD: Separated
// PatientForm.tsx - Only UI
import { usePatientForm } from './hooks/usePatientForm';
import styles from './PatientForm.module.css';

const PatientForm = () => {
  const { handleSubmit, errors } = usePatientForm();
  return <div className={styles.container}>...</div>;
};

// hooks/usePatientForm.ts - Logic
export const usePatientForm = () => {
  const validate = useCallback(/* ... */);
  const submit = useCallback(/* ... */);
  return { handleSubmit, errors };
};

// utils/patientValidation.ts - Pure functions
export const validatePatient = (data) => { /* ... */ };
```

**2. CSS Organization:**

```css
/* ✅ GOOD: CSS Modules (scoped) */
/* PatientForm.module.css */
.container {
}
.formGroup {
}

/* ✅ ALSO GOOD: Global styles in styles/ */
/* styles/components/forms.css */
.patient-form {
}
.consultation-form {
}
```

**3. TypeScript Types:**

```typescript
// ✅ GOOD: Separate types file
// types/patient.ts
export interface Patient {
  id: string;
  firstName: string;
  // ...
}

// ✅ GOOD: Use types
import { Patient } from '../types/patient';
```

### Step 6.2: Performance Best Practices

**1. Code Splitting:**

```typescript
// ✅ Lazy load routes
const PatientForm = lazy(() => import('./components/patient/PatientForm'));
const ConsultationForm = lazy(() => import('./components/consultation/ConsultationForm'));
```

**2. Memoization:**

```typescript
// ✅ Memoize expensive components
export const PatientCard = React.memo(({ patient }: Props) => {
  // Component code
});

// ✅ Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);
```

**3. Bundle Optimization:**

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
});
```

### Step 6.3: Security Best Practices

**1. Environment Variables:**

```typescript
// ✅ GOOD: Validate env vars
import { env } from './utils/env';

// ❌ BAD: Direct access
const url = import.meta.env.VITE_SUPABASE_URL;
```

**2. Input Sanitization:**

```typescript
// ✅ GOOD: Sanitize user input
import { sanitizeInput } from './utils/sanitize';

const userInput = sanitizeInput(formData.name);
```

**3. API Security:**

```typescript
// ✅ GOOD: Use RLS policies (Supabase handles this)
// ✅ GOOD: Validate on client AND server
```

### Step 6.4: Testing Best Practices

**1. Test Structure:**

```
src/
├── components/
│   └── patient/
│       ├── PatientForm.tsx
│       └── __tests__/
│           └── PatientForm.test.tsx  # Co-located tests
├── utils/
│   ├── validation.ts
│   └── __tests__/
│       └── validation.test.ts
```

**2. Test Coverage:**

```json
// package.json
{
  "scripts": {
    "test:coverage": "vitest --coverage --coverage.thresholds.lines=80"
  }
}
```

### Step 6.5: Documentation Best Practices

**1. Component Documentation:**

````typescript
/**
 * PatientForm Component
 *
 * Displays and handles patient registration/editing form.
 *
 * @example
 * ```tsx
 * <PatientForm
 *   patientId="123"
 *   onSave={handleSave}
 *   onBack={handleBack}
 * />
 * ```
 */
export const PatientForm: React.FC<PatientFormProps> = ({ ... }) => {
  // Component code
};
````

**2. Function Documentation:**

````typescript
/**
 * Validates patient form data
 *
 * @param data - Patient form data to validate
 * @returns True if valid, false otherwise
 * @throws {ValidationError} If validation fails with details
 *
 * @example
 * ```ts
 * const isValid = validatePatientForm(formData);
 * if (!isValid) {
 *   // Handle error
 * }
 * ```
 */
export function validatePatientForm(data: PatientFormData): boolean {
  // Validation logic
}
````

---

## 📊 Step 7: Quality Gates (Like Django)

### Step 7.1: Create Quality Checklist

Create `.github/QUALITY_GATES.md`:

```markdown
# Quality Gates

## Before Merging to `develop` (UAT)

- [ ] All tests pass
- [ ] Codacy grade ≥ B
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Code reviewed by 1 developer
- [ ] Manual testing completed

## Before Merging to `staging`

- [ ] UAT testing passed
- [ ] Codacy grade ≥ A
- [ ] Test coverage ≥ 75%
- [ ] Code reviewed by 2 developers
- [ ] Performance tested

## Before Merging to `main` (Production)

- [ ] Staging testing passed
- [ ] Codacy grade = A
- [ ] Test coverage ≥ 80%
- [ ] Code reviewed by Tech Lead
- [ ] Security review completed
- [ ] Performance benchmarks met
- [ ] Documentation updated
```

### Step 7.2: GitHub Status Checks

**Required checks for `main`:**

- Codacy analysis
- Lint
- Type check
- Tests
- Build
- Coverage

**Required checks for `staging`:**

- Lint
- Type check
- Tests
- Build

**Required checks for `develop`:**

- Lint
- Tests

---

## ✅ Implementation Checklist

- [ ] Set up branch protection rules
- [ ] Configure Codacy
- [ ] Create branch workflow document
- [ ] Set up CI/CD for all branches
- [ ] Create environment configs
- [ ] Organize code structure
- [ ] Set up quality gates
- [ ] Document code structure
- [ ] Train team on workflow

---

## 🎯 Summary

You now have a workflow similar to your Django setup:

✅ **Codacy** for code quality  
✅ **Branch strategy** (develop → staging → main)  
✅ **Separated concerns** (components, styles, logic)  
✅ **Environment configs** (like Django settings)  
✅ **Quality gates** at each stage  
✅ **Automated deployments** per environment

The main difference is React's component-based architecture, but we've maintained separation of concerns similar to Django's template/view/utils structure.

---

**Workflow Ready!** 🚀
