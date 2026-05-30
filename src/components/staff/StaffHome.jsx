import { GardenIcons } from "../../GardenIcons";

export function StaffHome({
  orders = [],
  refreshOrdersFromCloud,
  setStaffAppTab,
  setActiveStaffTab,
  classifyOrderStatus = (status) => status || "做方案",
}) {
  const safeOrders = Array.isArray(orders) ? orders : [];
  const countByGroup = (group) => safeOrders.filter((order) => classifyOrderStatus(order.status) === group).length;
  const currentTaskCount = safeOrders.filter((order) => classifyOrderStatus(order.status) !== "已完成").length;

  const serviceFlowItems = [
    {
      label: "待接单",
      value: countByGroup("待接单"),
      hint: "等待接收",
      Icon: GardenIcons.TodayTask,
      tone: "olive",
      onClick: () => {
        setStaffAppTab("任务");
        setActiveStaffTab("待接单");
      },
    },
    {
      label: "做方案",
      value: countByGroup("做方案"),
      hint: "配置 / 确认",
      Icon: GardenIcons.ServiceRoute,
      tone: "sand",
      onClick: () => {
        setStaffAppTab("任务");
        setActiveStaffTab("做方案");
      },
    },
    {
      label: "执行中",
      value: countByGroup("执行中"),
      hint: "现场推进",
      Icon: GardenIcons.Map,
      tone: "sage",
      onClick: () => {
        setStaffAppTab("任务");
        setActiveStaffTab("执行中");
      },
    },
    {
      label: "归档 / 完成",
      value: countByGroup("已完成"),
      hint: "归档收尾",
      Icon: GardenIcons.Archive,
      tone: "clay",
      onClick: () => {
        setStaffAppTab("任务");
        setActiveStaffTab("已完成");
      },
    },
  ];

  return (
    <>
      <section className="garden-clean-head">
        <div>
          <p>今日服务</p>
          <h1>GardenOS</h1>
          <span>城市园林服务交付台</span>
        </div>
        <button className="garden-head-refresh" onClick={refreshOrdersFromCloud} aria-label="刷新订单">
          <GardenIcons.Refresh />
        </button>
      </section>

      <section className="garden-clean-card garden-service-card">
        <div className="garden-clean-title">
          <div>
            <p className="garden-kicker">服务流转</p>
            <h2>服务流转</h2>
          </div>
          <button onClick={() => setStaffAppTab("任务")}>
            <GardenIcons.ServiceRoute size={17} />
            <span>进入任务</span>
          </button>
        </div>

        <div className="garden-service-flow-grid">
          {serviceFlowItems.map((item) => {
            const Icon = item.Icon;

            return (
              <button
                key={item.label}
                className={`garden-service-flow-item ${item.tone}`}
                onClick={item.onClick}
              >
                <span className="garden-flow-icon">
                  <Icon size={18} />
                </span>
                <span className="garden-flow-label">{item.label}</span>
                <strong>{item.value}</strong>
                <em>{item.hint}</em>
              </button>
            );
          })}
        </div>

        <p className="garden-flow-note">点击状态进入对应任务列表。</p>
      </section>

      <section className="garden-live-progress-card refined">
        <div className="garden-live-title-row">
          <div>
            <p className="garden-kicker">交付节奏</p>
            <h2>交付节奏</h2>
          </div>
          <span>实时任务</span>
        </div>

        <div className="garden-live-progress-body">
          <div className="garden-live-bars" aria-hidden="true">
            {[3, 5, 2, 7, 4, 6, 8].map((height, index) => (
              <i key={index} style={{ "--h": `${height * 8 + 16}px` }} />
            ))}
          </div>

          <div className="garden-live-number">
            <GardenIcons.Rhythm size={18} />
            <strong>{currentTaskCount}</strong>
            <span>当前任务</span>
          </div>
        </div>

        <p>按当前订单状态汇总，点击上方状态卡片进入对应任务列表。</p>
      </section>
    </>
  );
}
