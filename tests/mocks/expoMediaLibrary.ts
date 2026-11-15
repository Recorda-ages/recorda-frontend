export function usePermissions() {
  const permission = { canAskAgain: true, granted: false, status: "denied" };
  const requestPermission = () => Promise.resolve(permission);

  return [permission, requestPermission] as const;
}

export async function getAssetsAsync() {
  return { assets: [] };
}

export async function getAssetInfoAsync() {
  return { localUri: "file://mock.jpg" };
}
