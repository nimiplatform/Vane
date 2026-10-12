## Catalog App support for source Runtime — 0.1.6

This release resolves public npm Kit/native **0.19.2** in the frozen lockfile,
with SDK **0.21.0** and App Tools **0.12.0**. Launch the installed Catalog App
through Nimi Home in either the supported production environment or the macOS
source-development environment. The App always loads its own packaged native
carrier. Source Runtime peer identity and installed-App/session admission remain
verified; no workspace carrier replacement or trust-check bypass is used.

Catalog AI acceptance for this new artifact is pending publication and admission;
earlier development and installed-artifact results below retain their stated
versions and limitations.

# Vane for Nimi

This fork adapts [Vane](https://github.com/ItzCrazyKns/Vane) into a Nimi ecosystem App. The standalone Nimi App targets Windows x64 and Apple Silicon macOS. Availability in the Nimi catalog requires a separately approved Registry entry.

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

Use Node.js 24 and pnpm 10.34.5. Version 0.1.5 selects the published npm
SDK 0.21.0, Kit/native 0.19.0, App Tools 0.12.0 and Nimi Coding 0.6.5.
The frozen pnpm lock records registry integrity and contains no Nimi local
package override. Electron uses the supported 44 series.

The public macOS native carrier uses the production Runtime trust profile.
Platform-source experiments use Nimi's separately documented development
carrier/profile and remain private validation. A matching version number alone
does not make the two native profiles interchangeable.

The project uses the managed engineering surface and is maintained with `nimi-app sync`. App Tools also supports `nimi-app init --adopt` for first-time adoption of an existing project. This fork has no fresh scaffold intent or lock; do not fabricate them.

```sh
pnpm install --frozen-lockfile
pnpm exec nimi-app check
pnpm exec nimi-app test
pnpm run typecheck
pnpm dev
```

`pnpm dev` is the official App Tools entrypoint. Run a matching installed Nimi,
sign in and enable developer mode. App Tools asks Desktop to supervise the
Electron Host and prints its loopback CDP endpoint. Nimi's source-development
Runtime is a separate native trust profile; follow the platform's development
instructions when working on that profile.

A new development registration has its own managed storage identity. To rebuild and reopen the same App data, run `pnpm exec nimi-app dev --list-registrations`, select the existing registration for this project, then use `pnpm dev -- --resume <selector>`. Selectors belong to the current Desktop session; list again after restarting Nimi. Plain `pnpm dev` requests an explicit selection when registrations exist. Renderer reload reconnects within the existing Host. A real session invalidation
retires its business clients, cancels old work and replaces the renderer; the
ready callback supplies fresh clients. Development registration is separate from
installed App lifecycle acceptance.

`pnpm exec nimi-app check` checks the managed authoring contract and public
dependency lock. Run it after synchronization and dependency changes, and before
packaging. Verify real App behavior separately through the supervised Host.

Research model steps use the public synchronous carrier so classification,
structured extraction and function tools can use resources that support those
behaviors in SYNC mode. Vane continues to own its research loop and progress
events. The selected resource must support the complete request; a catalog row
or a ready text resource alone does not establish support for every behavior.
The Host configures the technical profile supplied by Desktop before loading
the rest of Kit. The macOS public-package upgrade passes production preflight, 14 tests,
TypeScript, production build/pack and the packaged native/canvas/PDF/DOCX check.
Real document upload, retrieval with source citations and saved-result reload
were exercised through Desktop-supervised development. Catalog installation
and Windows user journeys require their own verification.

## Build and release

Before the first release, follow the [app-tools publishing setup](https://github.com/nimiplatform/nimi/blob/main/app-tools/README.md#publishing-on-github).
Configure `NIMI_REPOSITORY_ADMIN_TOKEN` in this repository's Actions secrets with
**Administration: Read-only**. It only checks tag protection and Release
immutability; actual Release uploads use GitHub's built-in token. Local
development does not need this credential. A secret in another App repository
is not inherited.

For an App release, keep the public component combination and lockfile aligned,
then run the managed lifecycle:

```sh
pnpm exec nimi-app sync
pnpm exec nimi-app check
pnpm exec nimi-app test
pnpm exec nimi-app build --target macos-aarch64 --production
pnpm exec nimi-app pack --target macos-aarch64 --production
```

Run the commands above on Apple Silicon macOS. On Windows x64, use `--target windows-x86_64` for both build and pack. The managed workflow builds both targets on their native runners and aggregates their packages into one Release. Every build executes the packaged Electron binary to check protected-native loading, canvas and real PDF/DOCX extraction; this dependency check does not establish Desktop/Runtime or GUI acceptance.

The `--production` flag supplies the native execution metadata required by Nimi installation; it does not publish anything. For local installation testing, use Nimi → Apps → Add app → Import local package.

The `.gitattributes` rule preserves `LICENSE` bytes on Windows. Registry compares the packaged license with the exact tagged source file; a checkout line-ending conversion also fails this check.

The generated `.github/workflows/nimi-app-release.yml` owns GitHub package publication. Registry admission and installation through Nimi are separate acceptance steps and remain unverified until actually exercised. No test requires publishing a package, pushing a tag or merging a release PR.

The former Next.js server, direct model provider setup, SQLite and Docker deployment are removed from this fork. Upstream documentation under `docs/` describes the original project; it is not the integration contract for this Nimi App.

## License and upstream

Vane is MIT licensed. See [LICENSE](LICENSE). Original project and contributors: [ItzCrazyKns/Vane](https://github.com/ItzCrazyKns/Vane).

## Support

Report the App version, failed operation, Runtime status and error message through this fork’s GitHub issue tracker. Remove credentials, session tokens, document contents and private search queries from reports. Restart Vane from Nimi after checking model and search settings; an interrupted request is not automatically resumed.

## Published Nimi dependency update — 2026-10-12

[0.1.5](https://github.com/nimiplatform/Vane/releases/tag/v0.1.5) is published through the managed immutable-release workflow and [admitted to the Registry](https://github.com/nimiplatform/nimi-app-registry/pull/67). The App consumes released SDK 0.21.0, Kit/native 0.19.0, App Tools 0.12.0 and Nimi Coding 0.6.5 through public npm locks, with no local Nimi dependency override.

Document upload, embedding retrieval, cited answers and saved-result reload passed. Catalog 0.1.5 downloaded, installed and launched; its AI connection returned runtime-service-untrusted in the current source-development Runtime topology. These business checks used the actual Desktop-supervised development Host. Catalog AI acceptance remains NOT-VERIFIED; the user authorized publication and admission with that limitation recorded. Windows package production tests, build and provenance passed; Windows interactive use remains NOT-VERIFIED.
