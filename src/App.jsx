import React, { useEffect, useMemo, useRef, useState } from "react";
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
const STAFF_DIRECTORY_STORAGE_KEY = "green-rental-staff-directory-v1";
const STAFF_AVATAR_STORAGE_KEY = "green-rental-staff-avatar-v1";
const STAFF_AVATAR_CACHE_STORAGE_KEY = "green-rental-staff-avatar-cache-v1";
const CURRENT_STAFF_STORAGE_KEY = "green-rental-current-staff-v1";
const STAFF_AVATAR_BUCKET = "staff-avatars";
const STAFF_PROFILE_API = `${SUPABASE_URL}/rest/v1/staff_profiles`;
const PRODUCT_CLOUD_ID = 999999001;

const ORDER_STATUS = ["待接单", "配置中", "待商户确认", "方案已确认", "执行中", "待商户归档", "已完成"];
const MERCHANT_STATUS_TABS = ["全部", ...ORDER_STATUS];
const STAFF_TABS = ["待接单", "做方案", "执行中", "已完成"];
const STAFF_APP_TABS = ["首页", "任务", "上报", "我的"];
const MERCHANT_TABS = ["工作台", "订单管理", "团队成员", "执行监测", "商品库", "客户库", "设置"];
const APP_PAGES = ["orders", "plan", "completeUpload", "archiveDetail", "serviceRecord"];

function getAppShellMode() {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  if (pathname === "/admin") return "admin";
  if (pathname === "/staff") return "staff";
  return "legacy";
}

function getInitialRoleByPath() {
  const mode = getAppShellMode();
  if (mode === "admin") return "merchant";
  if (mode === "staff") return "staff";
  return "staff";
}

function isLocalDevHost() {
  return ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
}

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
    orderPermission: "public",
    organizationId: "org-001",
    area: "杭州 / 滨江",
    avatar: "",
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
    orderPermission: "assigned",
    organizationId: "org-001",
    area: "杭州 / 上城",
    avatar: "",
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
    orderPermission: "paused",
    organizationId: "org-001",
    area: "杭州 / 西湖",
    avatar: "",
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

// Phase-1 role shape only. Real permissions should later come from account/org config:
// owner = all merchant permissions; manager = configurable finance/export scope; staff = own + public tasks.
const ROLE_ACCESS_PRESET = {
  owner: { workspace: "admin", canViewAllOrders: true, canManageAccounts: true, financeScope: "all" },
  manager: { workspace: "admin", canViewAllOrders: true, canDispatch: true, canReviewPlans: true, financeScope: "configurable" },
  staff: { workspace: "staff", canViewOwnAndPublicTasks: true, canConfigurePlan: true, canUploadCompletion: true },
};

const ACCOUNT_STATUS_LABELS = {
  invited: "待邀请",
  active: "启用",
  paused: "已停用",
  disabled: "停用",
};

const STAFF_ORDER_PERMISSION_LABELS = {
  public: "可接公共单",
  assigned: "仅接指定派单",
  paused: "暂停接单",
};

const STAFF_AREA_OPTIONS = ["杭州 / 滨江", "杭州 / 上城", "杭州 / 西湖", "杭州 / 拱墅"];

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

function ErrorFallback({ mode = "staff", onReset }) {
  return (
    <main className={mode === "merchant" ? "admin-main app-error-shell" : "app staff-legacy-page app-error-shell"}>
      <section className="empty-card app-error-card">
        <p>页面加载失败</p>
        <span>当前页面数据不完整，请返回工作台后重试。</span>
        <button className="primary-button" onClick={onReset}>返回工作台</button>
      </section>
    </main>
  );
}

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("页面渲染失败：", error, info);
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback mode={this.props.mode} onReset={this.props.onReset} />;
    }

    return this.props.children;
  }
}

