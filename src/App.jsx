import { useEffect, useMemo, useRef, useState } from "react";
import { GardenIcons } from "./GardenIcons";
import { StaffHome } from "./components/staff/StaffHome";
import "./App.css";

const SUPABASE_URL = "https://kvdxgyymlfnnurdigtkj.supabase.co";
const SUPABASE_KEY = "sb_publishable_FFoHUmn4RwaOkvx2XK7QHg__O7iWYdJ";
const ORDERS_API = `${SUPABASE_URL}/rest/v1/orders`;

const STORAGE_KEY = "green-rental-mobile-v24";
const PRODUCT_STORAGE_KEY = "green-rental-products-v29";
const CUSTOMER_STORAGE_KEY = "green-rental-customers-v31";
const PRODUCT_CLOUD_ID = 999999001;

const STAFF_TABS = ["待接单", "做方案", "执行中", "已完成"];
const ORDER_STATUS = ["待接单", "配置中", "待商户确认", "方案已确认", "执行中", "待商户归档", "已完成"];
const MERCHANT_STATUS_TABS = ["全部", ...ORDER_STATUS];

const ORDER_SOURCES = ["商户派单", "客户预约", "电话登记", "线下登记"];
const DELIVERY_STATUS = ["未出发", "前往中", "已到达"];
const EXECUTION_STATUS = ["待联系", "已联系", "已出发", "已到达", "已完成服务"];
const CUSTOMER_CONFIRM_STATUS = ["待确认", "已确认", "有异议"];
const PLAN_LINK_STATUS = ["未生成", "已复制", "已发送"];

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

function cloudHeaders(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

function ensureOrderDefaults(order) {
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
  return /^https?:\/\//i.test(String(value || "").trim());
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

function getPlanStats(plan) {
  const areas = safeAreas(plan);
  const areaCount = areas.length;
  const productCount = areas.reduce((sum, area) => sum + getAreaProductCount(area), 0);
  const dailyRent = areas.reduce((sum, area) => sum + getAreaDailyRent(area), 0);
  const leaseMonths = Number(plan?.leaseMonths || 12);
  const systemTotalRent = dailyRent * leaseMonths * 30;

  const customFinalRent = plan?.customFinalRent;
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
    systemTotalRent,
    finalRent: hasCustomFinalRent ? Number(customFinalRent) : systemTotalRent,
  };
}

function createEmptyPlan(order, planType = "租赁方案") {
  return {
    id: `plan-${order.id}-${Date.now()}`,
    planType,
    leaseMonths: 12,
    paymentMethod: "月付",
    needDeposit: true,
    customFinalRent: "",
    areas: [],
    createdAt: nowText(),
    updatedAt: nowText(),
    submittedAt: "",
    merchantConfirmedAt: "",
    completedAt: "",
  };
}

function getStaffStatuses(tab) {
  if (tab === "待接单") return ["待接单"];
  if (tab === "做方案") return ["配置中", "待商户确认"];
  if (tab === "执行中") return ["方案已确认", "执行中"];
  if (tab === "已完成") return ["待商户归档", "已完成"];
  return ["待接单"];
}

function App() {
  const merchantListRef = useRef(null);

  const [activeRole, setActiveRole] = useState("staff");
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

  const [currentPage, setCurrentPage] = useState("orders");
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [merchantViewingOrder, setMerchantViewingOrder] = useState(null);

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

  const filteredStaffOrders = useMemo(() => {
    const statuses = getStaffStatuses(activeStaffTab);
    return orders.filter((order) => statuses.includes(order.status));
  }, [orders, activeStaffTab]);

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
    setCurrentPage("orders");
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
        window.setTimeout(() => syncOneOrder(changedOrder, cloudMessage), 0);
      }

      return nextOrders;
    });
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
      let changedOrder = nu
