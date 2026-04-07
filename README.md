# allenphant.github.io

Personal portfolio site for [allenphant](https://github.com/allenphant).

**Live site: https://allenphant.github.io**

## Stack

- [Astro](https://astro.build) — static site generator
- [Tailwind CSS v4](https://tailwindcss.com) — styling
- [React](https://react.dev) — interactive islands (project search, skill chart)
- GitHub GraphQL API — pulls repos, languages, and profile data at build time

## Local Development

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # production build → ./dist/
npm run preview  # preview build locally
```

Copy `.env.example` to `.env` and fill in your `GH_PAT` and `GH_USERNAME` before running locally.

## Deployment

Automatically deployed to GitHub Pages via GitHub Actions on every push to `main`, and rebuilt every 2 days to keep GitHub data fresh. Manual rebuild: Actions → Deploy to GitHub Pages → Run workflow.
