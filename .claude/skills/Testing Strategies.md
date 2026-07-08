# Testing Strategies - Quality Assurance Practices

**Scope:** workflow
**Trigger:** cuando se planee estrategia de testing, se configure CI/CD con tests, o se diseñe quality assurance
**Tools:** view, file_create, str_replace, bash_tool
**Version:** 1.0.0

---

## Propósito

Esta skill te guía para implementar estrategias de testing efectivas. Cubre testing pyramid, tipos de tests, TDD, BDD, coverage goals, CI/CD integration y mejores prácticas para asegurar calidad del código.

## Cuándo Usar Esta Skill

- Diseñar estrategia de testing para proyecto
- Configurar CI/CD con tests automáticos
- Implementar TDD o BDD
- Definir coverage goals
- Elegir qué tipo de tests escribir
- Debugging de tests flakey
- Code review de tests

## Testing Pyramid

### Clásica

```
       /\
      /E2E\        <- 10% - Lentos, caros
     /------\
    /  Int   \     <- 20% - Medianos
   /----------\
  /    Unit    \   <- 70% - Rápidos, baratos
 /--------------\
```

### Moderna (Testing Trophy)

```
       /\
      /E2E\
     /------\
    /  Int   \      <- Énfasis aquí (40%)
   /----------\
  /    Unit    \    <- 30%
 /--------------\
  Static Analysis   <- 30% (TypeScript, ESLint, mypy)
```

### Distribución Recomendada por Tipo

**Startup/MVP:**
- 50% Integration tests
- 30% Unit tests
- 20% E2E tests críticos

**Producto Maduro:**
- 60% Unit tests
- 30% Integration tests
- 10% E2E tests

**Backend API:**
- 70% Unit tests (lógica de negocio)
- 25% Integration tests (endpoints)
- 5% E2E tests (flujos críticos)

**Frontend SPA:**
- 50% Component tests
- 30% Integration tests
- 20% E2E tests

## Tipos de Tests

### 1. Unit Tests

**Qué:** Testean funciones/métodos aislados
**Herramientas:** Jest, pytest, JUnit, xUnit
**Cuándo:** Lógica de negocio, utils, algoritmos

```javascript
// JavaScript/Jest
describe('Calculator', () => {
  test('adds two numbers', () => {
    expect(add(2, 3)).toBe(5);
  });

  test('handles negative numbers', () => {
    expect(add(-1, 1)).toBe(0);
  });
});

// Python/pytest
def test_add():
    assert add(2, 3) == 5
    assert add(-1, 1) == 0

// Java/JUnit
@Test
public void testAdd() {
    assertEquals(5, Calculator.add(2, 3));
    assertEquals(0, Calculator.add(-1, 1));
}
```

### 2. Integration Tests

**Qué:** Testean interacción entre componentes
**Herramientas:** Jest + Supertest, pytest + httpx, Spring Test
**Cuándo:** APIs, database operations, external services

```javascript
// Node.js + Express + Jest
describe('POST /users', () => {
  it('creates a new user', async () => {
    const response = await request(app)
      .post('/users')
      .send({ name: 'John', email: 'john@test.com' })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('John');
  });
});

// Python + FastAPI + pytest
async def test_create_user(client: AsyncClient):
    response = await client.post(
        "/users",
        json={"name": "John", "email": "john@test.com"}
    )
    assert response.status_code == 201
    assert "id" in response.json()
```

### 3. E2E Tests

**Qué:** Testean flujos completos desde UI
**Herramientas:** Cypress, Playwright, Selenium
**Cuándo:** Flujos críticos (login, checkout, signup)

```javascript
// Cypress
describe('User Registration', () => {
  it('allows user to register', () => {
    cy.visit('/register');
    cy.get('[data-cy=name]').type('John Doe');
    cy.get('[data-cy=email]').type('john@test.com');
    cy.get('[data-cy=password]').type('password123');
    cy.get('[data-cy=submit]').click();

    cy.url().should('include', '/dashboard');
    cy.contains('Welcome, John').should('be.visible');
  });
});

// Playwright
test('user can login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name=email]', 'user@test.com');
  await page.fill('[name=password]', 'password');
  await page.click('button[type=submit]');

  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('text=Welcome')).toBeVisible();
});
```

