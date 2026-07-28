const PUBLISHED_DATA_PATH =
  /^(?:version\.json|(?:en|es|data)\/[A-Za-z0-9][A-Za-z0-9_-]*\.json)$/;

export function isPublishedDataPath(filePath) {
  return typeof filePath === 'string' && PUBLISHED_DATA_PATH.test(filePath);
}
