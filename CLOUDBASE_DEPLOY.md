# CloudBase Static Hosting Deploy

GardenOS is a Vite + React website. The build output is the root `dist` directory:

```text
dist/index.html
```

It does not generate `dist/dist` or `dist/green-rental-web`.

## Recommended: CloudBase Console Build

Use the CloudBase console to install, build, and upload the build output.

- Project name: `green-rental-web`
- Target directory / root: `./`
- Install command: `npm install`
- Build command: `npm run build`
- Build output directory: `./dist`
- Deploy path: `/`
- Environment ID: `cloud1-d0g1j85ue0333b913`
- Node version: `20` or newer

Do not put `tcb hosting deploy ./dist ...` in the console build command when the console already has `Build output directory: ./dist`. That double-deploy setup can produce `./dist/dist`.

Do not set the build output directory to:

```text
./dist/dist
./dist/green-rental-web
dist/dist
dist/green-rental-web
```

## Manual CLI Deploy

Only use this when deploying from your own terminal, not as the CloudBase console build command:

```bash
npm install
npm run build
tcb hosting deploy ./dist -e cloud1-d0g1j85ue0333b913
```

The deploy target is exactly `./dist`.
