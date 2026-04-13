# Edunet — Réseau Social Académique de l'UOB

> Plateforme officielle de collaboration pour les étudiants de l'**Université Officielle de Bukavu** (UOB), Bukavu, République Démocratique du Congo.

**Développeur :** Roland Myaka

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 19 · TypeScript · Tailwind CSS |
| Backend / BDD | Supabase (Auth · PostgreSQL · Storage · Realtime) |
| Routage | React Router DOM v7 |
| Cache | TanStack React Query v5 |
| Notifications Push | Web Push API · Service Worker (VAPID) |
| Bundler | Vite 6 |

---

## Fonctionnalités

- 📰 **Fil d'actualité** — Publications texte, images, PDF, likes, commentaires imbriqués
- 👥 **Groupes académiques** — Espaces publics ou privés (par filière, promotion, projet)
- 💬 **Chat temps réel** — Messagerie privée avec audio, fichiers, réponses imbriquées
- 🔔 **Notifications push** — Alertes instantanées même application fermée
- 👤 **Profils étudiants** — Filière, promotion L1–L5, compétences, biographie
- 🔍 **Recherche globale** — Étudiants, groupes, publications
- 📱 **PWA** — Installable sur Android et iOS

---

## Installation

```bash
# 1. Cloner
git clone https://github.com/<org>/edunet.git && cd edunet

# 2. Installer les dépendances
npm install

# 3. Variables d'environnement
cp .env.example .env.local
# → Remplir VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_VAPID_PUBLIC_KEY

# 4. Lancer
npm run dev        # http://localhost:3000

# 5. Build production
npm run build
```

---

## Variables d'environnement

```env
# Supabase (Dashboard > Settings > API)
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Notifications push VAPID (générer avec : npx web-push generate-vapid-keys)
VITE_VAPID_PUBLIC_KEY=BOo...
# VAPID_PRIVATE_KEY → Supabase Dashboard > Edge Functions > Secrets (jamais côté client)
```

---

## Charte graphique UOB

| Couleur | Hex | Classe Tailwind | Usage |
|---|---|---|---|
| Bleu institutionnel | `#0047AB` | `uob-blue` | Actions primaires, liens actifs |
| Blanc | `#FFFFFF` | — | Fonds, cartes |
| Rouge accent | `#CE1126` | `uob-red` | Alertes, badges, danger |

---

## Promotions académiques

| Valeur | Libellé | Cycle |
|---|---|---|
| L1 | Licence 1 | Licence |
| L2 | Licence 2 | Licence |
| L3 | Licence 3 | Licence |
| L4 | Master 1 | Master |
| L5 | Master 2 | Master |

---

## Logo

Remplacer `/logo-uob.png` dans `public/` par le logo officiel UOB.
Mettre à jour également `public/manifest.json` et `public/service-worker.js`.

---

## Git

```bash
git init
git add .
git commit -m "feat: Edunet UOB — Roland Myaka"
git remote add origin https://github.com/<org>/edunet.git
git push -u origin main
```

---

© 2025 Université Officielle de Bukavu — Tous droits réservés.
