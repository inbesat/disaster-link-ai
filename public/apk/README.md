# SafeSphere Android APK

The installable Android build of SafeSphere is served from `/safesphere.apk`
(file: `public/safesphere.apk`). The APK is a Capacitor WebView wrapper that
loads the live production site, so all server features (auth, Supabase,
alerts, offline sync) work inside the app.

## The APK

`safesphere.apk` — the debug-signed APK that anyone can download and side-load
onto an Android phone (Settings → Security → "Install unknown apps" is
required; a warning may appear because it is not from Google Play).

## How the APK gets here

It is built automatically by GitHub Actions
(`.github/workflows/build-apk.yml`). The workflow:

1. Runs `npx cap sync android`
2. Builds the debug APK with Gradle
3. Commits the resulting `safesphere.apk` into `public/`
4. Vercel redeploys the site, so `/safesphere.apk` is live

### Rebuilding after a domain change

If the production domain changes, update `server.url` in
`capacitor.config.ts`, then trigger the **"Build Android APK"** workflow
manually (Actions → Build Android APK → Run workflow). The new APK is built
and committed automatically.