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
