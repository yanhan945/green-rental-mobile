# CloudBase Static Hosting Deploy

GardenOS is a Vite + React website. The build output is the root `dist` directory.

## CloudBase settings

- Project name: `green-rental-web`
- Target directory / root: `./`
- Install command: `npm install`
- Build command: `npm run build`
- Build output directory: `./dist`
- Deploy path: `/`
- Environment ID: `cloud1-d0g1j85ue0333b913`

Do not set the build output directory to `./dist/green-rental-web` unless the build command is changed to generate that subdirectory.

## Manual CLI deploy

```bash
npm install
npm run build
tcb hosting deploy ./dist -e cloud1-d0g1j85ue0333b913
```

If the CloudBase console shows `Path does not exist: /root/cloudbase-workspace/dist`, check that the build step actually ran before `tcb hosting deploy`.