### 4. Component Tests

**Qué:** Testean componentes UI aislados
**Herramientas:** React Testing Library, Vue Test Utils
**Cuándo:** Components de UI, interacciones

```javascript
// React Testing Library
test('Button triggers onClick', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);

  fireEvent.click(screen.getByText('Click me'));

  expect(handleClick).toHaveBeenCalledTimes(1);
});

test('Form shows validation errors', async () => {
  render(<LoginForm />);

  const submitButton = screen.getByRole('button', { name: /submit/i });
  fireEvent.click(submitButton);

  await waitFor(() => {
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });
});
```

## Test-Driven Development (TDD)

### Red-Green-Refactor Cycle

```
1. RED    - Write failing test
2. GREEN  - Write minimal code to pass
3. REFACTOR - Improve code quality
```

### Ejemplo Completo

```javascript
// 1. RED - Write failing test
describe('UserService', () => {
  test('creates user with hashed password', async () => {
    const user = await UserService.create({
      email: 'test@example.com',
      password: 'password123'
    });

    expect(user.id).toBeDefined();
    expect(user.password).not.toBe('password123');
    expect(await bcrypt.compare('password123', user.password)).toBe(true);
  });
});

// 2. GREEN - Minimal implementation
class UserService {
  static async create(data) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await db.users.insert({
      email: data.email,
      password: hashedPassword,
      id: generateId()
    });
    return user;
  }
}

// 3. REFACTOR - Improve
class UserService {
  static async create(data) {
    this.validateEmail(data.email);
    const hashedPassword = await this.hashPassword(data.password);
    return await this.insertUser({ ...data, password: hashedPassword });
  }

  private static validateEmail(email) {
    // Validation logic
  }

  private static async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  private static async insertUser(data) {
    return await db.users.insert(data);
  }
}
```

## Behavior-Driven Development (BDD)

### Gherkin Syntax

```gherkin
Feature: User Registration
  As a new user
  I want to create an account
  So that I can access the platform

  Scenario: Successful registration
    Given I am on the registration page
    When I fill in "Name" with "John Doe"
    And I fill in "Email" with "john@example.com"
    And I fill in "Password" with "securepass123"
    And I click "Register"
    Then I should see "Welcome, John"
    And I should be on the dashboard page

  Scenario: Registration with existing email
    Given a user exists with email "john@example.com"
    When I try to register with email "john@example.com"
    Then I should see "Email already exists"
```

### Cucumber/Jest Implementation

```javascript
// steps.js
Given('I am on the registration page', async () => {
  await page.goto('/register');
});

When('I fill in {string} with {string}', async (field, value) => {
  await page.fill(`[name=${field.toLowerCase()}]`, value);
});

When('I click {string}', async (button) => {
  await page.click(`button:has-text("${button}")`);
});

Then('I should see {string}', async (text) => {
  await expect(page.locator(`text=${text}`)).toBeVisible();
});
```

## Coverage Goals

### Métricas

```
Line Coverage       - % de líneas ejecutadas
Branch Coverage     - % de branches (if/else) cubiertos
Function Coverage   - % de funciones llamadas
Statement Coverage  - % de statements ejecutados
```

### Goals Recomendados

**Por Tipo de Código:**
- **Business Logic:** 90-100%
- **API Endpoints:** 80-90%
- **UI Components:** 70-80%
- **Utils/Helpers:** 90-100%
- **Config/Setup:** 50-70%

**Por Criticidad:**
- **Critical Path:** 100%
- **High Priority:** 85%+
- **Medium Priority:** 70%+
- **Low Priority:** 50%+

### Configuración

```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/**/*.stories.tsx',
  ],
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    './src/services/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};
```

## Test Doubles

### 1. Mocks

```javascript
// Mock external dependency
jest.mock('./api');
api.fetchUser.mockResolvedValue({ id: 1, name: 'John' });

// Verify calls
expect(api.fetchUser).toHaveBeenCalledWith(userId);
expect(api.fetchUser).toHaveBeenCalledTimes(1);
```

### 2. Stubs

```javascript
// Return predefined response
const stub = {
  getUser: () => ({ id: 1, name: 'John' }),
  deleteUser: () => true,
};
```

### 3. Spies

