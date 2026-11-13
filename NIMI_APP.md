# Vane

Research questions across the web and your documents, follow source citations and return to saved conversations.

## Start researching

1. Open Vane from Nimi Home. In **Settings → AI models**, choose a text model with tools and structured output support. Document indexing and ranking also require embeddings.
2. For web searches, enter and test a SearxNG service address in **Settings → Search**. The service must allow JSON searches; Vane does not supply a default search server.
3. Ask a question, select sources and research mode, or attach PDF, DOCX or plain-text documents. Each document may be up to 20 MiB, with at most 20 selected documents.
4. Read the answer and open its citations to check the source material.

## Use the Web preview

The Web preview connects to the same research workspace in the running PC Vane App. Sign in with the same Nimi account, confirm the source in PC Home when first requested, and allow the browser to use **Vane PC research workspace** in Home’s Integrations page. Keep both Nimi Home and PC Vane running.

The browser can search, upload documents, read citations, stop research, reopen saved chats and export answers. PC Vane owns the research engine, search-service address and model configuration; configure those in PC Vane’s Settings. Research preferences are shared with that workspace. Granting library access exposes its existing chats and retrieved document passages to that approved App source.

Disconnecting the browser does not stop a submitted research task. Reconnect and open the original chat in Library to read its result; it is not submitted again. Closing PC Vane interrupts unfinished research. Temporary uploads and large response transfers expire after 30 minutes or when PC Vane closes; they are separate from saved chats and successfully indexed documents. An uncertain upload is not automatically repeated.

Markdown exports include uploaded-document names and retrieved passages so citations remain understandable outside the App. PDF is a text export; rich-layout and non-Latin PDF rendering have not been verified in this preview. Android packaging and device acceptance remain separate work.

## Progress and data

You can stop research. Leaving and reopening a chat while the App is running can show its current progress. After the App exits, unfinished saved requests are shown as interrupted and are not automatically resumed.

Search queries go to your configured search service. AI input follows the selected Nimi Local or Cloud route. If you change the embedding model, remove and upload attachments again to rebuild their indexes. Changing the text model alone does not require this.

Search services may fail or return incomplete results. A citation is a way to inspect evidence, not a guarantee that the generated answer is correct. Report problems to the App provider with the affected source and error, excluding private documents.
