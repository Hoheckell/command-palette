import OpenAI from "openai";

let client: OpenAI | null = null;
let clientApiKey: string | null = null;

function getClient() {
  const apiKey =
    localStorage.getItem(
      "openrouter_api_key"
    );

  if (!apiKey) {
    throw new Error(
      "API key não configurada"
    );
  }

  if (!client || clientApiKey !== apiKey) {
    client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
    clientApiKey = apiKey;
  }

  return client;
}

function normalizeContent(
  content: unknown
) {
  if (
    typeof content === "string"
  ) {
    return content;
  }

  if (
    Array.isArray(content)
  ) {
    return content
      .map(item => {
        if (
          typeof item === "string"
        ) {
          return item;
        }

        if (
          item &&
          typeof item === "object" &&
          "text" in item &&
          typeof item.text === "string"
        ) {
          return item.text;
        }

        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  if (
    content == null
  ) {
    return "";
  }

  return String(content);
}

const FREE_MODELS = [
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
  "deepseek/deepseek-v4-flash:free",
  "openai/gpt-oss-20b:free",
  "openai/gpt-oss-120b:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "qwen/qwen3-coder:free",
  "minimax/minimax-m2.5:free"
];

export async function explainCommand(
  command: string,
  tldr: string
) {
  const openrouter =
    getClient();
    for (const model of FREE_MODELS) {
      try {
        const completion = await openrouter.chat.completions.create({
     model: model,
  messages: [
          {
            role: "system",
            content: `
Você é um especialista Linux.

Explique comandos terminal
de forma técnica e didática.

Explique:
- objetivo
- funcionamento
- flags
- exemplos reais
- riscos
- erros comuns
- dicas
`
          },
          {
            role: "user",
            content: `
Comando:
${command}

TLDR:
${tldr}
`
          }
        ],
        stream: true
    });
    
let response = "";
 for await (const chunk of completion) {
  const content =
    chunk.choices?.[0]?.delta?.content;

  if (content) {
    response += content;

  }
}

  return (
    normalizeContent(
      response
    ) || "Sem resposta"
  );
  } catch (err: any) {
      if (err?.status !== 429) {
        console.error(err);
      }
    }
  }
  throw new Error("Todos os modelos free falharam");
}


