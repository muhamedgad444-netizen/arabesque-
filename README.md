# Arabesque 

**Live Demo:** [https://arabesque-five.vercel.app/](https://arabesque-five.vercel.app/)

Arabesque is a premium, full-stack e-commerce web application. Designed with a sleek, minimalist aesthetic, it features advanced custom UI interactions and a robust, production-ready backend that handles real payments, database management, and automated email confirmations.

## 🚀 Features

- **Custom UI/UX:** Features interactive video scrubbing headers, sleek cart drawer management, and custom CSS animations (like the interactive payment wallet).
- **Secure Payments:** Fully integrated with **Stripe** to securely process credit card transactions and handle webhooks.
- **Alternative Payment Methods:** Includes full support for Cash on Delivery (COD) workflows.
- **Database Management:** Connects to **Supabase** (PostgreSQL) to securely store and track all customer orders in real-time.
- **Automated Emails:** Uses the **Resend API** to instantly send beautiful, branded email receipts to customers and order notifications to the store owner.
- **Responsive Design:** Completely optimized for both desktop and mobile shopping experiences.

## 💻 Tech Stack

- **Frontend:** React, Vite, Framer Motion (for smooth animations), React Router.
- **Backend:** Node.js, Express.js (deployed as Vercel Serverless Functions).
- **Database & Auth:** Supabase.
- **Payments:** Stripe API.
- **Email:** Resend API.
- **Deployment:** Vercel & Cloudflare (DNS).

## 🛠️ Local Development

To run this project locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/muhamedgad444-netizen/arabesque-.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file in the `src/Server/` directory.
   - Add your API keys for Stripe, Supabase, and Resend (reference `src/Server/server.js` for required variables).
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
5. Start the backend Node server:
   ```bash
   node src/Server/server.js
   ```

## 📸 Preview

*Visit the [live site](https://arabesque-five.vercel.app/) to see the interactive features and experience the checkout flow!*
