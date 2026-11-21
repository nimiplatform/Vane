# Vane

Research questions across the web and your documents, follow source citations and return to saved conversations.

## Start researching

1. Open Vane from Nimi Home. In **Settings → AI models**, choose a text model with tools and structured output support. Document indexing and ranking also require embeddings.
2. For web searches, enter and test a SearxNG service address in **Settings → Search**. The service must allow JSON searches; Vane does not supply a default search server.
3. Ask a question, select sources and research mode, or attach PDF, DOCX or plain-text documents. Each document may be up to 20 MiB, with at most 20 selected documents.
4. Read the answer and open its citations to check the source material.

## Use Web and Android with your PC workspace

On your primary PC, open **Vane 0.1.10 or later** from Nimi Home and keep both apps running. The storefront offers **Open in browser** when the Web version is available. Sign in with the same Nimi account. On first use, confirm `https://vane.nimi.xyz` in Home, then open **Integrations → Vane PC research workspace** and allow the Web client to perform the research operations you want to use. The Android preview connects to the same PC workspace with its own source approval.

Web and Android can search, upload documents, read citations, stop research, reopen saved chats and export answers. On Android, choose documents first, then use **Upload to PC** to index them before submitting your question. Your selection and current question are kept while the system file picker is open. The running PC App performs research using the selected Nimi models. Model controls and the search-service address stay in PC Vane’s Settings; no search credentials or model keys are copied into the browser. Research preferences are shared with that workspace. Granting library access exposes its existing chats and retrieved document passages to that approved App source.

Disconnecting or reloading the browser does not stop a submitted research task or submit it again. Because the browser uses an in-memory Nimi session, a full page reload asks you to sign in again; afterward, open the original chat in Library to read its saved result. Closing PC Vane interrupts unfinished research. Temporary uploads and large response transfers expire after 30 minutes or when PC Vane closes; they are separate from saved chats and successfully indexed documents. An uncertain upload is not automatically repeated.

Markdown exports include uploaded-document names and retrieved passages so citations remain understandable outside the App. PDF is a text export; rich-layout and non-Latin PDF rendering have not been verified in this preview. The Android test candidate packages the same research interface and uses the system browser to sign in. Exports use the system file-saving dialog, so no external sharing account is required. It still needs the running PC workspace and is not a public Android release. Read aloud depends on device speech support; otherwise use copy or export. Unsaved drafts are not promised across a full App restart.

## Progress and data

You can stop research. Leaving and reopening a chat while the App is running can show its current progress. After the App exits, unfinished saved requests are shown as interrupted and are not automatically resumed.

Search queries go to your configured search service. AI input follows the selected Nimi Local or Cloud route. If you change the embedding model, remove and upload attachments again to rebuild their indexes. Changing the text model alone does not require this.

Search services may fail or return incomplete results. A citation is a way to inspect evidence, not a guarantee that the generated answer is correct. Report problems to the App provider with the affected source and error, excluding private documents.
