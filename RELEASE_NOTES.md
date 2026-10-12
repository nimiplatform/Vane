# 0.1.7 — Windows candidate (unreleased)

Uses published SDK 0.21.0, Kit/native 0.19.3 and App Tools 0.12.2. Research uses automatic tool choice while still rejecting a completed step without a declared action. Document processing blocks submission until the attachment is ready, preserving the query and its file context. Windows document indexing, cited Chinese answers and saved-chat reload were exercised through Desktop-supervised Electron against installed Nimi 0.2.2. Catalog installation of this candidate remains NOT-VERIFIED.

# Nimi release 0.1.6 — Source Runtime support for Catalog Apps

Updates the frozen public npm dependency to Kit/native 0.19.2. The installed App keeps its published native carrier and can connect to a source-development Runtime when launched through Home. Native peer identity checks and Runtime-owned installed-source, session and App Access admission remain mandatory. Production Runtime trust remains unchanged; invalid source Runtime observations fail closed without fallback. SDK 0.21.0, App Tools 0.12.0 and the existing App business workflows are retained.

# 0.1.5 — Published Nimi dependencies

Uses the released SDK 0.21.0, Kit/native 0.19.0, App Tools 0.12.0 and
Nimi Coding 0.6.5 from npm. Preserves research, document uploads and managed
storage. Document and query embeddings carry their explicit retrieval purpose,
and vector comparisons retain the actual Runtime space. Production dependency
staging uses the same frozen workspace overrides and unpacks native libraries.

# Vane for Nimi 0.1.4

Adds the publisher declaration for audience, web/social research content, AI text and read-aloud output, external search and location use. Keeps the supported SDK 0.12 / Kit 0.8 pairing and existing business behavior. This metadata release adds no launch gate or safety certification. Publication, Registry admission and installed acceptance remain separate steps.

# Vane for Nimi 0.1.3

Fixes Windows license packaging by preserving the source LF line endings. The immutable 0.1.2 Windows package converted them to CRLF and was rejected by Registry source-license verification; 0.1.2 remains published but is not admitted.

Windows x64 and macOS ARM64 packages retain the same functionality and packaged dependency checks introduced in 0.1.2. Desktop/production Runtime and Catalog lifecycle acceptance remain NOT-VERIFIED.

# Vane for Nimi 0.1.2

Adds a Windows x64 package alongside macOS Apple Silicon. Both targets use the same managed build, package, provenance and immutable Release workflow.

Packaging now checks the shipped Electron binary, protected native binding, canvas and real PDF/DOCX extraction using the packaged production dependencies. Windows Desktop/Runtime launch, business interaction and Catalog installation/update remain NOT-VERIFIED.

Public SDK 0.12.0, Kit/native 0.8.0 and App Tools 0.5.3 remain unchanged. Windows is unsigned; macOS uses ad-hoc sealing without Developer ID or notarization.

# Vane for Nimi 0.1.1

Initial standalone Nimi App package for macOS Apple Silicon. Catalog admission is a separate administrator decision.

- Run Vane in a Desktop-supervised Electron Host with Nimi account binding and App authorization.
- Use Nimi SDK and Kit for model configuration, text generation, structured output, tools and embeddings.
- Configure and test the SearxNG service from Vane Settings.
- Store settings, research history and uploaded documents in Nimi managed App storage.
- Cancel research, reconnect to an active Host, and inspect cited document passages.
- Compare Runtime-issued embedding spaces when indexing and retrieving documents, so unrelated text settings do not invalidate an index and changed embedding models cannot be mixed.
- Read news pages after their main document is ready, keep selected search sources, and report empty results and interrupted work with recovery guidance.
- Keep distinct source URLs when ranking results with Nimi embeddings, report search-engine failures, and avoid a mandatory word minimum for Quality answers.

The officeparser PDF.js dependency is pinned to the security-fixed 6.2.108 release; the supported DOCX and PDF extraction paths are verified separately. macOS signing failures stop packaging.

Development verification has exercised web research, document retrieval, video playback, news reading, weather/calculation/stock widgets, embedding-model replacement, interruption and history operations. Real Codex tools, structured replies, academic retrieval and PDF/DOCX queries have also been exercised through the development App. Account-switching acceptance remains NOT-VERIFIED. Public SDK 0.12.0, Kit/native 0.8.0 and App Tools 0.5.3 are used. Installed production-Runtime and Catalog lifecycle acceptance remain NOT-VERIFIED.
