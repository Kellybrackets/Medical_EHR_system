# Phase 2: Testing & Quality - Week 2

## Production Readiness Action Plan

**Duration:** 5-7 days  
**Priority:** HIGH - Essential for maintaining code quality and preventing regressions  
**Estimated Time:** 35-45 hours

---

## Overview

This phase focuses on establishing a comprehensive testing infrastructure, setting up CI/CD pipelines, and improving code quality. These improvements will enable confident deployments and catch issues before they reach production.

---

## Step 1: Set Up Testing Framework (Day 1, 6-8 hours)

### Objective

Install and configure Vitest (or Jest) testing framework with React Testing Library for component testing.

### Why This Matters

- Enables automated testing
- Catches bugs before production
- Provides confidence in refactoring
- Documents expected behavior

### Detailed Steps

#### Step 1.1: Install Testing Dependencies

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/ui
```

#### Step 1.2: Configure Vitest

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/', '**/*.d.ts', '**/*.config.*', '**/mockData.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

#### Step 1.3: Create Test Setup File

Create `src/test/setup.ts`:

```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
  isSupabaseConfigured: true,
}));

// Mock environment variables
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');
```

#### Step 1.4: Create Test Utilities

Create `src/test/utils.tsx`:

```typescript
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AuthProvider } from '../contexts/AuthProvider';
import { User } from '../types';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  user?: User | null;
}

