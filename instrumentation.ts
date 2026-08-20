export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const [{ logger }, { metrics }] = await Promise.all([
    import("@/lib/logger"),
    import("@/lib/metrics"),
  ]);

  metrics();
  logger.info({ event: "server.start" });
}
