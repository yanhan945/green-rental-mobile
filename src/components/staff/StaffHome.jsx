export function StaffHome({
  orders,
  refreshOrdersFromCloud,
  setStaffAppTab,
  setActiveStaffTab,
  autoSyncState,
  syncMessage,
}) {
  const serviceFlowItems = [
    {
      label: "待接单",
      value: orders.filter((order) => order.status === "待接单").length,
      hint: "等待接收",
      accent: "#6f8063",
      background: "rgba(237, 241, 231, 0.82)",
      onClick: () => {
        setStaffAppTab("任务");
        setActiveStaffTab("待接单");
      },
    },
    {
      label: "做方案",
      value: orders.filter((order) => ["配置中", "待商户确认"].includes(order.status)).length,
      hint: "配置 / 确认",
      accent: "#b89658",
      background: "rgba(248, 234, 208, 0.82)",
      onClick: () => {
        setStaffAppTab("任务");
        setActiveStaffTab("做方案");
      },
    },
    {
      label: "执行中",
      value: orders.filter((order) => ["方案已确认", "执行中"].includes(order.status)).length,
      hint: "现场推进",
      accent: "#74678b",
      background: "rgba(238, 234, 242, 0.82)",
      onClick: () => {
        setStaffAppTab("任务");
        setActiveStaffTab("执行中");
      },
    },
    {
      label: "归档 / 完成",
      value: orders.filter((order) => ["待商户归档", "已完成"].includes(order.status)).length,
      hint: "归档收尾",
      accent: "#8d4e38",
      background: "rgba(242, 219, 205, 0.72)",
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
          <p>Good evening,</p>
          <h1>GardenOS</h1>
          <span>城市园林服务交付台</span>
        </div>
        <button className="garden-head-refresh" onClick={refreshOrdersFromCloud}>
          ↻
        </button>
      </section>

      <section className="garden-clean-card">
        <div className="garden-clean-title">
          <div>
            <p className="garden-kicker">SERVICE FLOW</p>
            <h2>服务流转</h2>
          </div>
          <button onClick={() => setStaffAppTab("任务")}>进入任务</button>
        </div>

        <div
          className="garden-service-flow-grid"
          style={{
            position: "relative",
            zIndex: 1,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginTop: 14,
          }}
        >
          {serviceFlowItems.map((item) => (
            <button
              key={item.label}
              className="garden-service-flow-item"
              onClick={item.onClick}
              style={{
                minHeight: 86,
                border: "1px solid rgba(116, 102, 74, 0.12)",
                borderRadius: 20,
                padding: 13,
                background: `linear-gradient(180deg, rgba(255, 252, 246, 0.94), ${item.background})`,
                boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.74), 0 12px 26px rgba(58, 47, 30, 0.05)",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  display: "block",
                  color: "#827b6d",
                  fontSize: 12,
                  fontWeight: 950,
                }}
              >
                {item.label}
              </span>
              <strong
                style={{
                  display: "block",
                  marginTop: 9,
                  color: "#20251d",
                  fontSize: 31,
                  lineHeight: 1,
                  fontWeight: 950,
                }}
              >
                {item.value}
              </strong>
              <em
                style={{
                  display: "block",
                  marginTop: 8,
                  color: item.accent,
                  fontSize: 11,
                  fontStyle: "normal",
                  fontWeight: 850,
                }}
              >
                {item.hint}
              </em>
            </button>
          ))}
        </div>

        <p
          style={{
            position: "relative",
            zIndex: 1,
            margin: "12px 0 0",
            color: "#827b6d",
            fontSize: 12,
            lineHeight: 1.55,
            fontWeight: 800,
          }}
        >
          点击状态进入对应任务列表。
        </p>
      </section>

      <section className="garden-live-progress-card">
        <div className="garden-live-title-row">
          <div>
            <p className="garden-kicker">WEEK PROGRESS</p>
            <h2>交付节奏</h2>
          </div>
          <span>{autoSyncState}</span>
        </div>

        <div className="garden-live-progress-body">
          <div className="garden-live-bars">
            {[3, 5, 2, 7, 4, 6, 8].map((height, index) => (
              <i key={index} style={{ "--h": `${height * 9 + 18}px` }} />
            ))}
          </div>

          <div className="garden-live-number">
            <strong>
              {orders.filter((order) =>
                ["待接单", "配置中", "待商户确认", "方案已确认", "执行中", "待商户归档"].includes(order.status)
              ).length}
            </strong>
            <span>current tasks</span>
          </div>
        </div>

        <p>{syncMessage}</p>
      </section>
    </>
  );
}
