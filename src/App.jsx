import { useEffect, useMemo, useState } from "react";
import "./App.css";

const STORAGE_KEY = "green-rental-mobile-v20";

const STATUS_TABS = ["待接单", "配置中", "方案已提交", "已完成"];
const MERCHANT_STATUS_TABS = ["全部", "待接单", "配置中", "方案已提交", "已完成"];
const ORDER_SOURCES = ["商户派单", "客户预约", "电话登记", "线下登记"];
const DELIVERY_STATUS = ["未出发", "前往中", "已到达"];
const EXECUTION_STATUS = ["待联系", "已联系", "已出发", "已到达", "已完成服务"];
const CUSTOMER_CONFIRM_STATUS = ["待确认", "已确认", "有异议"];
const PLAN_LINK_STATUS = ["未生成", "已复制", "已发送"];

const productCategories = ["室内绿植", "室外植物", "月租套餐", "仿真植物"];
const subCategories = ["大型植物", "中型植物", "小型植物", "水培植物", "盆景植物"];

const products = [
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

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("保存本地数据失败：", error);
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
    completedAt: "",
  };
}

function ensureOrderDefaults(order) {
  return {
    deliveryStatus: "未出发",
    executionStatus: "待联系",
    customerConfirmStatus: "待确认",
    planLinkStatus: "未生成",
    staffLocation: null,
    distanceText: "待定位",
    etaText: "待定位",
    contactName: order.contactName || "待确认",
    phone: order.phone || "",
    source: order.source || "商户派单",
    fieldNote: order.fieldNote || "",
    internalNote: order.internalNote || "",
    timeline: Array.isArray(order.timeline) ? order.timeline : [],
    plan: order.plan || null,
    ...order,
  };
}