function normalizeStaffMember(member = {}) {
  const avatarUrl = member.avatarUrl || member.avatar_url || member.avatar || "";
  return {
    id: member.id || `staff-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    staffNo: String(member.staffNo || "").trim() || "YG001",
    name: member.name || "未命名员工",
    email: member.email || "",
    phone: member.phone || "",
    role: ["staff", "manager", "admin"].includes(member.role) ? member.role : "staff",
    status: ["invited", "active", "paused", "disabled"].includes(member.status) ? member.status : "active",
    orderPermission: ["public", "assigned", "paused"].includes(member.orderPermission) ? member.orderPermission : "public",
    organizationId: member.organizationId || organizations[0]?.id || "org-001",
    area: member.area || "杭州 / 滨江",
    avatar: member.avatar || avatarUrl,
    avatarUrl,
    inviteCode: member.inviteCode || "",
    createdAt: member.createdAt || nowText(),
    updatedAt: member.updatedAt || "",
    lastLoginAt: member.lastLoginAt || "",
  };
}

function getStaffAvatar(member = {}) {
  return member?.avatarUrl || member?.avatar || "";
}

function getStaffInitial(member = {}) {
  return String(member?.name || member?.email || "G").trim().slice(0, 1).toUpperCase() || "G";
}

function StaffAvatarBadge({ member, className = "" }) {
  const avatar = getStaffAvatar(member);

  return (
    <span className={`staff-cloud-avatar ${className}`.trim()} aria-label={`${member?.name || "员工"}头像`}>
      {avatar ? <img src={avatar} alt={`${member?.name || "员工"}头像`} /> : <span>{getStaffInitial(member)}</span>}
    </span>
  );
}

function normalizeStaffDirectory(data) {
  const list = Array.isArray(data) && data.length ? data : staffMembers;
  return list.map(normalizeStaffMember);
}

function canAssignStaff(member) {
  return member?.status === "active" && member?.orderPermission !== "paused";
}

function generateNextStaffNo(members = []) {
  const maxNo = members.reduce((max, member) => {
    const match = String(member.staffNo || "").trim().match(/^YG(\d+)$/i);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  return `YG${String(maxNo + 1).padStart(3, "0")}`;
}

function isStaffNoTaken(members = [], staffNo, ignoreId = "") {
  const normalizedStaffNo = String(staffNo || "").trim().toUpperCase();
  return members.some((member) => member.id !== ignoreId && String(member.staffNo || "").trim().toUpperCase() === normalizedStaffNo);
}

function createStaffForm(defaultStaffNo = "YG001") {
  return {
    name: "",
    phone: "",
    email: "",
    staffNo: defaultStaffNo,
    role: "staff",
    area: "杭州 / 滨江",
    orderPermission: "public",
    status: "invited",
    avatar: "",
  };
}

function resolveAuthAccountByEmail(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return null;

  // Local demo account mapping. Production role routing should come from the account service.
  if (normalizedEmail === "1464155122@qq.com") {
    return {
      id: "user-dev-owner-1464155122",
      name: "商户管理员",
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

  // Account service should decide whether the user enters the staff or merchant workspace.
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

function ensureOrderDefaults(order = {}) {
  const assignedStaff = getStaffMemberById(order.assignedStaffId) || getDefaultAssignedStaff();
  const hasAssignedStaffId = Object.prototype.hasOwnProperty.call(order, "assignedStaffId");
  const isPublicAssignedOrder = hasAssignedStaffId && !String(order.assignedStaffId || "").trim();
  return {
    ...order,
    id: order.id || Date.now(),
    customerName: order.customerName || "未命名客户",
    areaSize: order.areaSize || "暂无内容",
    expectedDate: order.expectedDate || "待确认",
    address: order.address || "",
    description: order.description || "",
    status: order.status || "待接单",
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
    assignedStaffId: hasAssignedStaffId ? order.assignedStaffId || "" : assignedStaff?.id || "",
    assignedStaffName: order.assignedStaffName || (isPublicAssignedOrder ? "所有员工（公共任务）" : assignedStaff?.name || ""),
    assignedStaffEmail: order.assignedStaffEmail || (isPublicAssignedOrder ? "" : assignedStaff?.email || ""),
    communicationQrUrl: order.communicationQrUrl || "",
    serviceType: order.serviceType || "租赁",
    planType: order.planType || order.plan?.planType || "租赁方案",
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
    tags: Array.isArray(order.tags) ? order.tags : [],
    products: Array.isArray(order.products) ? order.products : [],
    photos: Array.isArray(order.photos) ? order.photos : [],
    timeline: Array.isArray(order.timeline) ? order.timeline : [],
    serviceRecords: Array.isArray(order.serviceRecords) ? order.serviceRecords : [],
    completePhotos: order.completePhotos && typeof order.completePhotos === "object"
      ? {
          scenePhotos: Array.isArray(order.completePhotos.scenePhotos) ? order.completePhotos.scenePhotos : [],
          plantPhotos: Array.isArray(order.completePhotos.plantPhotos) ? order.completePhotos.plantPhotos : [],
          remark: order.completePhotos.remark || "",
        }
      : { scenePhotos: [], plantPhotos: [], remark: "" },
    plan: order.plan || null,
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

function loadStaffDirectoryFromLocalStore() {
  try {
    const raw = localStorage.getItem(STAFF_DIRECTORY_STORAGE_KEY);
    if (!raw) return normalizeStaffDirectory(staffMembers);

    const parsed = JSON.parse(raw);
    return normalizeStaffDirectory(parsed?.staff);
  } catch (error) {
    console.error("读取本地员工目录失败：", error);
    return normalizeStaffDirectory(staffMembers);
  }
}

function persistStaffDirectoryToLocalStore(staff) {
  try {
    localStorage.setItem(
      STAFF_DIRECTORY_STORAGE_KEY,
      JSON.stringify({
        source: "localStorage",
        savedAt: nowText(),
        staff,
      })
    );
  } catch (error) {
    console.error("保存本地员工目录失败：", error);
  }
}

function loadStaffAvatarCacheFromLocalStore() {
  try {
    const raw = localStorage.getItem(STAFF_AVATAR_CACHE_STORAGE_KEY);
    return raw ? JSON.parse(raw) || {} : {};
  } catch (error) {
    console.error("读取员工头像缓存失败：", error);
    return {};
  }
}

function loadStaffAvatarFromLocalStore(staffId = "") {
  try {
    const cache = loadStaffAvatarCacheFromLocalStore();
    const cached = staffId ? cache[staffId] : "";
    return cached || localStorage.getItem(STAFF_AVATAR_STORAGE_KEY) || "";
  } catch (error) {
    console.error("读取员工头像失败：", error);
    return "";
  }
}

function persistStaffAvatarToLocalStore(staffId, staffAvatar) {
  try {
    if (!staffId) {
      localStorage.setItem(STAFF_AVATAR_STORAGE_KEY, staffAvatar || "");
      return;
    }

    const cache = loadStaffAvatarCacheFromLocalStore();
    if (staffAvatar) {
      cache[staffId] = staffAvatar;
    } else {
      delete cache[staffId];
    }
    localStorage.setItem(STAFF_AVATAR_CACHE_STORAGE_KEY, JSON.stringify(cache));
    localStorage.setItem(STAFF_AVATAR_STORAGE_KEY, staffAvatar || "");
  } catch (error) {
    console.error("保存员工头像失败：", error);
  }
}

function getSafeStaffAvatarId(staffId) {
  return String(staffId || DEFAULT_STAFF_ID).trim().replace(/[^a-zA-Z0-9_-]/g, "-") || DEFAULT_STAFF_ID;
}

function getStaffAvatarStoragePath(staffId) {
  return `${getSafeStaffAvatarId(staffId)}/avatar.jpg`;
}

function getStaffAvatarPublicUrl(staffId, version = "") {
  const path = getStaffAvatarStoragePath(staffId)
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  const baseUrl = `${SUPABASE_URL}/storage/v1/object/public/${STAFF_AVATAR_BUCKET}/${path}`;
  return version ? `${baseUrl}?v=${encodeURIComponent(version)}` : baseUrl;
}

async function publicImageExists(url) {
  try {
    const response = await fetch(url, { method: "HEAD", cache: "no-store" });
    if (response.ok) return true;
    if (response.status === 404) return false;
  } catch {
    // Some storage/CDN layers do not allow HEAD; try a normal request before giving up.
  }

  try {
    const response = await fetch(url, { cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}

function readBlobAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("头像预览生成失败，请重试。"));
    reader.readAsDataURL(blob);
  });
}

function withAvatarCacheBust(url) {
  if (!url) return "";
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${Date.now()}`;
}

function getStaffAvatarCloudErrorMessage(error) {
  const rawMessage = String(error?.message || error || "云端上传失败").trim();
  const lowerMessage = rawMessage.toLowerCase();
  const looksLikeBucketIssue =
    lowerMessage.includes("bucket") ||
    lowerMessage.includes("not found") ||
    lowerMessage.includes("storage");
  const looksLikePolicyIssue =
    lowerMessage.includes("row-level security") ||
    lowerMessage.includes("policy") ||
    lowerMessage.includes("permission") ||
    lowerMessage.includes("unauthorized") ||
    lowerMessage.includes("jwt");

  if (looksLikeBucketIssue) {
    return `已在本机更新头像。云端头像桶 ${STAFF_AVATAR_BUCKET} 可能尚未创建或不可访问：${rawMessage}`;
  }

  if (looksLikePolicyIssue) {
    return `已在本机更新头像。Supabase Storage 上传策略暂未放行：${rawMessage}`;
  }

  return `已在本机更新头像，云端同步失败：${rawMessage}`;
}

async function loadStaffAvatarProfileFromCloud(staffId) {
  try {
    const response = await fetch(
      `${STAFF_PROFILE_API}?staff_id=eq.${encodeURIComponent(staffId)}&select=avatar_url,updated_at&limit=1`,
      { headers: cloudHeaders() }
    );
    if (!response.ok) return "";

    const data = await response.json();
    return Array.isArray(data) ? data[0]?.avatar_url || "" : "";
  } catch (error) {
    console.warn("读取云端员工头像资料失败：", error);
    return "";
  }
}

async function loadStaffAvatarProfilesFromCloud() {
  try {
    const response = await fetch(
      `${STAFF_PROFILE_API}?select=staff_id,avatar_url,updated_at`,
      { headers: cloudHeaders() }
    );
    if (!response.ok) return [];

    const data = await response.json();
    return Array.isArray(data)
      ? data.filter((item) => item?.staff_id && item?.avatar_url)
      : [];
  } catch (error) {
    console.warn("读取云端员工头像目录失败：", error);
    return [];
  }
}

async function saveStaffAvatarProfileToCloud(staff, avatarUrl) {
  // First-stage cloud sync: write avatar_url when a staff_profiles table exists.
  // Production should bind this to real auth.uid + organization_id RLS policies.
  const payload = {
    staff_id: staff?.id || DEFAULT_STAFF_ID,
    name: staff?.name || "",
    email: staff?.email || "",
    avatar_url: avatarUrl,
    updated_at: new Date().toISOString(),
  };

  const response = await fetch(`${STAFF_PROFILE_API}?on_conflict=staff_id`, {
    method: "POST",
    headers: {
      ...cloudHeaders({ Prefer: "resolution=merge-duplicates,return=representation" }),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "staff_profiles 写入失败");
  }

  return response.json().catch(() => null);
}

async function createCompressedAvatarBlob(file) {
  if (!file?.type?.startsWith("image/")) {
    throw new Error("请选择图片文件。");
  }

  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error("头像图片不能超过 5MB。");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("图片读取失败，请换一张图片。"));
      img.src = objectUrl;
    });

    const sourceSize = Math.min(image.naturalWidth || image.width, image.naturalHeight || image.height);
    const sourceX = ((image.naturalWidth || image.width) - sourceSize) / 2;
    const sourceY = ((image.naturalHeight || image.height) - sourceSize) / 2;
    const targetSize = Math.min(800, sourceSize || 800);
    const canvas = document.createElement("canvas");
    canvas.width = targetSize;
    canvas.height = targetSize;
    const context = canvas.getContext("2d");
    context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, targetSize, targetSize);

    return await new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("头像压缩失败，请重试。"));
            return;
          }
          resolve(blob);
        },
        "image/jpeg",
        0.86
      );
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function uploadStaffAvatarToCloud(staffId, avatarBlob) {
  const path = getStaffAvatarStoragePath(staffId);
  const { error } = await supabase.storage.from(STAFF_AVATAR_BUCKET).upload(path, avatarBlob, {
    cacheControl: "3600",
    contentType: avatarBlob?.type || "image/jpeg",
    upsert: true,
  });

  if (error) {
    throw new Error(error.message || "头像上传失败");
  }

  return supabase.storage.from(STAFF_AVATAR_BUCKET).getPublicUrl(path)?.data?.publicUrl || getStaffAvatarPublicUrl(staffId);
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
  return Number(value || 0).toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function MoneyAmount({ value }) {
  const [whole, cents = "00"] = money(value).split(".");
  return (
    <span className="money-amount">
      <span className="money-symbol">¥</span>
      <span className="money-whole">{whole}</span>
      <span className="money-cents">.{cents}</span>
    </span>
  );
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

function safePhotos(values) {
  return Array.isArray(values) ? values.filter(Boolean) : [];
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
  const areaNote = String(order?.areaNote || "").trim();
  const hasUsefulPrefillText = (value) => {
    const text = String(value || "").trim();
    return Boolean(text && !["暂无内容", "待确认"].includes(text));
  };

  return {
    id: `plan-${order.id}-${Date.now()}`,
    planType,
    leaseMonths: Number(order?.leaseMonths || 12),
    paymentMethod: order?.paymentMethod || "月付",
    needDeposit: true,
    customFinalRent: order?.budget || "",
    includedMaintenance: "基础养护",
    retailNeedsMaintenance: false,
    retailMaintenanceNote: "",
    maintenanceFinalPrice: "",
    maintenanceInternalNote: "",
    ...maintenanceFields,
    merchantDraft: Boolean(
      areaNote ||
      hasUsefulPrefillText(order?.budget) ||
      hasUsefulPrefillText(order?.plannedPlantCount) ||
      hasUsefulPrefillText(order?.areaSize)
    ),
    merchantDraftNote: order?.merchantNote || "",
    areas: areaNote ? [{ id: `area-${order.id}`, name: areaNote, items: [] }] : [],
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

function classifyOrderStatus(status) {
  const normalized = String(status || "").toLowerCase();

  if (
    normalized.includes("待接") ||
    normalized.includes("pending") ||
    normalized.includes("wait") ||
    normalized.includes("new")
  ) {
    return "待接单";
  }

  if (
    normalized.includes("已完成") ||
    normalized.includes("已归档") ||
    normalized.includes("待商户归档") ||
    normalized.includes("完工待验") ||
    normalized.includes("done") ||
    normalized.includes("completed") ||
    normalized.includes("complete") ||
    normalized.includes("archived") ||
    normalized.includes("archive")
  ) {
    return "已完成";
  }

  if (
    normalized.includes("执行中") ||
    normalized.includes("施工中") ||
    normalized.includes("现场推进") ||
    normalized.includes("方案已确认") ||
    normalized.includes("in_progress") ||
    normalized.includes("executing") ||
    normalized.includes("execut") ||
    normalized.includes("service")
  ) {
    return "执行中";
  }

  if (
    normalized.includes("配置") ||
    normalized.includes("做方案") ||
    normalized.includes("方案草稿") ||
    normalized.includes("待商户确认") ||
    normalized.includes("planning") ||
    normalized.includes("plan") ||
    normalized.includes("draft") ||
    normalized.includes("confirmed") ||
    normalized.includes("confirm")
  ) {
    return "做方案";
  }

  return "做方案";
}

function getStaffStatuses(tab) {
  return STAFF_TABS.includes(tab) ? [tab] : ["待接单"];
}

function getStaffTabByOrderStatus(status) {
  return classifyOrderStatus(status);
}

function getMerchantStatusClass(status) {
  const group = classifyOrderStatus(status);
  if (group === "待接单") return "is-waiting";
  if (group === "做方案") return "is-plan";
  if (group === "执行中") return "is-running";
  if (group === "已完成") return status === "待商户归档" ? "is-warning" : "is-done";
  return "is-muted";
}

function App() {
  const appShellMode = getAppShellMode();
  const isPathRoleLocked = appShellMode === "admin" || appShellMode === "staff";
  const showRoleSwitch = isLocalDevHost() && new URLSearchParams(window.location.search).get("debugRoleSwitch") === "1";
  const merchantListRef = useRef(null);
  const activeViewRef = useRef({
    currentPage: "orders",
    activeRole: getInitialRoleByPath(),
    merchantViewingOrderId: null,
    selectedOrderDetailId: null,
  });

  const [activeRole, setActiveRole] = useState(() => getInitialRoleByPath());
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authRole, setAuthRole] = useState("staff");
  const [activeStaffTab, setActiveStaffTab] = useState("待接单");
  const [staffAppTab, setStaffAppTab] = useState("首页");
  const [merchantTab, setMerchantTab] = useState("工作台");
  const [merchantStatusFilter, setMerchantStatusFilter] = useState("全部");
  const [merchantSearchText, setMerchantSearchText] = useState("");
  const [syncMessage, setSyncMessage] = useState("当前数据通道已连接。点击刷新即可读取最新订单。");
  const [syncState, setSyncState] = useState("待刷新");
  const [autoSyncState, setAutoSyncState] = useState("自动同步准备中");

  const [orders, setOrders] = useState(() => loadOrdersFromLocalStore());
  const [merchantProducts, setMerchantProducts] = useState(() => loadProductsFromLocalStore());
  const [merchantCustomers, setMerchantCustomers] = useState(() => loadCustomersFromLocalStore());
  const [staffDirectory, setStaffDirectory] = useState(() => loadStaffDirectoryFromLocalStore());

  const [currentPage, setCurrentPage] = useState("orders");
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [merchantViewingOrder, setMerchantViewingOrder] = useState(null);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [editingStaffForm, setEditingStaffForm] = useState(null);
  const [showInviteStaffSheet, setShowInviteStaffSheet] = useState(false);
  const [staffInviteForm, setStaffInviteForm] = useState(() => createStaffForm(generateNextStaffNo(staffMembers)));
  const [staffFormError, setStaffFormError] = useState("");
  const [lastInviteCode, setLastInviteCode] = useState("");

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
  const [staffAvatarStatus, setStaffAvatarStatus] = useState("");
  const [staffAvatarError, setStaffAvatarError] = useState("");
  const [isUploadingStaffAvatar, setIsUploadingStaffAvatar] = useState(false);
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

  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeStaffDirectory = Array.isArray(staffDirectory) ? staffDirectory : [];
  const safeMerchantProducts = Array.isArray(merchantProducts) ? merchantProducts : [];
  const safeMerchantCustomers = Array.isArray(merchantCustomers) ? merchantCustomers : [];
  const currentOrder = safeOrders.find((order) => String(order.id) === String(currentOrderId)) || null;
  const currentPlan =
    currentOrder?.plan ||
    (currentPage === "plan" && currentOrder ? createEmptyPlan(currentOrder, getInitialPlanTypeForOrder(currentOrder)) : null);
  const planAreas = safeAreas(currentPlan);
  const currentArea = planAreas.find((area) => area.id === currentAreaId) || null;
  const currentStats = getPlanStats(currentPlan);
  const authUserEmail = session?.user?.email || "";
  const authAccount = useMemo(() => resolveAuthAccountByEmail(authUserEmail), [authUserEmail]);
  const currentStaff = safeStaffDirectory.find((member) => member.id === currentStaffId) || getStaffMemberById(currentStaffId) || (authAccount?.userType === "staff" ? authAccount : null) || getDefaultAssignedStaff();
  const currentOrganization = getOrganizationById(currentStaff?.organizationId);
  const currentMerchantUser = authAccount?.userType === "merchant" ? authAccount : merchantUsers[0];
  const canUseMerchant = ["owner", "admin", "manager"].includes(authRole);
  const activeStaffMembers = useMemo(() => {
    const members = safeStaffDirectory;
    const organizationId = currentMerchantUser?.organizationId;
    return organizationId ? members.filter((member) => member.organizationId === organizationId) : members;
  }, [safeStaffDirectory, currentMerchantUser?.organizationId]);

  const assignableStaffMembers = useMemo(() => {
    return activeStaffMembers.filter(canAssignStaff);
  }, [activeStaffMembers]);

  const staffScopedOrders = useMemo(() => {
    return safeOrders.filter((order) => {
      const assignedStaffId = String(order.assignedStaffId || "").trim();
      const isPublicOrder = !assignedStaffId || ["public", "all"].includes(assignedStaffId);
      return isPublicOrder || assignedStaffId === currentStaff?.id;
    });
  }, [safeOrders, currentStaff?.id]);

  const filteredStaffOrders = useMemo(() => {
    const statuses = getStaffStatuses(activeStaffTab);
    return staffScopedOrders.filter((order) => statuses.includes(classifyOrderStatus(order.status)));
  }, [staffScopedOrders, activeStaffTab]);

  const merchantOrders = useMemo(() => {
    const keyword = merchantSearchText.trim();
    const baseOrders =
      merchantStatusFilter === "全部"
        ? safeOrders
        : safeOrders.filter((order) => order.status === merchantStatusFilter || classifyOrderStatus(order.status) === merchantStatusFilter);

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
  }, [safeOrders, merchantStatusFilter, merchantSearchText]);

  const pendingMerchantConfirmOrders = useMemo(() => {
    return safeOrders.filter((order) => order.status === "待商户确认");
  }, [safeOrders]);

  const pendingArchiveOrders = useMemo(() => {
    return safeOrders.filter((order) => order.status === "待商户归档");
  }, [safeOrders]);

  const submittedOrders = useMemo(() => {
    return safeOrders.filter((order) =>
      ["待商户确认", "方案已确认", "执行中", "待商户归档", "已完成"].includes(order.status)
    );
  }, [safeOrders]);

  const monitoredOrders = useMemo(() => {
    return safeOrders.filter((order) =>
      ["方案已确认", "执行中", "待商户归档"].includes(order.status)
    );
  }, [safeOrders]);

  const filteredProducts = safeMerchantProducts.filter((product) => {
    const keyword = searchText.trim();
    const visible = product.status !== "停用" && product.status !== "未上架";
    const matchCategory = activeCategory === "全部商品" || product.category === activeCategory;
    const matchSubCategory = activeSubCategory === "全部规格" || product.subCategory === activeSubCategory;
    const text = [product.name, product.category, product.subCategory, product.description, product.note].filter(Boolean).join(" ");

    if (!visible) return false;
    if (keyword) return text.includes(keyword);
    return matchCategory && matchSubCategory;
  });

  const allCustomers = useMemo(() => mergeCustomers(safeMerchantCustomers, safeOrders), [safeMerchantCustomers, safeOrders]);

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
  const customerViewOrder = safeOrders.find((order) => order.plan?.id === customerPlanId) || null;

  useEffect(() => {
    if (window.location.pathname === "/" && !customerPlanId) {
      window.history.replaceState(null, "", "/admin");
      setActiveRole("merchant");
    }
  }, [customerPlanId]);

  useEffect(() => {
    if (appShellMode === "admin" && activeRole !== "merchant") {
      setActiveRole("merchant");
    }
    if (appShellMode === "staff" && activeRole !== "staff") {
      setActiveRole("staff");
    }
  }, [appShellMode, activeRole]);

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
    persistStaffDirectoryToLocalStore(staffDirectory);
  }, [staffDirectory]);

  useEffect(() => {
    if (!APP_PAGES.includes(currentPage)) {
      console.error("未知页面，已回退：", currentPage);
      setCurrentPage("orders");
    }
    if (!STAFF_TABS.includes(activeStaffTab)) {
      console.error("未知员工任务标签，已回退：", activeStaffTab);
      setActiveStaffTab("待接单");
    }
    if (!STAFF_APP_TABS.includes(staffAppTab)) {
      console.error("未知员工页面标签，已回退：", staffAppTab);
      setStaffAppTab("首页");
    }
    if (!MERCHANT_TABS.includes(merchantTab)) {
      console.error("未知商户页面标签，已回退：", merchantTab);
      setMerchantTab("工作台");
    }
  }, [currentPage, activeStaffTab, staffAppTab, merchantTab]);

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

    if (appShellMode === "admin") {
      setActiveRole("merchant");
      return;
    }

    if (appShellMode === "staff") {
      setActiveRole("staff");
      if (account?.id && getStaffMemberById(account.id)) {
        setCurrentStaffId(account.id);
      }
      return;
    }

    if (account?.userType === "merchant" || ["owner", "admin", "manager"].includes(nextRole)) {
      setActiveRole("merchant");
      return;
    }

    setActiveRole("staff");
    if (account?.id && getStaffMemberById(account.id)) {
      setCurrentStaffId(account.id);
    }
  }, [session, appShellMode]);

  useEffect(() => {
    persistStaffAvatarToLocalStore(currentStaffId, staffAvatar);
  }, [currentStaffId, staffAvatar]);

  useEffect(() => {
    persistCurrentStaffIdToLocalStore(currentStaffId);
  }, [currentStaffId]);

  useEffect(() => {
    let cancelled = false;

    async function syncStaffDirectoryAvatarsFromCloud() {
      if (!session) return;

      const profiles = await loadStaffAvatarProfilesFromCloud();
      if (cancelled || profiles.length === 0) return;

      const avatarByStaffId = new Map(profiles.map((profile) => [profile.staff_id, profile.avatar_url]));
      setStaffDirectory((members) =>
        members.map((member) => {
          const avatarUrl = avatarByStaffId.get(member.id);
          return avatarUrl
            ? normalizeStaffMember({ ...member, avatar: avatarUrl, avatarUrl, updatedAt: nowText() })
            : member;
        })
      );

      const currentAvatarUrl = avatarByStaffId.get(currentStaffId);
      if (currentAvatarUrl) {
        setStaffAvatar(currentAvatarUrl);
      }
    }

    syncStaffDirectoryAvatarsFromCloud();
    return () => {
      cancelled = true;
    };
  }, [session, currentStaffId]);

  useEffect(() => {
    let cancelled = false;

    async function syncStaffAvatarFromCloud() {
      if (!currentStaffId) return;

      setStaffAvatarError("");
      const localProfileAvatar = getStaffAvatar(currentStaff) || loadStaffAvatarFromLocalStore(currentStaffId);
      const profileAvatarUrl = await loadStaffAvatarProfileFromCloud(currentStaffId);

      if (cancelled) return;

      if (profileAvatarUrl) {
        setStaffAvatar(profileAvatarUrl);
        setStaffDirectory((members) =>
          members.map((member) =>
            member.id === currentStaffId
              ? normalizeStaffMember({ ...member, avatar: profileAvatarUrl, avatarUrl: profileAvatarUrl, updatedAt: nowText() })
              : member
          )
        );
        return;
      }

      const deterministicCloudUrl = getStaffAvatarPublicUrl(currentStaffId, Date.now());
      if (await publicImageExists(deterministicCloudUrl)) {
        if (cancelled) return;
        setStaffAvatar(deterministicCloudUrl);
        return;
      }

      if (localProfileAvatar && !cancelled) {
        setStaffAvatar(localProfileAvatar);
      }
    }

    syncStaffAvatarFromCloud();
    return () => {
      cancelled = true;
    };
  }, [currentStaffId, currentStaff?.avatarUrl, currentStaff?.avatar]);

  useEffect(() => {
    activeViewRef.current = {
      currentPage,
      activeRole,
      merchantViewingOrderId: merchantViewingOrder?.id || null,
      selectedOrderDetailId: selectedOrderDetail?.id || null,
    };
  }, [currentPage, activeRole, merchantViewingOrder?.id, selectedOrderDetail?.id]);

  useEffect(() => {
    if (["plan", "completeUpload", "archiveDetail", "serviceRecord"].includes(currentPage) && !currentOrder) setCurrentPage("orders");
    if (currentPage === "plan" && currentOrder && !currentOrder.plan) {
      const initialPlanType = getInitialPlanTypeForOrder(currentOrder);
      updateOrder(currentOrder.id, { planType: initialPlanType, plan: createEmptyPlan(currentOrder, initialPlanType) }, "方案已创建");
    }
    if (showProductSheet && !currentArea) setShowProductSheet(false);
  }, [currentPage, currentOrder, showProductSheet, currentArea]);

    useEffect(() => {
    if (activeRole !== "staff") return;
    if (!["plan", "completeUpload", "archiveDetail", "serviceRecord"].includes(currentPage)) return;

    const targetOrder =
      currentOrder || safeOrders.find((order) => order.id === currentOrderId) || null;

    if (targetOrder) {
      setActiveStaffTab(getStaffTabByOrderStatus(targetOrder.status));
    }

    setStaffAppTab("任务");
    setShowDetailBlock(false);
  }, [activeRole, currentPage, currentOrder, currentOrderId, safeOrders]);

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
    if (!staffId || staffId === "public" || staffId === "all") {
      updateOrder(
        orderId,
        (order) =>
          addTimeline(
            {
              ...order,
              assignedStaffId: "",
              assignedStaffName: "所有员工（公共任务）",
              assignedStaffEmail: "",
            },
            "商户将订单设为公共任务"
          ),
        "订单派单员工已同步"
      );
      return;
    }

    const staff = staffDirectory.find((member) => member.id === staffId) || getStaffMemberById(staffId) || getDefaultAssignedStaff();
    if (!staff) return;
    if (!canAssignStaff(staff)) {
      alert("该员工当前不可接单，请选择已启用且未暂停接单的员工。");
      return;
    }

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

  function openInviteStaffSheet() {
    const nextStaffNo = generateNextStaffNo(staffDirectory);
    setStaffInviteForm(createStaffForm(nextStaffNo));
    setStaffFormError("");
    setLastInviteCode("");
    setShowInviteStaffSheet(true);
  }

  function openManageStaff(member) {
    setEditingStaffId(member.id);
    setEditingStaffForm({
      name: member.name || "",
      phone: member.phone || "",
      email: member.email || "",
      staffNo: member.staffNo || "",
      role: member.role || "staff",
      area: member.area || "杭州 / 滨江",
      orderPermission: member.orderPermission || "public",
      status: member.status || "active",
      avatar: member.avatar || "",
      avatarUrl: member.avatarUrl || member.avatar || "",
    });
    setStaffFormError("");
    setLastInviteCode("");
  }

  function closeManageStaff() {
    setEditingStaffId(null);
    setEditingStaffForm(null);
    setStaffFormError("");
  }

  function saveEditingStaff() {
    if (!editingStaffId || !editingStaffForm) return;

    const staffNo = editingStaffForm.staffNo.trim().toUpperCase();
    if (!staffNo) {
      setStaffFormError("请填写工号。");
      return;
    }
    if (isStaffNoTaken(staffDirectory, staffNo, editingStaffId)) {
      setStaffFormError("该工号已被占用，请换一个工号。");
      return;
    }

    setStaffDirectory((members) =>
      members.map((member) =>
        member.id === editingStaffId
          ? normalizeStaffMember({
              ...member,
              ...editingStaffForm,
              staffNo,
              name: editingStaffForm.name.trim() || member.name,
              phone: editingStaffForm.phone.trim(),
              email: editingStaffForm.email.trim(),
              area: editingStaffForm.area.trim() || "杭州 / 滨江",
              updatedAt: nowText(),
            })
          : member
      )
    );

    if (editingStaffId === currentStaffId && editingStaffForm.avatar) {
      setStaffAvatar(editingStaffForm.avatarUrl || editingStaffForm.avatar);
    }

    closeManageStaff();
  }

  async function handleStaffAvatarUpload(file) {
    setIsUploadingStaffAvatar(true);
    setStaffAvatarError("");
    setStaffAvatarStatus("正在读取头像…");

    try {
      const avatarBlob = await createCompressedAvatarBlob(file);
      const localPreviewUrl = await readBlobAsDataUrl(avatarBlob);
      const staffId = currentStaff?.id || currentStaffId || DEFAULT_STAFF_ID;

      setStaffAvatar(localPreviewUrl);
      setStaffDirectory((members) =>
        members.map((member) =>
          member.id === staffId
            ? { ...member, avatar: localPreviewUrl, updatedAt: nowText() }
            : member
        )
      );
      setStaffAvatarStatus("已在本机更新，正在同步云端…");

      

      let avatarUrl = "";
      try {
        avatarUrl = await uploadStaffAvatarToCloud(staffId, avatarBlob);
      } catch (uploadError) {
        setStaffAvatarError(getStaffAvatarCloudErrorMessage(uploadError));
        setStaffAvatarStatus("已在本机更新头像");
        return;
      }

      const previewUrl = withAvatarCacheBust(avatarUrl);
      if (!(await publicImageExists(previewUrl))) {
        setStaffAvatarError(`已在本机更新头像。云端文件已上传，但公开地址暂不可读取，请确认 ${STAFF_AVATAR_BUCKET} 是 public bucket。`);
        setStaffAvatarStatus("已在本机更新头像");
        return;
      }

      setStaffAvatar(previewUrl);
      setStaffDirectory((members) =>
        members.map((member) =>
          member.id === staffId
            ? normalizeStaffMember({ ...member, avatar: avatarUrl, avatarUrl, updatedAt: nowText() })
            : member
        )
      );

      try {
        await saveStaffAvatarProfileToCloud(
  currentStaff || { id: staffId, name: "张三", email: "1464155122@qq.com" },
  avatarUrl
);
        setStaffAvatarStatus("头像已同步到云端");
      } catch (profileError) {
        console.warn("头像已上传，但 staff_profiles 资料表暂未写入：", profileError);
        setStaffAvatarError("头像文件已上传，但员工资料 avatarUrl 未保存。需要配置 Supabase staff_profiles 表或写入权限。");
        setStaffAvatarStatus("需要配置 Supabase Storage / 员工资料表");
      }

    } catch (error) {
      console.error("员工头像上传失败：", error);
      setStaffAvatarError(error?.message || "头像上传失败，请稍后重试。");
      setStaffAvatarStatus("");
    } finally {
      setIsUploadingStaffAvatar(false);
    }
  }

  function handleStaffAvatarImageError() {
    setStaffAvatar("");
    setStaffAvatarError("头像加载失败，已切回默认头像。");
  }

  function sendStaffInvite() {
    const staffNo = staffInviteForm.staffNo.trim().toUpperCase();
    const name = staffInviteForm.name.trim();
    if (!name) {
      setStaffFormError("请填写员工姓名。");
      return;
    }
    if (!staffNo) {
      setStaffFormError("请填写工号。");
      return;
    }
    if (isStaffNoTaken(staffDirectory, staffNo)) {
      setStaffFormError("该工号已被占用，请换一个工号。");
      return;
    }

    const inviteCode = `INVITE-${staffNo}`;
    const newStaff = normalizeStaffMember({
      ...staffInviteForm,
      id: `staff-${Date.now()}`,
      staffNo,
      name,
      phone: staffInviteForm.phone.trim(),
      email: staffInviteForm.email.trim(),
      area: staffInviteForm.area.trim() || "杭州 / 滨江",
      status: "invited",
      organizationId: currentMerchantUser?.organizationId || organizations[0]?.id || "org-001",
      inviteCode,
      createdAt: nowText(),
      updatedAt: nowText(),
      lastLoginAt: "",
    });

    setStaffDirectory((members) => [newStaff, ...members]);
    setLastInviteCode(inviteCode);
    setStaffFormError("");
    setStaffInviteForm(createStaffForm(generateNextStaffNo([...staffDirectory, newStaff])));
  }

  function replaceAllOrders(nextOrders) {
    const normalized = normalizeOrders(nextOrders);
    setOrders(normalized);
    return normalized;
  }

  async function refreshOrdersFromCloud() {
    setSyncState("同步中");
    setSyncMessage("正在读取最新订单...");

    try {
      const [cloudOrders, cloudProducts] = await Promise.all([
        fetchOrdersFromCloud(),
        fetchProductsFromCloud().catch(() => []),
      ]);

      if (cloudProducts.length > 0) {
        setMerchantProducts(cloudProducts);
      }

      if (cloudOrders.length === 0) {
        setSyncState("暂无数据");
        setSyncMessage("暂无订单。可以先在商户端创建订单，或点击“同步当前数据”。");
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

      const viewState = activeViewRef.current;
      const isReadingDetail =
        ["plan", "completeUpload", "archiveDetail"].includes(viewState.currentPage) ||
        Boolean(viewState.merchantViewingOrderId || viewState.selectedOrderDetailId);

      if (cloudOrders.length > 0) {
        const normalizedOrders = normalizeOrders(cloudOrders);
        if (!isReadingDetail) {
          setOrders((prevOrders) => {
            const prevText = JSON.stringify(prevOrders);
            const nextText = JSON.stringify(normalizedOrders);
            return prevText === nextText ? prevOrders : normalizedOrders;
          });
          setMerchantCustomers((prev) => mergeCustomers(prev, normalizedOrders));
        }
      }

      if (cloudProducts.length > 0) {
        const normalizedProducts = normalizeProducts(cloudProducts);
        if (!isReadingDetail) {
          setMerchantProducts((prevProducts) => {
            const prevText = JSON.stringify(prevProducts);
            const nextText = JSON.stringify(normalizedProducts);
            return prevText === nextText ? prevProducts : normalizedProducts;
          });
        }
      }

      setAutoSyncState(`${reason}${isReadingDetail ? "（详情浏览中未打断）" : ""}：${nowText().slice(11)}`);
    } catch (error) {
      console.error("自动同步失败：", error);
      setAutoSyncState("自动同步失败，手动刷新兜底");
    }
  }

  async function uploadLocalOrdersToCloud() {
    setSyncState("同步中");
    setSyncMessage("正在同步当前订单...");

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
    if (!order) {
      setSyncMessage("暂无方案内容。");
      setMerchantViewingOrder(null);
      return;
    }
    setMerchantViewingOrder(ensureOrderDefaults(order));
    setSelectedOrderDetail(null);
    setMerchantTab("工作台");
    setMerchantStatusFilter(order.status || "全部");
  }

  function backToMerchantHome(message) {
    setSelectedOrderDetail(null);
    setMerchantViewingOrder(null);
    setMerchantTab("工作台");
    setMerchantStatusFilter("全部");
    if (message) setSyncMessage(message);
  }

  function switchRole(role) {
    if (isPathRoleLocked && !showRoleSwitch) return;
    // Demo mode allows switching between staff and merchant workspaces.
    setActiveRole(role);
    setCurrentPage("orders");
    setCurrentOrderId(null);
    resetSheets();
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSession(null);
    setActiveRole(getInitialRoleByPath());
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
        const shouldClaimPublicOrder = !order.assignedStaffId || ["public", "all"].includes(String(order.assignedStaffId));
        const next = {
          ...order,
          status: "配置中",
          planStatus: "配置中",
          merchantConfirmStatus: "未提交",
          executionStatus: "已联系",
          assignedStaffId: shouldClaimPublicOrder ? currentStaff?.id || "" : order.assignedStaffId,
          assignedStaffName: shouldClaimPublicOrder ? currentStaff?.name || order.assignedStaffName || "" : order.assignedStaffName,
          assignedStaffEmail: shouldClaimPublicOrder ? currentStaff?.email || order.assignedStaffEmail || "" : order.assignedStaffEmail,
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
    if (!order?.id) return;

    const safeOrder = ensureOrderDefaults(order);

    if (!safeOrder.plan) {
      const initialPlanType = getInitialPlanTypeForOrder(safeOrder);
      updateOrder(safeOrder.id, { planType: initialPlanType, plan: createEmptyPlan(safeOrder, initialPlanType) }, "方案已创建");
    }

    setCurrentOrderId(safeOrder.id);
    setCurrentPage("plan");
    setShowDetailBlock(false);
    setCompleteForm({ scenePhotos: ["", "", ""], plantPhotos: ["", "", ""], remark: "" });
  }

  function openCompleteUploadForOrder(order) {
    if (!order?.id) return;

    const safeOrder = ensureOrderDefaults(order);
    const completePhotos = safeOrder.completePhotos || {};
    const padPhotos = (values) => [...safePhotos(values), "", "", ""].slice(0, 3);

    setCurrentOrderId(safeOrder.id);
    setCompleteForm({
      scenePhotos: padPhotos(completePhotos.scenePhotos),
      plantPhotos: padPhotos(completePhotos.plantPhotos),
      remark: completePhotos.remark || "",
    });
    setCurrentPage("completeUpload");
    setShowDetailBlock(false);
  }

  function openArchiveDetailForOrder(order) {
    if (!order?.id) return;

    setCurrentOrderId(order.id);
    setCurrentPage("archiveDetail");
    setShowDetailBlock(false);
  }

  function openServiceRecordForOrder(order) {
    openArchiveDetailForOrder(order);
  }

  function openCreateOrderSheet() {
    const firstStaff = assignableStaffMembers[0] || activeStaffMembers.find(canAssignStaff) || getDefaultAssignedStaff();

    setNewOrderForm((form) => ({
      ...form,
      tagsText: form.tagsText || "",
      serviceType: form.serviceType || "租赁",
      assignedStaffId: canAssignStaff(activeStaffMembers.find((member) => member.id === form.assignedStaffId))
        ? form.assignedStaffId
        : firstStaff?.id || "",
      communicationQrUrl: form.communicationQrUrl || "",
    }));
    setIsCreateOrderInputFocused(false);
    setShowCreateOrderSheet(true);
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
          status: "执行中",
          planStatus: "执行中",
          merchantConfirmStatus: "已确认",
          merchantConfirmedAt: nowText(),
          executionStatus: "待执行",
          plan: order.plan
            ? {
                ...order.plan,
                status: "执行中",
                merchantConfirmedAt: nowText(),
              }
            : order.plan,
        };

        return addTimeline(next, "商户确认方案，订单进入执行中");
      },
      "商户确认已同步"
    );

    backToMerchantHome("方案已确认，订单已进入执行中。员工端刷新后可直接处理执行任务。");
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
    const isPublicAssignment = !newOrderForm.assignedStaffId || ["public", "all"].includes(String(newOrderForm.assignedStaffId));
    const assignedStaff = isPublicAssignment
      ? null
      : staffDirectory.find((member) => member.id === newOrderForm.assignedStaffId) ||
        getStaffMemberById(newOrderForm.assignedStaffId);

    if (!isPublicAssignment && (!assignedStaff || !canAssignStaff(assignedStaff))) {
      alert("请先选择已启用且未暂停接单的员工。");
      return;
    }
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
      merchantDraft: Boolean(
        newOrderForm.areaSize.trim() ||
        newOrderForm.plannedPlantCount.trim() ||
        newOrderForm.budget.trim() ||
        newOrderForm.areaNote.trim()
      ),
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
      tags: tags.length ? tags : [],
      products: [],
      photos: [],
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
      assignedStaffId: isPublicAssignment ? "" : assignedStaff?.id || "",
      assignedStaffName: isPublicAssignment ? "所有员工（公共任务）" : assignedStaff?.name || "",
      assignedStaffEmail: isPublicAssignment ? "" : assignedStaff?.email || "",
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
      assignedStaffId: assignableStaffMembers[0]?.id || DEFAULT_STAFF_ID,
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
      description: newProductForm.description.trim() || "暂无描述，可在商品库补充。",
      pricePerDay: price,
      // Image upload integration can replace preview data with a remote URL.
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
售后养护：${plan?.retailNeedsMaintenance ? `需要，${plan?.retailMaintenanceNote || "待确认"}` : "当前不需要"}
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
            <strong>业务数据</strong>
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
              <span>{syncMessage}｜页面打开后会自动同步订单和商品，也可以手动刷新。</span>
            </div>

            <div className="actions">
              <button className="ghost-button" onClick={refreshOrdersFromCloud}>
                刷新订单
              </button>
              <button className="ghost-button" onClick={uploadLocalOrdersToCloud}>
                同步当前数据
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
    order = ensureOrderDefaults(order);
    const stats = getPlanStats(order.plan);
    const hint = getOrderHint(order);

    if (mode === "staff") {
  const statusGroup = classifyOrderStatus(order.status);
  const isPending = statusGroup === "待接单";
  const canBuild = statusGroup === "做方案";
  const canExecute = statusGroup === "执行中";
  const isServiceRecord = statusGroup === "已完成";
  const orderSignals = getOrderSignalTags(order);

  const statusClass = isPending
    ? "pending"
    : canBuild
      ? "build"
      : canExecute
        ? "execute"
        : statusGroup === "已完成" && order.status !== "待商户归档"
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
          <strong className="staff-price">¥{money(stats.finalRent)}</strong>
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
        ) : isServiceRecord ? (
          <>
            <button className="staff-ghost-action" onClick={() => openRouteNavigation(order.address)}>
              导航
            </button>
            <button
              className="staff-primary-action"
              onClick={() => openArchiveDetailForOrder(order)}
            >
              服务记录 / 归档详情
            </button>
          </>
        ) : canExecute ? (
          <>
            <button className="staff-ghost-action" onClick={() => openRouteNavigation(order.address)}>
              导航
            </button>
            <button className="staff-ghost-action" onClick={() => openPlanForOrder(order)}>
              查看方案
            </button>
            <button
              className="staff-primary-action"
              onClick={() => openCompleteUploadForOrder(order)}
            >
              上传现场照片
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
                openPlanForOrder(order);
              }}
            >
              {canBuild ? (order.plan ? "查看 / 修改方案" : "现场创建方案") : "查看详情"}
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
            <strong>¥{money(stats.finalRent)}</strong>
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

  function ExtraDetails({ order, editable = false, hideNotes = false }) {
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

        {!hideNotes && <NotesCard order={order} editable={editable} />}
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
                placeholder="例如：可推荐季度养护套餐"
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
      [group]: (Array.isArray(form[group]) ? form[group] : ["", "", ""]).map((item, i) => (i === index ? value : item)),
    }));
  }

  function updateCompletePhotos(group, values) {
    setCompleteForm((form) => ({
      ...form,
      [group]: (Array.isArray(values) ? values : []).slice(0, 3),
    }));
  }

  function renderPhotoUploadBlock(title, group, tip) {
    const values = Array.isArray(completeForm[group]) ? completeForm[group] : ["", "", ""];
    return (
      <section className="plan-summary-card staff-complete-upload-card" style={{ padding: 18 }}>
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
    if (!currentOrder) {
      return (
        <div className="app staff-legacy-page staff-complete-page">
          <section className="empty-card">
            <p>页面加载失败</p>
            <span>当前页面数据不完整，请返回工作台后重试。</span>
            <button className="staff-legacy-secondary" onClick={() => setCurrentPage("orders")}>返回任务</button>
          </section>
        </div>
      );
    }
    return (
      <div className="app staff-legacy-page staff-complete-page">
        <header className="plan-header">
          <button className="back-button" onClick={() => setCurrentPage(currentPlan ? "plan" : "orders")}>←</button>
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

        <nav className="bottom-actions staff-complete-actions">
          <button onClick={() => setCurrentPage(currentPlan ? "plan" : "orders")}>返回方案</button>
          <button onClick={() => copyCustomerPlanLink(currentOrder)}>客户链接</button>
          <button className="submit-plan-button" onClick={submitCompleteUpload}>提交完成</button>
        </nav>
      </div>
    );
  }

  function renderArchiveDetailPage() {
    if (!currentOrder) {
      return (
        <div className="app staff-legacy-page staff-archive-page">
          <section className="empty-card">
            <p>页面加载失败</p>
            <span>当前页面数据不完整，请返回工作台后重试。</span>
          </section>
        </div>
      );
    }

    const orderPlan = currentOrder.plan || null;
    const stats = getPlanStats(orderPlan);
    const completePhotos = currentOrder.completePhotos || {};
    const scenePhotos = safePhotos(completePhotos.scenePhotos);
    const plantPhotos = safePhotos(completePhotos.plantPhotos);
    const productCount = getPlanStats(orderPlan).productCount || 0;
    const completedAt = currentOrder.completedAt || orderPlan?.completedAt || currentOrder.archivedAt || "暂无服务记录";

    return (
      <div className="app staff-legacy-page staff-archive-page">
        <header className="plan-header">
          <button className="back-button" onClick={() => setCurrentPage("orders")}>←</button>
          <div>
            <p className="eyebrow">Service Record</p>
            <h1>服务记录 / 归档详情</h1>
          </div>
        </header>

        <section className="plan-summary-card">
          <div className="plan-summary-top">
            <div><p>客户项目</p><strong>{currentOrder.customerName || "暂无内容"}</strong></div>
            <div><p>当前状态</p><strong>{currentOrder.status || "暂无内容"}</strong></div>
          </div>
          <div className="plan-info-line"><span>方案类型</span><strong>{orderPlan?.planType || currentOrder.planType || "暂无内容"}</strong></div>
          <div className="plan-info-line"><span>商品数量</span><strong>{productCount ? `${productCount} 件` : "暂无服务记录"}</strong></div>
          <div className="plan-info-line"><span>联系人</span><strong>{currentOrder.contactName || "暂无内容"} {currentOrder.phone ? `｜${currentOrder.phone}` : ""}</strong></div>
          <div className="plan-info-line"><span>地址</span><strong>{currentOrder.address || "暂无内容"}</strong></div>
          <div className="plan-info-line"><span>最终报价</span><strong>¥{money(stats.finalRent)}</strong></div>
          <div className="plan-info-line"><span>完成时间</span><strong>{completedAt}</strong></div>
        </section>

        <section className="plan-summary-card">
          <div className="section-title-row">
            <div><p className="eyebrow">Photos</p><h2>现场记录</h2></div>
          </div>
          {[...scenePhotos, ...plantPhotos].length === 0 ? (
            <div className="empty-card"><p>暂无现场图片</p><span>员工上传完成资料后会显示在这里。</span></div>
          ) : (
            <div className="merchant-photo-grid">
              {[...scenePhotos, ...plantPhotos].slice(0, 6).map((photo, index) => (
                <img key={`${photo}-${index}`} src={photo} alt={`现场照片 ${index + 1}`} />
              ))}
            </div>
          )}
          <div className="plan-info-line"><span>完成备注</span><strong>{completePhotos.remark || currentOrder.fieldNote || "暂无内容"}</strong></div>
        </section>

        <NotesCard order={currentOrder} />
        <TimelineCard order={currentOrder} />
      </div>
    );
  }

  function renderServiceRecordPage() {
    return renderArchiveDetailPage();
  }

  function renderCustomerPlanView() {
    if (!customerPlanId) return null;

    if (!customerViewOrder) {
      return (
        <div className="app">
          <section className="empty-card">
            <p>没有找到这个方案</p>
            <span>请刷新订单后重试，或联系商户确认方案链接是否正确。</span>
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
              <div><span>{isRetailPlan ? "商品金额" : "日租金"}</span><strong>¥{money(stats.dailyRent)}</strong></div>
              {!isRetailPlan && <div><span>租期</span><strong>{customerViewOrder.plan?.leaseMonths || 12} 月</strong></div>}
              <div><span>{isRetailPlan ? "系统建议总价" : "系统预计总租金"}</span><strong>¥{money(stats.systemTotalRent)}</strong></div>
            </>
          )}
          <div><span>最终报价</span><strong>¥{money(stats.finalRent)}</strong></div>
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
                      <span>¥{money(item.pricePerDay)}{isRetailPlan ? "/件" : "/天"} × {item.quantity}</span>
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
    if (!currentOrder || !currentPlan) {
      return (
        <div className="app staff-legacy-page staff-plan-page">
          <section className="empty-card">
            <p>暂无方案内容</p>
            <span>当前订单方案数据不足，请返回任务列表重新进入。</span>
            <button className="staff-legacy-secondary" onClick={() => setCurrentPage("orders")}>返回任务</button>
          </section>
        </div>
      );
    }

    const videoBlue = "#405a38";
    const selectedRows = planAreas.flatMap((area) =>
      safeItems(area).map((item) => ({ ...item, areaId: area.id, areaName: area.name }))
    );
    const isRetailPlan = currentPlan?.planType === "零售方案";
    const isMaintenancePlan = currentPlan?.planType === "养护服务";
    const hasUsefulPrefillText = (value) => {
      const text = String(value || "").trim();
      return Boolean(text && !["暂无内容", "待确认"].includes(text));
    };
    const hasMerchantPrefill = Boolean(
      currentPlan?.merchantDraft ||
      currentPlan?.merchantDraftNote ||
      hasUsefulPrefillText(currentOrder?.budget) ||
      hasUsefulPrefillText(currentOrder?.areaNote) ||
      hasUsefulPrefillText(currentOrder?.plannedPlantCount) ||
      hasUsefulPrefillText(currentOrder?.areaSize)
    );

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
    const planStatusPillStyle = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 999,
      padding: "4px 10px",
      background: "rgba(250, 247, 238, 0.92)",
      border: "1px solid rgba(87, 108, 70, 0.18)",
      color: "#46583d",
      fontSize: 12,
      fontWeight: 900,
      whiteSpace: "nowrap",
    };
    const planAmountCardStyle = {
      background: "rgba(250, 247, 238, 0.94)",
      border: "1px solid rgba(87, 108, 70, 0.16)",
      borderRadius: 14,
      padding: 12,
      boxShadow: "0 10px 24px rgba(53, 61, 43, 0.06)",
    };
    const planAmountLabelStyle = {
      color: "#7f755f",
      fontSize: 12,
      fontWeight: 800,
    };
    const planAmountValueStyle = {
      display: "block",
      marginTop: 4,
      color: "#20261f",
      fontSize: 18,
      fontWeight: 900,
    };
    const finalQuoteFieldStyle = {
      display: "flex",
      alignItems: "center",
      gap: 14,
      width: "100%",
      boxSizing: "border-box",
      background: "rgba(250, 247, 238, 0.94)",
      border: "1px solid rgba(87, 108, 70, 0.18)",
      borderRadius: 16,
      padding: "9px 16px",
      boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.58)",
    };

    return (
      <div className="staff-legacy-page staff-plan-page" style={pageStyle}>
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
            <span style={planStatusPillStyle}>{currentOrder.status}</span>
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
          <div className="empty-card" style={{ marginTop: 12, textAlign: "left" }}>
            <p>{hasMerchantPrefill ? "商户已预填方案信息" : "暂无预填方案"}</p>
            <span>{hasMerchantPrefill ? "可根据现场情况微调区域、物料、数量和报价。" : "员工可根据现场情况创建方案。"}</span>
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
            <button style={{ width: "100%", border: 0, borderRadius: 10, background: videoBlue, color: "#fff", fontWeight: 900, padding: "13px 14px" }} onClick={() => openCompleteUploadForOrder(currentOrder)}>完成任务并上传照片</button>
          </section>
        )}

        {!isMaintenancePlan && (
        <section style={cardStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid #e7edf4", marginBottom: 12 }}>
            <button style={tabStyle(true)}>植物</button>
            <button style={tabStyle(false)} onClick={() => alert("当前版本暂不支持花盆库。")}>花盆</button>
            <button style={tabStyle(false)} onClick={() => alert("当前版本暂不支持资材库。")}>资材</button>
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

          <div className="staff-material-card-flow">
            {selectedRows.length === 0 ? (
              <div className="empty-card"><p>暂无物料</p><span>先添加场景，再选择植物。</span></div>
            ) : selectedRows.map((item) => {
              const product = merchantProducts.find((p) => p.id === item.productId) || item;
              const image = getProductImage(product);
              return (
                <article className="staff-material-card" key={`${item.areaId}-${item.productId}`}>
                  <span className="staff-material-thumb">
                    {isImageUrl(image) ? <img src={image} alt={item.name} /> : image}
                  </span>
                  <div className="staff-material-info">
                    <strong>{item.name}</strong>
                    <em>{item.areaName}</em>
                    <small>¥{money(item.pricePerDay)}{currentPlan?.planType === "零售方案" ? "/件" : "/天"}</small>
                  </div>
                  <div className="staff-material-controls">
                    <span className="staff-material-stock">有货</span>
                    <input inputMode="numeric" type="number" value={item.quantity} min="1" onChange={(e) => {
                      const nextQty = Math.max(1, Number(e.target.value || 1));
                      updateOrderPlan(currentOrder.id, (plan) => ({
                        ...plan,
                        areas: safeAreas(plan).map((area) => area.id === item.areaId ? {
                          ...area,
                          items: safeItems(area).map((old) => old.productId === item.productId ? { ...old, quantity: nextQty } : old)
                        } : area),
                      }), "数量已同步");
                    }} />
                    <button className="staff-material-remove" onClick={() => removeItemFromArea(item.areaId, item.productId)}>删除</button>
                  </div>
                </article>
              );
            })}
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
                    <em>{pack.content}</em>
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
            <div style={planAmountCardStyle}>
              <span style={planAmountLabelStyle}>{currentPlan?.planType === "零售方案" ? "商品金额" : "预估日租金"}</span>
              <strong style={planAmountValueStyle}>¥{money(currentStats.dailyRent)}</strong>
            </div>
            <div style={planAmountCardStyle}>
              <span style={planAmountLabelStyle}>系统建议总价</span>
              <strong style={planAmountValueStyle}>¥{money(currentStats.systemTotalRent)}</strong>
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
              <p className="sheet-label">是否需要售后养护</p>
              <div className="option-grid payment-grid">
                <button className={currentPlan.retailNeedsMaintenance ? "selected" : ""} onClick={() => updateCurrentPlanField("retailNeedsMaintenance", true)}>需要售后养护</button>
                <button className={!currentPlan.retailNeedsMaintenance ? "selected" : ""} onClick={() => updateCurrentPlanField("retailNeedsMaintenance", false)}>当前不需要</button>
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
                      border: selected ? "1px solid #405a38" : "1px solid #d8e1ec",
                      background: selected ? "#405a38" : "#fff",
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
                      border: selected ? "1px solid #405a38" : "1px solid #d8e1ec",
                      background: selected ? "#405a38" : "#fff",
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
                  border: currentPlan.needDeposit ? "1px solid #405a38" : "1px solid #d8e1ec",
                  background: currentPlan.needDeposit ? "#eaf3ff" : "#fff",
                  color: currentPlan.needDeposit ? "#405a38" : "#526274",
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
                  border: !currentPlan.needDeposit ? "1px solid #405a38" : "1px solid #d8e1ec",
                  background: !currentPlan.needDeposit ? "#eaf3ff" : "#fff",
                  color: !currentPlan.needDeposit ? "#405a38" : "#526274",
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
            <span style={{ display: "block", color: "#7f755f", fontSize: 13, fontWeight: 800, marginBottom: 8 }}>实际销售报价 (元)</span>
            <label className="staff-final-quote-field" style={finalQuoteFieldStyle}>
              <span style={{ flex: "0 0 auto", color: "#46583d", fontSize: 17, fontWeight: 850, lineHeight: 1 }}>¥</span>
              <input
                className="staff-final-quote-input"
                type="number"
                value={currentPlan.customFinalRent || ""}
                onChange={(e) => updateCurrentPlanField("customFinalRent", e.target.value)}
                placeholder={`默认按 ¥${money(currentStats.systemTotalRent)}`}
                style={{ flex: 1, minWidth: 0, width: "100%", border: 0, background: "transparent", padding: "5px 0 5px 8px", textAlign: "left", fontSize: 16, fontWeight: 800, lineHeight: 1.35, color: "#20261f", outline: "none" }}
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

          {/* 2. 保留【客户链接】功能，使用 Garden Estate OS 次按钮 */}
          <button
            style={{ 
              border: "1px solid #405a38", 
              borderRadius: 10, 
              background: "#fff", 
              color: "#405a38", 
              fontWeight: 900, 
              padding: "13px 10px", 
              fontSize: 15 
            }}
            onClick={() => copyCustomerPlanLink(currentOrder)}
          >
            客户链接
          </button>
          
          {/* 3. 保留【提交方案】功能，使用 Garden Estate OS 主按钮 */}
          <button
            style={{ 
              border: 0, 
              borderRadius: 10, 
              background: "#405a38", 
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
    const videoBlue = "#405a38";
    const sheetStyle = {
      height: "92vh",
      maxHeight: "92vh",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      background: "linear-gradient(180deg, rgba(255, 252, 246, 0.98), rgba(246, 239, 226, 0.94))",
      borderRadius: "18px 18px 0 0",
      paddingBottom: "env(safe-area-inset-bottom)",
    };
    const topStyle = {
      flexShrink: 0,
      background: "linear-gradient(180deg, rgba(255, 252, 246, 0.96), rgba(250, 247, 238, 0.78))",
      borderBottom: 0,
      padding: "12px 14px 10px",
    };
    const searchWrapStyle = {
      background: "rgba(250, 247, 238, 0.92)",
      border: "1px solid rgba(87, 108, 70, 0.18)",
      borderRadius: 16,
      padding: "0 12px",
      margin: "12px 0 10px",
      boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.66)",
    };
    const selectorTitleStyle = {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12,
      padding: "2px 2px 0",
    };
    const selectorCloseStyle = {
      width: 36,
      height: 36,
      borderRadius: 999,
      border: "1px solid rgba(87, 108, 70, 0.14)",
      background: "rgba(255, 252, 246, 0.86)",
      color: "#46583d",
      fontSize: 21,
      fontWeight: 800,
      boxShadow: "0 8px 16px rgba(65, 55, 33, 0.08)",
    };
    const selectorSearchInputStyle = {
      width: "100%",
      height: 42,
      border: 0,
      borderRadius: 14,
      background: "transparent",
      padding: "0 2px",
      color: "#20261f",
      fontSize: 15,
      outline: "none",
    };
    const selectorPrimaryTabsStyle = {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 6,
      padding: 4,
      borderRadius: 16,
      background: "rgba(239, 242, 232, 0.66)",
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
            <div style={selectorTitleStyle}>
              <div>
                <p style={{ margin: 0, color: "#9a907d", fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 900 }}>Item Selector</p>
                <h2 style={{ margin: "4px 0 0", color: "#20261f", fontSize: 21, lineHeight: 1.18 }}>{currentArea?.name || "当前场景"}物料选择</h2>
              </div>
              <button style={selectorCloseStyle} onClick={() => setShowProductSheet(false)}>×</button>
            </div>
            <div style={searchWrapStyle}>
              <input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="搜索物料名称 / 规格 / 场景" style={selectorSearchInputStyle} />
            </div>
            <div style={selectorPrimaryTabsStyle}>
              {['植物', '花盆', '资材'].map((name) => (
                <button key={name} style={{ border: 0, borderRadius: 13, background: name === '植物' ? "rgba(255, 252, 246, 0.96)" : "transparent", padding: "10px 0", color: name === '植物' ? "#405a38" : "#6f7668", fontWeight: 900, boxShadow: name === '植物' ? "0 8px 16px rgba(65, 55, 33, 0.08)" : "none" }} onClick={() => name !== '植物' && alert(`当前版本暂不支持${name}库。`)}>{name}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingTop: 10 }}>
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
                      <b style={{ display: "block", color: videoBlue, marginTop: 5 }}>{currentPlan?.planType === "零售方案" ? `¥${money(product.pricePerDay)}/件` : `¥${money(product.pricePerDay)}/天`}</b>
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
              已选 {getAreaProductCount(currentArea)} 件｜{currentPlan?.planType === "零售方案" ? "商品金额" : "日租金"} ¥{money(getAreaDailyRent(currentArea))}｜完成选品
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
            background: "#405a38",
            color: "#fff",
            borderColor: "#405a38",
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

            <div className="rent-preview"><span>最终报价</span><strong>¥{money(currentStats.finalRent)}</strong></div>
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
              <span>当前按商品单价 × 数量统计，可作为商户报价参考。</span>
            </div>

            <div className="rent-preview"><span>商品金额</span><strong>¥{money(currentStats.systemTotalRent)}</strong></div>
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

          <div className="rent-preview"><span>预计总租金</span><strong>¥{money(currentStats.systemTotalRent)}</strong></div>
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
            <div className="price-preview-line"><span>{isMaintenancePlan ? "最终报价由商户手动填写" : "按当前商品和租期自动计算"}</span><strong>¥{money(currentStats.finalRent)}</strong></div>
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
            {[currentStats.systemTotalRent, 1980, 2880, 3880].map((price) => (
              <button key={price} onClick={() => updateCurrentPlanField(isMaintenancePlan ? "maintenanceFinalPrice" : "customFinalRent", String(price))}>¥{money(price)}</button>
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
            <div className="confirm-row"><span>最终报价</span><strong>¥{money(currentStats.finalRent)}</strong></div>
          </div>

          {currentStats.productCount === 0 && (
            <div className="rent-preview"><span>提醒</span><strong>当前还没有添加商品，请补充方案明细后再提交</strong></div>
          )}

          <button className="submit-sheet-button" onClick={submitPlan}>确认提交给商户</button>
        </section>
      </div>
    );
  }

  // ===================== 【起点】替换整个商户端渲染逻辑 =====================
  function renderMerchantPage() {
    const safeMerchantOrders = Array.isArray(orders) ? orders : [];
    const statusCounts = ["待接单", "做方案", "执行中", "已完成"].reduce((result, status) => {
      result[status] = safeMerchantOrders.filter((order) => classifyOrderStatus(order.status) === status).length;
      return result;
    }, {});
    statusCounts["待商户确认"] = safeMerchantOrders.filter((order) => order.status === "待商户确认").length;
    statusCounts["待商户归档"] = safeMerchantOrders.filter((order) => order.status === "待商户归档").length;

    const navItems = [
      { key: "工作台", Icon: GardenIcons.Dashboard },
      { key: "订单管理", Icon: GardenIcons.Orders },
      { key: "团队成员", Icon: GardenIcons.Team },
      { key: "执行监测", Icon: GardenIcons.Monitor },
      { key: "商品库", Icon: GardenIcons.Products },
      { key: "客户库", Icon: GardenIcons.Customers },
      { key: "设置", Icon: GardenIcons.Settings },
    ];
    const todoOrders = [...(Array.isArray(pendingMerchantConfirmOrders) ? pendingMerchantConfirmOrders : []), ...(Array.isArray(pendingArchiveOrders) ? pendingArchiveOrders : [])];
    const displayOrders = Array.isArray(merchantOrders) ? merchantOrders : [];
    const activeStaffMembers = (Array.isArray(staffDirectory) ? staffDirectory : []).filter((member) => member.organizationId === currentMerchantUser?.organizationId);
    const assignableTeamMembers = activeStaffMembers.filter(canAssignStaff);
    const editingStaffMember = activeStaffMembers.find((member) => member.id === editingStaffId) || null;
    
    const filteredMerchantProducts = (Array.isArray(merchantProducts) ? merchantProducts : []).filter((product) => {
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

    function MerchantSidebar() {
      return (
        <aside className="admin-sidebar">
          <div className="brand">
            <p className="eyebrow" style={{ color: "#64748b" }}>SaaS Admin · V4.0</p>
            <h2 style={{ margin: "4px 0 0", color: "#f8fafc", fontSize: 20 }}>绿植租赁中枢</h2>
            <span style={{ color: "#b7c3a6", fontSize: 12, fontWeight: 800 }}>总控商户端</span>
          </div>

          {navItems.map((item) => {
            const Icon = item.Icon;
            return (
              <button
                key={item.key}
                className={`admin-nav-btn ${merchantTab === item.key ? "active" : ""}`}
                onClick={() => {
                  setMerchantViewingOrder(null);
                  setSelectedOrderDetail(null);
                  setMerchantTab(item.key);
                }}
              >
                <Icon size={19} />
                <span>{item.key}</span>
              </button>
            );
          })}

          {showRoleSwitch && (
          <div style={{ marginTop: "auto", borderTop: "1px solid #1e293b", paddingTop: 16 }}>
            <button className="admin-nav-btn" style={{ width: "100%", textAlign: "center", border: "1px solid #334155" }} onClick={() => switchRole("staff")}>
              <GardenIcons.StaffUser size={18} />
              <span>切换至员工视角</span>
            </button>
          </div>
          )}
        </aside>
      );
    }

    // 独立抽出的审核台组件：左右分栏沉浸式
    function MerchantReviewPage({ order }) {
      order = ensureOrderDefaults(order);
      const orderPlan = order.plan || null;
      const stats = getPlanStats(orderPlan);
      const isRetailPlan = orderPlan?.planType === "零售方案";
      const isMaintenancePlan = orderPlan?.planType === "养护服务";
      const isWaitingConfirm = order.status === "待商户确认";
      const isWaitingArchive = order.status === "待商户归档";
      const orderNotes = [order.merchantNote, order.description].map((item) => String(item || "").trim());
      const hasOrderNotes = orderNotes.some(Boolean);
      const sitePhotos = order.completePhotos
        ? [...safePhotos(order.completePhotos.scenePhotos), ...safePhotos(order.completePhotos.plantPhotos)]
        : [];
      const hasMaterialItems = isMaintenancePlan || stats.productCount > 0;

      return (
        <div className="admin-main admin-review-main">
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
            <div className="merchant-project-summary-column">
              <div className="admin-card merchant-project-summary-card merchant-review-card">
                <h2>项目档案</h2>
                <div className="plan-info-line"><span>客户名</span><strong>{order.customerName || "暂无内容"}</strong></div>
                <div className="plan-info-line"><span>状态</span><strong>{order.status}</strong></div>
                <div className="plan-info-line"><span>方案类型</span><strong>{orderPlan?.planType || order.planType || "-"}</strong></div>
                <div className="plan-info-line"><span>员工</span><strong>{order.assignedStaffName || "-"} {order.assignedStaffEmail ? `｜${order.assignedStaffEmail}` : ""}</strong></div>
                <div className="plan-info-line"><span>联系人</span><strong>{order.contactName || "-"} {order.phone ? `｜${order.phone}` : ""}</strong></div>
                <div className="plan-info-line"><span>地址</span><strong>{order.address || "暂无内容"}</strong></div>
                <div className="merchant-summary-tags">
                  {(Array.isArray(order.tags) && order.tags.length ? order.tags : ["暂无标签"]).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
              <div className="admin-card merchant-side-note-card merchant-review-card">
                <h2>客户沟通二维码</h2>
                {order.communicationQrUrl ? (
                  <div className="merchant-side-qr">
                    <img src={order.communicationQrUrl} alt="客户沟通二维码" />
                    <span>用于员工扫码进入客户沟通群。</span>
                  </div>
                ) : (
                  <div className="empty-card"><p>暂无客户沟通二维码</p><span>用于员工扫码进入客户沟通群。</span></div>
                )}
                <div className="merchant-side-upload">
                  <ImageUploader
                    value={order.communicationQrUrl || ""}
                    label="上传或替换二维码"
                    helper="用于员工扫码进入客户沟通群。"
                    onChange={(nextImage) => updateOrder(order.id, { communicationQrUrl: nextImage }, "沟通群二维码已同步")}
                  />
                  <input
                    className="area-input"
                    value={order.communicationQrUrl || ""}
                    onChange={(event) => updateOrder(order.id, { communicationQrUrl: event.target.value }, "沟通群二维码已同步")}
                    placeholder="也可以粘贴二维码图片地址"
                  />
                </div>
              </div>
              <div className="admin-card merchant-side-note-card merchant-review-card">
                <h2>订单备注</h2>
                {hasOrderNotes ? (
                  <>
                    <div className="plan-info-line"><span>商户备注</span><strong>{order.merchantNote || "暂无备注"}</strong></div>
                    <div className="plan-info-line"><span>客户描述</span><strong>{order.description || "暂无备注"}</strong></div>
                  </>
                ) : (
                  <div className="empty-card"><p>暂无备注</p></div>
                )}
              </div>
            </div>

            {/* 右侧栏：方案明细、现场记录、财务信息与执行记录 */}
            <div className="merchant-review-workspace">
              <div className="admin-card merchant-review-card merchant-material-card">
                <div className="merchant-review-card-head">
                  <div>
                    <h2>方案物料明细</h2>
                    {isMaintenancePlan && <span>养护服务明细</span>}
                  </div>
                  {(isWaitingConfirm || isWaitingArchive) && (
                    <div className="merchant-review-actions">
                      {isWaitingConfirm && <button className="ghost-button danger" onClick={() => merchantRequestRevision(order.id)}>打回修改</button>}
                      {isWaitingConfirm && <button className="primary-button" onClick={() => merchantConfirmPlan(order.id)}>确认方案并定价</button>}
                      {isWaitingArchive && <button className="primary-button" onClick={() => merchantArchiveOrder(order.id)}>确认完工并归档</button>}
                    </div>
                  )}
                </div>
                {!orderPlan ? (
                  <div className="empty-card"><p>暂无方案内容</p><span>商户已创建派单，但还没有方案草稿或员工提交内容。</span></div>
                ) : isMaintenancePlan ? (
                  <div className="merchant-material-area">
                    <div className="merchant-material-area-head">
                      <h3>{order.plan?.maintenancePackage || "标准养护"}</h3>
                      <span>{order.plan?.maintenanceFrequency || "-"} ｜ {order.plan?.maintenanceCycle || "-"}</span>
                    </div>
                    <div className="merchant-material-service">
                      <strong>适合场景</strong>
                      <p>{order.plan?.maintenanceScene || "-"}</p>
                      <strong>服务内容</strong>
                      <p>{order.plan?.maintenanceContent || "-"}</p>
                    </div>
                  </div>
                ) : !hasMaterialItems ? (
                  <div className="empty-card"><p>暂无物料</p><span>员工尚未添加区域、商品、数量或价格。</span></div>
                ) : (
                  <div className="merchant-material-grid">
                    {safeAreas(order.plan).map((area) => (
                      <div className="merchant-material-area" key={area.id}>
                        <div className="merchant-material-area-head">
                          <h3>{area.name}</h3>
                          <span>共 {getAreaProductCount(area)} 件 ｜ 区域预估: ¥{money(getAreaDailyRent(area))}{isRetailPlan ? "" : "/天"}</span>
                        </div>
                        <div className="merchant-material-lines">
                          {safeItems(area).length === 0 ? (
                            <div className="merchant-material-line muted"><strong>暂无商品</strong><span>待补充数量和价格</span></div>
                          ) : (
                            safeItems(area).map((item) => (
                              <div className="merchant-material-line" key={item.productId}>
                                <strong>{item.name}</strong>
                                <span>¥{money(item.pricePerDay)}{isRetailPlan ? "/件" : "/天"} × {item.quantity}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="admin-card merchant-review-card">
                <h2>现场记录</h2>
                {sitePhotos.length > 0 ? (
                  <>
                    <div className="merchant-photo-grid">
                      {sitePhotos.slice(0, 6)
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

              <div className="admin-card merchant-review-card merchant-finance-card">
                <h2>财务与租约</h2>
                 <div className="merchant-finance-grid">
                    <div className="merchant-finance-cell">
                      <span>预算</span>
                      <strong>{order.budget ? <MoneyAmount value={order.budget} /> : "暂无预算"}</strong>
                    </div>
                    <div className="merchant-finance-cell">
                      <span>{isMaintenancePlan ? "养护报价" : isRetailPlan ? "最终报价" : "最终租金"}</span>
                      <strong><MoneyAmount value={stats.finalRent} /></strong>
                    </div>
                    <div className="merchant-finance-cell">
                      <span>租期</span>
                      <strong>{isMaintenancePlan ? "按服务约定" : isRetailPlan ? "一次性" : `${orderPlan?.leaseMonths || 12}个月`}</strong>
                    </div>
                    <div className="merchant-finance-cell">
                      <span>支付方式</span>
                      <strong>{isMaintenancePlan ? "按项目约定" : isRetailPlan ? "一次性支付" : orderPlan?.paymentMethod || "月付"}</strong>
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

              <ExtraDetails order={order} hideNotes />

            </div>
          </div>
        </div>
      );
    }

    if (activeReviewOrder) {
      return (
        <div className="admin-layout">
          <MerchantSidebar />
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
            <span style={{ color: "#b7c3a6", fontSize: 12, fontWeight: 800 }}>总控商户端</span>
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

          {showRoleSwitch && (
          <div style={{ marginTop: "auto", borderTop: "1px solid #1e293b", paddingTop: 16 }}>
            <button className="admin-nav-btn" style={{ width: "100%", textAlign: "center", border: "1px solid #334155" }} onClick={() => switchRole("staff")}>
              <GardenIcons.StaffUser size={18} />
              <span>切换至员工视角</span>
            </button>
          </div>
          )}
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
              <span className="merchant-account-avatar" aria-label="商户账号头像">
                {staffAvatar ? <img src={staffAvatar} alt="商户账号头像" /> : <span>G</span>}
              </span>
              <span className="admin-auth-chip">{authUserEmail}</span>
              <button className="ghost-button" onClick={refreshOrdersFromCloud}><GardenIcons.Cloud size={16} /><span>云端刷新</span></button>
              <button className="ghost-button" onClick={handleSignOut}><GardenIcons.Close size={16} /><span>退出登录</span></button>
              <button className="merchant-create-button" onClick={openCreateOrderSheet}><GardenIcons.Create size={17} /><span>创建新派单</span></button>
            </div>
          </header>

          {merchantTab === "工作台" && (
            <>
              <div className="admin-metric-grid">
                <MetricCard label="云端总池" value={`${safeMerchantOrders.length}`} hint="笔订单" />
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
                  <p>暂无订单</p>
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
                    (() => {
                      const selectedStaff = activeStaffMembers.find((member) => member.id === order.assignedStaffId);
                      const staffOptions = selectedStaff && !assignableTeamMembers.some((member) => member.id === selectedStaff.id)
                        ? [selectedStaff, ...assignableTeamMembers]
                        : assignableTeamMembers;

                      return (
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
                        {selectedStaff && (
                          <span className="merchant-staff-inline">
                            <StaffAvatarBadge member={selectedStaff} className="compact" />
                            <span>
                              <strong>{selectedStaff.name}</strong>
                              <em>{selectedStaff.staffNo} · {selectedStaff.area}</em>
                            </span>
                          </span>
                        )}
                        <select
                          className="admin-inline-select"
                          value={order.assignedStaffId || ""}
                          onChange={(event) => assignOrderToStaff(order.id, event.target.value)}
                        >
                          <option value="">所有员工（公共任务）</option>
                          {staffOptions.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name} · {member.staffNo}
                            </option>
                          ))}
                        </select>
                        <em>{order.assignedStaffEmail || (order.assignedStaffId ? "未绑定邮箱" : "公共任务")}</em>
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
                      );
                    })()
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
                <button className="primary-button" onClick={openInviteStaffSheet}>
                  <GardenIcons.Create size={16} />
                  <span>邀请员工</span>
                </button>
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
                  <span>邀请确认后启用账号</span>
                </div>
              </div>

              <div className="admin-table team-admin-table" style={{ marginTop: 16 }}>
                <div className="admin-table-row admin-table-head">
                  <span>员工</span>
                  <span>邮箱 / 手机号</span>
                  <span>角色</span>
                  <span>接单权限</span>
                  <span>状态</span>
                  <span>当前任务</span>
                  <span>操作</span>
                </div>

                {activeStaffMembers.map((member) => {
                  const assignedOrders = orders.filter((order) => order.assignedStaffId === member.id);
                  const activeCount = assignedOrders.filter((order) => order.status !== "已完成").length;

                  return (
                    <div className="admin-table-row" key={member.id}>
                        <span>
                          <span className="merchant-staff-identity">
                            <StaffAvatarBadge member={member} />
                            <span>
                              <strong>{member.name}</strong>
                              <em>{member.staffNo} · {member.area}</em>
                            </span>
                          </span>
                        </span>
                        <span>
                          <strong>{member.email}</strong>
                          <em>{member.phone}</em>
                        </span>
                        <span>{ROLE_LABELS[member.role] || member.role}</span>
                        <span>{STAFF_ORDER_PERMISSION_LABELS[member.orderPermission] || member.orderPermission || "-"}</span>
                        <span>
                          <b className={`admin-status-chip ${member.status === "active" ? "is-done" : member.status === "invited" ? "is-plan" : "muted"}`}>{ACCOUNT_STATUS_LABELS[member.status] || member.status}</b>
                        </span>
                        <span>{activeCount} / {assignedOrders.length} 笔</span>
                        <span>
                          <button className="ghost-button team-manage-button" onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            openManageStaff(member);
                          }}>管理</button>
                        </span>
                    </div>
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
                  <p>暂无商品，请先添加商品</p>
                  <span>员工端选品时会读取这里的数据。</span>
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
                      <span>¥{money(product.pricePerDay)} / 天</span>
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

{editingStaffMember && editingStaffForm && (
            <div className="sheet-mask merchant-staff-editor-mask" onClick={closeManageStaff}>
              <section className="merchant-staff-editor merchant-staff-drawer" onClick={(event) => event.stopPropagation()}>
                <header className="merchant-staff-drawer-head">
                  <div>
                    <p className="eyebrow">Team Member</p>
                    <h2>{editingStaffForm.name || editingStaffMember.name}</h2>
                    <span>{editingStaffForm.staffNo} · {ACCOUNT_STATUS_LABELS[editingStaffForm.status] || editingStaffForm.status}</span>
                  </div>
                  <button className="close-button" onClick={closeManageStaff} aria-label="关闭员工管理">×</button>
                </header>

                <div className="merchant-staff-drawer-body">
                  <section className="merchant-staff-section">
                    <h3>基础资料</h3>
                    <div className="merchant-staff-profile-grid">
                      <div className="merchant-staff-avatar-block">
                        <ImageUploader
                          value={getStaffAvatar(editingStaffForm) || (editingStaffMember.id === currentStaffId ? staffAvatar : "")}
                          avatar
                          label="更换头像"
                          helper=""
                          onChange={(avatar) => setEditingStaffForm((form) => ({ ...form, avatar, avatarUrl: avatar }))}
                        />
                      </div>
                      <div className="merchant-staff-edit-grid">
                        <div className="sheet-block">
                          <p className="sheet-label">姓名</p>
                          <input className="area-input" value={editingStaffForm.name} onChange={(event) => setEditingStaffForm((form) => ({ ...form, name: event.target.value }))} />
                        </div>
                        <div className="sheet-block">
                          <p className="sheet-label">邮箱</p>
                          <input className="area-input" type="email" value={editingStaffForm.email} onChange={(event) => setEditingStaffForm((form) => ({ ...form, email: event.target.value }))} />
                        </div>
                        <div className="sheet-block">
                          <p className="sheet-label">手机号</p>
                          <input className="area-input" inputMode="tel" value={editingStaffForm.phone} onChange={(event) => setEditingStaffForm((form) => ({ ...form, phone: event.target.value }))} />
                        </div>
                        <div className="sheet-block">
                          <p className="sheet-label">当前任务数</p>
                          <strong className="staff-readonly-value">{orders.filter((order) => order.assignedStaffId === editingStaffMember.id && order.status !== "已完成").length} 笔</strong>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="merchant-staff-section">
                    <h3>组织权限</h3>
                    <div className="merchant-staff-edit-grid">
                      <div className="sheet-block">
                        <p className="sheet-label">工号</p>
                        <input className="area-input" value={editingStaffForm.staffNo} onChange={(event) => setEditingStaffForm((form) => ({ ...form, staffNo: event.target.value }))} />
                      </div>
                      <div className="sheet-block">
                        <p className="sheet-label">角色</p>
                        <select
                          className="area-input"
                          value={editingStaffForm.role}
                          onChange={(event) => setEditingStaffForm((form) => ({ ...form, role: event.target.value }))}
                        >
                          <option value="staff">普通员工</option>
                          <option value="manager">店长 / 经理</option>
                          <option value="admin">管理员</option>
                        </select>
                      </div>
                      <div className="sheet-block">
                        <p className="sheet-label">负责区域</p>
                        <input className="area-input" list="staff-area-options" value={editingStaffForm.area} onChange={(event) => setEditingStaffForm((form) => ({ ...form, area: event.target.value }))} />
                      </div>
                      <div className="sheet-block">
                        <p className="sheet-label">接单权限</p>
                        <select className="area-input" value={editingStaffForm.orderPermission} onChange={(event) => setEditingStaffForm((form) => ({ ...form, orderPermission: event.target.value }))}>
                          <option value="public">可接公共单</option>
                          <option value="assigned">仅接指定派单</option>
                          <option value="paused">暂停接单</option>
                        </select>
                      </div>

                      <div className="sheet-block">
                        <p className="sheet-label">账号状态</p>
                        <select
                          className="area-input"
                          value={editingStaffForm.status}
                          onChange={(event) => setEditingStaffForm((form) => ({ ...form, status: event.target.value }))}
                        >
                          <option value="invited">待邀请</option>
                          <option value="active">启用账号</option>
                          <option value="paused">停用账号</option>
                        </select>
                      </div>
                    </div>
                    {staffFormError && <p className="staff-form-error">{staffFormError}</p>}
                  </section>

                  <section className="merchant-staff-section">
                    <h3>已分配订单</h3>
                    <div className="staff-assigned-orders">
                      {orders.filter((order) => order.assignedStaffId === editingStaffMember.id).length === 0 ? (
                        <p>暂无订单</p>
                      ) : (
                        orders.filter((order) => order.assignedStaffId === editingStaffMember.id).map((order) => (
                          <button key={order.id} className="staff-assigned-order" onClick={() => openMerchantPlanWorkbench(order)}>
                            <span>{order.customerName}</span>
                            <em>{order.status} · {order.address || "暂无地址"}</em>
                          </button>
                        ))
                      )}
                    </div>
                  </section>
                </div>

                <footer className="merchant-staff-drawer-foot">
                  <button className="ghost-button" onClick={closeManageStaff}>取消</button>
                  <button className="ghost-button danger" onClick={() => setEditingStaffForm((form) => ({ ...form, status: form.status === "active" ? "paused" : "active" }))}>
                    {editingStaffForm.status === "active" ? "停用账号" : "启用账号"}
                  </button>
                  <button className="primary-button" onClick={saveEditingStaff}>保存修改</button>
                </footer>
              </section>
            </div>
          )}

          {showInviteStaffSheet && (
            <div className="sheet-mask merchant-staff-editor-mask" onClick={() => setShowInviteStaffSheet(false)}>
              <section className="merchant-staff-editor merchant-staff-drawer" onClick={(event) => event.stopPropagation()}>
                <header className="merchant-staff-drawer-head">
                  <div>
                    <p className="eyebrow">Invite Member</p>
                    <h2>邀请员工</h2>
                    <span>{lastInviteCode || "发送后生成本地模拟邀请码"}</span>
                  </div>
                  <button className="close-button" onClick={() => setShowInviteStaffSheet(false)} aria-label="关闭邀请员工">×</button>
                </header>

                <div className="merchant-staff-drawer-body">
                  <section className="merchant-staff-section">
                    <h3>基础资料</h3>
                    <div className="merchant-staff-edit-grid">
                      <div className="sheet-block"><p className="sheet-label">员工姓名</p><input className="area-input" value={staffInviteForm.name} onChange={(event) => setStaffInviteForm((form) => ({ ...form, name: event.target.value }))} /></div>
                      <div className="sheet-block"><p className="sheet-label">手机号</p><input className="area-input" inputMode="tel" value={staffInviteForm.phone} onChange={(event) => setStaffInviteForm((form) => ({ ...form, phone: event.target.value }))} /></div>
                      <div className="sheet-block"><p className="sheet-label">邮箱</p><input className="area-input" type="email" value={staffInviteForm.email} onChange={(event) => setStaffInviteForm((form) => ({ ...form, email: event.target.value }))} /></div>
                      <div className="sheet-block"><p className="sheet-label">头像</p><ImageUploader value={staffInviteForm.avatar} avatar label="上传头像" helper="" onChange={(avatar) => setStaffInviteForm((form) => ({ ...form, avatar }))} /></div>
                    </div>
                  </section>

                  <section className="merchant-staff-section">
                    <h3>组织权限</h3>
                    <div className="merchant-staff-edit-grid">
                      <div className="sheet-block"><p className="sheet-label">工号</p><input className="area-input" value={staffInviteForm.staffNo} onChange={(event) => setStaffInviteForm((form) => ({ ...form, staffNo: event.target.value }))} /></div>
                      <div className="sheet-block"><p className="sheet-label">角色</p><select className="area-input" value={staffInviteForm.role} onChange={(event) => setStaffInviteForm((form) => ({ ...form, role: event.target.value }))}><option value="staff">普通员工</option><option value="manager">店长 / 经理</option><option value="admin">管理员</option></select></div>
                      <div className="sheet-block"><p className="sheet-label">负责区域</p><input className="area-input" list="staff-area-options" value={staffInviteForm.area} onChange={(event) => setStaffInviteForm((form) => ({ ...form, area: event.target.value }))} /></div>
                      <div className="sheet-block"><p className="sheet-label">接单权限</p><select className="area-input" value={staffInviteForm.orderPermission} onChange={(event) => setStaffInviteForm((form) => ({ ...form, orderPermission: event.target.value }))}><option value="public">可接公共单</option><option value="assigned">仅接指定派单</option><option value="paused">暂停接单</option></select></div>
                      <div className="sheet-block"><p className="sheet-label">账号状态</p><select className="area-input" value={staffInviteForm.status} onChange={(event) => setStaffInviteForm((form) => ({ ...form, status: event.target.value }))}><option value="invited">待邀请</option><option value="active">已启用</option><option value="paused">已停用</option></select></div>
                    </div>
                    {staffFormError && <p className="staff-form-error">{staffFormError}</p>}
                    {lastInviteCode && <div className="staff-invite-code"><span>模拟邀请链接 / 邀请码</span><strong>{lastInviteCode}</strong></div>}
                  </section>
                </div>

                <footer className="merchant-staff-drawer-foot">
                  <button className="ghost-button" onClick={() => setShowInviteStaffSheet(false)}>取消</button>
                  <button className="primary-button" onClick={sendStaffInvite}>发送邀请</button>
                </footer>
              </section>
            </div>
          )}

          <datalist id="staff-area-options">
            {STAFF_AREA_OPTIONS.map((area) => <option key={area} value={area} />)}
          </datalist>

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
                <span>图片会在保存前显示预览，便于确认商品展示效果。</span>
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
                <strong>{newProductForm.pricePerDay ? `¥${money(newProductForm.pricePerDay)}/天` : "-"}</strong>
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
              style={{ minWidth: 180, border: 0, borderRadius: 18, padding: "14px 24px", background: "#405a38", color: "#fff", fontWeight: 900, cursor: "pointer", boxShadow: "0 14px 28px rgba(33, 118, 66, 0.22)" }}
              onClick={createMerchantProduct}
            >{editingProductId ? "保存修改" : "保存商品"}</button>
          </div>
        </section>
      </div>
    );
  }

  function renderCreateOrderSheet() {
    const createOrderTagsText = String(newOrderForm?.tagsText || "");
    const createOrderSelectedTags = createOrderTagsText.split(",").map((item) => item.trim()).filter(Boolean);
    const createOrderSourceOptions = Array.isArray(ORDER_SOURCES) ? ORDER_SOURCES : [];
    const createOrderMaintenancePackages = Array.isArray(MAINTENANCE_PACKAGES) ? MAINTENANCE_PACKAGES : [];
    const createOrderAssignableStaff = Array.isArray(assignableStaffMembers) ? assignableStaffMembers : [];

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
        overflow: "hidden",
        background: "rgba(255,255,255,0.98)",
        borderRadius: 28,
        boxShadow: "0 28px 80px rgba(20, 54, 34, 0.22)",
        display: "flex",
        flexDirection: "column",
      };
      const panelHeaderStyle = {
        flex: "0 0 auto",
        padding: "24px 24px 14px",
      };
      const panelScrollStyle = {
        flex: "1 1 auto",
        minHeight: 0,
        overflowY: "auto",
        padding: "0 18px 18px 24px",
        marginRight: 6,
        scrollbarGutter: "stable",
      };
      const panelFooterStyle = {
        flex: "0 0 auto",
        display: "flex",
        gap: 14,
        justifyContent: "flex-end",
        alignItems: "center",
        padding: "16px 24px 20px",
        background: "rgba(239, 247, 241, 0.92)",
        borderTop: "1px solid rgba(34, 116, 67, 0.12)",
      };

      return (
        <div
          style={overlayStyle}
          onClick={() => {
            setShowCreateOrderSheet(false);
            setIsCreateOrderInputFocused(false);
          }}
        >
          <section className="merchant-create-order-dialog" style={panelStyle} onClick={(event) => event.stopPropagation()}>
            <div className="section-title-row" style={panelHeaderStyle}>
              <div><p className="eyebrow">New Order · v3.8</p><h2>创建新订单</h2></div>
              <button
                className="close-button"
                onClick={() => {
                  setShowCreateOrderSheet(false);
                  setIsCreateOrderInputFocused(false);
                }}
              >×</button>
            </div>

            <div className="merchant-create-order-scroll" style={panelScrollStyle}>
            <div className="merchant-create-stage-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              <section className="plan-summary-card merchant-create-stage" style={{ margin: 0 }}>
                <div className="section-title-row"><div><p className="eyebrow">Step 01</p><h2>基础客户信息</h2></div></div>
                <div className="sheet-block"><p className="sheet-label">项目 / 客户名称</p><input className="area-input" value={newOrderForm.customerName} onChange={(e) => setNewOrderForm((form) => ({ ...form, customerName: e.target.value }))} placeholder="例如：南通万达 A3 写字楼" /></div>
                <div className="sheet-block"><p className="sheet-label">联系人</p><input className="area-input" value={newOrderForm.contactName} onChange={(e) => setNewOrderForm((form) => ({ ...form, contactName: e.target.value }))} placeholder="例如：王经理" /></div>
                <div className="sheet-block"><p className="sheet-label">联系电话</p><input className="area-input" inputMode="tel" value={newOrderForm.phone} onChange={(e) => setNewOrderForm((form) => ({ ...form, phone: e.target.value }))} placeholder="例如：13800001111" /></div>
                <div className="sheet-block"><p className="sheet-label">客户地址</p><input className="area-input" value={newOrderForm.address} onChange={(e) => setNewOrderForm((form) => ({ ...form, address: e.target.value }))} placeholder="例如：南通港闸区万达 A3 写字楼" /></div>
              </section>

              <section className="plan-summary-card merchant-create-stage" style={{ margin: 0 }}>
                <div className="section-title-row"><div><p className="eyebrow">Step 02</p><h2>项目需求</h2></div></div>
                <div className="sheet-block"><p className="sheet-label">订单来源</p><div className="option-grid payment-grid order-source-segmented">{createOrderSourceOptions.map((source) => (<button key={source} className={newOrderForm.source === source ? "selected" : ""} onClick={() => setNewOrderForm((form) => ({ ...form, source }))}>{source}</button>))}</div></div>
                <div className="sheet-block"><p className="sheet-label">方案类型</p><div className="plan-type-grid">{[
                  ["租赁", "租赁方案"],
                  ["零售", "零售方案"],
                  ["养护", "养护服务"],
                ].map(([serviceType, label]) => (<button key={serviceType} className={newOrderForm.serviceType === serviceType ? "selected" : ""} onClick={() => setNewOrderForm((form) => ({ ...form, serviceType }))}>{label}</button>))}</div></div>
                <div className="sheet-block">
                  <p className="sheet-label">需求标签</p>
                  <div className="merchant-tag-picker">
                    {["需比价", "租过绿植", "室内", "室外", "办公室", "商业空间", "其他", "急单", "重点客户"].map((tag) => {
                      const selected = createOrderSelectedTags.includes(tag);
                      return <button key={tag} className={selected ? "selected" : ""} onClick={() => toggleNewOrderTag(tag)}>{tag}</button>;
                    })}
                  </div>
                  <input className="area-input" value={newOrderForm.tagsText} onChange={(e) => setNewOrderForm((form) => ({ ...form, tagsText: e.target.value }))} placeholder="例如：办公室,长期租赁" />
                </div>
                <div className="sheet-block">
                  <p className="sheet-label">分配员工</p>
                  {createOrderAssignableStaff.length === 0 ? (
                    <div className="empty-card"><p>暂无员工，请先邀请员工</p><span>邀请员工后再分配订单。</span></div>
                  ) : (
                    <select className="area-input" value={newOrderForm.assignedStaffId} onChange={(e) => setNewOrderForm((form) => ({ ...form, assignedStaffId: e.target.value }))}>
                      <option value="">所有员工（公共任务）</option>
                      {createOrderAssignableStaff.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} · {member.staffNo} · {ROLE_LABELS[member.role] || member.role}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="sheet-block">
                  <p className="sheet-label">客户沟通群二维码</p>
                  {/* QR image upload keeps the preview URL on the order record. */}
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

            <section className="plan-summary-card merchant-plan-draft-card merchant-create-stage" style={{ marginTop: 16 }}>
              <div className="section-title-row"><div><p className="eyebrow">Step 03</p><h2>派单与备注</h2></div></div>
              {newOrderForm.serviceType === "租赁" && (
                <div className="merchant-plan-draft-grid">
                  <div className="sheet-block"><p className="sheet-label">租期</p><input className="area-input" type="number" value={newOrderForm.leaseMonths} onChange={(e) => setNewOrderForm((form) => ({ ...form, leaseMonths: e.target.value }))} /></div>
                  <div className="sheet-block"><p className="sheet-label">付款方式</p><select className="area-input" value={newOrderForm.paymentMethod} onChange={(e) => setNewOrderForm((form) => ({ ...form, paymentMethod: e.target.value }))}>{["月付", "季付", "半年付", "年付"].map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
                  <div className="sheet-block"><p className="sheet-label">基础养护</p><div className="empty-card"><p>默认包含基础养护</p><span>员工端可按现场情况校正商品、区域和数量。</span></div></div>
                </div>
              )}
              {newOrderForm.serviceType === "零售" && (
                <div className="sheet-block">
                  <p className="sheet-label">售后养护意向</p>
                  <div className="option-grid payment-grid">
                    <button className={newOrderForm.retailNeedsMaintenance ? "selected" : ""} onClick={() => setNewOrderForm((form) => ({ ...form, retailNeedsMaintenance: true }))}>需要</button>
                    <button className={!newOrderForm.retailNeedsMaintenance ? "selected" : ""} onClick={() => setNewOrderForm((form) => ({ ...form, retailNeedsMaintenance: false }))}>当前不需要</button>
                  </div>
                </div>
              )}
              {newOrderForm.serviceType === "养护" && (
                <div className="merchant-plan-draft-grid">
                  <div className="sheet-block"><p className="sheet-label">套餐</p><select className="area-input" value={newOrderForm.maintenancePackage} onChange={(e) => { const pack = getMaintenancePackage(e.target.value); setNewOrderForm((form) => ({ ...form, maintenancePackage: pack.name, maintenanceCycle: pack.cycle, maintenanceFrequency: pack.frequency, maintenanceContent: pack.content })); }}>{createOrderMaintenancePackages.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select></div>
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
              <span>员工端刷新后即可接单，并继续完善区域、商品和报价。</span>
            </div>
            </div>

            <div style={panelFooterStyle}>
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
                  background: "#405a38",
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
            <div className="option-grid order-source-segmented">
              {createOrderSourceOptions.map((source) => (
                <button key={source} className={newOrderForm.source === source ? "selected" : ""} onClick={() => setNewOrderForm((form) => ({ ...form, source }))}>
                  {source}
                </button>
              ))}
            </div>
          </div>

          <div className="sheet-block" style={compactBlockStyle}>
            <p className="sheet-label">方案类型</p>
            <div className="plan-type-grid">
              {[
                ["租赁", "租赁方案"],
                ["零售", "零售方案"],
                ["养护", "养护服务"],
              ].map(([serviceType, label]) => (
                <button key={serviceType} className={newOrderForm.serviceType === serviceType ? "selected" : ""} onClick={() => setNewOrderForm((form) => ({ ...form, serviceType }))}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="sheet-block" style={compactBlockStyle}>
            <p className="sheet-label">需求标签</p>
            <div className="merchant-tag-picker">
              {["需比价", "租过绿植", "室内", "室外", "办公室", "商业空间", "急单", "重点客户"].map((tag) => {
                const selected = createOrderSelectedTags.includes(tag);
                return <button key={tag} className={selected ? "selected" : ""} onClick={() => toggleNewOrderTag(tag)}>{tag}</button>;
              })}
            </div>
          </div>

          <div className="sheet-block" style={compactBlockStyle}>
            <p className="sheet-label">分配员工</p>
            {createOrderAssignableStaff.length === 0 ? (
              <div className="empty-card"><p>暂无员工，请先邀请员工</p><span>邀请员工后再分配订单。</span></div>
            ) : (
              <select className={inputClass} value={newOrderForm.assignedStaffId} onChange={(e) => setNewOrderForm((form) => ({ ...form, assignedStaffId: e.target.value }))}>
                <option value="">所有员工（公共任务）</option>
                {createOrderAssignableStaff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} · {member.staffNo}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="sheet-block" style={compactBlockStyle}>
            <p className="sheet-label">客户沟通群二维码</p>
            {/* QR image upload keeps the preview URL on the order record. */}
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
              <p className="sheet-label">售后养护意向</p>
              <div className="option-grid">
                <button className={newOrderForm.retailNeedsMaintenance ? "selected" : ""} onClick={() => setNewOrderForm((form) => ({ ...form, retailNeedsMaintenance: true }))}>需要</button>
                <button className={!newOrderForm.retailNeedsMaintenance ? "selected" : ""} onClick={() => setNewOrderForm((form) => ({ ...form, retailNeedsMaintenance: false }))}>当前不需要</button>
              </div>
            </div>
          )}

          {newOrderForm.serviceType === "养护" && (
            <div className="sheet-block" style={compactBlockStyle}>
              <p className="sheet-label">养护套餐</p>
              <select className={inputClass} value={newOrderForm.maintenancePackage} onChange={(e) => { const pack = getMaintenancePackage(e.target.value); setNewOrderForm((form) => ({ ...form, maintenancePackage: pack.name, maintenanceCycle: pack.cycle, maintenanceFrequency: pack.frequency, maintenanceContent: pack.content })); }}>
                {createOrderMaintenancePackages.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
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

  const returnToStaffHome = () => {
    setActiveRole("staff");
    setCurrentPage("orders");
    setStaffAppTab("首页");
    setSelectedOrder(null);
    setSelectedOrderDetail(null);
    setMerchantViewingOrder(null);
    setCurrentOrderId(null);
  };

  const returnToMerchantHome = () => {
    setActiveRole("merchant");
    setCurrentPage("orders");
    setMerchantTab("工作台");
    setSelectedOrder(null);
    setSelectedOrderDetail(null);
    setMerchantViewingOrder(null);
    setCurrentOrderId(null);
  };

  const renderSafely = (factory, mode, resetKey, onReset) => {
    try {
      return (
        <AppErrorBoundary mode={mode} resetKey={resetKey} onReset={onReset}>
          {factory()}
        </AppErrorBoundary>
      );
    } catch (error) {
      console.error("页面加载失败：", error);
      return <ErrorFallback mode={mode} onReset={onReset} />;
    }
  };

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

  if (customerPlanId) {
    return renderSafely(renderCustomerPlanView, "staff", `customer-${customerPlanId}`, returnToStaffHome);
  }
  if (["archiveDetail", "completeUpload", "plan", "serviceRecord"].includes(currentPage) && !currentOrder) {
    console.error("页面数据不完整，缺少当前订单：", currentPage, currentOrderId);
    return <ErrorFallback mode="staff" onReset={returnToStaffHome} />;
  }
  if (currentPage === "archiveDetail" && currentOrder) {
    return renderSafely(renderArchiveDetailPage, "staff", `${currentPage}-${currentOrderId}`, returnToStaffHome);
  }
  if (currentPage === "serviceRecord" && currentOrder) {
    return renderSafely(renderServiceRecordPage, "staff", `${currentPage}-${currentOrderId}`, returnToStaffHome);
  }
  if (currentPage === "completeUpload" && currentOrder) {
    return renderSafely(renderCompleteUploadPage, "staff", `${currentPage}-${currentOrderId}`, returnToStaffHome);
  }
  if (currentPage === "plan" && currentOrder) {
    return renderSafely(renderPlanPage, "staff", `${currentPage}-${currentOrderId}`, returnToStaffHome);
  }
  if (activeRole === "merchant") {
    return renderSafely(renderMerchantPage, "merchant", `${merchantTab}-${currentOrderId || ""}-${merchantViewingOrder?.id || ""}-${selectedOrderDetail?.id || ""}`, returnToMerchantHome);
  }

 return (
    <AppErrorBoundary mode="staff" resetKey={`${staffAppTab}-${activeStaffTab}-${currentStaff?.id || ""}`} onReset={returnToStaffHome}>
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
        openCompleteUploadForOrder={openCompleteUploadForOrder}
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
        onStaffAvatarFile={handleStaffAvatarUpload}
        staffAvatarUploading={isUploadingStaffAvatar}
        staffAvatarStatus={staffAvatarStatus}
        staffAvatarError={staffAvatarError}
        onStaffAvatarError={handleStaffAvatarImageError}
        currentStaff={currentStaff}
        currentOrganization={currentOrganization}
        roleLabels={ROLE_LABELS}
        accountStatusLabels={ACCOUNT_STATUS_LABELS}
        authUserEmail={authUserEmail}
        canOpenMerchant={showRoleSwitch}
        onSignOut={handleSignOut}
        classifyOrderStatus={classifyOrderStatus}
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
    </AppErrorBoundary>
  );
}

export default App;
