---
name: dynamic-footer-system
description: ফুটার সম্পূর্ণ ডায়নামিক — site_settings.footer_menu_sections JSON থেকে চলে। AdminPages থেকে section/link CRUD, icon ও accent color পরিবর্তন। পেজ কন্টেন্ট MDEditor (Markdown) দিয়ে এডিট হয়।
type: feature
---

ফুটার মেনু সম্পূর্ণ ডায়নামিক — `useFooterMenu` hook `site_settings.footer_menu_sections` JSON থেকে data নেয়, সেখানে section list (id, title, icon, accent color, sort_order, is_active, links[]) থাকে। `Footer.tsx`-এ ICON_MAP দিয়ে icon name → lucide component resolve হয়।

`/ceo/pages` (AdminPages.tsx) এ দুটি ট্যাব:
1. **Footer Menu** — সেকশন যোগ/রিনেম/রিঅর্ডার/হাইড/ডিলিট, প্রতিটি সেকশনের icon ও accent color পরিবর্তন, ভেতরের link CRUD (label, URL, external flag, hide/show)।
2. **Page Content** — ৯টি পেজ (About, Privacy, Terms, Refund, Order, Delivery, Return, FAQs, Contact) — `@uiw/react-md-editor` দিয়ে section-based Markdown এডিটিং, ChevronUp/Down দিয়ে section reorder।

কন্টেন্ট save হয় `site_settings.page_content_<key>` JSON-এ। `usePageContent` hook frontend থেকে load করে। Default fallback hardcoded JSX থেকে আসে যদি DB empty থাকে।
