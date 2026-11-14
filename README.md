## Android reconnect follow-up — 2026-11-14

The new local candidate `.nimi/local/android/vane-0.1.10-kit-rc4-20261114-182252-debug.apk` uses the separately archived **Kit 0.24.0-rc.4** Android idle-HTTP repair; SDK/native/App Tools retain their original frozen tarballs and the declared base caret stays unchanged. The APK is **14,435,439 B**, SHA-256 **8bfbddd54fe3fbbbb40d9598f71c9444cfb21a0c28a45202e780db4ff41c116**. All older candidates remain intact.

After normal reinstall and official Halliday sign-in, the PC workspace and all **10 chats** were read back. Existing document conversation `fcd33ed5-8407-4701-97d3-cac47b304bfe` retained the uploaded note, ORBIT-1114, seven observations and the UNKNOWN/no-zero rule. Following natural idle, the first explicit Disconnect → Connect restored that same conversation and result, with no new research or failed native coordination log. Previous AI, indexing and SAF results below are reused for their unchanged implementation; those tasks were not repeated just to test the transport fix.

The PC source App initially reported generic `runtime-service-unavailable`; its precise initial failure remains unclassified. Its original retry action also reused a document's fixed initialization promise, which cannot recover after rejection. The action now explicitly reloads the document instead of rebinding an old context; failed account/workspace/preferences checks identify their step. A new document restored the original PC library, and the Android workspace then connected through its normal Check PC workspace action. No provider contract, data registration, Runtime process or model selection was replaced. Type checking and the existing **30 App tests** pass; the package/carrier check, frozen install and Android build pass for the new cohort. The latest Web visual follow-up remains pending while the shared Chrome save dialog is held for user cancellation.

Current local Web/Android iteration is **0.1.10**, using the complete frozen integration RC.2 archives: SDK 0.24.0-rc.2, Kit/native 0.24.0-rc.1, App Tools 0.16.0-rc.2 and Nimi Coding 0.7.0. The explicit workspace overrides and lockfile select those unchanged local tarballs. Electron is 45.3.2. Public publication and installed-candidate acceptance are separate; previous versioned notes retain their original scope. Home uses the App-owned root `NIMI_APP.md`.

## Android local acceptance 0.1.10 — 2026-11-14

Android uses the formal Kit mobile session/Android plugin and system-browser callback `ai.nimi.apps.vane.dev:/oauth/callback`, source `nimiplatform.vane.android.dev`. The renderer is packaged in the APK. Original research, files, embeddings, models and saved chats remain in the existing Desktop-supervised PC registration; the mobile UI consumes `vane.research.v1` with its 15 explicit permissions. No Host credential or private bridge is copied into Android. The same identity/source permission was reused after normal APK updates and reconnects.

Current installed candidate: `.nimi/local/android/vane-0.1.10-picker-20261114-145327-debug.apk`, 14,435,439 bytes, SHA-256 `831cc6ddde3afb57727cec257e878169e7cc402fee9351a4b8d13b9011b7832d`. Package `ai.nimi.apps.vane.dev`, 0.1.10/code 1, min31/compile37/target36. The original Android test certificate remains `75:6E:56:A0:85:27:A9:4E:83:09:21:23:3B:C8:0F:31:12:1F:D0:FE:57:DC:CE:F1:53:5E:27:E9:EB:0A:65:85`. Earlier candidates, including the first Share-only and subsequent layout/SAF fixes, remain archived. No public release or production Registry was changed.

Actual device is the existing `nimi-apps-api36` Android 16 emulator on this Windows PC; login/API use adb reverse 3000/3002. This is not another physical device or network. Original simulator data and the original PC registration were retained. The original seven PC chats remain; the final Library has ten after three distinct new Android research submissions:

