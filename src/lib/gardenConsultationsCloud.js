const GARDEN_CONSULTATION_ENV_ID = import.meta.env.VITE_TCB_ENV_ID || "cloud1";
const GARDEN_CONSULTATION_REGION = import.meta.env.VITE_TCB_REGION || "ap-shanghai";
const CLOUDBASE_CDN_URL = "https://static.cloudbase.net/cloudbase-js-sdk/3.0.1/cloudbase.full.js";

let cloudbaseApp = null;
let anonymousSignInPromise = null;
let cloudbaseSdkPromise = null;

function loadCloudbaseSdkFromCdn() {
  if (window.cloudbase) return Promise.resolve(window.cloudbase);
  if (cloudbaseSdkPromise) return cloudbaseSdkPromise;

  cloudbaseSdkPromise = new Promise((resolve, reject) => {
    const existedScript = document.querySelector(`script[data-garden-cloudbase-sdk="true"]`);
    if (existedScript) {
      existedScript.addEventListener("load", () => resolve(window.cloudbase), { once: true });
      existedScript.addEventListener("error", () => reject(new Error("CloudBase Web SDK 加载失败。")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = CLOUDBASE_CDN_URL;
    script.async = true;
    script.dataset.gardenCloudbaseSdk = "true";

    const timer = window.setTimeout(() => {
      reject(new Error("CloudBase Web SDK 加载超时，请检查网络或安全域名配置。"));
    }, 12000);

    script.onload = () => {
      window.clearTimeout(timer);
      if (window.cloudbase) {
        resolve(window.cloudbase);
        return;
      }
      reject(new Error("CloudBase Web SDK 已加载，但未找到 cloudbase 全局对象。"));
    };

    script.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error("CloudBase Web SDK 加载失败，请检查 static.cloudbase.net 是否可访问。"));
    };

    document.head.appendChild(script);
  }).catch((error) => {
    cloudbaseSdkPromise = null;
    throw error;
  });

  return cloudbaseSdkPromise;
}

async function getCloudbaseApp() {
  if (!cloudbaseApp) {
    const cloudbase = await loadCloudbaseSdkFromCdn();
    cloudbaseApp = cloudbase.init({
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
