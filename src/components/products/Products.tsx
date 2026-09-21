import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { productsData } from "../../data.js";
import { useCartStore } from "../../store/cartStore";
import "./Products.css";

/** Parse "1,850 EGP" → 1850 */
const parsePrice = (priceStr: string): number =>
  Number(priceStr.replace(/[^0-9.]/g, "")) || 0;

const COLORS = [
  { id: "charcoal", label: "Charcoal", hex: "#2a2a2a" },
  { id: "olive",    label: "Olive",    hex: "#556b2f" },
  { id: "slate",    label: "Slate",    hex: "#4a5568" },
  { id: "sand",     label: "Sand",     hex: "#c2b280" },
];

const SIZES = ["S", "M", "L", "XL"];

type Product = (typeof productsData)[number];

/* ─── Inline Cart Drawer ─────────────────────────────────── */
const CartDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose,
}) => {
  const { items, removeFromCart, updateQuantity } = useCartStore();
  const navigate = useNavigate();
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const drawerRef = useRef<HTMLDivElement>(null);

  // trap focus & close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {/* backdrop */}
      <div
        className={`drawer-backdrop${open ? " is-open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* panel */}
      <aside
        ref={drawerRef}
        className={`cart-drawer${open ? " is-open" : ""}`}
        aria-label="Cart"
        role="dialog"
        aria-modal="true"
      >
        <div className="drawer-header">
          <h2 className="drawer-title">Your Cart</h2>
          <button className="drawer-close" onClick={onClose} aria-label="Close cart">
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className="drawer-empty">
            <p>Nothing here yet.</p>
            <p className="drawer-empty-sub">Add something from the grid ↙</p>
          </div>
        ) : (
          <>
            <ul className="drawer-list">
              {items.map((item) => (
                <li key={item.id} className="drawer-item">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="drawer-item__img"
                    />
                  )}
                  <div className="drawer-item__body">
                    <p className="drawer-item__name">{item.name}</p>
                    <p className="drawer-item__price">
                      {(item.price * item.quantity).toLocaleString()} EGP
                    </p>
                    <div className="drawer-item__controls">
                      <button
                        className="dqty-btn"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        −
                      </button>
                      <span className="dqty-val">{item.quantity}</span>
                      <button
                        className="dqty-btn"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                      <button
                        className="drawer-item__remove"
                        onClick={() => removeFromCart(item.id)}
                        aria-label="Remove"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="drawer-footer">
              <div className="drawer-total">
                <span>Total</span>
                <span>{total.toLocaleString()} EGP</span>
              </div>
              <button
                className="drawer-checkout-btn"
                onClick={() => {
                  onClose();
                  navigate("/cart");
                }}
              >
                Go to Checkout →
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
};

/* ─── Products Page ──────────────────────────────────────── */
const Products: React.FC = () => {
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [selectedColor, setSelectedColor] = useState(COLORS[0].id);
  const [selectedSize, setSelectedSize] = useState("M");
  const [added, setAdded]               = useState(false);
  const [drawerOpen, setDrawerOpen]     = useState(false);

  const addToCart    = useCartStore((s) => s.addToCart);
  const totalItems   = useCartStore((s) => s.getTotalItems());

  const openProduct = (product: Product) => {
    setActiveProduct(product);
    setSelectedColor(COLORS[0].id);
    setSelectedSize("M");
    setAdded(false);
  };

  const closeProduct = () => setActiveProduct(null);

  // Lock body scroll when modal OR drawer is open
  useEffect(() => {
    document.body.style.overflow = activeProduct || drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [activeProduct, drawerOpen]);

  // Close modal on Escape
  useEffect(() => {
    if (!activeProduct) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeProduct(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeProduct]);

  const handleAddToCart = () => {
    if (!activeProduct) return;
    const colorLabel = COLORS.find((c) => c.id === selectedColor)?.label ?? selectedColor;
    addToCart({
      id: `${activeProduct.id}-${selectedSize}-${selectedColor}`,
      name: `${activeProduct.title} — ${selectedSize} / ${colorLabel}`,
      price: parsePrice(activeProduct.currentPrice),
      image: activeProduct.image,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="products-page">
      {/* ── Floating Cart Button ── */}
      <button
        className="fab-cart"
        onClick={() => setDrawerOpen(true)}
        aria-label="Open cart"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="9"  cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        {totalItems > 0 && (
          <span className="fab-cart__badge">{totalItems}</span>
        )}
      </button>

      {/* ── Cart Drawer ── */}
      <CartDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="editorial-shell">
        <header className="frame-header">
          <NavLink to="/" className="brand-title">
            PRMPT ARCHIVE
          </NavLink>
          <nav className="nav-links">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/products">Products</NavLink>
            <span>Collections</span>
            <span>Journal</span>
            <NavLink to="/about">About</NavLink>
          </nav>
        </header>

        <div className="products-grid">
          {productsData.map((product) => (
            <article
              key={product.id}
              className="product-card"
              onClick={() => openProduct(product)}
            >
              <div className="image-container">
                <img src={product.image} alt={product.title} />
                {/* Quick-add overlay */}
                <button
                  className="quick-add-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart({
                      id: product.id,
                      name: product.title,
                      price: parsePrice(product.currentPrice),
                      image: product.image,
                    });
                    setDrawerOpen(true);
                  }}
                >
                  + Quick Add
                </button>
              </div>

              <div className="card-meta">
                <div className="card-meta__top">
                  <h2 className="card-title">{product.title}</h2>
                  <span className="card-price">{product.currentPrice}</span>
                </div>
                <p className="card-category">{product.category}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* ── Product Modal ── */}
      {activeProduct && (
        <div
          className="product-modal-backdrop"
          onClick={closeProduct}
          role="presentation"
        >
          <div
            className="product-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={activeProduct.title}
          >
            <button
              type="button"
              className="product-modal__close"
              onClick={closeProduct}
              aria-label="Close"
            >
              ×
            </button>

            <div className="product-modal__media">
              <img src={activeProduct.image} alt={activeProduct.title} />
            </div>

            <div className="product-modal__info">
              <p className="product-modal__category">{activeProduct.category}</p>
              <h2>{activeProduct.title}</h2>
              <p className="product-modal__desc">{activeProduct.description}</p>

              <div className="product-modal__price">
                <span className="current">{activeProduct.currentPrice}</span>
                <span className="was">{activeProduct.wasPrice}</span>
              </div>

              <div className="product-options">
                <p className="option-label">Color</p>
                <div className="color-options">
                  {COLORS.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      className={`color-swatch${selectedColor === color.id ? " is-active" : ""}`}
                      style={{ backgroundColor: color.hex }}
                      aria-label={color.label}
                      title={color.label}
                      onClick={() => setSelectedColor(color.id)}
                    />
                  ))}
                </div>
              </div>

              <div className="product-options">
                <p className="option-label">Size</p>
                <div className="size-options">
                  {SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      className={`size-chip${selectedSize === size ? " is-active" : ""}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className={`btn-add-cart${added ? " is-added" : ""}`}
                onClick={handleAddToCart}
              >
                {added ? "✓ Added to Cart!" : "Add to Cart"}
              </button>

              {added && (
                <button
                  type="button"
                  className="btn-view-cart"
                  onClick={() => {
                    closeProduct();
                    setDrawerOpen(true);
                  }}
                >
                  View Cart →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
