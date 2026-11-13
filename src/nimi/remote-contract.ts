export const VANE_INTEGRATION = 'vane.research.v1';
const object = (
  properties: Record<string, unknown>,
  required = Object.keys(properties),
) => ({ type: 'object', additionalProperties: false, properties, required });
const id = {
  type: 'string',
  minLength: 1,
  maxLength: 80,
  pattern: '^[A-Za-z0-9-]+$',
};
const text = (maxLength: number) => ({ type: 'string', maxLength });
const history = {
  type: 'array',
  maxItems: 40,
  items: { type: 'array', minItems: 2, maxItems: 2, items: text(64000) },
};
const media = object({ query: text(16000), chatHistory: history });
export const VANE_OPERATIONS = [
  [
    'settings.get',
    'Read PC research settings',
    'read',
    object({}),
    'Read the PC workspace search and preference settings. Model configuration stays in PC Vane.',
  ],
  [
    'settings.save',
    'Change research preferences',
    'write',
    object({
      systemInstructions: text(16000),
      autoMediaSearch: { type: 'boolean' },
      showWeatherWidget: { type: 'boolean' },
      showNewsWidget: { type: 'boolean' },
      measurementUnit: { type: 'string', enum: ['metric', 'imperial'] },
    }),
    'Change shared research and presentation preferences. Cannot change the PC search-service address or model configuration.',
  ],
  [
    'chats.list',
    'Read research library',
    'read',
    object({}),
    'Read the existing PC workspace research library, including previous conversations.',
  ],
  [
    'chats.get',
    'Read saved research',
    'read',
    object({ chatId: id }),
    'Read a saved chat, citations and current research status.',
  ],
  [
    'chats.delete',
    'Delete a research chat',
    'write',
    object({ chatId: id }),
    'Delete the selected chat from this shared PC workspace. Active research must first be stopped.',
  ],
  [
    'research.start',
    'Start research',
    'write',
    object({
      runId: id,
      chatId: id,
      messageId: id,
      query: text(16000),
      sources: {
        type: 'array',
        maxItems: 3,
        items: { type: 'string', enum: ['web', 'discussions', 'academic'] },
      },
      fileIds: { type: 'array', maxItems: 20, items: id },
      mode: { type: 'string', enum: ['speed', 'balanced', 'quality'] },
      rewrite: { type: 'boolean' },
    }),
    'Explicitly start one Vane research workflow using the PC App models and selected sources. Work continues if the browser disconnects; never automatically resubmit.',
  ],
  [
    'research.read',
    'Read ongoing research',
    'read',
    object({ runId: id }),
    'Read existing progress without repeating tools or model work.',
  ],
  [
    'research.cancel',
    'Stop research',
    'write',
    object({ runId: id }),
    'Stop the selected active research in this shared PC workspace.',
  ],
  [
    'suggestions',
    'Generate related questions',
    'write',
    object({ chatHistory: history }),
    'Use the PC Vane model to suggest follow-up questions.',
  ],
  [
    'images',
    'Find related images',
    'read',
    media,
    'Search for images using the configured PC search service and Vane model.',
  ],
  [
    'videos',
    'Find related videos',
    'read',
    media,
    'Search for videos using the configured PC search service and Vane model.',
  ],
  [
    'discover',
    'Read discovery articles',
    'read',
    object({
      topic: {
        type: 'string',
        enum: ['tech', 'finance', 'art', 'sports', 'entertainment'],
      },
      preview: { type: 'boolean' },
    }),
    'Read articles from the configured search service.',
  ],
  [
    'weather',
    'Read requested weather',
    'read',
    object({
      lat: { type: 'number', minimum: -90, maximum: 90 },
      lng: { type: 'number', minimum: -180, maximum: 180 },
      measureUnit: { type: 'string', enum: ['Metric', 'Imperial'] },
    }),
    'Read weather for the location explicitly supplied by this client.',
  ],
  [
    'documents.upload',
    'Upload a research document',
    'write',
    object(
      {
        action: { type: 'string', enum: ['begin', 'append', 'index', 'read'] },
        id,
        fileName: text(255),
        mimeType: text(128),
        size: { type: 'integer', minimum: 1, maximum: 20 * 1024 * 1024 },
        offset: { type: 'integer', minimum: 0 },
        data: text(87384),
      },
      ['action'],
    ),
    'Stage a PDF, DOCX or text document in ordered 64 KiB chunks, then index it using the PC Vane embedding model. Only this caller can access its unfinished uploads.',
  ],
  [
    'result.read',
    'Read a large research response',
    'read',
    object({ id, offset: { type: 'integer', minimum: 0 } }),
    'Read a bounded chunk of this caller’s original response; never rerun its operation.',
  ],
] as const;

export const remoteDescriptors = VANE_OPERATIONS.map(
  ([name, displayName, effect, inputSchema, description]) => ({
    name,
    displayName,
    effect,
    description,
    inputSchemaJson: JSON.stringify(inputSchema),
    outputSchemaJson: JSON.stringify({
      type: 'object',
      additionalProperties: true,
    }),
    supportsCancel: false,
    retryPolicy: 'none',
  }),
);
