# 📋 Daily Plan and Report — Minimalist Dark Edition

A clean, super simple issue tracking web application for **5 PPIC (Production Planning & Inventory Control)** units with a monthly calendar view, unresolved issue duration tracker pinned on top, customizable PPIC names, and an understated dark minimalist design.

---

## ✨ Features

1. **5 PPIC Management**:
   - `PPIC 1`, `PPIC 2`, `PPIC 3`, `PPIC 4`, `PPIC 5` with fast filtering.
   - **Customizable Names**: Edit and customize the labels for each PPIC (e.g., Raw Materials, Production Line, Packaging) directly from the header.

2. **Unresolved Issues Pinned on Top (With Live Duration)**:
   - Always prominent at the top of the interface.
   - **Live elapsed duration tracker** (e.g., `4h 12m ago`, `1d 4h ago` with subtle warning indicator if > 24 hours).
   - 1-Click **`[Resolve]`** action button.

3. **Fast 1-Row Add Issue Form**:
   - Select PPIC &rarr; Type issue &rarr; Pick date &rarr; Click **Add Issue**. Done in 3 seconds!

4. **Monthly Calendar View**:
   - Clean monthly calendar grid with month navigation.
   - Click any date to view and manage that day's specific issue log below.

5. **Minimalist Dark Aesthetic**:
   - Pure OLED Black (`#000000`) background with subtle frosted glass surfaces.
   - Crisp white typography and understated monochrome badges (no gaudy rainbow colors).

6. **100% Local Storage**:
   - Automatically saved to your browser's `localStorage`. No external database required.

---

## 💻 Running Locally

The local development server is running at:
👉 **http://localhost:3000**

To restart anytime from terminal:
```bash
npm run dev
```

---

## 🐙 Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/ppic-issue-hub.git
git push -u origin main
```

---

## ⚡ Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **Add New Project** and select `ppic-issue-hub`.
3. Click **Deploy**. Your app will be live globally in under 1 minute!
