import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useCartStore } from "../../store/cartStore";
import { apiUrl } from "../../lib/api";
import "./Iteams.css";

/* ── Egyptian Governorates ── */
const GOVERNORATES = [
  "Cairo", "Giza", "Alexandria", "Aswan", "Asyut", "Beheira",
  "Beni Suef", "Dakahlia", "Damietta", "Faiyum", "Gharbia",
  "Ismailia", "Kafr el-Sheikh", "Luxor", "Matruh", "Minya",
  "Monufia", "New Valley", "North Sinai", "Port Said", "Qalyubia",
  "Qena", "Red Sea", "Sharqia", "Sohag", "South Sinai", "Suez",
];

const emptyForm = () => ({
  fullName: "",
  email: "",
  password: "",
  phone: "",
  address: "",
  city: "",
  governorate: "",
  postalCode: "",
  paymentMethod: "stripe",
  guestMode: false,
});

const fieldError = (name, val) => {
  if (typeof val === "boolean") return "";
  if (name === "email" && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
    return "Enter a valid email";
  if (name === "phone" && val && !/^[0-9+\s()-]{7,15}$/.test(val))
    return "Enter a valid phone number";
  if (!val && name !== "password" && name !== "postalCode") return "This field is required";
  return "";
};

/* ─── Cart Page ─────────────────────────────────────────── */
const Iteams = () => {
  const { items, removeFromCart, updateQuantity, clearCart } = useCartStore();
  const navigate = useNavigate();

  const [step, setStep]             = useState("cart"); // "cart" | "checkout" | "success"
  const [form, setForm]             = useState(emptyForm());
  const [errors, setErrors]         = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Check if returning from a successful Stripe checkout session
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      clearCart();
      setStep("success");
      const sessionId = params.get("session_id");
      if (sessionId) {
        fetch(apiUrl(`/api/order-success?session_id=${encodeURIComponent(sessionId)}`)).catch(() => {});
      }
    }
  }, [clearCart]);

  const totalEGP = items.reduce((s, i) => s + i.price * i.quantity, 0);

  /* ─ Field change ─ */
  const onChange = (e) => {
    const { name, type, value, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    setErrors((err) => ({ ...err, [name]: "" }));
  };

  /* ─ Validate ─ */
  const validate = () => {
    const required = [
      "fullName", "email", "phone", "address", "city", "governorate",
      ...(form.guestMode ? [] : ["password"]),
    ];
    const newErrors = {};
    required.forEach((k) => {
      const err = fieldError(k, form[k]);
      if (err) newErrors[k] = err;
    });
    const emailErr = fieldError("email", form.email);
    if (emailErr) newErrors.email = emailErr;
    const phoneErr = fieldError("phone", form.phone);
    if (phoneErr) newErrors.phone = phoneErr;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ─ Submit ─ */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    const { password, guestMode, paymentMethod, ...customer } = form;

    if (paymentMethod === "stripe") {
      try {
        const res = await fetch(apiUrl("/api/checkout"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items, customer }),
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
        alert(data.error || "Payment could not be started.");
      } catch {
        alert("Could not reach the payment server. Please try again.");
      }
    } else {
      try {
        const res = await fetch(apiUrl("/api/checkout/cod"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items, customer }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          alert(data.error || "Could not place the order.");
          setSubmitting(false);
          return;
        }
        clearCart();
        setStep("success");
      } catch {
        alert("Could not reach the order server. Please try again.");
      }
    }
    setSubmitting(false);
  };

  /* ══════════════════ SUCCESS ════════════════ */
  if (step === "success") {
    return (
      <div className="cart-page">
        <header className="cart-header">
          <NavLink to="/" className="cart-brand">PRMPT ARCHIVE</NavLink>
        </header>
        <main className="cart-main">
          <div className="success-box">
            <div className="success-icon">✓</div>
            <h2>Order Placed!</h2>
            <p>
              {form.fullName ? (
                <>
                  Thanks, <strong>{form.fullName}</strong>. We'll contact you on{" "}
                  <strong>{form.phone}</strong> to confirm delivery.
                </>
              ) : (
                <>Thanks. Your payment was received. We'll contact you to confirm delivery.</>
              )}
            </p>
            <NavLink to="/products" className="success-cta">Continue Shopping</NavLink>
          </div>
        </main>
      </div>
    );
  }

  /* ══════════════════ CHECKOUT ════════════════ */
  if (step === "checkout") {
    return (
      <div className="cart-page">
        <header className="cart-header">
          <NavLink to="/" className="cart-brand">PRMPT ARCHIVE</NavLink>
          <nav className="cart-nav">
            <button className="cart-nav-back" onClick={() => setStep("cart")}>
              ← Back to Cart
            </button>
          </nav>
        </header>

        <main className="cart-main checkout-layout">

          {/* ── Left: form ── */}
          <form className="checkout-form" onSubmit={handleSubmit} noValidate>

            {/* 01 Account */}
            <section className="co-section">
              <h3 className="co-section__title">
                <span className="co-section__num">01</span> Account
              </h3>

              <label className="co-label">
                Full Name *
                <input
                  className={`co-input${errors.fullName ? " has-error" : ""}`}
                  name="fullName" value={form.fullName} onChange={onChange}
                  placeholder="Mohamed Ali" autoComplete="name"
                />
                {errors.fullName && <span className="co-error">{errors.fullName}</span>}
              </label>

              <label className="co-label">
                Email *
                <input
                  className={`co-input${errors.email ? " has-error" : ""}`}
                  name="email" type="email" value={form.email} onChange={onChange}
                  placeholder="you@email.com" autoComplete="email"
                />
                {errors.email && <span className="co-error">{errors.email}</span>}
              </label>

              <label className="co-checkbox-row">
                <input
                  type="checkbox" name="guestMode"
                  checked={form.guestMode} onChange={onChange}
                />
                Continue as guest (no account)
              </label>

              {!form.guestMode && (
                <label className="co-label">
                  Password *
                  <input
                    className={`co-input${errors.password ? " has-error" : ""}`}
                    name="password" type="password" value={form.password} onChange={onChange}
                    placeholder="Create a password" autoComplete="new-password"
                  />
                  {errors.password && <span className="co-error">{errors.password}</span>}
                </label>
              )}
            </section>

            {/* 02 Delivery */}
            <section className="co-section">
              <h3 className="co-section__title">
                <span className="co-section__num">02</span> Delivery
              </h3>

              <label className="co-label">
                Phone Number *
                <input
                  className={`co-input${errors.phone ? " has-error" : ""}`}
                  name="phone" type="tel" value={form.phone} onChange={onChange}
                  placeholder="010 1234 5678" autoComplete="tel"
                />
                {errors.phone && <span className="co-error">{errors.phone}</span>}
              </label>

              <label className="co-label">
                Address *
                <input
                  className={`co-input${errors.address ? " has-error" : ""}`}
                  name="address" value={form.address} onChange={onChange}
                  placeholder="Street, Building, Apt." autoComplete="street-address"
                />
                {errors.address && <span className="co-error">{errors.address}</span>}
              </label>

              <div className="co-row-2">
                <label className="co-label">
                  City *
                  <input
                    className={`co-input${errors.city ? " has-error" : ""}`}
                    name="city" value={form.city} onChange={onChange}
                    placeholder="e.g. Nasr City" autoComplete="address-level2"
                  />
                  {errors.city && <span className="co-error">{errors.city}</span>}
                </label>

                <label className="co-label">
                  Governorate *
                  <select
                    className={`co-input co-select${errors.governorate ? " has-error" : ""}`}
                    name="governorate" value={form.governorate} onChange={onChange}
                  >
                    <option value="">Select…</option>
                    {GOVERNORATES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  {errors.governorate && <span className="co-error">{errors.governorate}</span>}
                </label>
              </div>

              <label className="co-label" style={{ maxWidth: 200 }}>
                Postal Code
                <input
                  className="co-input"
                  name="postalCode" value={form.postalCode} onChange={onChange}
                  placeholder="11511" autoComplete="postal-code"
                />
              </label>
            </section>

            {/* 03 Payment */}
            <section className="co-section">
              <h3 className="co-section__title">
                <span className="co-section__num">03</span> Payment
              </h3>

              <div className="payment-options">
                <label className={`payment-option${form.paymentMethod === "stripe" ? " is-selected" : ""}`}>
                  <input type="radio" name="paymentMethod" value="stripe"
                    checked={form.paymentMethod === "stripe"} onChange={onChange} />
                  <div className="payment-option__content">
                    <div className="payment-option__icon stripe-icon">💳</div>
                    <div>
                      <p className="payment-option__name">Card / Stripe</p>
                      <p className="payment-option__desc">Pay securely online</p>
                    </div>
                  </div>
                </label>

                <label className={`payment-option${form.paymentMethod === "cod" ? " is-selected" : ""}`}>
                  <input type="radio" name="paymentMethod" value="cod"
                    checked={form.paymentMethod === "cod"} onChange={onChange} />
                  <div className="payment-option__content">
                    <div className="payment-option__icon cod-icon">💵</div>
                    <div>
                      <p className="payment-option__name">Cash on Delivery</p>
                      <p className="payment-option__desc">Pay when you receive</p>
                    </div>
                  </div>
                </label>
              </div>
            </section>

            <button type="submit" className="btn-place-order" disabled={submitting}>
              {submitting
                ? "Processing…"
                : form.paymentMethod === "stripe"
                ? "Pay with Stripe →"
                : "Place Order (COD) →"}
            </button>
          </form>

          {/* ── Right: order summary ── */}
          <aside className="order-summary">
            <h3 className="summary-title">Order Summary</h3>
            <ul className="summary-list">
              {items.map((item) => (
                <li key={item.id} className="summary-item">
                  {item.image && (
                    <div className="summary-item__img-wrap">
                      <img src={item.image} alt={item.name} className="summary-item__img" />
                      <span className="summary-item__qty">{item.quantity}</span>
                    </div>
                  )}
                  <div className="summary-item__info">
                    <p className="summary-item__name">{item.name}</p>
                    <p className="summary-item__price">
                      {(item.price * item.quantity).toLocaleString()} EGP
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="summary-divider" />
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{totalEGP.toLocaleString()} EGP</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span className="summary-free">Free</span>
            </div>
            <div className="summary-divider" />
            <div className="summary-row summary-total">
              <span>Total</span>
              <span>{totalEGP.toLocaleString()} EGP</span>
            </div>
          </aside>
        </main>
      </div>
    );
  }

  /* ══════════════════ CART REVIEW ════════════════ */
  return (
    <div className="cart-page">
      <header className="cart-header">
        <NavLink to="/" className="cart-brand">PRMPT ARCHIVE</NavLink>
        <nav className="cart-nav">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/products">Products</NavLink>
          <NavLink to="/cart">Cart</NavLink>
        </nav>
      </header>

      <main className="cart-main">
        <h1 className="cart-title">Your Cart</h1>

        {items.length === 0 ? (
          <div className="cart-empty">
            <p>Your cart is empty.</p>
            <NavLink to="/products" className="cart-empty-cta">Browse Products</NavLink>
          </div>
        ) : (
          <>
            <ul className="cart-list">
              {items.map((item) => (
                <li key={item.id} className="cart-item">
                  {item.image && (
                    <img src={item.image} alt={item.name} className="cart-item__img" />
                  )}
                  <div className="cart-item__info">
                    <p className="cart-item__name">{item.name}</p>
                    <p className="cart-item__price">
                      {(item.price * item.quantity).toLocaleString()} EGP
                    </p>
                  </div>
                  <div className="cart-item__controls">
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>−</button>
                    <span className="qty-value">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <button className="cart-item__remove" onClick={() => removeFromCart(item.id)} aria-label="Remove item">✕</button>
                </li>
              ))}
            </ul>

            <div className="cart-summary">
              <div className="cart-summary__row">
                <span>Subtotal</span>
                <span>{totalEGP.toLocaleString()} EGP</span>
              </div>
              <div className="cart-summary__actions">
                <button className="btn-clear" onClick={clearCart}>Clear Cart</button>
                <button className="btn-checkout" onClick={() => setStep("checkout")}>
                  Proceed to Checkout →
                </button>
              </div>
            </div>

            {/* Wallet widget */}
            <div className="app-container">
              <div className="wallet">
                <div className="wallet-back"></div>

                <div className="card stripe-card" style={{ cursor: "pointer" }} onClick={() => setStep("checkout")}>
                  <div className="card-inner">
                    <div className="card-top"><span>Stripe (Click to Pay)</span><div className="chip"></div></div>
                    <div className="card-bottom">
                      <div className="card-info"><span className="label">Amount Due</span><span className="value">{totalEGP.toLocaleString()} EGP</span></div>
                      <div className="card-number-wrapper"><span className="hidden-stars">**** 4242</span><span className="card-number">5524 9910 4242</span></div>
                    </div>
                  </div>
                </div>

                <div className="card wise">
                  <div className="card-inner">
                    <div className="card-top"><span>Wise</span><div className="chip"></div></div>
                    <div className="card-bottom">
                      <div className="card-info"><span className="label">Business</span><span className="value">STUDIO LLC</span></div>
                      <div className="card-number-wrapper"><span className="hidden-stars">**** 8810</span><span className="card-number">9012 4432 8810</span></div>
                    </div>
                  </div>
                </div>

                <div className="card paypal">
                  <div className="card-inner">
                    <div className="card-top"><span>Pay<b style={{ color: "#0079C1" }}>Pal</b></span><div className="chip"></div></div>
                    <div className="card-bottom">
                      <div className="card-info"><span className="label">Email</span><span className="value">hello@work.com</span></div>
                      <div className="card-number-wrapper"><span className="hidden-stars">**** 0094</span><span className="card-number">3312 0045 0094</span></div>
                    </div>
                  </div>
                </div>

                <div className="pocket">
                  <svg className="pocket-svg" viewBox="0 0 280 160" fill="none">
                    <path d="M 0 20 C 0 10, 5 10, 10 10 C 20 10, 25 25, 40 25 L 240 25 C 255 25, 260 10, 270 10 C 275 10, 280 10, 280 20 L 280 120 C 280 155, 260 160, 240 160 L 40 160 C 20 160, 0 155, 0 120 Z" fill="#1e341e" />
                    <path d="M 8 22 C 8 16, 12 16, 15 16 C 23 16, 27 29, 40 29 L 240 29 C 253 29, 257 16, 265 16 C 268 16, 272 16, 272 22 L 272 120 C 272 150, 255 152, 240 152 L 40 152 C 25 152, 8 152, 8 120 Z" stroke="#3d5635" strokeWidth="1.5" strokeDasharray="6 4" />
                  </svg>
                  <div className="pocket-content">
                    <div style={{ position: "relative", height: "24px", width: "100%" }}>
                      <div className="balance-stars">******</div>
                      <div className="balance-real">{totalEGP.toLocaleString()} EGP</div>
                    </div>
                    <div style={{ color: "#698263", fontSize: "12px", fontWeight: 500 }}>Total Due</div>
                    <div className="eye-icon-wrapper">
                      <svg className="eye-icon eye-slash" width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /><line x1="3" y1="3" x2="21" y2="21" />
                      </svg>
                      <svg className="eye-icon eye-open" style={{ opacity: 0 }} width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Iteams;
