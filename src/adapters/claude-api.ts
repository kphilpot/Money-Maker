import Anthropic from "@anthropic-ai/sdk";
import type { ApiResponse, SelectedModel } from "../types";

type SupportedMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

export const modelMap: Record<SelectedModel, string> = {
  haiku: "claude-haiku-4-5-20251001",
  sonnet: "claude-sonnet-4-6",
  opus: "claude-opus-4-6",
};

function getBase64Data(screenshot: string): { mediaType: SupportedMediaType; data: string } | null {
  const match = screenshot.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    return null;
  }

  const mediaType = match[1];
  if (mediaType !== "image/jpeg" && mediaType !== "image/png" && mediaType !== "image/gif" && mediaType !== "image/webp") {
    return null;
  }

  return {
    mediaType,
    data: match[2],
  };
}

export async function performApiVerification(
  screenshot: string,
  prompt: string,
  apiKey: string,
  model: SelectedModel,
): Promise<ApiResponse> {
  try {
    const client = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true,
    });

    const imageSource = getBase64Data(screenshot);
    if (!imageSource) {
      return {
        success: false,
        response: "",
        error: "Invalid screenshot format",
        errorCode: "INVALID_SCREENSHOT",
      };
    }

    const response = await client.messages.create({
      model: modelMap[model],
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: imageSource.mediaType,
                data: imageSource.data,
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    });

    const responseText = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim() || "No response";

    return {
      success: true,
      response: responseText,
      tokenCount: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown API error";
    const status = typeof error === "object" && error && "status" in error ? Number((error as { status?: number }).status) : undefined;

    if (status === 401 || /authentication|api key|unauthorized/i.test(message)) {
      return {
        success: false,
        response: "",
        error: "Invalid API key",
        errorCode: "AUTH_FAILED",
      };
    }

    if (status === 429 || /rate limit|too many requests/i.test(message)) {
      return {
        success: false,
        response: "",
        error: "Rate limited - try again in a moment",
        errorCode: "RATE_LIMITED",
      };
    }

    return {
      success: false,
      response: "",
      error: message,
      errorCode: "API_ERROR",
    };
  }
}
