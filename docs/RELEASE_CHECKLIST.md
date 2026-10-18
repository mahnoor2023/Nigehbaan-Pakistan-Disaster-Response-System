# Release Checklist

## Automated checks

- [ ] Review `git status`, staged file list and `git diff --cached` before creating a release commit.
- [ ] `npm.cmd test`
- [ ] `npm.cmd run lint`
- [ ] `npm.cmd run typecheck`
- [ ] `npm.cmd run build`
- [ ] `git diff --check`
- [ ] Confirm `.next`, `node_modules`, local caches, logs and temporary browser profiles are not staged.
- [ ] Confirm no `.env` files, credentials or private data are staged.

## GitHub and Vercel

- Repository: `https://github.com/mahnoor2023/Nigehbaan-Pakistan-Disaster-Response-System`
- Release branch: record the exact reviewed branch and commit SHA after the push is verified.
- In Vercel, import the existing repository and choose that branch. Use the repository root and the detected Next.js framework defaults. Build command: `next build` (or `npm run build`). No environment variables are required by the current code.
- Do not treat a successful push as a successful deployment. Wait for Vercel's build result separately.

## Manual live-site checks

- [ ] Load Overview, Coverage, Command, Households, Missions, Shelters, Field, Analytics and About.
- [ ] Change district and confirm the URL and displayed scenario remain aligned.
- [ ] Verify the Malir map, attribution and fallback when tiles are unavailable.
- [ ] Verify weather unavailable state when the external model endpoint cannot be reached.
- [ ] Create and advance a demo mission; confirm it does not imply a real dispatch or automatic shelter arrival.
- [ ] Check desktop and 390px mobile navigation, forms and page overflow.
- [ ] Confirm synthetic-data disclosures remain visible.

## Submission readiness and rollback

- [ ] Review the deployed routes and the final demo script before sharing the URL.
- [ ] State clearly that Nigehbaan is a simulation prototype with browser-local mission state.
- [ ] Keep the prior successful Vercel deployment available. If the new deployment has a release-blocking fault, use Vercel's rollback/redeploy control to restore the prior deployment; then investigate from the reviewed Git commit.
- [ ] No emergency-response or operational availability claims are made.
