import { Langfuse } from "langfuse";

if (!process.env.LANGFUSE_SECRET_KEY) {
  throw new Error("LANGFUSE_SECRET_KEY must be set.");
}
if (!process.env.LANGFUSE_PUBLIC_KEY) {
  throw new Error("LANGFUSE_PUBLIC_KEY must be set.");
}

export const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL ?? "https://cloud.langfuse.com",
  flushAt: 1,
});

langfuse.on("error", (err) => {
  console.error("Langfuse error:", err);
});
