/** Wait for started work to finish before exposing a batch failure. */
export async function settleTasks<T>(tasks: Promise<T>[]): Promise<T[]> {
  const outcomes = await Promise.allSettled(tasks);
  const failed = outcomes.find((outcome) => outcome.status === 'rejected');
  if (failed?.status === 'rejected') throw failed.reason;
  return outcomes.map(
    (outcome) => (outcome as PromiseFulfilledResult<T>).value,
  );
}
