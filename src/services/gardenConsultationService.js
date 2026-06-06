import {
  SUPABASE_CONFIG_ERROR,
  SUPABASE_URL,
  isSupabaseConfigured,
  requireSupabaseClient,
} from "../lib/supabaseClient";

const GARDEN_CONSULTATION_TABLE = "garden_consultations";
const GARDEN_CONSULTATION_LIST_LIMIT = 50;
const GARDEN_CONSULTATION_LIST_FIELDS = [
  "id",
  "contact_name",
  "phone",
  "contact_time",
  "project_address",
  "area_range",
  "budget_range",
  "project_types",
  "service_needs",
  "style_preference",
  "status",
  "created_at",
  "updated_at",
].join(",");
const GARDEN_CONSULTATION_DETAIL_FIELDS = [
  GARDEN_CONSULTATION_LIST_FIELDS,
  "description",
  "image_urls",
].join(",");

const GARDEN_CONSULTATION_STATUSES = new Set(["pending", "contacted", "converted", "closed"]);

function getErrorMessage(error) {
  return error?.message || error?.details || error?.hint || String(error || "未知错误");
}

function logSupabaseQuery(table, action, startedAt, count, extra = {}) {
  if (!import.meta.env.DEV) return;
  const duration = Math.max(0, Math.round(performance.now() - startedAt));
  console.info("[supabase-query]", {
    table,
    action,
    ms: duration,
    count,
    ...extra,
  });
}

export function getGardenConsultationSupabaseConfig() {
  return {
    configured: isSupabaseConfigured(),
    table: GARDEN_CONSULTATION_TABLE,
    url: SUPABASE_URL,
  };
}

export async function listGardenConsultations() {
  if (!isSupabaseConfigured()) {
    throw new Error(SUPABASE_CONFIG_ERROR);
  }

  const supabase = requireSupabaseClient();
  const startedAt = performance.now();
  const { data, error } = await supabase
    .from(GARDEN_CONSULTATION_TABLE)
    .select(GARDEN_CONSULTATION_LIST_FIELDS)
    .order("created_at", { ascending: false })
    .range(0, GARDEN_CONSULTATION_LIST_LIMIT - 1);
  logSupabaseQuery(GARDEN_CONSULTATION_TABLE, "select list", startedAt, Array.isArray(data) ? data.length : 0, {
    limit: GARDEN_CONSULTATION_LIST_LIMIT,
  });

  if (error) {
    console.error("读取 garden_consultations 失败：", error);
    throw new Error(`读取园林咨询失败：${getErrorMessage(error)}`);
  }

  return Array.isArray(data) ? data : [];
}

export async function getGardenConsultationDetail(id) {
  if (!isSupabaseConfigured()) {
    throw new Error(SUPABASE_CONFIG_ERROR);
  }

  const supabase = requireSupabaseClient();
  const startedAt = performance.now();
  const { data, error } = await supabase
    .from(GARDEN_CONSULTATION_TABLE)
    .select(GARDEN_CONSULTATION_DETAIL_FIELDS)
    .eq("id", id)
    .single();
  logSupabaseQuery(GARDEN_CONSULTATION_TABLE, "select detail", startedAt, data ? 1 : 0, { id });

  if (error) {
    console.error("读取 garden_consultations 详情失败：", error);
    throw new Error(`读取园林咨询详情失败：${getErrorMessage(error)}`);
  }

  return data;
}

export async function updateGardenConsultationStatus(id, status) {
  if (!isSupabaseConfigured()) {
    throw new Error(SUPABASE_CONFIG_ERROR);
  }

  if (!GARDEN_CONSULTATION_STATUSES.has(status)) {
    throw new Error(`园林咨询状态不支持：${status}`);
  }

  const supabase = requireSupabaseClient();
  const startedAt = performance.now();
  const { error } = await supabase
    .from(GARDEN_CONSULTATION_TABLE)
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  logSupabaseQuery(GARDEN_CONSULTATION_TABLE, "update status", startedAt, 1, { id, status, ok: !error });

  if (error) {
    console.error("更新 garden_consultations 状态失败：", error);
    throw new Error(`更新园林咨询状态失败：${getErrorMessage(error)}`);
  }

  return { id, status };
}
