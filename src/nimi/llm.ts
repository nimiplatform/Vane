import z from 'zod';
import { parse as parsePartialJson } from 'partial-json';
import {
  createNimiLocalAppTextModel,
  type NimiAiModel,
  type NimiGenerateTextRequest,
} from '@nimiplatform/sdk/ai';
import type {
  NimiMessage,
  NimiTextOutputItem,
  NimiTextTurnItem,
  NimiJsonObject,
} from '@nimiplatform/sdk/contracts';
import BaseLLM from '../lib/models/base/llm';
import BaseEmbedding from '../lib/models/base/embedding';
import type {
  GenerateTextInput,
  GenerateObjectInput,
  GenerateOptions,
  StreamTextOutput,
  ToolCall,
} from '../lib/models/types';
import type { Message, Chunk } from '../lib/types';
import { vaneContext, type VaneContext } from './context';

function messagesForNimi(messages: Message[]): NimiMessage[] {
  const converted: NimiMessage[] = [];
  let assistantItems: NimiTextTurnItem[] | undefined;
  for (const message of messages) {
    if (message.role === 'tool') {
      if (!assistantItems)
        throw new Error('Tool result has no preceding assistant step.');
      assistantItems.push({
        type: 'tool-result',
        toolResult: {
          toolCallId: message.id,
          toolName: message.name,
          result: JSON.parse(message.content),
        },
      });
    } else if (message.role === 'assistant') {
      assistantItems = message.turnItems
        ? [...message.turnItems]
        : [{ type: 'output', output: { type: 'text', text: message.content } }];
      converted.push({
        role: 'assistant',
        content: [],
        turnItems: assistantItems,
      });
    } else {
      assistantItems = undefined;
      converted.push({
        role: message.role,
        content: [{ type: 'text', text: message.content }],
      });
    }
  }
  return converted;
}

function parameters(
  options?: GenerateOptions,
): NimiGenerateTextRequest['parameters'] {
  if (!options) return undefined;
  const { stopSequences, ...rest } = options;
  return { ...rest, ...(stopSequences ? { stop: stopSequences } : {}) };
}

/** One model step. Vane's researcher owns the only loop and tool handlers. */
export class NimiLLM extends BaseLLM<VaneContext> {
  private readonly model: NimiAiModel;
  constructor(scope = vaneContext()) {
    super(scope);
    this.model = createNimiLocalAppTextModel(scope.services.ai);
  }

