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

export async function listGardenConsultations(params = { page: 1, pageSize: 20 }) {
  const app = await ensureCloudbaseAuth();
  const response = await app.callFunction({
    name: "listGardenConsultations",
    data: params,
    parse: true,
  });
  return unwrapCloudFunctionResult(response);
}

export async function updateGardenConsultationStatus(id, status) {
  const app = await ensureCloudbaseAuth();
  const response = await app.callFunction({
    name: "updateGardenConsultationStatus",
    data: { id, status },
    parse: true,
  });
  return unwrapCloudFunctionResult(response);
}

export function getGardenConsultationCloudEnv() {
  return {
    env: CLOUDBASE_ENV_ID,
    region: CLOUDBASE_REGION,
  };
}
