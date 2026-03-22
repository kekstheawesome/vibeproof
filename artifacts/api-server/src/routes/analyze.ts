import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { AnalyzeTextBody, AnalyzeTextResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are a calm, empathetic red-flag detection assistant. Your job is to analyze text messages or conversations for signs of manipulation, coercion, dishonesty, aggression, boundary violations, or controlling behavior.

Guidelines:
- Be objective and evidence-based. Only flag things that are clearly present in the text.
- Never assume bad intent without clear evidence. When in doubt, acknowledge ambiguity.
- Use a calm, non-alarmist tone. Your goal is to inform and empower, not to frighten.
- Provide specific quotes as evidence for each red flag.
- If the context is unclear, indicate that more context is needed and ask clarifying questions.
- Suggested responses should be calm, assertive, and healthy.
- Be culturally sensitive and avoid assumptions based on communication style differences.

Severity scale:
- 0: No red flags detected. Communication appears healthy.
- 1: Very mild concern. Minor patterns worth noting but not alarming.
- 2: Mild concern. Some patterns that could be worth addressing.
- 3: Moderate concern. Clear patterns of problematic behavior present.
- 4: High concern. Multiple serious red flags. Consider seeking support.
- 5: Severe concern. Highly alarming behavior. Safety may be a concern.

Severity labels:
- 0: "No red flags"
- 1: "Very mild concern"
- 2: "Mild concern"
- 3: "Moderate concern"
- 4: "High concern"
- 5: "Severe concern"

Categories of red flags:
- Manipulation: guilt-tripping, gaslighting, love bombing, playing victim
- Coercion: threats, ultimatums, pressure tactics
- Dishonesty: lies, deception, inconsistencies
- Aggression: verbal attacks, name-calling, hostility, rage
- Boundary violations: ignoring stated limits, entitlement, invasion of privacy
- Control: isolating behavior, financial control, monitoring/surveillance
- Emotional abuse: belittling, humiliation, dismissiveness

Return a JSON object with exactly this structure:
{
  "severityScore": <number 0-5>,
  "severityLabel": <string>,
  "redFlags": [
    {
      "category": <string>,
      "quote": <string - exact quote from the text>,
      "explanation": <string - why this is a red flag>
    }
  ],
  "overallExplanation": <string - calm, clear 2-3 sentence summary>,
  "suggestedResponses": [<string>, ...],
  "needsMoreContext": <boolean>,
  "contextQuestions": [<string>, ...]
}`;

router.post("/analyze", async (req, res) => {
  const parseResult = AnalyzeTextBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { imageBase64, text, context } = parseResult.data;

  if (!imageBase64 && !text) {
    res.status(400).json({ error: "At least one of imageBase64 or text must be provided" });
    return;
  }

  try {
    const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];

    if (imageBase64) {
      const imageData = imageBase64.startsWith("data:")
        ? imageBase64
        : `data:image/jpeg;base64,${imageBase64}`;
      userContent.push({
        type: "image_url",
        image_url: { url: imageData },
      });
      userContent.push({
        type: "text",
        text: "Please analyze this screenshot of a text conversation for red flags.",
      });
    }

    if (text) {
      userContent.push({
        type: "text",
        text: `Please analyze this text conversation for red flags:\n\n${text}`,
      });
    }

    if (context) {
      userContent.push({
        type: "text",
        text: `Additional context from the user: ${context}`,
      });
    }

    userContent.push({
      type: "text",
      text: "Return your analysis as a JSON object following the exact structure specified.",
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: userContent as Parameters<typeof openai.chat.completions.create>[0]["messages"][0]["content"],
        },
      ],
      response_format: { type: "json_object" },
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      req.log.error("No content in OpenAI response");
      res.status(500).json({ error: "Failed to get analysis from AI" });
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      req.log.error({ rawContent }, "Failed to parse AI response as JSON");
      res.status(500).json({ error: "Failed to parse AI response" });
      return;
    }

    const validated = AnalyzeTextResponse.safeParse(parsed);
    if (!validated.success) {
      req.log.error({ issues: validated.error.issues }, "AI response failed schema validation");
      res.status(500).json({ error: "AI response did not match expected format" });
      return;
    }

    res.json(validated.data);
  } catch (err) {
    req.log.error({ err }, "Error calling OpenAI API");
    res.status(500).json({ error: "Failed to analyze text" });
  }
});

export default router;
