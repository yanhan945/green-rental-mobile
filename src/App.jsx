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

const productCategories = ["室内绿植", "室外植物", "月租套餐", "仿真植物"];

const subCategories = ["大型植物", "中型植物", "小型植物", "水培植物", "盆景植物"];

const products = [
  {
    id: 1,
    name: "原生发财树",
    category: "室内绿植",
    subCategory: "大型植物",
    description: "寓意财源滚滚，适合前台、办公室、会议室。",
    pricePerDay: 2.5,
    image: "🌳",
  },
  {
    id: 2,
    name: "天堂鸟",
    category: "室内绿植",
    subCategory: "大型植物",
    description: "株型舒展，适合大堂、休息区、开放办公区。",
    pricePerDay: 3.2,
    image: "🪴",
  },
  {
    id: 3,
    name: "绿萝柱",
    category: "室内绿植",
    subCategory: "中型植物",
    description: "耐阴好养，适合办公室角落和走廊区域。",
    pricePerDay: 1.6,
    image: "🌿",
  },
  {
    id: 4,
    name: "红掌",
    category: "室内绿植",
    subCategory: "小型植物",
    description: "颜色鲜明，适合前台、桌面、接待区点缀。",
    pricePerDay: 0.8,
    image: "🌺",
  },
  {
    id: 5,
    name: "水培白掌",
    category: "室内绿植",
    subCategory: "水培植物",
    description: "干净清爽，适合会议桌、茶水间、前台。",
    pricePerDay: 0.7,
    image: "💧",
  },
  {
    id: 6,
    name: "罗汉松盆景",
    category: "室内绿植",
    subCategory: "盆景植物",
    description: "稳重大气，适合老板办公室、会客区。",
    pricePerDay: 4.5,
    image: "🎍",
  },
];