1. `52e76b95-ad1c-4f43-990d-6a4d03bc3af5`: local-model calculation, original calculator expression `(8 + 12 + 16) / 3` and result 12. Formal Disconnect hides the old workspace; Connect restores this exact record and result while the same PC Host/Runtime remain running. The model was more verbose than requested and retained literal `[widgets_result]`; no output was rewritten.
2. `9524d5dc-d379-46e5-9a26-fa2470b40a49`: a real web search performed one query and found 20 results. The official `https://docs.python.org/3/library/pathlib.html` link opened and loaded in Android's system browser. Source quality is not overstated: the model mixed a nonofficial citation with an official one and labeled the official link as 3.16.0a2 while the loaded page was 3.15.2. Returning from the browser retained the same research.
3. `fcd33ed5-8407-4701-97d3-cac47b304bfe`: the real system file chooser selected the 203-byte UTF-8 note `vane-android-acceptance-20261114.txt`. After explicit Upload to PC, local indexing completed and the original question was submitted once. The answer correctly read ORBIT-1114, seven observations and UNKNOWN/no-zero-fill; the citation opened the actual Chinese/English source. PC document ID is `a07df908-6c62-4ae5-9535-f81191acab19`. Disconnect/reconnect read the same answer and file without reupload or regeneration.

The device audit fixed actual defects: automatic keyboard focus squeezed the home page; the Library heading inherited light-theme text on a dark background; the model action wrapped awkwardly; numeric citations lacked useful accessible names. Existing App and Kit themes now agree, focus is deliberate on touch devices, controls retain their labels and safe-area spacing. Read-aloud absence on this device is explicit. The exact screens and source/answer observations are under `.nimi/local/ui-audit/2026-11-14-android/`. CDP's separate composited dialog capture was distorted although the actual device dialog was correct; device captures were used for those dialogs, not treated as a product layout defect.

The initial Share chooser offered only external destinations, so export now uses an App-owned `ACTION_CREATE_DOCUMENT` flow. A real first attempt exposed Capacitor `getLong` rejecting JSON Integer offsets; the <=1 GiB transfer now reads the correct integer type. The existing acceptance chat was saved through Android's actual Downloads picker: Markdown 1,012 bytes, PDF 6,317 bytes. Downloaded bytes were read back; Markdown preserves the answer, document name and source passage. Poppler rendered the one-page A4 PDF legibly. The unchanged SAF delivery behavior is reused by the later picker candidate. Export headers now use the actual export time, while message timestamps remain original. No external message/share was sent and no old export was overwritten.

System file picking also exposed a real lifetime failure: Kit correctly disconnected Runtime in the background, and the old input node was physically removed before the result returned. The fix retains only input/File/draft data under the public verified identity lifetime; changing identity clears it. It does not retain or rebind the old Runtime client. After reconnect, a new explicit Upload action captures the current scope. Actual verification kept the selected file, typed question and disabled Web source; research stayed disabled until indexing finished. Existing attachment references are restored only for the same PC workspace/route. Two focused React regressions cover input survival and rejection of a late callback after identity invalidation.

Checks: 30 App tests, typecheck, Web/Host/mobile builds, App Tools sync/check, native Java build and APK signature validation passed. Android builds use the existing JDK21/SDK/Gradle cache (`assembleDebug --offline --no-daemon --max-workers=2`); an initial empty-cache Maven TLS failure was resolved by reusing that cache, without changing TLS verification or mirrors. The PC configuration stays Gemma 4 plus EmbeddingGemma 2; these Android tests added no paid resource or cloud call. The original read-only-configured SearxNG container was normally resumed, preserving its configuration.

NOT-VERIFIED: another physical device/network; production/App Link distribution; maximum-size/multiple-file stress, PDF/DOCX Android extraction, running AI cancellation/background interruption, process-kill recovery, non-Latin/rich-layout PDF and complete accessibility. Transient unsent drafts outside the file-selection journey are not promised across full App restarts. The prior 0.1.9 Web business results below retain their version/scope; shared composition/export changes have build/type coverage, with a short current Web UI regression still pending.

