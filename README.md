# Edunet — Réseau Social Académique de l'UOB

<div align="center">

> Plateforme officielle de collaboration pour les étudiants de l'**Université Officielle de Bukavu** (UOB), Bukavu, République Démocratique du Congo.

**👨‍💻 Développeur :** Roland Myaka

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?style=flat&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3+-06B6D4?style=flat&logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat&logo=supabase)
![Vite](https://img.shields.io/badge/Vite-6+-646CFF?style=flat&logo=vite)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

## 🛠️ Stack Technique

| Couche | Technologie |
|---|---|
| **Frontend** | ![React](https://img.shields.io/badge/-React%2019-61DAFB?logo=react&logoColor=white&style=flat-square) ![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white&style=flat-square) ![Tailwind CSS](https://img.shields.io/badge/-Tailwind%20CSS-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square) |
| **Backend / BDD** | ![Supabase](https://img.shields.io/badge/-Supabase-3ECF8E?logo=supabase&logoColor=white&style=flat-square) ![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-336791?logo=postgresql&logoColor=white&style=flat-square) |
| **Routage** | ![React Router](https://img.shields.io/badge/-React%20Router%20v7-CA4245?logo=react-router&logoColor=white&style=flat-square) |
| **Cache** | ![TanStack Query](https://img.shields.io/badge/-TanStack%20Query%20v5-FF4154?logo=react-query&logoColor=white&style=flat-square) |
| **Notifications** | ![Web Push API](https://img.shields.io/badge/-Web%20Push%20API-FFB81C?style=flat-square) Service Worker (VAPID) |
| **Bundler** | ![Vite](https://img.shields.io/badge/-Vite%206-646CFF?logo=vite&logoColor=white&style=flat-square) |

---

## ✨ Fonctionnalités

| Fonctionnalité | Description |
|---|---|
| 📰 **Fil d'actualité** | Publications texte, images, PDF, likes, commentaires imbriqués |
| 👥 **Groupes académiques** | Espaces publics ou privés (par filière, promotion, projet) |
| 💬 **Chat temps réel** | Messagerie privée avec audio, fichiers, réponses imbriquées |
| 🔔 **Notifications push** | Alertes instantanées même application fermée |
| 👤 **Profils étudiants** | Filière, promotion L1–L5, compétences, biographie |
| 🔍 **Recherche globale** | Étudiants, groupes, publications |
| 📱 **PWA** | Installable sur Android et iOS |

---

## 🚀 Installation

```bash
# 1️⃣ Cloner le repository
git clone https://github.com/aksantimyakaroland/edunet.git && cd edunet

# 2️⃣ Installer les dépendances
npm install

# 3️⃣ Configurer les variables d'environnement
cp .env.example .env.local
# → Remplir VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_VAPID_PUBLIC_KEY

# 4️⃣ Lancer le serveur de développement
npm run dev        # 🌐 http://localhost:3000

# 5️⃣ Build production
npm run build
```

---

## ⚙️ Variables d'Environnement

Créez un fichier `.env.local` avec :

```env
# 🔑 Supabase (Dashboard > Settings > API)
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# 🔔 Notifications Push VAPID
# Générer avec : npx web-push generate-vapid-keys
VITE_VAPID_PUBLIC_KEY=BOo...

# ⚠️ VAPID_PRIVATE_KEY → Supabase Dashboard > Edge Functions > Secrets
# Ne JAMAIS exposer côté client !
```

---

## 🎨 Charte Graphique UOB

| Couleur | Hex | Tailwind | Usage |
|---|---|---|---|
| **Bleu institutionnel** | `#0047AB` | `uob-blue` | 🎯 Actions primaires, liens actifs |
| **Blanc** | `#FFFFFF` | — | ⬜ Fonds, cartes |
| **Rouge accent** | `#CE1126` | `uob-red` | 🔴 Alertes, badges, danger |

---

## 🎓 Promotions Académiques

| Valeur | Libellé | Cycle |
|---|---|---|
| **L1** | Licence 1 | 🎓 Licence |
| **L2** | Licence 2 | 🎓 Licence |
| **L3** | Licence 3 | 🎓 Licence |
| **L4** | Master 1 | 🏆 Master |
| **L5** | Master 2 | 🏆 Master |

---

## 🖼️ Logo

Remplacer `/logo-uob.png` dans `public/` par le logo officiel UOB.
Mettre à jour également :
- `public/manifest.json`
- `public/service-worker.js`

---

## 📚 Git & Contribution

```bash
# Initialiser un repo local
git init
git add .
git commit -m "feat: Edunet UOB — Roland Myaka"
git remote add origin https://github.com/aksantimyakaroland/edunet.git
git push -u origin main
```

📖 **Voir [CONTRIBUTING.md](CONTRIBUTING.md)** pour les normes de contribution.
📜 **Voir [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)** pour le code de conduite.

---

© 2026 Université Officielle de Bukavu — Tous droits réservés.