function App() {
  const [activeRole, setActiveRole] = useState("staff");
  const [activeStatus, setActiveStatus] = useState("待接单");
  const [merchantTab, setMerchantTab] = useState("订单总览");
  const [merchantStatusFilter, setMerchantStatusFilter] = useState("全部");

  const [orders, setOrders] = useState(() => {
    const saved = readStorage();
    const data = Array.isArray(saved?.orders) ? saved.orders : initialOrders;
    return data.map(ensureOrderDefaults);
  });

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
  const [activeCategory, setActiveCategory] = useState("室内绿植");
  const [activeSubCategory, setActiveSubCategory] = useState("大型植物");
  const [searchText, setSearchText] = useState("");

  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [showPriceSheet, setShowPriceSheet] = useState(false);
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [showSubmitSheet, setShowSubmitSheet] = useState(false);
  const [showCreateOrderSheet, setShowCreateOrderSheet] = useState(false);
  const [showExecutionSheet, setShowExecutionSheet] = useState(false);
  const [isCreateOrderInputFocused, setIsCreateOrderInputFocused] = useState(false);

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

  const currentOrder = orders.find((order) => order.id === currentOrderId) || null;
  const currentPlan = currentOrder?.plan || null;
  const planAreas = safeAreas(currentPlan);
  const currentArea = planAreas.find((area) => area.id === currentAreaId) || null;
  const currentStats = getPlanStats(currentPlan);

  const filteredStaffOrders = orders.filter((order) => order.status === activeStatus);

  const merchantOrders = useMemo(() => {
    if (merchantStatusFilter === "全部") return orders;
    return orders.filter((order) => order.status === merchantStatusFilter);
  }, [orders, merchantStatusFilter]);

  const submittedOrders = useMemo(() => {
    return orders.filter((order) => order.status === "方案已提交" || order.status === "已完成");
  }, [orders]);

  const filteredProducts = products.filter((product) => {
    const keyword = searchText.trim();
    return (
      product.category === activeCategory &&
      product.subCategory === activeSubCategory &&
      (keyword === "" ||
        product.name.includes(keyword) ||
        product.description.includes(keyword))
    );
  });

  const customerPlanId = new URLSearchParams(window.location.search).get("planId");
  const customerViewOrder = orders.find((order) => order.plan?.id === customerPlanId) || null;

  useEffect(() => {
    saveStorage({ orders });
  }, [orders]);

  useEffect(() => {
    if (currentPage === "plan" && !currentOrder) setCurrentPage("orders");
    if (showProductSheet && !currentArea) setShowProductSheet(false);
  }, [currentPage, currentOrder, showProductSheet, currentArea]);

  function addTimeline(order, action) {
    return {
      ...order,
      timeline: [...safeTimeline(order), { time: nowText(), action }],
    };
  }

  function updateOrder(orderId, updater) {
    setOrders((prevOrders) => {
      return prevOrders.map((order) => {
        if (order.id !== orderId) return order;
        const nextOrder = typeof updater === "function" ? updater(order) : updater;
        return { ...order, ...nextOrder };
      });
    });
  }

  function updateOrderPlan(orderId, planUpdater) {
    setOrders((prevOrders) => {
      return prevOrders.map((order) => {
        if (order.id !== orderId) return order;

        const current = order.plan || createEmptyPlan(order);
        const nextPlan =
          typeof planUpdater === "function" ? planUpdater(current, order) : planUpdater;

        return {
          ...order,
          plan: {
            ...nextPlan,
            updatedAt: nowText(),
          },
        };
      });
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
    setShowExecutionSheet(false);
    setIsCreateOrderInputFocused(false);
  }

  function switchRole(role) {
    setActiveRole(role);
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

        updateOrder(orderId, (order) => {
          const next = {
            ...order,
            deliveryStatus: order.deliveryStatus === "未出发" ? "前往中" : order.deliveryStatus,
            executionStatus: order.executionStatus === "待联系" ? "已出发" : order.executionStatus,
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
        });

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

  function updateDeliveryStatus(orderId, nextStatus) {
    updateOrder(orderId, (order) => {
      const next = {
        ...order,
        deliveryStatus: nextStatus,
        deliveryUpdatedAt: nowText(),
      };

      return addTimeline(next, `配送状态更新为：${nextStatus}`);
    });
  }

  function updateExecutionStatus(orderId, nextStatus) {
    updateOrder(orderId, (order) => {
      const next = {
        ...order,
        executionStatus: nextStatus,
        executionUpdatedAt: nowText(),
      };

      return addTimeline(next, `执行状态更新为：${nextStatus}`);
    });
  }

  function updateCustomerConfirmStatus(orderId, nextStatus) {
    updateOrder(orderId, (order) => {
      const next = {
        ...order,
        customerConfirmStatus: nextStatus,
        customerConfirmUpdatedAt: nowText(),
      };

      return addTimeline(next, `客户确认状态更新为：${nextStatus}`);
    });
  }

  function updatePlanLinkStatus(orderId, nextStatus) {
    updateOrder(orderId, (order) => {
      const next = {
        ...order,
        planLinkStatus: nextStatus,
        planLinkUpdatedAt: nowText(),
      };

      return addTimeline(next, `方案链接状态更新为：${nextStatus}`);
    });
  }

  function acceptOrderAndCreatePlan() {
    if (!selectedOrder) return;

    updateOrder(selectedOrder.id, (order) => {
      const next = {
        ...order,
        status: "配置中",
        planStatus: "配置中",
        deliveryStatus: order.deliveryStatus || "未出发",
        executionStatus: "已联系",
        acceptedAt: order.acceptedAt || nowText(),
        plan: order.plan || createEmptyPlan(order, planType),
      };

      return addTimeline(next, "员工确认接单并创建方案");
    });

    setCurrentOrderId(selectedOrder.id);
    setCurrentPage("plan");
    setSelectedOrder(null);
    setPlanType("租赁方案");
    setActiveStatus("配置中");
  }

  function openPlanForOrder(order) {
    if (!order.plan) {
      updateOrder(order.id, { plan: createEmptyPlan(order, "租赁方案") });
    }

    setCurrentOrderId(order.id);
    setCurrentPage("plan");
  }

  function addArea() {
    const name = areaName.trim();
    if (!currentOrder || !name) return;

    updateOrderPlan(currentOrder.id, (plan) => ({
      ...plan,
      areas: [
        ...safeAreas(plan),
        {
          id: `area-${Date.now()}`,
          name,
          items: [],
        },
      ],
    }));

    updateOrder(currentOrder.id, (order) => addTimeline(order, `新增区域：${name}`));

    setAreaName("");
    setShowAreaSheet(false);
  }

  function openProductSheet(area) {
    setCurrentAreaId(area.id);
    setActiveCategory("室内绿植");
    setActiveSubCategory("大型植物");
    setSearchText("");
    setShowProductSheet(true);
  }

  function addProductToArea(product) {
    if (!currentOrder || !currentAreaId) return;

    updateOrderPlan(currentOrder.id, (plan) => ({
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
    }));
  }

  function changeItemQuantity(areaId, productId, change) {
    if (!currentOrder) return;

    updateOrderPlan(currentOrder.id, (plan) => ({
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
    }));
  }

  function removeItemFromArea(areaId, productId) {
    if (!currentOrder) return;

    updateOrderPlan(currentOrder.id, (plan) => ({
      ...plan,
      areas: safeAreas(plan).map((area) => {
        if (area.id !== areaId) return area;

        return {
          ...area,
          items: safeItems(area).filter((item) => item.productId !== productId),
        };
      }),
    }));
  }

  function clearCurrentAreaItems() {
    if (!currentOrder || !currentAreaId) return;

    updateOrderPlan(currentOrder.id, (plan) => ({
      ...plan,
      areas: safeAreas(plan).map((area) =>
        area.id === currentAreaId ? { ...area, items: [] } : area
      ),
    }));
  }

  function updateCurrentPlanField(field, value) {
    if (!currentOrder) return;

    updateOrderPlan(currentOrder.id, (plan) => ({
      ...plan,
      [field]: value,
    }));
  }

  function submitPlan() {
    if (!currentOrder || !currentPlan) return;

    updateOrder(currentOrder.id, (order) => {
      const next = {
        ...order,
        status: "方案已提交",
        planStatus: "方案已提交",
        submittedAt: nowText(),
        customerConfirmStatus: "待确认",
        planLinkStatus: order.planLinkStatus || "未生成",
        plan: {
          ...order.plan,
          submittedAt: nowText(),
          status: "方案已提交",
        },
      };

      return addTimeline(next, "员工提交方案");
    });

    setShowSubmitSheet(false);
    setCurrentPage("orders");
    setActiveStatus("方案已提交");
  }

  function completeOrderByStaff(orderId) {
    const target = orders.find((order) => order.id === orderId);
    if (!target) return;

    if (target.status !== "方案已提交") {
      alert("只有方案已提交后，员工才能标记为已完成。");
      return;
    }

    if (!window.confirm(`确认将「${target.customerName}」标记为已完成吗？`)) {
      return;
    }

    updateOrder(orderId, (order) => {
      const next = {
        ...order,
        status: "已完成",
        planStatus: "已完成",
        deliveryStatus: "已到达",
        executionStatus: "已完成服务",
        completedAt: nowText(),
        plan: order.plan
          ? {
              ...order.plan,
              status: "已完成",
              completedAt: nowText(),
            }
          : order.plan,
      };

      return addTimeline(next, "员工标记订单已完成");
    });

    setActiveStatus("已完成");
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

    const newOrder = {
      id: Date.now(),
      customerName: newOrderForm.customerName.trim(),
      contactName: newOrderForm.contactName.trim() || "待确认",
      phone: newOrderForm.phone.trim(),
      status: "待接单",
      deliveryStatus: "未出发",
      executionStatus: "待联系",
      customerConfirmStatus: "待确认",
      planLinkStatus: "未生成",
      deliveryUpdatedAt: "",
      executionUpdatedAt: "",
      customerConfirmUpdatedAt: "",
      planLinkUpdatedAt: "",
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
      fieldNote: "",
      internalNote: "",
      timeline: [{ time, action: "商户创建并派发订单" }],
      plan: null,
    };

    setOrders((prevOrders) => [newOrder, ...prevOrders]);

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
    });

    setShowCreateOrderSheet(false);
    setIsCreateOrderInputFocused(false);
    setMerchantTab("订单总览");
    setMerchantStatusFilter("全部");
  }

  function buildPlanText(order) {
    const plan = order?.plan;
    const stats = getPlanStats(plan);

    const areaText = safeAreas(plan)
      .map((area) => {
        const items = safeItems(area)
          .map((item) => `- ${item.name} × ${item.quantity}（¥${item.pricePerDay}/天）`)
          .join("\n");

        return `【${area.name}】\n${items || "- 暂无商品"}`;
      })
      .join("\n\n");

    return `绿植租赁方案
项目 / 客户：${order?.customerName || "-"}
联系人：${order?.contactName || "-"}
电话：${order?.phone || "-"}
项目面积：${order?.areaSize || "-"}
进场时间：${order?.expectedDate || "-"}
客户地址：${order?.address || "-"}
执行状态：${order?.executionStatus || "待联系"}
配送状态：${order?.deliveryStatus || "未出发"}
客户确认：${order?.customerConfirmStatus || "待确认"}
预计路程：${order?.distanceText || "待定位"}
预计时间：${order?.etaText || "待定位"}

方案明细：
${areaText || "暂无区域"}

日租金：¥${money(stats.dailyRent)}
租期：${plan?.leaseMonths || 12}月
系统总租金：¥${money(stats.systemTotalRent)}
最终报价：¥${money(stats.finalRent)}
支付方式：${plan?.paymentMethod || "月付"}
押金：${plan?.needDeposit ? "需要" : "不需要"}

现场备注：${order?.fieldNote || "-"}
内部备注：${order?.internalNote || "-"}`;
  }

  function copyCustomerPlanLink(order) {
    if (!order?.plan?.id) {
      alert("还没有方案，无法生成链接。");
      return;
    }

    copyText(`${window.location.origin}?planId=${order.plan.id}`, "客户方案链接已复制");
    updatePlanLinkStatus(order.id, "已复制");
  }

  function exportOrderData(order) {
    const data = {
      ...order,
      exportedAt: nowText(),
      planStats: getPlanStats(order.plan),
    };

    copyText(JSON.stringify(data, null, 2), "订单数据已复制");
  }

  function getNextSuggestion(order) {
    if (order.status === "待接单") return "下一步：员工确认接单";
    if (order.status === "配置中") return "下一步：配置区域和商品，提交方案";
    if (order.status === "方案已提交" && order.customerConfirmStatus === "待确认") return "下一步：联系客户确认方案";
    if (order.status === "方案已提交" && order.executionStatus !== "已完成服务") return "下一步：执行服务并标记完成";
    if (order.status === "已完成") return "订单已完成，可归档";
    return "继续跟进订单";
  }

  function StatusControlGroup({ title, options, value, onChange }) {
    return (
      <div className="sheet-block">
        <p className="sheet-label">{title}</p>
        <div className="option-grid payment-grid">
          {options.map((item) => (
            <button key={item} className={value === item ? "selected" : ""} onClick={() => onChange(item)}>
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

  function DeliveryInfoCard({ order, showControls = false }) {
    return (
      <section className="plan-summary-card">
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

        <div className="plan-summary-top">
          <div>
            <p>客户确认</p>
            <strong>{order.customerConfirmStatus || "待确认"}</strong>
          </div>
          <div>
            <p>方案链接</p>
            <strong>{order.planLinkStatus || "未生成"}</strong>
          </div>
        </div>

        <div className="plan-info-line">
          <span>预计路程</span>
          <strong>{order.distanceText || "待定位"}</strong>
        </div>

        <div className="plan-info-line">
          <span>预计时间</span>
          <strong>{order.etaText || "待定位"}</strong>
        </div>

        <div className="plan-info-line">
          <span>员工定位</span>
          <strong>{order.staffLocation?.locatedAt || "未定位"}</strong>
        </div>

        {order.staffLocation && (
          <div className="plan-info-line">
            <span>定位精度</span>
            <strong>约 {order.staffLocation.accuracy || "-"} 米</strong>
          </div>
        )}

        <div className="empty-card">
          <p>下一步建议</p>
          <span>{getNextSuggestion(order)}</span>
        </div>

        {showControls && (
          <>
            <StatusControlGroup
              title="执行状态"
              options={EXECUTION_STATUS}
              value={order.executionStatus || "待联系"}
              onChange={(value) => updateExecutionStatus(order.id, value)}
            />

            <StatusControlGroup
              title="配送状态"
              options={DELIVERY_STATUS}
              value={order.deliveryStatus || "未出发"}
              onChange={(value) => updateDeliveryStatus(order.id, value)}
            />

            <StatusControlGroup
              title="客户确认状态"
              options={CUSTOMER_CONFIRM_STATUS}
              value={order.customerConfirmStatus || "待确认"}
              onChange={(value) => updateCustomerConfirmStatus(order.id, value)}
            />

            <StatusControlGroup
              title="方案链接状态"
              options={PLAN_LINK_STATUS}
              value={order.planLinkStatus || "未生成"}
              onChange={(value) => updatePlanLinkStatus(order.id, value)}
            />

            <div className="actions mini-actions">
              <button className="ghost-button" onClick={() => locateStaff(order.id)}>
                定位当前位置
              </button>
              <button className="ghost-button" onClick={() => openRouteNavigation(order.address)}>
                路线导航
              </button>
              <button className="ghost-button" onClick={() => copyText(order.address, "地址已复制")}>
                复制地址
              </button>
            </div>
          </>
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
                onChange={(e) => updateOrder(order.id, { fieldNote: e.target.value })}
                placeholder="例如：客户前台空间较窄，建议用中小型植物"
              />
            </div>

            <div className="sheet-block">
              <p className="sheet-label">内部备注</p>
              <input
                className="area-input"
                value={order.internalNote || ""}
                onChange={(e) => updateOrder(order.id, { internalNote: e.target.value })}
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

  function renderCustomerPlanView() {
    if (!customerPlanId) return null;

    if (!customerViewOrder) {
      return (
        <div className="app">
          <section className="empty-card">
            <p>没有找到这个方案</p>
            <span>当前版本的客户方案链接基于本机浏览器数据，后续接数据库后可跨设备查看。</span>
          </section>
        </div>
      );
    }

    const stats = getPlanStats(customerViewOrder.plan);

    return (
      <div className="app">
        <header className="app-header">
          <div>
            <p className="eyebrow">Customer Plan</p>
            <h1>{customerViewOrder.customerName}</h1>
          </div>
        </header>

        <section className="plan-summary-card">
          <div className="plan-summary-top">
            <div>
              <p>方案状态</p>
              <strong>{customerViewOrder.status}</strong>
            </div>
            <div>
              <p>最终报价</p>
              <strong>¥ {money(stats.finalRent)}</strong>
            </div>
          </div>

          <div className="plan-info-line">
            <span>联系人</span>
            <strong>{customerViewOrder.contactName || "-"}</strong>
          </div>
          <div className="plan-info-line">
            <span>联系电话</span>
            <strong>{customerViewOrder.phone || "-"}</strong>
          </div>
          <div className="plan-info-line">
            <span>客户地址</span>
            <strong>{customerViewOrder.address}</strong>
          </div>
        </section>

        <DeliveryInfoCard order={customerViewOrder} />

        <section className="price-card price-detail-card">
          <div><span>日租金</span><strong>¥ {money(stats.dailyRent)}</strong></div>
          <div><span>租期</span><strong>{customerViewOrder.plan?.leaseMonths || 12} 月</strong></div>
          <div><span>系统预计总租金</span><strong>¥ {money(stats.systemTotalRent)}</strong></div>
          <div><span>最终报价</span><strong>¥ {money(stats.finalRent)}</strong></div>
          <div><span>支付方式</span><strong>{customerViewOrder.plan?.paymentMethod || "月付"}</strong></div>
          <div><span>押金</span><strong>{customerViewOrder.plan?.needDeposit ? "需要" : "不需要"}</strong></div>
        </section>

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
                  已选商品：{getAreaProductCount(area)} 件｜区域日租金：¥{" "}
                  {money(getAreaDailyRent(area))}
                </p>

                {safeItems(area).map((item) => (
                  <div className="selected-product-row" key={item.productId}>
                    <div>
                      <strong>{item.name}</strong>
                      <span>¥ {item.pricePerDay}/天 × {item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      </div>
    );
  }

  function renderPlanPage() {
    if (!currentOrder || !currentPlan) return null;

    return (
      <div className="app">
        <header className="plan-header">
          <button className="back-button" onClick={() => setCurrentPage("orders")}>←</button>
          <div>
            <p className="eyebrow">Plan Editor · v2.0</p>
            <h1>{currentOrder.customerName}</h1>
          </div>
        </header>

        <section className="plan-summary-card">
          <div className="plan-summary-top">
            <div><p>方案类型</p><strong>{currentPlan.planType}</strong></div>
            <div><p>项目面积</p><strong>{currentOrder.areaSize}</strong></div>
          </div>

          <div className="plan-info-line"><span>联系人</span><strong>{currentOrder.contactName || "-"}</strong></div>
          <div className="plan-info-line"><span>联系电话</span><strong>{currentOrder.phone || "-"}</strong></div>
          <div className="plan-info-line"><span>进场时间</span><strong>{currentOrder.expectedDate}</strong></div>
          <div className="plan-info-line"><span>客户地址</span><strong>{currentOrder.address}</strong></div>

          <div className="actions mini-actions">
            <button className="ghost-button" onClick={() => callPhone(currentOrder.phone)}>拨打电话</button>
            <button className="ghost-button" onClick={() => copyText(currentOrder.address, "地址已复制")}>复制地址</button>
            <button className="ghost-button" onClick={() => openMapSearch(currentOrder.address)}>搜索地址</button>
            <button className="ghost-button" onClick={() => openRouteNavigation(currentOrder.address)}>路线导航</button>
          </div>
        </section>

        <DeliveryInfoCard order={currentOrder} showControls />
        <NotesCard order={currentOrder} editable />

        <section className="area-section">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">区域</p>
              <h2>区域配置</h2>
            </div>
            <button className="add-area-button" onClick={() => setShowAreaSheet(true)}>新增区域</button>
          </div>

          {planAreas.length === 0 ? (
            <div className="empty-card">
              <p>还没有添加区域</p>
              <span>如：前台、办公室、会议室、走廊、门口</span>
            </div>
          ) : (
            <div className="area-list">
              {planAreas.map((area) => (
                <article className="area-card" key={area.id}>
                  <div>
                    <h3>{area.name}</h3>
                    <p>
                      已选商品：{getAreaProductCount(area)} 件｜区域日租金：¥{" "}
                      {money(getAreaDailyRent(area))}
                    </p>

                    {safeItems(area).length > 0 && (
                      <div className="selected-product-list">
                        {safeItems(area).map((item) => (
                          <div className="selected-product-row" key={item.productId}>
                            <div>
                              <strong>{item.name}</strong>
                              <span>¥ {item.pricePerDay}/天 × {item.quantity}</span>
                            </div>

                            <div className="quantity-controls">
                              <button onClick={() => changeItemQuantity(area.id, item.productId, -1)}>-</button>
                              <b>{item.quantity}</b>
                              <button onClick={() => changeItemQuantity(area.id, item.productId, 1)}>+</button>
                            </div>

                            <button className="remove-item-button" onClick={() => removeItemFromArea(area.id, item.productId)}>删除</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button onClick={() => openProductSheet(area)}>选择商品</button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="price-card price-detail-card">
          <div><span>目前方案日租金</span><strong>¥ {money(currentStats.dailyRent)}</strong></div>
          <div><span>租期</span><strong>{currentPlan.leaseMonths || 12}月</strong></div>
          <div><span>系统预计总租金</span><strong>¥ {money(currentStats.systemTotalRent)}</strong></div>
          <div><span>最终报价</span><strong>¥ {money(currentStats.finalRent)}</strong></div>
          <div><span>支付方式</span><strong>{currentPlan.paymentMethod || "月付"}</strong></div>
          <div><span>押金</span><strong>{currentPlan.needDeposit ? "需要" : "不需要"}</strong></div>
        </section>

        <nav className="bottom-actions">
          <button onClick={() => setShowMoreSheet(true)}>更多</button>
          <button onClick={() => setShowPriceSheet(true)}>改价</button>
          <button onClick={() => setShowPaymentSheet(true)}>租期与支付</button>
          <button className="submit-plan-button" onClick={() => setShowSubmitSheet(true)}>提交方案</button>
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
              <button key={name} onClick={() => setAreaName(name)}>{name}</button>
            ))}
          </div>

          <button className="submit-sheet-button" onClick={addArea}>保存区域</button>
        </section>
      </div>
    );
  }

  function renderProductSheet() {
    return (
      <div className="sheet-mask" onClick={() => setShowProductSheet(false)}>
        <section className="bottom-sheet" onClick={(event) => event.stopPropagation()}>
          <div className="sheet-handle" />
          <div className="sheet-header">
            <div><p className="eyebrow">Product Library</p><h2>{currentArea?.name || "当前区域"}选品</h2></div>
            <button className="close-button" onClick={() => setShowProductSheet(false)}>×</button>
          </div>

          <div className="rent-preview">
            <span>当前区域</span>
            <strong>已选 {getAreaProductCount(currentArea)} 件｜日租金 ¥ {money(getAreaDailyRent(currentArea))}</strong>
          </div>

          <div className="sheet-block">
            <input className="area-input" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="搜索植物名称 / 寓意 / 场景" />
          </div>

          <div className="category-tabs">
            {productCategories.map((category) => (
              <button key={category} className={activeCategory === category ? "active" : ""} onClick={() => { setActiveCategory(category); setActiveSubCategory("大型植物"); }}>
                {category}
              </button>
            ))}
          </div>

          <main className="product-layout">
            <aside className="sub-category-list">
              {subCategories.map((subCategory) => (
                <button key={subCategory} className={activeSubCategory === subCategory ? "active" : ""} onClick={() => setActiveSubCategory(subCategory)}>
                  {subCategory}
                </button>
              ))}
            </aside>

            <section className="product-list">
              {filteredProducts.length === 0 ? (
                <div className="empty-product-card"><p>暂无商品</p><span>可以换个分类，或清空搜索关键词</span></div>
              ) : (
                filteredProducts.map((product) => {
                  const selected = safeItems(currentArea).find((item) => item.productId === product.id);
                  const selectedQuantity = selected ? Number(selected.quantity || 0) : 0;

                  return (
                    <article className="product-card" key={product.id}>
                      <div className="product-image">{product.image}</div>
                      <div className="product-info">
                        <h3>{product.name}</h3>
                        <p>{product.description}</p>
                        <div className="product-bottom">
                          <strong>¥ {product.pricePerDay}/天</strong>
                          <button onClick={() => addProductToArea(product)}>
                            {selectedQuantity > 0 ? `已选 ${selectedQuantity} 件` : "加入方案"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </section>
          </main>

          <button className="submit-sheet-button" onClick={() => setShowProductSheet(false)}>
            已选 {getAreaProductCount(currentArea)} 件｜日租金 ¥ {money(getAreaDailyRent(currentArea))}｜完成选品
          </button>

          <button className="ghost-button" onClick={clearCurrentAreaItems}>清空当前区域商品</button>
        </section>
      </div>
    );
  }

  function renderPaymentSheet() {
    return (
      <div className="sheet-mask" onClick={() => setShowPaymentSheet(false)}>
        <section className="bottom-sheet" onClick={(event) => event.stopPropagation()}>
          <div className="sheet-handle" />
          <div className="sheet-header">
            <div><p className="eyebrow">Payment</p><h2>租期与支付</h2></div>
            <button className="close-button" onClick={() => setShowPaymentSheet(false)}>×</button>
          </div>

          <div className="sheet-block">
            <p className="sheet-label">选择租期</p>
            <div className="option-grid">
              {[6, 12, 24, 36].map((m) => (
                <button key={m} className={Number(currentPlan.leaseMonths || 12) === m ? "selected" : ""} onClick={() => updateCurrentPlanField("leaseMonths", m)}>
                  {m} 月
                </button>
              ))}
            </div>
          </div>

          <div className="sheet-block">
            <p className="sheet-label">支付方式</p>
            <div className="option-grid payment-grid">
              {["月付", "季付", "半年付", "年付"].map((method) => (
                <button key={method} className={currentPlan.paymentMethod === method ? "selected" : ""} onClick={() => updateCurrentPlanField("paymentMethod", method)}>
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div className="deposit-row">
            <div><strong>是否需要押金</strong><span>真实业务里可根据客户情况调整</span></div>
            <button className={currentPlan.needDeposit ? "switch-button active" : "switch-button"} onClick={() => updateCurrentPlanField("needDeposit", !currentPlan.needDeposit)}>
              {currentPlan.needDeposit ? "需要" : "不需要"}
            </button>
          </div>

          <div className="rent-preview"><span>预计总租金</span><strong>¥ {money(currentStats.systemTotalRent)}</strong></div>
          <button className="submit-sheet-button" onClick={() => setShowPaymentSheet(false)}>保存租期与支付</button>
        </section>
      </div>
    );
  }

  function renderPriceSheet() {
    return (
      <div className="sheet-mask" onClick={() => setShowPriceSheet(false)}>
        <section className="bottom-sheet" onClick={(event) => event.stopPropagation()}>
          <div className="sheet-handle" />
          <div className="sheet-header">
            <div><p className="eyebrow">Adjust Price</p><h2>修改最终报价</h2></div>
            <button className="close-button" onClick={() => setShowPriceSheet(false)}>×</button>
          </div>

          <div className="sheet-block">
            <p className="sheet-label">系统预计总租金</p>
            <div className="price-preview-line"><span>按当前商品和租期自动计算</span><strong>¥ {money(currentStats.systemTotalRent)}</strong></div>
          </div>

          <div className="sheet-block">
            <p className="sheet-label">最终报价</p>
            <input className="price-input" type="number" value={currentPlan.customFinalRent || ""} onChange={(e) => updateCurrentPlanField("customFinalRent", e.target.value)} placeholder="不填则使用系统预计总租金" />
          </div>

          <div className="quick-price-list">
            {[money(currentStats.systemTotalRent), 1980, 2880, 3880].map((price) => (
              <button key={price} onClick={() => updateCurrentPlanField("customFinalRent", String(price))}>¥ {price}</button>
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
          <button className="submit-sheet-button" onClick={() => updatePlanLinkStatus(currentOrder.id, "已发送")}>标记方案已发送</button>
          <button className="submit-sheet-button" onClick={() => openRouteNavigation(currentOrder.address)}>打开客户地址导航</button>
          <button className="submit-sheet-button" onClick={() => locateStaff(currentOrder.id)}>定位当前位置</button>
          <button className="submit-sheet-button" onClick={() => exportOrderData(currentOrder)}>导出当前订单数据</button>

          <button className="ghost-button danger" onClick={() => {
            updateOrderPlan(currentOrder.id, (plan) => ({ ...plan, areas: [] }));
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
            <div><p className="eyebrow">Submit Plan</p><h2>确认提交方案</h2></div>
            <button className="close-button" onClick={() => setShowSubmitSheet(false)}>×</button>
          </div>

          <div className="sheet-block">
            <p className="sheet-label">方案摘要</p>
            <div className="confirm-row"><span>项目 / 客户</span><strong>{currentOrder.customerName}</strong></div>
            <div className="confirm-row"><span>联系人</span><strong>{currentOrder.contactName || "-"}</strong></div>
            <div className="confirm-row"><span>电话</span><strong>{currentOrder.phone || "-"}</strong></div>
            <div className="confirm-row"><span>执行状态</span><strong>{currentOrder.executionStatus || "待联系"}</strong></div>
            <div className="confirm-row"><span>配送状态</span><strong>{currentOrder.deliveryStatus || "未出发"}</strong></div>
            <div className="confirm-row"><span>区域数量</span><strong>{currentStats.areaCount} 个</strong></div>
            <div className="confirm-row"><span>商品数量</span><strong>{currentStats.productCount} 件</strong></div>
            <div className="confirm-row"><span>日租金</span><strong>¥ {money(currentStats.dailyRent)}</strong></div>
            <div className="confirm-row"><span>最终报价</span><strong>¥ {money(currentStats.finalRent)}</strong></div>
            <div className="confirm-row"><span>支付方式</span><strong>{currentPlan.paymentMethod}</strong></div>
            <div className="confirm-row"><span>押金</span><strong>{currentPlan.needDeposit ? "需要" : "不需要"}</strong></div>
          </div>

          {currentStats.productCount === 0 && (
            <div className="rent-preview"><span>提醒</span><strong>当前还没有添加商品，也可以先提交测试流程</strong></div>
          )}

          <button className="submit-sheet-button" onClick={submitPlan}>确认提交方案</button>
        </section>
      </div>
    );
  }

  function renderMerchantPage() {
    const pendingCount = orders.filter((order) => order.status === "待接单").length;
    const configuringCount = orders.filter((order) => order.status === "配置中").length;
    const submittedCount = orders.filter((order) => order.status === "方案已提交").length;
    const completedCount = orders.filter((order) => order.status === "已完成").length;

    if (selectedOrderDetail) {
      const stats = getPlanStats(selectedOrderDetail.plan);

      return (
        <div className="app">
          <header className="plan-header">
            <button className="back-button" onClick={() => setSelectedOrderDetail(null)}>←</button>
            <div><p className="eyebrow">Order Detail</p><h1>{selectedOrderDetail.customerName}</h1></div>
          </header>

          <section className="plan-summary-card">
            <div className="plan-summary-top">
              <div><p>订单状态</p><strong>{selectedOrderDetail.planStatus || selectedOrderDetail.status}</strong></div>
              <div><p>项目面积</p><strong>{selectedOrderDetail.areaSize}</strong></div>
            </div>

            <div className="plan-info-line"><span>联系人</span><strong>{selectedOrderDetail.contactName || "-"}</strong></div>
            <div className="plan-info-line"><span>联系电话</span><strong>{selectedOrderDetail.phone || "-"}</strong></div>
            <div className="plan-info-line"><span>期望进场</span><strong>{selectedOrderDetail.expectedDate}</strong></div>
            <div className="plan-info-line"><span>客户地址</span><strong>{selectedOrderDetail.address}</strong></div>
            <div className="plan-info-line"><span>订单来源</span><strong>{selectedOrderDetail.source || "商户派单"}</strong></div>

            {selectedOrderDetail.plan && (
              <div className="plan-info-line"><span>当前报价</span><strong>¥ {money(stats.finalRent)}</strong></div>
            )}

            <p className="description">{selectedOrderDetail.description}</p>

            <div className="actions">
              <button className="ghost-button" onClick={() => callPhone(selectedOrderDetail.phone)}>拨打电话</button>
              <button className="ghost-button" onClick={() => copyText(selectedOrderDetail.address, "地址已复制")}>复制地址</button>
              <button className="ghost-button" onClick={() => openMapSearch(selectedOrderDetail.address)}>搜索地址</button>
              <button className="ghost-button" onClick={() => openRouteNavigation(selectedOrderDetail.address)}>路线导航</button>
              <button className="ghost-button" onClick={() => exportOrderData(selectedOrderDetail)}>导出数据</button>

              {selectedOrderDetail.plan && (
                <button className="primary-button" onClick={() => { setMerchantViewingOrder(selectedOrderDetail); setSelectedOrderDetail(null); }}>
                  查看方案
                </button>
              )}
            </div>
          </section>

          <DeliveryInfoCard order={selectedOrderDetail} />
          <NotesCard order={selectedOrderDetail} />
          <TimelineCard order={selectedOrderDetail} />
        </div>
      );
    }

    if (merchantViewingOrder) {
      const stats = getPlanStats(merchantViewingOrder.plan);

      return (
        <div className="app">
          <header className="plan-header">
            <button className="back-button" onClick={() => setMerchantViewingOrder(null)}>←</button>
            <div><p className="eyebrow">Plan Detail</p><h1>{merchantViewingOrder.customerName}</h1></div>
          </header>

          <section className="plan-summary-card">
            <div className="plan-summary-top">
              <div><p>方案状态</p><strong>{merchantViewingOrder.status}</strong></div>
              <div><p>最终报价</p><strong>¥ {money(stats.finalRent)}</strong></div>
            </div>

            <div className="plan-info-line"><span>联系人</span><strong>{merchantViewingOrder.contactName || "-"}</strong></div>
            <div className="plan-info-line"><span>电话</span><strong>{merchantViewingOrder.phone || "-"}</strong></div>
            <div className="plan-info-line"><span>客户地址</span><strong>{merchantViewingOrder.address}</strong></div>
            <div className="plan-info-line"><span>提交时间</span><strong>{merchantViewingOrder.submittedAt || "-"}</strong></div>

            <div className="actions">
              <button className="ghost-button" onClick={() => callPhone(merchantViewingOrder.phone)}>拨打电话</button>
              <button className="ghost-button" onClick={() => copyText(merchantViewingOrder.address, "地址已复制")}>复制地址</button>
              <button className="ghost-button" onClick={() => openRouteNavigation(merchantViewingOrder.address)}>路线导航</button>
              <button className="ghost-button" onClick={() => copyText(buildPlanText(merchantViewingOrder), "方案已复制")}>复制方案</button>
            </div>
          </section>

          <DeliveryInfoCard order={merchantViewingOrder} />
          <NotesCard order={merchantViewingOrder} />
          <TimelineCard order={merchantViewingOrder} />

          <section className="price-card price-detail-card">
            <div><span>日租金</span><strong>¥ {money(stats.dailyRent)}</strong></div>
            <div><span>租期</span><strong>{merchantViewingOrder.plan?.leaseMonths || 12}月</strong></div>
            <div><span>系统预计总租金</span><strong>¥ {money(stats.systemTotalRent)}</strong></div>
            <div><span>最终报价</span><strong>¥ {money(stats.finalRent)}</strong></div>
            <div><span>支付方式</span><strong>{merchantViewingOrder.plan?.paymentMethod || "月付"}</strong></div>
            <div><span>押金</span><strong>{merchantViewingOrder.plan?.needDeposit ? "需要" : "不需要"}</strong></div>
          </section>

          <section className="area-section">
            <div className="section-title-row">
              <div><p className="eyebrow">Areas</p><h2>方案明细</h2></div>
            </div>

            {safeAreas(merchantViewingOrder.plan).length === 0 ? (
              <div className="empty-card"><p>这个方案还没有区域明细</p></div>
            ) : (
              <div className="area-list">
                {safeAreas(merchantViewingOrder.plan).map((area) => (
                  <article className="area-card" key={area.id}>
                    <div>
                      <h3>{area.name}</h3>
                      <p>已选商品：{getAreaProductCount(area)} 件｜区域日租金：¥ {money(getAreaDailyRent(area))}</p>

                      {safeItems(area).map((item) => (
                        <div className="selected-product-row" key={item.productId}>
                          <div><strong>{item.name}</strong><span>¥ {item.pricePerDay}/天 × {item.quantity}</span></div>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="empty-card">
              <p>商户端仅查看订单状态</p>
              <span>订单完成由员工端操作，商户端这里只负责查看结果。</span>
            </div>
          </section>
        </div>
      );
    }

    return (
      <div className="app">
        <header className="app-header">
          <div><p className="eyebrow">Merchant Console · v2.0</p><h1>商户管理端</h1></div>
          <button className="role-button" onClick={() => switchRole("staff")}>切到员工端</button>
        </header>

        <section className="tabs">
          {["订单总览", "已提交方案"].map((tab) => (
            <button key={tab} className={merchantTab === tab ? "tab active" : "tab"} onClick={() => setMerchantTab(tab)}>
              {tab}
            </button>
          ))}
        </section>

        <section className="plan-summary-card">
          <div className="plan-summary-top">
            <div><p>待接单</p><strong>{pendingCount} 单</strong></div>
            <div><p>配置中</p><strong>{configuringCount} 单</strong></div>
          </div>
          <div className="plan-summary-top">
            <div><p>方案已提交</p><strong>{submittedCount} 单</strong></div>
            <div><p>已完成</p><strong>{completedCount} 单</strong></div>
          </div>
          <div className="plan-info-line"><span>已提交方案</span><strong>{submittedOrders.length} 份</strong></div>
        </section>

        {merchantTab === "订单总览" && (
          <>
            <section className="area-section">
              <div className="section-title-row">
                <div><p className="eyebrow">Create Order</p><h2>派发新订单</h2></div>
                <button className="add-area-button" onClick={() => setShowCreateOrderSheet(true)}>创建订单</button>
              </div>
            </section>

            <section className="tabs">
              {MERCHANT_STATUS_TABS.map((status) => (
                <button key={status} className={merchantStatusFilter === status ? "tab active" : "tab"} onClick={() => setMerchantStatusFilter(status)}>
                  {status}
                </button>
              ))}
            </section>

            <section className="area-section">
              <div className="section-title-row">
                <div><p className="eyebrow">Orders</p><h2>{merchantStatusFilter === "全部" ? "全部订单" : merchantStatusFilter}</h2></div>
              </div>

              <main className="order-list">
                {merchantOrders.length === 0 ? (
                  <div className="empty-card"><p>当前状态下暂无订单</p><span>可以切换其他状态查看</span></div>
                ) : (
                  merchantOrders.map((order) => {
                    const stats = getPlanStats(order.plan);

                    return (
                      <article className="order-card" key={order.id}>
                        <div className="order-card-header">
                          <div><h2>{order.customerName}</h2><p>{order.planStatus || order.status}</p></div>
                          <span className="area-size">{order.areaSize}</span>
                        </div>

                        <div className="tag-list">
                          {(Array.isArray(order.tags) ? order.tags : []).map((tag) => <span key={tag}>{tag}</span>)}
                        </div>

                        <div className="info-row"><span>联系人</span><strong>{order.contactName || "-"}</strong></div>
                        <div className="info-row"><span>联系电话</span><strong>{order.phone || "-"}</strong></div>
                        <div className="info-row"><span>执行状态</span><strong>{order.executionStatus || "待联系"}</strong></div>
                        <div className="info-row"><span>配送状态</span><strong>{order.deliveryStatus || "未出发"}</strong></div>
                        <div className="info-row"><span>客户确认</span><strong>{order.customerConfirmStatus || "待确认"}</strong></div>
                        <div className="info-row"><span>预计时间</span><strong>{order.etaText || "待定位"}</strong></div>
                        <div className="info-row"><span>订单来源</span><strong>{order.source || "商户派单"}</strong></div>
                        <div className="info-row"><span>期望进场</span><strong>{order.expectedDate}</strong></div>
                        <div className="info-row"><span>客户地址</span><strong>{order.address}</strong></div>

                        {order.plan && (
                          <div className="info-row"><span>当前报价</span><strong>¥ {money(stats.finalRent)}</strong></div>
                        )}

                        <div className="empty-card">
                          <p>下一步建议</p>
                          <span>{getNextSuggestion(order)}</span>
                        </div>

                        <p className="description">{order.description}</p>
                        <p className="dispatch-time">派单时间：{order.dispatchTime}</p>

                        <div className="actions">
                          <button className="ghost-button" onClick={() => callPhone(order.phone)}>拨打电话</button>
                          <button className="ghost-button" onClick={() => copyText(order.address, "地址已复制")}>复制地址</button>
                          <button className="ghost-button" onClick={() => openRouteNavigation(order.address)}>路线导航</button>
                          <button className="primary-button" onClick={() => { setSelectedOrderDetail(order); setMerchantViewingOrder(null); }}>查看订单详情</button>
                        </div>
                      </article>
                    );
                  })
                )}
              </main>
            </section>
          </>
        )}

        {merchantTab === "已提交方案" && (
          <section className="area-section">
            <div className="section-title-row">
              <div><p className="eyebrow">Submitted Plans</p><h2>员工提交的方案</h2></div>
            </div>

            {submittedOrders.length === 0 ? (
              <div className="empty-card"><p>暂时还没有员工提交方案</p><span>先切到员工端，完成一次提交方案流程</span></div>
            ) : (
              <div className="order-list">
                {submittedOrders.map((order) => {
                  const stats = getPlanStats(order.plan);

                  return (
                    <article className="order-card" key={order.id}>
                      <div className="order-card-header">
                        <div><h2>{order.customerName}</h2><p>{order.status}</p></div>
                        <span className="area-size">¥ {money(stats.finalRent)}</span>
                      </div>

                      <div className="info-row"><span>联系人</span><strong>{order.contactName || "-"}</strong></div>
                      <div className="info-row"><span>执行状态</span><strong>{order.executionStatus || "待联系"}</strong></div>
                      <div className="info-row"><span>客户确认</span><strong>{order.customerConfirmStatus || "待确认"}</strong></div>
                      <div className="info-row"><span>商品数量</span><strong>{stats.productCount} 件</strong></div>
                      <div className="info-row"><span>支付方式</span><strong>{order.plan?.paymentMethod || "月付"}</strong></div>
                      <div className="info-row"><span>提交时间</span><strong>{order.submittedAt || "-"}</strong></div>

                      <div className="actions">
                        <button className="primary-button" onClick={() => { setMerchantViewingOrder(order); setSelectedOrderDetail(null); }}>查看方案</button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {showCreateOrderSheet && renderCreateOrderSheet()}
      </div>
    );
  }

  function renderCreateOrderSheet() {
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
          const stillInCreateForm = active && active.classList && active.classList.contains("create-order-input");
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
            <div><p className="eyebrow">New Order · v2.0</p><h2>创建新订单</h2></div>
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
            <p className="sheet-label">项目面积</p>
            <input className={inputClass} {...inputFocusProps} value={newOrderForm.areaSize} onChange={(e) => setNewOrderForm((form) => ({ ...form, areaSize: e.target.value }))} placeholder="例如：260㎡" />
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

          {isCreateOrderInputFocused && (
            <div className="empty-card">
              <p>填写完成后收起键盘</p>
              <span>收起键盘后会显示“创建并派发订单”按钮。</span>
            </div>
          )}

          <div style={stickyStyle}>
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
        </section>
      </div>
    );
  }

  if (customerPlanId) return renderCustomerPlanView();
  if (currentPage === "plan" && currentOrder && currentPlan) return renderPlanPage();
  if (activeRole === "merchant") return renderMerchantPage();

  return (
    <div className="app">
      <header className="app-header">
        <div><p className="eyebrow">Green Rental · v2.0</p><h1>绿植租赁接单系统</h1></div>
        <button className="role-button" onClick={() => switchRole("merchant")}>切到商户端</button>
      </header>

      <section className="tabs">
        {STATUS_TABS.map((status) => (
          <button key={status} className={activeStatus === status ? "tab active" : "tab"} onClick={() => setActiveStatus(status)}>
            {status}
          </button>
        ))}
      </section>

      <main className="order-list">
        {filteredStaffOrders.length === 0 ? (
          <div className="empty-card"><p>暂无{activeStatus}订单</p><span>切换其他状态看看</span></div>
        ) : (
          filteredStaffOrders.map((order) => (
            <article className="order-card" key={order.id}>
              <div className="order-card-header">
                <div><h2>{order.customerName}</h2><p>{order.planStatus || order.status}</p></div>
                <span className="area-size">{order.areaSize}</span>
              </div>

              <div className="tag-list">
                {(Array.isArray(order.tags) ? order.tags : []).map((tag) => <span key={tag}>{tag}</span>)}
              </div>

              <div className="info-row"><span>联系人</span><strong>{order.contactName || "-"}</strong></div>
              <div className="info-row"><span>联系电话</span><strong>{order.phone || "-"}</strong></div>
              <div className="info-row"><span>执行状态</span><strong>{order.executionStatus || "待联系"}</strong></div>
              <div className="info-row"><span>配送状态</span><strong>{order.deliveryStatus || "未出发"}</strong></div>
              <div className="info-row"><span>客户确认</span><strong>{order.customerConfirmStatus || "待确认"}</strong></div>
              <div className="info-row"><span>预计时间</span><strong>{order.etaText || "待定位"}</strong></div>
              <div className="info-row"><span>订单来源</span><strong>{order.source || "商户派单"}</strong></div>
              <div className="info-row"><span>期望进场</span><strong>{order.expectedDate}</strong></div>
              <div className="info-row"><span>客户地址</span><strong>{order.address}</strong></div>

              <div className="empty-card">
                <p>下一步建议</p>
                <span>{getNextSuggestion(order)}</span>
              </div>

              <p className="description">{order.description}</p>
              <p className="dispatch-time">派单时间：{order.dispatchTime}</p>

              <div className="actions">
                <button className="ghost-button" onClick={() => callPhone(order.phone)}>拨打电话</button>
                <button className="ghost-button" onClick={() => openRouteNavigation(order.address)}>路线导航</button>
                <button className="ghost-button" onClick={() => locateStaff(order.id)}>定位</button>
                <button className="ghost-button" onClick={() => copyText(order.address, "地址已复制")}>复制地址</button>

                {order.status === "待接单" && (
                  <>
                    <button className="ghost-button danger">拒绝接单</button>
                    <button className="primary-button" onClick={() => setSelectedOrder(order)}>确认接单</button>
                  </>
                )}

                {order.status === "配置中" && (
                  <button className="primary-button" onClick={() => openPlanForOrder(order)}>继续编辑方案</button>
                )}

                {order.status === "方案已提交" && (
                  <>
                    <button className="primary-button" onClick={() => openPlanForOrder(order)}>查看方案</button>
                    <button className="submit-plan-button" onClick={() => completeOrderByStaff(order.id)}>完成订单</button>
                  </>
                )}

                {order.status === "已完成" && (
                  <button className="primary-button" onClick={() => openPlanForOrder(order)}>查看方案</button>
                )}
              </div>
            </article>
          ))
        )}
      </main>

      {selectedOrder && (
        <div className="sheet-mask" onClick={() => setSelectedOrder(null)}>
          <section className="bottom-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />

            <div className="sheet-header">
              <div><p className="eyebrow">Confirm Order</p><h2>确认接单</h2></div>
              <button className="close-button" onClick={() => setSelectedOrder(null)}>×</button>
            </div>

            <div className="sheet-block">
              <p className="sheet-label">选择方案类型</p>
              <div className="plan-type-grid">
                <button className={planType === "租赁方案" ? "selected" : ""} onClick={() => setPlanType("租赁方案")}>租赁方案</button>
                <button className={planType === "零售方案" ? "selected" : ""} onClick={() => setPlanType("零售方案")}>零售方案</button>
              </div>
            </div>

            <div className="sheet-block">
              <p className="sheet-label">客户信息</p>
              <div className="confirm-row"><span>项目 / 客户</span><strong>{selectedOrder.customerName}</strong></div>
              <div className="confirm-row"><span>联系人</span><strong>{selectedOrder.contactName || "-"}</strong></div>
              <div className="confirm-row"><span>电话</span><strong>{selectedOrder.phone || "-"}</strong></div>
              <div className="confirm-row"><span>项目面积</span><strong>{selectedOrder.areaSize}</strong></div>
              <div className="confirm-row"><span>进场时间</span><strong>{selectedOrder.expectedDate}</strong></div>
              <div className="confirm-row address"><span>客户地址</span><strong>{selectedOrder.address}</strong></div>
            </div>

            <button className="submit-sheet-button" onClick={acceptOrderAndCreatePlan}>
              确认接单并创建{planType}
            </button>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
