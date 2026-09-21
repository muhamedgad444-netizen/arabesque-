import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import Stripe from "stripe";
import { Resend } from "resend";
import { createAdminClient } from "@supabase/server/core";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config();

const stripeSecret  = process.env.STRIPE_SECRET_KEY || "";
const resendApiKey  = process.env.RESEND_API_KEY || "";
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
const CLIENT_URL    = process.env.CLIENT_URL || "http://localhost:5173";
const PORT          = process.env.PORT || 3000;
const OWNER_EMAIL   = process.env.OWNER_EMAIL || "muhamedgad444@gmail.com";
const SUPABASE_URL  = process.env.SUPABASE_URL || "";
const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const allowedOrigins = CLIENT_URL.split(",").map((s) => s.trim()).filter(Boolean);

const warnings = [];
if (!stripeSecret || stripeSecret.includes("...")) warnings.push("STRIPE_SECRET_KEY missing/placeholder.");
if (!resendApiKey || resendApiKey.includes("...")) warnings.push("RESEND_API_KEY missing/placeholder.");
if (!webhookSecret || webhookSecret.includes("...")) warnings.push("STRIPE_WEBHOOK_SECRET missing — webhooks will be rejected.");
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) warnings.push("SUPABASE_URL / SUPABASE_SECRET_KEY missing — orders will not be saved.");

if (warnings.length > 0) {
  console.warn("\n[SERVER NOTICE] Configuration warnings:");
  warnings.forEach((w) => console.warn(`   • ${w}`));
  console.warn(`   → Edit: ${path.join(__dirname, ".env")}\n`);
}

const stripe = new Stripe(stripeSecret || "dummy_key");
const resend = new Resend(resendApiKey || "dummy_key");

function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) return null;
  try {
    return createAdminClient({
      env: {
        url: SUPABASE_URL,
        secretKeys: { default: SUPABASE_SECRET_KEY },
      },
    });
  } catch (err) {
    console.error("Supabase admin client error:", err.message);
    return null;
  }
}

const supabase = getSupabaseAdmin();

const app = express();
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "stripe-signature"],
}));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const checkoutLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many checkout attempts, please try again in an hour." },
});

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item && item.name && Number(item.price) > 0)
    .map((item) => ({
      id: item.id ?? null,
      name: String(item.name).slice(0, 200),
      price: Number(item.price),
      quantity: Math.max(1, Math.min(99, Number(item.quantity) || 1)),
      image: typeof item.image === "string" ? item.image.slice(0, 500) : undefined,
    }));
}

function parseAmount(totalAmount) {
  return Number(String(totalAmount).replace(/[^0-9.]/g, "")) || 0;
}

async function saveOrderToDatabase(order) {
  if (!supabase) {
    console.warn("Supabase not configured — skipping database save.");
    return { saved: false, duplicate: false };
  }

  const payload = {
    order_id: order.orderId,
    customer_email: order.customerEmail || null,
    customer_name: order.customerName || null,
    customer_phone: order.customerPhone || null,
    customer_address: order.customerAddress || null,
    customer_city: order.customerCity || null,
    customer_governorate: order.customerGovernorate || null,
    items: order.items || [],
    total_amount: parseAmount(order.totalAmount),
    currency: order.currency || "EGP",
    payment_method: order.paymentMethod,
    fulfillment_status: "pending",
  };

  const { error } = await supabase.from("orders").insert(payload);

  if (error) {
    if (error.code === "23505") return { saved: true, duplicate: true };
    console.error("Supabase insert error:", error.message);
    return { saved: false, error: error.message };
  }

  console.log(`Order ${order.orderId} saved to Supabase.`);
  return { saved: true, duplicate: false };
}

