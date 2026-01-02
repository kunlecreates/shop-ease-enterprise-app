export async function waitFor(conditionFn: () => Promise<boolean>, timeoutMs = 10000, intervalMs = 250) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await conditionFn()) return true;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}
