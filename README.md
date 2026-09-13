# Vane for Nimi

This fork adapts [Vane](https://github.com/ItzCrazyKns/Vane) into a Nimi ecosystem App. Integration is in progress; the Nimi package has not been published yet. The first target is Apple Silicon macOS.

Vane owns research steps, web tools, document retrieval and answer presentation. Nimi owns account binding, App authorization, model configuration and AI consumption. Chat history, uploaded documents and search settings use Nimi managed App storage.

## Using the App

The release target is installation and launch from Nimi. Once installed, sign in to Nimi and open Vane:

1. Open **Settings → AI models** and use Nimi's model configuration panel. Research needs a text model with tools and structured output support; document indexing and search ranking also use text embeddings.
2. Open **Settings → Search**, enter a SearxNG service address, test it and save. The service must allow JSON searches. This App does not bundle a SearxNG server or promise a default public endpoint.
3. Ask a question, choose web/academic/social sources and a research mode, or attach a PDF, DOCX or plain text document. Documents are limited to 20 MiB each, with at most 20 selected documents.

Settings are entered inside the App. End users do not edit repository files, install Node.js or run a Vane web server. Search queries go to the configured search service; AI execution follows the configuration owned by Nimi.

Search-engine outages are reported with a retry or service-selection action. Quality mode uses deeper research while keeping the answer length appropriate to the question.

Research can be stopped. Reopening a chat within the running Host observes its current progress without repeating tools. After a Host exit, an unfinished saved request is shown as interrupted; it is not automatically resumed.

Changing text-generation settings does not require re-uploading documents. If the embedding model changes, clear the old attachments and upload them again to rebuild their indexes. Interrupted answers remain incomplete; a connection failure never confirms that unsaved progress was stored.

## Development

Upstream is [ItzCrazyKns/Vane](https://github.com/ItzCrazyKns/Vane), with baseline
`348feca3e378fb4157b217724ed508dc707f853f` before the Nimi adaptation. The downstream
App mainline is `nimi`, independent of upstream release tags. Select an exact
upstream revision when updating and review the affected product, dependency,
license, CI and agent-entry changes together; do not automatically import tags
or restore retired provider/account paths.

Use Node.js 24 and the pnpm version declared in `package.json`. This branch currently uses local SDK 0.12, Kit 0.8 and App Tools 0.5.2 candidates for integration testing. Keep local dependency overrides in the ignored `pnpm-workspace.yaml`, pointing to locally packed SDK/Kit/native packages and the App Tools checkout before dependency installation. These are development inputs; public dependency installation belongs to the coordinated release.

The current SDK/Kit and macOS development carrier were rebuilt from Nimi main
`9a60b81cf84d9067c0c5fa87d2e38d81baf5c785`. The native package uses the explicit
source-local-development profile for this development environment. Match the
actual artifact contents and profile when replacing candidates; a matching
version number alone is insufficient. Nimi-coding is pinned to 0.6.3 for the
current App Tools candidate. These local artifacts do not establish a public
component release or a production installed-App result.

The project already uses the managed engineering surface and is maintained with `nimi-app sync`. The current App Tools candidate also supports `nimi-app init --adopt` for first-time adoption of an existing project. This fork has no fresh scaffold intent or lock; do not fabricate them.

```sh
pnpm install
pnpm exec nimi-app test
pnpm run typecheck
pnpm dev
```

`pnpm dev` is the official App Tools entrypoint. Nimi must be running and signed in with developer mode enabled. For Nimi source development, start `pnpm dev:runtime` and `pnpm dev:desktop` from the Nimi repository first. App Tools asks Desktop to supervise the Electron Host and prints its loopback CDP endpoint.

A new development registration has its own managed storage identity. To rebuild and reopen the same App data, run `pnpm exec nimi-app dev --list-registrations`, select the existing registration for this project, then use `pnpm dev -- --resume <selector>`. Plain `pnpm dev` creates a new registration. Renderer reload reconnects within the existing Host. Development registration is separate from installed App lifecycle acceptance.

`pnpm exec nimi-app check` checks the managed authoring contract. It currently rejects local dependency overrides, so a local test run is not a production check pass. Do not publish SDK/Kit merely to make this development check green.

The current Runtime development slice supports the admitted Gemma 4 local configurations and an exact Codex Responses adapter for `gpt-5.6-sol`, selected through a Nimi-managed Codex connection. Real Codex development checks have exercised tools, structured replies and document retrieval. The `claude-sonnet-4-6` Anthropic Messages adapter has protocol tests but no live acceptance yet. Other catalog models are not implicitly covered by these adapters; availability also depends on the connected provider account.

## Build and release

After local integration is stable, update the public component dependencies together, remove local overrides, regenerate the lockfile, then run the managed lifecycle:

```sh
pnpm exec nimi-app sync
pnpm exec nimi-app check
pnpm exec nimi-app test
pnpm exec nimi-app build --target macos-aarch64 --production
pnpm exec nimi-app pack --target macos-aarch64 --production
```

The `--production` flag supplies the native execution metadata required by Nimi installation; it does not publish anything. For local installation testing, use Nimi → Apps → Add app → Import local package.

The generated `.github/workflows/nimi-app-release.yml` owns GitHub package publication. Registry admission and installation through Nimi are separate acceptance steps and remain unverified until actually exercised. No test requires publishing a package, pushing a tag or merging a release PR.

The former Next.js server, direct model provider setup, SQLite and Docker deployment are removed from this fork. Upstream documentation under `docs/` describes the original project; it is not the integration contract for this Nimi App.

## License and upstream

Vane is MIT licensed. See [LICENSE](LICENSE). Original project and contributors: [ItzCrazyKns/Vane](https://github.com/ItzCrazyKns/Vane).