async function sendOrderEmails(order) {
  if (!resendApiKey || resendApiKey.includes("...")) return;

  const FROM = process.env.EMAIL_FROM || "Arabesque <onboarding@resend.dev>";
  const currency = escapeHtml(order.currency || "EGP");
  const items = Array.isArray(order.items) ? order.items : [];

  const itemsHtml = items.length
    ? `<table style="width:100%;border-collapse:collapse;margin-top:8px;">
        <thead>
          <tr style="background:#f0f0f0;">
            <th style="text-align:left;padding:8px;border:1px solid #ddd;">Item</th>
            <th style="text-align:center;padding:8px;border:1px solid #ddd;">Qty</th>
            <th style="text-align:right;padding:8px;border:1px solid #ddd;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((i) => `<tr>
            <td style="padding:8px;border:1px solid #ddd;">${escapeHtml(i.name || "Item")}</td>
            <td style="text-align:center;padding:8px;border:1px solid #ddd;">${escapeHtml(i.quantity || 1)}</td>
            <td style="text-align:right;padding:8px;border:1px solid #ddd;">${Number(i.price).toLocaleString()} ${currency}</td>
          </tr>`).join("")}
        </tbody>
      </table>`
    : "";

  try {
    await resend.emails.send({
      from: FROM,
      to: [OWNER_EMAIL],
      subject: `New Order: ${order.orderId} — ${order.paymentMethod}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;border:2px solid #111;border-radius:8px;">
          <h1 style="color:#111;margin-bottom:4px;">New Order Received</h1>
          <p style="color:#555;font-size:14px;margin-top:0;">Payment: <strong>${escapeHtml(order.paymentMethod)}</strong></p>
          <div style="background:#f7f7f7;padding:16px;border-radius:6px;margin:16px 0;">
            <p style="margin:4px 0;"><strong>Order ID:</strong> ${escapeHtml(order.orderId)}</p>
            <p style="margin:4px 0;"><strong>Total:</strong> ${escapeHtml(order.totalAmount)} ${currency}</p>
          </div>
          <h3 style="margin-bottom:4px;">Customer</h3>
          <div style="background:#fff8f0;padding:16px;border-radius:6px;border:1px solid #ffd9a0;margin-bottom:16px;">
            <p style="margin:4px 0;"><strong>Name:</strong> ${escapeHtml(order.customerName)}</p>
            <p style="margin:4px 0;"><strong>Email:</strong> ${escapeHtml(order.customerEmail || "Not provided")}</p>
            <p style="margin:4px 0;"><strong>Phone:</strong> ${escapeHtml(order.customerPhone || "Not provided")}</p>
            ${order.customerAddress ? `<p style="margin:4px 0;"><strong>Address:</strong> ${escapeHtml(order.customerAddress)}, ${escapeHtml(order.customerCity || "")}, ${escapeHtml(order.customerGovernorate || "")}</p>` : ""}
          </div>
          ${itemsHtml ? `<h3 style="margin-bottom:4px;">Items</h3>${itemsHtml}` : ""}
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
          <p style="color:#999;font-size:12px;text-align:center;">Arabesque — Owner Notification</p>
        </div>`,
    });
    console.log(`Owner notification → ${OWNER_EMAIL}`);
  } catch (err) {
    console.error("Owner email error:", err.message);
  }

  if (!order.customerEmail) return;

  try {
    await resend.emails.send({
      from: FROM,
      to: [order.customerEmail],
      subject: "Order Confirmed — Arabesque",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e0e0e0;border-radius:8px;">
          <h1 style="color:#111;margin-bottom:8px;">Order Confirmed</h1>
          <p style="color:#555;font-size:16px;">Thank you, <strong>${escapeHtml(order.customerName)}</strong>.</p>
          <div style="background:#f7f7f7;padding:16px;border-radius:6px;margin:20px 0;">
            <p style="margin:4px 0;"><strong>Order ID:</strong> ${escapeHtml(order.orderId)}</p>
            <p style="margin:4px 0;"><strong>Payment:</strong> ${escapeHtml(order.paymentMethod)}</p>
            <p style="margin:4px 0;"><strong>Total:</strong> ${escapeHtml(order.totalAmount)} ${currency}</p>
            ${order.customerAddress ? `<p style="margin:12px 0 4px;"><strong>Delivery to:</strong><br/>${escapeHtml(order.customerAddress)}, ${escapeHtml(order.customerCity || "")}, ${escapeHtml(order.customerGovernorate || "")}</p>` : ""}
          </div>
          ${itemsHtml ? `<h3>Your Items</h3>${itemsHtml}` : ""}
          <p style="color:#666;font-size:14px;margin-top:20px;">
            We will contact you${order.customerPhone ? ` on <strong>${escapeHtml(order.customerPhone)}</strong>` : ""} regarding delivery.
          </p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
          <p style="color:#999;font-size:12px;text-align:center;">Arabesque</p>
        </div>`,
    });
    console.log(`Customer confirmation → ${order.customerEmail}`);
  } catch (err) {
    console.error("Customer email error:", err.message);
  }
}

async function itemsFromStripeSession(session) {
  try {
    const full = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["line_items"],
    });
    return (full.line_items?.data || []).map((li) => ({
      name: li.description || "Item",
      quantity: li.quantity || 1,
      price: ((li.amount_total || 0) / 100) / (li.quantity || 1),
    }));
  } catch (err) {
    console.error("Failed to load Stripe line items:", err.message);
    return [];
  }
}

app.post(
  "/api/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    if (!webhookSecret || webhookSecret.includes("...")) {
      return res.status(500).send("STRIPE_WEBHOOK_SECRET is not configured.");
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error(`Webhook signature error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const customerEmail = session.customer_details?.email || session.customer_email;
      const customerName = session.customer_details?.name || session.metadata?.customerName || "Customer";
      const totalAmount = session.amount_total ? (session.amount_total / 100).toFixed(2) : "0.00";
      const currency = (session.currency || "egp").toUpperCase();
      const items = await itemsFromStripeSession(session);

      const orderData = {
        orderId: session.id,
        customerEmail,
        customerName,
        customerPhone: session.metadata?.customerPhone || "",
        customerAddress: session.metadata?.customerAddress || "",
        customerCity: session.metadata?.customerCity || "",
        customerGovernorate: session.metadata?.customerGovernorate || "",
        items,
        totalAmount,
        currency,
        paymentMethod: "Card Payment (Stripe)",
      };

      const result = await saveOrderToDatabase(orderData);
      if (!result.duplicate) {
        await sendOrderEmails(orderData);
      }
    }

    res.json({ received: true });
  }
);

app.use("/api", (req, res, next) => {
  if (req.path === "/webhook") return next();
  return generalLimiter(req, res, next);
});

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Arabesque Server is running.",
    stripe: Boolean(stripeSecret && !stripeSecret.includes("...")),
    resend: Boolean(resendApiKey && !resendApiKey.includes("...")),
    webhook: Boolean(webhookSecret && !webhookSecret.includes("...")),
    supabase: Boolean(supabase),
  });
});

