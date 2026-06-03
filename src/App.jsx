import React, { useEffect, useMemo, useRef, useState } from "react";
import { ImageUploader } from "./components/common/ImageUploader";
import { AuthPage } from "./components/auth/AuthPage";
import { GardenIcons } from "./GardenIcons";
import { StaffMobile } from "./components/staff/StaffMobile";
import { supabase } from "./lib/supabaseClient";
import defaultHomeHeroImage from "./assets/hero.png";
import miniProgramHomeReference from "./assets/visual/mini-program-home-reference.png";
import sidebarAestheticSpaceCard from "./assets/visual/sidebar-aesthetic-space-card.png";
import "./App.css";

const SUPABASE_URL = "https://kvdxgyymlfnnurdigtkj.supabase.co";
const SUPABASE_KEY = "sb_publishable_FFoHUmn4RwaOkvx2XK7QHg__O7iWYdJ";
const SUPABASE_ANON_KEY = SUPABASE_KEY;
const ORDERS_API = `${SUPABASE_URL}/rest/v1/orders`;

const STORAGE_KEY = "green-rental-mobile-v24";
const PRODUCT_STORAGE_KEY = "green-rental-products-v29";
const SERVICE_CONFIG_STORAGE_KEY = "green-rental-service-config-v1";
const PRODUCT_CATEGORY_STORAGE_KEY = "green-rental-product-categories-v1";
const CUSTOMER_STORAGE_KEY = "green-rental-customers-v31";
const PROJECT_INQUIRY_STORAGE_KEY = "green-rental-project-inquiries-v1";
const MINI_PROGRAM_APPOINTMENT_STORAGE_KEY = "green-rental-mini-program-appointments-v1";
const MINI_PROGRAM_HOME_STORAGE_KEY = "green-rental-mini-program-home-v1";
const SERVICE_SETTINGS_STORAGE_KEY = "green-rental-service-settings-v1";
const STAFF_DIRECTORY_STORAGE_KEY = "green-rental-staff-directory-v1";
const STAFF_AVATAR_STORAGE_KEY = "green-rental-staff-avatar-v1";
const STAFF_AVATAR_CACHE_STORAGE_KEY = "green-rental-staff-avatar-cache-v1";
const CURRENT_STAFF_STORAGE_KEY = "green-rental-current-staff-v1";
const STAFF_AVATAR_BUCKET = "staff-avatars";
const STAFF_PROFILE_API = `${SUPABASE_URL}/rest/v1/staff_profiles`;
const PRODUCT_CLOUD_ID = 999999001;

const ORDER_STATUS = ["待接单", "配置中", "待商户确认", "待执行", "执行中", "待商户归档", "已完成"];
const MERCHANT_STATUS_TABS = ["全部", ...ORDER_STATUS];
const STAFF_TABS = ["待接单", "做方案", "执行中", "已完成"];
const STAFF_APP_TABS = ["首页", "任务", "上报", "我的"];
const MERCHANT_TABS = ["工作台", "订单管理", "团队成员", "执行监测", "商品与服务", "客户库", "项目线索", "小程序装修", "设置"];
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
const DELIVERY_STATUS = ["待执行", "前往中", "已到达", "已完成"];
const EXECUTION_STATUS = ["待执行", "前往中", "已到达", "现场执行中", "已完成"];
const CUSTOMER_CONFIRM_STATUS = ["待确认", "已确认", "有异议"];
const PLAN_LINK_STATUS = ["未生成", "已复制", "已发送"];
const BUSINESS_PLAN_TYPES = ["租赁方案", "养护服务", "售卖订单", "临时摆场", "园林改造"];
const SERVICE_TYPE_OPTIONS = [
  ["租赁", "租赁方案"],
  ["养护", "养护服务"],
  ["售卖", "售卖订单"],
  ["摆场", "临时摆场"],
  ["园林", "园林改造"],
];
const PROJECT_INQUIRY_STATUS = ["待跟进", "已联系", "已转订单", "暂缓", "无效"];
const MINI_PROGRAM_APPOINTMENT_STATUS = ["待确认", "已联系", "已转订单", "暂缓", "已取消"];
const HOME_BANNER_LAYOUT_TYPES = [
  ["single", "单图横幅"],
  ["triple", "三图拼接"],
];
const HOME_BANNER_LINK_TYPES = [
  ["none", "不跳转"],
  ["internal", "内部跳转"],
  ["external", "外部跳转"],
];
const HOME_BANNER_INTERNAL_TARGETS = [
  ["inspiration_list", "空间灵感列表"],
  ["plant_shop", "花植选购"],
  ["rental_consult", "租赁咨询表单"],
  ["care_service", "养护服务预约"],
  ["garden_project", "园林改造咨询"],
  ["product_detail", "指定植物详情"],
];
const MINI_PROGRAM_DECOR_TABS = ["首页主图", "首页广告位", "摆放灵感"];
const MINI_PROGRAM_HOME_ENTRIES = ["养护服务", "租赁方案", "花植选购"];
const INSPIRATION_CATEGORIES = ["全部", "办公室", "前台", "门店", "阳台"];
const INSPIRATION_STATUS_OPTIONS = ["已上架", "已下架"];
const SALE_DELIVERY_LEAD_DAY_OPTIONS = [1, 2, 3, 4, 5];
const STAFF_EMPLOYEE_TYPE_LABELS = {
  internal: "公司员工",
  partner: "外部执行方",
};

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
const PRODUCT_PLACE_TAGS = ["客厅", "前台", "办公室", "会议室", "走廊", "阳台", "玄关", "大堂", "商业空间", "展厅", "茶室", "店铺", "桌面", "窗边", "阴凉处"];
const CARE_DIFFICULTY_OPTIONS = [
  ["简单", "适合新手，耐养护，日常维护简单。"],
  ["中等", "需要定期观察光照、浇水和叶片状态。"],
  ["较高", "对环境和养护频率要求更高，适合有经验客户或专业养护。"],
];
const defaultProductCategories = [
  { id: "cat-large-plants", nameZh: "大型绿植", nameEn: "Large Plants", showEnglish: false, visibleInMiniProgram: true, sortOrder: 10, businessType: "sale" },
  { id: "cat-medium-plants", nameZh: "中型绿植", nameEn: "Medium Plants", showEnglish: false, visibleInMiniProgram: true, sortOrder: 20, businessType: "sale" },
  { id: "cat-desk-plants", nameZh: "桌面盆栽", nameEn: "Desk Plants", showEnglish: false, visibleInMiniProgram: true, sortOrder: 30, businessType: "sale" },
  { id: "cat-opening-gifts", nameZh: "开业绿植", nameEn: "Opening Gifts", showEnglish: false, visibleInMiniProgram: true, sortOrder: 40, businessType: "sale" },
  { id: "cat-planters", nameZh: "花盆花器", nameEn: "Planters", showEnglish: false, visibleInMiniProgram: true, sortOrder: 50, businessType: "sale" },
  { id: "cat-care-supplies", nameZh: "养护用品", nameEn: "Care Supplies", showEnglish: false, visibleInMiniProgram: true, sortOrder: 60, businessType: "care" },
  { id: "cat-rental-indoor", nameZh: "室内绿植", nameEn: "Indoor Plants", showEnglish: false, visibleInMiniProgram: false, sortOrder: 70, businessType: "rental" },
  { id: "cat-rental-outdoor", nameZh: "室外植物", nameEn: "Outdoor Plants", showEnglish: false, visibleInMiniProgram: false, sortOrder: 80, businessType: "rental" },
];

const defaultProjectInquiries = [
  {
    id: "inq-001",
    source: "mini_program",
    type: "garden_project",
    contactName: "王经理",
    phone: "13800008881",
    address: "杭州市滨江区江南大道 1688 号",
    projectType: "办公园区入口景观改造",
    areaSize: "约 300-500㎡",
    budgetRange: "10-20 万",
    stylePreference: "现代自然、低维护、四季常绿",
    expectedTime: "2026-07 前完成",
    photos: ["🌿", "🏡"],
    note: "希望先做入口两侧和休息区，后续再扩展到整园。",
    status: "待跟进",
    followUpNote: "",
    createdAt: "2026-06-01 10:20",
    convertedOrderId: "",
  },
  {
    id: "inq-002",
    source: "mini_program",
    type: "garden_project",
    contactName: "李总",
    phone: "13900009992",
    address: "杭州市上城区某商业街区",
    projectType: "商业空间庭院造景",
    areaSize: "约 80-120㎡",
    budgetRange: "5-10 万",
    stylePreference: "日式禅意、适合拍照打卡",
    expectedTime: "一个月内",
    photos: ["🏞️"],
    note: "目前空间比较空，想要增加绿植、石景和夜间灯光氛围。",
    status: "已联系",
    followUpNote: "已电话沟通，客户希望本周安排现场勘察。",
    createdAt: "2026-05-31 15:45",
    convertedOrderId: "",
  },
  {
    id: "inq-003",
    source: "mini_program",
    type: "garden_project",
    contactName: "陈女士",
    phone: "13700006663",
    address: "杭州市西湖区别墅庭院",
    projectType: "私家庭院局部翻新",
    areaSize: "约 50㎡",
    budgetRange: "3-5 万",
    stylePreference: "自然花境、亲子活动区",
    expectedTime: "暑假前",
    photos: ["🌷", "🪴"],
    note: "希望增加一块儿童活动区域，并减少蚊虫和积水。",
    status: "待跟进",
    followUpNote: "",
    createdAt: "2026-05-30 09:10",
    convertedOrderId: "",
  },
];

const defaultMiniProgramAppointments = [
  {
    id: "appt-care-001",
    source: "mini_program",
    type: "care_service",
    serviceType: "maintenance",
    packageName: "标准养护",
    contactName: "周女士",
    phone: "13800006661",
    address: "杭州市滨江区春晓路 88 号",
    serviceArea: "办公室前台与会议区",
    areaSize: "约 120㎡",
    plantCount: "约 26 盆",
    appointmentDate: "2026-06-08",
    timeWindow: "10:00-12:00",
    expectedTime: "2026-06-08 10:00-12:00",
    customerNote: "希望先处理黄叶和盆面清理，前台几盆植物状态比较差。",
    quotedPrice: "280",
    photos: [],
    status: "待确认",
    merchantNote: "",
    createdAt: "2026-06-02 09:40",
    convertedOrderId: "",
    miniProgramPayload: {
      entry: "养护服务",
      submitAction: "立即预约",
    },
  },
  {
    id: "appt-care-002",
    source: "mini_program",
    type: "care_service",
    serviceType: "maintenance",
    packageName: "专项处理",
    contactName: "林经理",
    phone: "13900007772",
    address: "杭州市上城区湖滨路 18 号",
    serviceArea: "店铺入口绿植区",
    areaSize: "约 35㎡",
    plantCount: "8 盆",
    appointmentDate: "2026-06-10",
    timeWindow: "14:00-16:00",
    expectedTime: "2026-06-10 14:00-16:00",
    customerNote: "疑似虫害，想让师傅上门判断是否需要换盆或用药。",
    quotedPrice: "",
    photos: [],
    status: "待确认",
    merchantNote: "",
    createdAt: "2026-06-02 11:15",
    convertedOrderId: "",
    miniProgramPayload: {
      entry: "养护服务",
      submitAction: "立即预约",
    },
  },
];

const defaultMiniProgramHomeConfig = {
  homeModules: [
    {
      id: "home-hero",
      type: "hero",
      title: "首页主图",
      hero: {
        imageUrl: "",
        localPreviewUrl: "",
        title: "",
        subtitle: "",
        visible: true,
        linkType: "none",
        linkTarget: "",
      },
    },
    {
      id: "home-banner",
      type: "banner",
      title: "首页广告位",
      items: [
        {
          id: "banner-garden-project",
          title: "园林改造咨询",
          layoutType: "single",
          images: [
            {
              imageUrl: defaultHomeHeroImage,
              localPreviewUrl: "",
              placeholder: "园林场景",
            },
          ],
          linkType: "internal",
          linkTarget: "garden_project",
          visible: true,
          sortOrder: 10,
        },
        {
          id: "banner-space-inspiration",
          title: "空间灵感",
          layoutType: "triple",
          images: [
            { imageUrl: "", localPreviewUrl: "", placeholder: "花植空间" },
            { imageUrl: "", localPreviewUrl: "", placeholder: "庭院空间" },
            { imageUrl: "", localPreviewUrl: "", placeholder: "茶咖空间" },
          ],
          linkType: "none",
          linkTarget: "",
          visible: true,
          sortOrder: 20,
        },
      ],
    },
    {
      id: "home-inspiration",
      type: "inspiration",
      title: "摆放灵感",
      items: [
        {
          id: "inspiration-fiddle-leaf",
          title: "琴叶榕落地盆栽",
          description: "宽大叶片，优雅大气，适合现代办公空间。",
          category: "办公室",
          tags: ["大叶植物", "空气净化", "易打理"],
          imageUrl: "",
          localPreviewUrl: "",
          linkedProductId: "sale-qinyerong",
          status: "已上架",
          sortOrder: 1,
        },
        {
          id: "inspiration-bird",
          title: "天堂鸟盆栽组合",
          description: "热带风情，姿态优雅，提升空间格调。",
          category: "前台",
          tags: ["热带风情", "大气美观", "喜光"],
          imageUrl: "",
          localPreviewUrl: "",
          linkedProductId: "sale-tiantianniao",
          status: "已上架",
          sortOrder: 2,
        },
        {
          id: "inspiration-monstera",
          title: "龟背竹盆栽",
          description: "叶片独特，净化空气，适合自然风空间。",
          category: "办公室",
          tags: ["净化空气", "耐阴", "造型独特"],
          imageUrl: "",
          localPreviewUrl: "",
          linkedProductId: "sale-guibeizhu",
          status: "已下架",
          sortOrder: 3,
        },
      ],
    },
  ],
};

const defaultServiceSettings = {
  saleDeliveryLeadDays: 1,
  saleDeliveryLabel: "T+1",
  saleDeliveryDescription: "客户小程序售卖下单后，默认从次日开始安排配送。",
};

const defaultProducts = [
  { id: "rental-facai", name: "发财树", category: "室内绿植", subCategory: "大型植物", description: "寓意财源滚滚，适合前台、办公室、会议室。", displayDescription: "适合前台、办公室、会议室。", pricePerDay: 2.5, monthlyRent: "75", deposit: "100", applicableScenes: "前台、办公室、会议室", note: "常规租赁款，注意盆面清洁。", productType: "rental", serviceType: "租赁", priceUnit: "元 / 月", image: "🌳", status: "已上架" },
  { id: "rental-tiantianniao", name: "天堂鸟", category: "室内绿植", subCategory: "大型植物", description: "株型舒展，适合大堂、休息区、开放办公区。", displayDescription: "株型舒展，适合大堂和开放办公区。", pricePerDay: 3.2, monthlyRent: "96", deposit: "120", applicableScenes: "大堂、休息区、开放办公区", note: "需要较好采光。", productType: "rental", serviceType: "租赁", priceUnit: "元 / 月", image: "🪴", status: "已上架" },
  { id: "rental-sanweikui", name: "散尾葵", category: "室内绿植", subCategory: "大型植物", description: "叶片舒展，适合接待区、洽谈区和门厅。", displayDescription: "叶片舒展，适合接待区和门厅。", pricePerDay: 2.8, monthlyRent: "84", deposit: "100", applicableScenes: "接待区、洽谈区、门厅", note: "避免空调直吹。", productType: "rental", serviceType: "租赁", priceUnit: "元 / 月", image: "🌿", status: "已上架" },
  { id: "rental-guibeizhu", name: "龟背竹", category: "室内绿植", subCategory: "中型植物", description: "造型现代，适合办公室角落、茶水间和休闲区。", displayDescription: "造型现代，适合办公室角落和休闲区。", pricePerDay: 2.2, monthlyRent: "66", deposit: "80", applicableScenes: "办公室角落、茶水间、休闲区", note: "保持叶面清洁。", productType: "rental", serviceType: "租赁", priceUnit: "元 / 月", image: "🍃", status: "已上架" },
  { id: "rental-longxueshu", name: "龙血树", category: "室内绿植", subCategory: "中型植物", description: "耐养挺拔，适合会议室、走廊和电梯厅。", displayDescription: "耐养挺拔，适合会议室和走廊。", pricePerDay: 2, monthlyRent: "60", deposit: "80", applicableScenes: "会议室、走廊、电梯厅", note: "适合低频维护点位。", productType: "rental", serviceType: "租赁", priceUnit: "元 / 月", image: "🎍", status: "已上架" },
  { id: "sale-lvluo", name: "绿萝", displayNameEn: "Pothos", showEnglishName: true, categoryId: "cat-desk-plants", category: "桌面盆栽", description: "耐阴好养，适合办公室桌面和角落。", displayDescription: "耐阴好养，适合办公室桌面和角落。", salePrice: "39", price: "39", stock: "现货", stockStatus: "现货", suitablePlaces: ["办公室", "桌面", "阴凉处"], lightRequirement: "耐阴，明亮散射光更佳。", wateringCare: "土表微干后浇水，避免长期积水。", careDifficulty: "简单", supportDelivery: true, supportInstall: false, supportDeliveryInstall: true, visibleInMiniProgram: true, note: "可搭配简易盆器。", productType: "sale", serviceType: "售卖", priceUnit: "元 / 盆", image: "🌿", status: "已上架" },
  { id: "sale-heijingang", name: "黑金刚", displayNameEn: "Rubber Plant", showEnglishName: true, categoryId: "cat-medium-plants", category: "中型绿植", description: "叶片油亮，株形挺拔，适合办公室前台与客厅空间。", displayDescription: "叶片油亮，株形挺拔，适合办公室前台与客厅空间。", salePrice: "128", price: "128", stock: "现货", stockStatus: "现货", suitablePlaces: ["客厅", "前台", "办公室"], lightRequirement: "明亮散射光，避免长时间暴晒。", wateringCare: "土表微干后浇水，保持通风。", careDifficulty: "简单", supportDelivery: true, supportInstall: true, supportDeliveryInstall: true, visibleInMiniProgram: true, note: "配送后建议现场摆放调整。", productType: "sale", serviceType: "售卖", priceUnit: "元 / 盆", image: "🪴", status: "已上架" },
  { id: "sale-facai", name: "发财树", displayNameEn: "Money Tree", showEnglishName: true, categoryId: "cat-opening-gifts", category: "开业绿植", description: "寓意好，适合开业、前台和办公室。", displayDescription: "寓意好，适合开业、前台和办公室。", salePrice: "168", price: "168", stock: "现货", stockStatus: "现货", suitablePlaces: ["前台", "办公室", "店铺"], lightRequirement: "明亮散射光，避免暴晒。", wateringCare: "盆土偏干后浇透，避免积水。", careDifficulty: "简单", supportDelivery: true, supportInstall: true, supportDeliveryInstall: true, visibleInMiniProgram: true, note: "价格按规格可调整。", productType: "sale", serviceType: "售卖", priceUnit: "元 / 盆", image: "🌳", status: "已上架" },
  { id: "sale-tiantianniao", name: "天堂鸟", displayNameEn: "Bird of Paradise", showEnglishName: true, categoryId: "cat-large-plants", category: "大型绿植", description: "株形舒展，形象感强，适合会客空间和大堂。", displayDescription: "株形舒展，形象感强，适合会客空间和大堂。", salePrice: "299", price: "299", stock: "需确认", stockStatus: "需确认", suitablePlaces: ["客厅", "大堂", "展厅"], lightRequirement: "需要明亮散射光，避免长期阴暗。", wateringCare: "保持盆土微润，夏季适当增加喷雾。", careDifficulty: "中等", supportDelivery: true, supportInstall: true, supportDeliveryInstall: true, visibleInMiniProgram: true, note: "大规格需提前确认现货。", productType: "sale", serviceType: "售卖", priceUnit: "元 / 盆", image: "🪴", status: "已上架" },
  { id: "sale-sanweikui", name: "散尾葵", displayNameEn: "Areca Palm", showEnglishName: true, categoryId: "cat-large-plants", category: "大型绿植", description: "氛围柔和，适合洽谈区和休闲区。", displayDescription: "氛围柔和，适合洽谈区和休闲区。", salePrice: "358", price: "358", stock: "现货", stockStatus: "现货", suitablePlaces: ["客厅", "会议室", "大堂"], lightRequirement: "明亮散射光，避免空调直吹。", wateringCare: "保持通风，土表微干后补水。", careDifficulty: "中等", supportDelivery: true, supportInstall: true, supportDeliveryInstall: true, visibleInMiniProgram: true, note: "注意运输保护叶片。", productType: "sale", serviceType: "售卖", priceUnit: "元 / 盆", image: "🌿", status: "已上架" },
  { id: "sale-qinyerong", name: "琴叶榕", displayNameEn: "Fiddle Leaf Fig", showEnglishName: true, categoryId: "cat-large-plants", category: "大型绿植", description: "叶片大而有质感，适合客厅、展厅与形象区域。", displayDescription: "叶片大而有质感，适合客厅、展厅与形象区域。", salePrice: "299", price: "299", stock: "需确认", stockStatus: "需确认", suitablePlaces: ["客厅", "展厅", "窗边"], lightRequirement: "明亮散射光，避免频繁移动。", wateringCare: "土表干燥后浇水，注意通风和叶面清洁。", careDifficulty: "较高", supportDelivery: true, supportInstall: true, supportDeliveryInstall: true, visibleInMiniProgram: true, note: "适合有养护经验客户。", productType: "sale", serviceType: "售卖", priceUnit: "元 / 盆", image: "🍃", status: "已上架" },
  { id: "sale-guibeizhu", name: "龟背竹", displayNameEn: "Monstera", showEnglishName: true, categoryId: "cat-medium-plants", category: "中型绿植", description: "现代感强，适合办公室、茶水间和居家空间。", displayDescription: "现代感强，适合办公室、茶水间和居家空间。", salePrice: "268", price: "268", stock: "现货", stockStatus: "现货", suitablePlaces: ["办公室", "茶室", "窗边"], lightRequirement: "明亮散射光，避免夏季暴晒。", wateringCare: "土表微干后浇水，保持叶面清洁。", careDifficulty: "中等", supportDelivery: true, supportInstall: false, supportDeliveryInstall: true, visibleInMiniProgram: true, note: "可选不同盆器。", productType: "sale", serviceType: "售卖", priceUnit: "元 / 盆", image: "🍃", status: "已上架" },
  { id: "sale-hupilan", name: "虎皮兰", displayNameEn: "Snake Plant", showEnglishName: true, categoryId: "cat-medium-plants", category: "中型绿植", description: "耐旱耐阴，线条利落，适合办公室和玄关。", displayDescription: "耐旱耐阴，线条利落，适合办公室和玄关。", salePrice: "88", price: "88", stock: "现货", stockStatus: "现货", suitablePlaces: ["办公室", "玄关", "阴凉处"], lightRequirement: "耐阴，散射光环境更佳。", wateringCare: "宁干勿湿，避免频繁浇水。", careDifficulty: "简单", supportDelivery: true, supportInstall: false, supportDeliveryInstall: true, visibleInMiniProgram: true, note: "适合新手客户。", productType: "sale", serviceType: "售卖", priceUnit: "元 / 盆", image: "🌱", status: "已上架" },
  { id: "sale-xiangpishu", name: "橡皮树", displayNameEn: "Rubber Tree", showEnglishName: true, categoryId: "cat-medium-plants", category: "中型绿植", description: "叶片厚实油亮，适合办公室、会客区和居家角落。", displayDescription: "叶片厚实油亮，适合办公室、会客区和居家角落。", salePrice: "158", price: "158", stock: "现货", stockStatus: "现货", suitablePlaces: ["办公室", "客厅", "前台"], lightRequirement: "明亮散射光，避免强光直晒。", wateringCare: "土表干后浇透，保持通风，避免积水。", careDifficulty: "简单", supportDelivery: true, supportInstall: true, supportDeliveryInstall: true, visibleInMiniProgram: true, note: "测试价格，可在商户端调整。", productType: "sale", serviceType: "售卖", priceUnit: "元 / 盆", image: "🪴", status: "已上架" },
  { id: "sale-longxueshu", name: "龙血树", displayNameEn: "Dracaena", showEnglishName: true, categoryId: "cat-medium-plants", category: "中型绿植", description: "线条挺拔耐养，适合走廊、会议室和电梯厅。", displayDescription: "线条挺拔耐养，适合走廊、会议室和电梯厅。", salePrice: "188", price: "188", stock: "现货", stockStatus: "现货", suitablePlaces: ["会议室", "走廊", "办公室"], lightRequirement: "耐半阴，明亮散射光更佳。", wateringCare: "偏干养护，避免频繁浇水和积水。", careDifficulty: "简单", supportDelivery: true, supportInstall: true, supportDeliveryInstall: true, visibleInMiniProgram: true, note: "测试价格，可在商户端调整。", productType: "sale", serviceType: "售卖", priceUnit: "元 / 盆", image: "🎍", status: "已上架" },
  { id: "sale-taocihuapen", name: "陶瓷花盆", displayNameEn: "Ceramic Planter", showEnglishName: true, categoryId: "cat-planters", category: "花盆花器", description: "简洁耐看，适合搭配中小型绿植。", displayDescription: "简洁耐看，适合搭配中小型绿植。", salePrice: "68", price: "68", stock: "现货", stockStatus: "现货", suitablePlaces: ["客厅", "办公室", "桌面"], lightRequirement: "不涉及光照需求。", wateringCare: "根据搭配植物养护。", careDifficulty: "简单", supportDelivery: true, supportInstall: false, supportDeliveryInstall: true, visibleInMiniProgram: true, note: "按尺寸和材质调整价格。", productType: "sale", serviceType: "售卖", priceUnit: "元 / 件", image: "🏺", status: "已上架" },
  { id: "sale-yingyangye", name: "营养液 / 养护用品", displayNameEn: "Plant Nutrient", showEnglishName: true, categoryId: "cat-care-supplies", category: "养护用品", description: "适合日常补充营养，辅助绿植保持状态。", displayDescription: "适合日常补充营养，辅助绿植保持状态。", salePrice: "29", price: "29", stock: "现货", stockStatus: "现货", suitablePlaces: ["办公室", "客厅", "店铺"], lightRequirement: "不涉及光照需求。", wateringCare: "按说明稀释使用，避免过量。", careDifficulty: "简单", supportDelivery: true, supportInstall: false, supportDeliveryInstall: true, visibleInMiniProgram: true, note: "适合与植物一起销售。", productType: "sale", serviceType: "售卖", priceUnit: "元 / 件", image: "🧴", status: "已上架" },
];

