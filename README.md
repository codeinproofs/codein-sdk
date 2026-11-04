# @codein/sdk

TypeScript client for the [CodeIn](https://github.com/codeinproofs/codein) launch API.

```bash
npm i @codein/sdk
```

```ts
import { CodeInClient } from "@codein/sdk";

const codein = new CodeInClient({ baseUrl: "http://localhost:8000" });

const draft = await codein.preview(
  "realtime community chat with voice rooms",
  "discord-like",
);

const app = await codein.create({
  idea: draft.idea,
  template: draft.template,
  name: draft.name,
  ticker: draft.ticker,
  description: draft.description,
});

const stop = codein.stream(app.id, (ev) => {
  if (ev.type === "file") console.log("file", ev.path);
  if (ev.type === "done") console.log("shipped", ev.app.vercel_deployment_url);
});
```

## Install & build

```bash
npm install
npm run build
npm test
```

## API surface

| Method | Description |
|--------|-------------|
| `preview(idea, template?)` | Dry-run name / ticker / icon |
| `create(input)` | Queue launch pipeline |
| `getApp(id)` | Fetch app row |
| `listApps(params?)` | Search / paginate |
| `stream(id, onEvent)` | SSE build events |

Works against mock-mode backends (no OpenAI / pump keys required).

## License

MIT
