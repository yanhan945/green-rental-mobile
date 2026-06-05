import { CLOUDBASE_ENV_ID, CLOUDBASE_REGION, ensureCloudbaseAuth } from "../lib/cloudbase";

function unwrapCloudFunctionResult(response) {
  const result = response?.result ?? response;
  if (typeof result === "string") {
    try {
      return JSON.parse(result);
    } catch {
      return result;
    }
  }
  return result;
}

function createCloudbaseCallError(action, error) {
  const message = error?.message || error?.errmsg || error?.errMsg || String(error || "未知错误");
  const wrappedError = new Error(`CloudBase 调用失败：${action}：${message}`);
  wrappedError.cause = error;
  return wrappedError;
}

export async function listGardenConsultations(params = { page: 1, pageSize: 20 }) {
  try {
    const app = await ensureCloudbaseAuth();
    const response = await app.callFunction({
      name: "listGardenConsultations",
      data: params,
      parse: true,
    });
    return unwrapCloudFunctionResult(response);
  } catch (error) {
    console.error("listGardenConsultations CloudBase 调用失败：", error);
    throw createCloudbaseCallError("listGardenConsultations", error);
  }
}

export async function updateGardenConsultationStatus(id, status) {
  try {
    const app = await ensureCloudbaseAuth();
    const response = await app.callFunction({
      name: "updateGardenConsultationStatus",
      data: { id, status },
      parse: true,
    });
    return unwrapCloudFunctionResult(response);
  } catch (error) {
    console.error("updateGardenConsultationStatus CloudBase 调用失败：", error);
    throw createCloudbaseCallError("updateGardenConsultationStatus", error);
  }
}

export function getGardenConsultationCloudEnv() {
  return {
    env: CLOUDBASE_ENV_ID,
    region: CLOUDBASE_REGION,
  };
}
