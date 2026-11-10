# runStitch 🧵

A modern, web-based, client-side cross-stitch design application with Photoshop-style layers, DMC floss management, image digitization, typography engines, and printable pattern generation.

Built with **Svelte**, **Vite**, and **TailwindCSS**, and deployed to [runprogram.run/runStitch](https://runprogram.run/runStitch/).

## Development

```bash
npm install
npm run dev
```

## Production Build & Deployment

```bash
npm run build
npm run preview
```

Pushing to `main` on GitHub automatically triggers `.github/workflows/deploy.yml`, which builds `./dist` (with `base: '/runStitch/'`) and publishes it to the `gh-pages` branch so GitHub Pages serves it at `https://runprogram.run/runStitch/`.

> **SSH Account Note:** On this machine, the personal `mhibbs` GitHub SSH key is configured under the host alias `github.com-mhibbs` in `~/.ssh/config` (`git@github.com-mhibbs:mhibbs/runStitch.git`).

## Documentation
* See [PROJECT_BRIEF.md](PROJECT_BRIEF.md) for full architectural specs, data structures, and milestone plans.
