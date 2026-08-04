# Project workflow

For every completed website change:

1. Run `npm run validate`.
2. If validation succeeds, run `npm run deploy`.
3. Confirm the Vercel deployment is `Ready` and aliased to `https://ayumad.me`.
4. Report the production URL and verification result in the final handoff.

Do not deploy a failing build. Keep normal source-control work on a branch and
use a pull request; Vercel's GitHub integration automatically deploys changes
that reach `main`.
