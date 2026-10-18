# Minimal device-only beta

From the repository root, run `node vercel-beta/build.mjs`, then `node vercel-beta/test.mjs`. Import the reviewed Git branch into Vercel with repository-root settings in ../VERCEL-DEPLOYMENT.md. The beta build has no package dependencies.

Dist and vercel.json are deterministic generated outputs. Root vercel.json is committed so Vercel reads the static build/output/headers before building. If app-shell or assets change, run the builder and tests again and commit the resulting config. Never put records, tokens or backups here.
