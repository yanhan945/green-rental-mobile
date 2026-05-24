import { useState } from "react";
import "./App.css";

const orders = [
  {
    id: 1,
    customerName: "杭州东站办公室",
    status: "待接单",
    tags: ["需比价", "室外", "租过绿植"],
    areaSize: "300㎡",
    expectedDate: "2026-05-28",
    address: "杭州市上城区杭州东站附近",
    description: "客户希望办公室和门口都摆放绿植，偏好大气、好养护的植物。",
    dispatchTime: "2026-05-24 21:30",
  },
  {
    id: 2,
    customerName: "滨江科技公司",
    status: "已接单",
    tags: ["办公室", "长期租赁"],
    areaSize: "500㎡",
    expectedDate: "2026-06-01",
    address: "杭州市滨江区江南大道",
    description: "需要为前台、会议室、开放办公区配置绿植方案。",
    dispatchTime: "2026-05-24 19:10",
  },
];

function App() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [planType, setPlanType] = useState("租赁方案");
  const [currentPage, setCurrentPage] = useState("orders");
  const [currentPlan, setCurrentPlan] = useState(null);
  const [showAreaSheet, setShowAreaSheet] = useState(false);
  const [areaName, setAreaName] = useState("");

  const closeOrderSheet = () => {
    setSelectedOrder(null);
    setPlanType("租赁方案");
  };

  const createPlan = () => {
    setCurrentPlan({
      id: Date.now(),
      orderId: selectedOrder.id,
      customerName: selectedOrder.customerName,
      planType,
      address: selectedOrder.address,
      areaSize: selectedOrder.areaSize,
      expectedDate: selectedOrder.expectedDate,
      areas: [],
      totalPrice: 0,
    });

    setCurrentPage("plan");
    closeOrderSheet();
  };

  const closeAreaSheet = () => {
    setShowAreaSheet(false);
    setAreaName("");
  };

  const addArea = () => {
    if (!areaName.trim()) return;

    const newArea = {
      id: Date.now(),
      name: areaName.trim(),
      items: [],
    };

    setCurrentPlan((plan) => ({
      ...plan,
      areas: [...plan.areas, newArea],
    }));

    closeAreaSheet();
  };

  if (currentPage === "plan" && currentPlan) {
    return (
      <div className="app">
        <header className="plan-header">
          <button
            className="back-button"
            onClick={() => setCurrentPage("orders")}
          >
            ←
          </button>
          <div>
            <p className="eyebrow">Plan Editor</p>
            <h1>{currentPlan.customerName}</h1>
          </div>
        </header>

        <section className="plan-summary-card">
          <div className="plan-summary-top">
            <div>
              <p>方案类型</p>
              <strong>{currentPlan.planType}</strong>
            </div>
            <div>
              <p>项目面积</p>
              <strong>{currentPlan.areaSize}</strong>
            </div>
          </div>

          <div className="plan-info-line">
            <span>进场时间</span>
            <strong>{currentPlan.expectedDate}</strong>
          </div>

          <div className="plan-info-line">
            <span>客户地址</span>
            <strong>{currentPlan.address}</strong>
          </div>
        </section>

        <section className="area-section">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Area</p>
              <h2>区域配置</h2>
            </div>
            <button
              className="add-area-button"
              onClick={() => setShowAreaSheet(true)}
            >
              新增区域
            </button>
          </div>

          {currentPlan.areas.length === 0 ? (
            <div className="empty-card">
              <p>还没有添加区域</p>
              <span>如：前台、办公室、会议室、走廊、门口</span>
            </div>
          ) : (
            <div className="area-list">
              {currentPlan.areas.map((area) => (
                <article className="area-card" key={area.id}>
                  <div>
                    <h3>{area.name}</h3>
                    <p>已选商品：{area.items.length} 个</p>
                  </div>
                  <button>选择商品</button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="price-card">
          <span>目前方案总数</span>
          <strong>¥ {currentPlan.totalPrice}</strong>
        </section>

        <nav className="bottom-actions">
          <button>更多</button>
          <button>改价</button>
          <button>租期与支付</button>
          <button className="submit-plan-button">提交方案</button>
        </nav>

        {showAreaSheet && (
          <div className="sheet-mask" onClick={closeAreaSheet}>
            <section
              className="bottom-sheet"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="sheet-handle" />

              <div className="sheet-header">
                <div>
                  <p className="eyebrow">Add Area</p>
                  <h2>新增区域</h2>
                </div>
                <button className="close-button" onClick={closeAreaSheet}>
                  ×
                </button>
              </div>

              <div className="sheet-block">
                <p className="sheet-label">区域名称</p>
                <input
                  className="area-input"
                  value={areaName}
                  onChange={(event) => setAreaName(event.target.value)}
                  placeholder="例如：前台、办公室、会议室"
                />
              </div>

              <div className="quick-area-list">
                {["前台", "办公室", "会议室", "走廊", "门口"].map((name) => (
                  <button key={name} onClick={() => setAreaName(name)}>
                    {name}
                  </button>
                ))}
              </div>

              <button className="submit-sheet-button" onClick={addArea}>
                保存区域
              </button>
            </section>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">Green Rental</p>
          <h1>绿植租赁接单系统</h1>
        </div>
        <button className="role-button">员工端</button>
      </header>

      <section className="tabs">
        <button className="tab active">待接单</button>
        <button className="tab">已接单</button>
        <button className="tab">进行中</button>
        <button className="tab">已完成</button>
      </section>

      <main className="order-list">
        {orders.map((order) => (
          <article className="order-card" key={order.id}>
            <div className="order-card-header">
              <div>
                <h2>{order.customerName}</h2>
                <p>{order.status}</p>
              </div>
              <span className="area-size">{order.areaSize}</span>
            </div>

            <div className="tag-list">
              {order.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>

            <div className="info-row">
              <span>期望进场</span>
              <strong>{order.expectedDate}</strong>
            </div>

            <div className="info-row">
              <span>客户地址</span>
              <strong>{order.address}</strong>
            </div>

            <p className="description">{order.description}</p>

            <p className="dispatch-time">派单时间：{order.dispatchTime}</p>

            <div className="actions">
              <button className="ghost-button">导航</button>
              <button className="ghost-button danger">拒绝接单</button>
              <button
                className="primary-button"
                onClick={() => setSelectedOrder(order)}
              >
                确认接单
              </button>
            </div>
          </article>
        ))}
      </main>

      {selectedOrder && (
        <div className="sheet-mask" onClick={closeOrderSheet}>
          <section
            className="bottom-sheet"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sheet-handle" />

            <div className="sheet-header">
              <div>
                <p className="eyebrow">Confirm Order</p>
                <h2>确认接单</h2>
              </div>
              <button className="close-button" onClick={closeOrderSheet}>
                ×
              </button>
            </div>

            <div className="sheet-block">
              <p className="sheet-label">选择方案类型</p>
              <div className="plan-type-grid">
                <button
                  className={planType === "租赁方案" ? "selected" : ""}
                  onClick={() => setPlanType("租赁方案")}
                >
                  租赁方案
                </button>
                <button
                  className={planType === "零售方案" ? "selected" : ""}
                  onClick={() => setPlanType("零售方案")}
                >
                  零售方案
                </button>
              </div>
            </div>

            <div className="sheet-block">
              <p className="sheet-label">客户信息</p>

              <div className="confirm-row">
                <span>客户名称</span>
                <strong>{selectedOrder.customerName}</strong>
              </div>

              <div className="confirm-row">
                <span>项目面积</span>
                <strong>{selectedOrder.areaSize}</strong>
              </div>

              <div className="confirm-row">
                <span>进场时间</span>
                <strong>{selectedOrder.expectedDate}</strong>
              </div>

              <div className="confirm-row address">
                <span>客户地址</span>
                <strong>{selectedOrder.address}</strong>
              </div>
            </div>

            <button className="submit-sheet-button" onClick={createPlan}>
              确认接单并创建{planType}
            </button>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;