const initialOrders = [
  {
    id: 1,
    customerName: "杭州东站办公室",
    contactName: "王经理",
    phone: "13800001111",
    status: "待接单",
    deliveryStatus: "待执行",
    executionStatus: "待执行",
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
    deliveryStatus: "待执行",
    executionStatus: "待执行",
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
  const employeeType = ["internal", "partner"].includes(member.employeeType) ? member.employeeType : "internal";
  return {
    id: member.id || `staff-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    staffNo: String(member.staffNo || "").trim() || "YG001",
    name: member.name || "未命名员工",
    email: member.email || "",
    phone: member.phone || "",
    role: ["staff", "manager", "admin"].includes(member.role) ? member.role : "staff",
    employeeType,
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

function getStaffEmployeeType(member = {}) {
  return ["internal", "partner"].includes(member?.employeeType) ? member.employeeType : "internal";
}

function canStaffViewCustomerPhone(member = {}) {
  const role = member?.role || "staff";
  if (["manager", "admin", "owner"].includes(role)) return true;
  return getStaffEmployeeType(member) === "internal";
}

function shouldHideCustomerPhoneForStaff(member = {}, order = {}) {
  const role = member?.role || "staff";
  if (["manager", "admin", "owner"].includes(role)) return false;
  if (!canStaffViewCustomerPhone(member)) return true;
  return Boolean(order?.assignedStaffType && order.assignedStaffType !== "internal");
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
    employeeType: "internal",
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

function normalizePlanType(value = "") {
  const text = String(value || "").trim();
  if (BUSINESS_PLAN_TYPES.includes(text)) return text;
  if (/售卖|零售|销售|买断|购买/.test(text)) return "售卖订单";
  if (/养护|维护/.test(text)) return "养护服务";
  if (/园林|造景|改造|工程|庭院|景观/.test(text)) return "园林改造";
  if (/临时|摆场|活动|展会/.test(text)) return "临时摆场";
  return "租赁方案";
}

function getPlanTypeForService(serviceType = "") {
  const text = String(serviceType || "").trim();
  if (text === "养护") return "养护服务";
  if (text === "售卖" || text === "零售") return "售卖订单";
  if (text === "摆场" || text === "临时摆场") return "临时摆场";
  if (text === "园林" || text === "园林改造" || text === "garden_project") return "园林改造";
  return "租赁方案";
}

function normalizeServiceType(serviceType = "", planType = "") {
  const text = String(serviceType || "").trim();
  if (["租赁", "养护", "售卖", "摆场", "园林"].includes(text)) return text;
  if (text === "零售") return "售卖";

  const safePlanType = normalizePlanType(planType);
  if (safePlanType === "养护服务") return "养护";
  if (safePlanType === "售卖订单") return "售卖";
  if (safePlanType === "临时摆场") return "摆场";
  if (safePlanType === "园林改造") return "园林";
  return "租赁";
}

function normalizePlanRecord(plan, fallbackPlanType = "租赁方案") {
  if (!plan || typeof plan !== "object") return null;
  return {
    ...plan,
    planType: normalizePlanType(plan.planType || fallbackPlanType),
  };
}

function normalizeDeliveryStatus(order = {}) {
  const raw = order.deliveryStatus || "";
  if (["待执行", "前往中", "已到达", "已完成"].includes(raw)) return raw;
  if (raw === "未出发") return "待执行";
  if (raw === "已出发") return "前往中";
  if (raw === "已完成服务") return "已完成";
  if (["待商户归档", "已完成"].includes(order.status)) return "已完成";
  if (order.status === "待执行" || order.status === "方案已确认") return "待执行";
  return raw || "待执行";
}

function normalizeExecutionStatus(order = {}) {
  const raw = order.executionStatus || "";
  if (["待执行", "前往中", "已到达", "现场执行中", "已完成"].includes(raw)) return raw;
  if (raw === "已出发") return "前往中";
  if (raw === "已到达") return "已到达";
  if (raw === "已完成服务") return "已完成";
  if (["待商户归档", "已完成"].includes(order.status)) return "已完成";
  if (order.status === "执行中") return "现场执行中";
  if (order.status === "待执行" || order.status === "方案已确认") return "待执行";
  return raw || "待执行";
}

function getOrderExecutionStage(order = {}) {
  return normalizeExecutionStatus(order);
}

function getExecutionDisplayText(order = {}) {
  const stage = getOrderExecutionStage(order);
  if (stage === "待执行") return "待执行 / 待出发";
  if (stage === "前往中") return "前往中 / 员工已出发";
  if (stage === "已到达") return "已到达 / 员工已到达现场";
  if (stage === "现场执行中") return "现场执行中";
  if (stage === "已完成") return "已完成";
  return stage || "待执行";
}

function getMerchantExecutionProgressText(order = {}) {
  const stage = getOrderExecutionStage(order);
  if (stage === "前往中") return "员工已出发";
  if (stage === "已到达" || stage === "现场执行中") return "员工已到达现场";
  if (stage === "已完成") return "服务已完成";
  return "待执行";
}

function ensureOrderDefaults(order = {}) {
  const assignedStaff = getStaffMemberById(order.assignedStaffId) || getDefaultAssignedStaff();
  const hasAssignedStaffId = Object.prototype.hasOwnProperty.call(order, "assignedStaffId");
  const isPublicAssignedOrder = hasAssignedStaffId && !String(order.assignedStaffId || "").trim();
  const deliveryStatus = normalizeDeliveryStatus(order);
  const executionStatus = normalizeExecutionStatus(order);
  const planType = normalizePlanType(order.planType || order.plan?.planType || getPlanTypeForService(order.serviceType));
  const serviceType = normalizeServiceType(order.serviceType, planType);
  const plan = normalizePlanRecord(order.plan, planType);
  return {
    ...order,
    id: order.id || Date.now(),
    customerName: order.customerName || "未命名客户",
    areaSize: order.areaSize || "暂无内容",
    expectedDate: order.expectedDate || "待确认",
    address: order.address || "",
    description: order.description || "",
    status: order.status || "待接单",
    deliveryStatus,
    executionStatus,
    customerConfirmStatus: order.customerConfirmStatus || "待确认",
    merchantConfirmStatus: order.merchantConfirmStatus || "未提交",
    planLinkStatus: order.planLinkStatus || "未生成",
    staffLocation: order.staffLocation || null,
    distanceText: order.distanceText || "待定位",
    etaText: order.etaText || "待定位",
    contactName: order.contactName || "待确认",
    phone: order.phone || "",
    source: order.source || "商户派单",
    assignedStaffId: hasAssignedStaffId ? order.assignedStaffId || "" : assignedStaff?.id || "",
    assignedStaffName: order.assignedStaffName || (isPublicAssignedOrder ? "所有员工（公共任务）" : assignedStaff?.name || ""),
    assignedStaffEmail: order.assignedStaffEmail || (isPublicAssignedOrder ? "" : assignedStaff?.email || ""),
    assignedStaffType: order.assignedStaffType || (isPublicAssignedOrder ? "" : getStaffEmployeeType(assignedStaff)),
    communicationQrUrl: order.communicationQrUrl || "",
    serviceType,
    planType,
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
    startedAt: order.startedAt || "",
    departedAt: order.departedAt || "",
    arrivedAt: order.arrivedAt || "",
    completedAt: order.completedAt || "",
    completePhotos: order.completePhotos && typeof order.completePhotos === "object"
      ? {
          scenePhotos: Array.isArray(order.completePhotos.scenePhotos) ? order.completePhotos.scenePhotos : [],
          plantPhotos: Array.isArray(order.completePhotos.plantPhotos) ? order.completePhotos.plantPhotos : [],
          remark: order.completePhotos.remark || "",
        }
      : { scenePhotos: [], plantPhotos: [], remark: "" },
    plan,
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
  const lightweightOrders = Array.isArray(orders) ? orders.map(createLightweightOrderCache) : [];
  safeSetLocalStorage(
    STORAGE_KEY,
    JSON.stringify({
      source: "localStorage",
      savedAt: nowText(),
      orders: lightweightOrders,
    }),
    "订单"
  );
}

function normalizeProducts(data) {
  const list = Array.isArray(data) ? data : defaultProducts;
  return list.map((rawProduct) => {
    const seed = defaultProducts.find((item) =>
      item.id === rawProduct?.id ||
      (item.productType === rawProduct?.productType && item.name === rawProduct?.name)
    ) || {};
    const product = { ...seed, ...rawProduct };
    const rawStatus = product?.status || "已上架";
    const status = rawStatus === "停用" || rawStatus === "未上架" ? "未上架" : "已上架";
    const productType = ["rental", "sale"].includes(product?.productType)
      ? product.productType
      : product?.salePrice || product?.price ? "sale" : "rental";
    const rawPricePerDay = Number(product?.pricePerDay || 0);
    const monthlyRent = productType === "rental"
      ? product?.monthlyRent || product?.price || seed.monthlyRent || seed.price || (rawPricePerDay ? String(Math.round(rawPricePerDay * 30)) : "")
      : "";
    const rawSalePrice = product?.salePrice || product?.price || "";
    const seedSalePrice = seed.salePrice || seed.price || "";
    const salePrice = productType === "sale"
      ? (Number(rawSalePrice || 0) > 0 ? rawSalePrice : seedSalePrice || (rawPricePerDay ? String(rawPricePerDay) : ""))
      : "";
    const salePriceUnit = productType === "sale"
      ? (seed.priceUnit && product?.priceUnit === "元 / 件" ? seed.priceUnit : product?.priceUnit || seed.priceUnit || "元 / 件")
      : "元 / 月";
    const pricePerDay = productType === "sale"
      ? Number(salePrice || rawPricePerDay || 0)
      : rawPricePerDay || (Number(monthlyRent || 0) ? Number((Number(monthlyRent) / 30).toFixed(2)) : 0);
    const generatedPriceDisplay = productType === "sale"
      ? (salePrice ? `¥${salePrice} / ${salePriceUnit.replace(/^元\s*\/\s*/, "")}` : "")
      : (monthlyRent ? `¥${monthlyRent} / 月` : "");
    const priceDisplay = productType === "sale" && Number(rawSalePrice || 0) <= 0
      ? generatedPriceDisplay
      : product?.priceDisplay || generatedPriceDisplay;
    const suitablePlaces = Array.isArray(product?.suitablePlaces)
      ? product.suitablePlaces
      : String(product?.suitablePlaces || product?.applicableScenes || "")
          .split(/[,，]/)
          .map((item) => item.trim())
          .filter(Boolean);
    const categoryId = product?.categoryId || defaultProductCategories.find((category) => category.nameZh === product?.category)?.id || "";
    const categoryName = product?.categoryName || product?.category || defaultProductCategories.find((category) => category.id === categoryId)?.nameZh || "";
    return {
      stock: "充足",
      imageUrl: "",
      note: "",
      productType,
      serviceType: productType === "sale" ? "售卖" : "租赁",
      displayName: product?.displayName || product?.name || "",
      displayNameEn: product?.displayNameEn || "",
      showEnglishName: Boolean(product?.showEnglishName),
      displayDescription: product?.displayDescription || product?.description || "",
      visibleInMiniProgram: Boolean(product?.visibleInMiniProgram),
      sortOrder: Number(product?.sortOrder || 0),
      monthlyRent,
      deposit: product?.deposit || "",
      salePrice,
      price: productType === "sale" ? salePrice : monthlyRent,
      priceUnit: salePriceUnit,
      priceDisplay,
      categoryId,
      categoryName,
      stockStatus: product?.stockStatus || product?.stock || "现货",
      suitablePlaces,
      lightRequirement: product?.lightRequirement || "",
      wateringCare: product?.wateringCare || product?.careNote || "",
      careDifficulty: product?.careDifficulty || "简单",
      applicableScenes: product?.applicableScenes || product?.scene || "",
      careNote: product?.careNote || "",
      deliveryNote: product?.deliveryNote || "",
      afterSaleNote: product?.afterSaleNote || "",
      supportDelivery: product?.supportDelivery ?? Boolean(product?.supportDeliveryInstall),
      supportInstall: product?.supportInstall ?? Boolean(product?.supportDeliveryInstall),
      supportsDelivery: product?.supportsDelivery ?? product?.supportDelivery ?? Boolean(product?.supportDeliveryInstall),
      supportsInstallation: product?.supportsInstallation ?? product?.supportInstall ?? Boolean(product?.supportDeliveryInstall),
      supportDeliveryInstall: Boolean(product?.supportDeliveryInstall),
      ...product,
      productType,
      status,
      categoryId,
      categoryName,
      suitablePlaces,
      pricePerDay,
      monthlyRent,
      salePrice,
      price: productType === "sale" ? salePrice : monthlyRent,
      priceUnit: salePriceUnit,
      priceDisplay,
    };
  });
}

function normalizeProductCategories(data) {
  const list = Array.isArray(data) && data.length ? data : defaultProductCategories;
  const normalized = list.map((category, index) => {
    const fallback = defaultProductCategories.find((item) => item.id === category?.id || item.nameZh === category?.nameZh) || {};
    const businessType = ["rental", "sale", "care"].includes(category?.businessType) ? category.businessType : fallback.businessType || "sale";
    return {
      ...fallback,
      ...category,
      id: category?.id || fallback.id || `cat-${Date.now()}-${index}`,
      nameZh: category?.nameZh || category?.name || fallback.nameZh || "未命名分类",
      nameEn: category?.nameEn || fallback.nameEn || "",
      showEnglish: Boolean(category?.showEnglish ?? fallback.showEnglish),
      visibleInMiniProgram: category?.visibleInMiniProgram ?? fallback.visibleInMiniProgram ?? true,
      sortOrder: Number(category?.sortOrder ?? fallback.sortOrder ?? index + 1),
      businessType,
    };
  });
  const ids = new Set(normalized.map((category) => category.id));
  const missing = defaultProductCategories.filter((category) => !ids.has(category.id));
  return [...normalized, ...missing].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
}

function getCategoryDisplayName(category = {}) {
  if (category.showEnglish && category.nameEn) return `${category.nameEn} / ${category.nameZh}`;
  return category.nameZh || category.nameEn || "未命名分类";
}

function normalizeProjectInquiries(data) {
  const list = Array.isArray(data) && data.length ? data : defaultProjectInquiries;
  return list.map((item, index) => ({
    id: item?.id || `inq-${Date.now()}-${index}`,
    source: item?.source || "mini_program",
    type: item?.type || "garden_project",
    contactName: item?.contactName || item?.name || "待确认客户",
    phone: item?.phone || "",
    address: item?.address || "",
    projectType: item?.projectType || "园林改造咨询",
    areaSize: item?.areaSize || "待确认",
    budgetRange: item?.budgetRange || "待确认",
    stylePreference: item?.stylePreference || "待确认",
    expectedTime: item?.expectedTime || "待确认",
    photos: Array.isArray(item?.photos) ? item.photos : [],
    note: item?.note || "",
    status: PROJECT_INQUIRY_STATUS.includes(item?.status) ? item.status : "待跟进",
    followUpNote: item?.followUpNote || "",
    createdAt: item?.createdAt || nowText(),
    convertedOrderId: item?.convertedOrderId || "",
    updatedAt: item?.updatedAt || "",
  }));
}

function loadProjectInquiriesFromLocalStore() {
  try {
    const raw = localStorage.getItem(PROJECT_INQUIRY_STORAGE_KEY);
    if (!raw) return normalizeProjectInquiries(defaultProjectInquiries);
    const parsed = JSON.parse(raw);
    return normalizeProjectInquiries(parsed?.projectInquiries);
  } catch (error) {
    console.error("读取项目线索失败：", error);
    return normalizeProjectInquiries(defaultProjectInquiries);
  }
}

function persistProjectInquiriesToLocalStore(projectInquiries) {
  safeSetLocalStorage(
    PROJECT_INQUIRY_STORAGE_KEY,
    JSON.stringify({
      source: "localStorage",
      savedAt: nowText(),
      projectInquiries: normalizeProjectInquiries(projectInquiries),
    }),
    "项目线索"
  );
}

function normalizeMiniProgramAppointments(data) {
  const list = Array.isArray(data) && data.length ? data : defaultMiniProgramAppointments;
  return list.map((item, index) => {
    const appointmentDate = item?.appointmentDate || item?.date || "";
    const timeWindow = item?.timeWindow || item?.timeRange || "";
    return {
      id: item?.id || `appt-${Date.now()}-${index}`,
      source: item?.source || "mini_program",
      type: item?.type || "care_service",
      serviceType: item?.serviceType || "maintenance",
      packageName: item?.packageName || item?.maintenancePackage || "标准养护",
      contactName: item?.contactName || item?.name || "待确认客户",
      phone: item?.phone || "",
      address: item?.address || "",
      serviceArea: item?.serviceArea || item?.areaNote || "",
      areaSize: item?.areaSize || "",
      plantCount: item?.plantCount || item?.plannedPlantCount || "",
      appointmentDate,
      timeWindow,
      expectedTime: item?.expectedTime || [appointmentDate, timeWindow].filter(Boolean).join(" ") || "待确认",
      customerNote: item?.customerNote || item?.note || "",
      quotedPrice: item?.quotedPrice || item?.price || "",
      photos: Array.isArray(item?.photos) ? item.photos : [],
      status: MINI_PROGRAM_APPOINTMENT_STATUS.includes(item?.status) ? item.status : "待确认",
      merchantNote: item?.merchantNote || item?.followUpNote || "",
      createdAt: item?.createdAt || nowText(),
      updatedAt: item?.updatedAt || "",
      convertedOrderId: item?.convertedOrderId || "",
      miniProgramPayload: item?.miniProgramPayload && typeof item.miniProgramPayload === "object"
        ? item.miniProgramPayload
        : {},
    };
  });
}

function loadMiniProgramAppointmentsFromLocalStore() {
  try {
    const raw = localStorage.getItem(MINI_PROGRAM_APPOINTMENT_STORAGE_KEY);
    if (!raw) return normalizeMiniProgramAppointments(defaultMiniProgramAppointments);
    const parsed = JSON.parse(raw);
    return normalizeMiniProgramAppointments(parsed?.appointments || parsed?.miniProgramAppointments);
  } catch (error) {
    console.error("读取小程序预约失败：", error);
    return normalizeMiniProgramAppointments(defaultMiniProgramAppointments);
  }
}

function persistMiniProgramAppointmentsToLocalStore(appointments) {
  safeSetLocalStorage(
    MINI_PROGRAM_APPOINTMENT_STORAGE_KEY,
    JSON.stringify({
      source: "localStorage",
      savedAt: nowText(),
      miniProgramAppointments: normalizeMiniProgramAppointments(appointments),
    }),
    "小程序预约"
  );
}

function normalizeHomeBannerImage(image, index = 0) {
  if (typeof image === "string") {
    return {
      imageUrl: isImageUrl(image) && !image.startsWith("data:") ? image : "",
      localPreviewUrl: image.startsWith("data:") ? image : "",
      placeholder: "",
    };
  }
  return {
    imageUrl: image?.imageUrl || "",
    localPreviewUrl: image?.localPreviewUrl || "",
    placeholder: image?.placeholder || `广告图 ${index + 1}`,
  };
}

function getHomeBannerImageCount(layoutType) {
  return layoutType === "triple" ? 3 : 1;
}

function normalizeHomeBannerItem(item, index = 0) {
  const layoutType = item?.layoutType === "triple" ? "triple" : "single";
  const imageCount = getHomeBannerImageCount(layoutType);
  const rawImages = Array.isArray(item?.images) ? item.images : [];
  const images = Array.from({ length: imageCount }, (_, imageIndex) =>
    normalizeHomeBannerImage(rawImages[imageIndex], imageIndex)
  );
  const legacyInternalLinkTypes = ["garden_project", "care_service", "rental_plan", "plant_shop", "custom"];
  const linkType = HOME_BANNER_LINK_TYPES.some(([value]) => value === item?.linkType)
    ? item.linkType
    : legacyInternalLinkTypes.includes(item?.linkType)
      ? "internal"
      : "none";
  const linkTarget = legacyInternalLinkTypes.includes(item?.linkType) && !item?.linkTarget
    ? item.linkType
    : item?.linkTarget || "";

  return {
    id: item?.id || `banner-${Date.now()}-${index}`,
    title: item?.title || `首页广告位 ${index + 1}`,
    layoutType,
    images,
    linkType,
    linkTarget,
    visible: item?.visible ?? true,
    sortOrder: Number(item?.sortOrder ?? (index + 1) * 10),
  };
}

function normalizeHomeHeroConfig(hero = {}) {
  const defaults = defaultMiniProgramHomeConfig.homeModules.find((module) => module.type === "hero")?.hero || {};
  return {
    imageUrl: hero?.imageUrl || defaults.imageUrl || "",
    localPreviewUrl: hero?.localPreviewUrl || defaults.localPreviewUrl || "",
    title: hero?.title ?? defaults.title ?? "",
    subtitle: hero?.subtitle ?? defaults.subtitle ?? "",
    visible: hero?.visible ?? defaults.visible ?? true,
    linkType: "none",
    linkTarget: "",
  };
}

function normalizeInspirationItem(item = {}, index = 0) {
  const rawTags = Array.isArray(item.tags)
    ? item.tags
    : String(item.tagsText || item.tags || "")
      .split(/[,，、]/)
      .map((tag) => tag.trim())
      .filter(Boolean);

  return {
    id: item.id || `inspiration-${Date.now()}-${index}`,
    title: item.title || `灵感项 ${index + 1}`,
    description: item.description || "",
    category: INSPIRATION_CATEGORIES.includes(item.category) && item.category !== "全部" ? item.category : "办公室",
    tags: rawTags.length ? rawTags.slice(0, 5) : ["大叶植物"],
    imageUrl: item.imageUrl || "",
    localPreviewUrl: item.localPreviewUrl || "",
    linkedProductId: item.linkedProductId || "",
    status: INSPIRATION_STATUS_OPTIONS.includes(item.status) ? item.status : "已上架",
    sortOrder: Number(item.sortOrder ?? index + 1),
  };
}

function normalizeMiniProgramHomeConfig(data) {
  const source = data && typeof data === "object" ? data : defaultMiniProgramHomeConfig;
  const modules = Array.isArray(source.homeModules) && source.homeModules.length
    ? source.homeModules
    : defaultMiniProgramHomeConfig.homeModules;
  const defaultHeroModule = defaultMiniProgramHomeConfig.homeModules.find((module) => module.type === "hero");
  const defaultBannerModule = defaultMiniProgramHomeConfig.homeModules.find((module) => module.type === "banner");
  const defaultInspirationModule = defaultMiniProgramHomeConfig.homeModules.find((module) => module.type === "inspiration");
  const heroModule = modules.find((module) => module?.type === "hero") || {};
  const normalizedHeroModule = {
    id: heroModule?.id || defaultHeroModule.id,
    type: "hero",
    title: heroModule?.title || "首页主图",
    hero: normalizeHomeHeroConfig(heroModule?.hero || source.hero || {}),
  };
  const bannerModule = modules.find((module) => module?.type === "banner") || defaultBannerModule;
  const normalizedBannerModule = {
    id: bannerModule?.id || "home-banner",
    type: "banner",
    title: bannerModule?.title || "首页广告位",
    items: (Array.isArray(bannerModule?.items) && bannerModule.items.length
      ? bannerModule.items
      : defaultBannerModule.items
    ).slice(0, 5).map(normalizeHomeBannerItem),
  };
  const inspirationModule = modules.find((module) => module?.type === "inspiration") || defaultInspirationModule;
  const normalizedInspirationModule = {
    id: inspirationModule?.id || "home-inspiration",
    type: "inspiration",
    title: inspirationModule?.title || "摆放灵感",
    items: (Array.isArray(inspirationModule?.items) && inspirationModule.items.length
      ? inspirationModule.items
      : defaultInspirationModule.items
    ).map(normalizeInspirationItem),
  };
  const otherModules = modules
    .filter((module) => module?.type && !["hero", "banner", "inspiration"].includes(module.type))
    .map((module) => ({ ...module }));
  const fixedEntrances = Array.isArray(source.fixedEntrances) && source.fixedEntrances.length
    ? source.fixedEntrances
    : [
      { key: "care", title: "养护服务" },
      { key: "rental", title: "租赁方案" },
      { key: "shop", title: "花植选购" },
    ];

  return {
    ...source,
    hero: normalizedHeroModule.hero,
    homeHero: normalizedHeroModule.hero,
    fixedEntrances,
    banners: normalizedBannerModule.items,
    inspirationItems: normalizedInspirationModule.items,
    homeModules: [normalizedHeroModule, normalizedBannerModule, normalizedInspirationModule, ...otherModules],
  };
}

function getHomeHeroConfig(config) {
  const normalized = normalizeMiniProgramHomeConfig(config);
  return normalized.homeModules.find((module) => module.type === "hero")?.hero || normalizeHomeHeroConfig();
}

function getHomeBannerItems(config) {
  const normalized = normalizeMiniProgramHomeConfig(config);
  return normalized.homeModules.find((module) => module.type === "banner")?.items || [];
}

function getHomeHeroImageSrc(hero) {
  return hero?.localPreviewUrl || hero?.imageUrl || "";
}

function getHomeBannerImageSrc(image) {
  return image?.localPreviewUrl || image?.imageUrl || "";
}

function getMiniProgramInspirationItems(config) {
  const normalized = normalizeMiniProgramHomeConfig(config);
  return normalized.homeModules.find((module) => module.type === "inspiration")?.items || [];
}

function getInspirationImageSrc(item) {
  return item?.localPreviewUrl || item?.imageUrl || "";
}

function getInspirationTagText(item) {
  return Array.isArray(item?.tags) ? item.tags.join("，") : "";
}

function loadMiniProgramHomeConfigFromLocalStore() {
  try {
    const raw = localStorage.getItem(MINI_PROGRAM_HOME_STORAGE_KEY);
    if (!raw) return normalizeMiniProgramHomeConfig(defaultMiniProgramHomeConfig);
    const parsed = JSON.parse(raw);
    return normalizeMiniProgramHomeConfig(parsed?.miniProgramHomeConfig || parsed);
  } catch (error) {
    console.error("读取小程序首页配置失败：", error);
    return normalizeMiniProgramHomeConfig(defaultMiniProgramHomeConfig);
  }
}

function persistMiniProgramHomeConfigToLocalStore(config) {
  safeSetLocalStorage(
    MINI_PROGRAM_HOME_STORAGE_KEY,
    JSON.stringify({
      source: "localStorage",
      savedAt: nowText(),
      miniProgramHomeConfig: normalizeMiniProgramHomeConfig(config),
    }),
    "小程序首页配置"
  );
}

function normalizeServiceSettings(data = {}) {
  const source = data && typeof data === "object" ? data : {};
  const leadDays = Number(source.saleDeliveryLeadDays || defaultServiceSettings.saleDeliveryLeadDays);
  const safeLeadDays = SALE_DELIVERY_LEAD_DAY_OPTIONS.includes(leadDays) ? leadDays : defaultServiceSettings.saleDeliveryLeadDays;
  return {
    ...defaultServiceSettings,
    ...source,
    saleDeliveryLeadDays: safeLeadDays,
    saleDeliveryLabel: `T+${safeLeadDays}`,
  };
}

function loadServiceSettingsFromLocalStore() {
  try {
    const raw = localStorage.getItem(SERVICE_SETTINGS_STORAGE_KEY);
    if (!raw) return normalizeServiceSettings(defaultServiceSettings);
    const parsed = JSON.parse(raw);
    return normalizeServiceSettings(parsed?.serviceSettings || parsed);
  } catch (error) {
    console.error("读取服务设置失败：", error);
    return normalizeServiceSettings(defaultServiceSettings);
  }
}

function persistServiceSettingsToLocalStore(serviceSettings) {
  safeSetLocalStorage(
    SERVICE_SETTINGS_STORAGE_KEY,
    JSON.stringify({
      source: "localStorage",
      savedAt: nowText(),
      serviceSettings: normalizeServiceSettings(serviceSettings),
    }),
    "服务设置"
  );
}

function ensureProductSeedData(products) {
  const list = normalizeProducts(products);
  const existingIds = new Set(list.map((product) => String(product.id)));
  const existingTypeNames = new Set(list.map((product) => `${product.productType}:${product.name}`));
  const missingSeeds = defaultProducts.filter((seed) => {
    if (existingIds.has(String(seed.id))) return false;
    return !existingTypeNames.has(`${seed.productType}:${seed.name}`);
  });
  return normalizeProducts([...list, ...missingSeeds]);
}

function formatMaintenancePrice(config = {}) {
  const unit = getMaintenanceUnitDisplay(config);
  if (config.priceType === "project") return "按项目报价";
  if (config.priceType === "fixed") {
    const value = config.fixedPrice || config.priceMin || config.price || "";
    return value ? `¥${value} / ${unit}` : "待配置";
  }
  const min = config.priceMin || "";
  const max = config.priceMax || "";
  if (min && max) return `¥${min}-${max} / ${unit}`;
  if (min) return `¥${min} 起 / ${unit}`;
  return config.priceDisplay || config.priceText || "待配置";
}

function getMaintenanceUnitDisplay(config = {}) {
  if (config.priceType === "project") return "按项目报价";
  if (config.priceObject && config.priceCycle) return `${config.priceObject} / ${config.priceCycle}`;
  return normalizeMaintenancePriceUnit(config.priceUnit || "元 / 盆 / 次").replace(/^元\s*\/?\s*/, "").trim() || "盆 / 次";
}

function normalizeMaintenancePriceUnit(value = "") {
  const text = String(value || "").trim();
  if (!text || text === "/盆/次" || text === "/ 盆 / 次" || text === "盆/次") return "元 / 盆 / 次";
  if (text === "/㎡/年" || text === "/ ㎡ / 年" || text === "㎡/年") return "元 / 平方米 / 年";
  if (/项目报价/.test(text)) return "按项目报价";
  if (text.startsWith("元")) return text.replace(/\/㎡/g, "/ 平方米");
  if (text.startsWith("/")) return `元 ${text.replace(/㎡/g, "平方米")}`;
  return text;
}

function inferMaintenancePriceFields(saved = {}, defaults = {}) {
  const merged = { ...defaults, ...saved };
  const normalizedUnit = normalizeMaintenancePriceUnit(merged.priceUnit || defaults.priceUnit || "元 / 盆 / 次");
  const unitText = normalizedUnit.replace(/^元\s*\/?\s*/, "");
  const parts = unitText.split("/").map((item) => item.trim()).filter(Boolean);
  const unitFields = {
    priceObject: merged.priceObject || parts[0] || defaults.priceObject || "盆",
    priceCycle: merged.priceCycle || parts[1] || defaults.priceCycle || "次",
  };
  if (merged.priceType) return { ...merged, ...unitFields, priceUnit: normalizedUnit };
  const text = String(merged.price || merged.priceText || "");
  if (/项目|按次/.test(text) && !/\d/.test(text)) return { ...merged, priceType: "project", priceObject: "项", priceCycle: "次", priceUnit: "按项目报价" };
  const numbers = text.match(/\d+(?:\.\d+)?/g) || [];
  if (numbers.length >= 2) {
    return { ...merged, ...unitFields, priceType: "range", priceMin: numbers[0], priceMax: numbers[1], priceUnit: normalizedUnit };
  }
  if (numbers.length === 1) {
    return { ...merged, ...unitFields, priceType: "fixed", fixedPrice: numbers[0], priceUnit: normalizedUnit };
  }
  return { ...merged, ...unitFields, priceType: defaults.priceType || "range", priceUnit: normalizedUnit };
}

function normalizeMaintenancePackages(data) {
  const source = Array.isArray(data) && data.length ? data : MAINTENANCE_PACKAGES;
  return MAINTENANCE_PACKAGES.map((defaults, index) => {
    const saved = source.find((item) => item?.name === defaults.name) || {};
    const priceFields = inferMaintenancePriceFields(saved, defaults);
    const priceDisplay = formatMaintenancePrice(priceFields);
    return {
      ...defaults,
      ...saved,
      ...priceFields,
      name: defaults.name,
      serviceType: "养护",
      productType: "maintenance",
      displayName: saved.displayName || defaults.name,
      displayDescription: saved.displayDescription || saved.scene || defaults.scene,
      price: priceFields.priceType === "fixed" ? priceFields.fixedPrice || "" : priceFields.priceMin || "",
      priceDisplay,
      priceObject: priceFields.priceObject || (defaults.name === "专项处理" ? "项" : "盆"),
      priceCycle: priceFields.priceCycle || (defaults.name === "专项处理" ? "次" : "次"),
      priceUnit: priceFields.priceType === "project" ? "按项目报价" : `元 / ${priceFields.priceObject || "盆"} / ${priceFields.priceCycle || "次"}`,
      areaPriceText: saved.areaPriceText || defaults.areaPriceText || "",
      visibleInMiniProgram: saved.visibleInMiniProgram ?? true,
      sortOrder: Number(saved.sortOrder ?? index + 1),
      recommended: Boolean(saved.recommended ?? defaults.recommended),
    };
  });
}

function loadProductsFromLocalStore() {
  try {
    const raw = localStorage.getItem(PRODUCT_STORAGE_KEY);
    if (!raw) return ensureProductSeedData(defaultProducts);

    const parsed = JSON.parse(raw);
    return ensureProductSeedData(parsed?.products);
  } catch (error) {
    console.error("读取本地商品库失败：", error);
    return ensureProductSeedData(defaultProducts);
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

function loadMaintenancePackagesFromLocalStore() {
  try {
    const raw = localStorage.getItem(SERVICE_CONFIG_STORAGE_KEY);
    if (!raw) return normalizeMaintenancePackages(MAINTENANCE_PACKAGES);
    const parsed = JSON.parse(raw);
    return normalizeMaintenancePackages(parsed?.maintenancePackages);
  } catch (error) {
    console.error("读取服务配置失败：", error);
    return normalizeMaintenancePackages(MAINTENANCE_PACKAGES);
  }
}

function persistMaintenancePackagesToLocalStore(maintenancePackages) {
  safeSetLocalStorage(
    SERVICE_CONFIG_STORAGE_KEY,
    JSON.stringify({
      source: "localStorage",
      savedAt: nowText(),
      maintenancePackages: normalizeMaintenancePackages(maintenancePackages),
    }),
    "服务配置"
  );
}

function loadProductCategoriesFromLocalStore() {
  try {
    const raw = localStorage.getItem(PRODUCT_CATEGORY_STORAGE_KEY);
    if (!raw) return normalizeProductCategories(defaultProductCategories);
    const parsed = JSON.parse(raw);
    return normalizeProductCategories(parsed?.categories);
  } catch (error) {
    console.error("读取商品分类失败：", error);
    return normalizeProductCategories(defaultProductCategories);
  }
}

function persistProductCategoriesToLocalStore(categories) {
  safeSetLocalStorage(
    PRODUCT_CATEGORY_STORAGE_KEY,
    JSON.stringify({
      source: "localStorage",
      savedAt: nowText(),
      categories: normalizeProductCategories(categories),
    }),
    "商品分类"
  );
}

function getProductImage(product) {
  return product?.imageUrl || product?.image || "🪴";
}

function isImageUrl(value) {
  return /^(https?:\/\/|data:image\/|blob:)/i.test(String(value || "").trim());
}

function isLocalOnlyImageData(value) {
  return /^(data:image\/|blob:)/i.test(String(value || "").trim());
}

function isStorageQuotaError(error) {
  return (
    error?.name === "QuotaExceededError" ||
    error?.code === 22 ||
    String(error?.message || "").toLowerCase().includes("quota")
  );
}

function safeSetLocalStorage(key, value, label) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    const message = `${label || key} 写入本地缓存失败，已跳过本地缓存，不影响云端同步。`;
    if (isStorageQuotaError(error)) {
      console.warn(message, error);
      return false;
    }
    console.warn(message, error);
    return false;
  }
}

function stripLocalOnlyImage(value) {
  return isLocalOnlyImageData(value) ? "" : value || "";
}

function createLightweightOrderCache(order) {
  const completePhotos = order?.completePhotos || {};
  return {
    ...order,
    photos: Array.isArray(order?.photos) ? order.photos.map(stripLocalOnlyImage) : [],
    completePhotos: {
      ...completePhotos,
      scenePhotos: Array.isArray(completePhotos.scenePhotos)
        ? completePhotos.scenePhotos.map(stripLocalOnlyImage)
        : [],
      plantPhotos: Array.isArray(completePhotos.plantPhotos)
        ? completePhotos.plantPhotos.map(stripLocalOnlyImage)
        : [],
    },
  };
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
  const lightweightStaff = Array.isArray(staff)
    ? staff.map((member) => ({
        ...member,
        avatar: stripLocalOnlyImage(member.avatar),
        avatarUrl: stripLocalOnlyImage(member.avatarUrl),
      }))
    : [];
  safeSetLocalStorage(
    STAFF_DIRECTORY_STORAGE_KEY,
    JSON.stringify({
      source: "localStorage",
      savedAt: nowText(),
      staff: lightweightStaff,
    }),
    "员工目录"
  );
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
    if (isLocalOnlyImageData(staffAvatar)) return;

    if (!staffId) {
      safeSetLocalStorage(STAFF_AVATAR_STORAGE_KEY, staffAvatar || "", "员工头像");
      return;
    }

    const cache = loadStaffAvatarCacheFromLocalStore();
    if (staffAvatar) {
      cache[staffId] = staffAvatar;
    } else {
      delete cache[staffId];
    }
    safeSetLocalStorage(STAFF_AVATAR_CACHE_STORAGE_KEY, JSON.stringify(cache), "员工头像缓存");
    safeSetLocalStorage(STAFF_AVATAR_STORAGE_KEY, staffAvatar || "", "员工头像");
  } catch (error) {
    console.warn("保存员工头像失败，已跳过本地缓存，不影响云端同步：", error);
  }
}

function getSafeStaffAvatarId(staffId) {
  return String(staffId || DEFAULT_STAFF_ID).trim().replace(/[^a-zA-Z0-9_-]/g, "-") || DEFAULT_STAFF_ID;
}

function getStaffAvatarStoragePath(staffId) {
  return `${getSafeStaffAvatarId(staffId)}/avatar.jpg`;
}

function createStaffAvatarStoragePath(staffId) {
  return `${getSafeStaffAvatarId(staffId)}/avatar-${Date.now()}.jpg`;
}

function encodeStoragePath(path) {
  return String(path || "")
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function getStaffAvatarPublicUrlByPath(path, version = "") {
  const baseUrl = `${SUPABASE_URL}/storage/v1/object/public/${STAFF_AVATAR_BUCKET}/${encodeStoragePath(path)}`;
  return version ? `${baseUrl}?v=${encodeURIComponent(version)}` : baseUrl;
}

function getStaffAvatarPublicUrl(staffId, version = "") {
  return getStaffAvatarPublicUrlByPath(getStaffAvatarStoragePath(staffId), version);
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

async function readCloudResponseError(response) {
  const text = await response.text().catch(() => "");
  if (!text) {
    return {
      message: response.statusText || "Supabase 请求失败",
      status: response.status,
    };
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: text,
      raw: text,
      status: response.status,
    };
  }
}

function getCloudErrorText(error, fallbackMessage) {
  if (!error) return fallbackMessage;
  if (typeof error === "string") return error || fallbackMessage;
  if (error.message) return error.message;

  try {
    return JSON.stringify(error);
  } catch {
    return fallbackMessage;
  }
}

function createCloudError(fallbackMessage, details) {
  const error = new Error(getCloudErrorText(details, fallbackMessage));
  error.details = details;
  return error;
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
    return `仅本地预览，云端未同步。云端头像桶 ${STAFF_AVATAR_BUCKET} 可能尚未创建或不可访问：${rawMessage}`;
  }

  if (looksLikePolicyIssue) {
    return `仅本地预览，云端未同步。Supabase Storage 上传策略暂未放行：${rawMessage}`;
  }

  return `仅本地预览，云端未同步：${rawMessage}`;
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
  const payload = {
    staff_id: staff?.id || DEFAULT_STAFF_ID,
    name: staff?.name || "",
    email: staff?.email || "",
    avatar_url: avatarUrl,
    updated_at: new Date().toISOString(),
  };

  console.info("[staff-avatar] staff_profiles upsert start", {
    staff_id: payload.staff_id,
    avatar_url: payload.avatar_url,
  });

  const response = await fetch(`${STAFF_PROFILE_API}?on_conflict=staff_id`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    let errorDetail = errorText;
    try {
      errorDetail = errorText ? JSON.parse(errorText) : "";
    } catch {
      errorDetail = errorText;
    }
    console.error("[staff-avatar] staff_profiles upsert failed detail", response.status, errorText);
    console.error("[staff-avatar] staff_profiles upsert failed", {
      status: response.status,
      error: errorDetail,
      payload,
    });
    throw createCloudError("staff_profiles 写入失败", errorDetail || errorText || response.statusText);
  }

  const data = await response.json().catch(() => null);
  console.info("[staff-avatar] staff_profiles upsert success", {
    staff_id: payload.staff_id,
    avatar_url: payload.avatar_url,
  });
  return data;
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
  const path = createStaffAvatarStoragePath(staffId);
  const contentType = avatarBlob?.type || "image/jpeg";
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${STAFF_AVATAR_BUCKET}/${path}`;

  console.info("[staff-avatar] storage upload start", {
    bucket: STAFF_AVATAR_BUCKET,
    path,
    contentType,
    size: avatarBlob?.size || 0,
  });

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: avatarBlob,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    let errorDetail = errorText;
    try {
      errorDetail = errorText ? JSON.parse(errorText) : "";
    } catch {
      errorDetail = errorText;
    }
    console.error("[staff-avatar] storage upload failed detail", response.status, errorText);
    console.error("[staff-avatar] storage upload failed", {
      status: response.status,
      bucket: STAFF_AVATAR_BUCKET,
      path,
      error: errorDetail,
    });
    throw createCloudError("头像上传失败", errorDetail || errorText || response.statusText);
  }

  const data = await response.json().catch(() => null);
  const avatarUrl = getStaffAvatarPublicUrlByPath(path);
  console.info("[staff-avatar] storage upload success", {
    bucket: STAFF_AVATAR_BUCKET,
    path,
    avatarUrl,
    data,
  });

  return avatarUrl;
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
  return Array.isArray(cloudProducts) ? ensureProductSeedData(cloudProducts) : [];
}

async function fetchProductLibraryFromCloud() {
  const response = await fetch(`${ORDERS_API}?id=eq.${PRODUCT_CLOUD_ID}&select=id,data,updated_at`, {
    method: "GET",
    headers: cloudHeaders(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`读取商品与服务配置失败：${response.status} ${text}`);
  }

  const rows = await response.json();
  const data = rows?.[0]?.data || {};
  return {
    products: ensureProductSeedData(data.products),
    maintenancePackages: normalizeMaintenancePackages(data.maintenancePackages),
    productCategories: normalizeProductCategories(data.productCategories),
    serviceSettings: normalizeServiceSettings(data.serviceSettings),
  };
}

async function upsertProductsToCloud(products, maintenancePackages = [], productCategoriesConfig = defaultProductCategories, serviceSettings = defaultServiceSettings) {
  const response = await fetch(`${ORDERS_API}?on_conflict=id`, {
    method: "POST",
    headers: cloudHeaders({ Prefer: "resolution=merge-duplicates,return=minimal" }),
    body: JSON.stringify({
      id: PRODUCT_CLOUD_ID,
      data: {
        type: "product_library",
        products: normalizeProducts(products),
        maintenancePackages: normalizeMaintenancePackages(maintenancePackages),
        productCategories: normalizeProductCategories(productCategoriesConfig),
        serviceSettings: normalizeServiceSettings(serviceSettings),
        miniProgramSyncNote: "养护套餐适合小程序自助下单；租赁植物和售卖植物更适合提交意向、工作人员确认、商户端代下单后再进入客户小程序待付款。",
        updatedAt: nowText(),
      },
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

function getProductPlanUnitPrice(product, planType = "租赁方案") {
  const safePlanType = normalizePlanType(planType);
  if (safePlanType === "售卖订单") {
    return Number(product?.salePrice || product?.price || product?.pricePerDay || 0);
  }
  const monthlyRent = Number(product?.monthlyRent || 0);
  if (monthlyRent > 0) return Number((monthlyRent / 30).toFixed(2));
  return Number(product?.pricePerDay || product?.price || 0);
}

function getPriceUnitDisplay(priceUnit = "") {
  return String(priceUnit || "元 / 件").replace(/^元\s*\/\s*/, "").trim() || "件";
}

function createPlanItemFromProduct(product, planType = "租赁方案", quantity = 1) {
  const safePlanType = normalizePlanType(planType);
  const unitPrice = getProductPlanUnitPrice(product, safePlanType);
  const saleUnit = product.priceUnit || "元 / 件";
  return {
    productId: product.id,
    name: product.name,
    productType: product.productType || (safePlanType === "售卖订单" ? "sale" : "rental"),
    pricePerDay: unitPrice,
    unitPrice,
    priceUnit: safePlanType === "售卖订单" ? saleUnit : "元 / 天",
    salePrice: product.salePrice || "",
    monthlyRent: product.monthlyRent || "",
    priceSource: "merchantProducts",
    quantity,
  };
}

const MAINTENANCE_PACKAGES = [
  {
    name: "基础养护",
    scene: "适合临时补充服务或低频维护，不作为租赁客户主推套餐",
    frequency: "按次或低频维护",
    content: "基础浇水、简单清洁、植物状态查看",
    cycle: "按次 / 短期",
    shortDescription: "基础浇水、简单清洁、状态查看。",
    position: "作为最低服务说明和销售话术对比，不作为主推。",
    priceType: "range",
    priceMin: "3",
    priceMax: "5",
    priceUnit: "元 / 盆 / 次",
    priceText: "¥3-5 / 盆 / 次",
    areaPriceText: "¥6-8 / ㎡ / 年",
  },
  {
    name: "标准养护",
    scene: "租赁方案默认建议包含，用于保障植物状态与客户现场效果",
    frequency: "每月 2 次",
    content: "浇水、擦叶、黄叶修剪、盆面清理、摆放调整、植物状态记录",
    cycle: "6 个月",
    shortDescription: "浇水、擦叶、黄叶修剪、盆面清理、摆放调整、状态记录。",
    position: "推荐项，租赁方案默认包含。",
    priceType: "range",
    priceMin: "6",
    priceMax: "10",
    priceUnit: "元 / 盆 / 次",
    priceText: "¥6-10 / 盆 / 次",
    areaPriceText: "¥9-12 / ㎡ / 年",
    recommended: true,
  },
  {
    name: "精细养护",
    scene: "适合重点客户、前台、展厅、酒店、商业空间等高要求场景",
    frequency: "每周 1 次或按约定",
    content: "标准养护 + 植物健康巡检 + 重点客户复查 + 更详细照片记录",
    cycle: "按项目约定",
    shortDescription: "标准养护基础上增加植物健康巡检、重点区域复查、更详细照片记录。",
    position: "重点客户和形象区域推荐。",
    priceType: "range",
    priceMin: "12",
    priceMax: "20",
    priceUnit: "元 / 盆 / 次",
    priceText: "¥12-20 / 盆 / 次",
    areaPriceText: "¥15-20 / ㎡ / 年",
  },
  {
    name: "专项处理",
    scene: "适合单独收费或临时加急处理",
    frequency: "按次 / 按项目",
    content: "虫害处理、换盆、补土、施肥、植物替换、枯萎补救、加急上门",
    cycle: "按项目报价",
    shortDescription: "虫害处理、换盆、补土、施肥、植物替换、枯萎补救、加急上门。",
    position: "特殊情况单独报价。",
    priceType: "project",
    priceUnit: "按项目报价",
    projectPriceNote: "按项目报价",
    priceText: "按次 / 按项目报价",
    areaPriceText: "按次 / 按项目",
  },
];

const STAFF_PLAN_TYPES = BUSINESS_PLAN_TYPES;

function getInitialPlanTypeForOrder(order) {
  return normalizePlanType(order?.planType || order?.plan?.planType || getPlanTypeForService(order?.serviceType));
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
  const isRetailPlan = normalizePlanType(plan?.planType) === "售卖订单";
  const isMaintenancePlan = normalizePlanType(plan?.planType) === "养护服务";
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
    includedMaintenance: "标准养护",
    retailNeedsMaintenance: false,
    retailMaintenanceNote: "",
    saleDeliveryNote: "",
    saleAftercareNote: "",
    maintenanceFinalPrice: "",
    maintenanceInternalNote: "",
    maintenanceChecklist: [],
    maintenanceExceptionNote: "",
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
  if (/零售|买断|购买|售卖|销售/.test(sourceText)) addSignal("售卖");
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
    normalized.includes("待执行") ||
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
  const previousMerchantTodoSignatureRef = useRef("");
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
  const [serviceConfigTab, setServiceConfigTab] = useState("租赁植物");
  const [syncMessage, setSyncMessage] = useState("当前数据通道已连接。点击刷新即可读取最新订单。");
  const [syncState, setSyncState] = useState("待刷新");
  const [autoSyncState, setAutoSyncState] = useState("自动同步准备中");

  const [orders, setOrders] = useState(() => loadOrdersFromLocalStore());
  const [merchantProducts, setMerchantProducts] = useState(() => loadProductsFromLocalStore());
  const [merchantMaintenancePackages, setMerchantMaintenancePackages] = useState(() => loadMaintenancePackagesFromLocalStore());
  const [merchantProductCategories, setMerchantProductCategories] = useState(() => loadProductCategoriesFromLocalStore());
  const [projectInquiries, setProjectInquiries] = useState(() => loadProjectInquiriesFromLocalStore());
  const [miniProgramAppointments, setMiniProgramAppointments] = useState(() => loadMiniProgramAppointmentsFromLocalStore());
  const [miniProgramHomeConfig, setMiniProgramHomeConfig] = useState(() => loadMiniProgramHomeConfigFromLocalStore());
  const [merchantServiceSettings, setMerchantServiceSettings] = useState(() => loadServiceSettingsFromLocalStore());
  const [merchantCustomers, setMerchantCustomers] = useState(() => loadCustomersFromLocalStore());
  const [staffDirectory, setStaffDirectory] = useState(() => loadStaffDirectoryFromLocalStore());

  const [currentPage, setCurrentPage] = useState("orders");
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [selectedProjectInquiryId, setSelectedProjectInquiryId] = useState(null);
  const [projectInquiryFollowUpDraft, setProjectInquiryFollowUpDraft] = useState("");
  const [selectedMiniProgramAppointmentId, setSelectedMiniProgramAppointmentId] = useState(null);
  const [miniProgramAppointmentNoteDraft, setMiniProgramAppointmentNoteDraft] = useState("");
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
  const [showProductCategorySheet, setShowProductCategorySheet] = useState(false);
  const [showSaleDeliverySettingsSheet, setShowSaleDeliverySettingsSheet] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [productSearchText, setProductSearchText] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("全部");
  const [customerSearchText, setCustomerSearchText] = useState("");
  const [miniDecorTab, setMiniDecorTab] = useState("首页主图");
  const [activeHomeBannerIndex, setActiveHomeBannerIndex] = useState(0);
  const [selectedInspirationId, setSelectedInspirationId] = useState("");
  const [isCreateOrderInputFocused, setIsCreateOrderInputFocused] = useState(false);

  const [showDetailBlock, setShowDetailBlock] = useState(false);
  const [completeForm, setCompleteForm] = useState({ scenePhotos: ["", "", ""], plantPhotos: ["", "", ""], remark: "" });
  const [staffAvatar, setStaffAvatar] = useState(() => loadStaffAvatarFromLocalStore());
  const [staffAvatarStatus, setStaffAvatarStatus] = useState("");
  const [staffAvatarError, setStaffAvatarError] = useState("");
  const [isUploadingStaffAvatar, setIsUploadingStaffAvatar] = useState(false);
  const [currentStaffId, setCurrentStaffId] = useState(() => loadCurrentStaffIdFromLocalStore());
  const [qrPreviewOrder, setQrPreviewOrder] = useState(null);
  const [merchantTodoToast, setMerchantTodoToast] = useState({ visible: false, signature: "", item: null });

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
    maintenanceContent: "浇水、擦叶、黄叶修剪、盆面清理、摆放调整、植物状态记录",
    maintenanceFinalPrice: "",
    maintenanceInternalNote: "",
    assignedStaffId: DEFAULT_STAFF_ID,
    communicationQrUrl: "",
    sourceInquiryId: "",
    sourceAppointmentId: "",
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
    monthlyRent: "",
    deposit: "",
    salePrice: "",
    imageUrl: "",
    image: "🪴",
    stock: "充足",
    supportDelivery: true,
    supportInstall: true,
    supportDeliveryInstall: true,
    visibleInMiniProgram: false,
    sortOrder: "",
    applicableScenes: "",
    careNote: "",
    deliveryNote: "",
    afterSaleNote: "",
    displayNameEn: "",
    showEnglishName: false,
    categoryId: "",
    categoryName: "",
    suitablePlaces: [],
    customPlaceText: "",
    lightRequirement: "",
    wateringCare: "",
    careDifficulty: "简单",
    stockStatus: "现货",
    note: "",
    status: "已上架",
    productType: "rental",
    displayName: "",
    displayDescription: "",
  });

  const [categoryForm, setCategoryForm] = useState({
    nameZh: "",
    nameEn: "",
    showEnglish: false,
    visibleInMiniProgram: true,
    sortOrder: "",
    businessType: "sale",
  });

  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeStaffDirectory = Array.isArray(staffDirectory) ? staffDirectory : [];
  const safeMerchantProducts = Array.isArray(merchantProducts) ? merchantProducts : [];
  const safeMerchantMaintenancePackages = normalizeMaintenancePackages(merchantMaintenancePackages);
  const safeMerchantProductCategories = normalizeProductCategories(merchantProductCategories);
  const safeProjectInquiries = normalizeProjectInquiries(projectInquiries);
  const safeMiniProgramAppointments = normalizeMiniProgramAppointments(miniProgramAppointments);
  const safeMiniProgramHomeConfig = normalizeMiniProgramHomeConfig(miniProgramHomeConfig);
  const safeMerchantServiceSettings = normalizeServiceSettings(merchantServiceSettings);
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

  const merchantRealtimeReminderItems = useMemo(() => {
    const orderItems = [...pendingMerchantConfirmOrders, ...pendingArchiveOrders].map((order) => ({
      kind: "order",
      id: order.id,
      key: `order:${order.id}:${order.status}:${order.plan?.updatedAt || order.completedAt || order.updatedAt || ""}`,
      title: order.status === "待商户归档" ? `完工待验：${order.customerName || "客户订单"}` : `方案待审：${order.customerName || "客户订单"}`,
      body: order.status === "待商户归档" ? "员工已提交现场完工内容，需要确认归档。" : "员工已提交方案和定价，需要商户确认。",
      actionLabel: order.status === "待商户归档" ? "去验收" : "去审核",
      targetTab: "工作台",
    }));
    const projectItems = normalizeProjectInquiries(projectInquiries)
      .filter((item) => item.status === "待跟进")
      .map((item) => ({
        kind: "project",
        id: item.id,
        key: `project:${item.id}:${item.status}:${item.updatedAt || item.createdAt || ""}`,
        title: `新项目咨询：${item.contactName || item.projectType || "待跟进线索"}`,
        body: "客户提交了园林改造 / 造景咨询，可进入项目线索池处理。",
        actionLabel: "查看线索",
        targetTab: "项目线索",
      }));
    const appointmentItems = normalizeMiniProgramAppointments(miniProgramAppointments)
      .filter((item) => item.status === "待确认")
      .map((item) => ({
        kind: "appointment",
        id: item.id,
        key: `appointment:${item.id}:${item.status}:${item.updatedAt || item.createdAt || ""}`,
        title: `新养护预约：${item.contactName || item.packageName || "待确认预约"}`,
        body: "客户在小程序提交了养护预约，可确认后转为订单。",
        actionLabel: "处理预约",
        targetTab: "订单管理",
      }));

    return [...orderItems, ...projectItems, ...appointmentItems].sort((a, b) => a.key.localeCompare(b.key));
  }, [pendingMerchantConfirmOrders, pendingArchiveOrders, projectInquiries, miniProgramAppointments]);

  const merchantTodoSignature = useMemo(() => {
    return merchantRealtimeReminderItems.map((item) => item.key).join("|");
  }, [merchantRealtimeReminderItems]);

  const submittedOrders = useMemo(() => {
    return safeOrders.filter((order) =>
      ["待商户确认", "方案已确认", "待执行", "执行中", "待商户归档", "已完成"].includes(order.status)
    );
  }, [safeOrders]);

  const monitoredOrders = useMemo(() => {
    return safeOrders.filter((order) =>
      ["方案已确认", "待执行", "执行中", "待商户归档"].includes(order.status)
    );
  }, [safeOrders]);

  const filteredProducts = safeMerchantProducts.filter((product) => {
    const keyword = searchText.trim();
    const planProductType = normalizePlanType(currentPlan?.planType) === "售卖订单" ? "sale" : "rental";
    const visible = product.status !== "停用" && product.status !== "未上架";
    const matchProductType = product.productType === planProductType || (!product.productType && planProductType === "rental");
    const matchCategory = activeCategory === "全部商品" || product.category === activeCategory;
    const matchSubCategory = activeSubCategory === "全部规格" || product.subCategory === activeSubCategory;
    const text = [product.name, product.category, product.subCategory, product.description, product.note].filter(Boolean).join(" ");

    if (!visible) return false;
    if (!matchProductType) return false;
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
    persistMaintenancePackagesToLocalStore(merchantMaintenancePackages);
  }, [merchantMaintenancePackages]);

  useEffect(() => {
    persistProductCategoriesToLocalStore(merchantProductCategories);
  }, [merchantProductCategories]);

  useEffect(() => {
    persistProjectInquiriesToLocalStore(projectInquiries);
  }, [projectInquiries]);

  useEffect(() => {
    persistMiniProgramAppointmentsToLocalStore(miniProgramAppointments);
  }, [miniProgramAppointments]);

  useEffect(() => {
    persistMiniProgramHomeConfigToLocalStore(miniProgramHomeConfig);
  }, [miniProgramHomeConfig]);

  useEffect(() => {
    persistServiceSettingsToLocalStore(merchantServiceSettings);
  }, [merchantServiceSettings]);

  useEffect(() => {
    if (merchantTab === "工作台") {
      setMerchantTodoToast((toast) => (toast.visible ? { visible: false, signature: merchantTodoSignature, item: null } : toast));
    }

    const previousSignature = previousMerchantTodoSignatureRef.current;
    if (!merchantTodoSignature) {
      previousMerchantTodoSignatureRef.current = "";
      setMerchantTodoToast((toast) => (toast.visible ? { visible: false, signature: "", item: null } : toast));
      return;
    }

    if (!previousSignature) {
      previousMerchantTodoSignatureRef.current = merchantTodoSignature;
      return;
    }

    if (merchantTodoSignature !== previousSignature) {
      const previousKeys = new Set(previousSignature.split("|").filter(Boolean));
      const newReminderItem = merchantRealtimeReminderItems.find((item) => !previousKeys.has(item.key));
      previousMerchantTodoSignatureRef.current = merchantTodoSignature;
      if (newReminderItem && merchantTab !== "工作台") {
        setMerchantTodoToast({ visible: true, signature: merchantTodoSignature, item: newReminderItem });
        return;
      }
      setMerchantTodoToast((toast) => (
        toast.visible && !merchantRealtimeReminderItems.some((item) => item.key === toast.item?.key)
          ? { visible: false, signature: merchantTodoSignature, item: null }
          : toast
      ));
    }
  }, [merchantTodoSignature, merchantRealtimeReminderItems, merchantTab]);

  useEffect(() => {
    const visibleCount = getHomeBannerItems(miniProgramHomeConfig).filter((item) => item.visible).length;
    if (visibleCount > 0 && activeHomeBannerIndex >= visibleCount) {
      setActiveHomeBannerIndex(Math.max(0, visibleCount - 1));
    } else if (visibleCount === 0 && activeHomeBannerIndex !== 0) {
      setActiveHomeBannerIndex(0);
    }
  }, [miniProgramHomeConfig, activeHomeBannerIndex]);

  useEffect(() => {
    if (!MINI_PROGRAM_DECOR_TABS.includes(miniDecorTab)) {
      setMiniDecorTab("首页主图");
    }
  }, [miniDecorTab]);

  useEffect(() => {
    const inspirationItems = getMiniProgramInspirationItems(miniProgramHomeConfig);
    if (!inspirationItems.length) {
      if (selectedInspirationId) setSelectedInspirationId("");
      return;
    }
    if (!selectedInspirationId || !inspirationItems.some((item) => item.id === selectedInspirationId)) {
      setSelectedInspirationId(inspirationItems[0].id);
    }
  }, [miniProgramHomeConfig, selectedInspirationId]);

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
      if (isUploadingStaffAvatar) return;

      const localProfileAvatar = getStaffAvatar(currentStaff) || loadStaffAvatarFromLocalStore(currentStaffId);
      const profileAvatarUrl = await loadStaffAvatarProfileFromCloud(currentStaffId);

      if (cancelled) return;

      if (profileAvatarUrl) {
        setStaffAvatarError("");
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

      if (localProfileAvatar && !cancelled) {
        setStaffAvatar(localProfileAvatar);
      }
    }

    syncStaffAvatarFromCloud();
    return () => {
      cancelled = true;
    };
  }, [currentStaffId, currentStaff?.avatarUrl, currentStaff?.avatar, isUploadingStaffAvatar]);

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

  function syncProductsLibrary(nextProducts, message = "商品与服务已同步", nextMaintenancePackages = merchantMaintenancePackages, nextCategories = merchantProductCategories, nextServiceSettings = merchantServiceSettings) {
    persistProductsToLocalStore(nextProducts);
    persistMaintenancePackagesToLocalStore(nextMaintenancePackages);
    persistProductCategoriesToLocalStore(nextCategories);
    persistServiceSettingsToLocalStore(nextServiceSettings);
    upsertProductsToCloud(nextProducts, nextMaintenancePackages, nextCategories, nextServiceSettings)
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

  function updateMaintenancePackages(nextPackages, message = "养护套餐已同步") {
    const normalized = normalizeMaintenancePackages(nextPackages);
    setMerchantMaintenancePackages(normalized);
    window.setTimeout(() => syncProductsLibrary(merchantProducts, message, normalized, merchantProductCategories), 0);
  }

  function updateProductCategories(nextCategories, message = "商品分类已同步") {
    const normalized = normalizeProductCategories(nextCategories);
    setMerchantProductCategories(normalized);
    window.setTimeout(() => syncProductsLibrary(merchantProducts, message, merchantMaintenancePackages, normalized), 0);
  }

  function updateServiceSettings(nextSettings, message = "服务设置已同步") {
    const normalized = normalizeServiceSettings(nextSettings);
    setMerchantServiceSettings(normalized);
    window.setTimeout(() => syncProductsLibrary(merchantProducts, message, merchantMaintenancePackages, merchantProductCategories, normalized), 0);
  }

  function syncProductPriceToOpenOrderPlans(product) {
    if (!product?.id) return;
    const normalizedProduct = normalizeProducts([product])[0];

    setOrders((prevOrders) => {
      const changedOrders = [];
      const nextOrders = prevOrders.map((order) => {
        if (!order?.plan || ["待商户归档", "已完成"].includes(order.status)) return order;

        const planType = normalizePlanType(order.plan?.planType || order.planType);
        let changed = false;
        const areas = safeAreas(order.plan).map((area) => {
          let areaChanged = false;
          const items = safeItems(area).map((item) => {
            if (String(item.productId) !== String(normalizedProduct.id)) return item;

            const nextItem = createPlanItemFromProduct(normalizedProduct, planType, Number(item.quantity || 1));
            const mergedItem = { ...item, ...nextItem, quantity: Number(item.quantity || 1) };
            if (
              Number(item.pricePerDay || 0) !== Number(mergedItem.pricePerDay || 0) ||
              item.priceUnit !== mergedItem.priceUnit
            ) {
              areaChanged = true;
              changed = true;
            }
            return mergedItem;
          });
          return areaChanged ? { ...area, items } : area;
        });

        if (!changed) return order;

        const changedOrder = ensureOrderDefaults({
          ...order,
          plan: {
            ...order.plan,
            areas,
            updatedAt: nowText(),
          },
        });
        changedOrders.push(changedOrder);
        return changedOrder;
      });

      if (changedOrders.length) {
        window.setTimeout(() => {
          changedOrders.forEach((changedOrder) => syncOneOrder(changedOrder, "商品价格已同步到订单方案"));
          const replaceActiveOrder = (activeOrder) =>
            activeOrder ? changedOrders.find((changedOrder) => changedOrder.id === activeOrder.id) || activeOrder : activeOrder;
          setSelectedOrder(replaceActiveOrder);
          setSelectedOrderDetail(replaceActiveOrder);
          setMerchantViewingOrder(replaceActiveOrder);
          setQrPreviewOrder(replaceActiveOrder);
        }, 0);
      }

      return nextOrders;
    });
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
              assignedStaffType: "",
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
            assignedStaffType: getStaffEmployeeType(staff),
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
              employeeType: getStaffEmployeeType(editingStaffForm),
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
    console.info("[staff-avatar] handleStaffAvatarUpload triggered", {
      fileName: file?.name || "",
      fileType: file?.type || "",
      fileSize: file?.size || 0,
    });

    const staffId = currentStaff?.id || currentStaffId || DEFAULT_STAFF_ID;
    console.info("[staff-avatar] staff context", {
      currentStaffObjectId: currentStaff?.id || "",
      currentStaffId,
      staffId,
      bucket: STAFF_AVATAR_BUCKET,
    });

    setIsUploadingStaffAvatar(true);
    setStaffAvatarError("");
    setStaffAvatarStatus("正在读取头像…");

    try {
      const avatarBlob = await createCompressedAvatarBlob(file);
      const localPreviewUrl = await readBlobAsDataUrl(avatarBlob);
      const accessToken = session?.access_token || "";

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
        console.error("[staff-avatar] upload step failed", {
          error: uploadError,
          details: uploadError?.details,
        });
        setStaffAvatarError(getStaffAvatarCloudErrorMessage(uploadError));
        setStaffAvatarStatus("仅本地预览，云端未同步");
        return;
      }

      const previewUrl = withAvatarCacheBust(avatarUrl);
      try {
        await saveStaffAvatarProfileToCloud(
          {
            ...currentStaff,
            id: staffId,
            name: currentStaff?.name || authAccount?.name || authUserEmail || "",
            email: currentStaff?.email || authUserEmail || "",
          },
          avatarUrl,
          accessToken
        );
        setStaffAvatar(previewUrl);
        setStaffDirectory((members) =>
          members.map((member) =>
            member.id === staffId
              ? normalizeStaffMember({ ...member, avatar: avatarUrl, avatarUrl, updatedAt: nowText() })
              : member
          )
        );
        setStaffAvatarStatus("头像已同步到云端");
      } catch (profileError) {
        console.error("[staff-avatar] profile save step failed", {
          error: profileError,
          details: profileError?.details,
        });
        setStaffAvatar(previewUrl);
        setStaffDirectory((members) =>
          members.map((member) =>
            member.id === staffId
              ? normalizeStaffMember({ ...member, avatar: avatarUrl, avatarUrl, updatedAt: nowText() })
              : member
          )
        );
        setStaffAvatarError(`头像文件已上传，但员工资料未同步：${getCloudErrorText(profileError?.details || profileError, "staff_profiles 写入失败")}`);
        setStaffAvatarStatus("头像文件已上传，员工资料未同步");
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
      employeeType: getStaffEmployeeType(staffInviteForm),
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
      const [cloudOrders, cloudLibrary] = await Promise.all([
        fetchOrdersFromCloud(),
        fetchProductLibraryFromCloud().catch(() => ({ products: [], maintenancePackages: [], productCategories: [], serviceSettings: defaultServiceSettings })),
      ]);

      if (cloudLibrary.products.length > 0) {
        setMerchantProducts(cloudLibrary.products);
      }
      if (cloudLibrary.maintenancePackages.length > 0) {
        setMerchantMaintenancePackages(cloudLibrary.maintenancePackages);
      }
      if (cloudLibrary.productCategories.length > 0) {
        setMerchantProductCategories(cloudLibrary.productCategories);
      }
      if (cloudLibrary.serviceSettings) {
        setMerchantServiceSettings(cloudLibrary.serviceSettings);
      }

      if (cloudOrders.length === 0) {
        setSyncState("暂无数据");
        setSyncMessage("暂无订单。可以先在商户端创建订单，或点击“同步当前数据”。");
        return;
      }

      replaceAllOrders(cloudOrders);
      setMerchantCustomers((prev) => mergeCustomers(prev, cloudOrders));
      setSyncState("已同步");
      setSyncMessage(`已从云端刷新订单和商品与服务配置：${nowText()}`);
    } catch (error) {
      console.error(error);
      setSyncState("同步失败");
      setSyncMessage(error.message || "读取云端失败。");
    }
  }

  async function silentRefreshFromCloud(reason = "自动同步") {
    try {
      const [cloudOrders, cloudLibrary] = await Promise.all([
        fetchOrdersFromCloud().catch(() => []),
        fetchProductLibraryFromCloud().catch(() => ({ products: [], maintenancePackages: [], productCategories: [], serviceSettings: defaultServiceSettings })),
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

      if (cloudLibrary.products.length > 0) {
        const normalizedProducts = normalizeProducts(cloudLibrary.products);
        if (!isReadingDetail) {
          setMerchantProducts((prevProducts) => {
            const prevText = JSON.stringify(prevProducts);
            const nextText = JSON.stringify(normalizedProducts);
            return prevText === nextText ? prevProducts : normalizedProducts;
          });
        }
      }

      if (cloudLibrary.maintenancePackages.length > 0 && !isReadingDetail) {
        const normalizedPackages = normalizeMaintenancePackages(cloudLibrary.maintenancePackages);
        setMerchantMaintenancePackages((prevPackages) => {
          const prevText = JSON.stringify(prevPackages);
          const nextText = JSON.stringify(normalizedPackages);
          return prevText === nextText ? prevPackages : normalizedPackages;
        });
      }

      if (cloudLibrary.productCategories.length > 0 && !isReadingDetail) {
        const normalizedCategories = normalizeProductCategories(cloudLibrary.productCategories);
        setMerchantProductCategories((prevCategories) => {
          const prevText = JSON.stringify(prevCategories);
          const nextText = JSON.stringify(normalizedCategories);
          return prevText === nextText ? prevCategories : normalizedCategories;
        });
      }

      if (cloudLibrary.serviceSettings && !isReadingDetail) {
        const normalizedSettings = normalizeServiceSettings(cloudLibrary.serviceSettings);
        setMerchantServiceSettings((prevSettings) => {
          const prevText = JSON.stringify(prevSettings);
          const nextText = JSON.stringify(normalizedSettings);
          return prevText === nextText ? prevSettings : normalizedSettings;
        });
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
    const source = encodeURIComponent("GardenOS");
    const userAgent = navigator.userAgent || "";
    const isAndroid = /Android/i.test(userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
    const amapScheme = isIOS
      ? `iosamap://path?sourceApplication=${source}&dname=${encodedAddress}&dev=0&t=0`
      : `androidamap://route/plan/?sourceApplication=${source}&dname=${encodedAddress}&dev=0&t=0`;
    const webFallback = `https://uri.amap.com/search?keyword=${encodedAddress}&callnative=1`;

    if (!isAndroid && !isIOS) {
      window.open(webFallback, "_blank");
      return;
    }

    let fallbackTimer = window.setTimeout(() => {
      if (document.visibilityState === "visible") {
        window.location.href = webFallback;
      }
    }, 1200);

    const clearFallback = () => {
      window.clearTimeout(fallbackTimer);
      document.removeEventListener("visibilitychange", clearFallback);
      window.removeEventListener("pagehide", clearFallback);
    };

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") clearFallback();
    }, { once: true });
    window.addEventListener("pagehide", clearFallback, { once: true });
    window.location.href = amapScheme;
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
              deliveryStatus: ["待执行", "未出发"].includes(order.deliveryStatus) ? "前往中" : order.deliveryStatus,
              executionStatus:
                ["待执行", "待联系", "已联系"].includes(order.executionStatus) ? "前往中" : order.executionStatus,
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
          assignedStaffType: shouldClaimPublicOrder ? getStaffEmployeeType(currentStaff) : order.assignedStaffType,
          acceptedAt: order.acceptedAt || nowText(),
          planType,
          serviceType: normalizeServiceType("", planType),
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
    if (safeOrder.status !== "执行中" || getOrderExecutionStage(safeOrder) !== "现场执行中") {
      alert("员工到达现场后，才能上传现场照片并完成任务。");
      return;
    }
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

  function updateProjectInquiry(inquiryId, patch) {
    setProjectInquiries((prev) =>
      normalizeProjectInquiries(prev).map((item) =>
        item.id === inquiryId ? { ...item, ...patch, updatedAt: nowText() } : item
      )
    );
  }

  function openProjectInquiryDetail(inquiry) {
    setSelectedProjectInquiryId(inquiry.id);
    setProjectInquiryFollowUpDraft(inquiry.followUpNote || "");
  }

  function saveProjectInquiryFollowUp() {
    if (!selectedProjectInquiryId) return;
    const patch = {
      followUpNote: projectInquiryFollowUpDraft,
    };
    if (projectInquiryFollowUpDraft.trim()) patch.status = "已联系";
    updateProjectInquiry(selectedProjectInquiryId, patch);
  }

  function buildProjectInquiryDescription(inquiry) {
    return [
      `项目类型：${inquiry.projectType || "园林改造咨询"}`,
      `面积范围：${inquiry.areaSize || "待确认"}`,
      `预算范围：${inquiry.budgetRange || "待确认"}`,
      `期望风格：${inquiry.stylePreference || "待确认"}`,
      `期望完成时间：${inquiry.expectedTime || "待确认"}`,
      inquiry.note ? `客户备注：${inquiry.note}` : "",
    ].filter(Boolean).join("\n");
  }

  function convertProjectInquiryToOrderDraft(inquiry) {
    const firstStaff = assignableStaffMembers[0] || activeStaffMembers.find(canAssignStaff) || getDefaultAssignedStaff();
    const description = buildProjectInquiryDescription(inquiry);
    setNewOrderForm((form) => ({
      ...form,
      customerName: `园林改造咨询 - ${inquiry.contactName || "客户"}`,
      contactName: inquiry.contactName || "",
      phone: inquiry.phone || "",
      areaSize: inquiry.areaSize || "",
      expectedDate: inquiry.expectedTime || "",
      address: inquiry.address || "",
      description,
      tagsText: "园林改造,待勘察,大项目",
      source: "客户预约",
      serviceType: "园林",
      leaseMonths: "12",
      paymentMethod: "月付",
      needDeposit: false,
      budget: inquiry.budgetRange || "",
      plannedPlantCount: "",
      areaNote: inquiry.projectType || "园林改造",
      merchantNote: description,
      retailNeedsMaintenance: false,
      assignedStaffId: firstStaff?.id || "",
      communicationQrUrl: "",
      sourceInquiryId: inquiry.id,
    }));
    updateProjectInquiry(inquiry.id, { status: inquiry.status === "待跟进" ? "已联系" : inquiry.status });
    setSelectedProjectInquiryId(null);
    setMerchantTab("订单管理");
    setIsCreateOrderInputFocused(false);
    setShowCreateOrderSheet(true);
  }

  function updateMiniProgramAppointment(appointmentId, patch) {
    setMiniProgramAppointments((prev) =>
      normalizeMiniProgramAppointments(prev).map((item) =>
        item.id === appointmentId ? { ...item, ...patch, updatedAt: nowText() } : item
      )
    );
  }

  function openMiniProgramAppointmentDetail(appointment) {
    setSelectedMiniProgramAppointmentId(appointment.id);
    setMiniProgramAppointmentNoteDraft(appointment.merchantNote || "");
  }

  function saveMiniProgramAppointmentNote() {
    if (!selectedMiniProgramAppointmentId) return;
    const patch = {
      merchantNote: miniProgramAppointmentNoteDraft,
    };
    if (miniProgramAppointmentNoteDraft.trim()) patch.status = "已联系";
    updateMiniProgramAppointment(selectedMiniProgramAppointmentId, patch);
  }

  function buildMiniProgramAppointmentDescription(appointment) {
    return [
      `客户小程序养护预约：${appointment.packageName || "标准养护"}`,
      `预约日期：${appointment.appointmentDate || "待确认"}`,
      `服务时间：${appointment.timeWindow || "待确认"}`,
      appointment.serviceArea ? `服务区域：${appointment.serviceArea}` : "",
      appointment.areaSize ? `面积/范围：${appointment.areaSize}` : "",
      appointment.plantCount ? `植物数量：${appointment.plantCount}` : "",
      appointment.quotedPrice ? `小程序预估价：¥${appointment.quotedPrice}` : "",
      appointment.customerNote ? `客户备注：${appointment.customerNote}` : "",
    ].filter(Boolean).join("\n");
  }

  function convertMiniProgramAppointmentToOrderDraft(appointment) {
    const firstStaff = assignableStaffMembers[0] || activeStaffMembers.find(canAssignStaff) || getDefaultAssignedStaff();
    const selectedMaintenancePackage =
      safeMerchantMaintenancePackages.find((item) => item.name === (appointment.packageName || "标准养护")) ||
      getMaintenancePackage(appointment.packageName || "标准养护");
    const description = buildMiniProgramAppointmentDescription(appointment);
    const activeDraftNote = selectedMiniProgramAppointmentId === appointment.id ? miniProgramAppointmentNoteDraft : "";
    const merchantNote = [activeDraftNote || appointment.merchantNote, description]
      .filter(Boolean)
      .join("\n\n");

    setNewOrderForm((form) => ({
      ...form,
      customerName: `养护预约 - ${appointment.contactName || "客户"}`,
      contactName: appointment.contactName || "",
      phone: appointment.phone || "",
      areaSize: appointment.areaSize || "",
      expectedDate: appointment.expectedTime || [appointment.appointmentDate, appointment.timeWindow].filter(Boolean).join(" "),
      address: appointment.address || "",
      description,
      tagsText: "小程序预约,养护服务,待确认",
      source: "客户预约",
      serviceType: "养护",
      leaseMonths: "12",
      paymentMethod: "月付",
      needDeposit: false,
      budget: appointment.quotedPrice || "",
      plannedPlantCount: appointment.plantCount || "",
      areaNote: appointment.serviceArea || appointment.packageName || "养护服务",
      merchantNote,
      retailNeedsMaintenance: false,
      maintenancePackage: selectedMaintenancePackage.name,
      maintenanceCycle: selectedMaintenancePackage.cycle || "按预约确认",
      maintenanceFrequency: selectedMaintenancePackage.frequency || "按预约确认",
      maintenanceContent: selectedMaintenancePackage.content || appointment.customerNote || "",
      maintenanceFinalPrice: appointment.quotedPrice || "",
      maintenanceInternalNote: merchantNote,
      assignedStaffId: firstStaff?.id || "",
      communicationQrUrl: "",
      sourceInquiryId: "",
      sourceAppointmentId: appointment.id,
    }));

    updateMiniProgramAppointment(appointment.id, {
      status: appointment.status === "待确认" ? "已联系" : appointment.status,
      merchantNote: activeDraftNote || appointment.merchantNote || "",
    });
    setSelectedMiniProgramAppointmentId(null);
    setMerchantTab("订单管理");
    setIsCreateOrderInputFocused(false);
    setShowCreateOrderSheet(true);
  }

  function updateHomeHeroConfig(patch) {
    setMiniProgramHomeConfig((prevConfig) => {
      const normalized = normalizeMiniProgramHomeConfig(prevConfig);
      const modules = normalized.homeModules.map((module) => {
        if (module.type !== "hero") return module;
        return {
          ...module,
          hero: normalizeHomeHeroConfig({ ...module.hero, ...patch }),
        };
      });
      const nextConfig = { ...normalized, homeModules: modules };
      return normalizeMiniProgramHomeConfig(nextConfig);
    });
  }

  function updateHomeHeroImage(nextValue) {
    updateHomeHeroConfig({
      imageUrl: nextValue && !String(nextValue).startsWith("data:") ? nextValue : "",
      localPreviewUrl: nextValue && String(nextValue).startsWith("data:") ? nextValue : "",
    });
  }

  function updateHomeBannerItems(updater) {
    setMiniProgramHomeConfig((prevConfig) => {
      const normalized = normalizeMiniProgramHomeConfig(prevConfig);
      const modules = normalized.homeModules.map((module) => {
        if (module.type !== "banner") return module;
        const nextItems = typeof updater === "function" ? updater(module.items) : module.items;
        return {
          ...module,
          items: nextItems.slice(0, 5).map(normalizeHomeBannerItem),
        };
      });
      return { ...normalized, homeModules: modules };
    });
  }

  function updateHomeBannerItem(itemId, patch) {
    updateHomeBannerItems((items) =>
      items.map((item) => {
        if (item.id !== itemId) return item;
        const nextItem = { ...item, ...patch };
        if (patch.layoutType && patch.layoutType !== item.layoutType) {
          const imageCount = getHomeBannerImageCount(patch.layoutType);
          nextItem.images = Array.from({ length: imageCount }, (_, index) =>
            normalizeHomeBannerImage(item.images?.[index], index)
          );
        }
        return nextItem;
      })
    );
  }

  function updateHomeBannerImage(itemId, imageIndex, nextValue) {
    updateHomeBannerItems((items) =>
      items.map((item) => {
        if (item.id !== itemId) return item;
        const imageCount = getHomeBannerImageCount(item.layoutType);
        const images = Array.from({ length: imageCount }, (_, index) => normalizeHomeBannerImage(item.images?.[index], index));
        images[imageIndex] = {
          ...images[imageIndex],
          imageUrl: nextValue && !String(nextValue).startsWith("data:") ? nextValue : "",
          localPreviewUrl: nextValue && String(nextValue).startsWith("data:") ? nextValue : "",
        };
        return { ...item, images };
      })
    );
  }

  function addHomeBannerItem() {
    const items = getHomeBannerItems(miniProgramHomeConfig);
    if (items.length >= 5) {
      alert("首页广告位最多配置 5 组。");
      return;
    }
    const nextSortOrder = Math.max(0, ...items.map((item) => Number(item.sortOrder || 0))) + 10;
    updateHomeBannerItems((currentItems) => [
      ...currentItems,
      normalizeHomeBannerItem({
        id: `banner-${Date.now()}`,
        title: `首页广告位 ${currentItems.length + 1}`,
        layoutType: "single",
        images: [{ imageUrl: "", localPreviewUrl: "", placeholder: "广告图" }],
        linkType: "none",
        linkTarget: "",
        visible: true,
        sortOrder: nextSortOrder,
      }, currentItems.length),
    ]);
    setActiveHomeBannerIndex(items.filter((item) => item.visible).length);
  }

  function removeHomeBannerItem(itemId) {
    updateHomeBannerItems((items) => items.filter((item) => item.id !== itemId));
    setActiveHomeBannerIndex(0);
  }

  function updateInspirationItems(updater) {
    setMiniProgramHomeConfig((prevConfig) => {
      const normalized = normalizeMiniProgramHomeConfig(prevConfig);
      const modules = normalized.homeModules.map((module) => {
        if (module.type !== "inspiration") return module;
        const nextItems = typeof updater === "function" ? updater(module.items) : module.items;
        return {
          ...module,
          items: nextItems.map(normalizeInspirationItem),
        };
      });
      return normalizeMiniProgramHomeConfig({ ...normalized, homeModules: modules });
    });
  }

  function updateInspirationItem(itemId, patch) {
    updateInspirationItems((items) =>
      items.map((item) => (item.id === itemId ? normalizeInspirationItem({ ...item, ...patch }) : item))
    );
  }

  function updateInspirationImage(itemId, nextValue) {
    updateInspirationItem(itemId, {
      imageUrl: nextValue && !String(nextValue).startsWith("data:") ? nextValue : "",
      localPreviewUrl: nextValue && String(nextValue).startsWith("data:") ? nextValue : "",
    });
  }

  function addInspirationItem() {
    const items = getMiniProgramInspirationItems(miniProgramHomeConfig);
    const nextSortOrder = Math.max(0, ...items.map((item) => Number(item.sortOrder || 0))) + 1;
    const nextItem = normalizeInspirationItem({
      id: `inspiration-${Date.now()}`,
      title: "新的摆放灵感",
      description: "适合办公室、门店或居家空间的植物摆放参考。",
      category: "办公室",
      tags: ["空间美化"],
      status: "已上架",
      sortOrder: nextSortOrder,
    }, items.length);
    updateInspirationItems((currentItems) => [...currentItems, nextItem]);
    setSelectedInspirationId(nextItem.id);
  }

  function removeInspirationItem(itemId) {
    updateInspirationItems((items) => items.filter((item) => item.id !== itemId));
    setSelectedInspirationId("");
  }

  function saveMiniProgramHomeConfig() {
    const normalized = normalizeMiniProgramHomeConfig(miniProgramHomeConfig);
    setMiniProgramHomeConfig(normalized);
    persistMiniProgramHomeConfigToLocalStore(normalized);
    setSyncMessage("小程序首页装修配置已保存到当前浏览器。");
    alert("小程序首页装修配置已保存到当前浏览器。");
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
      (plan) => {
        const planTypeForPrice = normalizePlanType(plan?.planType || currentPlan?.planType);
        const planItem = createPlanItemFromProduct(product, planTypeForPrice, 1);
        return {
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
                    ? { ...item, ...planItem, quantity: Number(item.quantity || 0) + 1 }
                    : item
                ),
              };
            }

            return {
              ...area,
              items: [...items, planItem],
            };
          }),
        };
      },
      "商品已同步"
    );
  }

  function setProductQuantityInCurrentArea(product, rawQuantity) {
    if (!currentOrder || !currentAreaId) return;

    const nextQuantity = Math.max(0, Math.floor(Number(rawQuantity || 0)));

    updateOrderPlan(
      currentOrder.id,
      (plan) => {
        const planTypeForPrice = normalizePlanType(plan?.planType || currentPlan?.planType);
        const planItem = createPlanItemFromProduct(product, planTypeForPrice, nextQuantity);
        return {
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
                    ? { ...item, ...planItem, quantity: nextQuantity }
                    : item
                ),
              };
            }

            return {
              ...area,
              items: [...items, planItem],
            };
          }),
        };
      },
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
    if (normalizePlanType(targetOrder?.plan?.planType) === "养护服务" && !Number(targetOrder.plan.maintenanceFinalPrice || 0)) {
      alert("请先填写养护服务最终报价");
      return;
    }

    const confirmedTime = nowText();
    updateOrder(
      orderId,
      (order) => {
        const next = {
          ...order,
          status: "待执行",
          planStatus: "待执行",
          merchantConfirmStatus: "已确认",
          merchantConfirmedAt: confirmedTime,
          executionStatus: "待执行",
          deliveryStatus: "待执行",
          plan: order.plan
            ? {
                ...order.plan,
                status: "待执行",
                merchantConfirmedAt: confirmedTime,
              }
            : order.plan,
        };

        return addTimeline(next, "商户确认方案，订单进入待执行");
      },
      "商户确认已同步"
    );

    backToMerchantHome("方案已确认，订单已进入待执行。员工端刷新后可点击开始执行。");
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
    const startedTime = nowText();
    updateOrder(
      orderId,
      (order) => {
        const next = {
          ...order,
          status: "执行中",
          planStatus: "执行中",
          executionStatus: "前往中",
          deliveryStatus: "前往中",
          startedAt: order.startedAt || startedTime,
          departedAt: startedTime,
          plan: order.plan
            ? {
                ...order.plan,
                status: "执行中",
                startedAt: order.plan.startedAt || startedTime,
              }
            : order.plan,
        };

        return addTimeline(next, "员工开始执行服务，已出发前往现场");
      },
      "执行状态已同步"
    );

    setActiveStaffTab("执行中");
  }

  function markArrivedOnSite(orderId) {
    const arrivedTime = nowText();
    updateOrder(
      orderId,
      (order) => {
        const next = {
          ...order,
          status: "执行中",
          planStatus: "执行中",
          executionStatus: "现场执行中",
          deliveryStatus: "已到达",
          arrivedAt: arrivedTime,
          plan: order.plan
            ? {
                ...order.plan,
                status: "执行中",
                arrivedAt: arrivedTime,
              }
            : order.plan,
        };

        return addTimeline(next, "员工已到达现场，进入现场执行中");
      },
      "到达状态已同步"
    );

    setActiveStaffTab("执行中");
  }

  function completeOrderByStaff(orderId) {
    const target = orders.find((order) => order.id === orderId);
    if (!target) return;

    if (target.status !== "执行中" || getOrderExecutionStage(target) !== "现场执行中") {
      alert("员工到达现场后，才能完成任务。");
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
          deliveryStatus: "已完成",
          executionStatus: "已完成",
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
    const planType = getPlanTypeForService(serviceType);
    const isPublicAssignment = !newOrderForm.assignedStaffId || ["public", "all"].includes(String(newOrderForm.assignedStaffId));
    const assignedStaff = isPublicAssignment
      ? null
      : staffDirectory.find((member) => member.id === newOrderForm.assignedStaffId) ||
        getStaffMemberById(newOrderForm.assignedStaffId);

    if (!isPublicAssignment && (!assignedStaff || !canAssignStaff(assignedStaff))) {
      alert("请先选择已启用且未暂停接单的员工。");
      return;
    }
    const selectedMaintenancePackage =
      safeMerchantMaintenancePackages.find((item) => item.name === (newOrderForm.maintenancePackage || "标准养护")) ||
      getMaintenancePackage(newOrderForm.maintenancePackage || "标准养护");
    const planDraft = {
      ...createEmptyPlan({ id: orderId }, planType),
      leaseMonths: Number(newOrderForm.leaseMonths || 12),
      paymentMethod: newOrderForm.paymentMethod || "月付",
      needDeposit: Boolean(newOrderForm.needDeposit),
      customFinalRent: newOrderForm.budget || "",
      retailNeedsMaintenance: Boolean(newOrderForm.retailNeedsMaintenance),
      maintenanceInternalNote: newOrderForm.maintenanceInternalNote || "",
      maintenanceFinalPrice: newOrderForm.maintenanceFinalPrice || "",
      maintenancePackage: selectedMaintenancePackage.name,
      maintenanceCycle: newOrderForm.maintenanceCycle || selectedMaintenancePackage.cycle,
      maintenanceFrequency: newOrderForm.maintenanceFrequency || selectedMaintenancePackage.frequency,
      maintenanceContent: newOrderForm.maintenanceContent || selectedMaintenancePackage.content,
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
      deliveryStatus: "待执行",
      executionStatus: "待执行",
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
      businessType: serviceType === "园林" || planType === "园林改造" ? "garden_project" : "",
      plannedPlantCount: newOrderForm.plannedPlantCount.trim(),
      budget: newOrderForm.budget.trim(),
      merchantNote: newOrderForm.merchantNote.trim(),
      areaNote: newOrderForm.areaNote.trim(),
      assignedStaffId: isPublicAssignment ? "" : assignedStaff?.id || "",
      assignedStaffName: isPublicAssignment ? "所有员工（公共任务）" : assignedStaff?.name || "",
      assignedStaffEmail: isPublicAssignment ? "" : assignedStaff?.email || "",
      assignedStaffType: isPublicAssignment ? "" : getStaffEmployeeType(assignedStaff),
      communicationQrUrl: newOrderForm.communicationQrUrl || "",
      sourceInquiryId: newOrderForm.sourceInquiryId || "",
      sourceInquiryType: newOrderForm.sourceInquiryId ? "garden_project" : "",
      sourceAppointmentId: newOrderForm.sourceAppointmentId || "",
      sourceAppointmentType: newOrderForm.sourceAppointmentId ? "care_service" : "",
      fieldNote: "",
      internalNote: "",
      revisionReason: "",
      timeline: [{ time, action: newOrderForm.sourceAppointmentId ? "小程序预约转为订单并派发" : "商户创建并派发订单" }],
      plan: planDraft,
    });

    setOrders((prevOrders) => [newOrder, ...prevOrders]);
    setMerchantCustomers((prev) => mergeCustomers(prev, [newOrder]));
    syncOneOrder(newOrder, "新订单已写入云端");
    if (newOrderForm.sourceInquiryId) {
      const inquiryPatch = {
        status: "已转订单",
        convertedOrderId: newOrder.id,
      };
      if (projectInquiryFollowUpDraft) inquiryPatch.followUpNote = projectInquiryFollowUpDraft;
      updateProjectInquiry(newOrderForm.sourceInquiryId, inquiryPatch);
    }
    if (newOrderForm.sourceAppointmentId) {
      updateMiniProgramAppointment(newOrderForm.sourceAppointmentId, {
        status: "已转订单",
        convertedOrderId: newOrder.id,
        merchantNote: newOrderForm.maintenanceInternalNote || newOrderForm.merchantNote || "",
      });
    }

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
      maintenanceContent: "浇水、擦叶、黄叶修剪、盆面清理、摆放调整、植物状态记录",
      maintenanceFinalPrice: "",
      maintenanceInternalNote: "",
      assignedStaffId: assignableStaffMembers[0]?.id || DEFAULT_STAFF_ID,
      communicationQrUrl: "",
      sourceInquiryId: "",
      sourceAppointmentId: "",
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
    const productType = serviceConfigTab === "售卖植物" ? "sale" : "rental";
    const defaultCategory = safeMerchantProductCategories.find((category) =>
      productType === "sale" ? category.businessType === "sale" : category.businessType === "rental"
    );
    setEditingProductId(null);
    setNewProductForm({
      name: "",
      category: defaultCategory?.nameZh || "室内绿植",
      subCategory: "大型植物",
      description: "",
      pricePerDay: "",
      monthlyRent: "",
      deposit: "",
      salePrice: "",
      imageUrl: "",
      image: "🪴",
      stock: "充足",
      supportDelivery: true,
      supportInstall: true,
      supportDeliveryInstall: true,
      visibleInMiniProgram: false,
      sortOrder: "",
      applicableScenes: "",
      careNote: "",
      deliveryNote: "",
      afterSaleNote: "",
      displayNameEn: "",
      showEnglishName: false,
      categoryId: defaultCategory?.id || "",
      categoryName: defaultCategory?.nameZh || "",
      suitablePlaces: [],
      customPlaceText: "",
      lightRequirement: "",
      wateringCare: "",
      careDifficulty: "简单",
      stockStatus: "现货",
      note: "",
      status: "已上架",
      productType,
      displayName: "",
      displayDescription: "",
    });
  }

  function createMerchantProduct() {
    const name = newProductForm.name.trim();
    if (!name) {
      alert("请填写商品名称");
      return;
    }

    const productType = serviceConfigTab === "售卖植物" ? "sale" : "rental";
    const price = Number(productType === "sale" ? newProductForm.salePrice || 0 : newProductForm.monthlyRent || newProductForm.pricePerDay || 0);
    if (!price || Number.isNaN(price)) {
      alert(productType === "sale" ? "请填写售卖价" : "请填写月租价");
      return;
    }
    const pricePerDay = productType === "rental"
      ? Number(newProductForm.pricePerDay || Math.max(1, Math.round(price / 30)))
      : Number(newProductForm.pricePerDay || price);

    const selectedCategory = safeMerchantProductCategories.find((category) => category.id === newProductForm.categoryId);
    const categoryName = selectedCategory?.nameZh || newProductForm.category || "室内绿植";
    const suitablePlaces = Array.isArray(newProductForm.suitablePlaces) ? newProductForm.suitablePlaces : [];
    const stockStatus = newProductForm.stockStatus || newProductForm.stock || "现货";
    const productPayload = {
      id: editingProductId || Date.now(),
      name,
      category: categoryName,
      categoryId: selectedCategory?.id || newProductForm.categoryId || "",
      categoryName,
      subCategory: newProductForm.subCategory || "大型植物",
      description: newProductForm.description.trim() || newProductForm.displayDescription.trim() || "暂无简介，可在商品与服务中补充。",
      displayName: newProductForm.displayName || name,
      displayNameEn: productType === "sale" ? newProductForm.displayNameEn || "" : "",
      showEnglishName: productType === "sale" ? Boolean(newProductForm.showEnglishName) : false,
      displayDescription: newProductForm.displayDescription || newProductForm.description.trim(),
      productType,
      serviceType: productType === "sale" ? "售卖" : "租赁",
      pricePerDay,
      monthlyRent: productType === "rental" ? String(price) : "",
      deposit: productType === "rental" ? newProductForm.deposit || "" : "",
      salePrice: productType === "sale" ? String(price) : "",
      price: String(price),
      priceUnit: productType === "sale"
        ? (["cat-planters", "cat-care-supplies"].includes(selectedCategory?.id) ? "元 / 件" : "元 / 盆")
        : "元 / 月",
      priceDisplay: productType === "sale"
        ? `¥${price} / ${["cat-planters", "cat-care-supplies"].includes(selectedCategory?.id) ? "件" : "盆"}`
        : `¥${price} / 月`,
      // Image upload integration can replace preview data with a remote URL.
      imageUrl: newProductForm.imageUrl.trim(),
      image: newProductForm.image || "🪴",
      stock: stockStatus,
      stockStatus,
      supportDelivery: productType === "sale" ? Boolean(newProductForm.supportDelivery) : false,
      supportInstall: productType === "sale" ? Boolean(newProductForm.supportInstall) : false,
      supportsDelivery: productType === "sale" ? Boolean(newProductForm.supportDelivery) : false,
      supportsInstallation: productType === "sale" ? Boolean(newProductForm.supportInstall) : false,
      supportDeliveryInstall: productType === "sale" ? Boolean(newProductForm.supportDelivery || newProductForm.supportInstall || newProductForm.supportDeliveryInstall) : false,
      visibleInMiniProgram: Boolean(newProductForm.visibleInMiniProgram),
      sortOrder: Number(newProductForm.sortOrder || 0),
      applicableScenes: productType === "sale" ? suitablePlaces.join("，") : newProductForm.applicableScenes || "",
      suitablePlaces: productType === "sale" ? suitablePlaces : [],
      lightRequirement: newProductForm.lightRequirement || "",
      wateringCare: productType === "sale" ? newProductForm.wateringCare || "" : "",
      careDifficulty: productType === "sale" ? newProductForm.careDifficulty || "简单" : "",
      careNote: productType === "rental" ? newProductForm.careNote || "" : "",
      deliveryNote: productType === "sale" ? newProductForm.deliveryNote || "" : "",
      afterSaleNote: productType === "sale" ? newProductForm.afterSaleNote || "" : "",
      note: newProductForm.note.trim(),
      status: newProductForm.status || "已上架",
      createdAt: newProductForm.createdAt || nowText(),
      updatedAt: nowText(),
    };

    const nextProducts = editingProductId
      ? merchantProducts.map((product) => (product.id === editingProductId ? productPayload : product))
      : [productPayload, ...merchantProducts];

    updateProducts(nextProducts, editingProductId ? "商品修改已同步" : "新商品已同步");
    syncProductPriceToOpenOrderPlans(productPayload);
    resetNewProductForm();
    setShowCreateProductSheet(false);
    setMerchantTab("商品与服务");
  }

  function openEditProduct(product) {
    const inferredCategory = safeMerchantProductCategories.find((category) => category.id === product.categoryId || category.nameZh === product.category);
    setEditingProductId(product.id);
    setServiceConfigTab(product.productType === "sale" ? "售卖植物" : "租赁植物");
    setNewProductForm({
      name: product.name || "",
      category: inferredCategory?.nameZh || product.category || "室内绿植",
      subCategory: product.subCategory || "大型植物",
      description: product.description || "",
      pricePerDay: String(product.pricePerDay || ""),
      monthlyRent: String(product.monthlyRent || ""),
      deposit: String(product.deposit || ""),
      salePrice: String(product.salePrice || product.price || ""),
      imageUrl: product.imageUrl || "",
      image: product.image || "🪴",
      stock: product.stock || "充足",
      supportDelivery: product.supportDelivery ?? Boolean(product.supportDeliveryInstall),
      supportInstall: product.supportInstall ?? Boolean(product.supportDeliveryInstall),
      supportDeliveryInstall: Boolean(product.supportDeliveryInstall),
      visibleInMiniProgram: Boolean(product.visibleInMiniProgram),
      sortOrder: String(product.sortOrder || ""),
      applicableScenes: product.applicableScenes || "",
      careNote: product.careNote || "",
      deliveryNote: product.deliveryNote || "",
      afterSaleNote: product.afterSaleNote || "",
      displayNameEn: product.displayNameEn || "",
      showEnglishName: Boolean(product.showEnglishName),
      categoryId: inferredCategory?.id || product.categoryId || "",
      categoryName: inferredCategory?.nameZh || product.categoryName || product.category || "",
      suitablePlaces: Array.isArray(product.suitablePlaces) ? product.suitablePlaces : String(product.applicableScenes || "").split(/[,，]/).map((item) => item.trim()).filter(Boolean),
      customPlaceText: "",
      lightRequirement: product.lightRequirement || "",
      wateringCare: product.wateringCare || product.careNote || "",
      careDifficulty: product.careDifficulty || "简单",
      stockStatus: product.stockStatus || product.stock || "现货",
      note: product.note || "",
      status: product.status || "已上架",
      productType: product.productType || "rental",
      displayName: product.displayName || product.name || "",
      displayDescription: product.displayDescription || product.description || "",
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

  function resetCategoryForm() {
    setEditingCategoryId(null);
    setCategoryForm({
      nameZh: "",
      nameEn: "",
      showEnglish: false,
      visibleInMiniProgram: true,
      sortOrder: "",
      businessType: serviceConfigTab === "租赁植物" ? "rental" : "sale",
    });
  }

  function openEditCategory(category) {
    setEditingCategoryId(category.id);
    setCategoryForm({
      nameZh: category.nameZh || "",
      nameEn: category.nameEn || "",
      showEnglish: Boolean(category.showEnglish),
      visibleInMiniProgram: Boolean(category.visibleInMiniProgram),
      sortOrder: String(category.sortOrder || ""),
      businessType: category.businessType || "sale",
    });
  }

  function saveProductCategory() {
    const nameZh = categoryForm.nameZh.trim();
    if (!nameZh) {
      alert("请填写分类中文名称");
      return;
    }
    const payload = {
      id: editingCategoryId || `cat-${Date.now()}`,
      nameZh,
      nameEn: categoryForm.nameEn.trim(),
      showEnglish: Boolean(categoryForm.showEnglish),
      visibleInMiniProgram: Boolean(categoryForm.visibleInMiniProgram),
      sortOrder: Number(categoryForm.sortOrder || 0),
      businessType: categoryForm.businessType || "sale",
      updatedAt: nowText(),
    };
    const nextCategories = editingCategoryId
      ? merchantProductCategories.map((category) => category.id === editingCategoryId ? payload : category)
      : [payload, ...merchantProductCategories];
    updateProductCategories(nextCategories, editingCategoryId ? "分类修改已同步" : "新分类已同步");
    resetCategoryForm();
  }

  function toggleSuitablePlace(place) {
    setNewProductForm((form) => {
      const selected = Array.isArray(form.suitablePlaces) ? form.suitablePlaces : [];
      const next = selected.includes(place) ? selected.filter((item) => item !== place) : [...selected, place];
      return { ...form, suitablePlaces: next };
    });
  }

  function addCustomSuitablePlace() {
    const place = String(newProductForm.customPlaceText || "").trim();
    if (!place) return;
    setNewProductForm((form) => {
      const selected = Array.isArray(form.suitablePlaces) ? form.suitablePlaces : [];
      return {
        ...form,
        suitablePlaces: selected.includes(place) ? selected : [...selected, place],
        customPlaceText: "",
      };
    });
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
    const executionStage = getOrderExecutionStage(order);
    const isExecutionOrder = ["方案已确认", "待执行", "执行中"].includes(order.status);
    if (isExecutionOrder && executionStage === "待执行") return "商户已确认方案，等待员工开始执行。";
    if (isExecutionOrder && executionStage === "前往中") return "员工已出发，正在前往客户现场。";
    if (isExecutionOrder && executionStage === "现场执行中") return "员工已到达现场，正在执行服务。";
    if (order.status === "待商户归档") return "员工已完成订单，等待商户查看并确认归档。";
    if (order.status === "已完成") return "商户已确认归档，订单正式完成。";
    if (order.status === "配置中" && order.merchantConfirmStatus === "要求修改") {
      return `商户要求修改：${order.revisionReason || "请调整方案"}`;
    }
    return "";
  }

  function buildPlanText(order, { includeCustomerPhone = true } = {}) {
    const plan = order?.plan;
    const stats = getPlanStats(plan);
    const isRetailPlan = normalizePlanType(plan?.planType) === "售卖订单";
    const isMaintenancePlan = plan?.planType === "养护服务";

    const areaText = safeAreas(plan)
      .map((area) => {
        const items = safeItems(area)
          .map((item) => `- ${item.name} × ${item.quantity}（¥${item.pricePerDay}/${isRetailPlan ? getPriceUnitDisplay(item.priceUnit) : "天"}）`)
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
默认养护：标准养护
说明：租赁方案默认包含标准养护，用于保障植物状态与客户现场效果，可对外展示为赠送标准养护服务。`;

    return `${plan?.planType || "绿植租赁方案"}
项目 / 客户：${order?.customerName || "-"}
联系人：${order?.contactName || "-"}
电话：${includeCustomerPhone ? (order?.phone || "-") : "联系方式已隐藏，请通过公司协调"}
项目面积：${order?.areaSize || "-"}
进场时间：${order?.expectedDate || "-"}
客户地址：${order?.address || "-"}
订单状态：${order?.status || "-"}
商户确认：${order?.merchantConfirmStatus || "-"}
客户确认：${order?.customerConfirmStatus || "-"}

方案明细：
${isMaintenancePlan ? "养护服务不展示租赁配花明细" : areaText || "暂无区域"}

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
  const executionStage = getOrderExecutionStage(order);
  const hideCustomerPhone = shouldHideCustomerPhoneForStaff(currentStaff, order);
  const contactText = hideCustomerPhone
    ? `${order.contactName || "-"}｜联系方式已隐藏，请通过公司协调`
    : `${order.contactName || "-"} ${order.phone ? `｜${order.phone}` : ""}`;

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
        <span className={`staff-status-chip ${statusClass}`}>{canExecute ? getExecutionDisplayText(order) : order.status}</span>
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
        <strong>{contactText}</strong>

        <span>预约时间</span>
        <strong>{order.expectedDate || "待确认"}</strong>

        <span>客户描述</span>
        <strong>{order.description || "暂无描述"}</strong>

        <span>商户备注</span>
        <strong>{order.merchantNote || order.plan?.merchantDraftNote || "暂无备注"}</strong>

        {canExecute && (
          <>
            <span>执行进度</span>
            <strong>{getExecutionDisplayText(order)}</strong>
            <span>关键时间</span>
            <strong>
              {order.startedAt ? `开始：${order.startedAt}` : "尚未开始"}
              {order.arrivedAt ? `｜到达：${order.arrivedAt}` : ""}
            </strong>
          </>
        )}
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
            {executionStage === "待执行" ? (
              <>
                <button className="staff-ghost-action" onClick={() => openPlanForOrder(order)}>
                  查看方案
                </button>
                <button className="staff-primary-action" onClick={() => startExecution(order.id)}>
                  开始执行
                </button>
              </>
            ) : executionStage === "前往中" ? (
              <>
                <button className="staff-ghost-action" onClick={() => openRouteNavigation(order.address)}>
                  一键导航
                </button>
                <button className="staff-primary-action" onClick={() => markArrivedOnSite(order.id)}>
                  已到达现场
                </button>
              </>
            ) : (
              <>
                <button className="staff-ghost-action" onClick={() => openRouteNavigation(order.address)}>
                  一键导航
                </button>
                <button className="staff-ghost-action" onClick={() => openCompleteUploadForOrder(order)}>
                  上传照片
                </button>
                <button className="staff-primary-action" onClick={() => openCompleteUploadForOrder(order)}>
                  完成任务
                </button>
              </>
            )}
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
                if (order.plan && ["待商户确认", "待商户归档", "方案已确认", "待执行", "执行中", "已完成"].includes(order.status)) {
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
            <strong>{getExecutionDisplayText(order)}</strong>
          </div>
          <div>
            <p>配送状态</p>
            <strong>{order.deliveryStatus || "待执行"}</strong>
          </div>
        </div>

        <div className="plan-summary-top">
          <div>
            <p>开始执行</p>
            <strong>{order.startedAt || "尚未开始"}</strong>
          </div>
          <div>
            <p>到达现场</p>
            <strong>{order.arrivedAt || "尚未到达"}</strong>
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
                value={getOrderExecutionStage(order)}
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
                value={order.deliveryStatus || "待执行"}
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

  if (!["执行中"].includes(currentOrder.status) || getOrderExecutionStage(currentOrder) !== "现场执行中") {
    alert("员工到达现场后，才能上传现场照片并完成任务。");
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
        deliveryStatus: "已完成",
        executionStatus: "已完成",
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
          <div className="plan-info-line"><span>联系人</span><strong>{!shouldHideCustomerPhoneForStaff(currentStaff, currentOrder) ? `${currentOrder.contactName || "暂无内容"} ${currentOrder.phone ? `｜${currentOrder.phone}` : ""}` : `${currentOrder.contactName || "暂无内容"}｜联系方式已隐藏，请通过公司协调`}</strong></div>
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
    const isRetailPlan = normalizePlanType(customerViewOrder.plan?.planType) === "售卖订单";
    const isMaintenancePlan = normalizePlanType(customerViewOrder.plan?.planType) === "养护服务";

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
                      <span>¥{money(item.pricePerDay)}/{isRetailPlan ? getPriceUnitDisplay(item.priceUnit) : "天"} × {item.quantity}</span>
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
    const safeCurrentPlanType = normalizePlanType(currentPlan?.planType);
    const isRetailPlan = safeCurrentPlanType === "售卖订单";
    const isMaintenancePlan = safeCurrentPlanType === "养护服务";
    const isRentalMaterialPlan = ["租赁方案", "临时摆场"].includes(safeCurrentPlanType);
    const currentExecutionStage = getOrderExecutionStage(currentOrder);
    const currentContactText = `${currentOrder.contactName || "-"}${currentOrder.phone ? `｜${currentOrder.phone}` : ""}`;
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
    const maintenanceChecklistOptions = [
      "服务区域已确认",
      "套餐内容已核对",
      "养护前照片已准备",
      "养护后照片已准备",
      "异常情况已记录",
    ];

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
            <span style={labelStyle}>联系人</span><strong style={{ ...strongStyle, textAlign: "right" }}>{currentContactText}</strong>
            <span style={labelStyle}>预约时间</span><strong style={{ ...strongStyle, textAlign: "right" }}>{currentOrder.expectedDate || "待确认"}</strong>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 12 }}>
            <button style={{ border: `1px solid ${videoBlue}`, borderRadius: 10, background: "#fff", color: videoBlue, fontWeight: 900, padding: "11px 8px" }} onClick={() => callPhone(currentOrder.phone)}>电话</button>
            <button style={{ border: `1px solid ${videoBlue}`, borderRadius: 10, background: "#fff", color: videoBlue, fontWeight: 900, padding: "11px 8px" }} onClick={() => openRouteNavigation(currentOrder.address)}>一键导航</button>
            <button style={{ border: `1px solid ${videoBlue}`, borderRadius: 10, background: "#fff", color: videoBlue, fontWeight: 900, padding: "11px 8px" }} onClick={() => copyText(currentOrder.address, "地址已复制")}>地址</button>
          </div>
          <div className="empty-card" style={{ marginTop: 12, textAlign: "left" }}>
            <p>{hasMerchantPrefill ? "商户已预填方案信息" : "暂无预填方案"}</p>
            <span>{hasMerchantPrefill ? "可根据现场情况微调区域、物料、数量和报价。" : "员工可根据现场情况创建方案。"}</span>
          </div>
        </section>

        {currentExecutionStage === "待执行" && (
          <section style={cardStyle}>
            <strong style={{ color: "#182536" }}>商户已确认方案</strong>
            <p style={{ margin: "8px 0 12px", color: "#6b7788" }}>当前为待执行 / 待出发，请先开始执行。</p>
            <button style={{ width: "100%", border: 0, borderRadius: 10, background: videoBlue, color: "#fff", fontWeight: 900, padding: "13px 14px" }} onClick={() => startExecution(currentOrder.id)}>开始执行</button>
          </section>
        )}

        {currentExecutionStage === "前往中" && (
          <section style={cardStyle}>
            <strong style={{ color: "#182536" }}>员工已出发</strong>
            <p style={{ margin: "8px 0 12px", color: "#6b7788" }}>请使用地图 App 导航，到达后点击已到达现场。</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button style={{ border: `1px solid ${videoBlue}`, borderRadius: 10, background: "#fff", color: videoBlue, fontWeight: 900, padding: "13px 10px" }} onClick={() => openRouteNavigation(currentOrder.address)}>一键导航</button>
              <button style={{ border: 0, borderRadius: 10, background: videoBlue, color: "#fff", fontWeight: 900, padding: "13px 10px" }} onClick={() => markArrivedOnSite(currentOrder.id)}>已到达现场</button>
            </div>
          </section>
        )}

        {currentExecutionStage === "现场执行中" && (
          <section style={cardStyle}>
            <strong style={{ color: "#182536" }}>任务执行中</strong>
            <p style={{ margin: "8px 0 12px", color: "#6b7788" }}>完成摆放后上传现场照片并提交。</p>
            <button style={{ width: "100%", border: 0, borderRadius: 10, background: videoBlue, color: "#fff", fontWeight: 900, padding: "13px 14px" }} onClick={() => openCompleteUploadForOrder(currentOrder)}>完成任务并上传照片</button>
          </section>
        )}

        {isRentalMaterialPlan && (
        <section style={cardStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid #e7edf4", marginBottom: 12 }}>
            <button style={tabStyle(true)}>植物</button>
            <button style={tabStyle(false)} onClick={() => alert("当前版本暂不支持花盆库。")}>花盆</button>
            <button style={tabStyle(false)} onClick={() => alert("当前版本暂不支持资材库。")}>资材</button>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
            <div>
              <strong style={{ color: "#182536", fontSize: 16 }}>场景物料表</strong>
              <p style={{ margin: "4px 0 0", color: "#7b899a", fontSize: 13 }}>{safeCurrentPlanType === "临时摆场" ? "按摆场区域选择植物和资材，数量可直接修改。" : "按租赁区域选择植物，数量可直接修改。"}</p>
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
                    <small>¥{money(item.pricePerDay)}/天</small>
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

        {isRetailPlan && (
          <section style={cardStyle}>
            <div className="section-title-row">
              <div>
                <p className="eyebrow">Sale Order</p>
                <h2>售卖订单</h2>
              </div>
              <button
                className="ghost-button"
                onClick={() => {
                  const firstArea = planAreas[0];
                  if (firstArea) {
                    openProductSheet(firstArea);
                    return;
                  }
                  addAreaWithName("商品清单");
                }}
              >
                添加商品
              </button>
            </div>

            <div className="empty-card" style={{ textAlign: "left", marginBottom: 12 }}>
              <p>售卖订单不进入租赁配花流程</p>
              <span>按商品清单、数量、单价和配送 / 安装备注计算销售合计。</span>
            </div>

            <div className="staff-material-card-flow">
              {selectedRows.length === 0 ? (
                <div className="empty-card"><p>暂无商品</p><span>点击“添加商品”维护售卖清单。</span></div>
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
                      <em>数量：{item.quantity} · 单价：¥{money(item.pricePerDay)}</em>
                      <small>小计 ¥{money(Number(item.pricePerDay || 0) * Number(item.quantity || 0))}</small>
                    </div>
                    <div className="staff-material-controls">
                      <input inputMode="numeric" type="number" value={item.quantity} min="1" onChange={(e) => {
                        const nextQty = Math.max(1, Number(e.target.value || 1));
                        updateOrderPlan(currentOrder.id, (plan) => ({
                          ...plan,
                          areas: safeAreas(plan).map((area) => area.id === item.areaId ? {
                            ...area,
                            items: safeItems(area).map((old) => old.productId === item.productId ? { ...old, quantity: nextQty } : old)
                          } : area),
                        }), "售卖数量已同步");
                      }} />
                      <button className="staff-material-remove" onClick={() => removeItemFromArea(item.areaId, item.productId)}>删除</button>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="maintenance-detail-grid" style={{ marginTop: 12 }}>
              <div className="sheet-block">
                <p className="sheet-label">配送 / 安装备注</p>
                <input className="area-input" value={currentPlan.saleDeliveryNote || ""} onChange={(e) => updateCurrentPlanField("saleDeliveryNote", e.target.value)} placeholder="例如：送达后协助摆放到前台和会议室" />
              </div>
              <div className="sheet-block">
                <p className="sheet-label">售后备注</p>
                <input className="area-input" value={currentPlan.saleAftercareNote || ""} onChange={(e) => updateCurrentPlanField("saleAftercareNote", e.target.value)} placeholder="例如：交付后 7 天内提供状态咨询" />
              </div>
            </div>

            <div className="rent-preview" style={{ marginTop: 12 }}>
              <span>销售合计</span>
              <strong>¥{money(currentStats.systemTotalRent)}</strong>
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
              {safeMerchantMaintenancePackages.map((pack) => {
                const selected = currentPlan.maintenancePackage === pack.name;
                return (
                  <button
                    key={pack.name}
                    className={selected ? "selected" : ""}
                    onClick={() =>
                      updateOrderPlan(
                        currentOrder.id,
                        (plan) => ({
                          ...plan,
                          maintenancePackage: pack.name,
                          maintenanceCycle: pack.cycle,
                          maintenanceFrequency: pack.frequency,
                          maintenanceContent: pack.content,
                        }),
                        "养护套餐已同步"
                      )
                    }
                  >
                    <strong>{pack.name}</strong>
                    {pack.recommended && <span>推荐 / 默认</span>}
                    <span>{pack.frequency}</span>
                    <small>{pack.scene}</small>
                    <em>{pack.content}</em>
                    <em>{pack.priceDisplay || formatMaintenancePrice(pack)}｜面积参考 {pack.areaPriceText}</em>
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

            <div className="sheet-block">
              <p className="sheet-label">执行勾选项</p>
              <div className="option-grid payment-grid">
                {maintenanceChecklistOptions.map((item) => {
                  const checkedItems = Array.isArray(currentPlan.maintenanceChecklist) ? currentPlan.maintenanceChecklist : [];
                  const selected = checkedItems.includes(item);
                  return (
                    <button
                      key={item}
                      className={selected ? "selected" : ""}
                      onClick={() => {
                        const nextChecklist = selected
                          ? checkedItems.filter((old) => old !== item)
                          : [...checkedItems, item];
                        updateCurrentPlanField("maintenanceChecklist", nextChecklist);
                      }}
                    >
                      {selected ? `✓ ${item}` : item}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="sheet-block">
              <p className="sheet-label">异常说明</p>
              <textarea
                className="area-input maintenance-textarea"
                value={currentPlan.maintenanceExceptionNote || ""}
                onChange={(e) => updateCurrentPlanField("maintenanceExceptionNote", e.target.value)}
                placeholder="例如：发现虫害、缺水、黄叶偏多、需补土或更换植物"
              />
            </div>

            <div className="empty-card">
              <p>模拟报价，可在商户端调整</p>
              <span>养护前 / 养护后照片仍在完成任务页上传；这里先记录套餐、完成项和异常说明。</span>
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
              <span style={planAmountLabelStyle}>{isRetailPlan ? "商品金额" : "预估日租金"}</span>
              <strong style={planAmountValueStyle}>¥{money(currentStats.dailyRent)}</strong>
            </div>
            <div style={planAmountCardStyle}>
              <span style={planAmountLabelStyle}>系统建议总价</span>
              <strong style={planAmountValueStyle}>¥{money(currentStats.systemTotalRent)}</strong>
            </div>
          </div>

          {safeCurrentPlanType === "租赁方案" && (
            <div className="empty-card" style={{ marginBottom: 18 }}>
              <p>租赁方案默认包含标准养护</p>
              <span>用于保障植物状态与客户现场效果，可对外展示为赠送标准养护服务。</span>
            </div>
          )}

          {isRetailPlan && (
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
          <div style={{ marginBottom: 18, display: isRetailPlan ? "none" : "block" }}>
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
          <div style={{ marginBottom: 18, display: isRetailPlan ? "none" : "block" }}>
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
          <div style={{ marginBottom: 18, display: isRetailPlan ? "none" : "block" }}>
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
    const isSaleSelector = normalizePlanType(currentPlan?.planType) === "售卖订单";
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
                <h2 style={{ margin: "4px 0 0", color: "#20261f", fontSize: 21, lineHeight: 1.18 }}>{isSaleSelector ? "售卖商品选择" : `${currentArea?.name || "当前场景"}物料选择`}</h2>
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
                const productUnitPrice = getProductPlanUnitPrice(product, currentPlan?.planType);
                return (
                  <article key={product.id} className={selectedQuantity > 0 ? "staff-product-picker-card selected" : "staff-product-picker-card"} onClick={() => setProductQuantityInCurrentArea(product, selectedQuantity + 1)}>
                    <span style={{ width: 54, height: 54, borderRadius: 8, background: "#f2f5f8", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", fontSize: 24 }}>{isImageUrl(image) ? <img src={image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : image}</span>
                    <span style={{ minWidth: 0 }}>
                      <strong style={{ display: "block", color: "#182536", fontSize: 15, marginBottom: 4 }}>{product.name}</strong>
                      <small style={{ display: "block", color: "#7b899a", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{product.description}</small>
                      <b style={{ display: "block", color: videoBlue, marginTop: 5 }}>{isSaleSelector ? `¥${money(productUnitPrice)}/${getPriceUnitDisplay(product.priceUnit)}` : `¥${money(productUnitPrice)}/天`}</b>
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
              已选 {getAreaProductCount(currentArea)} 件｜{normalizePlanType(currentPlan?.planType) === "售卖订单" ? "商品金额" : "日租金"} ¥{money(getAreaDailyRent(currentArea))}｜完成选品
            </button>
            <button style={{ border: "1px solid #f0c7c2", borderRadius: 10, background: "#fff7f6", color: "#b44a3e", fontWeight: 800, padding: "10px 12px" }} onClick={clearCurrentAreaItems}>{isSaleSelector ? "清空当前商品清单" : "清空当前场景物料"}</button>
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

    if (normalizePlanType(currentPlan?.planType) === "养护服务") {
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

    if (normalizePlanType(currentPlan?.planType) === "售卖订单") {
      return (
        <div className="sheet-mask" onClick={() => setShowPaymentSheet(false)}>
          <section className="bottom-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-header">
              <div><p className="eyebrow">Sale Order</p><h2>售卖订单报价</h2></div>
              <button className="close-button" onClick={() => setShowPaymentSheet(false)}>×</button>
            </div>

            <div className="empty-card">
              <p>售卖订单不需要租期、支付周期和押金设置。</p>
              <span>当前按商品单价 × 数量统计销售合计，可作为商户报价参考。</span>
            </div>

            <div className="rent-preview"><span>商品金额</span><strong>¥{money(currentStats.systemTotalRent)}</strong></div>
            <button className="submit-sheet-button" onClick={() => setShowPaymentSheet(false)}>保存售卖报价</button>
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
    const isMaintenancePlan = normalizePlanType(currentPlan?.planType) === "养护服务";

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
    const canCopyCustomerPhone = !shouldHideCustomerPhoneForStaff(currentStaff, currentOrder);
    return (
      <div className="sheet-mask" onClick={() => setShowMoreSheet(false)}>
        <section className="bottom-sheet" onClick={(event) => event.stopPropagation()}>
          <div className="sheet-handle" />
          <div className="sheet-header">
            <div><p className="eyebrow">More</p><h2>更多操作</h2></div>
            <button className="close-button" onClick={() => setShowMoreSheet(false)}>×</button>
          </div>

          <button className="submit-sheet-button" onClick={() => copyText(buildPlanText(currentOrder, { includeCustomerPhone: canCopyCustomerPhone }), "方案摘要已复制")}>复制方案摘要</button>
          <button className="submit-sheet-button" onClick={() => copyCustomerPlanLink(currentOrder)}>复制客户方案链接</button>
          <button className="submit-sheet-button" onClick={() => markPlanSentToCustomer(currentOrder.id)}>标记已转发客户</button>
          <button className="submit-sheet-button" onClick={() => openRouteNavigation(currentOrder.address)}>打开导航</button>
          <button className="submit-sheet-button" onClick={() => locateStaff(currentOrder.id)}>定位当前位置</button>
          {canCopyCustomerPhone ? (
            <button className="submit-sheet-button" onClick={() => exportOrderData(currentOrder)}>导出当前订单数据</button>
          ) : (
            <button className="submit-sheet-button" onClick={() => alert("外部执行方不可导出客户联系方式，请通过公司协调。")}>联系方式已隐藏</button>
          )}

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
      { key: "商品与服务", Icon: GardenIcons.Products },
      { key: "客户库", Icon: GardenIcons.Customers },
      { key: "项目线索", Icon: GardenIcons.ProjectLeads },
      { key: "小程序装修", Icon: GardenIcons.Image },
      { key: "设置", Icon: GardenIcons.Settings },
    ];
    const todoOrders = [...(Array.isArray(pendingMerchantConfirmOrders) ? pendingMerchantConfirmOrders : []), ...(Array.isArray(pendingArchiveOrders) ? pendingArchiveOrders : [])];
    const displayOrders = Array.isArray(merchantOrders) ? merchantOrders : [];
    const displayProjectInquiries = safeProjectInquiries;
    const pendingProjectInquiryCount = displayProjectInquiries.filter((item) => item.status === "待跟进").length;
    const selectedProjectInquiry = selectedProjectInquiryId
      ? displayProjectInquiries.find((item) => item.id === selectedProjectInquiryId) || null
      : null;
    const displayMiniProgramAppointments = safeMiniProgramAppointments;
    const pendingMiniProgramAppointments = displayMiniProgramAppointments.filter((item) => item.status === "待确认");
    const pendingMiniProgramAppointmentCount = pendingMiniProgramAppointments.length;
    const selectedMiniProgramAppointment = selectedMiniProgramAppointmentId
      ? displayMiniProgramAppointments.find((item) => item.id === selectedMiniProgramAppointmentId) || null
      : null;
    const homeBannerItems = getHomeBannerItems(safeMiniProgramHomeConfig);
    const homeHeroConfig = getHomeHeroConfig(safeMiniProgramHomeConfig);
    const homeHeroImageSrc = getHomeHeroImageSrc(homeHeroConfig);
    const sortedHomeBannerItems = [...homeBannerItems].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
    const visibleHomeBannerItems = sortedHomeBannerItems.filter((item) => item.visible);
    const activeHomeBanner = visibleHomeBannerItems[activeHomeBannerIndex] || visibleHomeBannerItems[0] || null;
    const activeBannerEditorItem = sortedHomeBannerItems[activeHomeBannerIndex] || sortedHomeBannerItems[0] || null;
    const inspirationItems = getMiniProgramInspirationItems(safeMiniProgramHomeConfig);
    const sortedInspirationItems = [...inspirationItems].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
    const selectedInspirationItem = selectedInspirationId
      ? sortedInspirationItems.find((item) => item.id === selectedInspirationId) || sortedInspirationItems[0] || null
      : sortedInspirationItems[0] || null;
    const inspirationProductOptions = safeMerchantProducts.filter((product) => product.productType === "sale" || product.productType === "rental");
    const activeStaffMembers = (Array.isArray(staffDirectory) ? staffDirectory : []).filter((member) => member.organizationId === currentMerchantUser?.organizationId);
    const assignableTeamMembers = activeStaffMembers.filter(canAssignStaff);
    const editingStaffMember = activeStaffMembers.find((member) => member.id === editingStaffId) || null;
    const activeMerchantToastItem = merchantTodoToast.item;
    const dismissMerchantToast = () => setMerchantTodoToast({ visible: false, signature: merchantTodoSignature, item: null });
    const openMerchantToastTarget = () => {
      const item = activeMerchantToastItem;
      dismissMerchantToast();
      if (!item) return;
      if (item.kind === "order") {
        const order = safeMerchantOrders.find((orderItem) => String(orderItem.id) === String(item.id));
        if (order?.plan) {
          openMerchantPlanWorkbench(order);
          return;
        }
        if (order) {
          setMerchantTab("订单管理");
          setSelectedOrderDetail(order);
          setMerchantViewingOrder(null);
          return;
        }
      }
      if (item.kind === "project") {
        setMerchantTab("项目线索");
        setSelectedProjectInquiryId(item.id);
        return;
      }
      if (item.kind === "appointment") {
        setMerchantTab("订单管理");
        setSelectedMiniProgramAppointmentId(item.id);
        return;
      }
      setMerchantTab(item.targetTab || "工作台");
    };
    const serviceProductType = serviceConfigTab === "售卖植物" ? "sale" : "rental";
    const serviceConfigTabs = ["租赁植物", "售卖植物", "养护套餐"];
    const productCategoryOptions = safeMerchantProductCategories.filter((category) =>
      serviceConfigTab === "售卖植物"
        ? ["sale", "care"].includes(category.businessType)
        : category.businessType === "rental"
    );
    
    const filteredMerchantProducts = (Array.isArray(merchantProducts) ? merchantProducts : []).filter((product) => {
      const keyword = productSearchText.trim();
      const matchType = product.productType === serviceProductType || (!product.productType && serviceProductType === "rental");
      const matchCategory = productCategoryFilter === "全部" || product.category === productCategoryFilter || product.categoryId === productCategoryFilter;
      const text = [product.name, product.displayNameEn, product.category, product.subCategory, product.description, product.note, product.status, product.applicableScenes, product.lightRequirement, product.wateringCare].join(" ");
      return matchType && matchCategory && (!keyword || text.includes(keyword));
    });

    const updateMaintenancePackageField = (packageName, field, value) => {
      updateMaintenancePackages(
        safeMerchantMaintenancePackages.map((item) =>
          item.name === packageName ? { ...item, [field]: value, updatedAt: nowText() } : item
        ),
        "养护套餐已同步"
      );
    };

    const updateMaintenancePackagePriceType = (packageName, priceType) => {
      updateMaintenancePackages(
        safeMerchantMaintenancePackages.map((item) => {
          if (item.name !== packageName) return item;
          const nextUnit = priceType === "project"
            ? "按项目报价"
            : item.priceUnit === "按项目报价"
              ? "元 / 盆 / 次"
              : item.priceUnit;
          return {
            ...item,
            priceType,
            priceObject: priceType === "project" ? "项" : item.priceObject || "盆",
            priceCycle: priceType === "project" ? "次" : item.priceCycle || "次",
            priceUnit: nextUnit,
            updatedAt: nowText(),
          };
        }),
        "养护套餐已同步"
      );
    };
    
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
                  setSelectedProjectInquiryId(null);
                  setMerchantTab(item.key);
                }}
              >
                <Icon size={19} />
                <span>{item.key}</span>
              </button>
            );
          })}

          <div className="merchant-sidebar-footer">
            <div className="merchant-sidebar-art-card" aria-hidden="true">
              <img src={sidebarAestheticSpaceCard} alt="" />
            </div>
            {showRoleSwitch && (
              <button className="admin-nav-btn" style={{ width: "100%", textAlign: "center", border: "1px solid #334155" }} onClick={() => switchRole("staff")}>
                <GardenIcons.StaffUser size={18} />
                <span>切换至员工视角</span>
              </button>
            )}
          </div>
        </aside>
      );
    }

    // 独立抽出的审核台组件：左右分栏沉浸式
    function MerchantReviewPage({ order }) {
      order = ensureOrderDefaults(order);
      const orderPlan = order.plan || null;
      const stats = getPlanStats(orderPlan);
      const isRetailPlan = normalizePlanType(orderPlan?.planType) === "售卖订单";
      const isMaintenancePlan = normalizePlanType(orderPlan?.planType) === "养护服务";
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
                <div className="plan-info-line"><span>执行进度</span><strong>{getExecutionDisplayText(order)} · {getMerchantExecutionProgressText(order)}</strong></div>
                <div className="plan-info-line"><span>关键时间</span><strong>{order.startedAt ? `开始：${order.startedAt}` : "尚未开始"}{order.arrivedAt ? `｜到达：${order.arrivedAt}` : ""}</strong></div>
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
                                <span>¥{money(item.pricePerDay)}/{isRetailPlan ? getPriceUnitDisplay(item.priceUnit) : "天"} × {item.quantity}</span>
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
                      <strong>{order.budget ? (Number.isFinite(Number(order.budget)) ? <MoneyAmount value={order.budget} /> : order.budget) : "暂无预算"}</strong>
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
                onClick={() => {
                  setSelectedProjectInquiryId(null);
                  setMerchantTodoToast((toast) => (toast.visible ? { ...toast, visible: false, signature: merchantTodoSignature } : toast));
                  setMerchantTab(item.key);
                }}
              >
                <Icon size={19} />
                <span>{item.key}</span>
              </button>
            );
          })}

          <div className="merchant-sidebar-footer">
            <div className="merchant-sidebar-art-card" aria-hidden="true">
              <img src={sidebarAestheticSpaceCard} alt="" />
            </div>
            {showRoleSwitch && (
              <button className="admin-nav-btn" style={{ width: "100%", textAlign: "center", border: "1px solid #334155" }} onClick={() => switchRole("staff")}>
                <GardenIcons.StaffUser size={18} />
                <span>切换至员工视角</span>
              </button>
            )}
          </div>
        </aside>

        {/* 宽阔的浅色主工作区 */}
        <main className="admin-main merchant-admin-main">
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

          <div className="merchant-admin-content">
          {merchantTab === "工作台" && (
            <>
              <div className="admin-metric-grid">
                <MetricCard label="云端总池" value={`${safeMerchantOrders.length}`} hint="笔订单" />
                <MetricCard label="等待接单" value={`${statusCounts["待接单"] || 0}`} hint="需催促员工" />
                <MetricCard label="方案待审" value={`${statusCounts["待商户确认"] || 0}`} hint="需老板定价" />
                <MetricCard label="现场施工" value={`${statusCounts["执行中"] || 0}`} hint="正在服务中" />
                <MetricCard label="完工待验" value={`${statusCounts["待商户归档"] || 0}`} hint="需老板确认归档" />
              </div>

              {pendingProjectInquiryCount > 0 && (
                <button className="project-inquiry-reminder" onClick={() => setMerchantTab("项目线索")}>
                  <span>
                    <strong>园林改造咨询：{pendingProjectInquiryCount} 条待跟进</strong>
                    <em>客户已提交园林改造 / 造景需求，可进入项目线索池查看并转正式订单。</em>
                  </span>
                  <b>查看线索</b>
                </button>
              )}

              {pendingMiniProgramAppointmentCount > 0 && (
                <button className="project-inquiry-reminder mini-appointment-reminder" onClick={() => setMerchantTab("订单管理")}>
                  <span>
                    <strong>小程序养护预约：{pendingMiniProgramAppointmentCount} 条待确认</strong>
                    <em>客户已在小程序选择养护套餐并提交地址与服务时间，可在订单管理中打开预约卡片后转为订单。</em>
                  </span>
                  <b>处理预约</b>
                </button>
              )}

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

          {merchantTodoToast.visible && activeMerchantToastItem && merchantTab !== "工作台" && (
            <div className="admin-toast-fixed">
              <div>
                <strong style={{ color: "#0f172a", display: "block", fontSize: 16, marginBottom: 4 }}>{activeMerchantToastItem.title}</strong>
                <span style={{ color: "#64748b", fontSize: 13 }}>{activeMerchantToastItem.body}</span>
              </div>
              <button className="admin-toast-action" onClick={openMerchantToastTarget}>
                {activeMerchantToastItem.actionLabel || "立即处理"}
              </button>
              <button className="admin-toast-close" aria-label="关闭待办提醒" onClick={dismissMerchantToast}>
                ×
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

              {pendingMiniProgramAppointments.length > 0 && (
                <div className="mini-appointment-panel">
                  <div className="section-title-row">
                    <div>
                      <p className="eyebrow">Mini Program Booking</p>
                      <h2>小程序养护预约待确认</h2>
                    </div>
                    <span>客户提交后先进入这里，商户确认或修改后再派给员工。</span>
                  </div>
                  <div className="mini-appointment-grid">
                    {pendingMiniProgramAppointments.slice(0, 4).map((appointment) => (
                      <article className="mini-appointment-card" key={appointment.id}>
                        <header>
                          <span>{appointment.packageName || "养护服务"}</span>
                          <b>{appointment.status}</b>
                        </header>
                        <h3>{appointment.contactName || "待确认客户"}</h3>
                        <p>{appointment.address || "地址待确认"}</p>
                        <div className="mini-appointment-meta">
                          <span>{appointment.expectedTime || "时间待确认"}</span>
                          <span>{appointment.plantCount || appointment.areaSize || "范围待确认"}</span>
                        </div>
                        <div className="mini-appointment-actions">
                          <button className="ghost-button" onClick={() => openMiniProgramAppointmentDetail(appointment)}>查看</button>
                          <button className="primary-button" onClick={() => convertMiniProgramAppointmentToOrderDraft(appointment)}>转订单草稿</button>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}

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
                              {member.name} · {member.staffNo} · {STAFF_EMPLOYEE_TYPE_LABELS[getStaffEmployeeType(member)]}
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

          {merchantTab === "项目线索" && (
            <div className="admin-card admin-data-panel">
              <div className="admin-section-head">
                <div>
                  <h2>项目线索池</h2>
                  <p>接收客户小程序后续提交的园林改造、造景和项目工程咨询，先跟进再转正式订单。</p>
                </div>
                <div className="project-inquiry-summary">
                  <strong>{pendingProjectInquiryCount}</strong>
                  <span>待跟进</span>
                </div>
              </div>

              <div className="empty-card" style={{ marginBottom: 14 }}>
                <p>当前为本地 mock 线索池</p>
                <span>已预留 source、type、photos、convertedOrderId 等字段，后续客户小程序提交表单后可按同一结构写入。</span>
              </div>

              <div className="admin-table project-inquiry-table">
                <div className="admin-table-row admin-table-head">
                  <span>客户姓名</span>
                  <span>联系电话</span>
                  <span>项目类型</span>
                  <span>项目地址</span>
                  <span>面积范围</span>
                  <span>预算范围</span>
                  <span>期望风格</span>
                  <span>状态</span>
                  <span>操作</span>
                </div>

                {displayProjectInquiries.map((inquiry) => (
                  <div className="admin-table-row" key={inquiry.id}>
                    <span>
                      <strong>{inquiry.contactName}</strong>
                      <em>{inquiry.createdAt || "暂无提交时间"}</em>
                    </span>
                    <span>{inquiry.phone || "-"}</span>
                    <span>{inquiry.projectType || "园林改造"}</span>
                    <span>
                      <strong>{inquiry.address || "-"}</strong>
                      <em>{inquiry.expectedTime ? `期望：${inquiry.expectedTime}` : "期望时间待确认"}</em>
                    </span>
                    <span>{inquiry.areaSize || "-"}</span>
                    <span>{inquiry.budgetRange || "-"}</span>
                    <span>{inquiry.stylePreference || "-"}</span>
                    <span>
                      <b className={`admin-status-chip ${inquiry.status === "待跟进" ? "is-plan" : inquiry.status === "已转订单" ? "is-done" : inquiry.status === "无效" ? "muted" : ""}`}>
                        {inquiry.status}
                      </b>
                    </span>
                    <span className="admin-table-actions">
                      <button className="ghost-button" onClick={() => openProjectInquiryDetail(inquiry)}>
                        查看
                      </button>
                      {inquiry.status !== "已转订单" && (
                        <button className="primary-button" onClick={() => convertProjectInquiryToOrderDraft(inquiry)}>
                          转订单
                        </button>
                      )}
                    </span>
                  </div>
                ))}
              </div>
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
                        <span>
                          <strong>{ROLE_LABELS[member.role] || member.role}</strong>
                          <em>{STAFF_EMPLOYEE_TYPE_LABELS[getStaffEmployeeType(member)]}</em>
                        </span>
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

          {merchantTab === "商品与服务" && (
            <div className="admin-card admin-data-panel">
              <div className="admin-section-head">
                <div>
                  <h2>商品与服务</h2>
                  <p>分开维护租赁植物、售卖植物和标准养护套餐，为后续客户小程序同步准备数据。</p>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {serviceConfigTab === "售卖植物" && (
                    <button
                      className="ghost-button"
                      onClick={() => setShowSaleDeliverySettingsSheet(true)}
                    >
                      默认配送时间：{safeMerchantServiceSettings.saleDeliveryLabel}
                    </button>
                  )}
                  {serviceConfigTab !== "养护套餐" && (
                    <button
                      className="ghost-button"
                      onClick={() => {
                        resetCategoryForm();
                        setShowProductCategorySheet(true);
                      }}
                    >
                      分类管理
                    </button>
                  )}
                  {serviceConfigTab !== "养护套餐" && (
                    <button
                      className="primary-button"
                      onClick={() => {
                        resetNewProductForm();
                        setShowCreateProductSheet(true);
                      }}
                    >
                      + 新增{serviceConfigTab === "售卖植物" ? "售卖植物" : "租赁植物"}
                    </button>
                  )}
                </div>
              </div>

              <div className="plan-type-grid" style={{ marginBottom: 16 }}>
                {serviceConfigTabs.map((tab) => (
                  <button
                    key={tab}
                    className={serviceConfigTab === tab ? "selected" : ""}
                    onClick={() => setServiceConfigTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {serviceConfigTab !== "养护套餐" && (
                <>
                  <div className="admin-filter-row">
                    <input
                      value={productSearchText}
                      onChange={(e) => setProductSearchText(e.target.value)}
                      placeholder={`搜索${serviceConfigTab}名称、分类、描述、备注`}
                    />
                    <select
                      value={productCategoryFilter}
                      onChange={(e) => setProductCategoryFilter(e.target.value)}
                    >
                      <option value="全部">全部分类</option>
                      {productCategoryOptions.map((category) => (
                        <option key={category.id} value={category.id}>
                          {getCategoryDisplayName(category)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="empty-card" style={{ marginBottom: 14 }}>
                    <p>{serviceConfigTab === "售卖植物" ? "售卖植物用于购买意向和商户端代下单" : "租赁植物用于租赁方案选品"}</p>
                    <span>字段已预留小程序展示、排序、展示名称和展示说明；后续可同步到客户小程序。</span>
                  </div>

                  {filteredMerchantProducts.length === 0 ? (
                    <div className="empty-card">
                      <p>暂无{serviceConfigTab}，请先添加</p>
                      <span>{serviceConfigTab === "售卖植物" ? "售卖订单会从售卖植物库选择商品。" : "租赁方案会从租赁植物库选择商品。"}</span>
                    </div>
                  ) : (
                    <div className="admin-table product-admin-table">
                      <div className="admin-table-row admin-table-head">
                        <span>植物</span>
                        <span>分类 / 场景</span>
                        <span>{serviceConfigTab === "售卖植物" ? "售卖价" : "月租价"}</span>
                        <span>{serviceConfigTab === "售卖植物" ? "现货 / 配送" : "押金"}</span>
                        <span>小程序展示</span>
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
                              <strong>{product.displayName || product.name}</strong>
                              <em>{product.displayDescription || product.description || "暂无描述"}</em>
                            </span>
                          </span>
                          <span>
                            <strong>{product.category || "-"}</strong>
                            <em>{product.applicableScenes || product.subCategory || "-"}</em>
                          </span>
                          <span>
                            {serviceConfigTab === "售卖植物"
                              ? `¥${money(product.salePrice || product.price || 0)}`
                              : `¥${money(product.monthlyRent || product.price || product.pricePerDay || 0)} / 月`}
                          </span>
                          <span>
                            {serviceConfigTab === "售卖植物" ? (
                              <>
                                <strong>{product.stock || "充足"}</strong>
                                <em>{product.supportDelivery || product.supportInstall ? `${product.supportDelivery ? "配送" : ""}${product.supportDelivery && product.supportInstall ? " / " : ""}${product.supportInstall ? "安装" : ""}` : "人工确认"}</em>
                              </>
                            ) : (
                              <>
                                <strong>{product.deposit ? `¥${product.deposit}` : "免押或面议"}</strong>
                                <em>{product.status || "已上架"}</em>
                              </>
                            )}
                          </span>
                          <span>
                            <b className={product.visibleInMiniProgram ? "admin-status-chip" : "admin-status-chip muted"}>
                              {product.visibleInMiniProgram ? "展示" : "不展示"}
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
                </>
              )}

              {serviceConfigTab === "养护套餐" && (
                <div>
                  <div className="empty-card" style={{ marginBottom: 14 }}>
                    <p>养护套餐适合后续客户小程序自助下单</p>
                    <span>租赁植物和售卖植物更适合提交意向、工作人员确认、商户端代下单后进入客户小程序待付款。</span>
                  </div>

                  <div className="admin-table product-admin-table maintenance-package-admin-table">
                    <div className="admin-table-row admin-table-head">
                      <span>套餐</span>
                      <span>展示价格</span>
                      <span>价格设置</span>
                      <span>计价单位</span>
                      <span>推荐</span>
                      <span>小程序展示</span>
                      <span>更多设置</span>
                    </div>

                    {safeMerchantMaintenancePackages.map((item) => (
                      <div className="admin-table-row" key={item.name}>
                        <span>
                          <strong>{item.displayName || item.name}</strong>
                          <em>{item.shortDescription || item.scene || item.displayDescription}</em>
                          {item.name === "标准养护" && <b className="admin-status-chip">租赁默认包含</b>}
                        </span>
                        <span>
                          <strong>{item.priceDisplay || formatMaintenancePrice(item)}</strong>
                          <em>{item.position || item.scene}</em>
                        </span>
                        <span>
                          <select
                            className="area-input"
                            value={item.priceType || "range"}
                            onChange={(e) => updateMaintenancePackagePriceType(item.name, e.target.value)}
                          >
                            <option value="fixed">固定价</option>
                            <option value="range">区间价</option>
                            <option value="project">按项目报价</option>
                          </select>
                          {item.priceType === "fixed" && (
                            <input
                              className="area-input"
                              type="number"
                              value={item.fixedPrice || ""}
                              onChange={(e) => updateMaintenancePackageField(item.name, "fixedPrice", e.target.value)}
                              placeholder="价格，例如：8"
                              style={{ marginTop: 8 }}
                            />
                          )}
                          {item.priceType === "range" && (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                              <input
                                className="area-input"
                                type="number"
                                value={item.priceMin || ""}
                                onChange={(e) => updateMaintenancePackageField(item.name, "priceMin", e.target.value)}
                                placeholder="最低价"
                              />
                              <input
                                className="area-input"
                                type="number"
                                value={item.priceMax || ""}
                                onChange={(e) => updateMaintenancePackageField(item.name, "priceMax", e.target.value)}
                                placeholder="最高价"
                              />
                            </div>
                          )}
                          {item.priceType === "project" && (
                            <input
                              className="area-input"
                              value={item.projectPriceNote || ""}
                              onChange={(e) => updateMaintenancePackageField(item.name, "projectPriceNote", e.target.value)}
                              placeholder="例如：按项目报价"
                              style={{ marginTop: 8 }}
                            />
                          )}
                        </span>
                        <span>
                          {item.priceType === "project" ? (
                            <strong>按项目报价</strong>
                          ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                              <select className="area-input" value={item.priceObject || "盆"} onChange={(e) => updateMaintenancePackageField(item.name, "priceObject", e.target.value)}>
                                <option value="盆">盆</option>
                                <option value="㎡">㎡</option>
                                <option value="项">项</option>
                              </select>
                              <select className="area-input" value={item.priceCycle || "次"} onChange={(e) => updateMaintenancePackageField(item.name, "priceCycle", e.target.value)}>
                                <option value="次">次</option>
                                <option value="月">月</option>
                                <option value="年">年</option>
                              </select>
                            </div>
                          )}
                        </span>
                        <span>
                          <label className="staff-toggle-row" style={{ justifyContent: "flex-start" }}>
                            <input
                              type="checkbox"
                              checked={Boolean(item.recommended)}
                              onChange={(e) => updateMaintenancePackageField(item.name, "recommended", e.target.checked)}
                            />
                            <span>{item.name === "标准养护" ? "推荐 / 租赁默认包含" : "推荐"}</span>
                          </label>
                        </span>
                        <span>
                          <label className="staff-toggle-row" style={{ justifyContent: "flex-start" }}>
                            <input
                              type="checkbox"
                              checked={Boolean(item.visibleInMiniProgram)}
                              onChange={(e) => updateMaintenancePackageField(item.name, "visibleInMiniProgram", e.target.checked)}
                            />
                            <span>{item.visibleInMiniProgram ? "展示" : "不展示"}</span>
                          </label>
                        </span>
                        <span>
                          <details>
                            <summary className="ghost-button" style={{ display: "inline-flex", cursor: "pointer" }}>更多设置</summary>
                            <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                              <input
                                className="area-input"
                                value={item.displayDescription || item.shortDescription || ""}
                                onChange={(e) => updateMaintenancePackageField(item.name, "displayDescription", e.target.value)}
                                placeholder="小程序展示说明"
                              />
                              <input
                                className="area-input"
                                value={item.areaPriceText || ""}
                                onChange={(e) => updateMaintenancePackageField(item.name, "areaPriceText", e.target.value)}
                                placeholder="面积参考价，例如：¥9-12 / ㎡ / 年"
                              />
                              <input
                                className="area-input"
                                value={item.sortOrder || ""}
                                onChange={(e) => updateMaintenancePackageField(item.name, "sortOrder", Number(e.target.value || 0))}
                                placeholder="展示排序"
                                type="number"
                              />
                            </div>
                          </details>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {merchantTab === "小程序装修" && (
            <div className="admin-card admin-data-panel mini-program-decor-panel mini-program-workbench">
              <div className="mini-program-workbench-head">
                <div>
                  <p className="eyebrow">Mini Program Decoration</p>
                  <h2>小程序装修工作台</h2>
                  <span>当前小程序：青庭花涧 · 最后保存：2025-05-23 23:46</span>
                </div>
                <div className="mini-program-decor-actions">
                  <button className="ghost-button" onClick={saveMiniProgramHomeConfig}>
                    <GardenIcons.Check size={16} />
                    <span>预览效果</span>
                  </button>
                  <button className="ghost-button" onClick={() => setMiniProgramHomeConfig(normalizeMiniProgramHomeConfig(defaultMiniProgramHomeConfig))}>
                    <GardenIcons.Refresh size={16} />
                    <span>恢复默认</span>
                  </button>
                  <button className="primary-button" onClick={saveMiniProgramHomeConfig}>
                    <GardenIcons.Cloud size={16} />
                    <span>保存装修</span>
                  </button>
                </div>
              </div>

              <div className="mini-program-decor-layout">
                <section className="mini-decor-preview-column">
                  <div className={`mini-phone-shell ${miniDecorTab === "摆放灵感" ? "inspiration-mode" : ""}`}>
                    <div className="mini-phone-device">
                      <div className="mini-phone-top">
                        <span>23:46</span>
                        <i />
                        <b>青庭花涧</b>
                        <em>••• ◎</em>
                      </div>

                      {miniDecorTab === "摆放灵感" ? (
                        <div className="mini-phone-inspiration-screen">
                          <section className="mini-inspiration-hero">
                            {homeHeroImageSrc ? <img src={homeHeroImageSrc} alt="摆放灵感顶部图" /> : <span>发现植物之美</span>}
                            <div>
                              <strong>发现植物之美</strong>
                              <em>为每个空间找到合适的绿意</em>
                            </div>
                          </section>
                          <div className="mini-inspiration-filter">
                            {INSPIRATION_CATEGORIES.slice(0, 5).map((category) => (
                              <span key={category} className={category === "全部" ? "active" : ""}>{category}</span>
                            ))}
                          </div>
                          <div className="mini-inspiration-card-grid">
                            {sortedInspirationItems.filter((item) => item.status === "已上架").slice(0, 4).map((item) => {
                              const imageSrc = getInspirationImageSrc(item);
                              const linkedProduct = inspirationProductOptions.find((product) => product.id === item.linkedProductId);
                              return (
                                <article key={item.id}>
                                  <div>
                                    {imageSrc ? <img src={imageSrc} alt={item.title} /> : <span>{linkedProduct?.image || "植"}</span>}
                                  </div>
                                  <strong>{item.title}</strong>
                                  <em>{item.tags.slice(0, 2).join(" · ") || item.category}</em>
                                </article>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="mini-phone-home-screen">
                          {homeHeroConfig.visible ? (
                            <section className={`mini-phone-hero ${homeHeroImageSrc ? "has-image" : "is-empty"}`}>
                              {homeHeroImageSrc ? <img src={homeHeroImageSrc} alt="首页主图预览" /> : <span>上传首页主图</span>}
                              {(homeHeroConfig.title || homeHeroConfig.subtitle) && (
                                <div>
                                  {homeHeroConfig.title && <strong>{homeHeroConfig.title}</strong>}
                                  {homeHeroConfig.subtitle && <em>{homeHeroConfig.subtitle}</em>}
                                </div>
                              )}
                            </section>
                          ) : (
                            <section className="mini-phone-hero is-empty"><span>首页主图已隐藏</span></section>
                          )}

                          <div className="mini-phone-entry-grid">
                            {MINI_PROGRAM_HOME_ENTRIES.map((entry) => (
                              <article key={entry}>
                                <GardenIcons.Plant size={28} />
                                <strong>{entry}</strong>
                              </article>
                            ))}
                          </div>

                          <div className="mini-phone-ad-window">
                            {activeHomeBanner ? (
                              <article className={`mini-phone-ad-card ${activeHomeBanner.layoutType}`}>
                                {activeHomeBanner.images.map((image, imageIndex) => {
                                  const imageSrc = getHomeBannerImageSrc(image);
                                  return (
                                    <div key={`${activeHomeBanner.id}-preview-${imageIndex}`}>
                                      {imageSrc ? <img src={imageSrc} alt={`${activeHomeBanner.title} ${imageIndex + 1}`} /> : <span>{image.placeholder || "广告图"}</span>}
                                    </div>
                                  );
                                })}
                              </article>
                            ) : (
                              <article className="mini-phone-ad-card empty"><span>暂无广告位</span></article>
                            )}
                            <div className="mini-phone-dots">
                              {(visibleHomeBannerItems.length ? visibleHomeBannerItems : [activeHomeBanner]).filter(Boolean).map((item, index) => (
                                <i key={item.id} className={index === activeHomeBannerIndex ? "active" : ""} />
                              ))}
                            </div>
                          </div>

                          <div className="mini-phone-section-title">
                            <i>⌄</i>
                            <strong>空间与园林服务</strong>
                            <span>Garden Projects</span>
                          </div>
                        </div>
                      )}

                      <nav className="mini-phone-tabbar">
                        {["首页", "案例", "服务", "订单", "我的"].map((item) => (
                          <span key={item} className={item === "首页" ? "active" : ""}>
                            <GardenIcons.Plant size={17} />
                            <b>{item}</b>
                          </span>
                        ))}
                      </nav>
                    </div>
                  </div>

                  <div className="mini-reference-card">
                    <img src={miniProgramHomeReference} alt="小程序首页参考效果" />
                    <div>
                      <strong>参考效果</strong>
                      <span>按这张手机首页的比例和留白校准预览。</span>
                    </div>
                  </div>
                </section>

                <section className="mini-decor-editor">
                  <nav className="mini-decor-tabs">
                    {MINI_PROGRAM_DECOR_TABS.map((tab) => (
                      <button
                        key={tab}
                        className={miniDecorTab === tab ? "active" : ""}
                        onClick={() => setMiniDecorTab(tab)}
                      >
                        {tab}
                      </button>
                    ))}
                  </nav>

                  {miniDecorTab === "首页主图" && (
                    <div className="mini-decor-editor-body">
                      <div className="mini-editor-section-head">
                        <div>
                          <h3>首页顶部主图</h3>
                          <p>建议尺寸 1242 × 600px，预览会按手机顶部主图比例裁剪显示。</p>
                        </div>
                        <label className="staff-toggle-row">
                          <input
                            type="checkbox"
                            checked={Boolean(homeHeroConfig.visible)}
                            onChange={(event) => updateHomeHeroConfig({ visible: event.target.checked })}
                          />
                          <span>{homeHeroConfig.visible ? "展示" : "隐藏"}</span>
                        </label>
                      </div>

                      <div className="mini-hero-admin-grid">
                        <div className="mini-hero-upload-card">
                          <ImageUploader
                            value={homeHeroImageSrc}
                            label="上传 / 替换首页主图"
                            helper="支持 JPG / PNG，上传后按小程序首页顶部区域裁剪预览。"
                            onChange={updateHomeHeroImage}
                          />
                        </div>
                        <div className="mini-home-form-grid">
                          <div className="sheet-block">
                            <p className="sheet-label">主标题（可选）</p>
                            <input
                              className="area-input"
                              value={homeHeroConfig.title}
                              maxLength={10}
                              onChange={(event) => updateHomeHeroConfig({ title: event.target.value })}
                              placeholder="请输入主标题"
                            />
                            <em className="field-helper">{String(homeHeroConfig.title || "").length}/10</em>
                          </div>
                          <div className="sheet-block">
                            <p className="sheet-label">副标题（可选）</p>
                            <input
                              className="area-input"
                              value={homeHeroConfig.subtitle}
                              maxLength={20}
                              onChange={(event) => updateHomeHeroConfig({ subtitle: event.target.value })}
                              placeholder="请输入副标题"
                            />
                            <em className="field-helper">{String(homeHeroConfig.subtitle || "").length}/20</em>
                          </div>
                          <div className="empty-card mini-locked-note">
                            <p>固定入口不可编辑</p>
                            <span>养护服务、租赁方案、花植选购三个入口保持固定，仅随主图位置一起预览。</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {miniDecorTab === "首页广告位" && (
                    <div className="mini-decor-editor-body">
                      <div className="mini-editor-section-head">
                        <div>
                          <h3>广告位管理 <span>最多 5 组</span></h3>
                          <p>广告位可左右横滑。单图和三图拼接最终都展示为横向长方形卡片。</p>
                        </div>
                        <button className="primary-button" onClick={addHomeBannerItem} disabled={homeBannerItems.length >= 5}>
                          <GardenIcons.Create size={16} />
                          <span>新增广告位</span>
                        </button>
                      </div>

                      <div className="mini-banner-slot-list">
                        {Array.from({ length: 5 }, (_, index) => sortedHomeBannerItems[index] || null).map((item, index) => (
                          <button
                            key={item?.id || `empty-banner-${index}`}
                            className={`mini-banner-slot-row ${activeBannerEditorItem?.id === item?.id ? "active" : ""} ${!item ? "empty" : ""}`}
                            onClick={() => {
                              if (item) setActiveHomeBannerIndex(index);
                              else addHomeBannerItem();
                            }}
                          >
                            <span>广告位 {index + 1}</span>
                            <strong>{item?.title || "未启用"}</strong>
                            <em>{item ? `${item.visible ? "已启用" : "已隐藏"} · ${HOME_BANNER_LAYOUT_TYPES.find(([value]) => value === item.layoutType)?.[1]}` : "点击新增"}</em>
                          </button>
                        ))}
                      </div>

                      {activeBannerEditorItem && (
                        <article className="mini-banner-active-editor">
                          <div className="mini-home-form-grid">
                            <div className="sheet-block">
                              <p className="sheet-label">广告位名称</p>
                              <input
                                className="area-input"
                                value={activeBannerEditorItem.title}
                                onChange={(event) => updateHomeBannerItem(activeBannerEditorItem.id, { title: event.target.value })}
                                placeholder="例如：节假日精选"
                              />
                            </div>
                            <div className="sheet-block">
                              <p className="sheet-label">展示排序</p>
                              <input
                                className="area-input"
                                type="number"
                                value={activeBannerEditorItem.sortOrder}
                                onChange={(event) => updateHomeBannerItem(activeBannerEditorItem.id, { sortOrder: event.target.value })}
                                placeholder="数字越小越靠前"
                              />
                            </div>
                          </div>

                          <div className="mini-radio-row">
                            <p>展示样式</p>
                            {HOME_BANNER_LAYOUT_TYPES.map(([value, label]) => (
                              <button
                                key={value}
                                className={activeBannerEditorItem.layoutType === value ? "selected" : ""}
                                onClick={() => updateHomeBannerItem(activeBannerEditorItem.id, { layoutType: value })}
                              >
                                {label}
                              </button>
                            ))}
                            <label className="staff-toggle-row">
                              <input
                                type="checkbox"
                                checked={Boolean(activeBannerEditorItem.visible)}
                                onChange={(event) => updateHomeBannerItem(activeBannerEditorItem.id, { visible: event.target.checked })}
                              />
                              <span>{activeBannerEditorItem.visible ? "启用" : "隐藏"}</span>
                            </label>
                          </div>

                          <div className={`mini-banner-upload-grid ${activeBannerEditorItem.layoutType}`}>
                            {activeBannerEditorItem.images.map((image, imageIndex) => (
                              <div className="sheet-block" key={`${activeBannerEditorItem.id}-image-${imageIndex}`}>
                                <p className="sheet-label">{activeBannerEditorItem.layoutType === "triple" ? `竖图 ${imageIndex + 1}` : "横幅图片"}</p>
                                <ImageUploader
                                  value={getHomeBannerImageSrc(image)}
                                  label="点击上传图片"
                                  helper={activeBannerEditorItem.layoutType === "triple" ? "建议 1080 × 360px 纵向裁切预览。" : "建议 1080 × 360px 横向图。"}
                                  onChange={(nextImage) => updateHomeBannerImage(activeBannerEditorItem.id, imageIndex, nextImage)}
                                />
                              </div>
                            ))}
                          </div>

                          <div className="mini-link-settings">
                            <div className="mini-radio-row">
                              <p>是否跳转</p>
                              {HOME_BANNER_LINK_TYPES.map(([value, label]) => (
                                <button
                                  key={value}
                                  className={activeBannerEditorItem.linkType === value ? "selected" : ""}
                                  onClick={() => updateHomeBannerItem(activeBannerEditorItem.id, { linkType: value, linkTarget: value === "none" ? "" : activeBannerEditorItem.linkTarget })}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>

                            {activeBannerEditorItem.linkType === "internal" && (
                              <div className="sheet-block">
                                <p className="sheet-label">内部跳转目标</p>
                                <select
                                  className="area-input"
                                  value={activeBannerEditorItem.linkTarget || "inspiration_list"}
                                  onChange={(event) => updateHomeBannerItem(activeBannerEditorItem.id, { linkTarget: event.target.value })}
                                >
                                  {HOME_BANNER_INTERNAL_TARGETS.map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {activeBannerEditorItem.linkType === "external" && (
                              <div className="sheet-block">
                                <p className="sheet-label">外部链接地址</p>
                                <input
                                  className="area-input"
                                  value={activeBannerEditorItem.linkTarget}
                                  onChange={(event) => updateHomeBannerItem(activeBannerEditorItem.id, { linkTarget: event.target.value })}
                                  placeholder="https://..."
                                />
                              </div>
                            )}
                          </div>

                          <div className="mini-home-banner-editor-foot">
                            <span>三图拼接会在一个横向广告卡片内显示 3 张竖图，中间保留间隙。</span>
                            <button className="ghost-button danger" onClick={() => removeHomeBannerItem(activeBannerEditorItem.id)}>
                              删除广告位
                            </button>
                          </div>
                        </article>
                      )}
                    </div>
                  )}

                  {miniDecorTab === "摆放灵感" && (
                    <div className="mini-decor-editor-body inspiration-admin-layout">
                      <section className="inspiration-list-panel">
                        <div className="mini-editor-section-head">
                          <div>
                            <h3>摆放灵感列表</h3>
                            <p>管理小程序中展示的摆放灵感内容，支持编辑、上下架、排序等操作。</p>
                          </div>
                          <button className="primary-button" onClick={addInspirationItem}>
                            <GardenIcons.Create size={16} />
                            <span>新增灵感项</span>
                          </button>
                        </div>

                        <div className="inspiration-filter-row">
                          <select className="area-input" defaultValue="全部分类">
                            <option>全部分类</option>
                            {INSPIRATION_CATEGORIES.filter((category) => category !== "全部").map((category) => (
                              <option key={category}>{category}</option>
                            ))}
                          </select>
                          <select className="area-input" defaultValue="全部状态">
                            <option>全部状态</option>
                            {INSPIRATION_STATUS_OPTIONS.map((status) => (
                              <option key={status}>{status}</option>
                            ))}
                          </select>
                          <div className="admin-filter-field"><GardenIcons.Search size={16} /><input placeholder="请输入灵感标题" /></div>
                        </div>

                        <div className="inspiration-table">
                          {sortedInspirationItems.map((item, index) => {
                            const imageSrc = getInspirationImageSrc(item);
                            const linkedProduct = inspirationProductOptions.find((product) => product.id === item.linkedProductId);
                            return (
                              <button
                                key={item.id}
                                className={selectedInspirationItem?.id === item.id ? "active" : ""}
                                onClick={() => setSelectedInspirationId(item.id)}
                              >
                                <span>{index + 1}</span>
                                <i>{imageSrc ? <img src={imageSrc} alt={item.title} /> : linkedProduct?.image || "植"}</i>
                                <strong>{item.title}<em>{item.description}</em></strong>
                                <b>{item.category}</b>
                                <small>{item.tags.slice(0, 3).join(" / ")}</small>
                                <em>{item.status}</em>
                              </button>
                            );
                          })}
                        </div>
                      </section>

                      {selectedInspirationItem && (
                        <aside className="inspiration-editor-panel">
                          <h3>灵感项编辑</h3>
                          <div className="sheet-block">
                            <p className="sheet-label">标题</p>
                            <input
                              className="area-input"
                              value={selectedInspirationItem.title}
                              maxLength={30}
                              onChange={(event) => updateInspirationItem(selectedInspirationItem.id, { title: event.target.value })}
                            />
                            <em className="field-helper">{selectedInspirationItem.title.length}/30</em>
                          </div>
                          <div className="sheet-block">
                            <p className="sheet-label">简短描述</p>
                            <textarea
                              className="area-input"
                              value={selectedInspirationItem.description}
                              maxLength={100}
                              onChange={(event) => updateInspirationItem(selectedInspirationItem.id, { description: event.target.value })}
                            />
                            <em className="field-helper">{selectedInspirationItem.description.length}/100</em>
                          </div>
                          <div className="sheet-block">
                            <p className="sheet-label">封面图片</p>
                            <ImageUploader
                              value={getInspirationImageSrc(selectedInspirationItem)}
                              label="上传图片"
                              helper="建议 800 × 1000px，适合手机卡片裁切。"
                              onChange={(nextImage) => updateInspirationImage(selectedInspirationItem.id, nextImage)}
                            />
                          </div>
                          <div className="sheet-block">
                            <p className="sheet-label">分类</p>
                            <select
                              className="area-input"
                              value={selectedInspirationItem.category}
                              onChange={(event) => updateInspirationItem(selectedInspirationItem.id, { category: event.target.value })}
                            >
                              {INSPIRATION_CATEGORIES.filter((category) => category !== "全部").map((category) => (
                                <option key={category} value={category}>{category}</option>
                              ))}
                            </select>
                          </div>
                          <div className="sheet-block">
                            <p className="sheet-label">标签</p>
                            <input
                              className="area-input"
                              value={getInspirationTagText(selectedInspirationItem)}
                              onChange={(event) => updateInspirationItem(selectedInspirationItem.id, { tags: event.target.value.split(/[,，、]/).map((tag) => tag.trim()).filter(Boolean) })}
                              placeholder="大叶植物，空气净化，易打理"
                            />
                          </div>
                          <div className="sheet-block">
                            <p className="sheet-label">绑定植物（可选）</p>
                            <select
                              className="area-input"
                              value={selectedInspirationItem.linkedProductId}
                              onChange={(event) => updateInspirationItem(selectedInspirationItem.id, { linkedProductId: event.target.value })}
                            >
                              <option value="">不绑定</option>
                              {inspirationProductOptions.map((product) => (
                                <option key={product.id} value={product.id}>{product.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="inspiration-editor-actions">
                            <button className="ghost-button danger" onClick={() => removeInspirationItem(selectedInspirationItem.id)}>删除</button>
                            <button
                              className="ghost-button"
                              onClick={() => updateInspirationItem(selectedInspirationItem.id, { status: selectedInspirationItem.status === "已上架" ? "已下架" : "已上架" })}
                            >
                              {selectedInspirationItem.status === "已上架" ? "下架" : "上架"}
                            </button>
                            <button className="primary-button" onClick={saveMiniProgramHomeConfig}>保存</button>
                          </div>
                        </aside>
                      )}
                    </div>
                  )}
                </section>
              </div>
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
                      <span>{getExecutionDisplayText(order)} · {getMerchantExecutionProgressText(order)}</span>
                      <span>{order.deliveryStatus || "-"}{order.startedAt ? `｜${order.startedAt}` : ""}{order.arrivedAt ? `｜到达 ${order.arrivedAt}` : ""}</span>
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

          </div>

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
                        <p className="sheet-label">员工类型</p>
                        <select
                          className="area-input"
                          value={getStaffEmployeeType(editingStaffForm)}
                          onChange={(event) => setEditingStaffForm((form) => ({ ...form, employeeType: event.target.value }))}
                        >
                          <option value="internal">公司员工</option>
                          <option value="partner">外部执行方</option>
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
                      <div className="sheet-block"><p className="sheet-label">员工类型</p><select className="area-input" value={getStaffEmployeeType(staffInviteForm)} onChange={(event) => setStaffInviteForm((form) => ({ ...form, employeeType: event.target.value }))}><option value="internal">公司员工</option><option value="partner">外部执行方</option></select></div>
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

          {selectedMiniProgramAppointment && (
            <div className="sheet-mask project-inquiry-mask" onClick={() => setSelectedMiniProgramAppointmentId(null)}>
              <section className="project-inquiry-detail mini-appointment-detail" onClick={(event) => event.stopPropagation()}>
                <header className="project-inquiry-detail-head">
                  <div>
                    <p className="eyebrow">Care Service Booking</p>
                    <h2>{selectedMiniProgramAppointment.packageName || "养护服务预约"}</h2>
                    <span>{selectedMiniProgramAppointment.createdAt || "暂无提交时间"} · 客户小程序立即预约</span>
                  </div>
                  <button className="close-button" onClick={() => setSelectedMiniProgramAppointmentId(null)} aria-label="关闭预约详情">×</button>
                </header>

                <div className="project-inquiry-detail-body">
                  <section className="project-inquiry-section">
                    <h3>客户预约信息</h3>
                    <div className="project-inquiry-detail-grid">
                      <div><span>联系人</span><strong>{selectedMiniProgramAppointment.contactName || "-"}</strong></div>
                      <div><span>手机号</span><strong>{selectedMiniProgramAppointment.phone || "-"}</strong></div>
                      <div><span>服务地址</span><strong>{selectedMiniProgramAppointment.address || "-"}</strong></div>
                      <div><span>养护套餐</span><strong>{selectedMiniProgramAppointment.packageName || "标准养护"}</strong></div>
                      <div><span>预约日期</span><strong>{selectedMiniProgramAppointment.appointmentDate || "-"}</strong></div>
                      <div><span>时间段</span><strong>{selectedMiniProgramAppointment.timeWindow || "-"}</strong></div>
                      <div><span>服务区域</span><strong>{selectedMiniProgramAppointment.serviceArea || "-"}</strong></div>
                      <div><span>面积 / 数量</span><strong>{[selectedMiniProgramAppointment.areaSize, selectedMiniProgramAppointment.plantCount].filter(Boolean).join(" · ") || "-"}</strong></div>
                      <div><span>小程序预估价</span><strong>{selectedMiniProgramAppointment.quotedPrice ? `¥${selectedMiniProgramAppointment.quotedPrice}` : "待商户确认"}</strong></div>
                      <div><span>当前状态</span><strong>{selectedMiniProgramAppointment.status}</strong></div>
                      <div><span>转化订单</span><strong>{selectedMiniProgramAppointment.convertedOrderId || "尚未转订单"}</strong></div>
                    </div>
                  </section>

                  <section className="project-inquiry-section">
                    <h3>客户备注</h3>
                    <div className="project-inquiry-note">{selectedMiniProgramAppointment.customerNote || "客户暂未填写备注。"}</div>
                  </section>

                  <section className="project-inquiry-section">
                    <h3>商户沟通备注</h3>
                    <textarea
                      className="area-input project-inquiry-textarea"
                      value={miniProgramAppointmentNoteDraft}
                      onChange={(event) => setMiniProgramAppointmentNoteDraft(event.target.value)}
                      placeholder="记录与客户沟通后的调整建议，例如改套餐、改时间、补充报价说明等。"
                    />
                  </section>
                </div>

                <footer className="project-inquiry-actions">
                  <button className="ghost-button" onClick={() => updateMiniProgramAppointment(selectedMiniProgramAppointment.id, { status: "已联系" })}>标记已联系</button>
                  <button className="ghost-button" onClick={saveMiniProgramAppointmentNote}>保存沟通备注</button>
                  <button className="ghost-button" onClick={() => updateMiniProgramAppointment(selectedMiniProgramAppointment.id, { status: "暂缓" })}>标记暂缓</button>
                  <button className="ghost-button danger" onClick={() => updateMiniProgramAppointment(selectedMiniProgramAppointment.id, { status: "已取消" })}>标记取消</button>
                  <button
                    className="primary-button"
                    onClick={() => convertMiniProgramAppointmentToOrderDraft(selectedMiniProgramAppointment)}
                    disabled={selectedMiniProgramAppointment.status === "已转订单"}
                  >
                    {selectedMiniProgramAppointment.status === "已转订单" ? "已转正式订单" : "转为订单草稿"}
                  </button>
                </footer>
              </section>
            </div>
          )}

          {selectedProjectInquiry && (
            <div className="sheet-mask project-inquiry-mask" onClick={() => setSelectedProjectInquiryId(null)}>
              <section className="project-inquiry-detail" onClick={(event) => event.stopPropagation()}>
                <header className="project-inquiry-detail-head">
                  <div>
                    <p className="eyebrow">Garden Project Inquiry</p>
                    <h2>{selectedProjectInquiry.projectType || "园林改造咨询"}</h2>
                    <span>{selectedProjectInquiry.createdAt || "暂无提交时间"} · {selectedProjectInquiry.source === "mini_program" ? "客户小程序线索" : "本地线索"}</span>
                  </div>
                  <button className="close-button" onClick={() => setSelectedProjectInquiryId(null)} aria-label="关闭线索详情">×</button>
                </header>

                <div className="project-inquiry-detail-body">
                  <section className="project-inquiry-section">
                    <h3>客户与项目</h3>
                    <div className="project-inquiry-detail-grid">
                      <div><span>联系人</span><strong>{selectedProjectInquiry.contactName || "-"}</strong></div>
                      <div><span>手机号</span><strong>{selectedProjectInquiry.phone || "-"}</strong></div>
                      <div><span>项目地址</span><strong>{selectedProjectInquiry.address || "-"}</strong></div>
                      <div><span>项目类型</span><strong>{selectedProjectInquiry.projectType || "园林改造"}</strong></div>
                      <div><span>面积范围</span><strong>{selectedProjectInquiry.areaSize || "-"}</strong></div>
                      <div><span>预算范围</span><strong>{selectedProjectInquiry.budgetRange || "-"}</strong></div>
                      <div><span>期望风格</span><strong>{selectedProjectInquiry.stylePreference || "-"}</strong></div>
                      <div><span>期望完成时间</span><strong>{selectedProjectInquiry.expectedTime || "-"}</strong></div>
                      <div><span>当前状态</span><strong>{selectedProjectInquiry.status}</strong></div>
                      <div><span>转化订单</span><strong>{selectedProjectInquiry.convertedOrderId || "尚未转订单"}</strong></div>
                    </div>
                  </section>

                  <section className="project-inquiry-section">
                    <h3>现状照片</h3>
                    <div className="project-inquiry-photo-list">
                      {safePhotos(selectedProjectInquiry.photos).length > 0 ? (
                        safePhotos(selectedProjectInquiry.photos).map((photo, index) => (
                          <div className="project-inquiry-photo" key={`${photo}-${index}`}>
                            {isImageUrl(photo) ? <img src={photo} alt={`现状照片 ${index + 1}`} /> : <span>{photo}</span>}
                          </div>
                        ))
                      ) : (
                        <div className="project-inquiry-photo muted"><span>待小程序上传</span></div>
                      )}
                    </div>
                  </section>

                  <section className="project-inquiry-section">
                    <h3>客户备注</h3>
                    <div className="project-inquiry-note">{selectedProjectInquiry.note || "客户暂未填写备注。"}</div>
                  </section>

                  <section className="project-inquiry-section">
                    <h3>跟进备注</h3>
                    <textarea
                      className="area-input project-inquiry-textarea"
                      value={projectInquiryFollowUpDraft}
                      onChange={(event) => setProjectInquiryFollowUpDraft(event.target.value)}
                      placeholder="记录已沟通内容、现场勘察安排、报价意向等。"
                    />
                  </section>
                </div>

                <footer className="project-inquiry-actions">
                  <button className="ghost-button" onClick={() => updateProjectInquiry(selectedProjectInquiry.id, { status: "已联系" })}>标记已联系</button>
                  <button className="ghost-button" onClick={saveProjectInquiryFollowUp}>保存跟进备注</button>
                  <button className="ghost-button" onClick={() => updateProjectInquiry(selectedProjectInquiry.id, { status: "暂缓" })}>标记暂缓</button>
                  <button className="ghost-button danger" onClick={() => updateProjectInquiry(selectedProjectInquiry.id, { status: "无效" })}>标记无效</button>
                  <button
                    className="primary-button"
                    onClick={() => convertProjectInquiryToOrderDraft(selectedProjectInquiry)}
                    disabled={selectedProjectInquiry.status === "已转订单"}
                  >
                    {selectedProjectInquiry.status === "已转订单" ? "已转正式订单" : "转为正式订单"}
                  </button>
                </footer>
              </section>
            </div>
          )}

          <datalist id="staff-area-options">
            {STAFF_AREA_OPTIONS.map((area) => <option key={area} value={area} />)}
          </datalist>

          {showCreateProductSheet && renderCreateProductSheet()}
          {showCreateCustomerSheet && renderCreateCustomerSheet()}
          {showProductCategorySheet && renderProductCategorySheet()}
          {showSaleDeliverySettingsSheet && renderSaleDeliverySettingsSheet()}
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

  function renderProductCategorySheet() {
    const overlayStyle = {
      position: "fixed",
      inset: 0,
      background: "rgba(15, 39, 26, 0.36)",
      zIndex: 82,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    };
    const panelStyle = {
      width: "min(900px, calc(100vw - 48px))",
      maxHeight: "88vh",
      overflow: "hidden",
      background: "rgba(255,255,255,0.98)",
      borderRadius: 28,
      boxShadow: "0 28px 80px rgba(20, 54, 34, 0.22)",
      display: "flex",
      flexDirection: "column",
    };
    const visibleCategories = safeMerchantProductCategories.filter((category) =>
      serviceConfigTab === "租赁植物"
        ? category.businessType === "rental"
        : ["sale", "care"].includes(category.businessType)
    );

    return (
      <div style={overlayStyle} onClick={() => { setShowProductCategorySheet(false); resetCategoryForm(); }}>
        <section style={panelStyle} onClick={(event) => event.stopPropagation()}>
          <div className="section-title-row" style={{ padding: "24px 24px 14px" }}>
            <div><p className="eyebrow">Category</p><h2>分类管理</h2></div>
            <button className="close-button" onClick={() => { setShowProductCategorySheet(false); resetCategoryForm(); }}>×</button>
          </div>

          <div className="merchant-create-order-scroll" style={{ overflowY: "auto", padding: "0 18px 18px 24px", marginRight: 6 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 16 }}>
              <section className="plan-summary-card" style={{ margin: 0 }}>
                <div className="section-title-row"><div><p className="eyebrow">Edit</p><h2>{editingCategoryId ? "编辑分类" : "新增分类"}</h2></div></div>
                <div className="sheet-block">
                  <p className="sheet-label">中文名称</p>
                  <input className="area-input" value={categoryForm.nameZh} onChange={(e) => setCategoryForm((form) => ({ ...form, nameZh: e.target.value }))} placeholder="例如：大型绿植" />
                </div>
                <div className="sheet-block">
                  <p className="sheet-label">英文名称</p>
                  <input className="area-input" value={categoryForm.nameEn} onChange={(e) => setCategoryForm((form) => ({ ...form, nameEn: e.target.value }))} placeholder="例如：Large Plants" />
                </div>
                <label className="staff-toggle-row">
                  <input type="checkbox" checked={Boolean(categoryForm.showEnglish)} onChange={(e) => setCategoryForm((form) => ({ ...form, showEnglish: e.target.checked }))} />
                  <span>展示英文名称</span>
                </label>
                <label className="staff-toggle-row">
                  <input type="checkbox" checked={Boolean(categoryForm.visibleInMiniProgram)} onChange={(e) => setCategoryForm((form) => ({ ...form, visibleInMiniProgram: e.target.checked }))} />
                  <span>显示在客户小程序</span>
                </label>
                <div className="sheet-block">
                  <p className="sheet-label">排序</p>
                  <input className="area-input" type="number" value={categoryForm.sortOrder} onChange={(e) => setCategoryForm((form) => ({ ...form, sortOrder: e.target.value }))} placeholder="例如：10" />
                </div>
                <div className="sheet-block">
                  <p className="sheet-label">适用业务类型</p>
                  <select className="area-input" value={categoryForm.businessType} onChange={(e) => setCategoryForm((form) => ({ ...form, businessType: e.target.value }))}>
                    <option value="rental">租赁植物</option>
                    <option value="sale">售卖植物</option>
                    <option value="care">养护用品</option>
                  </select>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
                  <button className="ghost-button" onClick={resetCategoryForm}>清空</button>
                  <button className="primary-button" onClick={saveProductCategory}>{editingCategoryId ? "保存分类" : "新增分类"}</button>
                </div>
              </section>

              <section className="plan-summary-card" style={{ margin: 0 }}>
                <div className="section-title-row"><div><p className="eyebrow">List</p><h2>当前分类</h2></div></div>
                <div className="category-list">
                  {visibleCategories.map((category) => (
                    <button key={category.id} className={`category-list-item ${editingCategoryId === category.id ? "selected" : ""}`} onClick={() => openEditCategory(category)}>
                      <span>
                        <strong>{getCategoryDisplayName(category)}</strong>
                        <em>{category.businessType === "rental" ? "租赁植物" : category.businessType === "care" ? "养护用品" : "售卖植物"} · 排序 {category.sortOrder || 0}</em>
                      </span>
                      <b className={category.visibleInMiniProgram ? "admin-status-chip" : "admin-status-chip muted"}>{category.visibleInMiniProgram ? "小程序显示" : "不显示"}</b>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>
    );
  }

  function renderSaleDeliverySettingsSheet() {
    const overlayStyle = {
      position: "fixed",
      inset: 0,
      background: "rgba(15, 39, 26, 0.36)",
      zIndex: 82,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    };
    const panelStyle = {
      width: "min(620px, calc(100vw - 48px))",
      background: "rgba(255,255,255,0.98)",
      borderRadius: 28,
      padding: 24,
      boxShadow: "0 28px 80px rgba(20, 54, 34, 0.22)",
    };
    const currentLeadDays = safeMerchantServiceSettings.saleDeliveryLeadDays || 1;

    return (
      <div style={overlayStyle} onClick={() => setShowSaleDeliverySettingsSheet(false)}>
        <section className="merchant-create-order-dialog sale-delivery-settings-dialog" style={panelStyle} onClick={(event) => event.stopPropagation()}>
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Sale Delivery</p>
              <h2>默认配送时间</h2>
            </div>
            <button className="close-button" onClick={() => setShowSaleDeliverySettingsSheet(false)}>×</button>
          </div>

          <div className="empty-card sale-delivery-note">
            <p>用于客户小程序售卖下单</p>
            <span>选择 T+1 时，客户下单后默认只能选择第二天送达；T+2 则默认第三天送达，以此类推。</span>
          </div>

          <div className="sale-delivery-option-grid">
            {SALE_DELIVERY_LEAD_DAY_OPTIONS.map((day) => (
              <button
                key={day}
                className={currentLeadDays === day ? "selected" : ""}
                onClick={() => {
                  updateServiceSettings(
                    { ...safeMerchantServiceSettings, saleDeliveryLeadDays: day },
                    `售卖默认配送时间已设置为 T+${day}`
                  );
                  setShowSaleDeliverySettingsSheet(false);
                }}
              >
                <strong>T+{day}</strong>
                <span>{day === 1 ? "次日送达" : `${day + 1} 天后送达`}</span>
              </button>
            ))}
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
    const gridStyle = {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 16,
    };

    const preview = getProductImage(newProductForm);
    const editingProductType = serviceConfigTab === "售卖植物" ? "sale" : "rental";
    const isSaleProduct = editingProductType === "sale";
    const productTitle = isSaleProduct ? "售卖植物" : "租赁植物";
    const previewPrice = isSaleProduct
      ? (newProductForm.salePrice ? `¥${money(newProductForm.salePrice)}` : "-")
      : (newProductForm.monthlyRent ? `¥${money(newProductForm.monthlyRent)} / 月` : "-");
    const productCategoryOptions = safeMerchantProductCategories.filter((category) =>
      isSaleProduct ? ["sale", "care"].includes(category.businessType) : category.businessType === "rental"
    );
    const selectedPlaces = Array.isArray(newProductForm.suitablePlaces) ? newProductForm.suitablePlaces : [];

    return (
      <div style={overlayStyle} onClick={() => setShowCreateProductSheet(false)}>
        <section style={panelStyle} onClick={(event) => event.stopPropagation()}>
          <div className="section-title-row" style={panelHeaderStyle}>
            <div><p className="eyebrow">Product & Service</p><h2>{editingProductId ? `编辑${productTitle}` : `新增${productTitle}`}</h2></div>
            <button className="close-button" onClick={() => { setShowCreateProductSheet(false); resetNewProductForm(); }}>×</button>
          </div>

          <div className="merchant-create-order-scroll product-editor-scroll" style={panelScrollStyle}>
          <div style={gridStyle}>
            <section className="plan-summary-card" style={{ margin: 0 }}>
              <div className="section-title-row"><div><p className="eyebrow">Step 01</p><h2>{isSaleProduct ? "基础信息" : "租赁配置"}</h2></div></div>
              <div className="sheet-block">
                <p className="sheet-label">{isSaleProduct ? "售卖植物名称 / 中文名" : "植物名称"}</p>
                <input className="area-input" value={newProductForm.name} onChange={(e) => setNewProductForm((form) => ({ ...form, name: e.target.value }))} placeholder="例如：天堂鸟 / 发财树 / 绿萝" />
              </div>

              {isSaleProduct ? (
                <>
                  <div className="sheet-block">
                    <p className="sheet-label">英文名</p>
                    <input className="area-input" value={newProductForm.displayNameEn} onChange={(e) => setNewProductForm((form) => ({ ...form, displayNameEn: e.target.value }))} placeholder="例如：Bird of Paradise" />
                  </div>

                  <label className="staff-toggle-row">
                    <input type="checkbox" checked={Boolean(newProductForm.showEnglishName)} onChange={(e) => setNewProductForm((form) => ({ ...form, showEnglishName: e.target.checked }))} />
                    <span>在小程序展示英文名</span>
                  </label>

                  <div className="sheet-block">
                    <p className="sheet-label">分类</p>
                    <select className="area-input" value={newProductForm.categoryId || ""} onChange={(e) => {
                      const category = safeMerchantProductCategories.find((item) => item.id === e.target.value);
                      setNewProductForm((form) => ({ ...form, categoryId: e.target.value, category: category?.nameZh || form.category, categoryName: category?.nameZh || form.categoryName }));
                    }}>
                      <option value="">请选择分类</option>
                      {productCategoryOptions.map((category) => <option key={category.id} value={category.id}>{getCategoryDisplayName(category)}</option>)}
                    </select>
                  </div>

                  <div className="sheet-block">
                    <p className="sheet-label">售卖价</p>
                    <input className="area-input" type="number" value={newProductForm.salePrice} onChange={(e) => setNewProductForm((form) => ({ ...form, salePrice: e.target.value }))} placeholder="例如：188" />
                  </div>

                  <div className="sheet-block">
                    <p className="sheet-label">库存 / 现货状态</p>
                    <div className="merchant-tag-picker">
                      {["现货", "需确认", "暂缺"].map((status) => (
                        <button key={status} className={(newProductForm.stockStatus || newProductForm.stock) === status ? "selected" : ""} onClick={() => setNewProductForm((form) => ({ ...form, stockStatus: status, stock: status }))}>{status}</button>
                      ))}
                    </div>
                  </div>

                  <label className="staff-toggle-row">
                    <input type="checkbox" checked={Boolean(newProductForm.supportDelivery)} onChange={(e) => setNewProductForm((form) => ({ ...form, supportDelivery: e.target.checked }))} />
                    <span>支持配送</span>
                  </label>

                  <label className="staff-toggle-row">
                    <input type="checkbox" checked={Boolean(newProductForm.supportInstall)} onChange={(e) => setNewProductForm((form) => ({ ...form, supportInstall: e.target.checked }))} />
                    <span>支持安装</span>
                  </label>

                  <label className="staff-toggle-row">
                    <input type="checkbox" checked={Boolean(newProductForm.visibleInMiniProgram)} onChange={(e) => setNewProductForm((form) => ({ ...form, visibleInMiniProgram: e.target.checked }))} />
                    <span>上架到客户小程序展示</span>
                  </label>
                </>
              ) : (
                <>
                  <div className="sheet-block">
                    <p className="sheet-label">分类</p>
                    <select className="area-input" value={newProductForm.categoryId || ""} onChange={(e) => {
                      const category = safeMerchantProductCategories.find((item) => item.id === e.target.value);
                      setNewProductForm((form) => ({ ...form, categoryId: e.target.value, category: category?.nameZh || form.category, categoryName: category?.nameZh || form.categoryName }));
                    }}>
                      <option value="">请选择分类</option>
                      {productCategoryOptions.map((category) => <option key={category.id} value={category.id}>{getCategoryDisplayName(category)}</option>)}
                    </select>
                  </div>

                  <div className="sheet-block">
                    <p className="sheet-label">月租价</p>
                    <input className="area-input" type="number" value={newProductForm.monthlyRent} onChange={(e) => setNewProductForm((form) => ({ ...form, monthlyRent: e.target.value }))} placeholder="例如：36" />
                  </div>

                  <div className="sheet-block">
                    <p className="sheet-label">押金</p>
                    <input className="area-input" type="number" value={newProductForm.deposit} onChange={(e) => setNewProductForm((form) => ({ ...form, deposit: e.target.value }))} placeholder="例如：100" />
                  </div>

                  <div className="sheet-block">
                    <p className="sheet-label">适用场景</p>
                    <input className="area-input" value={newProductForm.applicableScenes} onChange={(e) => setNewProductForm((form) => ({ ...form, applicableScenes: e.target.value }))} placeholder="例如：办公室、前台、会议室" />
                  </div>

                  <div className="sheet-block">
                    <p className="sheet-label">光照需求</p>
                    <input className="area-input" value={newProductForm.lightRequirement} onChange={(e) => setNewProductForm((form) => ({ ...form, lightRequirement: e.target.value }))} placeholder="例如：明亮散射光，避免长时间暴晒" />
                  </div>

                  <div className="sheet-block">
                    <p className="sheet-label">养护说明</p>
                    <input className="area-input" value={newProductForm.careNote} onChange={(e) => setNewProductForm((form) => ({ ...form, careNote: e.target.value }))} placeholder="例如：每周检查叶面，避免空调直吹" />
                  </div>

                  <label className="staff-toggle-row">
                    <input type="checkbox" checked={Boolean(newProductForm.visibleInMiniProgram)} onChange={(e) => setNewProductForm((form) => ({ ...form, visibleInMiniProgram: e.target.checked }))} />
                    <span>上架到客户小程序展示</span>
                  </label>
                </>
              )}
            </section>

            <section className="plan-summary-card" style={{ margin: 0 }}>
              <div className="section-title-row"><div><p className="eyebrow">Step 02</p><h2>{isSaleProduct ? "小程序展示内容" : "图片与备注"}</h2></div></div>
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

              {isSaleProduct && (
                <>
                  <div className="sheet-block">
                    <p className="sheet-label">简介</p>
                    <textarea className="area-input maintenance-textarea" value={newProductForm.displayDescription || newProductForm.description} onChange={(e) => setNewProductForm((form) => ({ ...form, displayDescription: e.target.value, description: e.target.value }))} placeholder="例如：叶片油亮，株形挺拔，适合办公室前台与客厅空间。" />
                  </div>

                  <div className="sheet-block">
                    <p className="sheet-label">适合位置</p>
                    <div className="merchant-tag-picker product-place-picker">
                      {PRODUCT_PLACE_TAGS.map((place) => (
                        <button key={place} className={selectedPlaces.includes(place) ? "selected" : ""} onClick={() => toggleSuitablePlace(place)}>{place}</button>
                      ))}
                    </div>
                    <div className="product-inline-add">
                      <input className="area-input" value={newProductForm.customPlaceText || ""} onChange={(e) => setNewProductForm((form) => ({ ...form, customPlaceText: e.target.value }))} placeholder="自定义位置" />
                      <button className="ghost-button" onClick={addCustomSuitablePlace}>添加</button>
                    </div>
                  </div>

                  <div className="sheet-block">
                    <p className="sheet-label">光照需求</p>
                    <textarea className="area-input maintenance-textarea" value={newProductForm.lightRequirement} onChange={(e) => setNewProductForm((form) => ({ ...form, lightRequirement: e.target.value }))} placeholder="例如：明亮散射光，避免长时间暴晒" />
                  </div>

                  <div className="sheet-block">
                    <p className="sheet-label">浇水 / 养护说明</p>
                    <textarea className="area-input maintenance-textarea" value={newProductForm.wateringCare} onChange={(e) => setNewProductForm((form) => ({ ...form, wateringCare: e.target.value }))} placeholder="例如：土表微干后浇水，保持通风，避免积水" />
                  </div>

                  <div className="sheet-block">
                    <p className="sheet-label">养护难度</p>
                    <div className="merchant-tag-picker difficulty-picker">
                      {CARE_DIFFICULTY_OPTIONS.map(([level, description]) => (
                        <button key={level} className={newProductForm.careDifficulty === level ? "selected" : ""} title={description} onClick={() => setNewProductForm((form) => ({ ...form, careDifficulty: level }))}>{level}</button>
                      ))}
                    </div>
                    <em className="field-helper">{CARE_DIFFICULTY_OPTIONS.find(([level]) => level === newProductForm.careDifficulty)?.[1]}</em>
                  </div>
                </>
              )}

              <div className="sheet-block">
                <p className="sheet-label">展示名称</p>
                <input className="area-input" value={newProductForm.displayName || ""} onChange={(e) => setNewProductForm((form) => ({ ...form, displayName: e.target.value }))} placeholder="小程序或客户侧展示名称，可留空" />
              </div>

              {!isSaleProduct && (
                <div className="sheet-block">
                  <p className="sheet-label">展示说明</p>
                  <input className="area-input" value={newProductForm.displayDescription || newProductForm.description} onChange={(e) => setNewProductForm((form) => ({ ...form, displayDescription: e.target.value, description: e.target.value }))} placeholder="适合什么场景、寓意、养护难度" />
                </div>
              )}

              <div className="sheet-block">
                <p className="sheet-label">排序</p>
                <input className="area-input" type="number" value={newProductForm.sortOrder} onChange={(e) => setNewProductForm((form) => ({ ...form, sortOrder: e.target.value }))} placeholder="例如：10" />
              </div>
            </section>
          </div>

          <section className="plan-summary-card" style={{ marginTop: 16 }}>
            {isSaleProduct && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 12 }}>
                <div className="sheet-block">
                  <p className="sheet-label">配送 / 安装备注</p>
                  <input className="area-input" value={newProductForm.deliveryNote} onChange={(e) => setNewProductForm((form) => ({ ...form, deliveryNote: e.target.value }))} placeholder="例如：同城可配送，大型植物需现场确认" />
                </div>
                <div className="sheet-block">
                  <p className="sheet-label">售后备注</p>
                  <input className="area-input" value={newProductForm.afterSaleNote} onChange={(e) => setNewProductForm((form) => ({ ...form, afterSaleNote: e.target.value }))} placeholder="例如：交付后 7 天内提供状态咨询" />
                </div>
              </div>
            )}
            <div className="sheet-block">
              <p className="sheet-label">备注</p>
              <input className="area-input" value={newProductForm.note} onChange={(e) => setNewProductForm((form) => ({ ...form, note: e.target.value }))} placeholder="内部备注，不直接展示给客户" />
            </div>
          </section>

          <section className="plan-summary-card" style={{ marginTop: 16 }}>
            <div className="section-title-row">
              <div><p className="eyebrow">Preview</p><h2>商品预览</h2></div>
            </div>
            <article className="product-card" style={{ maxWidth: 360 }}>
              <div className="product-image" style={{ width: 76, height: 76, flexShrink: 0 }}>
                {isImageUrl(preview) ? <img src={preview} alt={newProductForm.name || "商品预览"} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 16 }} /> : preview}
              </div>
              <div className="product-info">
                <h3>{newProductForm.displayName || newProductForm.name || `新${productTitle}名称`}</h3>
                <p>{newProductForm.categoryName || newProductForm.category}｜{isSaleProduct ? (newProductForm.stockStatus || "库存状态") : (newProductForm.applicableScenes || "适用场景")}</p>
                {isSaleProduct && newProductForm.showEnglishName && newProductForm.displayNameEn && <p>{newProductForm.displayNameEn}</p>}
                <p>{newProductForm.displayDescription || newProductForm.description || "展示说明会显示在这里"}</p>
                {isSaleProduct && <p>{selectedPlaces.join(" / ") || "适合位置"}</p>}
                <strong>{previewPrice}</strong>
              </div>
            </article>
          </section>
          </div>

          <div style={panelFooterStyle}>
            <button
              style={{ minWidth: 128, border: 0, borderRadius: 18, padding: "14px 22px", background: "#eef4fb", color: "#334155", fontWeight: 900, cursor: "pointer" }}
              onClick={() => { setShowCreateProductSheet(false); resetNewProductForm(); }}
            >取消</button>
            <button
              style={{ minWidth: 180, border: 0, borderRadius: 18, padding: "14px 24px", background: "#405a38", color: "#fff", fontWeight: 900, cursor: "pointer", boxShadow: "0 14px 28px rgba(33, 118, 66, 0.22)" }}
              onClick={createMerchantProduct}
            >{editingProductId ? "保存修改" : `保存${productTitle}`}</button>
          </div>
        </section>
      </div>
    );
  }

  function renderCreateOrderSheet() {
    const createOrderTagsText = String(newOrderForm?.tagsText || "");
    const createOrderSelectedTags = createOrderTagsText.split(",").map((item) => item.trim()).filter(Boolean);
    const createOrderSourceOptions = Array.isArray(ORDER_SOURCES) ? ORDER_SOURCES : [];
    const createOrderMaintenancePackages = safeMerchantMaintenancePackages;
    const createOrderAssignableStaff = Array.isArray(assignableStaffMembers) ? assignableStaffMembers : [];
    const isMiniProgramAppointmentDraft = Boolean(newOrderForm.sourceAppointmentId);
    const resolveCreateOrderMaintenancePackage = (name) =>
      createOrderMaintenancePackages.find((item) => item.name === name) ||
      getMaintenancePackage(name || "标准养护");

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
              <div><p className="eyebrow">New Order · v3.8</p><h2>{isMiniProgramAppointmentDraft ? "确认小程序预约并派单" : "创建新订单"}</h2></div>
              <button
                className="close-button"
                onClick={() => {
                  setShowCreateOrderSheet(false);
                  setIsCreateOrderInputFocused(false);
                }}
              >×</button>
            </div>

            <div className="merchant-create-order-scroll" style={panelScrollStyle}>
            {isMiniProgramAppointmentDraft && (
              <div className="empty-card mini-appointment-draft-tip" style={{ marginBottom: 16 }}>
                <p>来自客户小程序的养护预约</p>
                <span>客户已提交套餐、地址和服务时间。商户可先电话沟通，修改下方内容后再创建并派发给员工。</span>
              </div>
            )}
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
                <div className="sheet-block"><p className="sheet-label">方案类型</p><div className="plan-type-grid">{SERVICE_TYPE_OPTIONS.map(([serviceType, label]) => (<button key={serviceType} className={newOrderForm.serviceType === serviceType ? "selected" : ""} onClick={() => setNewOrderForm((form) => ({ ...form, serviceType }))}>{label}</button>))}</div></div>
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
                          {member.name} · {member.staffNo} · {ROLE_LABELS[member.role] || member.role} · {STAFF_EMPLOYEE_TYPE_LABELS[getStaffEmployeeType(member)]}
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
                <div className="sheet-block"><p className="sheet-label">预算 / 预估报价</p><input className="area-input" value={newOrderForm.budget} onChange={(e) => setNewOrderForm((form) => ({ ...form, budget: e.target.value }))} placeholder="例如：2880 或 10-20 万" /></div>
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
                  <div className="sheet-block"><p className="sheet-label">默认养护</p><div className="empty-card"><p>默认包含标准养护</p><span>租赁方案默认包含标准养护，用于保障植物状态与客户现场效果。</span></div></div>
                </div>
              )}
              {newOrderForm.serviceType === "售卖" && (
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
                  <div className="sheet-block"><p className="sheet-label">套餐</p><select className="area-input" value={newOrderForm.maintenancePackage} onChange={(e) => { const pack = resolveCreateOrderMaintenancePackage(e.target.value); setNewOrderForm((form) => ({ ...form, maintenancePackage: pack.name, maintenanceCycle: pack.cycle, maintenanceFrequency: pack.frequency, maintenanceContent: pack.content })); }}>{createOrderMaintenancePackages.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select></div>
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
                {isMiniProgramAppointmentDraft ? "确认并派发订单" : "创建并派发订单"}
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
              {SERVICE_TYPE_OPTIONS.map(([serviceType, label]) => (
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
                    {member.name} · {member.staffNo} · {STAFF_EMPLOYEE_TYPE_LABELS[getStaffEmployeeType(member)]}
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
            <input className={inputClass} {...inputFocusProps} value={newOrderForm.budget} onChange={(e) => setNewOrderForm((form) => ({ ...form, budget: e.target.value }))} placeholder="例如：2880 或 10-20 万" />
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
              <div className="empty-card"><p>默认包含标准养护</p><span>租赁方案默认包含标准养护，可对外展示为赠送标准养护服务。</span></div>
            </div>
          )}

          {newOrderForm.serviceType === "售卖" && (
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
              <select className={inputClass} value={newOrderForm.maintenancePackage} onChange={(e) => { const pack = resolveCreateOrderMaintenancePackage(e.target.value); setNewOrderForm((form) => ({ ...form, maintenancePackage: pack.name, maintenanceCycle: pack.cycle, maintenanceFrequency: pack.frequency, maintenanceContent: pack.content })); }}>
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
        staffEmployeeTypeLabels={STAFF_EMPLOYEE_TYPE_LABELS}
        accountStatusLabels={ACCOUNT_STATUS_LABELS}
        authUserEmail={authUserEmail}
        canOpenMerchant={showRoleSwitch}
        onSignOut={handleSignOut}
        classifyOrderStatus={classifyOrderStatus}
        getOrderExecutionStage={getOrderExecutionStage}
        canViewCustomerPhone={!shouldHideCustomerPhoneForStaff(currentStaff, selectedOrder)}
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
