# Guide de Contribution — Edunet

Merci de vouloir contribuer à Edunet ! Ce guide vous explique comment participer au projet.

## Code de Conduite

Veuillez respecter notre [Code de Conduite](CODE_OF_CONDUCT.md) dans toutes vos interactions.

## avant de commencer

- Vérifiez que votre contribution n'existe pas déjà dans les [issues](https://github.com/aksantimyakaroland/edunet/issues)
- Consultez la [structure du projet](README.md#stack-technique)
- Assurez-vous d'avoir Node.js 18+ et npm 9+

## Processus de contribution

### 1. Fork et Clone

```bash
# Fork le repo (sur GitHub)
git clone https://github.com/<votre-username>/edunet.git
cd edunet
git add remote upstream https://github.com/aksantimyakaroland/edunet.git
```

### 2. Créer une branche

Nommez votre branche selon le type de modification :

```bash
# Fonctionnalité
git checkout -b feat/nom-de-la-feature

# Bug fix
git checkout -b fix/description-du-bug

# Documentation
git checkout -b docs/amelioration-docs

# Amélioration de code
git checkout -b refactor/description-du-refactor
```

### 3. Développer et tester

```bash
# Installer les dépendances
npm install

# Lancer le mode développement
npm run dev

# Builder pour tester la production
npm run build
npm run preview
```

### 4. Valider votre code

```bash
# Vérifier les types TypeScript
npx tsc --noEmit

# Linter et formatter (si disponible)
# npm run lint
# npm run format
```

### 5. Commit avec messages clairs

Format recommandé :

```
feat: Ajouter la recherche globale

- Implémente la recherche d'étudiants et groupes
- Ajoute un composant SearchBar réutilisable
- Met à jour les types TypeScript

Closes #42
```

Formats acceptés :
- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation
- `refactor:` — Code restructuring
- `perf:` — Performance improvement
- `test:` — Tests
- `ci:` — CI/CD
- `chore:` — Maintenance

### 6. Push et Pull Request

```bash
# Synchroniser avec upstream
git fetch upstream
git rebase upstream/main

# Push votre branche
git push origin feat/nom-de-la-feature
```

Créez une **Pull Request** sur GitHub avec :

- **Titre clair** : "feat: Description courte de la modification"
- **Description détaillée** :
  - Quoi : Ce que change la PR
  - Pourquoi : Raison de cette modification
  - Comment : Approche technique utilisée
  - Tests : Comment tester
  - Closes : Numéro de l'issue (ex: `Closes #42`)

**Modèle de PR :**

```markdown
## Quoi
Ajoute la recherche globale d'étudiants et groupes.

## Pourquoi
Les utilisateurs demandaient une recherche plus rapide et intuitive.

## Comment
- Nouveau composant `SearchBar.tsx`
- Intégration de TanStack React Query
- Dédoublonnage des résultats

## Tests
- [ ] Recherche d'étudiants par nom
- [ ] Recherche de groupes
- [ ] Cas limite : caractères spéciaux

## Closes
Closes #42
```

## Standards de code

### TypeScript

- Utilisez des **types explicites** pour les props
- Évitez `any` — utilisez `unknown` si nécessaire
- Types génériques nommés clairement

```tsx
// ✅ Bon
interface PostProps {
  id: string;
  content: string;
  likes: number;
}

// ❌ Mauvais
interface PostProps {
  id: any;
  content: any;
}
```

### React

- Composants fonctionnels avec hooks
- Custom hooks pour la logique partagée
- Propsvalidation avec TypeScript

```tsx
// ✅ Bon
const Post: React.FC<PostProps> = ({ id, content }) => {
  return <article>{content}</article>;
};

// ❌ Mauvais
function Post(props: any) {
  return <article>{props}</article>;
}
```

### Tailwind CSS

- Pas de CSS bruts, utiliser les classes Tailwind
- Classes dans l'ordre : layout → box → text → effects
- Grouper les responsives : `sm:`, `md:`, `lg:`

```tsx
// ✅ Bon
<div className="flex items-center justify-between gap-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">

// ❌ Mauvais
<div style={{ display: 'flex', padding: '16px' }} class="custom-div">
```

## Structure des fichiers

```
components/
  Post.tsx              # Composant principal
  Post.types.ts         # Types TypeScript (optionnel)
  Post.hooks.ts         # Custom hooks (optionnel)

services/
  api.ts                # Appels API
  supabase.ts           # Configuration Supabase

types.ts                # Types globaux
```

## Avant de soumettre

- [ ] Code testé localement
- [ ] TypeScript sans erreurs (`npx tsc --noEmit`)
- [ ] Pas de `console.log` ou `debugger` en production
- [ ] Commit messages clairs et en Français/Anglais
- [ ] PR décrit clairement les changements
- [ ] Respectez le Code de Conduite

## Questions ou besoin d'aide ?

- Créez une [issue](https://github.com/aksantimyakaroland/edunet/issues) pour les questions
- Discutez avant de commencer une grosse modification
- N'hésitez pas à mentionner `@aksantimyakaroland` pour des clarifications

## License

En contribuant, vous acceptez que votre code soit sous la même license que le projet.

---

Merci de rendre Edunet meilleur ! 🙌
