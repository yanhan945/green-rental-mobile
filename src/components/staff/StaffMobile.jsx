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
  currentStaff,
  currentOrganization,
  roleLabels = {},
  accountStatusLabels = {},
  authUserEmail = "",
  canOpenMerchant = false,
  onSignOut,
}) {
  const executableOrders = staffOrders.filter((order) => order.status === "执行中");

  return (
  <div className="staff-app-shell">
    <header className="staff-app-topbar">
      <button
        className="staff-avatar-entry"
        onClick={() => setStaffAppTab("我的")}
        aria-label="进入我的页面"
      >
        {staffAvatar ? <img src={staffAvatar} alt="员工头像" /> : <span>G</span>}
      </button>

      <div className="staff-topbar-title">
        <strong>GardenOS</strong>
        <span>Field Console</span>
      </div>

      <button className="staff-mini-button merchant-switch" onClick={() => switchRole("merchant")}>
        <GardenIcons.Dashboard size={16} />
        <span>商户</span>
      </button>
    </header>

    <main className="staff-app-main">
{staffAppTab === "首页" && (
          <StaffHome
            orders={staffOrders}
            refreshOrdersFromCloud={refreshOrdersFromCloud}
            getPlanStats={getPlanStats}
            money={money}
            setStaffAppTab={setStaffAppTab}
            setActiveStaffTab={setActiveStaffTab}
            autoSyncState={autoSyncState}
            syncMessage={syncMessage}
          />
        )}

      {staffAppTab === "任务" && (
        <>
          <section className="staff-compact-header">
            <div>
              <p className="staff-kicker">TASK FLOW</p>
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
            {filteredStaffOrders.length === 0 ? (
              <div className="staff-empty-card">
                <strong>暂无{activeStaffTab}任务</strong>
                <span>订单变化会自动同步，也可以点击刷新。</span>
              </div>
            ) : (
              filteredStaffOrders.map((order) => (
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
              <p className="staff-kicker">FIELD REPORT</p>
              <h1>现场上报</h1>
              <span>用于完成照片、现场备注、异常反馈</span>
            </div>
          </section>

          <section className="staff-report-card">
            <h2>快捷上报</h2>
            <p>当前版本先从执行中订单进入完成上传；后续这里会升级为拍照、定位、异常反馈入口。</p>

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
      <p className="staff-kicker">PARTNER PROFILE</p>
      <h1>我的服务身份</h1>
      <span>账号、组织、接单权限与同步状态</span>
    </section>

    <section className="staff-profile-card refined">
      <div className="staff-avatar large">
        {staffAvatar ? <img src={staffAvatar} alt="员工头像" /> : "G"}
      </div>
      <div>
        <h2>{currentStaff?.name || "园林服务人员"}</h2>
        <p>{authUserEmail || currentStaff?.email || "后续接入邮箱 / 密码登录。"}</p>
        <b className="staff-login-pill">{accountStatusLabels[currentStaff?.status] || "模拟账号"} · 本地模式</b>
      </div>
    </section>

    <section className="staff-profile-card refined staff-avatar-upload-card">
      <div>
        <p className="staff-kicker">PROFILE PHOTO</p>
        <h2>个人头像</h2>
        <p>点击上传头像，首页左上角和我的页面会同步显示。</p>
      </div>
      <ImageUploader
        value={staffAvatar}
        avatar
        label="员工头像"
        helper=""
        onChange={setStaffAvatar}
      />
      <p className="staff-storage-note">
        后续接账号系统和云端 Storage 后，头像 URL 应保存到 staffMembers / user profile 中。
      </p>
    </section>

    <section className="staff-visible-info">
      <div>
        <span>姓名 / 工号</span>
        <strong>{currentStaff?.name || "-"} · {currentStaff?.staffNo || "-"}</strong>
        <em>邮箱密码登录后，这里会来自账号资料。</em>
      </div>

      <div>
        <span>登录邮箱 / 手机号</span>
        <strong>{authUserEmail || currentStaff?.email || "-"}</strong>
        <em>{currentStaff?.phone || "未填写手机号"}</em>
      </div>

      <div>
        <span>所属组织 / 区域</span>
        <strong>{currentOrganization?.name || currentStaff?.organizationId || "-"}</strong>
        <em>{currentStaff?.area || "未分配区域"}</em>
      </div>

      <div>
        <span>角色 / 状态</span>
        <strong>{roleLabels[currentStaff?.role] || currentStaff?.role || "-"}</strong>
        <em>{accountStatusLabels[currentStaff?.status] || currentStaff?.status || "-"}</em>
      </div>

      <div>
        <span>当前任务数</span>
        <strong>{staffOrders.length} 笔</strong>
        <em>员工端当前只显示分配给本人的订单。</em>
      </div>
    </section>

    <section className="staff-setting-accordion">
      <details>
        <summary>
          <span>账号状态</span>
          <strong>{accountStatusLabels[currentStaff?.status] || "模拟"}</strong>
        </summary>
        <div className="staff-detail-content">
          <p>当前登录邮箱：{authUserEmail || "-"}</p>
          <p>后续这里会从 profiles 表读取账号资料与权限。</p>
          <button onClick={onSignOut}>退出登录</button>
        </div>
      </details>

      <details>
        <summary>
          <span>接单权限</span>
          <strong>查看规则</strong>
        </summary>
        <div className="staff-detail-content">
          <p>当前模拟账号：{currentStaff?.email || "-"}</p>
          <p>指定派单：商户端选择员工后，员工端只展示 assignedStaffId 等于当前员工 id 的订单。</p>
        </div>
      </details>

      <details>
        <summary>
          <span>通知设置</span>
          <strong>预留</strong>
        </summary>
        <div className="staff-detail-content">
          <p>后续可接入新派单提醒、方案打回提醒、客户确认提醒、归档提醒。</p>
        </div>
      </details>

      <details>
        <summary>
          <span>数据同步</span>
          <strong>{syncState}</strong>
        </summary>
        <div className="staff-detail-content">
          <p>自动同步：{autoSyncState}</p>
          <p>{syncMessage}</p>
          <div className="staff-detail-actions">
            <button onClick={refreshOrdersFromCloud}>刷新云端数据</button>
            <button onClick={uploadLocalOrdersToCloud}>上传本地数据</button>
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
        <div className="sheet-mask" onClick={() => setSelectedOrder(null)}>
          <section className="bottom-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />

            <div className="sheet-header">
              <div><p className="eyebrow">Confirm Order</p><h2>确认接单</h2></div>
              <button className="close-button" onClick={() => setSelectedOrder(null)} aria-label="关闭">
                <GardenIcons.Close size={18} />
              </button>
            </div>

            <div className="sheet-block">
              <p className="sheet-label">选择方案类型</p>
              <div className="plan-type-grid">
                <button className={planType === "租赁方案" ? "selected" : ""} onClick={() => setPlanType("租赁方案")}>租赁方案</button>
                <button className={planType === "零售方案" ? "selected" : ""} onClick={() => setPlanType("零售方案")}>零售方案</button>
                <button className={planType === "养护服务" ? "selected" : ""} onClick={() => setPlanType("养护服务")}>养护服务</button>
              </div>
              <div className="plan-type-note">
                {planType === "租赁方案" && "适用于长期绿植租摆，默认包含基础养护。"}
                {planType === "零售方案" && "适用于一次性售卖植物 / 花盆 / 资材，可记录后续养护意向。"}
                {planType === "养护服务" && "适用于客户已有植物或追加上门维护，只选择套餐与最终报价。"}
              </div>
            </div>

            <div className="sheet-block">
              <p className="sheet-label">客户信息</p>
              <div className="confirm-row"><span>项目 / 客户</span><strong>{selectedOrder.customerName}</strong></div>
              <div className="confirm-row"><span>方案类型</span><strong>{selectedOrder.plan?.planType || selectedOrder.planType || planType}</strong></div>
              <div className="confirm-row"><span>需求标签</span><strong>{Array.isArray(selectedOrder.tags) ? selectedOrder.tags.join(" / ") : "-"}</strong></div>
              <div className="confirm-row"><span>联系人</span><strong>{selectedOrder.contactName || "-"}</strong></div>
              <div className="confirm-row"><span>电话</span><strong>{selectedOrder.phone || "-"}</strong></div>
              <div className="confirm-row"><span>项目面积</span><strong>{selectedOrder.areaSize}</strong></div>
              <div className="confirm-row"><span>植物数量</span><strong>{selectedOrder.plannedPlantCount || "待现场校正"}</strong></div>
              <div className="confirm-row"><span>进场时间</span><strong>{selectedOrder.expectedDate}</strong></div>
              <div className="confirm-row address"><span>客户地址</span><strong>{selectedOrder.address}</strong></div>
              <div className="confirm-row address"><span>客户描述</span><strong>{selectedOrder.description || "-"}</strong></div>
              <div className="confirm-row address"><span>商户备注</span><strong>{selectedOrder.merchantNote || selectedOrder.plan?.merchantDraftNote || "-"}</strong></div>
            </div>

            <button className="submit-sheet-button" onClick={acceptOrderAndCreatePlan}>
              {selectedOrder.plan ? "确认接单并查看方案草稿" : `确认接单并创建${planType}`}
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