```javascript
// Monitor function calls
const spy = jest.spyOn(userService, 'create');
await userService.create({ name: 'John' });

expect(spy).toHaveBeenCalled();
spy.mockRestore();
```

### 4. Fakes

```javascript
// Working implementation for testing
class FakeDatabase {
  constructor() {
    this.data = new Map();
  }

  async insert(record) {
    const id = Date.now();
    this.data.set(id, record);
    return { id, ...record };
  }

  async find(id) {
    return this.data.get(id);
  }
}
```

## Testing Best Practices

### AAA Pattern

```javascript
test('user can be created', async () => {
  // Arrange
  const userData = {
    name: 'John',
    email: 'john@test.com'
  };

  // Act
  const user = await UserService.create(userData);

  // Assert
  expect(user.id).toBeDefined();
  expect(user.name).toBe('John');
});
```

### F.I.R.S.T Principles

```
Fast        - Tests run quickly
Independent - No dependencies between tests
Repeatable  - Same result every time
Self-validating - Pass or fail, no manual check
Timely      - Written at the right time (TDD)
```

### Given-When-Then

```javascript
test('user login with valid credentials', async () => {
  // Given - Setup
  const user = await createTestUser({
    email: 'test@example.com',
    password: 'password123'
  });

  // When - Action
  const response = await request(app)
    .post('/auth/login')
    .send({
      email: 'test@example.com',
      password: 'password123'
    });

  // Then - Assertion
  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('token');
});
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run unit tests
        run: npm test -- --coverage

      - name: Run integration tests
        run: npm run test:integration

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/coverage-final.json
```

### Quality Gates

```javascript
// Fail if coverage drops
if (coverage < previousCoverage - 2) {
  throw new Error('Coverage decreased');
}

// Fail if too many tests skipped
if (skippedTests > 5) {
  throw new Error('Too many skipped tests');
}
```

## Tests Anti-Patterns

### Evitar

```javascript
// Test demasiado genérico
test('app works', () => {
  expect(true).toBe(true);
});

// Test dependiente del orden
test('creates user', () => { /* ... */ });
test('updates user from previous test', () => { /* ... */ });

// Test que prueba implementación, no comportamiento
test('calls database.insert', () => {
  expect(database.insert).toHaveBeenCalled();
  // ¿Pero funcionó correctamente?
});

// Sleep en tests
test('loads data', async () => {
  loadData();
  await new Promise(resolve => setTimeout(resolve, 1000));
  expect(data).toBeDefined();
});
```

### Hacer

```javascript
// Test específico y claro
test('creates user with valid data', async () => {
  const user = await createUser({ name: 'John', email: 'john@test.com' });
  expect(user.id).toBeDefined();
});

// Tests independientes con setup
beforeEach(async () => {
  await clearDatabase();
  testUser = await createTestUser();
});

// Test comportamiento
test('returns user after creation', async () => {
  const user = await createUser(validData);
  expect(user).toMatchObject(validData);
});

// Usar waitFor para async
test('loads data', async () => {
  loadData();
  await waitFor(() => {
    expect(data).toBeDefined();
  });
});
```

## Testing Checklist

- [ ] All critical paths tested
- [ ] Edge cases covered
- [ ] Error handling tested
- [ ] Async operations tested correctly
- [ ] Tests are fast (<100ms unit, <1s integration)
- [ ] No flaky tests
- [ ] Coverage > 70%
- [ ] Tests pass in CI
- [ ] Mocks/stubs cleaned up after tests
- [ ] Test names are descriptive

## Best Practices

1. **Test Behavior, Not Implementation** - User perspective
2. **Keep Tests Simple** - One concept per test
3. **Fast Feedback** - Run unit tests frequently
4. **Independent Tests** - No shared state
5. **Descriptive Names** - test_should_do_something
6. **Arrange-Act-Assert** - Clear structure
7. **Mock External Dependencies** - DB, APIs, time
8. **Test Edge Cases** - Null, empty, boundary values
9. **CI/CD Integration** - Automated testing
10. **Review Test Code** - Tests need review too

---

**Última actualización:** Fase 6 - DevOps & Workflow
**Mantenedor:** Sistema de Skills
**Siguiente:** CI/CD para automatización completa
