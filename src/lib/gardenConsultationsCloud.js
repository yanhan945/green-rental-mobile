const GARDEN_CONSULTATION_ENV_ID = import.meta.env.VITE_TCB_ENV_ID || "cloud1";
const GARDEN_CONSULTATION_REGION = import.meta.env.VITE_TCB_REGION || "ap-shanghai";

let cloudbaseApp = null;
let anonymousSignInPromise = null;

async function getCloudbaseApp() {
  if (!cloudbaseApp) {
    const Cloudbase = (await import("@cloudbase/js-sdk")).default;
    cloudbaseApp = Cloudbase.init({
      env: GARDEN_CONSULTATION_ENV_ID,
      region: GARDEN_CONSULTATION_REGION,
    });
  }
  return cloudbaseApp;
}

async function ensureCloudbaseAuth() {
  const app = await getCloudbaseApp();
  const auth = app.auth();

  if (!anonymousSignInPromise) {
    anonymousSignInPromise = auth.signInAnonymously().catch((error) => {
      anonymousSignInPromise = null;
      throw error;
    });
  }

  const response = await anonymousSignInPromise;
  if (response?.error) {
    anonymousSignInPromise = null;
    throw response.error;
  }
  return app;
}

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
    env: GARDEN_CONSULTATION_ENV_ID,
    region: GARDEN_CONSULTATION_REGION,
  };
}
