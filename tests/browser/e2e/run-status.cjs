function getExitCode(results, hasRuntimeError = false) {
  if (hasRuntimeError) return 1;
  return results.some(result => result?.status === 'FAIL' || result?.status === 'BLOCK') ? 1 : 0;
}

module.exports = { getExitCode };