  private request(input: GenerateTextInput): NimiGenerateTextRequest {
    this.config.signal.throwIfAborted();
    return {
      messages: messagesForNimi(input.messages),
      tools: input.tools?.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: z.toJSONSchema(tool.schema) as NimiJsonObject,
      })),
      ...(input.tools?.length ? { toolChoice: 'required' as const } : {}),
      parameters: parameters(input.options),
      signal: this.config.signal,
    };
  }

  async generateText(input: GenerateTextInput) {
    const result = await this.model.generateText(this.request(input));
    if (!['stop', 'tool-calls'].includes(result.finishReason))
      throw new Error(
        `Text response did not complete: ${result.finishReason}.`,
      );
    return {
      content: result.text,
      toolCalls: [...(result.toolCalls ?? [])] as ToolCall[],
      additionalInfo: {
        finishReason: result.finishReason,
        outputItems: result.outputItems,
      },
    };
  }

  async *streamText(
    input: GenerateTextInput,
  ): AsyncGenerator<StreamTextOutput> {
    const outputs = new Map<number, NimiTextOutputItem>();
    let finishReason: string | undefined;
    for await (const event of await this.model.streamText!(
      this.request(input),
    )) {
      if (event.type === 'text-delta') {
        const index = event.itemIndex!;
        const previous = outputs.get(index);
        outputs.set(index, {
          type: 'text',
          text: `${previous?.type === 'text' ? previous.text : ''}${event.text}`,
        });
        yield { contentChunk: event.text, toolCallChunk: [] };
      } else if (event.type === 'tool-call') {
        outputs.set(event.itemIndex!, {
          type: 'tool-call',
          toolCall: event.toolCall,
        });
        yield { contentChunk: '', toolCallChunk: [event.toolCall as ToolCall] };
      } else if (event.type === 'done') finishReason = event.finishReason;
    }
    this.config.signal.throwIfAborted();
    if (!finishReason || !['stop', 'tool-calls'].includes(finishReason))
      throw new Error(
        `Model step did not complete: ${finishReason ?? 'missing terminal'}.`,
      );
    // Finish only after the SDK has verified the entire model stream. Callers
    // may show earlier progress, but must not dispatch the tool batch before it.
    yield {
      contentChunk: '',
      toolCallChunk: [],
      done: true,
      additionalInfo: {
        finishReason,
        outputItems: [...outputs.entries()]
          .sort(([a], [b]) => a - b)
          .map(([, item]) => item),
      },
    };
  }

  async generateObject<T extends z.ZodType>(
    input: GenerateObjectInput<T>,
  ): Promise<z.infer<T>> {
    const result = await this.model.generateText({
      ...this.request(input),
      responseFormat: {
        type: 'json-schema',
        schema: z.toJSONSchema(input.schema) as NimiJsonObject,
        strict: true,
      },
    });
    if (result.finishReason !== 'stop')
      throw new Error(
        `Structured response did not complete: ${result.finishReason}.`,
      );
    return input.schema.parse(JSON.parse(result.text));
  }

  async *streamObject<T extends z.ZodType>(
    input: GenerateObjectInput<T>,
  ): AsyncGenerator<Partial<z.infer<T>>> {
    let text = '';
    let finishReason: string | undefined;
    for await (const event of await this.model.streamText!({
      ...this.request(input),
      responseFormat: {
        type: 'json-schema',
        schema: z.toJSONSchema(input.schema) as NimiJsonObject,
        strict: true,
      },
    })) {
      if (event.type === 'text-delta') {
        text += event.text;
        let partial: unknown;
        try {
          partial = parsePartialJson(text);
        } catch {
          continue;
        }
        yield partial as Partial<z.infer<T>>;
      } else if (event.type === 'done') finishReason = event.finishReason;
    }
    this.config.signal.throwIfAborted();
    if (finishReason !== 'stop')
      throw new Error(
        `Structured response did not complete: ${finishReason ?? 'missing terminal'}.`,
      );
    yield input.schema.parse(JSON.parse(text));
  }
}

export class NimiEmbedding extends BaseEmbedding<VaneContext> {
  private capturedSpaceId: string | undefined;

  get spaceId(): string | undefined {
    return this.capturedSpaceId;
  }
  constructor(scope = vaneContext()) {
    super(scope);
  }

  async embedText(texts: string[]): Promise<number[][]> {
    const result: number[][] = [];
    for (let start = 0; start < texts.length; start += 16) {
      this.config.signal.throwIfAborted();
      const inputs = texts.slice(start, start + 16).map((text) => text.trim());
      const response = await this.config.services.ai.scenario.execute({
        type: 'text-embed',
        inputs,
      });
      this.config.signal.throwIfAborted();
      if (
        response.output.type !== 'text-embed' ||
        response.output.vectors.length !== inputs.length
      )
        throw new Error(
          'Embedding result does not match the submitted text batch.',
        );
      if (!response.output.spaceId)
        throw new Error('Nimi did not identify the embedding vector space.');
      if (
        this.capturedSpaceId &&
        response.output.spaceId !== this.capturedSpaceId
      )
        throw new Error(
          'The embedding model changed during this request. Retry with the current model.',
        );
      this.capturedSpaceId = response.output.spaceId;
      result.push(...response.output.vectors.map((vector) => [...vector]));
    }
    return result;
  }

  embedChunks(chunks: Chunk[]) {
    return this.embedText(chunks.map((chunk) => chunk.content));
  }
}
