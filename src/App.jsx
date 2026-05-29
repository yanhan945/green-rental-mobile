import { useEffect, useMemo, useRef, useState } from "react";
import { ImageUploader } from "./components/common/ImageUploader";
import { AuthPage } from "./components/auth/AuthPage";
import { GardenIcons } from "./GardenIcons";
import { StaffMobile } from "./components/staff/StaffMobile";
import { supabase } from "./lib/supabaseClient";
import "./App.css";

const SUPABASE_URL = "https://kvdxgyymlfnnurdigtkj.supabase.co";
const SUPABASE_KEY = "sb_publishable_FFoHUmn4RwaOkvx2XK7QHg__O7iWYdJ";
const ORDERS_API = `${SUPABASE_URL}/rest/v1/orders`;

const STORAGE_KEY = "green-rental-mobile-v24";
const PRODUCT_STORAGE_KEY = "green-rental-products-v29";
const CUSTOMER_STORAGE_KEY = "green-rental-customers-v31";
const STAFF_AVATAR_STORAGE_KEY = "green-rental-staff-avatar-v1";
const CURRENT_STAFF_STORAGE_KEY = "green-rental-current-staff-v1";
const PRODUCT_CLOUD_ID = 999999001;

const ORDER_STATUS = ["待接单", "配置中", "待商户确认", "方案已确认", "执行中", "待商户归档", "已完成"];
const MERCHANT_STATUS_TABS = ["全部", ...ORDER_STATUS];

const ORDER_SOURCES = ["商户派单", "客户预约", "电话登记", "线下登记"];
const DELIVERY_STATUS = ["未出发", "前往中", "已到达"];
const EXECUTION_STATUS = ["待联系", "已联系", "已出发", "已到达", "已完成服务"];
const CUSTOMER_CONFIRM_STATUS = ["待确认", "已确认", "有异议"];
const PLAN_LINK_STATUS = ["未生成", "已复制", "已发送"];

const organizations = [
  {
    id: "org-001",
    name: "绿植租赁总部",
    city: "杭州",
    status: "active",
  },
];

const staffMembers = [
  {
    id: "staff-001",
    staffNo: "YG001",
    name: "张三",
    email: "zhangsan@example.com",
    phone: "13800000001",
    role: "staff",
    status: "active",
    organizationId: "org-001",
    area: "杭州 / 滨江",
    createdAt: "2026-05-01 09:00",
    lastLoginAt: "2026-05-29 09:20",
  },
  {
    id: "staff-002",
    staffNo: "YG002",
    name: "李四",
    email: "lisi@example.com",
    phone: "13800000002",
    role: "manager",
    status: "active",
    organizationId: "org-001",
    area: "杭州 / 上城",
    createdAt: "2026-05-03 10:15",
    lastLoginAt: "2026-05-28 18:40",
  },
  {
    id: "staff-003",
    staffNo: "YG003",
    name: "王五",
    email: "wangwu@example.com",
    phone: "13800000003",
    role: "staff",
    status: "paused",
    organizationId: "org-001",
    area: "杭州 / 西湖",
    createdAt: "2026-05-06 14:20",
    lastLoginAt: "2026-05-22 11:10",
  },
];

const merchantUsers = [
  {
    id: "user-owner-001",
    name: "老板账号",
    email: "owner@example.com",
    role: "owner",
    organizationId: "org-001",
    status: "active",
  },
  {
    id: "user-admin-001",
    name: "运营管理员",
    email: "admin@example.com",
    role: "admin",
    organizationId: "org-001",
    status: "active",
  },
];

const ROLE_LABELS = {
  owner: "老板 / 超级管理员",
  admin: "管理员",
  manager: "店长 / 经理",
  staff: "普通员工",
};

const ACCOUNT_STATUS_LABELS = {
  active: "启用",
  paused: "停用账号",
  disabled: "停用",
};

const DEFAULT_STAFF_ID = "staff-001";

const productCategories = ["室内绿植", "室外植物", "月租套餐", "仿真植物"];
const subCategories = ["大型植物", "中型植物", "小型植物", "水培植物", "盆景植物"];

const defaultProducts = [
  { id: 1, name: "原生发财树", category: "室内绿植", subCategory: "大型植物", description: "寓意财源滚滚，适合前台、办公室、会议室。", pricePerDay: 2.5, image: "🌳" },
  { id: 2, name: "天堂鸟", category: "室内绿植", subCategory: "大型植物", description: "株型舒展，适合大堂、休息区、开放办公区。", pricePerDay: 3.2, image: "🪴" },
  { id: 3, name: "绿萝柱", category: "室内绿植", subCategory: "中型植物", description: "耐阴好养，适合办公室角落和走廊区域。", pricePerDay: 1.6, image: "🌿" },
  { id: 4, name: "红掌", category: "室内绿植", subCategory: "小型植物", description: "颜色鲜明，适合前台、桌面、接待区点缀。", pricePerDay: 0.8, image: "🌺" },
  { id: 5, name: "水培白掌", category: "室内绿植", subCategory: "水培植物", description: "干净清爽，适合会议桌、茶水间、前台。", pricePerDay: 0.7, image: "💧" },
  { id: 6, name: "罗汉松盆景", category: "室内绿植", subCategory: "盆景植物", description: "稳重大气，适合老板办公室、会客区。", pricePerDay: 4.5, image: "🎍" },
  { id: 7, name: "户外铁树", category: "室外植物", subCategory: "大型植物", description: "耐晒耐养，适合门口、庭院、园区入口。", pricePerDay: 3.8, image: "🌴" },
  { id: 8, name: "月租前台组合", category: "月租套餐", subCategory: "中型植物", description: "适合前台和接待区的基础组合套餐。", pricePerDay: 5.8, image: "🧺" },
  { id: 9, name: "仿真龟背竹", category: "仿真植物", subCategory: "大型植物", description: "无需养护，适合光线不足或维护不便区域。", pricePerDay: 1.2, image: "🍃" },
];

const initialOrders = [
  {
    id: 1,
    customerName: "杭州东站办公室",
    contactName: "王经理",
    phone: "13800001111",
    status: "待接单",
    deliveryStatus: "未出发",
    executionStatus: "待联系",
    customerConfirmStatus: "待确认",
    merchantConfirmStatus: "未提交",
    planLinkStatus: "未生成",
    tags: ["需比价", "室外", "租过绿植"],
    areaSize: "300㎡",
    expectedDate: "2026-05-28",
    address: "杭州市上城区杭州东站附近",
    description: "客户希望办公室和门口都摆放绿植，偏好大气、好养护的植物。",
    dispatchTime: "2026-05-24 21:30",
    source: "商户派单",
    assignedStaffId: "staff-001",
    assignedStaffName: "张三",
    assignedStaffEmail: "zhangsan@example.com",
    staffLocation: null,
    distanceText: "待定位",
    etaText: "待定位",
    fieldNote: "",
    internalNote: "",
    revisionReason: "",
    timeline: [{ time: "2026-05-24 21:30", action: "商户创建订单" }],
    plan: null,
  },
  {
    id: 2,
    customerName: "滨江科技公司",
    contactName: "李总",
    phone: "13900002222",
    status: "待接单",
    deliveryStatus: "未出发",
    executionStatus: "待联系",
    customerConfirmStatus: "待确认",
    merchantConfirmStatus: "未提交",
    planLinkStatus: "未生成",
    tags: ["办公室", "长期租赁"],
    areaSize: "500㎡",
    expectedDate: "2026-06-01",
    address: "杭州市滨江区江南大道",
    description: "需要为前台、会议室、开放办公区配置绿植方案。",
    dispatchTime: "2026-05-24 19:10",
    source: "客户预约",
    assignedStaffId: "staff-001",
    assignedStaffName: "张三",
    assignedStaffEmail: "zhangsan@example.com",
    staffLocation: null,
    distanceText: "待定位",
    etaText: "待定位",
    fieldNote: "",
    internalNote: "",
    revisionReason: "",
    timeline: [{ time: "2026-05-24 19:10", action: "客户预约生成订单" }],
    plan: null,
  },
];

function nowText() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${min}`;
}

function getStaffMemberById(staffId) {
  return staffMembers.find((member) => member.id === staffId) || null;
}

function getOrganizationById(organizationId) {
  return organizations.find((organization) => organization.id === organizationId) || null;
}

function getDefaultAssignedStaff() {
  return getStaffMemberById(DEFAULT_STAFF_ID) || staffMembers[0] || null;
}

function resolveAuthAccountByEmail(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return null;

  // 本地开发阶段临时映射；正式版应从 profiles 表读取 role、organizationId、staffNo、name。
  if (normalizedEmail === "1464155122@qq.com") {
    return {
      id: "user-dev-owner-1464155122",
      name: "测试商户账号",
      email: normalizedEmail,
      role: "owner",
      status: "active",
      organizationId: "org-001",
      userType: "merchant",
    };
  }

  const merchantUser = merchantUsers.find((user) => user.email.toLowerCase() === normalizedEmail);
  if (merchantUser) return { ...merchantUser, userType: "merchant" };

  const staffMember = staffMembers.find((member) => member.email.toLowerCase() === normalizedEmail);
  if (staffMember) {
    return {
      ...staffMember,
      userType: staffMember.role === "staff" ? "staff" : "merchant",
    };
  }

  // 正式版应从 profiles 表读取 role、organizationId、staffNo、name，再决定进入员工端或商户端。
  return {
    id: "auth-unknown",
    name: normalizedEmail,
    email: normalizedEmail,
    role: "staff",
    status: "active",
    organizationId: "org-001",
    userType: "staff",
  };
}

function cloudHeaders(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

function ensureOrderDefaults(order) {
  const assignedStaff = getStaffMemberById(order.assignedStaffId) || getDefaultAssignedStaff();
  return {
    deliveryStatus: "未出发",
    executionStatus: "待联系",
    customerConfirmStatus: "待确认",
    merchantConfirmStatus: "未提交",
    planLinkStatus: "未生成",
    staffLocation: null,
    distanceText: "待定位",
    etaText: "待定位",
    contactName: order.contactName || "待确认",
    phone: order.phone || "",
    source: order.source || "商户派单",
    assignedStaffId: order.assignedStaffId || assignedStaff?.id || "",
    assignedStaffName: order.assignedStaffName || assignedStaff?.name || "",
    assignedStaffEmail: order.assignedStaffEmail || assignedStaff?.email || "",
    communicationQrUrl: order.communicationQrUrl || "",
    serviceType: order.serviceType || "租赁",
    planType: order.planType || "",
    areaType: order.areaType || "",
    hasRentedBefore: Boolean(order.hasRentedBefore),
    needComparePrice: Boolean(order.needComparePrice),
    urgent: Boolean(order.urgent),
    importantCustomer: Boolean(order.importantCustomer),
    plannedPlantCount: order.plannedPlantCount || "",
    budget: order.budget || "",
    merchantNote: order.merchantNote || "",
    areaNote: order.areaNote || "",
    fieldNote: order.fieldNote || "",
    internalNote: order.internalNote || "",
    revisionReason: order.revisionReason || "",
    timeline: Array.isArray(order.timeline) ? order.timeline : [],
    plan: order.plan || null,
    ...order,
  };
}

function normalizeOrders(data) {
  const orders = Array.isArray(data) ? data : initialOrders;
  return orders.map(ensureOrderDefaults);
}

function loadOrdersFromLocalStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return normalizeOrders(initialOrders);

    const parsed = JSON.parse(raw);
    return normalizeOrders(parsed?.orders);
  } catch (error) {
    console.error("读取本地订单失败：", error);
    return normalizeOrders(initialOrders);
  }
}

function persistOrdersToLocalStore(orders) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        source: "localStorage",
        savedAt: nowText(),
        orders,
      })
    );
  } catch (error) {
    console.error("保存本地订单失败：", error);
  }
}

function normalizeProducts(data) {
  const list = Array.isArray(data) ? data : defaultProducts;
  return list.map((product) => {
    const rawStatus = product?.status || "已上架";
    const status = rawStatus === "停用" || rawStatus === "未上架" ? "未上架" : "已上架";
    return {
      stock: "充足",
      imageUrl: "",
      note: "",
      ...product,
      status,
    };
  });
}

function loadProductsFromLocalStore() {
  try {
    const raw = localStorage.getItem(PRODUCT_STORAGE_KEY);
    if (!raw) return normalizeProducts(defaultProducts);

    const parsed = JSON.parse(raw);
    return normalizeProducts(parsed?.products);
  } catch (error) {
    console.error("读取本地商品库失败：", error);
    return normalizeProducts(defaultProducts);
  }
}

function persistProductsToLocalStore(products) {
  try {
    localStorage.setItem(
      PRODUCT_STORAGE_KEY,
      JSON.stringify({
        source: "localStorage",
        savedAt: nowText(),
        products,
      })
    );
  } catch (error) {
    console.error("保存本地商品库失败：", error);
  }
}

function getProductImage(product) {
  return product?.imageUrl || product?.image || "🪴";
}

function isImageUrl(value) {
  return /^(https?:\/\/|data:image\/|blob:)/i.test(String(value || "").trim());
}

function loadStaffAvatarFromLocalStore() {
  try {
    return localStorage.getItem(STAFF_AVATAR_STORAGE_KEY) || "";
  } catch (error) {
    console.error("读取员工头像失败：", error);
    return "";
  }
}

function persistStaffAvatarToLocalStore(staffAvatar) {
  try {
    localStorage.setItem(STAFF_AVATAR_STORAGE_KEY, staffAvatar || "");
  } catch (error) {
    console.error("保存员工头像失败：", error);
  }
}

function loadCurrentStaffIdFromLocalStore() {
  try {
    const stored = localStorage.getItem(CURRENT_STAFF_STORAGE_KEY);
    return getStaffMemberById(stored) ? stored : DEFAULT_STAFF_ID;
  } catch (error) {
    console.error("读取当前员工失败：", error);
    return DEFAULT_STAFF_ID;
  }
}

function persistCurrentStaffIdToLocalStore(currentStaffId) {
  try {
    localStorage.setItem(CURRENT_STAFF_STORAGE_KEY, currentStaffId || DEFAULT_STAFF_ID);
  } catch (error) {
    console.error("保存当前员工失败：", error);
  }
}

function normalizeCustomers(data) {
  const list = Array.isArray(data) ? data : [];
  return list
    .filter((customer) => customer && customer.name)
    .map((customer) => ({
      id: customer.id || `customer-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: customer.name || "未命名客户",
      contactName: customer.contactName || "",
      phone: customer.phone || "",
      address: customer.address || "",
      areaSize: customer.areaSize || "",
      note: customer.note || "",
      tagsText: customer.tagsText || "办公室,长期租赁",
      createdAt: customer.createdAt || nowText(),
      updatedAt: customer.updatedAt || nowText(),
    }));
}