## Web development and acceptance — 2026-11-14

The Web client reuses the App’s research UI, Library, source rendering and exports. A captured public Nimi scope consumes the explicitly permitted `vane.research.v1` Integration from the existing Desktop-supervised PC Host. Research, ordered model/tool turns, embedding-space identity, uploads and saved chats remain App-owned in the original PC registration. No native bridge, Host cookie, key or storage identity is copied into the browser. AI configuration and the search-service address remain PC controls; the browser can update the shared research preferences.

The same-cohort generated Web reference and prior RC.2 carrier checks were reused. Run `pnpm dev -- --list-registrations`, then resume the existing selector; do not create a replacement registration. For this local source use `pnpm dev:web -- --realm local`, with `NIMI_WEB_TLS_KEY` and `NIMI_WEB_TLS_CERT` pointing to the existing browser-trusted local certificate. `NIMI_DEV_REALM=local pnpm build:web` selects the local build configuration. The Web origin is `https://127.0.0.1:4483`, client `nimiplatform.vane.web.dev`, revision 1. Only the local Registry was extended; its previous file is backed up at `D:/nimi-realm/.nimi/local/registry/remote-clients.before-vane-20261114.json`.

Actual Windows source/local acceptance used Nimi `42d686cbf` (Home 0.2.5-rc.11), local Realm/API and Halliday. Formal login and return, first Home source confirmation, a real ungranted-workspace refusal and all 15 selected workspace operation permissions passed. The original two development chats remained. The existing SearxNG configuration was mounted read-only in `nimi-vane-searxng-local`, listening only at `127.0.0.1:8080`; its PC UI connection test returned 20 results. No new paid resource was provisioned.

- Local Gemma research searched 3 queries and found 60 results, then stopped because the model returned no declared action. Saved chat `df89a9b7-ecf6-47ba-80cf-71daa8805ff8` remains a failure.
- One explicit qwen3.8-flash attempt through the existing Dashscope test connector returned `ai-output-invalid`; `ab285bbc-7caa-4c3f-bfc1-1abd240d7f65` remains a failure. Its exact provider-output cause is unconfirmed.
- A real browser-uploaded fictional text document was indexed with the existing local EmbeddingGemma 2. qwen3.8-flash read BLUEBIRD-1114, Mira Lin, six observations and the no-zero-fill rule correctly; its numbered file citation opened the actual retrieved passage. Chat `f8c75b37-7d0b-43b9-8657-452218e5fccd` and document `40f922ec-cbe5-432c-9ab5-a1ab890c6ff4` remain saved.
- A subsequent explicit Web research performed two batches of 3 queries, each reporting 60 raw results, and saved 36 cited sources with a comparison table and portable Python path example. It reached the speed-mode budget honestly. While the answer stage was active, the browser was disconnected; the PC completed the same chat `8d0f03c7-da1f-4a92-82da-d29496e96f3f`. Formal page/login recovery and Library reopening read that answer without resubmission. A normal PC Vane exit and resume of the same registration retained the six chats and existing permission.

The 390×844 browser layout was inspected through real flows: account menu, research, shared settings and file-citation dialog. Fixes include the sidebar-obscured prerequisite text, dark header and answer contrast, narrower question typography, named icon controls and router-based new-research navigation. Research-complete notifications are emitted once across repeated progress snapshots. Markdown document citations now include names and source passages; PDF text removes Markdown formatting while preserving code. Actual downloaded exports are retained under the normal Downloads location, and the inspected PDF rendering under `.nimi/local/ui-audit/2026-11-14-web/`. The final English PDF is 6,308 bytes; non-Latin PDF text remains unverified.

The final PC configuration was restored to Gemma 4 plus EmbeddingGemma 2. A separate explicit Web stop test `19634c5f-00fd-43ee-bbd7-0cbec0e5cf65` returned the actual caller-canceled terminal state. Final Library count is seven: two original chats, two failed tests, two completed tests and this stopped test. No task was deleted or automatically replayed. The temporary browser viewport was reset after acceptance. No user action remains pending for this Web slice.