export function renderWithProviders(
  ui: ReactElement,
  { user = null, ...renderOptions }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

export * from '@testing-library/react';
export { renderWithProviders as render };
```

#### Step 1.5: Update package.json Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch"
  }
}
```

#### Step 1.6: Create First Test

Create `src/utils/__tests__/helpers.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePhone,
  validateIdNumber,
  calculateAge,
  formatDate,
} from '../helpers';

describe('validateEmail', () => {
  it('should validate correct email addresses', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name@domain.co.uk')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
    expect(validateEmail('test@')).toBe(false);
  });
});

describe('validatePhone', () => {
  it('should validate correct phone numbers', () => {
    expect(validatePhone('0123456789')).toBe(true);
    expect(validatePhone('+27123456789')).toBe(true);
    expect(validatePhone('(012) 345-6789')).toBe(true);
  });

  it('should reject invalid phone numbers', () => {
    expect(validatePhone('123')).toBe(false);
    expect(validatePhone('abc')).toBe(false);
  });
});

describe('validateIdNumber', () => {
  it('should validate 13-digit SA ID numbers', () => {
    expect(validateIdNumber('9001015009087')).toBe(true);
    expect(validateIdNumber('0001010001088')).toBe(true);
  });

  it('should reject invalid ID numbers', () => {
    expect(validateIdNumber('12345')).toBe(false);
    expect(validateIdNumber('900101500908')).toBe(false);
    expect(validateIdNumber('abc1234567890')).toBe(false);
  });
});

describe('calculateAge', () => {
  it('should calculate age correctly', () => {
    const today = new Date();
    const birthDate = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
    expect(calculateAge(birthDate.toISOString().split('T')[0])).toBe(25);
  });
});

describe('formatDate', () => {
  it('should format dates correctly', () => {
    const date = '2024-01-15';
    expect(formatDate(date)).toMatch(/Jan.*15.*2024/);
  });
});
```

#### Step 1.7: Run First Test

```bash
npm test
```

**Verify:**

- [ ] Tests run successfully
- [ ] All assertions pass
- [ ] Coverage report generated

### Success Criteria

- ✅ Vitest configured and working
- ✅ Test setup file created
- ✅ Test utilities created
- ✅ First test suite passing
- ✅ Coverage reporting works

### Files Created

- `vitest.config.ts` (new)
- `src/test/setup.ts` (new)
- `src/test/utils.tsx` (new)
- `src/utils/__tests__/helpers.test.ts` (new)

---

## Step 2: Write Unit Tests for Utilities (Day 1-2, 6-8 hours)

### Objective

Write comprehensive unit tests for all utility functions to ensure they work correctly.

### Detailed Steps

#### Step 2.1: Test Patient Data Transforms

Create `src/utils/__tests__/patientDataTransforms.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  formDataToPatientData,
  patientToFormData,
  validateMedicalData,
} from '../patientDataTransforms';
import { PatientFormData, Patient } from '../../types';

describe('formDataToPatientData', () => {
  it('should transform form data correctly', () => {
    const formData: PatientFormData = {
      firstName: 'John',
      surname: 'Doe',
      idType: 'id_number',
      idNumber: '9001015009087',
      gender: 'male',
      dateOfBirth: '1990-01-01',
      age: '34',
      contactNumber: '0123456789',
      alternateNumber: '',
      email: 'john@example.com',
      address: '123 Main St',
      city: 'Johannesburg',
      postalCode: '2000',
      paymentMethod: 'cash',
      emergencyContactName: 'Jane Doe',
      emergencyContactRelationship: 'Spouse',
      emergencyContactPhone: '0987654321',
      emergencyContactAlternatePhone: '',
      emergencyContactEmail: '',
      fundName: 'Medical Aid',
      memberNumber: '123456',
      plan: 'Premium',
      height: '180',
      weight: '75',
      bloodType: 'O+',
      allergies: 'Peanuts, Shellfish',
      chronicConditions: 'Diabetes',
      currentMedications: 'Insulin',
      pastSurgeries: 'Appendectomy',
      familyHistory: 'Heart disease',
      smokingStatus: 'never',
      alcoholConsumption: 'occasional',
    };

    const result = formDataToPatientData(formData);

    expect(result.patient.first_name).toBe('John');
    expect(result.patient.surname).toBe('Doe');
    expect(result.patient.sex).toBe('Male');
    expect(result.nextOfKin.name).toBe('Jane Doe');
    expect(result.medicalHistory.height).toBe(180);
    expect(result.medicalHistory.allergies).toEqual(['Peanuts', 'Shellfish']);
  });
});

describe('patientToFormData', () => {
  it('should transform patient data to form data', () => {
    const patient: Patient = {
      id: '123',
      firstName: 'John',
      surname: 'Doe',
      idType: 'id_number',
      idNumber: '9001015009087',
      sex: 'Male',
      dateOfBirth: '1990-01-01',
      age: 34,
      contactNumber: '0123456789',
      email: 'john@example.com',
      address: '123 Main St',
      city: 'Johannesburg',
      postalCode: '2000',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      medicalHistory: {
        id: '1',
        patientId: '123',
        height: 180,
        weight: 75,
        bloodType: 'O+',
        allergies: ['Peanuts'],
        chronicConditions: [],
        currentMedications: [],
        pastSurgeries: [],
        smokingStatus: 'never',
        alcoholConsumption: 'never',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    };

    const result = patientToFormData(patient);

    expect(result.firstName).toBe('John');
    expect(result.height).toBe('180');
    expect(result.allergies).toBe('Peanuts');
  });
});

describe('validateMedicalData', () => {
  it('should validate correct medical data', () => {
    const medicalData = {
      height: 180,
      weight: 75,
      bloodType: 'O+',
      allergies: ['Peanuts'],
      chronicConditions: [],
      currentMedications: [],
      pastSurgeries: [],
    };

    const result = validateMedicalData(medicalData);
    expect(result.isValid).toBe(true);
  });

  it('should reject invalid height', () => {
    const medicalData = {
      height: 500, // Too tall
      weight: 75,
      bloodType: 'O+',
      allergies: [],
      chronicConditions: [],
      currentMedications: [],
      pastSurgeries: [],
    };

    const result = validateMedicalData(medicalData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Height must be between 30 and 300 cm');
  });
});
```

#### Step 2.2: Test All Helper Functions

Create comprehensive tests for:

- Email validation
- Phone validation
- ID number validation
- Passport validation
- Date utilities
- String utilities
- Form validation

#### Step 2.3: Run Tests and Check Coverage

```bash
npm run test:coverage
```

**Target:** >80% coverage for utility functions

### Success Criteria

- ✅ All utility functions tested
- ✅ Edge cases covered
- ✅ >80% coverage achieved
- ✅ All tests passing

### Files Created

- `src/utils/__tests__/patientDataTransforms.test.ts` (new)
- Additional test files for other utilities

---

## Step 3: Write Component Tests (Day 2-3, 8-10 hours)

### Objective

Write tests for critical React components to ensure they render correctly and handle user interactions.

### Detailed Steps

#### Step 3.1: Test LoginForm Component

Create `src/components/auth/__tests__/LoginForm.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../LoginForm';
import { renderWithProviders } from '../../../test/utils';

// Mock useAuth hook
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    signIn: vi.fn().mockResolvedValue({ success: true }),
    loading: false,
  }),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form', () => {
    renderWithProviders(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    const { useAuth } = await import('../../../hooks/useAuth');
    const mockSignIn = vi.fn().mockResolvedValue({ success: true });

    vi.mocked(useAuth).mockReturnValue({
      signIn: mockSignIn,
      loading: false,
    } as any);

    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });
});
```

#### Step 3.2: Test PatientForm Component

Create `src/components/patient/__tests__/PatientForm.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PatientForm } from '../PatientForm';
import { renderWithProviders } from '../../../test/utils';

// Mock usePatients hook
vi.mock('../../../hooks/usePatients', () => ({
  usePatients: () => ({
    addPatient: vi.fn(),
    updatePatient: vi.fn(),
    getPatientById: vi.fn(),
    loading: false,
  }),
}));

describe('PatientForm', () => {
  it('should render form fields', () => {
    renderWithProviders(<PatientForm onBack={vi.fn()} onSave={vi.fn()} />);

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/surname/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/id number/i)).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PatientForm onBack={vi.fn()} onSave={vi.fn()} />);

    const submitButton = screen.getByRole('button', { name: /save/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
    });
  });
});
```

#### Step 3.3: Test Error Boundary

Create `src/components/__tests__/ErrorBoundary.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

const ThrowError = () => {
  throw new Error('Test error');
};

describe('ErrorBoundary', () => {
  it('should catch errors and display fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('should call onError callback', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
  });
});
```

#### Step 3.4: Test Critical Components

Prioritize testing:

1. LoginForm
2. PatientForm
3. PatientView
4. ConsultationForm
5. ErrorBoundary
6. LoadingSpinner

### Success Criteria

- ✅ Critical components tested
- ✅ User interactions tested
- ✅ Error states tested
- ✅ All component tests passing

### Files Created

- `src/components/auth/__tests__/LoginForm.test.tsx` (new)
- `src/components/patient/__tests__/PatientForm.test.tsx` (new)
- `src/components/__tests__/ErrorBoundary.test.tsx` (new)
- Additional component test files

---

## Step 4: Write Integration Tests (Day 3-4, 8-10 hours)

### Objective

Test complete user workflows to ensure features work end-to-end.

### Detailed Steps

#### Step 4.1: Test Patient Creation Flow

Create `src/__tests__/integration/patientCreation.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../App';
import { renderWithProviders } from '../../test/utils';

// Mock Supabase responses
const mockInsert = vi.fn();
const mockSelect = vi.fn();

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
      }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      insert: mockInsert,
      select: mockSelect,
      update: vi.fn(),
      delete: vi.fn(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}));

describe('Patient Creation Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a patient successfully', async () => {
    const user = userEvent.setup();

    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: '123', first_name: 'John', surname: 'Doe' },
        error: null,
      }),
    });

    renderWithProviders(<App />);

    // Navigate to add patient (assuming logged in as receptionist)
    // Fill form
    // Submit
    // Verify success

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled();
    });
  });
});
```

#### Step 4.2: Test Authentication Flow

Create `src/__tests__/integration/authentication.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../App';

describe('Authentication Flow', () => {
  it('should login successfully', async () => {
    // Test login flow
  });

  it('should logout successfully', async () => {
    // Test logout flow
  });

  it('should handle invalid credentials', async () => {
    // Test error handling
  });
});
```

#### Step 4.3: Test Consultation Flow

Create `src/__tests__/integration/consultation.test.tsx`:

```typescript
describe('Consultation Flow', () => {
  it('should create consultation note', async () => {
    // Test consultation creation
  });

  it('should update consultation note', async () => {
    // Test consultation update
  });
});
```

### Success Criteria

- ✅ Critical user flows tested
- ✅ Integration tests passing
- ✅ Realistic test scenarios

### Files Created

- `src/__tests__/integration/patientCreation.test.tsx` (new)
- `src/__tests__/integration/authentication.test.tsx` (new)
- `src/__tests__/integration/consultation.test.tsx` (new)

---

## Step 5: Set Up CI/CD Pipeline (Day 4-5, 6-8 hours)

### Objective

Create GitHub Actions workflow to run tests automatically on every push and PR.

> **📘 Detailed Guide:** For comprehensive CI/CD setup instructions covering GitHub Actions, GitLab CI, pre-commit hooks, and multiple deployment platforms, see [CI_CD_SETUP_GUIDE.md](./CI_CD_SETUP_GUIDE.md)

### Quick Start

#### Step 5.1: Create GitHub Actions Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npx tsc --noEmit

      - name: Run tests
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: unittests
          name: codecov-umbrella

  build:
    runs-on: ubuntu-latest
    needs: test

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/
```

#### Step 5.2: Create Pre-commit Hooks

Install Husky:

```bash
npm install -D husky lint-staged
```

Update `package.json`:

```json
{
  "scripts": {
    "prepare": "husky install",
    "lint-staged": "lint-staged"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
  }
}
```

Initialize Husky:

```bash
npx husky install
npx husky add .husky/pre-commit "npm run lint-staged"
npx husky add .husky/pre-push "npm test"
```

#### Step 5.3: Set Up Code Coverage

Install coverage tool:

```bash
npm install -D @vitest/coverage-v8
```

Update `vitest.config.ts` (already done in Step 1.2).

#### Step 5.4: Test CI Pipeline

1. Push changes to GitHub
2. Verify workflow runs
3. Check test results
4. Verify build succeeds

### Success Criteria

- ✅ CI pipeline configured
- ✅ Tests run on push/PR
- ✅ Build runs on CI
- ✅ Pre-commit hooks working
- ✅ Coverage reports generated

### Files Created

- `.github/workflows/ci.yml` (new)
- `.husky/pre-commit` (new)
- `.husky/pre-push` (new)

---

## Step 6: Set Up E2E Testing (Day 5-6, 6-8 hours)

### Objective

Set up Playwright or Cypress for end-to-end testing of critical user flows.

### Detailed Steps

#### Step 6.1: Install Playwright

```bash
npm install -D @playwright/test
npx playwright install
```

#### Step 6.2: Configure Playwright

Create `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### Step 6.3: Write E2E Tests

Create `e2e/auth.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/');

    await page.fill('[name="email"]', 'doctor@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/');

    await page.fill('[name="email"]', 'invalid@example.com');
    await page.fill('[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });
});
```

Create `e2e/patient.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Patient Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.fill('[name="email"]', 'receptionist@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);
  });

  test('should create a new patient', async ({ page }) => {
    await page.click('text=Add Patient');

    await page.fill('[name="firstName"]', 'John');
    await page.fill('[name="surname"]', 'Doe');
    await page.fill('[name="idNumber"]', '9001015009087');
    // Fill other required fields...

    await page.click('button:has-text("Save")');

    await expect(page.locator('text=Patient created successfully')).toBeVisible();
  });
});
```

#### Step 6.4: Add E2E Scripts

Update `package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

#### Step 6.5: Run E2E Tests

```bash
npm run test:e2e
```

### Success Criteria

- ✅ Playwright configured
- ✅ Critical E2E tests written
- ✅ Tests run successfully
- ✅ E2E tests in CI pipeline

### Files Created

- `playwright.config.ts` (new)
- `e2e/auth.spec.ts` (new)
- `e2e/patient.spec.ts` (new)

---

## Step 7: Code Quality Improvements (Day 6-7, 4-6 hours)

### Objective

Improve code quality through linting, formatting, and code review.

### Detailed Steps

#### Step 7.1: Set Up Prettier

Install Prettier:

```bash
npm install -D prettier
```

Create `.prettierrc`:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

Create `.prettierignore`:

```
node_modules
dist
coverage
*.min.js
```

#### Step 7.2: Update ESLint Config

Ensure ESLint is properly configured (already done, but review).

#### Step 7.3: Add Format Scripts

Update `package.json`:

```json
{
  "scripts": {
    "format": "prettier --write \"src/**/*.{ts,tsx}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx}\""
  }
}
```

#### Step 7.4: Run Formatting

```bash
npm run format
```

#### Step 7.5: Fix Linting Issues

```bash
npm run lint -- --fix
```

### Success Criteria

- ✅ Prettier configured
- ✅ Code formatted consistently
- ✅ All linting issues fixed
- ✅ Format check in CI

### Files Created/Modified

- `.prettierrc` (new)
- `.prettierignore` (new)
- `package.json` (updated)

---

## Step 8: Testing & Verification (Day 7, 4-6 hours)

### Objective

Verify all testing infrastructure works and achieve target coverage.

### Detailed Steps

#### Step 8.1: Run All Tests

```bash
npm test
npm run test:coverage
npm run test:e2e
```

#### Step 8.2: Check Coverage Report

Target coverage:

- Utilities: >90%
- Components: >70%
- Hooks: >80%
- Overall: >75%

#### Step 8.3: Fix Failing Tests

Address any failing tests.

#### Step 8.4: Update Documentation

Document testing approach:

- How to run tests
- How to write tests
- Testing best practices

### Success Criteria

- ✅ All tests passing
- ✅ Coverage targets met
- ✅ CI pipeline green
- ✅ Documentation updated

---

## Phase 2 Completion Checklist

- [ ] Step 1: Testing framework set up
- [ ] Step 2: Unit tests written (>80% coverage)
- [ ] Step 3: Component tests written
- [ ] Step 4: Integration tests written
- [ ] Step 5: CI/CD pipeline configured
- [ ] Step 6: E2E tests set up
- [ ] Step 7: Code quality improved
- [ ] Step 8: Testing verified

**Total Estimated Time:** 35-45 hours  
**Recommended Schedule:** 5-7 days

---

## Next Steps

After completing Phase 2, proceed to:

- **Phase 3: Production Hardening** (see PHASE_3_PRODUCTION_HARDENING.md)

---

## Troubleshooting

### Issue: Tests failing due to Supabase mocks

**Solution:** Improve mock setup in test/setup.ts. Ensure mocks match actual Supabase API.

### Issue: Coverage too low

**Solution:** Focus on critical paths first. Add tests incrementally.

### Issue: CI pipeline failing

**Solution:** Test locally first. Check environment variables in GitHub Secrets.

### Issue: E2E tests flaky

**Solution:** Add proper waits. Use data-testid attributes. Increase retries.

---

**Phase 2 Complete!** 🎉
