# Clean Architecture - Forum API

## Overview

Forum API menggunakan Clean Architecture pattern yang memisahkan kode berdasarkan concern dan dependency rule. Arsitektur ini memastikan kode yang maintainable, testable, dan scalable.

## Layer Structure

### 1. Domains Layer (`src/Domains/`)

**Purpose**: Berisi business logic dan entities core dari aplikasi.

**Components**:
- **Entities**: Model data dan business rules
- **Repository Interfaces**: Contract untuk data access
- **Use Case Interfaces**: Contract untuk business operations

**Dependencies**: Tidak memiliki dependency ke layer lain (independent)

**Example**:
```
src/Domains/
├── authentications/
├── comments/
├── likes/
├── replies/
├── threads/
└── users/
```

### 2. Applications Layer (`src/Applications/`)

**Purpose**: Mengimplementasikan use cases dan orchestrate business logic.

**Components**:
- **Use Cases**: Implementasi business operations
- **Security**: Password hashing, token management
- **Validation**: Input validation logic

**Dependencies**: Hanya bergantung pada Domains layer

**Example**:
```
src/Applications/
├── security/
├── use_case/
└── validation/
```

### 3. Infrastructures Layer (`src/Infrastructures/`)

**Purpose**: Implementasi detail teknis dan external dependencies.

**Components**:
- **Database**: Repository implementations
- **HTTP**: Server configuration
- **Security**: Concrete security implementations
- **Container**: Dependency injection

**Dependencies**: Bergantung pada Applications dan Domains layer

**Example**:
```
src/Infrastructures/
├── container/
├── database/
├── http/
├── repository/
└── security/
```

### 4. Interfaces Layer (`src/Interfaces/`)

**Purpose**: Entry point untuk external world (HTTP, CLI, etc.).

**Components**:
- **HTTP API**: Routes, handlers, middleware
- **Validation**: Request/response validation

**Dependencies**: Bergantung pada semua layer di bawahnya

**Example**:
```
src/Interfaces/
└── http/
    ├── api/
    └── middleware/
```

## Dependency Rule

```
Interfaces → Infrastructures → Applications → Domains
```

- **Inner layers** tidak boleh tahu tentang outer layers
- **Outer layers** boleh bergantung pada inner layers
- **Dependencies** selalu mengarah ke dalam (inward)

## Benefits

1. **Testability**: Setiap layer dapat ditest secara independent
2. **Maintainability**: Perubahan di satu layer tidak mempengaruhi layer lain
3. **Scalability**: Mudah menambah fitur baru tanpa merusak existing code
4. **Flexibility**: Mudah mengganti implementasi (database, framework, etc.)
5. **Business Logic Protection**: Core business logic terlindungi dari perubahan teknis

## Implementation Guidelines

### 1. Dependency Injection

```javascript
// Container configuration
const container = createContainer();

// Register dependencies
container.register({
  userRepository: asClass(UserRepositoryPostgres).singleton(),
  addUserUseCase: asClass(AddUserUseCase).singleton(),
});
```

### 2. Interface Segregation

```javascript
// Domain interface
class UserRepository {
  async addUser(registerUser) {
    throw new Error('USER_REPOSITORY.METHOD_NOT_IMPLEMENTED');
  }
}

// Infrastructure implementation
class UserRepositoryPostgres extends UserRepository {
  async addUser(registerUser) {
    // Implementation details
  }
}
```

### 3. Use Case Pattern

```javascript
class AddUserUseCase {
  constructor({ userRepository, passwordHash }) {
    this._userRepository = userRepository;
    this._passwordHash = passwordHash;
  }

  async execute(useCasePayload) {
    // Business logic implementation
  }
}
```

## Testing Strategy

### Unit Tests
- Test each layer independently
- Mock dependencies from outer layers
- Focus on business logic in Domains and Applications

### Integration Tests
- Test interaction between layers
- Use real database for repository tests
- Test complete use case flows

### End-to-End Tests
- Test complete API workflows
- Use test database
- Validate business scenarios

## Migration Guidelines

When adding new features:

1. **Start with Domain**: Define entities and interfaces
2. **Implement Use Cases**: Add business logic in Applications
3. **Add Infrastructure**: Implement repositories and external services
4. **Create Interfaces**: Add HTTP endpoints and validation
5. **Write Tests**: Cover all layers with appropriate tests

## Common Patterns

### Repository Pattern
```javascript
// Abstract repository in Domain
class ThreadRepository {
  async addThread(newThread) {
    throw new Error('THREAD_REPOSITORY.METHOD_NOT_IMPLEMENTED');
  }
}

// Concrete implementation in Infrastructure
class ThreadRepositoryPostgres extends ThreadRepository {
  async addThread(newThread) {
    // Database implementation
  }
}
```

### Use Case Pattern
```javascript
class AddThreadUseCase {
  constructor({ threadRepository }) {
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload) {
    const newThread = new NewThread(useCasePayload);
    return this._threadRepository.addThread(newThread);
  }
}
```

### Dependency Inversion
```javascript
// High-level module depends on abstraction
class AddUserUseCase {
  constructor({ userRepository }) { // Interface, not concrete class
    this._userRepository = userRepository;
  }
}

// Low-level module implements abstraction
class UserRepositoryPostgres extends UserRepository {
  // Implementation details
}
```