28 focused App tests, type checking, Host build, Web build and App Tools check pass. The regressions cover caller-bound ordered uploads, unknown/oversized inputs, immutable response chunks, PC-only model/service controls, snapshot isolation, no replay after an unconfirmed write and duplicate progress notifications. These checks are not substitutes for the actual journeys above.

NOT-VERIFIED: Android build/device flow, another physical device/network, PDF/DOCX upload extraction in the new Web carrier, maximum-size transfers, provider shutdown during an active real research, non-Latin/rich-layout PDF export and exhaustive accessibility. Existing desktop evidence below retains its scope. A retrieved snippet/citation does not prove the model read every full source or that every generated claim is correct. No public Registry, production service, Release or channel was changed.

Upgrade verification: public-registry installation, frozen-lockfile installation, App Tools checks and the applicable type/Host build checks passed. Desktop-supervised macOS development opened the research workspace and Nimi AI configuration. New model-output journeys and packaged installation were not rerun; earlier evidence below retains its stated versions and scope.

[App introduction and usage](NIMI_APP.md)

## Windows candidate 0.1.8 — 2026-10-14

Fixes the citation display failure observed during real web research. The previous Markdown parser misread an inline Windows backslash, and the App's pre-parse HTML replacement could expose internal citation tags or rewrite code and link labels. The updated parser and post-parse React citation rendering preserve code, ordinary links and unresolved references without interpolating source URLs into HTML. Stored model answers and source records are unchanged.

Type checking and all 21 App tests pass, including six regressions for backslashes, inline/fenced code, links, missing references and quoted URLs. Through the existing Desktop-supervised CDP target, the original saved web answer now displays its backslash and citation links correctly with no exposed tag. The previous document answer still opens the actual uploaded source passage from its numbered citation. Windows production build/pack and the packaged Electron native, canvas and document-extraction checks pass.

