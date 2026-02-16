# Folder Structure Review – ETHDenver2026Buidlathon

Review date: Feb 12, 2026. This document summarizes inconsistencies and recommended updates for the ChainForge AI project layout and docs.

---

## 1. Current Layout (Actual)

```
ETHDenver2026Buidlathon/
├── chainforge-ai/           # Next.js app
│   ├── app/
│   │   ├── api/
│   │   │   ├── ai/caption/route.ts, suggest-event/route.ts
│   │   │   └── arweave/post-blob/route.ts, post-support/route.ts
│   │   ├── chain/[genesis]/page.tsx
│   │   ├── continue/page.tsx      # ← Not in ProjectPlan Section 3
│   │   ├── verify/page.tsx
│   │   ├── globals.css, layout.tsx, page.tsx
│   │   └── (no app-level loading/error/not-found)
│   ├── components/
│   │   ├── ChainVisualizer, EventBuilder, GenesisWizard, etc.
│   │   └── ui/ (button, card, input)
│   ├── lib/
│   │   ├── ai.ts, utils.ts, validate-address.ts, wagmi-config.ts
│   │   └── chainroute/
│   │       ├── build-blob.ts, build-payload.ts, index.ts
│   │       ├── polygon-anchor.ts, types.ts, validate-blob.ts, verifier.ts
│   │       └── (no arweave-utils.ts – Arweave in API routes)
│   ├── next-env.d.ts, next.config.ts, package.json, postcss.config.mjs
│   ├── tailwind.config.ts, tsconfig.json, vercel.json
│   └── README.md
├── chainforge-ai-presentation.html
├── LICENSE
└── ProjectPlan.md
```

---

## 2. Inconsistencies & Gaps

### 2.1 ProjectPlan.md vs implementation

| Item | ProjectPlan (Section 3) | Actual | Action |
|------|-------------------------|--------|--------|
| **Continue flow** | Not listed in structure | `app/continue/page.tsx` exists | Add `/continue` to ProjectPlan structure and Flow. |
| **lib/chainroute** | Lists `arweave-utils.ts` | No such file; Arweave in `app/api/arweave/*` + `build-blob` / `validate-blob` | Update plan to reflect API routes + build-blob/validate-blob. |
| **public/demo/** | Optional HypotheticalPainting | Folder does not exist | Optional: add `public/demo/` or document that examples live in `docs/examples/HypotheticalPainting`. |
| **types/** | Top-level `types/` | No top-level types folder; types in `lib/chainroute/types.ts` | Plan can note “types in lib/chainroute” or drop `types/` from structure. |
| **Dependencies** | `npm install ... @bundlr-network/client` | `package.json` has `arweave` only; no Bundlr | Update plan: use direct Arweave (no Bundlr) or add Bundlr if reintroduced. |

### 2.2 README.md

- **Flow** – Documents “View chain at `/chain/[genesis]`, verify at `/verify`” but does not mention **Continue** (`/continue`). Users need to know they can continue an existing chain.
- **Run instructions** – “cd ETHDenver2026Buidlathon/chainforge-ai” is correct from repo root; consider adding “or `cd chainforge-ai` when already in ETHDenver2026Buidlathon.”
- **Env** – Env vars are described but there is no `.env.example`; adding one improves local setup.

### 2.3 Missing files / config

- **.env.example** – Done. Added under `chainforge-ai/` with placeholders for the four env vars (optional for basic run).
- **ESLint config** – Done. Added `eslint.config.mjs` using FlatCompat to extend `next/core-web-vitals` and `next/typescript`.

### 2.4 Naming

- **Root** – `ChainForge-AI-Presentation.html` uses “ChainForge-AI” and capitals; app folder and package are `chainforge-ai`. Acceptable; Done: renamed to `chainforge-ai-presentation.html` for consistency.

### 2.5 UX / navigation

- **Chain viewer** – `/chain/[genesis]` has no link to “Verify this chain” (e.g. to `/verify` with genesis/tx pre-filled). Done: link added.

---

## 3. What’s consistent

- **Routes** – `@/` path alias and imports from `@/lib/chainroute/*`, `@/components/*` are consistent; no broken imports found.
- **Next.js** – App Router: `page.tsx`, `layout.tsx`, `route.ts` usage and placement are correct.
- **ChainRoute lib** – `lib/chainroute/index.ts` re-exports as expected; build-payload, polygon-anchor, verifier, types, build-blob, validate-blob are used correctly.
- **Navigation** – Home, Continue, Verify, and Chain links are used consistently across pages.
- **Config** – `tsconfig.json` paths, `tailwind.config.ts` content paths, `next.config.ts`, `vercel.json` are coherent with the current structure.

---

## 4. Recommended updates (summary)

1. **ProjectPlan.md** – Add `app/continue/page.tsx` to Section 3 structure; align lib/chainroute and dependencies (no `arweave-utils.ts`, no Bundlr unless re-added); optionally note `public/demo/` and types location.
2. **README.md** – Add `/continue` to the Flow section; optionally clarify `cd` from Buidlathon folder; reference `.env.example` for env setup.
3. **.env.example** – Add under `chainforge-ai/` with commented placeholders for the env vars in README.
4. **Optional** – Add “Verify this chain” link on `/chain/[genesis]` to `/verify`; add `eslint.config.mjs` if you want explicit ESLint config; align presentation filename—all done (link, eslint.config.mjs, presentation renamed). See Section 5.

---

## 5. Implementation status (post-update)

All recommended updates from Section 4 have been implemented. ProjectPlan and README reflect the current structure; `.env.example`, `eslint.config.mjs`, chain viewer Verify link, and presentation filename are in place. Lint passes (`npm run lint`); remaining react-hooks/exhaustive-deps warnings are intentional (stable dependency keys).
