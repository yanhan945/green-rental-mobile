export const CLOUDBASE_ENV_ID = "deprecated";
export const CLOUDBASE_REGION = "deprecated";

const DEPRECATED_CLOUDBASE_ERROR = "CloudBase 已停用：GardenOS 网站端请使用 Supabase 数据服务。";

export function getCloudbaseApp() {
  throw new Error(DEPRECATED_CLOUDBASE_ERROR);
}

export async function ensureCloudbaseAuth() {
  throw new Error(DEPRECATED_CLOUDBASE_ERROR);
}
