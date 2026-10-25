const ALLOWED_BALLAD_CONTROLS = new Set(["openPreview", "openAudit", "openApply", "openEnsureInjectionMacros"]);

export function invokeBalladControl(api, operation, report = console.error) {
  if (!ALLOWED_BALLAD_CONTROLS.has(operation)) return Promise.resolve(null);
  const action = api?.premium?.ascendancy?.ballad?.[operation];
  return Promise.resolve(typeof action === "function" ? action() : null).catch(error => {
    report(`regionwright Ballad control ${operation} failed.`, error);
    return null;
  });
}
