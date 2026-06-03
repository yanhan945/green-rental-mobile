import { useEffect, useRef } from "react";
import { GardenIcons } from "../../GardenIcons";
import { ImageUploader } from "../common/ImageUploader";
import { StaffHome } from "./StaffHome";

const STAFF_TABS = ["待接单", "做方案", "执行中", "已完成"];

const STAFF_BOTTOM_TABS = [
  { key: "首页", Icon: GardenIcons.StaffHome, label: "首页" },
  { key: "任务", Icon: GardenIcons.StaffTask, label: "任务" },
  { key: "上报", Icon: GardenIcons.StaffReport, label: "上报" },
  { key: "我的", Icon: GardenIcons.StaffMine, label: "我的" },
];

const STAFF_PLAN_TYPES = ["租赁方案", "养护服务", "售卖订单", "临时摆场", "园林改造"];

export function StaffMobile({
  staffAppTab,
  setStaffAppTab,
  switchRole,
  orders,
  staffOrders = orders,
  refreshOrdersFromCloud,
  getPlanStats,
  money,
  activeStaffTab,
  setActiveStaffTab,
  filteredStaffOrders,
  CoreOrderCard,
  setCurrentOrderId,
  setCurrentPage,
  openCompleteUploadForOrder,
  syncState,
  autoSyncState,
  syncMessage,
  uploadLocalOrdersToCloud,
  selectedOrder,
  setSelectedOrder,
  planType,
  setPlanType,
  acceptOrderAndCreatePlan,
  staffAvatar,
  setStaffAvatar,
  onStaffAvatarFile,
  staffAvatarUploading = false,
  staffAvatarStatus = "",
  staffAvatarError = "",
  onStaffAvatarError,
  currentStaff,
  currentOrganization,
  roleLabels = {},
  staffEmployeeTypeLabels = {},
  accountStatusLabels = {},
  authUserEmail = "",
  canOpenMerchant = false,
  onSignOut,
  classifyOrderStatus = (status) => status || "做方案",
  getOrderExecutionStage = () => "现场执行中",
  canViewCustomerPhone = true,
}) {
  const mainRef = useRef(null);
  const safeStaffOrders = Array.isArray(staffOrders) ? staffOrders : [];
  const safeFilteredStaffOrders = Array.isArray(filteredStaffOrders) ? filteredStaffOrders : [];
  const executableOrders = safeStaffOrders.filter((order) => classifyOrderStatus(order.status) === "执行中" && getOrderExecutionStage(order) === "现场执行中");
  const avatarNotice = staffAvatarError || staffAvatarStatus;
  const hasUsefulPrefillText = (value) => {
    const text = String(value || "").trim();
    return Boolean(text && !["暂无内容", "待确认"].includes(text));
  };
  const selectedOrderHasMerchantPrefill = Boolean(
    selectedOrder?.plan?.merchantDraft ||
    selectedOrder?.plan?.merchantDraftNote ||
    hasUsefulPrefillText(selectedOrder?.budget) ||
    hasUsefulPrefillText(selectedOrder?.areaNote) ||
    hasUsefulPrefillText(selectedOrder?.plannedPlantCount) ||
    hasUsefulPrefillText(selectedOrder?.areaSize)
  );

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [staffAppTab]);

  return (
  <div className="staff-app-shell">
    <header className="staff-app-topbar">
      <button
        className="staff-avatar-entry"
        onClick={() => setStaffAppTab("我的")}
        aria-label="进入我的页面"
      >
        {staffAvatar ? <img src={staffAvatar} alt="员工头像" onError={onStaffAvatarError} /> : <span>G</span>}
      </button>

      <div className="staff-topbar-title">
        <strong>GardenOS</strong>
        <span>FIELD CONSOLE</span>
      </div>

      {canOpenMerchant && (
        <button className="staff-mini-button merchant-switch" onClick={() => switchRole("merchant")}>
          <GardenIcons.Dashboard size={16} />
          <span>商户</span>
        </button>
      )}
    </header>

    <main ref={mainRef} className="staff-app-main">
{staffAppTab === "首页" && (
          <StaffHome
            orders={staffOrders}
            refreshOrdersFromCloud={refreshOrdersFromCloud}
            getPlanStats={getPlanStats}
            money={money}
            setStaffAppTab={setStaffAppTab}
            setActiveStaffTab={setActiveStaffTab}
            classifyOrderStatus={classifyOrderStatus}
          />
        )}

      {staffAppTab === "任务" && (
        <>
          <section className="staff-compact-header">
            <div>
              <p className="staff-kicker">任务流转</p>
              <h1>任务列表</h1>
              <span>{autoSyncState}</span>
            </div>
            <button onClick={refreshOrdersFromCloud}>
              <GardenIcons.Refresh size={16} />
              <span>刷新</span>
            </button>
          </section>

          <section className="staff-status-tabs">
            {STAFF_TABS.map((tab) => (
              <button
                key={tab}
                className={activeStaffTab === tab ? "active" : ""}
                onClick={() => setActiveStaffTab(tab)}
              >
                {tab}
              </button>
            ))}
          </section>

          <section className="staff-task-list">
            {safeFilteredStaffOrders.length === 0 ? (
              <div className="staff-empty-card">
                <strong>暂无{activeStaffTab}任务</strong>
                <span>有新任务时会显示在这里，也可以点击刷新查看最新状态。</span>
              </div>
            ) : (
              safeFilteredStaffOrders.map((order) => (
                <CoreOrderCard key={order.id} order={order} mode="staff" />
              ))
            )}
          </section>
        </>
      )}

      {staffAppTab === "上报" && (
        <>
          <section className="staff-compact-header">
            <div>
              <p className="staff-kicker">现场上报</p>
              <h1>现场上报</h1>
              <span>用于完成照片、现场备注、异常反馈</span>
            </div>
          </section>

          <section className="staff-report-card">
            <h2>快捷上报</h2>
            <p>从执行中的订单进入现场照片和完成备注上报。</p>

            {executableOrders.length === 0 ? (
              <div className="staff-empty-mini">暂无执行中订单</div>
            ) : (
              executableOrders
                .slice(0, 3)
                .map((order) => (
                  <button
                    key={order.id}
                    className="staff-report-row"
                    onClick={() => {
                      if (openCompleteUploadForOrder) {
                        openCompleteUploadForOrder(order);
                        return;
                      }
                      setCurrentOrderId(order.id);
                      setCurrentPage("completeUpload");
                    }}
                  >
                    <span>{order.customerName}</span>
                    <strong>去完成上报</strong>
                  </button>
                ))
            )}
          </section>
        </>
      )}

     {staffAppTab === "我的" && (
  <>
    <section className="staff-profile-hero">
      <p className="staff-kicker">个人中心</p>
      <h1>我的</h1>
      <span>个人资料、账号状态与服务设置</span>
    </section>

    <section className="staff-profile-card refined staff-avatar-upload-card staff-avatar-profile-card">
      <ImageUploader
        value={staffAvatar}
        avatar
        label="更换头像"
        avatarActionLabel="更换头像"
        helper=""
        onChange={setStaffAvatar}
        onFileSelect={onStaffAvatarFile}
        loading={staffAvatarUploading}
      />
      <div className="staff-avatar-profile-copy">
        <p className="staff-kicker">头像资料</p>
        <h2>{currentStaff?.name || "园林服务人员"}</h2>
        <p>{authUserEmail || currentStaff?.email || "暂无邮箱"}</p>
        <b className="staff-login-pill">{accountStatusLabels[currentStaff?.status] || "账号正常"}</b>
        {avatarNotice && (
          <span className={`staff-avatar-inline-status ${staffAvatarError ? "error" : ""}`}>
            {avatarNotice}
          </span>
        )}
        <span>用于首页头像和个人资料展示。</span>
      </div>
    </section>

    <section className="staff-visible-info">
      <div>
        <span>姓名</span>
        <strong>{currentStaff?.name || "-"}</strong>
        <em>工号：{currentStaff?.staffNo || "-"}</em>
      </div>

      <div>
        <span>邮箱</span>
        <strong>{authUserEmail || currentStaff?.email || "-"}</strong>
        <em>{currentStaff?.phone || "暂无手机号"}</em>
      </div>

      <div>
        <span>组织 / 区域</span>
        <strong>{currentOrganization?.name || currentStaff?.organizationId || "-"}</strong>
        <em>{currentStaff?.area || "未分配区域"}</em>
      </div>

      <div>
        <span>角色</span>
        <strong>{roleLabels[currentStaff?.role] || currentStaff?.role || "-"}</strong>
        <em>{staffEmployeeTypeLabels[currentStaff?.employeeType || "internal"] || "公司员工"}｜状态：{accountStatusLabels[currentStaff?.status] || currentStaff?.status || "-"}</em>
      </div>

      <div>
        <span>当前任务数</span>
        <strong>{safeStaffOrders.length} 笔</strong>
        <em>仅展示分配给你的订单</em>
      </div>
    </section>

    <section className="staff-setting-accordion staff-setting-cards">
      <details>
        <summary>
          <span>账号状态</span>
          <strong>{accountStatusLabels[currentStaff?.status] || "正常"}</strong>
        </summary>
        <div className="staff-detail-content">
          <p>{authUserEmail || currentStaff?.email || "暂无登录邮箱"}</p>
          <div className="staff-detail-actions">
            <button onClick={onSignOut}>退出登录</button>
          </div>
        </div>
      </details>

      <details>
        <summary>
          <span>接单权限</span>
          <strong>正常</strong>
        </summary>
        <div className="staff-detail-content">
          <p>当前可接收商户分配的订单。</p>
        </div>
      </details>

      <details>
        <summary>
          <span>通知设置</span>
          <strong>即将支持</strong>
        </summary>
        <div className="staff-detail-content">
          <p>即将支持新任务、方案审核和归档提醒。</p>
        </div>
      </details>

      <details>
        <summary>
          <span>数据同步</span>
          <strong>{syncState}</strong>
        </summary>
        <div className="staff-detail-content">
          <p>{autoSyncState}</p>
          <p>{syncMessage}</p>
          <div className="staff-detail-actions">
            <button onClick={refreshOrdersFromCloud}>刷新数据</button>
            <button onClick={uploadLocalOrdersToCloud}>同步当前数据</button>
          </div>
        </div>
      </details>

    </section>
  </>
)}
</main>
   
 <nav className="staff-bottom-tab">
  {STAFF_BOTTOM_TABS.map((item) => {
    const Icon = item.Icon;

    return (
      <button
        key={item.key}
        className={`staff-bottom-item ${staffAppTab === item.key ? "active" : ""}`}
        onClick={() => setStaffAppTab(item.key)}
      >
        <span className="staff-tab-icon">
          <Icon />
        </span>
        <span>{item.label}</span>
      </button>
    );
  })}
</nav>

      {selectedOrder && (
        <div className="sheet-mask staff-confirm-sheet-mask" onClick={() => setSelectedOrder(null)}>
          <section className="bottom-sheet staff-confirm-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />

            <div className="sheet-header">
              <div><p className="eyebrow">确认接单</p><h2>确认接单</h2></div>
              <button className="close-button" onClick={() => setSelectedOrder(null)} aria-label="关闭">
                <GardenIcons.Close size={18} />
              </button>
            </div>

            <div className="staff-confirm-sheet-body">
            <div className="empty-card staff-confirm-prefill-note">
              <p>{selectedOrderHasMerchantPrefill ? "商户已预填方案信息" : "暂无预填方案"}</p>
              <span>{selectedOrderHasMerchantPrefill ? "确认接单后可在方案页按现场情况微调。" : "确认接单后可根据现场情况创建方案。"}</span>
            </div>
            <div className="sheet-block">
              <p className="sheet-label">选择方案类型</p>
              <div className="plan-type-grid">
                {STAFF_PLAN_TYPES.map((type) => (
                  <button key={type} className={planType === type ? "selected" : ""} onClick={() => setPlanType(type)}>{type}</button>
                ))}
              </div>
              <div className="plan-type-note">
                {planType === "租赁方案" && "适用于长期绿植租摆，默认包含标准养护。"}
                {planType === "养护服务" && "适用于客户已有植物或追加上门维护，按养护套餐执行。"}
                {planType === "售卖订单" && "适用于一次性售卖植物 / 花盆 / 资材，按商品清单交付。"}
                {planType === "临时摆场" && "适用于活动、展会、临时形象区等短期现场交付。"}
                {planType === "园林改造" && "适用于园林改造、造景和项目工程咨询转单，当前先进入待勘察 / 待方案。"}
              </div>
            </div>

            <div className="sheet-block">
              <p className="sheet-label">客户信息</p>
              <div className="confirm-row"><span>项目 / 客户</span><strong>{selectedOrder.customerName}</strong></div>
              <div className="confirm-row"><span>方案类型</span><strong>{selectedOrder.plan?.planType || selectedOrder.planType || planType}</strong></div>
              <div className="confirm-row"><span>需求标签</span><strong>{Array.isArray(selectedOrder.tags) ? selectedOrder.tags.join(" / ") : "-"}</strong></div>
              <div className="confirm-row"><span>联系人</span><strong>{selectedOrder.contactName || "-"}</strong></div>
              <div className="confirm-row"><span>电话</span><strong>{canViewCustomerPhone ? (selectedOrder.phone || "-") : "由平台统一联系"}</strong></div>
              <div className="confirm-row"><span>项目面积</span><strong>{selectedOrder.areaSize}</strong></div>
              <div className="confirm-row"><span>植物数量</span><strong>{selectedOrder.plannedPlantCount || "待现场校正"}</strong></div>
              <div className="confirm-row"><span>进场时间</span><strong>{selectedOrder.expectedDate}</strong></div>
              <div className="confirm-row address"><span>客户地址</span><strong>{selectedOrder.address}</strong></div>
              <div className="confirm-row address"><span>客户描述</span><strong>{selectedOrder.description || "-"}</strong></div>
              <div className="confirm-row address"><span>商户备注</span><strong>{selectedOrder.merchantNote || selectedOrder.plan?.merchantDraftNote || "-"}</strong></div>
            </div>
            </div>

            <div className="staff-confirm-sheet-footer">
              <button className="submit-sheet-button" onClick={acceptOrderAndCreatePlan}>
                {selectedOrder.plan ? "确认接单并查看方案草稿" : `确认接单并创建${planType}`}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