app.post("/api/checkout", checkoutLimiter, async (req, res) => {
  try {
    if (!stripeSecret || stripeSecret.includes("...")) {
      return res.status(500).json({ error: "Stripe is not configured." });
    }

    const items = sanitizeItems(req.body?.items);
    const customer = req.body?.customer || {};

    if (!items.length) {
      return res.status(400).json({ error: "Cart is empty." });
    }

    const lineItems = items.map((item) => ({
      price_data: {
        currency: "egp",
        product_data: {
          name: item.name,
          ...(item.image && item.image.startsWith("http") ? { images: [item.image] } : {}),
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const sessionParams = {
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${allowedOrigins[0]}/cart?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${allowedOrigins[0]}/cart?canceled=true`,
      metadata: {
        customerName: String(customer.fullName || "").slice(0, 400),
        customerPhone: String(customer.phone || "").slice(0, 40),
        customerAddress: String(customer.address || "").slice(0, 400),
        customerCity: String(customer.city || "").slice(0, 120),
        customerGovernorate: String(customer.governorate || "").slice(0, 120),
      },
    };

    if (customer.email) sessionParams.customer_email = String(customer.email).slice(0, 200);

    const session = await stripe.checkout.sessions.create(sessionParams);
    res.json({ url: session.url, id: session.id });
  } catch (err) {
    console.error("Stripe checkout error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/checkout/cod", checkoutLimiter, async (req, res) => {
  try {
    const items = sanitizeItems(req.body?.items);
    const customer = req.body?.customer || {};

    if (!items.length) {
      return res.status(400).json({ error: "Cart is empty." });
    }

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orderId = "COD-" + Math.floor(100000 + Math.random() * 900000);

    const orderData = {
      orderId,
      customerName: customer.fullName || "Customer",
      customerEmail: customer.email || "",
      customerPhone: customer.phone || "",
      customerAddress: customer.address || "",
      customerCity: customer.city || "",
      customerGovernorate: customer.governorate || "",
      items,
      totalAmount: totalAmount.toLocaleString(),
      currency: "EGP",
      paymentMethod: "Cash on Delivery",
    };

    await saveOrderToDatabase(orderData);
    await sendOrderEmails(orderData);

    res.json({ success: true, orderId });
  } catch (err) {
    console.error("COD order error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/order-success", async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) return res.status(400).json({ error: "Missing session_id" });
    if (!stripeSecret || stripeSecret.includes("...")) {
      return res.status(500).json({ error: "Stripe is not configured." });
    }

    const session = await stripe.checkout.sessions.retrieve(String(session_id));
    return res.json({
      success: true,
      paid: session.payment_status === "paid",
      orderId: session.id,
    });
  } catch (err) {
    console.error("Order verification error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Arabesque Server → http://localhost:${PORT}`);
    console.log(`Supabase: ${supabase ? "connected" : "not configured"}`);
  });
}

export default app;
