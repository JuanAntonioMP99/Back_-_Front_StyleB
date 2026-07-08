# Git Workflow - Version Control Best Practices

**Scope:** workflow
**Trigger:** cuando se trabaje con Git, control de versiones, commits, branches, o flujos de trabajo en equipo
**Tools:** view, file_create, str_replace, bash_tool
**Version:** 1.0.0

---

## Propósito

Esta skill te guía para usar Git de manera profesional. Cubre desde comandos básicos hasta workflows avanzados, conventional commits, Git Flow, trunk-based development, resolución de conflictos y mejores prácticas para equipos.

## Cuándo Usar Esta Skill

- Configurar Git en proyectos nuevos
- Trabajar en equipos con branches
- Escribir commits profesionales
- Resolver conflictos
- Hacer code reviews con Pull Requests
- Mantener historial limpio
- Colaborar en open source

## Fundamentos

### Configuración Inicial

```bash
# Configurar identidad
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"

# Editor por defecto
git config --global core.editor "code --wait"  # VS Code
git config --global core.editor "vim"          # Vim

# Aliases útiles
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.lg "log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"

# Ver configuración
git config --list
```

### Comandos Básicos

```bash
# Inicializar repo
git init

# Clonar repo
git clone https://github.com/user/repo.git

# Ver estado
git status

# Agregar archivos
git add file.txt
git add .                # Todos los cambios
git add *.js             # Patrón

# Commit
git commit -m "mensaje"
git commit -am "mensaje" # Add + commit (tracked files)

# Ver historial
git log
git log --oneline
git log --graph --all
git log -p              # Con diff
git log --author="John"
git log --since="2 weeks ago"

# Ver cambios
git diff               # Working dir vs staged
git diff --staged      # Staged vs último commit
git diff HEAD          # Working dir vs último commit

# Deshacer cambios
git restore file.txt         # Descartar cambios en working dir
git restore --staged file.txt # Unstage
git reset HEAD~1             # Deshacer último commit (mantener cambios)
git reset --hard HEAD~1      # Deshacer último commit (descartar cambios)
```

## Branches

### Comandos de Branch

```bash
# Crear branch
git branch feature/nueva-feature

# Cambiar de branch
git checkout feature/nueva-feature
# o en Git 2.23+
git switch feature/nueva-feature

# Crear y cambiar (shortcut)
git checkout -b feature/nueva-feature
git switch -c feature/nueva-feature

# Listar branches
git branch           # Locales
git branch -r        # Remotos
git branch -a        # Todos

# Eliminar branch
git branch -d feature/completed  # Safe delete
git branch -D feature/old        # Force delete

# Renombrar branch
git branch -m old-name new-name

# Ver último commit de cada branch
git branch -v
```

### Merge

```bash
# Merge feature branch into main
git checkout main
git merge feature/nueva-feature

# Merge con fast-forward deshabilitado (crea merge commit)
git merge --no-ff feature/nueva-feature

# Abortar merge con conflictos
git merge --abort
```

### Rebase

```bash
# Rebase feature sobre main
git checkout feature/nueva-feature
git rebase main

# Rebase interactivo (reordenar, editar commits)
git rebase -i HEAD~3

# Continue después de resolver conflictos
git rebase --continue

# Abortar rebase
git rebase --abort

# Rebase vs Merge:
# Merge: Mantiene historial, crea merge commits
# Rebase: Historial lineal, no merge commits
```

## Conventional Commits

### Formato

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

```
feat:     Nueva feature
fix:      Bug fix
docs:     Documentación
style:    Formato (no afecta código)
refactor: Refactorizar (no bug ni feature)
perf:     Performance improvements
test:     Agregar/modificar tests
build:    Build system o dependencias
ci:       CI configuration
chore:    Otras tareas (gitignore, etc)
revert:   Revertir commit anterior
```

### Ejemplos

```bash
# Feature
git commit -m "feat(auth): add JWT authentication"

# Bug fix
git commit -m "fix(api): handle null response from users endpoint"

# Breaking change
git commit -m "feat(api)!: change response format

BREAKING CHANGE: API now returns data in {data, meta} format"

# Con scope y body
git commit -m "refactor(database): optimize query performance

- Add index on user_id column
- Remove unnecessary joins
- Use connection pooling"

# Multiple paragraphs
git commit -m "feat(payment): integrate Stripe

Implemented payment processing with Stripe API.
Includes webhook handlers for payment events.

Closes #123"
```

## Git Flow

### Branches en Git Flow

```
main/master     - Production-ready code
develop         - Integration branch
feature/*       - New features
release/*       - Release preparation
hotfix/*        - Production bug fixes
```

### Workflow

```bash
# 1. Feature development
git checkout develop
git checkout -b feature/user-profile
# ... hacer cambios ...
git add .
git commit -m "feat(profile): add user profile page"

# 2. Terminar feature
git checkout develop
git merge --no-ff feature/user-profile
git branch -d feature/user-profile
git push origin develop

# 3. Crear release
git checkout develop
git checkout -b release/1.2.0
# ... bumping version, changelog ...
git commit -m "chore(release): bump version to 1.2.0"

# 4. Release to production
git checkout main
git merge --no-ff release/1.2.0
git tag -a v1.2.0 -m "Release version 1.2.0"

git checkout develop
git merge --no-ff release/1.2.0
git branch -d release/1.2.0

# 5. Hotfix
git checkout main
git checkout -b hotfix/critical-bug
# ... fix bug ...
git commit -m "fix(auth): resolve login timeout issue"

git checkout main
git merge --no-ff hotfix/critical-bug
git tag -a v1.2.1 -m "Hotfix 1.2.1"

git checkout develop
git merge --no-ff hotfix/critical-bug
git branch -d hotfix/critical-bug
```