function App() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [planType, setPlanType] = useState("租赁方案");
  const [currentPage, setCurrentPage] = useState("orders");
  const [currentPlan, setCurrentPlan] = useState(null);

  const [showAreaSheet, setShowAreaSheet] = useState(false);
  const [areaName, setAreaName] = useState("");

  const [currentAreaId, setCurrentAreaId] = useState(null);
  const [activeCategory, setActiveCategory] = useState("室内绿植");
  const [activeSubCategory, setActiveSubCategory] = useState("大型植物");
  const [searchText, setSearchText] = useState("");

  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [leaseMonths, setLeaseMonths] = useState(12);
  const [paymentMethod, setPaymentMethod] = useState("月付");
  const [needDeposit, setNeedDeposit] = useState(true);

  const [showPriceSheet, setShowPriceSheet] = useState(false);
  const [customTotalRent, setCustomTotalRent] = useState("");

  const currentArea = currentPlan?.areas.find((area) => area.id === currentAreaId);

  const dailyRent = Number(currentPlan?.totalPrice || 0);
  const totalRent = (dailyRent * leaseMonths * 30).toFixed(1);
  const finalRent = customTotalRent ? Number(customTotalRent).toFixed(1) : totalRent;

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

    setCustomTotalRent("");
    setCurrentPage("plan");
    closeOrderSheet();
  };

  const closeAreaSheet = () => {
    setShowAreaSheet(false);
    setAreaName("");
  };

  const recalculateTotal = (areas) => {
    const total = areas.reduce((areaTotal, area) => {
      const safeItems = Array.isArray(area.items) ? area.items : [];
      const itemTotal = safeItems.reduce(
        (sum, item) => sum + item.pricePerDay * item.quantity,
        0
      );

      return areaTotal + itemTotal;
    }, 0);

    return total.toFixed(1);
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

  const openProductPage = (area) => {
    setCurrentAreaId(area.id);
    setCurrentPage("products");
  };

  const addProductToArea = (product) => {
    if (!currentAreaId) return;

    setCurrentPlan((plan) => {
      if (!plan) return plan;

      const updatedAreas = plan.areas.map((area) => {
        if (area.id !== currentAreaId) return area;

        const safeItems = Array.isArray(area.items) ? area.items : [];
        const existingItem = safeItems.find((item) => item.productId === product.id);

        let newItems;

        if (existingItem) {
          newItems = safeItems.map((item) =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          newItems = [
            ...safeItems,
            {
              productId: product.id,
              name: product.name,
              pricePerDay: product.pricePerDay,
              quantity: 1,
            },
          ];
        }

        return {
          ...area,
          items: newItems,
        };
      });

      return {
        ...plan,
        areas: updatedAreas,
        totalPrice: recalculateTotal(updatedAreas),
      };
    });

    setCurrentPage("plan");
  };

  const changeItemQuantity = (areaId, productId, change) => {
    setCurrentPlan((plan) => {
      if (!plan) return plan;

      const updatedAreas = plan.areas.map((area) => {
        if (area.id !== areaId) return area;

        const safeItems = Array.isArray(area.items) ? area.items : [];

        const updatedItems = safeItems
          .map((item) =>
            item.productId === productId
              ? { ...item, quantity: item.quantity + change }
              : item
          )
          .filter((item) => item.quantity > 0);

        return {
          ...area,
          items: updatedItems,
        };
      });

      return {
        ...plan,
        areas: updatedAreas,
        totalPrice: recalculateTotal(updatedAreas),
      };
    });
  };

  const removeItemFromArea = (areaId, productId) => {
    setCurrentPlan((plan) => {
      if (!plan) return plan;

      const updatedAreas = plan.areas.map((area) => {
        if (area.id !== areaId) return area;

        const safeItems = Array.isArray(area.items) ? area.items : [];

        return {
          ...area,
          items: safeItems.filter((item) => item.productId !== productId),
        };
      });

      return {
        ...plan,
        areas: updatedAreas,
        totalPrice: recalculateTotal(updatedAreas),
      };
    });
  };

  const filteredProducts = products.filter((product) => {
    const matchCategory = product.category === activeCategory;
    const matchSubCategory = product.subCategory === activeSubCategory;
    const matchSearch =
      searchText.trim() === "" ||
      product.name.includes(searchText) ||
      product.description.includes(searchText);

    return matchCategory && matchSubCategory && matchSearch;
  });

  if (currentPage === "products" && currentArea) {
    return (
      <div className="app product-page">
        <header className="plan-header">
          <button className="back-button" onClick={() => setCurrentPage("plan")}>
            ←
          </button>
          <div>
            <p className="eyebrow">Product Library</p>
            <h1>{currentArea.name}选品</h1>
          </div>
        </header>

        <section className="search-card">
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="搜索植物名称 / 寓意 / 场景"
          />
        </section>

        <section className="category-tabs">
          {productCategories.map((category) => (
            <button
              key={category}
              className={activeCategory === category ? "active" : ""}
              onClick={() => {
                setActiveCategory(category);
                setActiveSubCategory("大型植物");
              }}
            >
              {category}
            </button>
          ))}
        </section>

        <main className="product-layout">
          <aside className="sub-category-list">
            {subCategories.map((subCategory) => (
              <button
                key={subCategory}
                className={activeSubCategory === subCategory ? "active" : ""}
                onClick={() => setActiveSubCategory(subCategory)}
              >
                {subCategory}
              </button>
            ))}
          </aside>

          <section className="product-list">
            {filteredProducts.length === 0 ? (
              <div className="empty-product-card">
                <p>暂无商品</p>
                <span>可以换个分类，或清空搜索关键词</span>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <article className="product-card" key={product.id}>
                  <div className="product-image">{product.image}</div>

                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>

                    <div className="product-bottom">
                      <strong>¥ {product.pricePerDay}/天</strong>
                      <button onClick={() => addProductToArea(product)}>加入</button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </section>
        </main>
      </div>
    );
  }

  if (currentPage === "plan" && currentPlan) {
    return (
      <div className="app">
        <header className="plan-header">
          <button className="back-button" onClick={() => setCurrentPage("orders")}>
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
            <button className="add-area-button" onClick={() => setShowAreaSheet(true)}>
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
                    <p>
                      已选商品：
                      {area.items.reduce((sum, item) => sum + item.quantity, 0)} 件
                    </p>

                    {area.items.length > 0 && (
                      <div className="selected-product-list">
                        {area.items.map((item) => (
                          <div className="selected-product-row" key={item.productId}>
                            <div>
                              <strong>{item.name}</strong>
                              <span>¥ {item.pricePerDay}/天</span>
                            </div>

                            <div className="quantity-controls">
                              <button
                                onClick={() =>
                                  changeItemQuantity(area.id, item.productId, -1)
                                }
                              >
                                -
                              </button>
                              <b>{item.quantity}</b>
                              <button
                                onClick={() =>
                                  changeItemQuantity(area.id, item.productId, 1)
                                }
                              >
                                +
                              </button>
                            </div>

                            <button
                              className="remove-item-button"
                              onClick={() => removeItemFromArea(area.id, item.productId)}
                            >
                              删除
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button onClick={() => openProductPage(area)}>选择商品</button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="price-card price-detail-card">
          <div>
            <span>目前方案日租金</span>
            <strong>¥ {currentPlan.totalPrice}</strong>
          </div>

          <div>
            <span>租期</span>
            <strong>{leaseMonths} 月</strong>
          </div>

          <div>
            <span>系统预计总租金</span>
            <strong>¥ {totalRent}</strong>
          </div>

          <div>
            <span>最终报价</span>
            <strong>¥ {finalRent}</strong>
          </div>

          <div>
            <span>支付方式</span>
            <strong>{paymentMethod}</strong>
          </div>

          <div>
            <span>押金</span>
            <strong>{needDeposit ? "需要" : "不需要"}</strong>
          </div>
        </section>

        <nav className="bottom-actions">
          <button>更多</button>
          <button onClick={() => setShowPriceSheet(true)}>改价</button>
          <button onClick={() => setShowPaymentSheet(true)}>租期与支付</button>
          <button className="submit-plan-button">提交方案</button>
        </nav>

        {showAreaSheet && (
          <div className="sheet-mask" onClick={closeAreaSheet}>
            <section className="bottom-sheet" onClick={(event) => event.stopPropagation()}>
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

        {showPaymentSheet && (
          <div className="sheet-mask" onClick={() => setShowPaymentSheet(false)}>
            <section className="bottom-sheet" onClick={(event) => event.stopPropagation()}>
              <div className="sheet-handle" />

              <div className="sheet-header">
                <div>
                  <p className="eyebrow">Payment</p>
                  <h2>租期与支付</h2>
                </div>
                <button className="close-button" onClick={() => setShowPaymentSheet(false)}>
                  ×
                </button>
              </div>

              <div className="sheet-block">
                <p className="sheet-label">选择租期</p>
                <div className="option-grid">
                  {[6, 12, 24, 36].map((month) => (
                    <button
                      key={month}
                      className={leaseMonths === month ? "selected" : ""}
                      onClick={() => setLeaseMonths(month)}
                    >
                      {month} 月
                    </button>
                  ))}
                </div>
              </div>

              <div className="sheet-block">
                <p className="sheet-label">支付方式</p>
                <div className="option-grid payment-grid">
                  {["月付", "季付", "半年付", "年付"].map((method) => (
                    <button
                      key={method}
                      className={paymentMethod === method ? "selected" : ""}
                      onClick={() => setPaymentMethod(method)}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div className="deposit-row">
                <div>
                  <strong>是否需要押金</strong>
                  <span>真实业务里可根据客户情况调整</span>
                </div>

                <button
                  className={needDeposit ? "switch-button active" : "switch-button"}
                  onClick={() => setNeedDeposit(!needDeposit)}
                >
                  {needDeposit ? "需要" : "不需要"}
                </button>
              </div>

              <div className="rent-preview">
                <span>预计总租金</span>
                <strong>¥ {totalRent}</strong>
              </div>

              <button
                className="submit-sheet-button"
                onClick={() => setShowPaymentSheet(false)}
              >
                保存租期与支付
              </button>
            </section>
          </div>
        )}

        {showPriceSheet && (
          <div className="sheet-mask" onClick={() => setShowPriceSheet(false)}>
            <section className="bottom-sheet" onClick={(event) => event.stopPropagation()}>
              <div className="sheet-handle" />

              <div className="sheet-header">
                <div>
                  <p className="eyebrow">Adjust Price</p>
                  <h2>修改最终报价</h2>
                </div>
                <button className="close-button" onClick={() => setShowPriceSheet(false)}>
                  ×
                </button>
              </div>

              <div className="sheet-block">
                <p className="sheet-label">系统预计总租金</p>
                <div className="price-preview-line">
                  <span>按当前商品和租期自动计算</span>
                  <strong>¥ {totalRent}</strong>
                </div>
              </div>

              <div className="sheet-block">
                <p className="sheet-label">最终报价</p>
                <input
                  className="price-input"
                  type="number"
                  value={customTotalRent}
                  onChange={(event) => setCustomTotalRent(event.target.value)}
                  placeholder="例如：1980"
                />
              </div>

              <div className="quick-price-list">
                {[totalRent, 1980, 2880, 3880].map((price) => (
                  <button key={price} onClick={() => setCustomTotalRent(String(price))}>
                    ¥ {price}
                  </button>
                ))}
              </div>

              <button
                className="submit-sheet-button"
                onClick={() => setShowPriceSheet(false)}
              >
                保存最终报价
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
              <button className="primary-button" onClick={() => setSelectedOrder(order)}>
                确认接单
              </button>
            </div>
          </article>
        ))}
      </main>

      {selectedOrder && (
        <div className="sheet-mask" onClick={closeOrderSheet}>
          <section className="bottom-sheet" onClick={(event) => event.stopPropagation()}>
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