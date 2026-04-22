---
name: CID Gateway — provider-agnostic abstraction
description: get-cid edge function — multi-channel routing with full provider name redaction. Resellers/end-users see only generic "CID Gateway" with Primary/Backup channels — never upstream names (GetCID, Grahok) or URLs.
type: feature
---

`get-cid` এজ ফাংশন CID ডেলিভারির জন্য একাধিক upstream channel ব্যবহার করে কিন্তু **প্রোভাইডারের নাম সম্পূর্ণ গোপন রাখে**:

- **Reseller-facing responses (`action: getcid`, `balance`)** থেকে `provider` ফিল্ড সরানো হয়েছে।
- **Balance check** এ resellers শুধু একটি aggregated number দেখে, কোন provider থেকে এসেছে দেখে না।
- **Failure** হলে generic message: *"CID generation temporarily unavailable. Please try again."* — কখনোই provider name বা upstream raw error leak হয় না।
- **Admin UI** (`/ceo/getcid-tools`) এ branding: "**CID Gateway Tools**", channels labeled as "**Primary Channel**" / "**Backup Channel**" (internally `getcid` / `grahok` keys preserved শুধু admin tooling এর জন্য)।
- **Docs tab** এখন internal endpoint documentation দেখায়, upstream URL এর পরিবর্তে নিজেদের `{SUPABASE_URL}/functions/v1/get-cid` দেখায়।
- Admin tools (`admin_generate`, `admin_compare`, `admin_batch`, `admin_history`) JWT + admin role দ্বারা সুরক্ষিত, billing bypass করে।
- Smart routing: Primary first → fallback to Backup automatically। Pricing: $1/CID (resellers), free (admin)।