## Trunk-Based Development

### Filosofía

- Una branch principal (main/trunk)
- Feature branches cortos (<1 día)
- Integración continua
- Feature flags para features incompletas

### Workflow

```bash
# 1. Crear feature branch corto
git checkout main
git pull origin main
git checkout -b feature/quick-fix

# 2. Hacer cambios pequeños
# ... cambios ...
git add .
git commit -m "feat(ui): add loading spinner"

# 3. Sync con main frecuentemente
git checkout main
git pull origin main
git checkout feature/quick-fix
git rebase main

# 4. Push y PR rápido
git push origin feature/quick-fix
# Crear PR, code review rápido

# 5. Merge a main
# Después de merge, delete branch inmediatamente
```

## Pull Requests

### Crear PR de Calidad

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots
(if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
```

### Code Review Best Practices

**Como Reviewer:**
- Review quickly (< 24 hours)
- Comment on what's good
- Ask questions, don't demand
- Suggest improvements with examples
- Approve if minor issues
- Don't nitpick style if linter exists
- Don't be rude or condescending

**Como Author:**
- Keep PRs small (<400 lines)
- Write descriptive title/description
- Respond to all comments
- Thank reviewers
- Fix issues or explain why not
- Don't take feedback personally
- Don't merge without approval

## Conflictos

### Resolver Conflictos

```bash
# Durante merge
git merge feature/branch
# CONFLICT en file.txt

# 1. Ver conflictos
git status

# 2. Abrir archivo con conflictos
# <<<<<<< HEAD
# Código en tu branch
# =======
# Código en el otro branch
# >>>>>>> feature/branch

# 3. Editar archivo, resolver conflictos

# 4. Mark as resolved
git add file.txt

# 5. Complete merge
git commit

# Durante rebase
git rebase main
# CONFLICT en file.txt

# Resolver y continuar
git add file.txt
git rebase --continue

# O skip commit si no es necesario
git rebase --skip

# O abort
git rebase --abort
```

## Tags

```bash
# Crear tag
git tag v1.0.0
git tag -a v1.0.0 -m "Version 1.0.0"

# Listar tags
git tag
git tag -l "v1.*"

# Push tags
git push origin v1.0.0
git push origin --tags  # Todos los tags

# Eliminar tag
git tag -d v1.0.0               # Local
git push origin --delete v1.0.0  # Remote

# Checkout tag
git checkout v1.0.0
```

## Comandos Avanzados

### Stash

```bash
# Guardar cambios temporalmente
git stash
git stash save "work in progress"

# Listar stashes
git stash list

# Aplicar stash
git stash apply           # Último stash, lo mantiene
git stash pop             # Último stash, lo elimina
git stash apply stash@{2} # Stash específico

# Eliminar stash
git stash drop stash@{0}
git stash clear  # Todos
```

### Cherry-pick

```bash
# Aplicar commit específico a branch actual
git cherry-pick abc123

# Multiple commits
git cherry-pick abc123 def456

# Sin commit automático
git cherry-pick -n abc123
```

### Reflog

```bash
# Ver historial de referencias
git reflog

# Recuperar commit "perdido"
git reflog
git checkout abc123
git checkout -b recovered-branch
```

### Blame

```bash
# Ver quién modificó cada línea
git blame file.txt
git blame -L 10,20 file.txt  # Líneas 10-20
```

## .gitignore

```bash
# .gitignore

# Node
node_modules/
npm-debug.log
.env

# Python
__pycache__/
*.py[cod]
venv/
.env

# Java
target/
*.class
*.jar

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Build
dist/
build/
*.log
```

## Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| fatal: not a git repository | No hay repo git | git init |
| Please commit or stash | Cambios sin commit | git stash o git commit |
| fatal: refusing to merge unrelated histories | Historias diferentes | git pull --allow-unrelated-histories |
| CONFLICT | Cambios conflictivos | Resolver manualmente |

## Checklist Diario

- [ ] Pull antes de empezar a trabajar
- [ ] Crear branch para nueva feature
- [ ] Commits atómicos y frecuentes
- [ ] Mensajes de commit descriptivos
- [ ] Push al menos una vez al día
- [ ] Sync con main regularmente
- [ ] Code review antes de merge
- [ ] Delete branches después de merge

## Best Practices

1. **Commit Often** - Commits pequeños y frecuentes
2. **Descriptive Messages** - Conventional commits
3. **Branch Strategy** - Git Flow o Trunk-Based
4. **Pull Before Push** - Evitar conflictos
5. **Review Code** - PR reviews obligatorios
6. **Protect Main** - Branch protection rules
7. **Tag Releases** - Versionar releases
8. **Clean History** - Rebase antes de merge
9. **.gitignore** - No commitear archivos innecesarios
10. **Backup** - Push a remote frecuentemente

---

**Última actualización:** Fase 6 - DevOps & Workflow
**Mantenedor:** Sistema de Skills
**Siguiente:** Testing Strategies para asegurar calidad
