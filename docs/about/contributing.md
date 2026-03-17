# Contributing to Mint

Thank you for your interest in contributing to Mint! This guide will help you get started.

## Ways to Contribute

There are many ways to contribute to Mint:

- 🐛 **Report bugs** - Help us identify and fix issues
- 💡 **Suggest features** - Share ideas for improvements
- 📖 **Improve documentation** - Make docs clearer and more comprehensive
- 🔧 **Submit pull requests** - Fix bugs or add features
- ⭐ **Star the repository** - Show your support

## Getting Started

### 1. Fork the Repository

Fork the [Mint repository](https://github.com/sreekarnv/mint) to your GitHub account.

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/mint.git
cd mint
```

### 3. Set Up Development Environment

Follow the [Development Guide](../development.md) to set up your local environment.

### 4. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

## Development Workflow

### Running Services Locally

```bash
# Start infrastructure
docker compose up mongodb rabbitmq

# Run services with hot-reload
cd auth && pnpm dev
cd wallet && pnpm dev
cd transactions && pnpm dev
cd notifications && pnpm dev
```

### Code Quality

Before submitting changes:

```bash
# Format code
pnpm format

# Lint code
pnpm lint

# Fix linting issues
pnpm lint --fix
```

## Commit Guidelines

### Commit Message Format

Use conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or tooling changes

**Examples:**
```
feat(auth): add password reset functionality
fix(wallet): resolve race condition in balance updates
docs(api): update transaction endpoint examples
refactor(transactions): simplify event handling logic
```

### Best Practices

- Write clear, descriptive commit messages
- Keep commits focused and atomic
- Reference issue numbers when applicable (`Closes #123`)
- Test your changes before committing

## Pull Request Process

### 1. Update Your Branch

```bash
git fetch upstream
git rebase upstream/main
```

### 2. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 3. Create Pull Request

1. Go to the [Mint repository](https://github.com/sreekarnv/mint)
2. Click "New Pull Request"
3. Select your fork and branch
4. Fill out the PR template

### PR Checklist

- [ ] Code follows the existing style
- [ ] Commits follow conventional commit format
- [ ] Code has been tested locally
- [ ] Documentation has been updated
- [ ] No console.log or debug code left in
- [ ] All linting passes
- [ ] PR description clearly describes changes

## Code Style

### TypeScript

- Use TypeScript for all new code
- Define proper types (avoid `any`)
- Use interfaces for object shapes
- Prefer `const` over `let`

### File Structure

```typescript
// 1. Imports
import { Request, Response } from 'express';
import { UserService } from '~/services/user.service';

// 2. Types/Interfaces
interface CreateUserRequest {
  name: string;
  email: string;
}

// 3. Functions
export async function createUser(req: Request, res: Response) {
  // Implementation
}
```

### Naming Conventions

- **Files**: kebab-case (`user-service.ts`)
- **Classes**: PascalCase (`UserService`)
- **Functions**: camelCase (`createUser`)
- **Constants**: UPPER_CASE (`MAX_RETRIES`)
- **Interfaces**: PascalCase (`IUser` or `User`)

## Testing

### Manual Testing

Test your changes:

```bash
# Register user
curl -X POST http://localhost/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "email": "test@example.com", "password": "Test123!"}'

# Verify functionality works
```

### Integration Testing

Ensure existing functionality still works:

1. Run the full system with Docker Compose
2. Test the complete user flow
3. Check RabbitMQ for proper event flow
4. Verify all services remain healthy

## Documentation

### Update Documentation

If your change affects:

- **API**: Update `docs/api/*.md`
- **Configuration**: Update `docs/getting-started/configuration.md`
- **Architecture**: Update `docs/architecture.md`
- **Events**: Update `docs/events.md`

### Documentation Style

- Use clear, concise language
- Include code examples
- Add diagrams where helpful (Mermaid)
- Keep formatting consistent

## Reporting Bugs

### Before Reporting

1. Check existing issues
2. Try the latest version
3. Test in a clean environment

### Bug Report Template

```markdown
**Description**
A clear description of the bug.

**Steps to Reproduce**
1. Start services
2. Call endpoint X
3. Observe error Y

**Expected Behavior**
What should happen.

**Actual Behavior**
What actually happens.

**Environment**
- OS: [e.g., macOS 14.1]
- Docker version: [e.g., 24.0.7]
- Node version: [e.g., 22.x]

**Logs**
```
Paste relevant logs here
```
```

## Suggesting Features

### Feature Request Template

```markdown
**Problem Statement**
What problem does this solve?

**Proposed Solution**
How should this work?

**Alternatives Considered**
Other approaches you've thought about.

**Additional Context**
Any other relevant information.
```

## Code Review

### What We Look For

- ✅ Code quality and readability
- ✅ Test coverage
- ✅ Documentation updates
- ✅ Performance implications
- ✅ Security considerations
- ✅ Breaking changes clearly noted

### Review Process

1. Automated checks run (linting, etc.)
2. Maintainer reviews code
3. Feedback provided
4. Changes requested or approved
5. PR merged

## Community Guidelines

### Be Respectful

- Be welcoming to newcomers
- Respect different viewpoints
- Accept constructive criticism
- Focus on the code, not the person

### Communication

- Ask questions if unclear
- Provide context in discussions
- Be patient with responses
- Help others when you can

## Recognition

Contributors will be:

- Listed in release notes
- Acknowledged in the README
- Mentioned in commit history

## Questions?

- **GitHub Issues**: [Report bugs or ask questions](https://github.com/sreekarnv/mint/issues)
- **Documentation**: Check the [docs](../index.md)
- **Email**: Contact the maintainer

## Thank You!

Every contribution helps make Mint better. Thank you for being part of the project! 🎉

---

## Quick Links

- [Development Guide](../development.md)
- [Architecture Overview](../architecture.md)
- [API Reference](../api/auth.md)
- [License](license.md)