function loadCustomersFromLocalStore() {
  try {
    const raw = localStorage.getItem(CUSTOMER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return normalizeCustomers(parsed?.customers);
  } catch (error) {
    console.error("读取本地客户库失败：", error);
    return [];
  }
}

function persistCustomersToLocalStore(customers) {
  try {
    localStorage.setItem(
      CUSTOMER_STORAGE_KEY,
      JSON.stringify({ source: "localStorage", savedAt: nowText(), customers })
    );
  } catch (error) {
    console.error("保存本地客户库失败：", error);
  }
}

function mergeCustomers(currentCustomers, orders) {
  const map = new Map(normalizeCustomers(currentCustomers).map((customer) => [customer.id, customer]));

  orders.forEach((order) => {
    if (!order?.customerName) return;
    const stableKey = order.customerId || `auto-${order.phone || order.customerName}-${order.address || ""}`;
    const existed = map.get(stableKey);
    map.set(stableKey, {
      id: stableKey,
      name: order.customerName,
      contactName: order.contactName || existed?.contactName || "",
      phone: order.phone || existed?.phone || "",
      address: order.address || existed?.address || "",
      areaSize: order.areaSize || existed?.areaSize || "",
      note: existed?.note || "",
      tagsText: Array.isArray(order.tags) ? order.tags.join(",") : existed?.tagsText || "办公室,长期租赁",
      createdAt: existed?.createdAt || order.dispatchTime || nowText(),
      updatedAt: nowText(),
    });
  });

  return Array.from(map.values());
}

async function fetchOrdersFromCloud() {
  const response = await fetch(`${ORDERS_API}?select=id,data,updated_at&order=updated_at.desc`, {
    method: "GET",
    headers: cloudHeaders(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`读取云端失败：${response.status} ${text}`);
  }

  const rows = await response.json();
  return normalizeOrders(rows.map((row) => row.data).filter((item) => item?.type !== "product_library"));
}

async function fetchProductsFromCloud() {
  const response = await fetch(`${ORDERS_API}?id=eq.${PRODUCT_CLOUD_ID}&select=id,data,updated_at`, {
    method: "GET",
    headers: cloudHeaders(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`读取云端商品库失败：${response.status} ${text}`);
  }

  const rows = await response.json();
  const cloudProducts = rows?.[0]?.data?.products;
  return Array.isArray(cloudProducts) ? normalizeProducts(cloudProducts) : [];
}

async function upsertProductsToCloud(products) {
  const response = await fetch(`${ORDERS_API}?on_conflict=id`, {
    method: "POST",
    headers: cloudHeaders({ Prefer: "resolution=merge-duplicates,return=minimal" }),
    body: JSON.stringify({
      id: PRODUCT_CLOUD_ID,
      data: { type: "product_library", products, updatedAt: nowText() },
      updated_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`同步商品库失败：${response.status} ${text}`);
  }
}

async function upsertOrderToCloud(order) {
  const response = await fetch(`${ORDERS_API}?on_conflict=id`, {
    method: "POST",
    headers: cloudHeaders({
      Prefer: "resolution=merge-duplicates,return=minimal",
    }),
    body: JSON.stringify({
      id: order.id,
      data: order,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`写入云端失败：${response.status} ${text}`);
  }
}

async function upsertOrdersToCloud(orders) {
  if (!orders.length) return;

  const response = await fetch(`${ORDERS_API}?on_conflict=id`, {
    method: "POST",
    headers: cloudHeaders({
      Prefer: "resolution=merge-duplicates,return=minimal",
    }),
    body: JSON.stringify(
      orders.map((order) => ({
        id: order.id,
        data: order,
        updated_at: new Date().toISOString(),
      }))
    ),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`批量写入云端失败：${response.status} ${text}`);
  }
}

function money(value) {
  return Number(value || 0).toFixed(1);
}

function safeAreas(plan) {
  return Array.isArray(plan?.areas) ? plan.areas : [];
}

function safeItems(area) {
  return Array.isArray(area?.items) ? area.items : [];
}

function safeTimeline(order) {
  return Array.isArray(order?.timeline) ? order.timeline : [];
}

function getAreaProductCount(area) {
  return safeItems(area).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

function getAreaDailyRent(area) {
  return safeItems(area).reduce((sum, item) => {
    return sum + Number(item.pricePerDay || 0) * Number(item.quantity || 0);
  }, 0);
}

const MAINTENANCE_PACKAGES = [
  {
    name: "基础养护",
    scene: "适合少量办公室绿植 / 家庭绿植",
    frequency: "每月 1 次",
    content: "浇水、修剪、清洁、基础状态检查",
    cycle: "3 个月",
  },
  {
    name: "标准养护",
    scene: "适合办公室 / 店铺 / 小型空间",
    frequency: "每月 2 次",
    content: "浇水、修剪、清洁、病虫检查、简单更换建议",
    cycle: "6 个月",
  },
  {
    name: "深度养护",
    scene: "适合绿植较多、展示要求高、客户重视形象的空间",
    frequency: "每周 1 次或按约定",
    content: "精细修剪、叶面清洁、病虫处理、状态记录、替换建议",
    cycle: "按项目约定",
  },
];

const STAFF_PLAN_TYPES = ["租赁方案", "零售方案", "养护服务"];

function getInitialPlanTypeForOrder(order) {
  if (STAFF_PLAN_TYPES.includes(order?.planType)) return order.planType;
  if (order?.serviceType === "养护") return "养护服务";
  if (order?.serviceType === "零售") return "零售方案";
  return "租赁方案";
}

function getMaintenancePackage(name = "标准养护") {
  return MAINTENANCE_PACKAGES.find((item) => item.name === name) || MAINTENANCE_PACKAGES[1];
}

function getMaintenancePlanFields(name = "标准养护") {
  const pack = getMaintenancePackage(name);
  return {
    maintenancePackage: pack.name,
    maintenanceScene: pack.scene,
    maintenanceFrequency: pack.frequency,
    maintenanceContent: pack.content,
    maintenanceCycle: pack.cycle,
  };
}

function getPlanStats(plan) {
  const areas = safeAreas(plan);
  const areaCount = areas.length;
  const productCount = areas.reduce((sum, area) => sum + getAreaProductCount(area), 0);
  const dailyRent = areas.reduce((sum, area) => sum + getAreaDailyRent(area), 0);
  const leaseMonths = Number(plan?.leaseMonths || 12);
  const isRetailPlan = plan?.planType === "零售方案";
  const isMaintenancePlan = plan?.planType === "养护服务";
  const systemTotalRent = isMaintenancePlan ? 0 : isRetailPlan ? dailyRent : dailyRent * leaseMonths * 30;

  const customFinalRent = isMaintenancePlan ? plan?.maintenanceFinalPrice : plan?.customFinalRent;
  const hasCustomFinalRent =
    customFinalRent !== "" &&
    customFinalRent !== null &&
    customFinalRent !== undefined &&
    !Number.isNaN(Number(customFinalRent));

  return {
    areaCount,
    productCount,
    dailyRent,
    leaseMonths,
    isRetailPlan,
    isMaintenancePlan,
    systemTotalRent,
    finalRent: hasCustomFinalRent ? Number(customFinalRent) : systemTotalRent,
  };
}

function createEmptyPlan(order, planType = "租赁方案") {
  const maintenanceFields = getMaintenancePlanFields("标准养护");

  return {
    id: `plan-${order.id}-${Date.now()}`,
    planType,
    leaseMonths: 12,
    paymentMethod: "月付",
    needDeposit: true,
    customFinalRent: "",
    includedMaintenance: "基础养护",
    retailNeedsMaintenance: false,
    retailMaintenanceNote: "",
    maintenanceFinalPrice: "",
    maintenanceInternalNote: "",
    ...maintenanceFields,
    areas: [],
    createdAt: nowText(),
    updatedAt: nowText(),
    submittedAt: "",
    merchantConfirmedAt: "",
    completedAt: "",
  };
}

function getOrderSignalTags(order) {
  const rawTags = Array.isArray(order?.tags) ? order.tags.filter(Boolean) : [];
  const normalized = rawTags.join(" ");
  const sourceText = [
    order?.source,
    order?.areaType,
    order?.planType,
    order?.serviceType,
    normalized,
  ].filter(Boolean).join(" ");
  const signals = [];

  const addSignal = (label) => {
    if (!signals.includes(label)) signals.push(label);
  };

  if (order?.needComparePrice || /比价|竞价|报价/.test(sourceText)) addSignal("需比价");
  if (order?.hasRentedBefore || /租过|复租|老客户|续租/.test(sourceText)) addSignal("租过绿植");
  if (/室外|户外|门口|露台|庭院/.test(sourceText)) addSignal("室外");
  else if (/室内|办公室|前台|会议室/.test(sourceText)) addSignal("室内");
  if (/零售|买断|购买|售卖/.test(sourceText)) addSignal("零售");
  else if (/租赁|长租|短租|月租/.test(sourceText)) addSignal("租赁");
  if (/养护|维护|修剪|病虫|清洁/.test(sourceText)) addSignal("养护");
  if (order?.urgent || /急|紧急|加急|今天|明天/.test(sourceText)) addSignal("急单");
  if (order?.importantCustomer || /重点|VIP|大客户|重要/.test(sourceText)) addSignal("重点客户");

  rawTags.forEach((tag) => {
    if (signals.length < 8 && !signals.includes(tag)) signals.push(tag);
  });

  return signals.slice(0, 8);
}

function getStaffStatuses(tab) {
  if (tab === "待接单") return ["待接单"];
  if (tab === "做方案") return ["配置中", "待商户确认"];
  if (tab === "执行中") return ["方案已确认", "执行中"];
  if (tab === "已完成") return ["待商户归档", "已完成"];
  return ["待接单"];
}

function getMerchantStatusClass(status) {
  if (status === "待接单") return "is-waiting";
  if (["配置中", "待商户确认", "方案已确认"].includes(status)) return "is-plan";
  if (status === "执行中") return "is-running";
  if (status === "待商户归档") return "is-warning";
  if (status === "已完成") return "is-done";
  return "is-muted";
}

function App() {
  const merchantListRef = useRef(null);

  const [activeRole, setActiveRole] = useState("staff");
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authRole, setAuthRole] = useState("staff");
  const [activeStaffTab, setActiveStaffTab] = useState("待接单");
  const [staffAppTab, setStaffAppTab] = useState("首页");
  const [merchantTab, setMerchantTab] = useState("工作台");
  const [merchantStatusFilter, setMerchantStatusFilter] = useState("全部");
  const [merchantSearchText, setMerchantSearchText] = useState("");
  const [syncMessage, setSyncMessage] = useState("当前已连接 Supabase。点击刷新订单即可读取云端数据。");
  const [syncState, setSyncState] = useState("云端待刷新");
  const [autoSyncState, setAutoSyncState] = useState("自动同步准备中");

  const [orders, setOrders] = useState(() => loadOrdersFromLocalStore());
  const [merchantProducts, setMerchantProducts] = useState(() => loadProductsFromLocalStore());
  const [merchantCustomers, setMerchantCustomers] = useState(() => loadCustomersFromLocalStore());
  const [staffDirectory, setStaffDirectory] = useState(staffMembers);

  const [currentPage, setCurrentPage] = useState("orders");
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [merchantViewingOrder, setMerchantViewingOrder] = useState(null);
  const [editingStaffId, setEditingStaffId] = useState(null);

  const [planType, setPlanType] = useState("租赁方案");

  const [showAreaSheet, setShowAreaSheet] = useState(false);
  const [areaName, setAreaName] = useState("");

  const [showProductSheet, setShowProductSheet] = useState(false);
  const [currentAreaId, setCurrentAreaId] = useState(null);
  const [activeCategory, setActiveCategory] = useState("全部商品");
  const [activeSubCategory, setActiveSubCategory] = useState("大型植物");
  const [searchText, setSearchText] = useState("");

  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [showPriceSheet, setShowPriceSheet] = useState(false);
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [showSubmitSheet, setShowSubmitSheet] = useState(false);
  const [showCreateOrderSheet, setShowCreateOrderSheet] = useState(false);
  const [showCreateProductSheet, setShowCreateProductSheet] = useState(false);
  const [showCreateCustomerSheet, setShowCreateCustomerSheet] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [productSearchText, setProductSearchText] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("全部");
  const [customerSearchText, setCustomerSearchText] = useState("");
  const [isCreateOrderInputFocused, setIsCreateOrderInputFocused] = useState(false);

  const [showDetailBlock, setShowDetailBlock] = useState(false);
  const [completeForm, setCompleteForm] = useState({ scenePhotos: ["", "", ""], plantPhotos: ["", "", ""], remark: "" });
  const [staffAvatar, setStaffAvatar] = useState(() => loadStaffAvatarFromLocalStore());
  const [currentStaffId, setCurrentStaffId] = useState(() => loadCurrentStaffIdFromLocalStore());
  const [qrPreviewOrder, setQrPreviewOrder] = useState(null);

  const [newOrderForm, setNewOrderForm] = useState({
    customerName: "",
    contactName: "",
    phone: "",
    areaSize: "",
    expectedDate: "",
    address: "",
    description: "",
    tagsText: "办公室,长期租赁",
    source: "商户派单",
    serviceType: "租赁",
    leaseMonths: "12",
    paymentMethod: "月付",
    needDeposit: true,
    budget: "",
    plannedPlantCount: "",
    areaNote: "",
    merchantNote: "",
    retailNeedsMaintenance: false,
    maintenancePackage: "标准养护",
    maintenanceCycle: "6 个月",
    maintenanceFrequency: "每月 2 次",
    maintenanceContent: "浇水、修剪、清洁、病虫检查、简单更换建议",
    maintenanceFinalPrice: "",
    maintenanceInternalNote: "",
    assignedStaffId: DEFAULT_STAFF_ID,
    communicationQrUrl: "",
  });

  const [newCustomerForm, setNewCustomerForm] = useState({
    name: "",
    contactName: "",
    phone: "",
    address: "",
    areaSize: "",
    note: "",
    tagsText: "办公室,长期租赁",
  });

  const [newProductForm, setNewProductForm] = useState({
    name: "",
    category: "室内绿植",
    subCategory: "大型植物",
    description: "",
    pricePerDay: "",
    imageUrl: "",
    image: "🪴",
    stock: "充足",
    note: "",
    status: "已上架",
  });

  const currentOrder = orders.find((order) => order.id === currentOrderId) || null;
  const currentPlan = currentOrder?.plan || null;
  const planAreas = safeAreas(currentPlan);
  const currentArea = planAreas.find((area) => area.id === currentAreaId) || null;
  const currentStats = getPlanStats(currentPlan);
  const authUserEmail = session?.user?.email || "";
  const authAccount = useMemo(() => resolveAuthAccountByEmail(authUserEmail), [authUserEmail]);
  const currentStaff = staffDirectory.find((member) => member.id === currentStaffId) || getStaffMemberById(currentStaffId) || (authAccount?.userType === "staff" ? authAccount : null) || getDefaultAssignedStaff();
  const currentOrganization = getOrganizationById(currentStaff?.organizationId);
  const currentMerchantUser = authAccount?.userType === "merchant" ? authAccount : merchantUsers[0];
  const canUseMerchant = ["owner", "admin", "manager"].includes(authRole);

  const staffScopedOrders = useMemo(() => {
    return orders.filter((order) => order.assignedStaffId === currentStaff?.id);
  }, [orders, currentStaff?.id]);

  const filteredStaffOrders = useMemo(() => {
    const statuses = getStaffStatuses(activeStaffTab);
    return staffScopedOrders.filter((order) => statuses.includes(order.status));
  }, [staffScopedOrders, activeStaffTab]);

  const merchantOrders = useMemo(() => {
    const keyword = merchantSearchText.trim();
    const baseOrders =
      merchantStatusFilter === "全部"
        ? orders
        : orders.filter((order) => order.status === merchantStatusFilter);

    if (!keyword) return baseOrders;

    return baseOrders.filter((order) => {
      const text = [
        order.customerName,
        order.contactName,
        order.phone,
        order.address,
        order.areaSize,
        order.status,
        order.source,
        ...(Array.isArray(order.tags) ? order.tags : []),
      ]
        .filter(Boolean)
        .join(" ");

      return text.includes(keyword);
    });
  }, [orders, merchantStatusFilter, merchantSearchText]);

  const pendingMerchantConfirmOrders = useMemo(() => {
    return orders.filter((order) => order.status === "待商户确认");
  }, [orders]);

  const pendingArchiveOrders = useMemo(() => {
    return orders.filter((order) => order.status === "待商户归档");
  }, [orders]);

  const submittedOrders = useMemo(() => {
    return orders.filter((order) =>
      ["待商户确认", "方案已确认", "执行中", "待商户归档", "已完成"].includes(order.status)
    );
  }, [orders]);

  const monitoredOrders = useMemo(() => {
    return orders.filter((order) =>
      ["方案已确认", "执行中", "待商户归档"].includes(order.status)
    );
  }, [orders]);

  const filteredProducts = merchantProducts.filter((product) => {
    const keyword = searchText.trim();
    const visible = product.status !== "停用" && product.status !== "未上架";
    const matchCategory = activeCategory === "全部商品" || product.category === activeCategory;
    const matchSubCategory = activeSubCategory === "全部规格" || product.subCategory === activeSubCategory;
    const text = [product.name, product.category, product.subCategory, product.description, product.note].filter(Boolean).join(" ");

    if (!visible) return false;
    if (keyword) return text.includes(keyword);
    return matchCategory && matchSubCategory;
  });

  const allCustomers = useMemo(() => mergeCustomers(merchantCustomers, orders), [merchantCustomers, orders]);

  const filteredCustomers = useMemo(() => {
    const keyword = customerSearchText.trim();
    if (!keyword) return allCustomers;
    return allCustomers.filter((customer) =>
      [customer.name, customer.contactName, customer.phone, customer.address, customer.note, customer.tagsText]
        .filter(Boolean)
        .join(" ")
        .includes(keyword)
    );
  }, [allCustomers, customerSearchText]);

  const customerPlanId = new URLSearchParams(window.location.search).get("planId");
  const customerViewOrder = orders.find((order) => order.plan?.id === customerPlanId) || null;

  useEffect(() => {
    persistOrdersToLocalStore(orders);
  }, [orders]);

  useEffect(() => {
    persistProductsToLocalStore(merchantProducts);
  }, [merchantProducts]);

  useEffect(() => {
    persistCustomersToLocalStore(merchantCustomers);
  }, [merchantCustomers]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data?.session || null);
      setAuthLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      data?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!session) return;

    const account = resolveAuthAccountByEmail(session.user?.email);
    const nextRole = account?.role || "staff";
    setAuthRole(nextRole);

    if (account?.userType === "merchant" || ["owner", "admin", "manager"].includes(nextRole)) {
      setActiveRole("merchant");
      return;
    }

    setActiveRole("staff");
    if (account?.id && getStaffMemberById(account.id)) {
      setCurrentStaffId(account.id);
    }
  }, [session]);

  useEffect(() => {
    persistStaffAvatarToLocalStore(staffAvatar);
  }, [staffAvatar]);

  useEffect(() => {
    persistCurrentStaffIdToLocalStore(currentStaffId);
  }, [currentStaffId]);

  useEffect(() => {
    if (currentPage === "plan" && !currentOrder) setCurrentPage("orders");
    if (showProductSheet && !currentArea) setShowProductSheet(false);
  }, [currentPage, currentOrder, showProductSheet, currentArea]);

    useEffect(() => {
    if (activeRole !== "staff") return;
    if (!["plan", "completeUpload"].includes(currentPage)) return;

    const targetOrder =
      currentOrder || orders.find((order) => order.id === currentOrderId) || null;

    if (targetOrder) {
      setActiveStaffTab(getStaffTabByOrderStatus(targetOrder.status));
    }

    setStaffAppTab("任务");
    setShowDetailBlock(false);
  }, [activeRole, currentPage, currentOrder, currentOrderId, orders]);

  useEffect(() => {
    silentRefreshFromCloud("启动自动同步");

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        silentRefreshFromCloud("自动同步");
      }
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  function addTimeline(order, action) {
    return {
      ...order,
      timeline: [...safeTimeline(order), { time: nowText(), action }],
    };
  }

  function syncOneOrder(order, message = "云端已同步") {
    setSyncState("同步中");
    upsertOrderToCloud(order)
      .then(() => {
        setSyncState("已同步");
        setSyncMessage(`${message}：${nowText()}`);
      })
      .catch((error) => {
        console.error(error);
        setSyncState("同步失败");
        setSyncMessage(error.message || "写入云端失败，本地数据已保留。");
      });
  }

  function syncProductsLibrary(nextProducts, message = "商品库已同步") {
    persistProductsToLocalStore(nextProducts);
    upsertProductsToCloud(nextProducts)
      .then(() => {
        setSyncState("已同步");
        setSyncMessage(`${message}：${nowText()}`);
      })
      .catch((error) => {
        console.error(error);
        setSyncState("商品库同步失败");
        setSyncMessage(error.message || "商品库写入云端失败，本地数据已保留。");
      });
  }

  function updateProducts(nextProducts, message = "商品库已同步") {
    const normalized = normalizeProducts(nextProducts);
    setMerchantProducts(normalized);
    window.setTimeout(() => syncProductsLibrary(normalized, message), 0);
  }

  function updateOrder(orderId, updater, cloudMessage = "订单已同步") {
    setOrders((prevOrders) => {
      let changedOrder = null;

      const nextOrders = prevOrders.map((order) => {
        if (order.id !== orderId) return order;
        const patch = typeof updater === "function" ? updater(order) : updater;
        changedOrder = ensureOrderDefaults({ ...order, ...patch });
        return changedOrder;
      });

      if (changedOrder) {
        window.setTimeout(() => {
          syncOneOrder(changedOrder, cloudMessage);
          setSelectedOrder((order) => (order?.id === orderId ? changedOrder : order));
          setSelectedOrderDetail((order) => (order?.id === orderId ? changedOrder : order));
          setMerchantViewingOrder((order) => (order?.id === orderId ? changedOrder : order));
          setQrPreviewOrder((order) => (order?.id === orderId ? changedOrder : order));
        }, 0);
      }

      return nextOrders;
    });
  }

  function assignOrderToStaff(orderId, staffId) {
    const staff = staffDirectory.find((member) => member.id === staffId) || getStaffMemberById(staffId) || getDefaultAssignedStaff();
    if (!staff) return;

    updateOrder(
      orderId,
      (order) =>
        addTimeline(
          {
            ...order,
            assignedStaffId: staff.id,
            assignedStaffName: staff.name,
            assignedStaffEmail: staff.email,
          },
          `商户将订单分配给 ${staff.name}`
        ),
      "订单派单员工已同步"
    );
  }

  function replaceAllOrders(nextOrders) {
    const normalized = normalizeOrders(nextOrders);
    setOrders(normalized);
    return normalized;
  }

  async function refreshOrdersFromCloud() {
    setSyncState("同步中");
    setSyncMessage("正在从 Supabase 读取订单...");

    try {
      const [cloudOrders, cloudProducts] = await Promise.all([
        fetchOrdersFromCloud(),
        fetchProductsFromCloud().catch(() => []),
      ]);

      if (cloudProducts.length > 0) {
        setMerchantProducts(cloudProducts);
      }

      if (cloudOrders.length === 0) {
        setSyncState("云端为空");
        setSyncMessage("云端暂无订单。可以先在商户端创建订单，或点击“上传本地到云端”。");
        return;
      }

      replaceAllOrders(cloudOrders);
      setMerchantCustomers((prev) => mergeCustomers(prev, cloudOrders));
      setSyncState("已同步");
      setSyncMessage(`已从云端刷新订单和商品库：${nowText()}`);
    } catch (error) {
      console.error(error);
      setSyncState("同步失败");
      setSyncMessage(error.message || "读取云端失败。");
    }
  }

  async function silentRefreshFromCloud(reason = "自动同步") {
    try {
      const [cloudOrders, cloudProducts] = await Promise.all([
        fetchOrdersFromCloud().catch(() => []),
        fetchProductsFromCloud().catch(() => []),
      ]);

      if (cloudOrders.length > 0) {
        const normalizedOrders = normalizeOrders(cloudOrders);
        setOrders((prevOrders) => {
          const prevText = JSON.stringify(prevOrders);
          const nextText = JSON.stringify(normalizedOrders);
          return prevText === nextText ? prevOrders : normalizedOrders;
        });
        setMerchantCustomers((prev) => mergeCustomers(prev, normalizedOrders));
      }

      if (cloudProducts.length > 0) {
        const normalizedProducts = normalizeProducts(cloudProducts);
        setMerchantProducts((prevProducts) => {
          const prevText = JSON.stringify(prevProducts);
          const nextText = JSON.stringify(normalizedProducts);
          return prevText === nextText ? prevProducts : normalizedProducts;
        });
      }

      setAutoSyncState(`${reason}：${nowText().slice(11)}`);
    } catch (error) {
      console.error("自动同步失败：", error);
      setAutoSyncState("自动同步失败，手动刷新兜底");
    }
  }

  async function uploadLocalOrdersToCloud() {
    setSyncState("同步中");
    setSyncMessage("正在把当前本地订单上传到 Supabase...");

    try {
      await upsertOrdersToCloud(orders);
      setSyncState("已同步");
      setSyncMessage(`本地订单已上传云端：${nowText()}`);
    } catch (error) {
      console.error(error);
      setSyncState("同步失败");
      setSyncMessage(error.message || "上传云端失败。");
    }
  }

  function handleViewPendingMerchantConfirm() {
    const firstOrder = pendingMerchantConfirmOrders[0];
    if (firstOrder) {
      openMerchantPlanWorkbench(firstOrder);
      setSyncMessage("已打开待确认方案，请先核对方案明细再确认。");
      return;
    }

    setMerchantTab("工作台");
    setMerchantStatusFilter("待商户确认");
    setSyncMessage("暂无待确认方案。");
  }

  function handleViewPendingArchive() {
    const firstOrder = pendingArchiveOrders[0];
    if (firstOrder) {
      openMerchantPlanWorkbench(firstOrder);
      setSyncMessage("已打开待归档订单，请核对完成信息后归档。");
      return;
    }

    setMerchantTab("工作台");
    setMerchantStatusFilter("待商户归档");
    setSyncMessage("暂无待归档订单。");
  }

  function updateOrderPlan(orderId, planUpdater, cloudMessage = "方案已同步") {
    setOrders((prevOrders) => {
      let changedOrder = null;

      const nextOrders = prevOrders.map((order) => {
        if (order.id !== orderId) return order;

        const current = order.plan || createEmptyPlan(order);
        const nextPlan =
          typeof planUpdater === "function" ? planUpdater(current, order) : planUpdater;

        changedOrder = ensureOrderDefaults({
          ...order,
          plan: {
            ...nextPlan,
            updatedAt: nowText(),
          },
        });

        return changedOrder;
      });

      if (changedOrder) {
        window.setTimeout(() => {
          syncOneOrder(changedOrder, cloudMessage);
          setSelectedOrder((order) => (order?.id === orderId ? changedOrder : order));
          setSelectedOrderDetail((order) => (order?.id === orderId ? changedOrder : order));
          setMerchantViewingOrder((order) => (order?.id === orderId ? changedOrder : order));
          setQrPreviewOrder((order) => (order?.id === orderId ? changedOrder : order));
        }, 0);
      }

      return nextOrders;
    });
  }

  function resetSheets() {
    setSelectedOrder(null);
    setSelectedOrderDetail(null);
    setMerchantViewingOrder(null);
    setShowAreaSheet(false);
    setShowProductSheet(false);
    setShowPaymentSheet(false);
    setShowPriceSheet(false);
    setShowMoreSheet(false);
    setShowSubmitSheet(false);
    setShowCreateOrderSheet(false);
    setShowCreateProductSheet(false);
    setShowCreateCustomerSheet(false);
    setEditingProductId(null);
    setEditingCustomerId(null);
    setIsCreateOrderInputFocused(false);
    setShowDetailBlock(false);
    setCompleteForm({ scenePhotos: ["", "", ""], plantPhotos: ["", "", ""], remark: "" });
  }

  function openMerchantPlanWorkbench(order) {
    setMerchantViewingOrder(order);
    setSelectedOrderDetail(null);
    setMerchantTab("工作台");
    setMerchantStatusFilter(order.status || "全部");
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  }

  function backToMerchantHome(message) {
    setSelectedOrderDetail(null);
    setMerchantViewingOrder(null);
    setMerchantTab("工作台");
    setMerchantStatusFilter("全部");
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
    if (message) setSyncMessage(message);
  }

  function switchRole(role) {
    // 开发测试阶段允许前端视图自由切换；正式版应由 profiles.role 决定入口并关闭此捷径。
    setActiveRole(role);
    setCurrentPage("orders");
    setCurrentOrderId(null);
    resetSheets();
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSession(null);
    setActiveRole("staff");
    setCurrentPage("orders");
    setCurrentOrderId(null);
    resetSheets();
  }

  async function copyText(text, successText = "已复制") {
    if (!text) {
      alert("暂无可复制内容");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      alert(successText);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      alert(successText);
    }
  }

  function openMapSearch(address) {
    if (!address) {
      alert("暂无地址");
      return;
    }

    const encodedAddress = encodeURIComponent(address);
    window.open(`https://uri.amap.com/search?keyword=${encodedAddress}&callnative=1`, "_blank");
  }

  function openRouteNavigation(address) {
    if (!address) {
      alert("暂无地址");
      return;
    }

    const encodedAddress = encodeURIComponent(address);
    window.open(`https://uri.amap.com/search?keyword=${encodedAddress}&callnative=1`, "_blank");
  }

  function callPhone(phone) {
    if (!phone) {
      alert("暂无联系电话");
      return;
    }

    window.location.href = `tel:${phone}`;
  }

  function locateStaff(orderId) {
    if (!navigator.geolocation) {
      alert("当前浏览器不支持定位。");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        updateOrder(
          orderId,
          (order) => {
            const next = {
              ...order,
              deliveryStatus: order.deliveryStatus === "未出发" ? "前往中" : order.deliveryStatus,
              executionStatus:
                order.executionStatus === "待联系" ? "已出发" : order.executionStatus,
              staffLocation: {
                latitude,
                longitude,
                accuracy: Math.round(accuracy || 0),
                locatedAt: nowText(),
              },
              distanceText: "已定位，打开地图查看路线",
              etaText: "由地图 App 实时计算",
            };

            return addTimeline(next, "员工更新当前位置");
          },
          "定位已同步"
        );

        alert("定位成功，已保存到订单。");
      },
      (error) => {
        console.error("定位失败：", error);
        alert("定位失败，请检查浏览器定位权限。");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }

  function acceptOrderAndCreatePlan() {
    if (!selectedOrder) return;

    updateOrder(
      selectedOrder.id,
      (order) => {
        const next = {
          ...order,
          status: "配置中",
          planStatus: "配置中",
          merchantConfirmStatus: "未提交",
          executionStatus: "已联系",
          acceptedAt: order.acceptedAt || nowText(),
          planType,
          serviceType: planType === "养护服务" ? "养护" : planType === "零售方案" ? "零售" : "租赁",
          plan: order.plan || createEmptyPlan(order, planType),
        };

        return addTimeline(next, "员工确认接单并创建方案");
      },
      "接单已同步"
    );

    setCurrentOrderId(selectedOrder.id);
    setCurrentPage("plan");
    setSelectedOrder(null);
    setPlanType("租赁方案");
    setActiveStaffTab("做方案");
  }

  function openPlanForOrder(order) {
    if (!order.plan) {
      const initialPlanType = getInitialPlanTypeForOrder(order);
      updateOrder(order.id, { planType: initialPlanType, plan: createEmptyPlan(order, initialPlanType) }, "方案已创建");
    }

    setCurrentOrderId(order.id);
    setCurrentPage("plan");
    setShowDetailBlock(false);
    setCompleteForm({ scenePhotos: ["", "", ""], plantPhotos: ["", "", ""], remark: "" });
  }

  function addAreaWithName(inputName) {
    const name = String(inputName || "").trim();
    if (!currentOrder || !name) return;

    const newAreaId = `area-${Date.now()}`;

    updateOrderPlan(
      currentOrder.id,
      (plan) => ({
        ...plan,
        areas: [
          ...safeAreas(plan),
          {
            id: newAreaId,
            name,
            items: [],
          },
        ],
      }),
      "新增区域已同步"
    );

    updateOrder(currentOrder.id, (order) => addTimeline(order, `新增区域：${name}`), "区域记录已同步");

    setAreaName("");
    setShowAreaSheet(false);
    setCurrentAreaId(newAreaId);
    setActiveCategory("全部商品");
    setActiveSubCategory("全部规格");
    setSearchText("");
    window.setTimeout(() => setShowProductSheet(true), 80);
  }

  function addArea() {
    addAreaWithName(areaName);
  }

  function openProductSheet(area) {
    setCurrentAreaId(area.id);
    setActiveCategory("全部商品");
    setActiveSubCategory("全部规格");
    setSearchText("");
    setShowProductSheet(true);
  }

  function addProductToArea(product) {
    if (!currentOrder || !currentAreaId) return;

    updateOrderPlan(
      currentOrder.id,
      (plan) => ({
        ...plan,
        areas: safeAreas(plan).map((area) => {
          if (area.id !== currentAreaId) return area;

          const items = safeItems(area);
          const existed = items.find((item) => item.productId === product.id);

          if (existed) {
            return {
              ...area,
              items: items.map((item) =>
                item.productId === product.id
                  ? { ...item, quantity: Number(item.quantity || 0) + 1 }
                  : item
              ),
            };
          }

          return {
            ...area,
            items: [
              ...items,
              {
                productId: product.id,
                name: product.name,
                pricePerDay: Number(product.pricePerDay || 0),
                quantity: 1,
              },
            ],
          };
        }),
      }),
      "商品已同步"
    );
  }

  function setProductQuantityInCurrentArea(product, rawQuantity) {
    if (!currentOrder || !currentAreaId) return;

    const nextQuantity = Math.max(0, Math.floor(Number(rawQuantity || 0)));

    updateOrderPlan(
      currentOrder.id,
      (plan) => ({
        ...plan,
        areas: safeAreas(plan).map((area) => {
          if (area.id !== currentAreaId) return area;

          const items = safeItems(area);
          const existed = items.some((item) => item.productId === product.id);

          if (nextQuantity <= 0) {
            return {
              ...area,
              items: items.filter((item) => item.productId !== product.id),
            };
          }

          if (existed) {
            return {
              ...area,
              items: items.map((item) =>
                item.productId === product.id
                  ? { ...item, quantity: nextQuantity }
                  : item
              ),
            };
          }

          return {
            ...area,
            items: [
              ...items,
              {
                productId: product.id,
                name: product.name,
                pricePerDay: Number(product.pricePerDay || 0),
                quantity: nextQuantity,
              },
            ],
          };
        }),
      }),
      "数量已同步"
    );
  }

  function changeItemQuantity(areaId, productId, change) {
    if (!currentOrder) return;

    updateOrderPlan(
      currentOrder.id,
      (plan) => ({
        ...plan,
        areas: safeAreas(plan).map((area) => {
          if (area.id !== areaId) return area;

          return {
            ...area,
            items: safeItems(area)
              .map((item) =>
                item.productId === productId
                  ? { ...item, quantity: Math.max(0, Number(item.quantity || 0) + change) }
                  : item
              )
              .filter((item) => Number(item.quantity || 0) > 0),
          };
        }),
      }),
      "数量已同步"
    );
  }

  function removeItemFromArea(areaId, productId) {
    if (!currentOrder) return;

    updateOrderPlan(
      currentOrder.id,
      (plan) => ({
        ...plan,
        areas: safeAreas(plan).map((area) => {
          if (area.id !== areaId) return area;

          return {
            ...area,
            items: safeItems(area).filter((item) => item.productId !== productId),
          };
        }),
      }),
      "商品删除已同步"
    );
  }

  function clearCurrentAreaItems() {
    if (!currentOrder || !currentAreaId) return;

    updateOrderPlan(
      currentOrder.id,
      (plan) => ({
        ...plan,
        areas: safeAreas(plan).map((area) =>
          area.id === currentAreaId ? { ...area, items: [] } : area
        ),
      }),
      "当前区域已清空"
    );
  }

  function updateCurrentPlanField(field, value) {
    if (!currentOrder) return;

    updateOrderPlan(
      currentOrder.id,
      (plan) => ({
        ...plan,
        [field]: value,
      }),
      "方案设置已同步"
    );
  }

  function submitPlan() {
    if (!currentOrder || !currentPlan) return;

    updateOrder(
      currentOrder.id,
      (order) => {
        const next = {
          ...order,
          status: "待商户确认",
          planStatus: "待商户确认",
          merchantConfirmStatus: "待确认",
          submittedAt: nowText(),
          customerConfirmStatus: "待确认",
          plan: {
            ...order.plan,
            submittedAt: nowText(),
            status: "待商户确认",
          },
        };

        return addTimeline(next, "员工提交方案，等待商户确认");
      },
      "方案已提交到云端"
    );

    setShowSubmitSheet(false);
    setCurrentPage("orders");
    setActiveStaffTab("做方案");
  }

  function merchantConfirmPlan(orderId) {
    const targetOrder = orders.find((order) => order.id === orderId);
    if (targetOrder?.plan?.planType === "养护服务" && !Number(targetOrder.plan.maintenanceFinalPrice || 0)) {
      alert("请先填写养护服务最终报价");
      return;
    }

    updateOrder(
      orderId,
      (order) => {
        const next = {
          ...order,
          status: "方案已确认",
          planStatus: "方案已确认",
          merchantConfirmStatus: "已确认",
          merchantConfirmedAt: nowText(),
          plan: order.plan
            ? {
                ...order.plan,
                status: "方案已确认",
                merchantConfirmedAt: nowText(),
              }
            : order.plan,
        };

        return addTimeline(next, "商户确认方案");
      },
      "商户确认已同步"
    );

    backToMerchantHome("方案已确认，已返回商户首页。员工端刷新后可以开始执行。");
  }

  function merchantRequestRevision(orderId) {
    const reason = window.prompt("请输入要求修改的原因，例如：价格偏高 / 植物数量太少 / 区域需要调整");
    if (reason === null) return;

    updateOrder(
      orderId,
      (order) => {
        const next = {
          ...order,
          status: "配置中",
          planStatus: "配置中",
          merchantConfirmStatus: "要求修改",
          revisionReason: reason || "商户要求修改方案",
        };

        return addTimeline(next, `商户要求修改方案：${reason || "未填写原因"}`);
      },
      "修改要求已同步"
    );

    backToMerchantHome("已要求员工修改方案，已返回商户首页。");
  }

  function markPlanSentToCustomer(orderId) {
    updateOrder(
      orderId,
      (order) => {
        const next = {
          ...order,
          planLinkStatus: "已发送",
          customerConfirmStatus: "待确认",
        };

        return addTimeline(next, "商户标记方案已转发客户");
      },
      "转发客户状态已同步"
    );

    alert("已标记为已转发客户。");
  }

  function startExecution(orderId) {
    updateOrder(
      orderId,
      (order) => {
        const next = {
          ...order,
          status: "执行中",
          planStatus: "执行中",
          executionStatus: "已出发",
          deliveryStatus: "前往中",
        };

        return addTimeline(next, "员工开始执行服务");
      },
      "执行状态已同步"
    );

    setActiveStaffTab("执行中");
  }

  function completeOrderByStaff(orderId) {
    const target = orders.find((order) => order.id === orderId);
    if (!target) return;

    if (!["方案已确认", "执行中"].includes(target.status)) {
      alert("需要商户确认方案后，员工才能完成订单。");
      return;
    }

    if (!window.confirm(`确认将「${target.customerName}」标记为已完成吗？`)) return;

    updateOrder(
      orderId,
      (order) => {
        const next = {
          ...order,
          status: "待商户归档",
          planStatus: "待商户归档",
          merchantArchiveStatus: "待归档",
          deliveryStatus: "已到达",
          executionStatus: "已完成服务",
          completedAt: nowText(),
          plan: order.plan
            ? {
                ...order.plan,
                status: "待商户归档",
                completedAt: nowText(),
              }
            : order.plan,
        };

        return addTimeline(next, "员工标记订单已完成，等待商户确认归档");
      },
      "订单完成待归档已同步"
    );

    setActiveStaffTab("已完成");
    setCurrentPage("orders");
  }

  function merchantArchiveOrder(orderId) {
    updateOrder(
      orderId,
      (order) => {
        const next = {
          ...order,
          status: "已完成",
          planStatus: "已完成",
          merchantArchiveStatus: "已归档",
          archivedAt: nowText(),
          plan: order.plan
            ? {
                ...order.plan,
                status: "已完成",
                archivedAt: nowText(),
              }
            : order.plan,
        };

        return addTimeline(next, "商户确认订单完成并归档");
      },
      "订单归档已同步"
    );

    backToMerchantHome("订单已确认归档，已返回商户首页。订单已正式完成。");
  }

  function createMerchantOrder() {
    if (!newOrderForm.customerName.trim()) {
      alert("请填写项目 / 客户名称");
      return;
    }

    if (!newOrderForm.address.trim()) {
      alert("请填写客户地址");
      return;
    }

    const tags = newOrderForm.tagsText
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const time = nowText();
    const orderId = Date.now();
    const serviceType = newOrderForm.serviceType || "租赁";
    const planType = serviceType === "养护" ? "养护服务" : serviceType === "零售" ? "零售方案" : "租赁方案";
    const planDraft = {
      ...createEmptyPlan({ id: orderId }, planType),
      leaseMonths: Number(newOrderForm.leaseMonths || 12),
      paymentMethod: newOrderForm.paymentMethod || "月付",
      needDeposit: Boolean(newOrderForm.needDeposit),
      customFinalRent: newOrderForm.budget || "",
      retailNeedsMaintenance: Boolean(newOrderForm.retailNeedsMaintenance),
      maintenanceInternalNote: newOrderForm.maintenanceInternalNote || "",
      maintenanceFinalPrice: newOrderForm.maintenanceFinalPrice || "",
      ...getMaintenancePlanFields(newOrderForm.maintenancePackage || "标准养护"),
      maintenanceCycle: newOrderForm.maintenanceCycle || getMaintenancePackage(newOrderForm.maintenancePackage).cycle,
      maintenanceFrequency: newOrderForm.maintenanceFrequency || getMaintenancePackage(newOrderForm.maintenancePackage).frequency,
      maintenanceContent: newOrderForm.maintenanceContent || getMaintenancePackage(newOrderForm.maintenancePackage).content,
      merchantDraft: true,
      merchantDraftNote: newOrderForm.merchantNote || "",
      areas: newOrderForm.areaNote.trim()
        ? [{ id: `area-${orderId}`, name: newOrderForm.areaNote.trim(), items: [] }]
        : [],
    };

    const newOrder = ensureOrderDefaults({
      id: orderId,
      customerName: newOrderForm.customerName.trim(),
      contactName: newOrderForm.contactName.trim() || "待确认",
      phone: newOrderForm.phone.trim(),
      status: "待接单",
      deliveryStatus: "未出发",
      executionStatus: "待联系",
      customerConfirmStatus: "待确认",
      merchantConfirmStatus: "未提交",
      planLinkStatus: "未生成",
      staffLocation: null,
      distanceText: "待定位",
      etaText: "待定位",
      tags: tags.length ? tags : ["新订单"],
      areaSize: newOrderForm.areaSize.trim() || "待确认",
      expectedDate: newOrderForm.expectedDate.trim() || "待确认",
      address: newOrderForm.address.trim(),
      description: newOrderForm.description.trim() || "暂无详细需求，待员工现场确认。",
      dispatchTime: time,
      source: newOrderForm.source || "商户派单",
      serviceType,
      planType,
      plannedPlantCount: newOrderForm.plannedPlantCount.trim(),
      budget: newOrderForm.budget.trim(),
      merchantNote: newOrderForm.merchantNote.trim(),
      areaNote: newOrderForm.areaNote.trim(),
      assignedStaffId: newOrderForm.assignedStaffId || DEFAULT_STAFF_ID,
      assignedStaffName: getStaffMemberById(newOrderForm.assignedStaffId)?.name || "",
      assignedStaffEmail: getStaffMemberById(newOrderForm.assignedStaffId)?.email || "",
      communicationQrUrl: newOrderForm.communicationQrUrl || "",
      fieldNote: "",
      internalNote: "",
      revisionReason: "",
      timeline: [{ time, action: "商户创建并派发订单" }],
      plan: planDraft,
    });

    setOrders((prevOrders) => [newOrder, ...prevOrders]);
    setMerchantCustomers((prev) => mergeCustomers(prev, [newOrder]));
    syncOneOrder(newOrder, "新订单已写入云端");

    setNewOrderForm({
      customerName: "",
      contactName: "",
      phone: "",
      areaSize: "",
      expectedDate: "",
      address: "",
      description: "",
      tagsText: "办公室,长期租赁",
      source: "商户派单",
      serviceType: "租赁",
      leaseMonths: "12",
      paymentMethod: "月付",
      needDeposit: true,
      budget: "",
      plannedPlantCount: "",
      areaNote: "",
      merchantNote: "",
      retailNeedsMaintenance: false,
      maintenancePackage: "标准养护",
      maintenanceCycle: "6 个月",
      maintenanceFrequency: "每月 2 次",
      maintenanceContent: "浇水、修剪、清洁、病虫检查、简单更换建议",
      maintenanceFinalPrice: "",
      maintenanceInternalNote: "",
      assignedStaffId: DEFAULT_STAFF_ID,
      communicationQrUrl: "",
    });

    setShowCreateOrderSheet(false);
    setShowCreateProductSheet(false);
    setIsCreateOrderInputFocused(false);
    setMerchantTab("工作台");
    setMerchantStatusFilter("全部");
  }

  function toggleNewOrderTag(tag) {
    setNewOrderForm((form) => {
      const tags = form.tagsText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const nextTags = tags.includes(tag)
        ? tags.filter((item) => item !== tag)
        : [...tags, tag];

      return { ...form, tagsText: nextTags.join(",") };
    });
  }

  function resetNewProductForm() {
    setEditingProductId(null);
    setNewProductForm({
      name: "",
      category: "室内绿植",
      subCategory: "大型植物",
      description: "",
      pricePerDay: "",
      imageUrl: "",
      image: "🪴",
      stock: "充足",
      note: "",
      status: "已上架",
    });
  }

  function createMerchantProduct() {
    const name = newProductForm.name.trim();
    if (!name) {
      alert("请填写商品名称");
      return;
    }

    const price = Number(newProductForm.pricePerDay || 0);
    if (!price || Number.isNaN(price)) {
      alert("请填写日租金");
      return;
    }

    const productPayload = {
      id: editingProductId || Date.now(),
      name,
      category: newProductForm.category || "室内绿植",
      subCategory: newProductForm.subCategory || "大型植物",
      description: newProductForm.description.trim() || "暂无描述，后续可在商品库补充。",
      pricePerDay: price,
      // 正式版接 Supabase Storage / 腾讯云 COS / 阿里云 OSS 后，这里应写入上传后的远程图片 URL。
      imageUrl: newProductForm.imageUrl.trim(),
      image: newProductForm.image || "🪴",
      stock: newProductForm.stock || "充足",
      note: newProductForm.note.trim(),
      status: newProductForm.status || "已上架",
      createdAt: newProductForm.createdAt || nowText(),
      updatedAt: nowText(),
    };

    const nextProducts = editingProductId
      ? merchantProducts.map((product) => (product.id === editingProductId ? productPayload : product))
      : [productPayload, ...merchantProducts];

    updateProducts(nextProducts, editingProductId ? "商品修改已同步" : "新商品已同步");
    resetNewProductForm();
    setShowCreateProductSheet(false);
    setMerchantTab("商品库");
  }

  function openEditProduct(product) {
    setEditingProductId(product.id);
    setNewProductForm({
      name: product.name || "",
      category: product.category || "室内绿植",
      subCategory: product.subCategory || "大型植物",
      description: product.description || "",
      pricePerDay: String(product.pricePerDay || ""),
      imageUrl: product.imageUrl || "",
      image: product.image || "🪴",
      stock: product.stock || "充足",
      note: product.note || "",
      status: product.status || "已上架",
      createdAt: product.createdAt || nowText(),
    });
    setShowCreateProductSheet(true);
  }

  function toggleProductStatus(productId) {
    const nextProducts = merchantProducts.map((product) =>
      product.id === productId
        ? { ...product, status: product.status === "已上架" || product.status === "上架" ? "未上架" : "已上架", updatedAt: nowText() }
        : product
    );
    updateProducts(nextProducts, "商品上下架状态已同步");
  }

  function resetNewCustomerForm() {
    setEditingCustomerId(null);
    setNewCustomerForm({
      name: "",
      contactName: "",
      phone: "",
      address: "",
      areaSize: "",
      note: "",
      tagsText: "办公室,长期租赁",
    });
  }

  function saveCustomer() {
    const name = newCustomerForm.name.trim();
    if (!name) {
      alert("请填写客户名称");
      return;
    }

    const payload = {
      id: editingCustomerId || `customer-${Date.now()}`,
      name,
      contactName: newCustomerForm.contactName.trim(),
      phone: newCustomerForm.phone.trim(),
      address: newCustomerForm.address.trim(),
      areaSize: newCustomerForm.areaSize.trim(),
      note: newCustomerForm.note.trim(),
      tagsText: newCustomerForm.tagsText.trim() || "办公室,长期租赁",
      createdAt: newCustomerForm.createdAt || nowText(),
      updatedAt: nowText(),
    };

    setMerchantCustomers((prev) => {
      const next = editingCustomerId
        ? prev.map((customer) => (customer.id === editingCustomerId ? payload : customer))
        : [payload, ...prev];
      persistCustomersToLocalStore(next);
      return next;
    });

    resetNewCustomerForm();
    setShowCreateCustomerSheet(false);
    setMerchantTab("客户库");
  }

  function openEditCustomer(customer) {
    setEditingCustomerId(customer.id);
    setNewCustomerForm({
      name: customer.name || "",
      contactName: customer.contactName || "",
      phone: customer.phone || "",
      address: customer.address || "",
      areaSize: customer.areaSize || "",
      note: customer.note || "",
      tagsText: customer.tagsText || "办公室,长期租赁",
      createdAt: customer.createdAt || nowText(),
    });
    setShowCreateCustomerSheet(true);
  }

  function fillOrderFromCustomer(customer) {
    setNewOrderForm((form) => ({
      ...form,
      customerName: customer.name || form.customerName,
      contactName: customer.contactName || form.contactName,
      phone: customer.phone || form.phone,
      address: customer.address || form.address,
      areaSize: customer.areaSize || form.areaSize,
      tagsText: customer.tagsText || form.tagsText,
    }));
    setShowCreateOrderSheet(true);
  }

  function copyCustomerPlanLink(order) {
    if (!order?.plan?.id) {
      alert("还没有方案，无法生成链接。");
      return;
    }

    copyText(`${window.location.origin}?planId=${order.plan.id}`, "客户方案链接已复制");

    updateOrder(
      order.id,
      (old) => {
        const next = {
          ...old,
          planLinkStatus: "已复制",
        };

        return addTimeline(next, "复制客户方案链接");
      },
      "方案链接状态已同步"
    );
  }

  function exportOrderData(order) {
    const data = {
      ...order,
      exportedAt: nowText(),
      planStats: getPlanStats(order.plan),
    };

    copyText(JSON.stringify(data, null, 2), "订单数据已复制");
  }

  function getOrderHint(order) {
    if (order.status === "待商户确认") return "员工已提交方案，等待商户确认。";
    if (order.status === "方案已确认") return "商户已确认方案，可以开始执行。";
    if (order.status === "待商户归档") return "员工已完成订单，等待商户查看并确认归档。";
    if (order.status === "已完成") return "商户已确认归档，订单正式完成。";
    if (order.status === "配置中" && order.merchantConfirmStatus === "要求修改") {
      return `商户要求修改：${order.revisionReason || "请调整方案"}`;
    }
    return "";
  }

  function buildPlanText(order) {
    const plan = order?.plan;
    const stats = getPlanStats(plan);
    const isRetailPlan = plan?.planType === "零售方案";
    const isMaintenancePlan = plan?.planType === "养护服务";

    const areaText = safeAreas(plan)
      .map((area) => {
        const items = safeItems(area)
          .map((item) => `- ${item.name} × ${item.quantity}（¥${item.pricePerDay}${isRetailPlan ? "/件" : "/天"}）`)
          .join("\n");

        return `【${area.name}】\n${items || "- 暂无商品"}`;
      })
      .join("\n\n");

    const rentalText = isMaintenancePlan
      ? `养护套餐：${plan?.maintenancePackage || "标准养护"}
适合场景：${plan?.maintenanceScene || "-"}
服务频次：${plan?.maintenanceFrequency || "-"}
服务周期：${plan?.maintenanceCycle || "-"}
服务内容：${plan?.maintenanceContent || "-"}
最终报价：¥${money(stats.finalRent)}`
      : isRetailPlan
        ? `商品金额：¥${money(stats.dailyRent)}
后续养护：${plan?.retailNeedsMaintenance ? `需要，${plan?.retailMaintenanceNote || "待确认"}` : "暂不需要"}
最终报价：¥${money(stats.finalRent)}`
      : `日租金：¥${money(stats.dailyRent)}
租期：${plan?.leaseMonths || 12}月
系统总租金：¥${money(stats.systemTotalRent)}
最终报价：¥${money(stats.finalRent)}
支付方式：${plan?.paymentMethod || "月付"}
押金：${plan?.needDeposit ? "需要" : "不需要"}
基础养护：已包含`;

    return `${plan?.planType || "绿植租赁方案"}
项目 / 客户：${order?.customerName || "-"}
联系人：${order?.contactName || "-"}
电话：${order?.phone || "-"}
项目面积：${order?.areaSize || "-"}
进场时间：${order?.expectedDate || "-"}
客户地址：${order?.address || "-"}
订单状态：${order?.status || "-"}
商户确认：${order?.merchantConfirmStatus || "-"}
客户确认：${order?.customerConfirmStatus || "-"}

方案明细：
${isMaintenancePlan ? "养护服务不展示商品明细" : areaText || "暂无区域"}

${rentalText}`;
  }

  function SyncInfoCard({ compact = false }) {
    return (
      <section className="plan-summary-card">
        <div className="plan-summary-top">
          <div>
            <p>数据来源</p>
            <strong>Supabase 云端</strong>
          </div>
          <div>
            <p>同步状态</p>
            <strong>{syncState}</strong>
          </div>
          <div>
            <p>实时同步</p>
            <strong>{autoSyncState}</strong>
          </div>
        </div>

        {!compact && (
          <>
            <div className="empty-card">
              <p>云同步已开启</p>
              <span>{syncMessage}｜页面打开时会每 5 秒自动同步订单和商品，手动刷新仍然保留作兜底。</span>
            </div>

            <div className="actions">
              <button className="ghost-button" onClick={refreshOrdersFromCloud}>
                刷新订单
              </button>
              <button className="ghost-button" onClick={uploadLocalOrdersToCloud}>
                上传本地到云端
              </button>
            </div>
          </>
        )}
      </section>
    );
  }

  function StatusPill({ children }) {
    return <span className="area-size">{children}</span>;
  }

  // --- 核心修复区域开始：CoreOrderCard 重新排版 ---
  function CoreOrderCard({ order, mode = "staff" }) {
    const stats = getPlanStats(order.plan);
    const hint = getOrderHint(order);

    if (mode === "staff") {
  const isPending = order.status === "待接单";
  const canBuild = ["配置中", "待商户确认"].includes(order.status);
  const canExecute = ["方案已确认", "执行中"].includes(order.status);
  const orderSignals = getOrderSignalTags(order);

  const statusClass = isPending
    ? "pending"
    : canBuild
      ? "build"
      : canExecute
        ? "execute"
        : order.status === "已完成"
          ? "done"
          : "archive";

  return (
    <article className="staff-task-card">
      <div className="staff-task-top">
        <span className="staff-order-id">#{String(order.id).slice(-8)}</span>
        <span className={`staff-status-chip ${statusClass}`}>{order.status}</span>
      </div>

      <div className="staff-task-title-row">
        <div>
          <h2>{order.customerName}</h2>
          <p>{order.source || "商户派单"} · {order.areaSize || "面积待确认"}</p>
        </div>
        {order.plan && (
          <strong className="staff-price">¥ {money(stats.finalRent)}</strong>
        )}
      </div>

      {orderSignals.length > 0 && (
        <div className="staff-order-tags" aria-label="订单标签">
          {orderSignals.map((tag) => (
            <span key={tag} className={`staff-order-tag ${tag === "急单" ? "urgent" : tag === "需比价" ? "compare" : ""}`}>
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="staff-task-info">
        <span>方案类型</span>
        <strong>{order.plan?.planType || order.planType || getInitialPlanTypeForOrder(order)}</strong>

        <span>面积 / 数量</span>
        <strong>{order.areaSize || "面积待确认"} · {order.plannedPlantCount || `${stats.productCount || 0} 件商品`}</strong>

        <span>任务地址</span>
        <strong>{order.address || "暂无地址"}</strong>

        <span>联系人</span>
        <strong>
          {order.contactName || "-"} {order.phone ? `｜${order.phone}` : ""}
        </strong>

        <span>预约时间</span>
        <strong>{order.expectedDate || "待确认"}</strong>

        <span>客户描述</span>
        <strong>{order.description || "暂无描述"}</strong>

        <span>商户备注</span>
        <strong>{order.merchantNote || order.plan?.merchantDraftNote || "暂无备注"}</strong>
      </div>

      {hint && <div className="staff-task-hint">{hint}</div>}

      <div className="staff-task-actions">
        {isPending ? (
          <>
            <button className="staff-ghost-action" onClick={() => openRouteNavigation(order.address)}>
              导航
            </button>
            {order.communicationQrUrl && (
              <button className="staff-ghost-action" onClick={() => setQrPreviewOrder(order)}>
                查看二维码
              </button>
            )}
            <button className="staff-primary-action" onClick={() => {
              setPlanType(getInitialPlanTypeForOrder(order));
              setSelectedOrder(order);
            }}>
              确认接单
            </button>
          </>
        ) : (
          <>
            <button className="staff-ghost-action" onClick={() => openRouteNavigation(order.address)}>
              导航
            </button>
            {order.communicationQrUrl && (
              <button className="staff-ghost-action" onClick={() => setQrPreviewOrder(order)}>
                查看二维码
              </button>
            )}
            <button
              className="staff-primary-action"
              onClick={() => {
                if (canExecute && order.status === "执行中") {
                  setCurrentOrderId(order.id);
                  setCurrentPage("completeUpload");
                  return;
                }
                openPlanForOrder(order);
              }}
            >
              {order.status === "执行中" ? "完成任务" : canBuild ? (order.plan ? "查看 / 修改方案" : "现场创建方案") : "查看详情"}
            </button>
          </>
        )}
      </div>
    </article>
  );
}

    return (
      <article className="order-card">
        <div className="order-card-header">
          <div>
            <h2>{order.customerName}</h2>
            <p>{order.status}</p>
          </div>
          <StatusPill>{order.areaSize}</StatusPill>
        </div>

        <div className="tag-list">
          {(Array.isArray(order.tags) ? order.tags : []).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>

        <div className="info-row">
          <span>联系人</span>
          <strong>
            {order.contactName || "-"} {order.phone ? `｜${order.phone}` : ""}
          </strong>
        </div>

        <div className="info-row">
          <span>地址</span>
          <strong>{order.address}</strong>
        </div>

        {order.plan && (
          <div className="info-row">
            <span>报价</span>
            <strong>¥ {money(stats.finalRent)}</strong>
          </div>
        )}

        {hint && (
          <div className="empty-card">
            <p>流程提醒</p>
            <span>{hint}</span>
          </div>
        )}

        <div className="actions">
          <button className="ghost-button" onClick={() => callPhone(order.phone)}>电话</button>
          <button className="ghost-button" onClick={() => openRouteNavigation(order.address)}>导航</button>
          <button className="ghost-button" onClick={() => copyText(order.address, "地址已复制")}>地址</button>

          {mode === "merchant" && (
            <button
              className="primary-button"
              onClick={() => {
                if (order.plan && ["待商户确认", "待商户归档", "方案已确认", "执行中", "已完成"].includes(order.status)) {
                  openMerchantPlanWorkbench(order);
                  return;
                }

                setSelectedOrderDetail(order);
                setMerchantViewingOrder(null);
              }}
            >
              {order.status === "待商户确认"
                ? "查看方案"
                : order.status === "待商户归档"
                  ? "去归档"
                  : order.plan
                    ? "看方案"
                    : "详情"}
            </button>
          )}
        </div>
      </article>
    );
  }
  // --- 核心修复区域结束 ---

  function StatusSummaryCard({ order, editable = false }) {
    return (
      <section className="plan-summary-card">
        <div className="plan-summary-top">
          <div>
            <p>订单状态</p>
            <strong>{order.status}</strong>
          </div>
          <div>
            <p>商户确认</p>
            <strong>{order.merchantConfirmStatus || "未提交"}</strong>
          </div>
        </div>

        <div className="plan-summary-top">
          <div>
            <p>执行状态</p>
            <strong>{order.executionStatus || "待联系"}</strong>
          </div>
          <div>
            <p>配送状态</p>
            <strong>{order.deliveryStatus || "未出发"}</strong>
          </div>
        </div>

        {getOrderHint(order) && (
          <div className="empty-card">
            <p>流程提醒</p>
            <span>{getOrderHint(order)}</span>
          </div>
        )}

        {editable && (
          <div className="actions mini-actions">
            <button className="ghost-button" onClick={() => locateStaff(order.id)}>
              定位
            </button>
            <button className="ghost-button" onClick={() => openRouteNavigation(order.address)}>
              导航
            </button>
            <button className="ghost-button" onClick={() => copyText(order.address, "地址已复制")}>
              地址
            </button>
          </div>
        )}
      </section>
    );
  }

  function ExtraDetails({ order, editable = false }) {
    return (
      <>
        <section className="plan-summary-card">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">More</p>
              <h2>更多信息</h2>
            </div>
          </div>

          <div className="plan-info-line">
            <span>客户确认</span>
            <strong>{order.customerConfirmStatus || "待确认"}</strong>
          </div>
          <div className="plan-info-line">
            <span>方案链接</span>
            <strong>{order.planLinkStatus || "未生成"}</strong>
          </div>
          <div className="plan-info-line">
            <span>预计时间</span>
            <strong>{order.etaText || "待定位"}</strong>
          </div>
          <div className="plan-info-line">
            <span>员工定位</span>
            <strong>{order.staffLocation?.locatedAt || "未定位"}</strong>
          </div>

          {editable && (
            <>
              <StatusControlGroup
                title="执行状态"
                options={EXECUTION_STATUS}
                value={order.executionStatus || "待联系"}
                onChange={(value) =>
                  updateOrder(
                    order.id,
                    (old) =>
                      addTimeline({ ...old, executionStatus: value }, `执行状态更新为：${value}`),
                    "执行状态已同步"
                  )
                }
              />

              <StatusControlGroup
                title="配送状态"
                options={DELIVERY_STATUS}
                value={order.deliveryStatus || "未出发"}
                onChange={(value) =>
                  updateOrder(
                    order.id,
                    (old) =>
                      addTimeline({ ...old, deliveryStatus: value }, `配送状态更新为：${value}`),
                    "配送状态已同步"
                  )
                }
              />

              <StatusControlGroup
                title="客户确认"
                options={CUSTOMER_CONFIRM_STATUS}
                value={order.customerConfirmStatus || "待确认"}
                onChange={(value) =>
                  updateOrder(
                    order.id,
                    (old) =>
                      addTimeline({ ...old, customerConfirmStatus: value }, `客户确认状态更新为：${value}`),
                    "客户确认已同步"
                  )
                }
              />

              <StatusControlGroup
                title="方案链接"
                options={PLAN_LINK_STATUS}
                value={order.planLinkStatus || "未生成"}
                onChange={(value) =>
                  updateOrder(
                    order.id,
                    (old) =>
                      addTimeline({ ...old, planLinkStatus: value }, `方案链接状态更新为：${value}`),
                    "方案链接已同步"
                  )
                }
              />
            </>
          )}
        </section>

        <NotesCard order={order} editable={editable} />
        <TimelineCard order={order} />
      </>
    );
  }

  function StatusControlGroup({ title, options, value, onChange }) {
    return (
      <div className="sheet-block">
        <p className="sheet-label">{title}</p>
        <div className="option-grid payment-grid">
          {options.map((item) => (
            <button
              key={item}
              className={value === item ? "selected" : ""}
              onClick={() => onChange(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function TimelineCard({ order }) {
    return (
      <section className="plan-summary-card">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Timeline</p>
            <h2>执行记录</h2>
          </div>
        </div>

        {safeTimeline(order).length === 0 ? (
          <div className="empty-card">
            <p>暂无执行记录</p>
          </div>
        ) : (
          <div className="selected-product-list">
            {safeTimeline(order).map((item, index) => (
              <div className="selected-product-row" key={`${item.time}-${index}`}>
                <div>
                  <strong>{item.action}</strong>
                  <span>{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }

  function NotesCard({ order, editable = false }) {
    return (
      <section className="plan-summary-card">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Notes</p>
            <h2>订单备注</h2>
          </div>
        </div>

        {editable ? (
          <>
            <div className="sheet-block">
              <p className="sheet-label">现场备注</p>
              <input
                className="area-input"
                value={order.fieldNote || ""}
                onChange={(e) => updateOrder(order.id, { fieldNote: e.target.value }, "现场备注已同步")}
                placeholder="例如：客户前台空间较窄，建议用中小型植物"
              />
            </div>

            <div className="sheet-block">
              <p className="sheet-label">内部备注</p>
              <input
                className="area-input"
                value={order.internalNote || ""}
                onChange={(e) => updateOrder(order.id, { internalNote: e.target.value }, "内部备注已同步")}
                placeholder="例如：后续可推荐季度养护套餐"
              />
            </div>
          </>
        ) : (
          <>
            <div className="plan-info-line">
              <span>现场备注</span>
              <strong>{order.fieldNote || "-"}</strong>
            </div>
            <div className="plan-info-line">
              <span>内部备注</span>
              <strong>{order.internalNote || "-"}</strong>
            </div>
          </>
        )}
      </section>
    );
  }

  function updateCompletePhoto(group, index, value) {
    setCompleteForm((form) => ({
      ...form,
      [group]: form[group].map((item, i) => (i === index ? value : item)),
    }));
  }

  function updateCompletePhotos(group, values) {
    setCompleteForm((form) => ({
      ...form,
      [group]: values.slice(0, 3),
    }));
  }

  function renderPhotoUploadBlock(title, group, tip) {
    const values = completeForm[group] || ["", "", ""];
    return (
      <section className="plan-summary-card" style={{ padding: 18 }}>
        <div className="section-title-row">
          <div>
            <p className="eyebrow">UPLOAD</p>
            <h2>{title}</h2>
          </div>
          <span className="area-size">最多 3 张</span>
        </div>
        <div className="empty-card" style={{ textAlign: "left", marginBottom: 12 }}>
          <p>{tip}</p>
          <span>点击上传按钮选择照片，当前先保存为本地预览数据。</span>
        </div>
        <ImageUploader
          values={values}
          max={3}
          label={title}
          helper="支持手机拍照或从相册选择，每组最多 3 张。"
          onChange={(nextValues) => updateCompletePhotos(group, nextValues)}
        />
      </section>
    );
  }

 function submitCompleteUpload() {
  if (!currentOrder) return;

  if (!["方案已确认", "执行中"].includes(currentOrder.status)) {
    alert("需要商户确认方案后，员工才能完成订单。");
    return;
  }

  if (!window.confirm(`确认将「${currentOrder.customerName}」标记为已完成，并提交给商户归档吗？`)) {
    return;
  }

  const completedTime = nowText();

  updateOrder(
    currentOrder.id,
    (order) => {
      const next = {
        ...order,
        status: "待商户归档",
        planStatus: "待商户归档",
        merchantArchiveStatus: "待归档",
        deliveryStatus: "已到达",
        executionStatus: "已完成服务",
        completedAt: completedTime,
        completePhotos: {
          scenePhotos: Array.isArray(completeForm.scenePhotos) ? completeForm.scenePhotos : ["", "", ""],
          plantPhotos: Array.isArray(completeForm.plantPhotos) ? completeForm.plantPhotos : ["", "", ""],
          remark: completeForm.remark || "",
          submittedAt: completedTime,
        },
        plan: order.plan
          ? {
              ...order.plan,
              status: "待商户归档",
              completedAt: completedTime,
            }
          : order.plan,
      };

      return addTimeline(next, "员工提交完成照片和备注，订单进入待商户归档");
    },
    "订单完成待归档已同步"
  );

  setActiveStaffTab("已完成");
  setCurrentPage("orders");
  setCompleteForm({ scenePhotos: ["", "", ""], plantPhotos: ["", "", ""], remark: "" });
}

  function renderCompleteUploadPage() {
    if (!currentOrder) return null;
    return (
      <div className="app">
        <header className="plan-header">
          <button className="back-button" onClick={() => setCurrentPage("plan")}>←</button>
          <div>
            <p className="eyebrow">Task Complete · v3.8</p>
            <h1>任务完成</h1>
          </div>
        </header>

        <section className="plan-summary-card" style={{ padding: 18 }}>
          <div className="plan-summary-top">
            <div><p>当前订单</p><strong>{currentOrder.customerName}</strong></div>
            <div><p>完成资料</p><strong>照片 + 备注</strong></div>
          </div>
          <div className="empty-card" style={{ marginTop: 12, textAlign: "left" }}>
            <p>提交前补充现场资料</p>
            <span>大场景图、植物状态图均支持本地照片选择和即时预览，每组最多 3 张。</span>
          </div>
        </section>

        {renderPhotoUploadBlock("大场景图", "scenePhotos", "用于记录客户现场整体摆放效果。")}
        {renderPhotoUploadBlock("植物状态图", "plantPhotos", "用于记录植物状态、细节和现场交付情况。")}

        <section className="plan-summary-card" style={{ padding: 18 }}>
          <p className="sheet-label">完成备注</p>
          <textarea
            className="area-input"
            value={completeForm.remark}
            onChange={(e) => setCompleteForm((form) => ({ ...form, remark: e.target.value }))}
            placeholder="例如：已按方案完成摆放，客户现场确认无异议。"
            rows={4}
            style={{ resize: "vertical", minHeight: 110 }}
          />
        </section>

        <nav className="bottom-actions">
          <button onClick={() => setCurrentPage("plan")}>返回方案</button>
          <button onClick={() => copyCustomerPlanLink(currentOrder)}>客户链接</button>
          <button className="submit-plan-button" onClick={submitCompleteUpload}>提交完成</button>
        </nav>
      </div>
    );
  }

  function renderCustomerPlanView() {
    if (!customerPlanId) return null;

    if (!customerViewOrder) {
      return (
        <div className="app">
          <section className="empty-card">
            <p>没有找到这个方案</p>
            <span>请先在同一浏览器刷新云端订单，或等待后续客户端独立页面。</span>
          </section>
        </div>
      );
    }

    const stats = getPlanStats(customerViewOrder.plan);
    const isRetailPlan = customerViewOrder.plan?.planType === "零售方案";
    const isMaintenancePlan = customerViewOrder.plan?.planType === "养护服务";

    return (
      <div className="app">
        <header className="app-header">
          <div>
            <p className="eyebrow">Customer Plan</p>
            <h1>{customerViewOrder.customerName}</h1>
          </div>
        </header>

        <SyncInfoCard compact />
        <StatusSummaryCard order={customerViewOrder} />

        <section className="price-card price-detail-card">
          {isMaintenancePlan ? (
            <>
              <div><span>养护套餐</span><strong>{customerViewOrder.plan?.maintenancePackage || "标准养护"}</strong></div>
              <div><span>服务频次</span><strong>{customerViewOrder.plan?.maintenanceFrequency || "-"}</strong></div>
              <div><span>服务周期</span><strong>{customerViewOrder.plan?.maintenanceCycle || "-"}</strong></div>
            </>
          ) : (
            <>
              <div><span>{isRetailPlan ? "商品金额" : "日租金"}</span><strong>¥ {money(stats.dailyRent)}</strong></div>
              {!isRetailPlan && <div><span>租期</span><strong>{customerViewOrder.plan?.leaseMonths || 12} 月</strong></div>}
              <div><span>{isRetailPlan ? "系统建议总价" : "系统预计总租金"}</span><strong>¥ {money(stats.systemTotalRent)}</strong></div>
            </>
          )}
          <div><span>最终报价</span><strong>¥ {money(stats.finalRent)}</strong></div>
          {!isRetailPlan && !isMaintenancePlan && <div><span>支付方式</span><strong>{customerViewOrder.plan?.paymentMethod || "月付"}</strong></div>}
          {!isRetailPlan && !isMaintenancePlan && <div><span>押金</span><strong>{customerViewOrder.plan?.needDeposit ? "需要" : "不需要"}</strong></div>}
        </section>

        {isMaintenancePlan ? (
          <section className="area-section">
            <div className="section-title-row">
              <div>
                <p className="eyebrow">Maintenance</p>
                <h2>服务内容</h2>
              </div>
            </div>
            <article className="area-card">
              <div>
                <h3>{customerViewOrder.plan?.maintenancePackage || "标准养护"}</h3>
                <p>{customerViewOrder.plan?.maintenanceScene || "-"}</p>
                <div className="selected-product-row">
                  <div>
                    <strong>{customerViewOrder.plan?.maintenanceFrequency || "-"}</strong>
                    <span>{customerViewOrder.plan?.maintenanceContent || "-"}</span>
                  </div>
                </div>
              </div>
            </article>
          </section>
        ) : (
        <section className="area-section">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Areas</p>
              <h2>方案明细</h2>
            </div>
          </div>

          {safeAreas(customerViewOrder.plan).map((area) => (
            <article className="area-card" key={area.id}>
              <div>
                <h3>{area.name}</h3>
                <p>
                  已选商品：{getAreaProductCount(area)} 件｜{isRetailPlan ? "区域金额" : "区域日租金"}：¥{" "}
                  {money(getAreaDailyRent(area))}
                </p>

                {safeItems(area).map((item) => (
                  <div className="selected-product-row" key={item.productId}>
                    <div>
                      <strong>{item.name}</strong>
                      <span>¥ {item.pricePerDay}{isRetailPlan ? "/件" : "/天"} × {item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
        )}
      </div>
    );
  }

  function renderPlanPage() {
    if (!currentOrder || !currentPlan) return null;

    const videoBlue = "#2d5f8f";
    const selectedRows = planAreas.flatMap((area) =>
      safeItems(area).map((item) => ({ ...item, areaId: area.id, areaName: area.name }))
    );
    const isRetailPlan = currentPlan?.planType === "零售方案";
    const isMaintenancePlan = currentPlan?.planType === "养护服务";

    const pageStyle = {
      minHeight: "100vh",
      background: "#f4f6f9",
      color: "#182536",
      paddingBottom: "calc(96px + env(safe-area-inset-bottom))",
    };
    const navStyle = {
      position: "sticky",
      top: 0,
      zIndex: 20,
      height: 54,
      display: "grid",
      gridTemplateColumns: "48px 1fr 48px",
      alignItems: "center",
      background: "rgba(255,255,255,.98)",
      borderBottom: "1px solid #e8edf3",
      padding: "0 12px",
      boxShadow: "0 6px 18px rgba(31,58,88,.04)",
    };
    const cardStyle = {
      background: "#fff",
      border: "1px solid #e4eaf2",
      borderRadius: 14,
      margin: "12px 12px 0",
      padding: 14,
      boxShadow: "0 8px 22px rgba(31,58,88,.05)",
    };
    const labelStyle = { color: "#7b899a", fontSize: 13 };
    const strongStyle = { color: "#1b2d42", fontWeight: 800, fontSize: 14 };
    const tabStyle = (active) => ({
      border: 0,
      background: "transparent",
      color: active ? videoBlue : "#526274",
      fontWeight: 900,
      padding: "13px 0 11px",
      borderBottom: active ? `3px solid ${videoBlue}` : "3px solid transparent",
      fontSize: 15,
    });

    return (
      <div style={pageStyle}>
        <header style={navStyle}>
          <button style={{ border: 0, background: "transparent", fontSize: 22, color: "#24364b" }} onClick={() => setCurrentPage("orders")}>‹</button>
          <strong style={{ textAlign: "center", fontSize: 17, color: "#182536" }}>添加方案</strong>
          <span />
        </header>

        <section style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <div>
              <span style={{ ...labelStyle, display: "block", marginBottom: 4 }}>当前任务</span>
              <strong style={{ fontSize: 18, color: "#182536" }}>{currentOrder.customerName}</strong>
            </div>
            <span style={{ borderRadius: 6, background: "#eaf2fb", color: videoBlue, padding: "6px 10px", fontWeight: 900 }}>{currentOrder.status}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "78px 1fr", gap: "8px 10px", borderTop: "1px solid #edf1f5", paddingTop: 10 }}>
            <span style={labelStyle}>任务地址</span><strong style={{ ...strongStyle, textAlign: "right" }}>{currentOrder.address || "-"}</strong>
            <span style={labelStyle}>联系人</span><strong style={{ ...strongStyle, textAlign: "right" }}>{currentOrder.contactName || "-"}{currentOrder.phone ? `｜${currentOrder.phone}` : ""}</strong>
            <span style={labelStyle}>预约时间</span><strong style={{ ...strongStyle, textAlign: "right" }}>{currentOrder.expectedDate || "待确认"}</strong>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 12 }}>
            <button style={{ border: `1px solid ${videoBlue}`, borderRadius: 10, background: "#fff", color: videoBlue, fontWeight: 900, padding: "11px 8px" }} onClick={() => callPhone(currentOrder.phone)}>电话</button>
            <button style={{ border: `1px solid ${videoBlue}`, borderRadius: 10, background: "#fff", color: videoBlue, fontWeight: 900, padding: "11px 8px" }} onClick={() => openRouteNavigation(currentOrder.address)}>导航</button>
            <button style={{ border: `1px solid ${videoBlue}`, borderRadius: 10, background: "#fff", color: videoBlue, fontWeight: 900, padding: "11px 8px" }} onClick={() => copyText(currentOrder.address, "地址已复制")}>地址</button>
          </div>
        </section>

        {currentOrder.status === "方案已确认" && (
          <section style={cardStyle}>
            <strong style={{ color: "#182536" }}>商户已确认方案</strong>
            <p style={{ margin: "8px 0 12px", color: "#6b7788" }}>现在可以开始执行服务。</p>
            <button style={{ width: "100%", border: 0, borderRadius: 10, background: videoBlue, color: "#fff", fontWeight: 900, padding: "13px 14px" }} onClick={() => startExecution(currentOrder.id)}>开始执行服务</button>
          </section>
        )}

        {currentOrder.status === "执行中" && (
          <section style={cardStyle}>
            <strong style={{ color: "#182536" }}>任务执行中</strong>
            <p style={{ margin: "8px 0 12px", color: "#6b7788" }}>完成摆放后上传现场照片并提交。</p>
            <button style={{ width: "100%", border: 0, borderRadius: 10, background: videoBlue, color: "#fff", fontWeight: 900, padding: "13px 14px" }} onClick={() => setCurrentPage("completeUpload")}>完成任务并上传照片</button>
          </section>
        )}

        {!isMaintenancePlan && (
        <section style={cardStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid #e7edf4", marginBottom: 12 }}>
            <button style={tabStyle(true)}>植物</button>
            <button style={tabStyle(false)} onClick={() => alert("花盆库已经预留，后续补充数据。")}>花盆</button>
            <button style={tabStyle(false)} onClick={() => alert("资材库已经预留，后续补充数据。")}>资材</button>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
            <div>
              <strong style={{ color: "#182536", fontSize: 16 }}>场景物料表</strong>
              <p style={{ margin: "4px 0 0", color: "#7b899a", fontSize: 13 }}>按区域选择植物，数量可直接修改。</p>
            </div>
            <button style={{ border: 0, borderRadius: 10, background: videoBlue, color: "#fff", fontWeight: 900, padding: "10px 13px" }} onClick={() => setShowAreaSheet(true)}>+ 场景</button>
          </div>

          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 8 }}>
            {planAreas.map((area) => (
              <button key={area.id} style={{ flex: "0 0 auto", border: "1px solid #d8e1ec", borderRadius: 8, padding: "8px 10px", background: currentAreaId === area.id ? "#eaf2fb" : "#fff", color: currentAreaId === area.id ? videoBlue : "#526274", fontWeight: 800 }} onClick={() => openProductSheet(area)}>
                {area.name} · {getAreaProductCount(area)}件
              </button>
            ))}
            {planAreas.length === 0 && ["前台", "办公室", "会议室", "走廊", "门口"].map((name) => (
              <button key={name} style={{ flex: "0 0 auto", border: "1px solid #d8e1ec", borderRadius: 8, padding: "8px 10px", background: "#fff", color: "#526274", fontWeight: 800 }} onClick={() => addAreaWithName(name)}>{name}</button>
            ))}
          </div>

          <div style={{ overflowX: "auto", border: "1px solid #e7edf4", borderRadius: 10 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620, fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f6f8fb", color: "#607085" }}>
                  <th style={{ padding: 10, textAlign: "left" }}>名称</th>
                  <th style={{ padding: 10, textAlign: "center" }}>图片</th>
                  <th style={{ padding: 10, textAlign: "right" }}>价格</th>
                  <th style={{ padding: 10, textAlign: "center" }}>状态</th>
                  <th style={{ padding: 10, textAlign: "center" }}>数量</th>
                  <th style={{ padding: 10, textAlign: "center" }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {selectedRows.length === 0 ? (
                  <tr><td colSpan="6" style={{ padding: 22, textAlign: "center", color: "#8a96a8" }}>暂无物料。先添加场景，再选择植物。</td></tr>
                ) : selectedRows.map((item) => {
                  const product = merchantProducts.find((p) => p.id === item.productId) || item;
                  const image = getProductImage(product);
                  return (
                    <tr key={`${item.areaId}-${item.productId}`} style={{ borderTop: "1px solid #edf1f5" }}>
                      <td style={{ padding: 10 }}><strong style={{ color: "#223247" }}>{item.name}</strong><br/><span style={{ color: "#8a96a8" }}>{item.areaName}</span></td>
                      <td style={{ padding: 10, textAlign: "center" }}><span style={{ width: 42, height: 42, borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#f2f5f8", overflow: "hidden" }}>{isImageUrl(image) ? <img src={image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : image}</span></td>
                      <td style={{ padding: 10, textAlign: "right", fontWeight: 800 }}>¥ {item.pricePerDay}{currentPlan?.planType === "零售方案" ? "/件" : "/天"}</td>
                      <td style={{ padding: 10, textAlign: "center" }}><span style={{ borderRadius: 6, background: "#eaf2fb", color: "#2f6fae", padding: "4px 8px", fontWeight: 800 }}>有货</span></td>
                      <td style={{ padding: 10, textAlign: "center" }}><input inputMode="numeric" type="number" value={item.quantity} min="1" style={{ width: 56, height: 34, border: "1px solid #d8e1ec", borderRadius: 8, textAlign: "center", fontWeight: 800 }} onChange={(e) => {
                        const nextQty = Math.max(1, Number(e.target.value || 1));
                        updateOrderPlan(currentOrder.id, (plan) => ({
                          ...plan,
                          areas: safeAreas(plan).map((area) => area.id === item.areaId ? {
                            ...area,
                            items: safeItems(area).map((old) => old.productId === item.productId ? { ...old, quantity: nextQty } : old)
                          } : area),
                        }), "数量已同步");
                      }} /></td>
                      <td style={{ padding: 10, textAlign: "center" }}><button style={{ border: 0, background: "#fff1f0", color: "#b44a3e", borderRadius: 8, padding: "7px 9px", fontWeight: 800 }} onClick={() => removeItemFromArea(item.areaId, item.productId)}>删除</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
        )}

        {isMaintenancePlan && (
          <section style={cardStyle} className="maintenance-plan-card">
            <div className="section-title-row">
              <div>
                <p className="eyebrow">Maintenance</p>
                <h2>养护服务套餐</h2>
              </div>
            </div>

            <div className="maintenance-package-grid">
              {MAINTENANCE_PACKAGES.map((pack) => {
                const selected = currentPlan.maintenancePackage === pack.name;
                return (
                  <button
                    key={pack.name}
                    className={selected ? "selected" : ""}
                    onClick={() =>
                      updateOrderPlan(
                        currentOrder.id,
                        (plan) => ({ ...plan, ...getMaintenancePlanFields(pack.name) }),
                        "养护套餐已同步"
                      )
                    }
                  >
                    <strong>{pack.name}</strong>
                    <span>{pack.frequency}</span>
                    <small>{pack.scene}</small>
                  </button>
                );
              })}
            </div>

            <div className="maintenance-detail-grid">
              <div className="sheet-block">
                <p className="sheet-label">适合场景</p>
                <input className="area-input" value={currentPlan.maintenanceScene || ""} onChange={(e) => updateCurrentPlanField("maintenanceScene", e.target.value)} />
              </div>
              <div className="sheet-block">
                <p className="sheet-label">服务频次</p>
                <input className="area-input" value={currentPlan.maintenanceFrequency || ""} onChange={(e) => updateCurrentPlanField("maintenanceFrequency", e.target.value)} />
              </div>
              <div className="sheet-block">
                <p className="sheet-label">服务周期</p>
                <input className="area-input" value={currentPlan.maintenanceCycle || ""} onChange={(e) => updateCurrentPlanField("maintenanceCycle", e.target.value)} placeholder="例如：3 个月 / 6 个月 / 按项目约定" />
              </div>
              <div className="sheet-block">
                <p className="sheet-label">最终报价</p>
                <input className="area-input" type="number" value={currentPlan.maintenanceFinalPrice || ""} disabled placeholder="由商户审核时手动填写" />
              </div>
            </div>

            <div className="sheet-block">
              <p className="sheet-label">服务内容</p>
              <textarea className="area-input maintenance-textarea" value={currentPlan.maintenanceContent || ""} onChange={(e) => updateCurrentPlanField("maintenanceContent", e.target.value)} />
            </div>

            <div className="empty-card">
              <p>客户侧只展示套餐、频次、周期、服务内容和最终报价。</p>
              <span>按次、按月、按面积、按盆数、上门费和特殊植物加价等复杂因素仅作为内部报价参考。</span>
            </div>
          </section>
        )}

        {!isMaintenancePlan && (
        <section style={{
          background: "#fff",
          border: "1px solid #e4eaf2",
          borderRadius: 14,
          margin: "12px 12px 0",
          padding: 16,
          boxShadow: "0 8px 22px rgba(31,58,88,.05)",
          textAlign: "left"
        }}>
          <strong style={{ display: "block", marginBottom: 16, color: "#182536", fontSize: 17, fontWeight: 900 }}>定价与支付设置</strong>

          {/* 1. 核心数据 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
            <div style={{ background: "#f6f8fb", borderRadius: 10, padding: 12 }}>
              <span style={{ color: "#7b899a", fontSize: 12, fontWeight: 700 }}>{currentPlan?.planType === "零售方案" ? "商品金额" : "预估日租金"}</span>
              <strong style={{ display: "block", marginTop: 4, fontSize: 18, color: "#182536" }}>¥ {money(currentStats.dailyRent)}</strong>
            </div>
            <div style={{ background: "#f6f8fb", borderRadius: 10, padding: 12 }}>
              <span style={{ color: "#7b899a", fontSize: 12, fontWeight: 700 }}>系统建议总价</span>
              <strong style={{ display: "block", marginTop: 4, fontSize: 18, color: "#2f6fb3" }}>¥ {money(currentStats.systemTotalRent)}</strong>
            </div>
          </div>

          {currentPlan?.planType === "租赁方案" && (
            <div className="empty-card" style={{ marginBottom: 18 }}>
              <p>租赁方案默认包含基础养护</p>
              <span>长期租摆报价中已包含基础浇水、修剪、清洁和状态检查，不需要客户额外再选养护订单。</span>
            </div>
          )}

          {currentPlan?.planType === "零售方案" && (
            <div className="sheet-block">
              <p className="sheet-label">是否需要后续养护</p>
              <div className="option-grid payment-grid">
                <button className={currentPlan.retailNeedsMaintenance ? "selected" : ""} onClick={() => updateCurrentPlanField("retailNeedsMaintenance", true)}>需要后续养护</button>
                <button className={!currentPlan.retailNeedsMaintenance ? "selected" : ""} onClick={() => updateCurrentPlanField("retailNeedsMaintenance", false)}>暂不需要</button>
              </div>
              {currentPlan.retailNeedsMaintenance && (
                <input
                  className="area-input"
                  value={currentPlan.retailMaintenanceNote || ""}
                  onChange={(e) => updateCurrentPlanField("retailMaintenanceNote", e.target.value)}
                  placeholder="例如：客户希望交付后每月巡检一次"
                  style={{ marginTop: 10 }}
                />
              )}
            </div>
          )}

          {/* 2. 租期选择 */}
          <div style={{ marginBottom: 18, display: currentPlan?.planType === "零售方案" ? "none" : "block" }}>
            <span style={{ display: "block", color: "#647286", fontSize: 13, fontWeight: 800, marginBottom: 8 }}>选择租期</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {[6, 12, 24, 36].map((m) => {
                const selected = Number(currentPlan.leaseMonths || 12) === m;
                return (
                  <button
                    key={m}
                    onClick={() => updateCurrentPlanField("leaseMonths", m)}
                    style={{
                      border: selected ? "1px solid #2f6fb3" : "1px solid #d8e1ec",
                      background: selected ? "#2f6fb3" : "#fff",
                      color: selected ? "#fff" : "#526274",
                      borderRadius: 8,
                      padding: "9px 0",
                      fontSize: 13,
                      fontWeight: 800
                    }}
                  >
                    {m} 个月
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. 支付方式 */}
          <div style={{ marginBottom: 18, display: currentPlan?.planType === "零售方案" ? "none" : "block" }}>
            <span style={{ display: "block", color: "#647286", fontSize: 13, fontWeight: 800, marginBottom: 8 }}>支付方式</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {["月付", "季付", "半年付", "年付"].map((method) => {
                const selected = currentPlan.paymentMethod === method;
                return (
                  <button
                    key={method}
                    onClick={() => updateCurrentPlanField("paymentMethod", method)}
                    style={{
                      border: selected ? "1px solid #2f6fb3" : "1px solid #d8e1ec",
                      background: selected ? "#2f6fb3" : "#fff",
                      color: selected ? "#fff" : "#526274",
                      borderRadius: 8,
                      padding: "9px 0",
                      fontSize: 13,
                      fontWeight: 800
                    }}
                  >
                    {method}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. 押金设置 */}
          <div style={{ marginBottom: 18, display: currentPlan?.planType === "零售方案" ? "none" : "block" }}>
            <span style={{ display: "block", color: "#647286", fontSize: 13, fontWeight: 800, marginBottom: 8 }}>是否需要押金</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button
                onClick={() => updateCurrentPlanField("needDeposit", true)}
                style={{
                  border: currentPlan.needDeposit ? "1px solid #2f6fb3" : "1px solid #d8e1ec",
                  background: currentPlan.needDeposit ? "#eaf3ff" : "#fff",
                  color: currentPlan.needDeposit ? "#2f6fb3" : "#526274",
                  borderRadius: 8,
                  padding: "9px 0",
                  fontSize: 13,
                  fontWeight: 800
                }}
              >
                {currentPlan.needDeposit ? "✓ 需要押金" : "需要押金"}
              </button>
              <button
                onClick={() => updateCurrentPlanField("needDeposit", false)}
                style={{
                  border: !currentPlan.needDeposit ? "1px solid #2f6fb3" : "1px solid #d8e1ec",
                  background: !currentPlan.needDeposit ? "#eaf3ff" : "#fff",
                  color: !currentPlan.needDeposit ? "#2f6fb3" : "#526274",
                  borderRadius: 8,
                  padding: "9px 0",
                  fontSize: 13,
                  fontWeight: 800
                }}
              >
                {!currentPlan.needDeposit ? "✓ 信用免押" : "信用免押"}
              </button>
            </div>
          </div>

          {/* 5. 最终报价 */}
          <div>
            <span style={{ display: "block", color: "#647286", fontSize: 13, fontWeight: 800, marginBottom: 8 }}>实际销售报价 (元)</span>
            <label style={{ display: "flex", alignItems: "center", border: "1px solid #d8e1ec", borderRadius: 10, padding: "4px 12px", background: "#fcfdfe" }}>
              <span style={{ color: "#182536", fontSize: 16, fontWeight: 800, marginRight: 8 }}>¥</span>
              <input
                type="number"
                value={currentPlan.customFinalRent || ""}
                onChange={(e) => updateCurrentPlanField("customFinalRent", e.target.value)}
                placeholder={`默认按 ¥${money(currentStats.systemTotalRent)}`}
                style={{ flex: 1, border: 0, background: "transparent", padding: "12px 0", fontSize: 15, fontWeight: 800, color: "#d64545", outline: "none" }}
              />
            </label>
          </div>
        </section>
        )}

    
        <nav style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          background: "rgba(255,255,255,.98)",
          borderTop: "1px solid #e4eaf2",
          padding: "10px 12px calc(10px + env(safe-area-inset-bottom))",
          display: "grid",
          gridTemplateColumns: "auto 1fr 1fr", /* 分配3个按钮的比例 */
          gap: 10
        }}>
          {/* 1. 保留【更多】功能，做成灰色辅按钮 */}
          <button
            style={{ 
              border: "1px solid #d8e1ec", 
              borderRadius: 10, 
              background: "#f6f8fb", 
              color: "#526274", 
              fontWeight: 900, 
              padding: "13px 16px", 
              fontSize: 14 
            }}
            onClick={() => setShowMoreSheet(true)}
          >
            更多
          </button>

          {/* 2. 保留【客户链接】功能，做成蓝色线框按钮 */}
          <button
            style={{ 
              border: "1px solid #2f6fb3", 
              borderRadius: 10, 
              background: "#fff", 
              color: "#2f6fb3", 
              fontWeight: 900, 
              padding: "13px 10px", 
              fontSize: 15 
            }}
            onClick={() => copyCustomerPlanLink(currentOrder)}
          >
            客户链接
          </button>
          
          {/* 3. 保留【提交方案】功能，做成蓝色主按钮 */}
          <button
            style={{ 
              border: 0, 
              borderRadius: 10, 
              background: "#2f6fb3", 
              color: "#fff", 
              fontWeight: 900, 
              padding: "13px 10px", 
              fontSize: 15, 
              boxShadow: "0 8px 18px rgba(47,111,179,.22)" 
            }}
            onClick={() => setShowSubmitSheet(true)}
          >
            提交方案
          </button>
        </nav>
      

        {showAreaSheet && renderAreaSheet()}
        {showProductSheet && renderProductSheet()}
        {showPaymentSheet && renderPaymentSheet()}
        {showPriceSheet && renderPriceSheet()}
        {showMoreSheet && renderMoreSheet()}
        {showSubmitSheet && renderSubmitSheet()}
      </div>
    );
  }

  function renderAreaSheet() {
    return (
      <div className="sheet-mask" onClick={() => setShowAreaSheet(false)}>
        <section className="bottom-sheet" onClick={(event) => event.stopPropagation()}>
          <div className="sheet-handle" />
          <div className="sheet-header">
            <div><p className="eyebrow">Add Area</p><h2>新增区域</h2></div>
            <button className="close-button" onClick={() => setShowAreaSheet(false)}>×</button>
          </div>

          <div className="sheet-block">
            <p className="sheet-label">区域名称</p>
            <input className="area-input" value={areaName} onChange={(e) => setAreaName(e.target.value)} placeholder="例如：前台、办公室、会议室" />
          </div>

          <div className="quick-area-list">
            {["前台", "办公室", "会议室", "走廊", "门口"].map((name) => (
              <button key={name} onClick={() => addAreaWithName(name)}>{name}</button>
            ))}
          </div>

          <button className="submit-sheet-button" onClick={addArea}>保存区域</button>
        </section>
      </div>
    );
  }

  function renderProductSheet() {
    const videoBlue = "#2d5f8f";
    const sheetStyle = {
      height: "92vh",
      maxHeight: "92vh",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      background: "#fff",
      borderRadius: "18px 18px 0 0",
      paddingBottom: "env(safe-area-inset-bottom)",
    };
    const topStyle = {
      flexShrink: 0,
      background: "#fff",
      borderBottom: "1px solid #e7edf4",
      padding: "10px 14px 8px",
    };
    const searchWrapStyle = {
      background: videoBlue,
      borderRadius: 10,
      padding: 8,
      margin: "10px 0",
    };
    const productMainStyle = {
      flex: 1,
      minHeight: 0,
      display: "grid",
      gridTemplateColumns: "92px minmax(0, 1fr)",
      overflow: "hidden",
      background: "#f5f7fa",
    };
    const rowButtonStyle = {
      width: "100%",
      border: 0,
      borderBottom: "1px solid #e8edf3",
      background: "transparent",
      color: "#526274",
      fontWeight: 800,
      padding: "15px 8px",
      textAlign: "center",
      fontSize: 14,
    };

    return (
      <div className="sheet-mask" onClick={() => setShowProductSheet(false)}>
        <section style={sheetStyle} onClick={(event) => event.stopPropagation()}>
          <div style={{ width: 48, height: 5, borderRadius: 99, background: "#d8e1ea", margin: "10px auto 2px", flexShrink: 0 }} />
          <div style={topStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div>
                <p style={{ margin: 0, color: "#8a96a8", fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 900 }}>Item Selector</p>
                <h2 style={{ margin: "4px 0 0", color: "#182536", fontSize: 22 }}>{currentArea?.name || "当前场景"}物料选择</h2>
              </div>
              <button style={{ width: 38, height: 38, borderRadius: 10, border: 0, background: "#eef2f6", color: "#526274", fontSize: 24, fontWeight: 800 }} onClick={() => setShowProductSheet(false)}>×</button>
            </div>
            <div style={searchWrapStyle}>
              <input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="搜索物料名称 / 规格 / 场景" style={{ width: "100%", height: 42, border: 0, borderRadius: 8, background: "#fff", padding: "0 12px", fontSize: 15, outline: "none" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid #e7edf4" }}>
              {['植物', '花盆', '资材'].map((name) => (
                <button key={name} style={{ border: 0, background: "transparent", padding: "11px 0", color: name === '植物' ? videoBlue : "#526274", fontWeight: 900, borderBottom: name === '植物' ? `3px solid ${videoBlue}` : "3px solid transparent" }} onClick={() => name !== '植物' && alert(`${name}库已经预留，后续补充数据。`)}>{name}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingTop: 8 }}>
              {["全部商品", ...productCategories].map((category) => (
                <button key={category} style={{ flex: "0 0 auto", border: 0, borderRadius: 8, padding: "8px 12px", background: activeCategory === category ? videoBlue : "#eef2f6", color: activeCategory === category ? "#fff" : "#526274", fontWeight: 900 }} onClick={() => { setActiveCategory(category); setActiveSubCategory(category === "全部商品" ? "全部规格" : "大型植物"); }}>{category}</button>
              ))}
            </div>
          </div>

          <main style={productMainStyle}>
            <aside style={{ overflowY: "auto", background: "#fff", borderRight: "1px solid #e7edf4", paddingBottom: 86 }}>
              {["全部规格", ...subCategories].map((subCategory) => (
                <button key={subCategory} style={{ ...rowButtonStyle, background: activeSubCategory === subCategory ? "#eaf2fb" : "transparent", color: activeSubCategory === subCategory ? videoBlue : "#526274", borderLeft: activeSubCategory === subCategory ? `4px solid ${videoBlue}` : "4px solid transparent" }} onClick={() => setActiveSubCategory(subCategory)}>{subCategory}</button>
              ))}
            </aside>
            <section style={{ overflowY: "auto", minHeight: 0, padding: "10px 10px 96px" }}>
              {filteredProducts.length === 0 ? (
                <div style={{ background: "#fff", border: "1px solid #e4eaf2", borderRadius: 12, padding: 18, color: "#7b899a", textAlign: "center" }}><strong style={{ color: "#223247" }}>暂无物料</strong><br/>可以切到“全部商品”，或搜索刚新增的商品名称。</div>
              ) : filteredProducts.map((product) => {
                const selected = safeItems(currentArea).find((item) => item.productId === product.id);
                const selectedQuantity = selected ? Number(selected.quantity || 0) : 0;
                const image = getProductImage(product);
                return (
                  <article key={product.id} className={selectedQuantity > 0 ? "staff-product-picker-card selected" : "staff-product-picker-card"} onClick={() => setProductQuantityInCurrentArea(product, selectedQuantity + 1)}>
                    <span style={{ width: 54, height: 54, borderRadius: 8, background: "#f2f5f8", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", fontSize: 24 }}>{isImageUrl(image) ? <img src={image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : image}</span>
                    <span style={{ minWidth: 0 }}>
                      <strong style={{ display: "block", color: "#182536", fontSize: 15, marginBottom: 4 }}>{product.name}</strong>
                      <small style={{ display: "block", color: "#7b899a", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{product.description}</small>
                      <b style={{ display: "block", color: videoBlue, marginTop: 5 }}>{currentPlan?.planType === "零售方案" ? `¥ ${product.pricePerDay}/件` : `¥ ${product.pricePerDay}/天`}</b>
                    </span>
                    <div className="staff-product-stepper" onClick={(event) => event.stopPropagation()}>
                      <button
                        type="button"
                        className="staff-stepper-button"
                        disabled={selectedQuantity <= 0}
                        onClick={() => setProductQuantityInCurrentArea(product, selectedQuantity - 1)}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        value={selectedQuantity}
                        onChange={(event) => setProductQuantityInCurrentArea(product, event.target.value)}
                        onFocus={(event) => event.target.select()}
                        aria-label={`${product.name}数量`}
                      />
                      <button
                        type="button"
                        className="staff-stepper-button add"
                        onClick={() => setProductQuantityInCurrentArea(product, selectedQuantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>
          </main>

          <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 60, background: "rgba(255,255,255,.98)", borderTop: "1px solid #e4eaf2", padding: "10px 12px calc(10px + env(safe-area-inset-bottom))", display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
            <button style={{ border: 0, borderRadius: 10, background: videoBlue, color: "#fff", fontWeight: 900, padding: "13px 12px", fontSize: 16 }} onClick={() => setShowProductSheet(false)}>
              已选 {getAreaProductCount(currentArea)} 件｜{currentPlan?.planType === "零售方案" ? "商品金额" : "日租金"} ¥ {money(getAreaDailyRent(currentArea))}｜完成选品
            </button>
            <button style={{ border: "1px solid #f0c7c2", borderRadius: 10, background: "#fff7f6", color: "#b44a3e", fontWeight: 800, padding: "10px 12px" }} onClick={clearCurrentAreaItems}>清空当前场景物料</button>
          </div>
        </section>
      </div>
    );
  }

  function renderPaymentSheet() {
    const optionStyle = (selected) =>
      selected
        ? {
            background: "#2f6fae",
            color: "#fff",
            borderColor: "#2f6fae",
            fontWeight: 800,
            boxShadow: "0 10px 24px rgba(58, 117, 196, 0.22)",
          }
        : {};

    if (currentPlan?.planType === "养护服务") {
      return (
        <div className="sheet-mask" onClick={() => setShowPaymentSheet(false)}>
          <section className="bottom-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-header">
              <div><p className="eyebrow">Maintenance</p><h2>养护服务报价</h2></div>
              <button className="close-button" onClick={() => setShowPaymentSheet(false)}>×</button>
            </div>

            <div className="empty-card">
              <p>养护服务只展示套餐与最终报价。</p>
              <span>复杂报价因素仅作为商户内部备注，不展示给客户。</span>
            </div>

            <div className="rent-preview"><span>最终报价</span><strong>¥ {money(currentStats.finalRent)}</strong></div>
            <button className="submit-sheet-button" onClick={() => setShowPaymentSheet(false)}>保存养护报价</button>
          </section>
        </div>
      );
    }

    if (currentPlan?.planType === "零售方案") {
      return (
        <div className="sheet-mask" onClick={() => setShowPaymentSheet(false)}>
          <section className="bottom-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-header">
              <div><p className="eyebrow">Retail Plan</p><h2>零售方案报价</h2></div>
              <button className="close-button" onClick={() => setShowPaymentSheet(false)}>×</button>
            </div>

            <div className="empty-card">
              <p>零售方案不需要租期、支付周期和押金设置。</p>
              <span>当前按商品单价 × 数量统计，后续可以再接正式销售价目表。</span>
            </div>

            <div className="rent-preview"><span>商品金额</span><strong>¥ {money(currentStats.systemTotalRent)}</strong></div>
            <button className="submit-sheet-button" onClick={() => setShowPaymentSheet(false)}>保存零售报价</button>
          </section>
        </div>
      );
    }

    return (
      <div className="sheet-mask" onClick={() => setShowPaymentSheet(false)}>
        <section className="bottom-sheet" onClick={(event) => event.stopPropagation()}>
          <div className="sheet-handle" />
          <div className="sheet-header">
            <div><p className="eyebrow">Payment</p><h2>租期与支付</h2></div>
            <button className="close-button" onClick={() => setShowPaymentSheet(false)}>×</button>
          </div>

          <div className="empty-card">
            <p>当前选择：{currentPlan.leaseMonths || 12} 月｜{currentPlan.paymentMethod || "月付"}｜押金{currentPlan.needDeposit ? "需要" : "不需要"}</p>
            <span>点选后会立即保存，颜色变深的按钮就是当前生效选项。</span>
          </div>

          <div className="sheet-block">
            <p className="sheet-label">选择租期</p>
            <div className="option-grid">
              {[6, 12, 24, 36].map((m) => {
                const selected = Number(currentPlan.leaseMonths || 12) === m;
                return (
                  <button
                    key={m}
                    className={selected ? "selected" : ""}
                    style={optionStyle(selected)}
                    onClick={() => updateCurrentPlanField("leaseMonths", m)}
                  >
                    {selected ? `✓ ${m} 月` : `${m} 月`}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="sheet-block">
            <p className="sheet-label">支付方式</p>
            <div className="option-grid payment-grid">
              {["月付", "季付", "半年付", "年付"].map((method) => {
                const selected = currentPlan.paymentMethod === method;
                return (
                  <button
                    key={method}
                    className={selected ? "selected" : ""}
                    style={optionStyle(selected)}
                    onClick={() => updateCurrentPlanField("paymentMethod", method)}
                  >
                    {selected ? `✓ ${method}` : method}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="deposit-row">
            <div><strong>是否需要押金</strong><span>真实业务里可根据客户情况调整</span></div>
            <button
              className={currentPlan.needDeposit ? "switch-button active" : "switch-button"}
              style={optionStyle(Boolean(currentPlan.needDeposit))}
              onClick={() => updateCurrentPlanField("needDeposit", !currentPlan.needDeposit)}
            >
              {currentPlan.needDeposit ? "✓ 需要" : "不需要"}
            </button>
          </div>

          <div className="rent-preview"><span>预计总租金</span><strong>¥ {money(currentStats.systemTotalRent)}</strong></div>
          <button className="submit-sheet-button" onClick={() => setShowPaymentSheet(false)}>保存租期与支付</button>
        </section>
      </div>
    );
  }

  function renderPriceSheet() {
    const isMaintenancePlan = currentPlan?.planType === "养护服务";

    return (
      <div className="sheet-mask" onClick={() => setShowPriceSheet(false)}>
        <section className="bottom-sheet" onClick={(event) => event.stopPropagation()}>
          <div className="sheet-handle" />
          <div className="sheet-header">
            <div><p className="eyebrow">Adjust Price</p><h2>修改最终报价</h2></div>
            <button className="close-button" onClick={() => setShowPriceSheet(false)}>×</button>
          </div>

          <div className="sheet-block">
            <p className="sheet-label">{isMaintenancePlan ? "养护服务报价" : "系统预计总租金"}</p>
            <div className="price-preview-line"><span>{isMaintenancePlan ? "最终报价由商户手动填写" : "按当前商品和租期自动计算"}</span><strong>¥ {money(currentStats.finalRent)}</strong></div>
          </div>

          <div className="sheet-block">
            <p className="sheet-label">最终报价</p>
            <input
              className="price-input"
              type="number"
              value={isMaintenancePlan ? currentPlan.maintenanceFinalPrice || "" : currentPlan.customFinalRent || ""}
              onChange={(e) => updateCurrentPlanField(isMaintenancePlan ? "maintenanceFinalPrice" : "customFinalRent", e.target.value)}
              placeholder={isMaintenancePlan ? "请输入养护服务最终报价" : "不填则使用系统预计总租金"}
            />
          </div>

          <div className="quick-price-list">
            {[money(currentStats.systemTotalRent), 1980, 2880, 3880].map((price) => (
              <button key={price} onClick={() => updateCurrentPlanField(isMaintenancePlan ? "maintenanceFinalPrice" : "customFinalRent", String(price))}>¥ {price}</button>
            ))}
          </div>

          <button className="submit-sheet-button" onClick={() => setShowPriceSheet(false)}>保存最终报价</button>
        </section>
      </div>
    );
  }

  function renderMoreSheet() {
    return (
      <div className="sheet-mask" onClick={() => setShowMoreSheet(false)}>
        <section className="bottom-sheet" onClick={(event) => event.stopPropagation()}>
          <div className="sheet-handle" />
          <div className="sheet-header">
            <div><p className="eyebrow">More</p><h2>更多操作</h2></div>
            <button className="close-button" onClick={() => setShowMoreSheet(false)}>×</button>
          </div>

          <button className="submit-sheet-button" onClick={() => copyText(buildPlanText(currentOrder), "方案摘要已复制")}>复制方案摘要</button>
          <button className="submit-sheet-button" onClick={() => copyCustomerPlanLink(currentOrder)}>复制客户方案链接</button>
          <button className="submit-sheet-button" onClick={() => markPlanSentToCustomer(currentOrder.id)}>标记已转发客户</button>
          <button className="submit-sheet-button" onClick={() => openRouteNavigation(currentOrder.address)}>打开导航</button>
          <button className="submit-sheet-button" onClick={() => locateStaff(currentOrder.id)}>定位当前位置</button>
          <button className="submit-sheet-button" onClick={() => exportOrderData(currentOrder)}>导出当前订单数据</button>

          <button className="ghost-button danger" onClick={() => {
            updateOrderPlan(currentOrder.id, (plan) => ({ ...plan, areas: [] }), "全部区域已清空");
            setShowMoreSheet(false);
          }}>
            清空全部区域
          </button>
        </section>
      </div>
    );
  }

  function renderSubmitSheet() {
    return (
      <div className="sheet-mask" onClick={() => setShowSubmitSheet(false)}>
        <section className="bottom-sheet" onClick={(event) => event.stopPropagation()}>
          <div className="sheet-handle" />
          <div className="sheet-header">
            <div><p className="eyebrow">Submit Plan</p><h2>提交给商户确认</h2></div>
            <button className="close-button" onClick={() => setShowSubmitSheet(false)}>×</button>
          </div>

          <div className="sheet-block">
            <div className="empty-card">
              <p>提交后会留在“做方案”</p>
              <span>商户确认前显示为待商户确认；确认后会进入执行中。</span>
            </div>

            <div className="confirm-row"><span>项目 / 客户</span><strong>{currentOrder.customerName}</strong></div>
            <div className="confirm-row"><span>区域数量</span><strong>{currentStats.areaCount} 个</strong></div>
            <div className="confirm-row"><span>商品数量</span><strong>{currentStats.productCount} 件</strong></div>
            <div className="confirm-row"><span>最终报价</span><strong>¥ {money(currentStats.finalRent)}</strong></div>
          </div>

          {currentStats.productCount === 0 && (
            <div className="rent-preview"><span>提醒</span><strong>当前还没有添加商品，也可以先提交测试流程</strong></div>
          )}

          <button className="submit-sheet-button" onClick={submitPlan}>确认提交给商户</button>
        </section>
      </div>
    );
  }

  // ===================== 【起点】替换整个商户端渲染逻辑 =====================
  function renderMerchantPage() {
    const statusCounts = ORDER_STATUS.reduce((result, status) => {
      result[status] = orders.filter((order) => order.status === status).length;
      return result;
    }, {});

    const navItems = [
      { key: "工作台", Icon: GardenIcons.Dashboard },
      { key: "订单管理", Icon: GardenIcons.Orders },
      { key: "团队成员", Icon: GardenIcons.Team },
      { key: "执行监测", Icon: GardenIcons.Monitor },
      { key: "商品库", Icon: GardenIcons.Products },
      { key: "客户库", Icon: GardenIcons.Customers },
      { key: "设置", Icon: GardenIcons.Settings },
    ];
    const todoOrders = [...pendingMerchantConfirmOrders, ...pendingArchiveOrders];
    const displayOrders = merchantOrders;
    const activeStaffMembers = staffDirectory.filter((member) => member.organizationId === currentMerchantUser.organizationId);
    const editingStaffMember = activeStaffMembers.find((member) => member.id === editingStaffId) || null;
    
    const filteredMerchantProducts = merchantProducts.filter((product) => {
      const keyword = productSearchText.trim();
      const matchCategory = productCategoryFilter === "全部" || product.category === productCategoryFilter;
      const text = [product.name, product.category, product.subCategory, product.description, product.note, product.status].join(" ");
      return matchCategory && (!keyword || text.includes(keyword));
    });
    
    const activeReviewOrder = merchantViewingOrder || selectedOrderDetail;

    function MetricCard({ label, value, hint }) {
      return (
        <div className="metric-box">
          <h3>{label}</h3>
          <strong>{value}</strong>
          {hint && <span style={{ color: "#64748b", fontSize: 13, marginTop: 6, display: "block" }}>{hint}</span>}
        </div>
      );
    }

    // 独立抽出的审核台组件：左右分栏沉浸式
    function MerchantReviewPage({ order }) {
      const orderPlan = order.plan || null;
      const stats = getPlanStats(orderPlan);
      const isRetailPlan = orderPlan?.planType === "零售方案";
      const isMaintenancePlan = orderPlan?.planType === "养护服务";
      const isWaitingConfirm = order.status === "待商户确认";
      const isWaitingArchive = order.status === "待商户归档";

      return (
        <div className="admin-main">
          <div className="admin-topbar">
            <div>
              <p className="eyebrow">Review Desk · 智能审核台</p>
              <h1 style={{ fontSize: 24 }}>{order.customerName}</h1>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="ghost-button" onClick={() => backToMerchantHome()}>返回工作台</button>
              <button className="primary-button" onClick={refreshOrdersFromCloud}>刷新数据</button>
            </div>
          </div>

          <div className="admin-review-desk">
            {/* 左侧栏：客户与项目基础信息 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="admin-card" style={{ marginBottom: 0 }}>
                <h2 style={{ fontSize: 16, marginBottom: 16, borderBottom: "1px solid #e2e8f0", paddingBottom: 10 }}>项目档案</h2>
                <div className="plan-info-line"><span>状态</span><strong style={{ color: "#3b82f6" }}>{order.status}</strong></div>
                <div className="plan-info-line"><span>面积</span><strong>{order.areaSize}</strong></div>
                <div className="plan-info-line"><span>方案类型</span><strong>{orderPlan?.planType || order.planType || "-"}</strong></div>
                <div className="plan-info-line"><span>员工</span><strong>{order.assignedStaffName || "-"} {order.assignedStaffEmail ? `｜${order.assignedStaffEmail}` : ""}</strong></div>
                <div className="plan-info-line"><span>联系人</span><strong>{order.contactName || "-"} {order.phone ? `｜${order.phone}` : ""}</strong></div>
                <div className="plan-info-line"><span>地址</span><strong>{order.address}</strong></div>
                <div className="plan-info-line"><span>商户备注</span><strong>{order.merchantNote || orderPlan?.merchantDraftNote || "-"}</strong></div>
                <div className="plan-info-line"><span>员工备注</span><strong>{order.fieldNote || order.completeForm?.remark || "-"}</strong></div>
                <div className="sheet-block" style={{ marginTop: 14 }}>
                  <p className="sheet-label">需求类型</p>
                  <div className="option-grid payment-grid">
                    {["租赁", "零售", "养护"].map((serviceType) => (
                      <button
                        key={serviceType}
                        className={(order.serviceType || "租赁") === serviceType ? "selected" : ""}
                        onClick={() => {
                          const nextPlanType = serviceType === "养护" ? "养护服务" : serviceType === "零售" ? "零售方案" : "租赁方案";
                          updateOrder(order.id, {
                            serviceType,
                            planType: nextPlanType,
                            plan: order.plan ? { ...order.plan, planType: nextPlanType } : order.plan,
                          }, "订单需求类型已同步");
                        }}
                      >
                        {serviceType}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sheet-block">
                  <p className="sheet-label">需求标签</p>
                  <input
                    className="area-input"
                    value={Array.isArray(order.tags) ? order.tags.join(",") : ""}
                    onChange={(event) => updateOrder(order.id, { tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) }, "订单标签已同步")}
                    placeholder="例如：需比价,租过绿植,室外"
                  />
                </div>
                <div className="sheet-block" style={{ marginTop: 14 }}>
                  <p className="sheet-label">客户沟通群二维码</p>
                  {/* 正式版接 Supabase Storage / 腾讯云 COS / 阿里云 OSS 后，应将二维码远程 URL 写入 communicationQrUrl。 */}
                  <ImageUploader
                    value={order.communicationQrUrl || ""}
                    label="上传或替换二维码"
                    helper="员工任务卡会显示二维码入口。"
                    onChange={(nextImage) => updateOrder(order.id, { communicationQrUrl: nextImage }, "沟通群二维码已同步")}
                  />
                  <input
                    className="area-input"
                    value={order.communicationQrUrl || ""}
                    onChange={(event) => updateOrder(order.id, { communicationQrUrl: event.target.value }, "沟通群二维码已同步")}
                    placeholder="也可以粘贴二维码图片地址"
                    style={{ marginTop: 10 }}
                  />
                </div>
              </div>
              <ExtraDetails order={order} />
            </div>

            {/* 右侧栏：方案明细、报价与核心决策操作 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {(isWaitingConfirm || isWaitingArchive) && (
                <div className="admin-card" style={{ marginBottom: 0, border: "2px solid #bfdbfe", background: "#f8fafc" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong style={{ fontSize: 16, color: "#1e3a8a", display: "block", marginBottom: 4 }}>
                        {isWaitingConfirm ? "等待商户定价并确认方案" : "员工已完工，等待商户归档"}
                      </strong>
                      <span style={{ color: "#64748b", fontSize: 13 }}>
                        {isWaitingConfirm ? "请核对下方商品明细和总价，确认无误后点击右侧审核通过。" : "请核对现场施工照片，确认无误后归档。"}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      {isWaitingConfirm && <button className="ghost-button danger" onClick={() => merchantRequestRevision(order.id)}>打回修改</button>}
                      {isWaitingConfirm && <button className="primary-button" onClick={() => merchantConfirmPlan(order.id)}>✅ 确认方案并定价</button>}
                      {isWaitingArchive && <button className="primary-button" onClick={() => merchantArchiveOrder(order.id)}>✅ 确认完工并归档</button>}
                    </div>
                  </div>
                </div>
              )}

              <div className="admin-card" style={{ marginBottom: 0 }}>
                <h2 style={{ fontSize: 16, marginBottom: 16, borderBottom: "1px solid #e2e8f0", paddingBottom: 10 }}>{isMaintenancePlan ? "养护服务明细" : "方案物料明细"}</h2>
                {!orderPlan ? (
                  <div className="empty-card"><p>暂无方案内容</p><span>商户已创建派单，但还没有方案草稿或员工提交内容。</span></div>
                ) : isMaintenancePlan ? (
                  <div className="area-card" style={{ border: "1px solid #e2e8f0" }}>
                    <div style={{ background: "#f8fafc", padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>
                      <h3 style={{ margin: 0, fontSize: 15 }}>{order.plan?.maintenancePackage || "标准养护"}</h3>
                      <span style={{ fontSize: 12, color: "#64748b" }}>{order.plan?.maintenanceFrequency || "-"} ｜ {order.plan?.maintenanceCycle || "-"}</span>
                    </div>
                    <div style={{ padding: 16, color: "#475569", lineHeight: 1.7 }}>
                      <strong style={{ color: "#182536" }}>适合场景</strong>
                      <p style={{ margin: "6px 0 12px" }}>{order.plan?.maintenanceScene || "-"}</p>
                      <strong style={{ color: "#182536" }}>服务内容</strong>
                      <p style={{ margin: "6px 0 0" }}>{order.plan?.maintenanceContent || "-"}</p>
                    </div>
                  </div>
                ) : safeAreas(order.plan).length === 0 ? (
                  <div className="empty-card"><p>暂无区域</p><span>员工尚未添加任何植物。</span></div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {safeAreas(order.plan).map((area) => (
                      <div className="area-card" key={area.id} style={{ border: "1px solid #e2e8f0" }}>
                        <div style={{ background: "#f8fafc", padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>
                          <h3 style={{ margin: 0, fontSize: 15 }}>{area.name}</h3>
                          <span style={{ fontSize: 12, color: "#64748b" }}>共 {getAreaProductCount(area)} 件 ｜ 区域预估: ¥{money(getAreaDailyRent(area))}{isRetailPlan ? "" : "/天"}</span>
                        </div>
                        <div style={{ padding: "8px 16px" }}>
                          {safeItems(area).map((item) => (
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px dashed #e2e8f0" }} key={item.productId}>
                              <strong style={{ fontSize: 13 }}>{item.name}</strong>
                              <span style={{ fontSize: 13, color: "#64748b" }}>¥{item.pricePerDay}{isRetailPlan ? "/件" : "/天"} × {item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="admin-card" style={{ marginBottom: 0 }}>
                <h2 style={{ fontSize: 16, marginBottom: 16, borderBottom: "1px solid #e2e8f0", paddingBottom: 10 }}>现场记录</h2>
                {order.completePhotos ? (
                  <>
                    <div className="merchant-photo-grid">
                      {[...(order.completePhotos.scenePhotos || []), ...(order.completePhotos.plantPhotos || [])]
                        .filter(Boolean)
                        .slice(0, 6)
                        .map((photo, index) => (
                          <img key={`${photo}-${index}`} src={photo} alt={`现场图片 ${index + 1}`} />
                        ))}
                    </div>
                    <div className="plan-info-line"><span>员工备注</span><strong>{order.completePhotos.remark || "-"}</strong></div>
                  </>
                ) : (
                  <div className="empty-card"><p>暂无现场图片</p><span>员工完工上报后，这里会显示现场照片和备注。</span></div>
                )}
              </div>

              <div className="admin-card" style={{ marginBottom: 0 }}>
                <h2 style={{ fontSize: 16, marginBottom: 16, borderBottom: "1px solid #e2e8f0", paddingBottom: 10 }}>财务与租约</h2>
                 <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                    <div className="metric-box" style={{ borderLeft: "none", padding: 16 }}>
                       <h3>{isMaintenancePlan ? "养护套餐" : isRetailPlan ? "系统建议总价" : "系统预估总租金"}</h3>
                      <strong style={{ fontSize: isMaintenancePlan ? 18 : 24 }}>{isMaintenancePlan ? orderPlan?.maintenancePackage || "标准养护" : `¥ ${money(stats.systemTotalRent)}`}</strong>
                    </div>
                   <div className="metric-box" style={{ borderLeft: "none", padding: 16, background: "#f0fdf4" }}>
                     <h3>最终销售报价</h3>
                     <strong style={{ fontSize: 24, color: "#166534" }}>¥ {money(stats.finalRent)}</strong>
                     </div>
                     <div className="metric-box" style={{ borderLeft: "none", padding: 16 }}>
                      <h3>{isMaintenancePlan ? "方案类型" : isRetailPlan ? "方案类型" : "租期及支付"}</h3>
                      <strong style={{ fontSize: 16, marginTop: 8 }}>{isMaintenancePlan ? "养护服务" : isRetailPlan ? "零售方案" : `${orderPlan?.leaseMonths || 12}个月 ｜ ${orderPlan?.paymentMethod || "月付"}`}</strong>
                    </div>
                 </div>
                 {isMaintenancePlan && (
                  <div className="maintenance-merchant-editor">
                    <div className="sheet-block">
                      <p className="sheet-label">养护服务最终报价</p>
                      <input
                        className="area-input"
                        type="number"
                        value={orderPlan?.maintenanceFinalPrice || ""}
                        onChange={(event) => updateOrderPlan(order.id, (plan) => ({ ...plan, maintenanceFinalPrice: event.target.value }), "养护报价已同步")}
                        placeholder="由商户手动填写"
                      />
                    </div>
                    <div className="sheet-block">
                      <p className="sheet-label">内部报价备注</p>
                      <textarea
                        className="area-input maintenance-textarea"
                        value={orderPlan?.maintenanceInternalNote || ""}
                        onChange={(event) => updateOrderPlan(order.id, (plan) => ({ ...plan, maintenanceInternalNote: event.target.value }), "内部报价备注已同步")}
                        placeholder="仅商户内部可见，例如：上门距离、特殊植物、服务耗时等报价依据。"
                      />
                    </div>
                  </div>
                 )}
               </div>

            </div>
          </div>
        </div>
      );
    }

    if (activeReviewOrder) {
      return (
        <div className="admin-layout">
          <aside className="admin-sidebar">
             <div className="brand">
                <p className="eyebrow">Han Pilates & Green</p>
                <h2 style={{ margin: 0 }}>绿植租赁中枢</h2>
             </div>
          </aside>
          <MerchantReviewPage order={activeReviewOrder} />
        </div>
      );
    }

    return (
      <div className="admin-layout">
        {/* 高级深色侧边栏 */}
        <aside className="admin-sidebar">
          <div className="brand">
            <p className="eyebrow" style={{ color: "#64748b" }}>SaaS Admin · V4.0</p>
            <h2 style={{ margin: "4px 0 0", color: "#f8fafc", fontSize: 20 }}>绿植租赁中枢</h2>
            <span style={{ color: "#3b82f6", fontSize: 12, fontWeight: 800 }}>总控商户端</span>
          </div>

          {navItems.map((item) => {
            const Icon = item.Icon;
            return (
              <button
                key={item.key}
                className={`admin-nav-btn ${merchantTab === item.key ? "active" : ""}`}
                onClick={() => setMerchantTab(item.key)}
              >
                <Icon size={19} />
                <span>{item.key}</span>
              </button>
            );
          })}

          <div style={{ marginTop: "auto", borderTop: "1px solid #1e293b", paddingTop: 16 }}>
            <button className="admin-nav-btn" style={{ width: "100%", textAlign: "center", border: "1px solid #334155" }} onClick={() => switchRole("staff")}>
              <GardenIcons.StaffUser size={18} />
              <span>切换至员工视角</span>
            </button>
          </div>
        </aside>

        {/* 宽阔的浅色主工作区 */}
        <main className="admin-main">
          <header className="admin-topbar">
            <div>
              <p className="eyebrow" style={{ color: "#64748b" }}>Dashboard Overview</p>
              <h1 style={{ fontSize: 24, color: "#0f172a" }}>{merchantTab}</h1>
              <span style={{ color: "#64748b", fontSize: 13, display: "block", marginTop: 4 }}>
                <b style={{ color: "#10b981" }}>●</b> 实时通道运行中 ｜ {autoSyncState}
              </span>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <span className="admin-auth-chip">{authUserEmail}</span>
              <button className="ghost-button" onClick={refreshOrdersFromCloud}><GardenIcons.Cloud size={16} /><span>云端刷新</span></button>
              <button className="ghost-button" onClick={handleSignOut}><GardenIcons.Close size={16} /><span>退出登录</span></button>
              <button className="merchant-create-button" onClick={() => setShowCreateOrderSheet(true)}><GardenIcons.Create size={17} /><span>创建新派单</span></button>
            </div>
          </header>

          {merchantTab === "工作台" && (
            <>
              <div className="admin-metric-grid">
                <MetricCard label="云端总池" value={`${orders.length}`} hint="笔订单" />
                <MetricCard label="等待接单" value={`${statusCounts["待接单"] || 0}`} hint="需催促员工" />
                <MetricCard label="方案待审" value={`${statusCounts["待商户确认"] || 0}`} hint="需老板定价" />
                <MetricCard label="现场施工" value={`${statusCounts["执行中"] || 0}`} hint="正在服务中" />
                <MetricCard label="完工待验" value={`${statusCounts["待商户归档"] || 0}`} hint="需老板确认归档" />
              </div>

              <div className="admin-card">
                <h2 className="merchant-card-title"><GardenIcons.Todo size={18} />待办审核 <span>Todo</span></h2>
                {todoOrders.length === 0 ? (
                  <div className="empty-card" style={{ background: "#f8fafc", border: "none" }}><p>当前无紧急待办</p><span>喝杯咖啡休息一下，所有员工任务进展顺利。</span></div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {todoOrders.slice(0, 4).map((order) => (
                      <div className="area-card" key={order.id} style={{ border: "1px solid #e2e8f0", padding: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                          <h3 style={{ fontSize: 16, margin: 0 }}>{order.customerName}</h3>
                          <span style={{ background: "#ef4444", color: "#fff", padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 800 }}>{order.status}</span>
                        </div>
                        <p style={{ color: "#64748b", fontSize: 13, marginBottom: 12 }}>联系人: {order.contactName} ｜ 地址: {order.address}</p>
                        <button className="primary-button" style={{ width: "100%" }} onClick={() => openMerchantPlanWorkbench(order)}>
                          {order.status === "待商户确认" ? "立即审核员工方案与定价" : "查看现场施工照片并归档"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* 右下角智能浮窗：解决视频里的痛点，只要有待办，不管你在哪个页面都会强提醒 */}
          {todoOrders.length > 0 && merchantTab !== "工作台" && (
            <div className="admin-toast-fixed">
              <div>
                <strong style={{ color: "#0f172a", display: "block", fontSize: 16, marginBottom: 4 }}>待办流程提醒</strong>
                <span style={{ color: "#64748b", fontSize: 13 }}>您有 <b>{todoOrders.length}</b> 个员工提交的任务需要您的确认。</span>
              </div>
              <button 
                style={{ background: "#ef4444", color: "#fff", border: 0, padding: "10px 20px", borderRadius: 8, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)" }} 
                onClick={() => setMerchantTab("工作台")}
              >
                立即处理
              </button>
            </div>
          )}

                    {/* v4.0：恢复商户端真实管理页 */}
          {merchantTab === "订单管理" && (
            <div className="admin-card admin-data-panel">
              <div className="admin-section-head">
                <div>
                  <h2>订单管理</h2>
                  <p>查看全部订单、筛选状态、进入方案审核或归档。</p>
                </div>
                <button className="primary-button" onClick={() => setShowCreateOrderSheet(true)}>
                  <GardenIcons.Create size={16} />
                  <span>创建新派单</span>
                </button>
              </div>

              <div className="admin-filter-row">
                <div className="admin-filter-field"><GardenIcons.Search size={16} />
                <input
                  value={merchantSearchText}
                  onChange={(e) => setMerchantSearchText(e.target.value)}
                  placeholder="搜索客户、联系人、电话、地址、标签"
                />
                </div>
                <div className="admin-filter-field"><GardenIcons.Filter size={16} />
                <select
                  value={merchantStatusFilter}
                  onChange={(e) => setMerchantStatusFilter(e.target.value)}
                >
                  {MERCHANT_STATUS_TABS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                </div>
              </div>

              {displayOrders.length === 0 ? (
                <div className="empty-card">
                  <p>暂无匹配订单</p>
                  <span>可以切换状态筛选，或创建一条新派单。</span>
                </div>
              ) : (
                <div className="admin-table order-admin-table">
                  <div className="admin-table-row admin-table-head">
                    <span>客户 / 项目</span>
                    <span>联系人</span>
                    <span>状态</span>
                    <span>面积</span>
                    <span>负责员工</span>
                    <span>操作</span>
                  </div>

                  {displayOrders.map((order) => (
                    <div className="admin-table-row" key={order.id}>
                      <span>
                        <strong>{order.customerName}</strong>
                        <em>{order.address || "暂无地址"}</em>
                      </span>
                      <span>
                        <strong>{order.contactName || "-"}</strong>
                        <em>{order.phone || "暂无电话"}</em>
                      </span>
                      <span>
                        <b className={`admin-status-chip ${getMerchantStatusClass(order.status)}`}>{order.status}</b>
                      </span>
                      <span>{order.areaSize || "-"}</span>
                      <span>
                        <select
                          className="admin-inline-select"
                          value={order.assignedStaffId || DEFAULT_STAFF_ID}
                          onChange={(event) => assignOrderToStaff(order.id, event.target.value)}
                        >
                          {activeStaffMembers.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name} · {member.staffNo}
                            </option>
                          ))}
                        </select>
                        <em>{order.assignedStaffEmail || "未绑定邮箱"}</em>
                      </span>
                      <span className="admin-table-actions">
                        <button
                          className="ghost-button"
                          onClick={() => {
                            if (order.plan) {
                              openMerchantPlanWorkbench(order);
                              return;
                            }
                            setSelectedOrderDetail(order);
                            setMerchantViewingOrder(null);
                          }}
                        >
                          <GardenIcons.Search size={14} />
                          <span>查看</span>
                        </button>
                        <button className="ghost-button" onClick={() => exportOrderData(order)}>
                          <GardenIcons.Archive size={14} />
                          <span>导出</span>
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {merchantTab === "团队成员" && (
            <div className="admin-card admin-data-panel">
              <div className="admin-section-head">
                <div>
                  <h2>团队成员</h2>
                  <p>本地模拟组织账号、员工角色与派单关系；不保存或展示任何密码。</p>
                </div>
              </div>

              <div className="admin-setting-grid team-summary-grid">
                <div>
                  <strong>组织</strong>
                  <span>{organizations[0].name}</span>
                </div>
                <div>
                  <strong>当前商户账号</strong>
                  <span>{currentMerchantUser.name} · {ROLE_LABELS[currentMerchantUser.role]}</span>
                </div>
                <div>
                  <strong>员工数量</strong>
                  <span>{activeStaffMembers.length} 人</span>
                </div>
                <div>
                  <strong>登录方式</strong>
                  <span>邮箱 + 密码（后续接入）</span>
                </div>
              </div>

              <div className="admin-table team-admin-table" style={{ marginTop: 16 }}>
                <div className="admin-table-row admin-table-head">
                  <span>员工</span>
                  <span>邮箱 / 手机号</span>
                  <span>角色</span>
                  <span>状态</span>
                  <span>当前任务</span>
                  <span>操作</span>
                </div>

                {activeStaffMembers.map((member) => {
                  const assignedOrders = orders.filter((order) => order.assignedStaffId === member.id);
                  const activeCount = assignedOrders.filter((order) => order.status !== "已完成").length;

                  return (
                    <details className="staff-member-detail" key={member.id}>
                      <summary className="admin-table-row">
                        <span>
                          <strong>{member.name}</strong>
                          <em>{member.staffNo} · {member.area}</em>
                        </span>
                        <span>
                          <strong>{member.email}</strong>
                          <em>{member.phone}</em>
                        </span>
                        <span>{ROLE_LABELS[member.role] || member.role}</span>
                        <span>
                          <b className="admin-status-chip muted">{ACCOUNT_STATUS_LABELS[member.status] || member.status}</b>
                        </span>
                        <span>{activeCount} / {assignedOrders.length} 笔</span>
                        <span>
                          <button className="ghost-button team-manage-button" onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setEditingStaffId(member.id);
                          }}>管理</button>
                        </span>
                      </summary>

                      <div className="staff-member-panel">
                        <div className="admin-setting-grid">
                          <div><strong>姓名</strong><span>{member.name}</span></div>
                          <div><strong>工号</strong><span>{member.staffNo}</span></div>
                          <div><strong>邮箱</strong><span>{member.email}</span></div>
                          <div><strong>手机号</strong><span>{member.phone}</span></div>
                          <div><strong>角色</strong><span>{ROLE_LABELS[member.role] || member.role}</span></div>
                          <div><strong>负责区域</strong><span>{member.area}</span></div>
                        </div>

                        <div className="staff-assigned-orders">
                          <strong>已分配订单</strong>
                          {assignedOrders.length === 0 ? (
                            <p>暂无分配订单</p>
                          ) : (
                            assignedOrders.map((order) => (
                              <button
                                key={order.id}
                                className="staff-assigned-order"
                                onClick={() => {
                                  if (order.plan) {
                                    openMerchantPlanWorkbench(order);
                                    return;
                                  }
                                  setSelectedOrderDetail(order);
                                  setMerchantViewingOrder(null);
                                }}
                              >
                                <span>{order.customerName}</span>
                                <em>{order.status} · {order.address || "暂无地址"}</em>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </details>
                  );
                })}
              </div>
            </div>
          )}

          {merchantTab === "商品库" && (
            <div className="admin-card admin-data-panel">
              <div className="admin-section-head">
                <div>
                  <h2>商品库</h2>
                  <p>维护绿植商品、价格、分类、图片和上下架状态。</p>
                </div>
                <button
                  className="primary-button"
                  onClick={() => {
                    resetNewProductForm();
                    setShowCreateProductSheet(true);
                  }}
                >
                  + 新增商品
                </button>
              </div>

              <div className="admin-filter-row">
                <input
                  value={productSearchText}
                  onChange={(e) => setProductSearchText(e.target.value)}
                  placeholder="搜索商品名称、分类、描述、备注"
                />
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                >
                  <option value="全部">全部分类</option>
                  {productCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {filteredMerchantProducts.length === 0 ? (
                <div className="empty-card">
                  <p>暂无商品</p>
                  <span>可以新增商品，员工端选品时会读取这里的数据。</span>
                </div>
              ) : (
                <div className="admin-table product-admin-table">
                  <div className="admin-table-row admin-table-head">
                    <span>商品</span>
                    <span>分类</span>
                    <span>日租金</span>
                    <span>库存</span>
                    <span>状态</span>
                    <span>操作</span>
                  </div>

                  {filteredMerchantProducts.map((product) => (
                    <div className="admin-table-row" key={product.id}>
                      <span className="admin-product-cell">
                        <i>
                          {isImageUrl(getProductImage(product)) ? (
                            <img src={getProductImage(product)} alt={product.name} />
                          ) : (
                            getProductImage(product)
                          )}
                        </i>
                        <span>
                          <strong>{product.name}</strong>
                          <em>{product.description || "暂无描述"}</em>
                        </span>
                      </span>
                      <span>
                        <strong>{product.category || "-"}</strong>
                        <em>{product.subCategory || "-"}</em>
                      </span>
                      <span>¥ {money(product.pricePerDay)} / 天</span>
                      <span>{product.stock || "充足"}</span>
                      <span>
                        <b className={product.status === "已上架" ? "admin-status-chip" : "admin-status-chip muted"}>
                          {product.status || "已上架"}
                        </b>
                      </span>
                      <span className="admin-table-actions">
                        <button className="ghost-button" onClick={() => openEditProduct(product)}>
                          编辑
                        </button>
                        <button className="ghost-button" onClick={() => toggleProductStatus(product.id)}>
                          {product.status === "已上架" ? "下架" : "上架"}
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {merchantTab === "客户库" && (
            <div className="admin-card admin-data-panel">
              <div className="admin-section-head">
                <div>
                  <h2>客户库</h2>
                  <p>沉淀历史客户资料，可快速创建新派单。</p>
                </div>
                <button
                  className="primary-button"
                  onClick={() => {
                    resetNewCustomerForm();
                    setShowCreateCustomerSheet(true);
                  }}
                >
                  + 新增客户
                </button>
              </div>

              <div className="admin-filter-row">
                <input
                  value={customerSearchText}
                  onChange={(e) => setCustomerSearchText(e.target.value)}
                  placeholder="搜索客户、联系人、电话、地址、备注"
                />
              </div>

              {filteredCustomers.length === 0 ? (
                <div className="empty-card">
                  <p>暂无客户</p>
                  <span>创建派单后也会自动沉淀客户资料。</span>
                </div>
              ) : (
                <div className="admin-table customer-admin-table">
                  <div className="admin-table-row admin-table-head">
                    <span>客户名称</span>
                    <span>联系人</span>
                    <span>地址</span>
                    <span>面积</span>
                    <span>标签</span>
                    <span>操作</span>
                  </div>

                  {filteredCustomers.map((customer) => (
                    <div className="admin-table-row" key={customer.id}>
                      <span>
                        <strong>{customer.name}</strong>
                        <em>{customer.note || "暂无备注"}</em>
                      </span>
                      <span>
                        <strong>{customer.contactName || "-"}</strong>
                        <em>{customer.phone || "暂无电话"}</em>
                      </span>
                      <span>{customer.address || "-"}</span>
                      <span>{customer.areaSize || "-"}</span>
                      <span>{customer.tagsText || "-"}</span>
                      <span className="admin-table-actions">
                        <button className="ghost-button" onClick={() => openEditCustomer(customer)}>
                          编辑
                        </button>
                        <button className="primary-button" onClick={() => fillOrderFromCustomer(customer)}>
                          派单
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {merchantTab === "执行监测" && (
            <div className="admin-card admin-data-panel">
              <div className="admin-section-head">
                <div>
                  <h2>执行监测</h2>
                  <p>查看已确认方案、执行中、待归档订单。</p>
                </div>
              </div>

              {monitoredOrders.length === 0 ? (
                <div className="empty-card">
                  <p>暂无执行中订单</p>
                  <span>商户确认方案后，订单会进入这里。</span>
                </div>
              ) : (
                <div className="admin-table">
                  <div className="admin-table-row admin-table-head">
                    <span>客户 / 项目</span>
                    <span>订单状态</span>
                    <span>执行状态</span>
                    <span>配送状态</span>
                    <span>地址</span>
                    <span>操作</span>
                  </div>

                  {monitoredOrders.map((order) => (
                    <div className="admin-table-row" key={order.id}>
                      <span>
                        <strong>{order.customerName}</strong>
                        <em>{order.contactName || "-"}</em>
                      </span>
                      <span><b className={`admin-status-chip ${getMerchantStatusClass(order.status)}`}>{order.status}</b></span>
                      <span>{order.executionStatus || "-"}</span>
                      <span>{order.deliveryStatus || "-"}</span>
                      <span>{order.address || "-"}</span>
                      <span className="admin-table-actions">
                        <button className="ghost-button" onClick={() => openMerchantPlanWorkbench(order)}>
                          查看执行
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {merchantTab === "设置" && (
            <div className="admin-card admin-data-panel">
              <div className="admin-section-head">
                <div>
                  <h2>系统设置</h2>
                  <p>当前版本先保留同步状态与数据维护入口。</p>
                </div>
              </div>

              <div className="admin-setting-grid">
                <div>
                  <strong>云端连接</strong>
                  <span>{syncState}</span>
                </div>
                <div>
                  <strong>自动同步</strong>
                  <span>{autoSyncState}</span>
                </div>
                <div>
                  <strong>订单数量</strong>
                  <span>{orders.length} 笔</span>
                </div>
                <div>
                  <strong>商品数量</strong>
                  <span>{merchantProducts.length} 个</span>
                </div>
              </div>
            </div>
          )}

          {editingStaffMember && (
            <div className="sheet-mask merchant-staff-editor-mask" onClick={() => setEditingStaffId(null)}>
              <section className="merchant-staff-editor" onClick={(event) => event.stopPropagation()}>
                <div className="section-title-row">
                  <div>
                    <p className="eyebrow">Team Member</p>
                    <h2>管理员工账号</h2>
                  </div>
                  <button className="close-button" onClick={() => setEditingStaffId(null)}>×</button>
                </div>

                <div className="admin-setting-grid">
                  <div><strong>姓名</strong><span>{editingStaffMember.name}</span></div>
                  <div><strong>工号</strong><span>{editingStaffMember.staffNo}</span></div>
                  <div><strong>邮箱</strong><span>{editingStaffMember.email}</span></div>
                  <div><strong>手机号</strong><span>{editingStaffMember.phone}</span></div>
                  <div><strong>负责区域</strong><span>{editingStaffMember.area}</span></div>
                  <div><strong>当前任务数</strong><span>{orders.filter((order) => order.assignedStaffId === editingStaffMember.id && order.status !== "已完成").length} 笔</span></div>
                </div>

                <div className="merchant-staff-edit-grid">
                  <div className="sheet-block">
                    <p className="sheet-label">角色</p>
                    <select
                      className="area-input"
                      value={editingStaffMember.role}
                      onChange={(event) => {
                        const nextRole = event.target.value;
                        setStaffDirectory((members) => members.map((member) => member.id === editingStaffMember.id ? { ...member, role: nextRole } : member));
                      }}
                    >
                      <option value="staff">普通员工</option>
                      <option value="manager">主管 / 经理</option>
                      <option value="admin">管理员</option>
                    </select>
                  </div>

                  <div className="sheet-block">
                    <p className="sheet-label">状态</p>
                    <select
                      className="area-input"
                      value={editingStaffMember.status}
                      onChange={(event) => {
                        const nextStatus = event.target.value;
                        setStaffDirectory((members) => members.map((member) => member.id === editingStaffMember.id ? { ...member, status: nextStatus } : member));
                      }}
                    >
                      <option value="active">启用账号</option>
                      <option value="paused">停用账号</option>
                    </select>
                  </div>
                </div>

                <div className="staff-assigned-orders">
                  <strong>已分配订单</strong>
                  {orders.filter((order) => order.assignedStaffId === editingStaffMember.id).length === 0 ? (
                    <p>暂无分配订单</p>
                  ) : (
                    orders.filter((order) => order.assignedStaffId === editingStaffMember.id).map((order) => (
                      <button key={order.id} className="staff-assigned-order" onClick={() => openMerchantPlanWorkbench(order)}>
                        <span>{order.customerName}</span>
                        <em>{order.status} · {order.address || "暂无地址"}</em>
                      </button>
                    ))
                  )}
                </div>

                <div className="empty-card">
                  <p>本地开发阶段模拟编辑</p>
                  <span>正式版需要写入 profiles / staff_members 表，并配合权限控制；这里不展示也不保存密码。</span>
                </div>
              </section>
            </div>
          )}

          {showCreateOrderSheet && renderCreateOrderSheet()}
        </main>
      </div>
    );
  }
  // ===================== 【终点】替换到此处为止 =====================

  function renderCreateCustomerSheet() {
    const overlayStyle = {
      position: "fixed",
      inset: 0,
      background: "rgba(15, 39, 26, 0.36)",
      zIndex: 80,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    };

    const panelStyle = {
      width: "min(820px, calc(100vw - 48px))",
      maxHeight: "88vh",
      overflowY: "auto",
      background: "rgba(255,255,255,0.98)",
      borderRadius: 28,
      padding: 24,
      boxShadow: "0 28px 80px rgba(20, 54, 34, 0.22)",
    };

    return (
      <div style={overlayStyle} onClick={() => { setShowCreateCustomerSheet(false); resetNewCustomerForm(); }}>
        <section style={panelStyle} onClick={(event) => event.stopPropagation()}>
          <div className="section-title-row">
            <div><p className="eyebrow">Customer Editor · v3.8</p><h2>{editingCustomerId ? "编辑客户" : "新增客户"}</h2></div>
            <button className="close-button" onClick={() => { setShowCreateCustomerSheet(false); resetNewCustomerForm(); }}>×</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <section className="plan-summary-card" style={{ margin: 0 }}>
              <div className="sheet-block"><p className="sheet-label">客户 / 项目名称</p><input className="area-input" value={newCustomerForm.name} onChange={(e) => setNewCustomerForm((form) => ({ ...form, name: e.target.value }))} placeholder="例如：南通万达 A3 写字楼" /></div>
              <div className="sheet-block"><p className="sheet-label">联系人</p><input className="area-input" value={newCustomerForm.contactName} onChange={(e) => setNewCustomerForm((form) => ({ ...form, contactName: e.target.value }))} placeholder="例如：王经理" /></div>
              <div className="sheet-block"><p className="sheet-label">联系电话</p><input className="area-input" value={newCustomerForm.phone} onChange={(e) => setNewCustomerForm((form) => ({ ...form, phone: e.target.value }))} placeholder="例如：13800001111" /></div>
            </section>

            <section className="plan-summary-card" style={{ margin: 0 }}>
              <div className="sheet-block"><p className="sheet-label">客户地址</p><input className="area-input" value={newCustomerForm.address} onChange={(e) => setNewCustomerForm((form) => ({ ...form, address: e.target.value }))} placeholder="例如：港闸区万达 A3" /></div>
              <div className="sheet-block"><p className="sheet-label">项目面积</p><input className="area-input" value={newCustomerForm.areaSize} onChange={(e) => setNewCustomerForm((form) => ({ ...form, areaSize: e.target.value }))} placeholder="例如：300㎡" /></div>
              <div className="sheet-block"><p className="sheet-label">默认标签</p><input className="area-input" value={newCustomerForm.tagsText} onChange={(e) => setNewCustomerForm((form) => ({ ...form, tagsText: e.target.value }))} placeholder="办公室,长期租赁" /></div>
            </section>
          </div>

          <section className="plan-summary-card" style={{ marginTop: 16 }}>
            <div className="sheet-block"><p className="sheet-label">客户备注</p><input className="area-input" value={newCustomerForm.note} onChange={(e) => setNewCustomerForm((form) => ({ ...form, note: e.target.value }))} placeholder="例如：老板喜欢大气一点的植物，报价可走年付" /></div>
          </section>

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 16 }}>
            <button className="ghost-button" onClick={() => { setShowCreateCustomerSheet(false); resetNewCustomerForm(); }}>取消</button>
            <button className="submit-plan-button" onClick={saveCustomer}>{editingCustomerId ? "保存修改" : "保存客户"}</button>
          </div>
        </section>
      </div>
    );
  }

  function renderCreateProductSheet() {
    const overlayStyle = {
      position: "fixed",
      inset: 0,
      background: "rgba(15, 39, 26, 0.36)",
      zIndex: 80,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    };

    const panelStyle = {
      width: "min(920px, calc(100vw - 48px))",
      maxHeight: "88vh",
      overflowY: "auto",
      background: "rgba(255,255,255,0.98)",
      borderRadius: 28,
      padding: 24,
      boxShadow: "0 28px 80px rgba(20, 54, 34, 0.22)",
    };

    const gridStyle = {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 16,
    };

    const preview = getProductImage(newProductForm);

    return (
      <div style={overlayStyle} onClick={() => setShowCreateProductSheet(false)}>
        <section style={panelStyle} onClick={(event) => event.stopPropagation()}>
          <div className="section-title-row">
            <div><p className="eyebrow">Product Editor · v3.8</p><h2>{editingProductId ? "编辑商品" : "新增商品"}</h2></div>
            <button className="close-button" onClick={() => { setShowCreateProductSheet(false); resetNewProductForm(); }}>×</button>
          </div>

          <div style={gridStyle}>
            <section className="plan-summary-card" style={{ margin: 0 }}>
              <div className="sheet-block">
                <p className="sheet-label">商品名称</p>
                <input className="area-input" value={newProductForm.name} onChange={(e) => setNewProductForm((form) => ({ ...form, name: e.target.value }))} placeholder="例如：天堂鸟 / 发财树 / 前台组合" />
              </div>

              <div className="sheet-block">
                <p className="sheet-label">分类</p>
                <select className="area-input" value={newProductForm.category} onChange={(e) => setNewProductForm((form) => ({ ...form, category: e.target.value }))}>
                  {productCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </div>

              <div className="sheet-block">
                <p className="sheet-label">子分类</p>
                <select className="area-input" value={newProductForm.subCategory} onChange={(e) => setNewProductForm((form) => ({ ...form, subCategory: e.target.value }))}>
                  {subCategories.map((subCategory) => <option key={subCategory} value={subCategory}>{subCategory}</option>)}
                </select>
              </div>

              <div className="sheet-block">
                <p className="sheet-label">日租金</p>
                <input className="area-input" type="number" value={newProductForm.pricePerDay} onChange={(e) => setNewProductForm((form) => ({ ...form, pricePerDay: e.target.value }))} placeholder="例如：3.2" />
              </div>
            </section>

            <section className="plan-summary-card" style={{ margin: 0 }}>
              <div className="sheet-block">
                <p className="sheet-label">商品照片</p>
                <ImageUploader
                  value={newProductForm.imageUrl}
                  label="上传商品照片"
                  helper="选择后立即预览；当前先保存为本地图片数据。"
                  onChange={(nextImage) => setNewProductForm((form) => ({ ...form, imageUrl: nextImage }))}
                />
              </div>

              <div className="sheet-block">
                <p className="sheet-label">没有图片时的占位符</p>
                <input className="area-input" value={newProductForm.image} onChange={(e) => setNewProductForm((form) => ({ ...form, image: e.target.value }))} placeholder="例如：🪴" />
              </div>

              <div className="sheet-block">
                <p className="sheet-label">描述</p>
                <input className="area-input" value={newProductForm.description} onChange={(e) => setNewProductForm((form) => ({ ...form, description: e.target.value }))} placeholder="适合什么场景、寓意、养护难度" />
              </div>

              <div className="empty-card">
                <p>照片上传已启用本地预览</p>
                <span>当前不接真实云存储；后续接 Storage 后会把远程 URL 写回 imageUrl 字段。</span>
              </div>
            </section>
          </div>

          <section className="plan-summary-card" style={{ marginTop: 16 }}>
            <div className="section-title-row">
              <div><p className="eyebrow">Preview</p><h2>商品预览</h2></div>
            </div>
            <article className="product-card" style={{ maxWidth: 360 }}>
              <div className="product-image" style={{ width: 76, height: 76, flexShrink: 0 }}>
                {isImageUrl(preview) ? <img src={preview} alt={newProductForm.name || "商品预览"} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 16 }} /> : preview}
              </div>
              <div className="product-info">
                <h3>{newProductForm.name || "新商品名称"}</h3>
                <p>{newProductForm.category}｜{newProductForm.subCategory}</p>
                <p>{newProductForm.description || "商品描述会显示在这里"}</p>
                <strong>¥ {newProductForm.pricePerDay || "-"}/天</strong>
              </div>
            </article>
          </section>

          <div style={{
            display: "flex",
            gap: 14,
            justifyContent: "flex-end",
            alignItems: "center",
            marginTop: 18,
            padding: 16,
            borderRadius: 22,
            background: "rgba(239, 247, 241, 0.92)",
            border: "1px solid rgba(34, 116, 67, 0.12)"
          }}>
            <button
              style={{ minWidth: 128, border: 0, borderRadius: 18, padding: "14px 22px", background: "#eef4fb", color: "#334155", fontWeight: 900, cursor: "pointer" }}
              onClick={() => { setShowCreateProductSheet(false); resetNewProductForm(); }}
            >取消</button>
            <button
              style={{ minWidth: 180, border: 0, borderRadius: 18, padding: "14px 24px", background: "#2f6fae", color: "#fff", fontWeight: 900, cursor: "pointer", boxShadow: "0 14px 28px rgba(33, 118, 66, 0.22)" }}
              onClick={createMerchantProduct}
            >{editingProductId ? "保存修改" : "保存商品"}</button>
          </div>
        </section>
      </div>
    );
  }

  function renderCreateOrderSheet() {
    if (activeRole === "merchant") {
      const overlayStyle = {
        position: "fixed",
        inset: 0,
        background: "rgba(15, 39, 26, 0.36)",
        zIndex: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      };

      const panelStyle = {
        width: "min(980px, calc(100vw - 48px))",
        maxHeight: "88vh",
        overflowY: "auto",
        background: "rgba(255,255,255,0.98)",
        borderRadius: 28,
        padding: 24,
        boxShadow: "0 28px 80px rgba(20, 54, 34, 0.22)",
      };

      return (
        <div
          style={overlayStyle}
          onClick={() => {
            setShowCreateOrderSheet(false);
            setIsCreateOrderInputFocused(false);
          }}
        >
          <section style={panelStyle} onClick={(event) => event.stopPropagation()}>
            <div className="section-title-row">
              <div><p className="eyebrow">New Order · v3.8</p><h2>创建新订单</h2></div>
              <button
                className="close-button"
                onClick={() => {
                  setShowCreateOrderSheet(false);
                  setIsCreateOrderInputFocused(false);
                }}
              >×</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              <section className="plan-summary-card" style={{ margin: 0 }}>
                <div className="section-title-row"><div><p className="eyebrow">Customer</p><h2>客户信息</h2></div></div>
                <div className="sheet-block"><p className="sheet-label">项目 / 客户名称</p><input className="area-input" value={newOrderForm.customerName} onChange={(e) => setNewOrderForm((form) => ({ ...form, customerName: e.target.value }))} placeholder="例如：南通万达 A3 写字楼" /></div>
                <div className="sheet-block"><p className="sheet-label">联系人</p><input className="area-input" value={newOrderForm.contactName} onChange={(e) => setNewOrderForm((form) => ({ ...form, contactName: e.target.value }))} placeholder="例如：王经理" /></div>
                <div className="sheet-block"><p className="sheet-label">联系电话</p><input className="area-input" inputMode="tel" value={newOrderForm.phone} onChange={(e) => setNewOrderForm((form) => ({ ...form, phone: e.target.value }))} placeholder="例如：13800001111" /></div>
                <div className="sheet-block"><p className="sheet-label">客户地址</p><input className="area-input" value={newOrderForm.address} onChange={(e) => setNewOrderForm((form) => ({ ...form, address: e.target.value }))} placeholder="例如：南通港闸区万达 A3 写字楼" /></div>
              </section>

              <section className="plan-summary-card" style={{ margin: 0 }}>
                <div className="section-title-row"><div><p className="eyebrow">Project</p><h2>项目需求</h2></div></div>
                <div className="sheet-block"><p className="sheet-label">订单来源</p><div className="option-grid payment-grid">{ORDER_SOURCES.map((source) => (<button key={source} className={newOrderForm.source === source ? "selected" : ""} onClick={() => setNewOrderForm((form) => ({ ...form, source }))}>{source}</button>))}</div></div>
                <div className="sheet-block"><p className="sheet-label">需求类型</p><div className="option-grid payment-grid">{["租赁", "零售", "养护"].map((serviceType) => (<button key={serviceType} className={newOrderForm.serviceType === serviceType ? "selected" : ""} onClick={() => setNewOrderForm((form) => ({ ...form, serviceType }))}>{serviceType}</button>))}</div></div>
                <div className="sheet-block">
                  <p className="sheet-label">需求标签</p>
                  <div className="merchant-tag-picker">
                    {["需比价", "租过绿植", "室内", "室外", "办公室", "商业空间", "其他", "急单", "重点客户"].map((tag) => {
                      const selected = newOrderForm.tagsText.split(",").map((item) => item.trim()).includes(tag);
                      return <button key={tag} className={selected ? "selected" : ""} onClick={() => toggleNewOrderTag(tag)}>{tag}</button>;
                    })}
                  </div>
                  <input className="area-input" value={newOrderForm.tagsText} onChange={(e) => setNewOrderForm((form) => ({ ...form, tagsText: e.target.value }))} placeholder="例如：办公室,长期租赁" />
                </div>
                <div className="sheet-block">
                  <p className="sheet-label">分配员工</p>
                  <select className="area-input" value={newOrderForm.assignedStaffId} onChange={(e) => setNewOrderForm((form) => ({ ...form, assignedStaffId: e.target.value }))}>
                    {activeStaffMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} · {member.staffNo} · {ROLE_LABELS[member.role] || member.role}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sheet-block">
                  <p className="sheet-label">客户沟通群二维码</p>
                  {/* 正式版接 Supabase Storage / 腾讯云 COS / 阿里云 OSS 后，应将二维码远程 URL 写入 communicationQrUrl。 */}
                  <ImageUploader
                    value={newOrderForm.communicationQrUrl}
                    label="上传二维码"
                    helper="员工端会显示“查看二维码”，用于扫码进客户沟通群。"
                    onChange={(nextImage) => setNewOrderForm((form) => ({ ...form, communicationQrUrl: nextImage }))}
                  />
                  <input
                    className="area-input"
                    value={newOrderForm.communicationQrUrl}
                    onChange={(e) => setNewOrderForm((form) => ({ ...form, communicationQrUrl: e.target.value }))}
                    placeholder="也可以粘贴二维码图片地址"
                    style={{ marginTop: 10 }}
                  />
                </div>
                <div className="sheet-block"><p className="sheet-label">项目面积</p><input className="area-input" value={newOrderForm.areaSize} onChange={(e) => setNewOrderForm((form) => ({ ...form, areaSize: e.target.value }))} placeholder="例如：260㎡" /></div>
                <div className="sheet-block"><p className="sheet-label">期望进场时间</p><input className="area-input" value={newOrderForm.expectedDate} onChange={(e) => setNewOrderForm((form) => ({ ...form, expectedDate: e.target.value }))} placeholder="例如：2026-06-08" /></div>
                <div className="sheet-block"><p className="sheet-label">预算 / 预估报价</p><input className="area-input" type="number" value={newOrderForm.budget} onChange={(e) => setNewOrderForm((form) => ({ ...form, budget: e.target.value }))} placeholder="例如：2880" /></div>
                <div className="sheet-block"><p className="sheet-label">预计植物数量 / 区域说明</p><input className="area-input" value={newOrderForm.plannedPlantCount} onChange={(e) => setNewOrderForm((form) => ({ ...form, plannedPlantCount: e.target.value }))} placeholder="例如：20 盆" /></div>
                <div className="sheet-block"><p className="sheet-label">计划区域</p><input className="area-input" value={newOrderForm.areaNote} onChange={(e) => setNewOrderForm((form) => ({ ...form, areaNote: e.target.value }))} placeholder="例如：前台 / 会议室 / 门口" /></div>
                <div className="sheet-block"><p className="sheet-label">需求描述</p><input className="area-input" value={newOrderForm.description} onChange={(e) => setNewOrderForm((form) => ({ ...form, description: e.target.value }))} placeholder="例如：前台和会议室需要绿植配置" /></div>
                <div className="sheet-block"><p className="sheet-label">商户备注</p><input className="area-input" value={newOrderForm.merchantNote} onChange={(e) => setNewOrderForm((form) => ({ ...form, merchantNote: e.target.value }))} placeholder="给员工的现场校正提示" /></div>
              </section>
            </div>

            <section className="plan-summary-card merchant-plan-draft-card" style={{ marginTop: 16 }}>
              <div className="section-title-row"><div><p className="eyebrow">Plan Draft</p><h2>方案草稿</h2></div></div>
              {newOrderForm.serviceType === "租赁" && (
                <div className="merchant-plan-draft-grid">
                  <div className="sheet-block"><p className="sheet-label">租期</p><input className="area-input" type="number" value={newOrderForm.leaseMonths} onChange={(e) => setNewOrderForm((form) => ({ ...form, leaseMonths: e.target.value }))} /></div>
                  <div className="sheet-block"><p className="sheet-label">付款方式</p><select className="area-input" value={newOrderForm.paymentMethod} onChange={(e) => setNewOrderForm((form) => ({ ...form, paymentMethod: e.target.value }))}>{["月付", "季付", "半年付", "年付"].map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
                  <div className="sheet-block"><p className="sheet-label">基础养护</p><div className="empty-card"><p>默认包含基础养护</p><span>员工端可按现场情况校正商品、区域和数量。</span></div></div>
                </div>
              )}
              {newOrderForm.serviceType === "零售" && (
                <div className="sheet-block">
                  <p className="sheet-label">后续养护意向</p>
                  <div className="option-grid payment-grid">
                    <button className={newOrderForm.retailNeedsMaintenance ? "selected" : ""} onClick={() => setNewOrderForm((form) => ({ ...form, retailNeedsMaintenance: true }))}>需要</button>
                    <button className={!newOrderForm.retailNeedsMaintenance ? "selected" : ""} onClick={() => setNewOrderForm((form) => ({ ...form, retailNeedsMaintenance: false }))}>暂不需要</button>
                  </div>
                </div>
              )}
              {newOrderForm.serviceType === "养护" && (
                <div className="merchant-plan-draft-grid">
                  <div className="sheet-block"><p className="sheet-label">套餐</p><select className="area-input" value={newOrderForm.maintenancePackage} onChange={(e) => { const pack = getMaintenancePackage(e.target.value); setNewOrderForm((form) => ({ ...form, maintenancePackage: pack.name, maintenanceCycle: pack.cycle, maintenanceFrequency: pack.frequency, maintenanceContent: pack.content })); }}>{MAINTENANCE_PACKAGES.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select></div>
                  <div className="sheet-block"><p className="sheet-label">周期</p><input className="area-input" value={newOrderForm.maintenanceCycle} onChange={(e) => setNewOrderForm((form) => ({ ...form, maintenanceCycle: e.target.value }))} /></div>
                  <div className="sheet-block"><p className="sheet-label">频次</p><input className="area-input" value={newOrderForm.maintenanceFrequency} onChange={(e) => setNewOrderForm((form) => ({ ...form, maintenanceFrequency: e.target.value }))} /></div>
                  <div className="sheet-block"><p className="sheet-label">最终报价</p><input className="area-input" type="number" value={newOrderForm.maintenanceFinalPrice} onChange={(e) => setNewOrderForm((form) => ({ ...form, maintenanceFinalPrice: e.target.value }))} /></div>
                  <div className="sheet-block wide"><p className="sheet-label">服务内容</p><input className="area-input" value={newOrderForm.maintenanceContent} onChange={(e) => setNewOrderForm((form) => ({ ...form, maintenanceContent: e.target.value }))} /></div>
                  <div className="sheet-block wide"><p className="sheet-label">内部报价备注</p><input className="area-input" value={newOrderForm.maintenanceInternalNote} onChange={(e) => setNewOrderForm((form) => ({ ...form, maintenanceInternalNote: e.target.value }))} placeholder="仅商户内部可见" /></div>
                </div>
              )}
            </section>

            <div className="empty-card" style={{ marginTop: 16 }}>
              <p>创建后会直接进入待接单</p>
              <span>员工端刷新后即可接单，后续再配置区域、商品和报价。</span>
            </div>

            <div style={{
              display: "flex",
              gap: 14,
              justifyContent: "flex-end",
              alignItems: "center",
              marginTop: 18,
              padding: 16,
              borderRadius: 22,
              background: "rgba(239, 247, 241, 0.92)",
              border: "1px solid rgba(34, 116, 67, 0.12)"
            }}>
              <button
                style={{
                  minWidth: 128,
                  border: 0,
                  borderRadius: 18,
                  padding: "14px 22px",
                  background: "#eef4fb",
                  color: "#334155",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
                onClick={() => setShowCreateOrderSheet(false)}
              >
                取消
              </button>
              <button
                style={{
                  minWidth: 210,
                  border: 0,
                  borderRadius: 18,
                  padding: "14px 24px",
                  background: "#2f6fae",
                  color: "#fff",
                  fontWeight: 900,
                  cursor: "pointer",
                  boxShadow: "0 14px 28px rgba(33, 118, 66, 0.22)",
                }}
                onClick={createMerchantOrder}
              >
                创建并派发订单
              </button>
            </div>
          </section>
        </div>
      );
    }

    const sheetStyle = {
      maxHeight: "86vh",
      overflowY: "auto",
      paddingBottom: isCreateOrderInputFocused
        ? "calc(40px + env(safe-area-inset-bottom))"
        : "calc(120px + env(safe-area-inset-bottom))",
    };

    const stickyStyle = {
      position: "sticky",
      bottom: 0,
      background: "rgba(255,255,255,0.96)",
      paddingTop: 12,
      paddingBottom: "env(safe-area-inset-bottom)",
      zIndex: 5,
      display: isCreateOrderInputFocused ? "none" : "block",
    };

    const compactBlockStyle = { marginBottom: 10 };

    const inputFocusProps = {
      onFocus: () => setIsCreateOrderInputFocused(true),
      onBlur: () => {
        window.setTimeout(() => {
          const active = document.activeElement;
          const stillInCreateForm =
            active &&
            active.classList &&
            active.classList.contains("create-order-input");
          if (!stillInCreateForm) {
            setIsCreateOrderInputFocused(false);
          }
        }, 180);
      },
    };

    const inputClass = "area-input create-order-input";

    return (
      <div
        className="sheet-mask"
        onClick={() => {
          setShowCreateOrderSheet(false);
          setIsCreateOrderInputFocused(false);
        }}
      >
        <section className="bottom-sheet" style={sheetStyle} onClick={(event) => event.stopPropagation()}>
          <div className="sheet-handle" />

          <div className="sheet-header">
            <div><p className="eyebrow">New Order · v3.8</p><h2>创建新订单</h2></div>
            <button
              className="close-button"
              onClick={() => {
                setShowCreateOrderSheet(false);
                setIsCreateOrderInputFocused(false);
              }}
            >
              ×
            </button>
          </div>

          <div className="sheet-block" style={compactBlockStyle}>
            <p className="sheet-label">项目 / 客户名称</p>
            <input className={inputClass} {...inputFocusProps} value={newOrderForm.customerName} onChange={(e) => setNewOrderForm((form) => ({ ...form, customerName: e.target.value }))} placeholder="例如：南通万达 A3 写字楼" />
          </div>

          <div className="sheet-block" style={compactBlockStyle}>
            <p className="sheet-label">联系人</p>
            <input className={inputClass} {...inputFocusProps} value={newOrderForm.contactName} onChange={(e) => setNewOrderForm((form) => ({ ...form, contactName: e.target.value }))} placeholder="例如：王经理" />
          </div>

          <div className="sheet-block" style={compactBlockStyle}>
            <p className="sheet-label">联系电话</p>
            <input className={inputClass} inputMode="tel" {...inputFocusProps} value={newOrderForm.phone} onChange={(e) => setNewOrderForm((form) => ({ ...form, phone: e.target.value }))} placeholder="例如：13800001111" />
          </div>

          <div className="sheet-block" style={compactBlockStyle}>
            <p className="sheet-label">订单来源</p>
            <div className="option-grid">
              {ORDER_SOURCES.map((source) => (
                <button key={source} className={newOrderForm.source === source ? "selected" : ""} onClick={() => setNewOrderForm((form) => ({ ...form, source }))}>
                  {source}
                </button>
              ))}
            </div>
          </div>

          <div className="sheet-block" style={compactBlockStyle}>
            <p className="sheet-label">需求类型</p>
            <div className="option-grid">
              {["租赁", "零售", "养护"].map((serviceType) => (
                <button key={serviceType} className={newOrderForm.serviceType === serviceType ? "selected" : ""} onClick={() => setNewOrderForm((form) => ({ ...form, serviceType }))}>
                  {serviceType}
                </button>
              ))}
            </div>
          </div>

          <div className="sheet-block" style={compactBlockStyle}>
            <p className="sheet-label">需求标签</p>
            <div className="merchant-tag-picker">
              {["需比价", "租过绿植", "室内", "室外", "办公室", "商业空间", "急单", "重点客户"].map((tag) => {
                const selected = newOrderForm.tagsText.split(",").map((item) => item.trim()).includes(tag);
                return <button key={tag} className={selected ? "selected" : ""} onClick={() => toggleNewOrderTag(tag)}>{tag}</button>;
              })}
            </div>
          </div>

          <div className="sheet-block" style={compactBlockStyle}>
            <p className="sheet-label">分配员工</p>
            <select className={inputClass} value={newOrderForm.assignedStaffId} onChange={(e) => setNewOrderForm((form) => ({ ...form, assignedStaffId: e.target.value }))}>
              {activeStaffMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} · {member.staffNo}
                </option>
              ))}
            </select>
          </div>

          <div className="sheet-block" style={compactBlockStyle}>
            <p className="sheet-label">客户沟通群二维码</p>
            {/* 正式版接 Supabase Storage / 腾讯云 COS / 阿里云 OSS 后，应将二维码远程 URL 写入 communicationQrUrl。 */}
            <ImageUploader
              value={newOrderForm.communicationQrUrl}
              label="上传二维码"
              helper="员工端会显示“查看二维码”，便于扫码进入客户沟通群。"
              onChange={(nextImage) => setNewOrderForm((form) => ({ ...form, communicationQrUrl: nextImage }))}
            />
            <input
              className={inputClass}
              {...inputFocusProps}
              value={newOrderForm.communicationQrUrl}
              onChange={(e) => setNewOrderForm((form) => ({ ...form, communicationQrUrl: e.target.value }))}
              placeholder="也可以粘贴二维码图片地址"
            />
          </div>

          <div className="sheet-block" style={compactBlockStyle}>
            <p className="sheet-label">项目面积</p>
            <input className={inputClass} {...inputFocusProps} value={newOrderForm.areaSize} onChange={(e) => setNewOrderForm((form) => ({ ...form, areaSize: e.target.value }))} placeholder="例如：260㎡" />
          </div>

          <div className="sheet-block" style={compactBlockStyle}>
            <p className="sheet-label">预算 / 预估报价</p>
            <input className={inputClass} inputMode="numeric" {...inputFocusProps} value={newOrderForm.budget} onChange={(e) => setNewOrderForm((form) => ({ ...form, budget: e.target.value }))} placeholder="例如：2880" />
          </div>

          <div className="sheet-block" style={compactBlockStyle}>
            <p className="sheet-label">预计植物数量 / 区域说明</p>
            <input className={inputClass} {...inputFocusProps} value={newOrderForm.plannedPlantCount} onChange={(e) => setNewOrderForm((form) => ({ ...form, plannedPlantCount: e.target.value }))} placeholder="例如：20 盆 / 前台和会议室" />
          </div>

          <div className="sheet-block" style={compactBlockStyle}>
            <p className="sheet-label">期望进场时间</p>
            <input className={inputClass} {...inputFocusProps} value={newOrderForm.expectedDate} onChange={(e) => setNewOrderForm((form) => ({ ...form, expectedDate: e.target.value }))} placeholder="例如：2026-06-08" />
          </div>

          <div className="sheet-block" style={compactBlockStyle}>
            <p className="sheet-label">客户地址</p>
            <input className={inputClass} {...inputFocusProps} value={newOrderForm.address} onChange={(e) => setNewOrderForm((form) => ({ ...form, address: e.target.value }))} placeholder="例如：南通港闸区万达 A3 写字楼" />
          </div>

          <div className="sheet-block" style={compactBlockStyle}>
            <p className="sheet-label">需求描述</p>
            <input className={inputClass} {...inputFocusProps} value={newOrderForm.description} onChange={(e) => setNewOrderForm((form) => ({ ...form, description: e.target.value }))} placeholder="例如：前台和会议室需要绿植配置" />
          </div>

          <div className="sheet-block" style={compactBlockStyle}>
            <p className="sheet-label">标签，用英文逗号分隔</p>
            <input className={inputClass} {...inputFocusProps} value={newOrderForm.tagsText} onChange={(e) => setNewOrderForm((form) => ({ ...form, tagsText: e.target.value }))} placeholder="例如：办公室,长期租赁" />
          </div>

          <div className="sheet-block" style={compactBlockStyle}>
            <p className="sheet-label">商户备注</p>
            <input className={inputClass} {...inputFocusProps} value={newOrderForm.merchantNote} onChange={(e) => setNewOrderForm((form) => ({ ...form, merchantNote: e.target.value }))} placeholder="给员工的现场校正提示" />
          </div>

          {newOrderForm.serviceType === "租赁" && (
            <div className="sheet-block" style={compactBlockStyle}>
              <p className="sheet-label">租赁方案草稿</p>
              <div className="option-grid">
                {[6, 12, 24, 36].map((month) => (
                  <button key={month} className={Number(newOrderForm.leaseMonths || 12) === month ? "selected" : ""} onClick={() => setNewOrderForm((form) => ({ ...form, leaseMonths: String(month) }))}>{month} 月</button>
                ))}
              </div>
              <div className="empty-card"><p>默认包含基础养护</p><span>员工接单后可按现场情况校正区域和商品。</span></div>
            </div>
          )}

          {newOrderForm.serviceType === "零售" && (
            <div className="sheet-block" style={compactBlockStyle}>
              <p className="sheet-label">后续养护意向</p>
              <div className="option-grid">
                <button className={newOrderForm.retailNeedsMaintenance ? "selected" : ""} onClick={() => setNewOrderForm((form) => ({ ...form, retailNeedsMaintenance: true }))}>需要</button>
                <button className={!newOrderForm.retailNeedsMaintenance ? "selected" : ""} onClick={() => setNewOrderForm((form) => ({ ...form, retailNeedsMaintenance: false }))}>暂不需要</button>
              </div>
            </div>
          )}

          {newOrderForm.serviceType === "养护" && (
            <div className="sheet-block" style={compactBlockStyle}>
              <p className="sheet-label">养护套餐</p>
              <select className={inputClass} value={newOrderForm.maintenancePackage} onChange={(e) => { const pack = getMaintenancePackage(e.target.value); setNewOrderForm((form) => ({ ...form, maintenancePackage: pack.name, maintenanceCycle: pack.cycle, maintenanceFrequency: pack.frequency, maintenanceContent: pack.content })); }}>
                {MAINTENANCE_PACKAGES.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
              </select>
              <input className={inputClass} inputMode="numeric" {...inputFocusProps} value={newOrderForm.maintenanceFinalPrice} onChange={(e) => setNewOrderForm((form) => ({ ...form, maintenanceFinalPrice: e.target.value }))} placeholder="最终报价" />
            </div>
          )}

          {isCreateOrderInputFocused && (
            <div className="empty-card">
              <p>填写完成后收起键盘</p>
              <span>收起键盘后会显示“创建并派发订单”按钮。</span>
            </div>
          )}

          <div style={stickyStyle}>
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 12 }}>
              <button
                className="ghost-button"
                style={{ borderRadius: 18, padding: "15px 18px", fontWeight: 900 }}
                onClick={() => { setShowCreateOrderSheet(false); setIsCreateOrderInputFocused(false); }}
              >
                取消
              </button>
              <button
                className="submit-sheet-button"
                onClick={() => {
                  setIsCreateOrderInputFocused(false);
                  createMerchantOrder();
                }}
              >
                创建并派发订单
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (authLoading) {
    return (
      <main className="auth-page-shell">
        <section className="auth-panel">
          <div className="auth-brand"><span>G</span><div><p>GardenOS Account</p><h1>正在检查登录状态</h1></div></div>
        </section>
      </main>
    );
  }

  if (!session) return <AuthPage onSignedOut={handleSignOut} />;

  if (customerPlanId) return renderCustomerPlanView();
  if (currentPage === "completeUpload" && currentOrder) return renderCompleteUploadPage();
  if (currentPage === "plan" && currentOrder && currentPlan) return renderPlanPage();
  if (activeRole === "merchant") return renderMerchantPage();

 return (
    <>
      <StaffMobile
        staffAppTab={staffAppTab}
        setStaffAppTab={setStaffAppTab}
        switchRole={switchRole}
        orders={orders}
        staffOrders={staffScopedOrders}
        refreshOrdersFromCloud={refreshOrdersFromCloud}
        getPlanStats={getPlanStats}
        money={money}
        activeStaffTab={activeStaffTab}
        setActiveStaffTab={setActiveStaffTab}
        filteredStaffOrders={filteredStaffOrders}
        CoreOrderCard={CoreOrderCard}
        setCurrentOrderId={setCurrentOrderId}
        setCurrentPage={setCurrentPage}
        syncState={syncState}
        autoSyncState={autoSyncState}
        syncMessage={syncMessage}
        uploadLocalOrdersToCloud={uploadLocalOrdersToCloud}
        selectedOrder={selectedOrder}
        setSelectedOrder={setSelectedOrder}
        planType={planType}
        setPlanType={setPlanType}
        acceptOrderAndCreatePlan={acceptOrderAndCreatePlan}
        staffAvatar={staffAvatar}
        setStaffAvatar={setStaffAvatar}
        currentStaff={currentStaff}
        currentOrganization={currentOrganization}
        roleLabels={ROLE_LABELS}
        accountStatusLabels={ACCOUNT_STATUS_LABELS}
        authUserEmail={authUserEmail}
        canOpenMerchant={canUseMerchant}
        onSignOut={handleSignOut}
      />

      {qrPreviewOrder && (
        <div className="sheet-mask staff-qr-mask" onClick={() => setQrPreviewOrder(null)}>
          <section className="staff-qr-dialog" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-header">
              <div>
                <p className="eyebrow">Communication</p>
                <h2>客户沟通群</h2>
              </div>
              <button className="close-button" onClick={() => setQrPreviewOrder(null)}>×</button>
            </div>
            <p className="staff-qr-copy">扫码进入客户沟通群，便于沟通方案与进场安排。</p>
            <div className="staff-qr-image">
              <img src={qrPreviewOrder.communicationQrUrl} alt={`${qrPreviewOrder.customerName || "客户"}沟通群二维码`} />
            </div>
          </section>
        </div>
      )}
    </>
  );
}

export default App;