On October 14, installed Nimi 0.2.4-rc.1 updated the Imported Windows App from
0.1.7 to 0.1.8, preserving the original document chat and source passage.
Opening its numbered citation still displayed the uploaded text. The retained
Web source option was initially off; direct official-page reading passed in
that mode. After enabling Web, one `ai-output-invalid` request and two search
engine failures remained recorded. The local SearxNG service was tuned through
its [documented engine settings](https://docs.searxng.org/admin/settings/settings.html)
and [outgoing timeouts](https://docs.searxng.org/admin/settings/settings_outgoing.html):
Bing enabled, Brave and DuckDuckGo disabled after repeated rate-limit/CAPTCHA
responses, request timeout 10 seconds and maximum 15 seconds. This only changes
the local acceptance service; the App still uses its configured service URL.

The subsequent installed research task ran three real queries, found 60
results, read one source and returned a Chinese comparison with numbered
official Python citations and intact Windows-backslash code. Normal close and
Home relaunch restored all four chats, including the successful answer and
earlier failures. The successful chat is
`61049960-574a-4e7f-92b9-0b4fa7646da3`. The Home news widget still reported an
upstream loading failure; news availability is not claimed. The annotated
v0.1.8 tag points to tested source 0b38230. The [immutable release](https://github.com/nimiplatform/Vane/releases/tag/v0.1.8)
is published for both targets, and exact packages, licenses and build provenance
passed Registry preparation. [Candidate #102](https://github.com/nimiplatform/nimi-app-registry/pull/102)
replaces withdrawn #94. The user approved the existing dual-platform stable
candidate on October 14; finalization passed and #102 merged. The superseded
0.1.4 safety candidate #62 was closed. The slow Catalog download subsequently
completed and installed the original 0.1.8 Windows package on Nimi 0.2.4.
Home launched its distinct Catalog release-directory Host. A fresh document
upload used text-embedding-v4, and qwen3.8-flash returned the correct Lin Lan,
Runtime Bridge, six-observation and no-zero-fill facts with file citations.
Opening a numbered citation displayed the actual uploaded source passage.
The first request correctly refused Web research because the new Catalog
workspace had no SearxNG URL; disabling Web for this document-only task allowed
the next request to complete. That prerequisite failure remains recorded.

Home's account session later expired, interrupting the App connection. After
the user signed in again, Home relaunched the same Catalog instance and its
Library restored the answer, source and citations without regeneration. The
successful chat is `0bfed5ca-d2ba-4592-a113-842e83651e33`. Fresh Windows Catalog
download/install, document research and reopen therefore pass. The prior
Imported update and Web-research evidence retain their separate scopes;
Catalog N-to-N+1 update and Web search in this new workspace were not run.

## Windows support 0.1.7 — 2026-10-13

Uses published SDK 0.21.0, Kit/native 0.19.3, App Tools 0.12.2 and Nimi Coding 0.6.5. Type checking and 15 tests pass. Research uses automatic tool choice with the existing no-action rejection; submission waits for attachment processing. Both Windows supervised development and local imported installation completed document research. Against Nimi 0.2.3-rc.2, the installed release-directory Host uploaded and embedded `windows-acceptance.txt`, then used qwen3.8-flash and text-embedding-v4 to return a cited Chinese answer identifying Lin Lan, Runtime Bridge, six observations and the rule against replacing missing data with zero. Normal close, relaunch from Home's Imported source, and opening the Library restored the same attachment and answer. Installed interaction used native UI without production CDP.

The first MiMo v2.6 Flash research attempt returned `ai-text-behavior-unsupported`; its failure remains in the conversation. Vane requires tools and structured output, so that unsupported combination is not counted as model-quality acceptance. Catalog installation of this new version remains a separate delivery step. Earlier macOS evidence below keeps its original version and scope.

Additional Windows supervised-development acceptance against Nimi 0.2.3 used Vane's own loopback CDP and a local SearxNG 2026.10.13 service with JSON enabled. The App's connection test returned 27 results after initial engine timeouts. With qwen3.8-flash and text-embedding-v4, the real research flow searched two queries, found 53 results, read the Python pathlib documentation and produced a Chinese answer with working official-document links. Normal App close, resume of the same development registration and opening the Library restored that answer and its sources. One inline citation marker remained visible as raw text; this presentation limitation is recorded separately from successful search and AI execution. Installed-package web search remains NOT-VERIFIED. SearxNG remains a separately configured service, not a bundled or promised default endpoint.

## Catalog App support for source Runtime — 0.1.6

This release resolves public npm Kit/native **0.19.2** in the frozen lockfile,
with SDK **0.21.0** and App Tools **0.12.0**. Launch the installed Catalog App
through Nimi Home in either the supported production environment or the macOS
source-development environment. The App always loads its own packaged native
carrier. Source Runtime peer identity and installed-App/session admission remain
verified; no workspace carrier replacement or trust-check bypass is used.

Catalog AI acceptance passed on macOS arm64 using the actual [0.1.6 Release](https://github.com/nimiplatform/Vane/releases/tag/v0.1.6) admitted by [Registry PR #73](https://github.com/nimiplatform/nimi-app-registry/pull/73), downloaded and launched through source Nimi Home. Uploaded and embedded a new text document, obtained a cited answer identifying Runtime Bridge, BLUEBIRD-743 and Kit 0.19.2, then quit and relaunched from Home and reopened the saved chat and file. The configured Deepseek model first rejected the requested text behavior; selecting Gemma 4 through the App AI settings completed the same workflow.

Local screenshots and exported results are in `.nimi/local/released-dependencies-20261012/`. Windows interactive acceptance and other unrun AI modalities remain **NOT-VERIFIED**. These results supersede the earlier Catalog limitation; historical results below retain their stated versions.

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
