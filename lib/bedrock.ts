import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';

const region = process.env.AWS_REGION || 'us-east-1';

function getBedrockCredentials() {
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      ...(process.env.AWS_SESSION_TOKEN
        ? { sessionToken: process.env.AWS_SESSION_TOKEN }
        : {}),
    };
  }

  // Fall back to the standard AWS provider chain so production can use
  // IAM roles, ECS task roles, EC2 instance profiles, or local AWS profiles.
  return fromNodeProviderChain();
}

const bedrock = new BedrockRuntimeClient({
  region,
  credentials: getBedrockCredentials(),
});

const MODEL_ID = process.env.AWS_BEDROCK_MODEL_ID || 'us.amazon.nova-micro-v1:0';

export interface BedrockMessage {
  role: 'user' | 'assistant';
  content: string;
}

function isAnthropicModel(modelId: string): boolean {
  return modelId.includes('anthropic');
}

function buildRequestBody(
  modelId: string,
  messages: BedrockMessage[],
  system?: string,
  maxTokens = 1024,
): string {
  if (isAnthropicModel(modelId)) {
    const body: Record<string, unknown> = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: maxTokens,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    };
    if (system) body.system = system;
    return JSON.stringify(body);
  }

  // Amazon Nova / Converse-compatible format
  const novaMessages = messages.map((m) => ({
    role: m.role,
    content: [{ text: m.content }],
  }));

  const body: Record<string, unknown> = {
    messages: novaMessages,
    inferenceConfig: { max_new_tokens: maxTokens },
  };
  if (system) {
    body.system = [{ text: system }];
  }
  return JSON.stringify(body);
}

function parseResponse(modelId: string, raw: string): string {
  const result = JSON.parse(raw);

  if (isAnthropicModel(modelId)) {
    return result.content?.[0]?.text ?? '';
  }

  // Amazon Nova format
  return result.output?.message?.content?.[0]?.text ?? '';
}

export async function invokeModel(
  messages: BedrockMessage[],
  system?: string,
  maxTokens = 1024,
): Promise<string> {
  const command = new InvokeModelCommand({
    modelId: MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: buildRequestBody(MODEL_ID, messages, system, maxTokens),
  });

  const response = await bedrock.send(command);
  return parseResponse(MODEL_ID, new TextDecoder().decode(response.body));
}
