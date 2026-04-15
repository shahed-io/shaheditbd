import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const tools = [
  // ═══════════════ ORDERS ═══════════════
  {
    type: "function",
    function: {
      name: "get_orders",
      description: "Get orders with filters. View, search, or summarize orders.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["pending", "processing", "completed", "cancelled", "refunded", "delivered", "failed"] },
          limit: { type: "number" },
          search: { type: "string", description: "Search by order number, customer name, or phone" },
          date_from: { type: "string", description: "YYYY-MM-DD" },
          date_to: { type: "string", description: "YYYY-MM-DD" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_order_status",
      description: "Update an order's status",
      parameters: {
        type: "object",
        properties: {
          order_id: { type: "string", description: "Order UUID or order number" },
          new_status: { type: "string", enum: ["pending", "processing", "completed", "cancelled", "refunded", "delivered", "failed"] },
          admin_notes: { type: "string" },
        },
        required: ["order_id", "new_status"],
      },
    },
  },
  // ═══════════════ PRODUCTS ═══════════════
  {
    type: "function",
    function: {
      name: "get_products",
      description: "Get products with filters",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["active", "draft", "out_of_stock"] },
          limit: { type: "number" },
          search: { type: "string" },
          category_id: { type: "string" },
          sort_by: { type: "string", enum: ["created_at", "price", "total_sales", "name"] },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_product",
      description: "Update a product's fields",
      parameters: {
        type: "object",
        properties: {
          product_id: { type: "string", description: "Product UUID or slug" },
          updates: {
            type: "object",
            properties: {
              name: { type: "string" },
              price: { type: "number" },
              original_price: { type: "number" },
              status: { type: "string", enum: ["active", "draft", "out_of_stock"] },
              stock_quantity: { type: "number" },
              description: { type: "string" },
              short_description: { type: "string" },
              is_featured: { type: "boolean" },
              badge: { type: "string" },
              seo_title: { type: "string" },
              seo_description: { type: "string" },
              discount_percent: { type: "number" },
              delivery_time: { type: "string" },
              warranty_note: { type: "string" },
              refund_note: { type: "string" },
            },
          },
        },
        required: ["product_id", "updates"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_product",
      description: "Create a new product",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          slug: { type: "string" },
          price: { type: "number" },
          original_price: { type: "number" },
          description: { type: "string" },
          short_description: { type: "string" },
          category_id: { type: "string" },
          status: { type: "string", enum: ["active", "draft"] },
          is_featured: { type: "boolean" },
          stock_quantity: { type: "number" },
          badge: { type: "string" },
        },
        required: ["name", "slug", "price"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_product",
      description: "Delete a product by ID or slug",
      parameters: {
        type: "object",
        properties: { product_id: { type: "string" } },
        required: ["product_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_low_stock_products",
      description: "Get products with low stock",
      parameters: {
        type: "object",
        properties: { threshold: { type: "number", description: "Default 5" } },
      },
    },
  },
  // ═══════════════ DASHBOARD & ANALYTICS ═══════════════
  {
    type: "function",
    function: {
      name: "get_dashboard_stats",
      description: "Get sales stats, revenue, order counts for dashboard",
      parameters: {
        type: "object",
        properties: {
          period: { type: "string", enum: ["today", "yesterday", "week", "month", "year", "all"] },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_revenue_report",
      description: "Get detailed revenue breakdown by day/week",
      parameters: {
        type: "object",
        properties: {
          date_from: { type: "string", description: "YYYY-MM-DD" },
          date_to: { type: "string", description: "YYYY-MM-DD" },
          group_by: { type: "string", enum: ["day", "week", "month"] },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_top_products",
      description: "Get best selling products",
      parameters: {
        type: "object",
        properties: { limit: { type: "number" }, period: { type: "string", enum: ["week", "month", "year", "all"] } },
      },
    },
  },
  // ═══════════════ CUSTOMERS ═══════════════
  {
    type: "function",
    function: {
      name: "get_customers",
      description: "Get customer list",
      parameters: {
        type: "object",
        properties: { search: { type: "string" }, limit: { type: "number" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_customer",
      description: "Update customer wallet, points, or profile",
      parameters: {
        type: "object",
        properties: {
          user_id: { type: "string" },
          updates: {
            type: "object",
            properties: {
              wallet_balance: { type: "number" },
              points_balance: { type: "number" },
              display_name: { type: "string" },
              phone: { type: "string" },
            },
          },
        },
        required: ["user_id", "updates"],
      },
    },
  },
  // ═══════════════ SUPPORT ═══════════════
  {
    type: "function",
    function: {
      name: "get_support_tickets",
      description: "Get support tickets",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["open", "in_progress", "resolved", "closed"] },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "reply_to_ticket",
      description: "Reply to a support ticket as admin",
      parameters: {
        type: "object",
        properties: { ticket_id: { type: "string" }, message: { type: "string" } },
        required: ["ticket_id", "message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_ticket_status",
      description: "Update a support ticket status",
      parameters: {
        type: "object",
        properties: {
          ticket_id: { type: "string" },
          status: { type: "string", enum: ["open", "in_progress", "resolved", "closed"] },
        },
        required: ["ticket_id", "status"],
      },
    },
  },
  // ═══════════════ CATEGORIES ═══════════════
  {
    type: "function",
    function: {
      name: "get_categories",
      description: "Get all categories",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "create_category",
      description: "Create a new category",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          slug: { type: "string" },
          description: { type: "string" },
          is_active: { type: "boolean" },
          sort_order: { type: "number" },
        },
        required: ["name", "slug"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_category",
      description: "Update a category",
      parameters: {
        type: "object",
        properties: {
          category_id: { type: "string" },
          updates: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              is_active: { type: "boolean" },
              sort_order: { type: "number" },
            },
          },
        },
        required: ["category_id", "updates"],
      },
    },
  },
  // ═══════════════ SITE SETTINGS ═══════════════
  {
    type: "function",
    function: {
      name: "get_site_settings",
      description: "Get site settings by category (general, appearance, store, seo, social, payment, announcement, popup, hero, footer)",
      parameters: {
        type: "object",
        properties: { category: { type: "string" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_site_setting",
      description: "Update a site setting (key-value). Common keys: announcement_text, announcement_active, popup_title, popup_image, popup_active, hero_title, hero_subtitle, footer_about, payment_bkash_number, payment_nagad_number, etc.",
      parameters: {
        type: "object",
        properties: {
          key: { type: "string" },
          value: { type: "string" },
          category: { type: "string" },
        },
        required: ["key", "value"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "bulk_update_settings",
      description: "Update multiple site settings at once",
      parameters: {
        type: "object",
        properties: {
          settings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                key: { type: "string" },
                value: { type: "string" },
                category: { type: "string" },
              },
              required: ["key", "value"],
            },
          },
        },
        required: ["settings"],
      },
    },
  },
  // ═══════════════ COUPONS ═══════════════
  {
    type: "function",
    function: {
      name: "get_coupons",
      description: "Get all coupons",
      parameters: {
        type: "object",
        properties: { is_active: { type: "boolean" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_coupon",
      description: "Create a new coupon",
      parameters: {
        type: "object",
        properties: {
          code: { type: "string" },
          discount_type: { type: "string", enum: ["percentage", "fixed"] },
          discount_value: { type: "number" },
          min_order_amount: { type: "number" },
          max_uses: { type: "number" },
          expires_at: { type: "string", description: "ISO date" },
          description: { type: "string" },
          is_active: { type: "boolean" },
        },
        required: ["code", "discount_type", "discount_value"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_coupon",
      description: "Update or deactivate a coupon",
      parameters: {
        type: "object",
        properties: {
          coupon_id: { type: "string" },
          updates: {
            type: "object",
            properties: {
              is_active: { type: "boolean" },
              discount_value: { type: "number" },
              max_uses: { type: "number" },
              expires_at: { type: "string" },
              description: { type: "string" },
            },
          },
        },
        required: ["coupon_id", "updates"],
      },
    },
  },
  // ═══════════════ BLOG ═══════════════
  {
    type: "function",
    function: {
      name: "get_blog_posts",
      description: "Get blog posts",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["draft", "published"] },
          limit: { type: "number" },
          search: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_blog_post",
      description: "Create a new blog post",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          slug: { type: "string" },
          content: { type: "string" },
          excerpt: { type: "string" },
          status: { type: "string", enum: ["draft", "published"] },
          seo_title: { type: "string" },
          seo_description: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          is_featured: { type: "boolean" },
        },
        required: ["title", "slug", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_blog_post",
      description: "Update a blog post",
      parameters: {
        type: "object",
        properties: {
          post_id: { type: "string" },
          updates: {
            type: "object",
            properties: {
              title: { type: "string" },
              content: { type: "string" },
              excerpt: { type: "string" },
              status: { type: "string", enum: ["draft", "published"] },
              seo_title: { type: "string" },
              seo_description: { type: "string" },
              is_featured: { type: "boolean" },
            },
          },
        },
        required: ["post_id", "updates"],
      },
    },
  },
  // ═══════════════ REVIEWS ═══════════════
  {
    type: "function",
    function: {
      name: "get_recent_reviews",
      description: "Get recent product reviews",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["pending", "approved", "rejected"] },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_review_status",
      description: "Approve or reject a product review",
      parameters: {
        type: "object",
        properties: {
          review_id: { type: "string" },
          status: { type: "string", enum: ["approved", "rejected"] },
        },
        required: ["review_id", "status"],
      },
    },
  },
  // ═══════════════ NEWSLETTER ═══════════════
  {
    type: "function",
    function: {
      name: "get_newsletter_stats",
      description: "Get newsletter subscriber stats",
      parameters: { type: "object", properties: {} },
    },
  },
  // ═══════════════ AI CONTENT ═══════════════
  {
    type: "function",
    function: {
      name: "generate_content",
      description: "Generate AI content: product description, blog post, SEO meta, announcement text, etc.",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["product_description", "blog_post", "seo_meta", "announcement", "social_post", "email_template"] },
          context: { type: "string", description: "Product name, topic, or context for content generation" },
          language: { type: "string", enum: ["bangla", "english", "mixed"], description: "Output language" },
          tone: { type: "string", enum: ["professional", "casual", "persuasive", "informative"] },
        },
        required: ["type", "context"],
      },
    },
  },
];

// ─── Resolve product ID from UUID or slug ───
async function resolveProductId(id: string, sb: any): Promise<string> {
  if (id.includes("-") && id.length > 30) return id;
  const { data } = await sb.from("products").select("id").eq("slug", id).maybeSingle();
  return data?.id || id;
}

// ─── Resolve order ID from UUID or order number ───
async function resolveOrderId(id: string, sb: any): Promise<string> {
  if (id.includes("-") && id.length > 30) return id;
  const { data } = await sb.from("orders").select("id").eq("order_number", id).maybeSingle();
  return data?.id || id;
}

// ─── Tool executor ───
async function executeTool(name: string, args: Record<string, any>, sb: any, apiKey: string): Promise<string> {
  try {
    switch (name) {
      // ORDERS
      case "get_orders": {
        let q = sb.from("orders").select("id, order_number, customer_name, customer_email, customer_phone, status, total, payment_method, payment_status, created_at, admin_notes, coupon_code, discount_amount").order("created_at", { ascending: false }).limit(args.limit || 10);
        if (args.status) q = q.eq("status", args.status);
        if (args.search) q = q.or(`order_number.ilike.%${args.search}%,customer_name.ilike.%${args.search}%,customer_phone.ilike.%${args.search}%`);
        if (args.date_from) q = q.gte("created_at", args.date_from);
        if (args.date_to) q = q.lte("created_at", args.date_to + "T23:59:59");
        const { data, error } = await q;
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ orders: data, count: data?.length });
      }

      case "update_order_status": {
        const oid = await resolveOrderId(args.order_id, sb);
        const upd: any = { status: args.new_status };
        if (args.admin_notes) upd.admin_notes = args.admin_notes;
        const { data, error } = await sb.from("orders").update(upd).eq("id", oid).select("id, order_number, status").single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, order: data, action: "order_updated" });
      }

      // PRODUCTS
      case "get_products": {
        let q = sb.from("products").select("id, name, slug, price, original_price, status, stock_quantity, is_featured, total_sales, category_id, badge, created_at").order(args.sort_by || "created_at", { ascending: false }).limit(args.limit || 10);
        if (args.status) q = q.eq("status", args.status);
        if (args.search) q = q.ilike("name", `%${args.search}%`);
        if (args.category_id) q = q.eq("category_id", args.category_id);
        const { data, error } = await q;
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ products: data, count: data?.length });
      }

      case "update_product": {
        const pid = await resolveProductId(args.product_id, sb);
        const { data, error } = await sb.from("products").update(args.updates).eq("id", pid).select("id, name, price, status, stock_quantity").single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, product: data, action: "product_updated" });
      }

      case "create_product": {
        const { data, error } = await sb.from("products").insert({
          name: args.name,
          slug: args.slug,
          price: args.price,
          original_price: args.original_price,
          description: args.description,
          short_description: args.short_description,
          category_id: args.category_id,
          status: args.status || "draft",
          is_featured: args.is_featured || false,
          stock_quantity: args.stock_quantity || 0,
          badge: args.badge,
        }).select("id, name, slug, price, status").single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, product: data, action: "product_created" });
      }

      case "delete_product": {
        const pid = await resolveProductId(args.product_id, sb);
        const { error } = await sb.from("products").delete().eq("id", pid);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, action: "product_deleted" });
      }

      case "get_low_stock_products": {
        const t = args.threshold || 5;
        const { data, error } = await sb.from("products").select("id, name, slug, stock_quantity, status").eq("status", "active").lte("stock_quantity", t).order("stock_quantity");
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ low_stock_products: data, count: data?.length });
      }

      // DASHBOARD
      case "get_dashboard_stats": {
        const period = args.period || "today";
        const now = new Date();
        let dateFilter: string | null = null;
        if (period === "today") dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        else if (period === "yesterday") { const d = new Date(now); d.setDate(d.getDate() - 1); dateFilter = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString(); }
        else if (period === "week") { const d = new Date(now); d.setDate(d.getDate() - 7); dateFilter = d.toISOString(); }
        else if (period === "month") { const d = new Date(now); d.setMonth(d.getMonth() - 1); dateFilter = d.toISOString(); }
        else if (period === "year") { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); dateFilter = d.toISOString(); }

        let oq = sb.from("orders").select("id, total, status, created_at");
        if (dateFilter) oq = oq.gte("created_at", dateFilter);
        const { data: orders } = await oq;

        const totalOrders = orders?.length || 0;
        const completed = orders?.filter((o: any) => o.status === "completed" || o.status === "delivered") || [];
        const revenue = completed.reduce((s: number, o: any) => s + Number(o.total), 0);
        const pending = orders?.filter((o: any) => o.status === "pending")?.length || 0;
        const { count: customers } = await sb.from("profiles").select("id", { count: "exact", head: true });
        const { count: products } = await sb.from("products").select("id", { count: "exact", head: true }).eq("status", "active");

        return JSON.stringify({ period, total_orders: totalOrders, completed_orders: completed.length, pending_orders: pending, total_revenue: revenue, total_customers: customers, active_products: products });
      }

      case "get_revenue_report": {
        let q = sb.from("orders").select("total, status, created_at").in("status", ["completed", "delivered"]);
        if (args.date_from) q = q.gte("created_at", args.date_from);
        if (args.date_to) q = q.lte("created_at", args.date_to + "T23:59:59");
        const { data, error } = await q;
        if (error) return JSON.stringify({ error: error.message });

        const grouped: Record<string, number> = {};
        for (const o of data || []) {
          const d = new Date(o.created_at);
          let key: string;
          if (args.group_by === "month") key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          else if (args.group_by === "week") { const w = Math.ceil(d.getDate() / 7); key = `${d.getFullYear()}-W${w}`; }
          else key = d.toISOString().split("T")[0];
          grouped[key] = (grouped[key] || 0) + Number(o.total);
        }
        return JSON.stringify({ revenue_by_period: grouped, total: Object.values(grouped).reduce((a, b) => a + b, 0) });
      }

      case "get_top_products": {
        const { data, error } = await sb.from("products").select("id, name, slug, price, total_sales, status").eq("status", "active").order("total_sales", { ascending: false }).limit(args.limit || 10);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ top_products: data });
      }

      // CUSTOMERS
      case "get_customers": {
        let q = sb.from("profiles").select("id, user_id, display_name, email, phone, wallet_balance, points_balance, created_at").order("created_at", { ascending: false }).limit(args.limit || 10);
        if (args.search) q = q.or(`display_name.ilike.%${args.search}%,email.ilike.%${args.search}%`);
        const { data, error } = await q;
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ customers: data, count: data?.length });
      }

      case "update_customer": {
        const { data, error } = await sb.from("profiles").update(args.updates).eq("user_id", args.user_id).select("user_id, display_name, email, wallet_balance, points_balance").single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, customer: data, action: "customer_updated" });
      }

      // SUPPORT
      case "get_support_tickets": {
        let q = sb.from("support_tickets").select("id, ticket_number, subject, status, priority, customer_name, customer_email, created_at").order("created_at", { ascending: false }).limit(args.limit || 10);
        if (args.status) q = q.eq("status", args.status);
        const { data, error } = await q;
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ tickets: data, count: data?.length });
      }

      case "reply_to_ticket": {
        const { data, error } = await sb.from("support_replies").insert({ ticket_id: args.ticket_id, message: args.message, author_name: "AI Assistant", is_admin: true }).select().single();
        if (error) return JSON.stringify({ error: error.message });
        await sb.from("support_tickets").update({ status: "in_progress" }).eq("id", args.ticket_id);
        return JSON.stringify({ success: true, reply: data, action: "ticket_replied" });
      }

      case "update_ticket_status": {
        const { data, error } = await sb.from("support_tickets").update({ status: args.status }).eq("id", args.ticket_id).select("id, ticket_number, status").single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, ticket: data, action: "ticket_updated" });
      }

      // CATEGORIES
      case "get_categories": {
        const { data, error } = await sb.from("categories").select("id, name, slug, is_active, sort_order, parent_id, description").order("sort_order");
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ categories: data });
      }

      case "create_category": {
        const { data, error } = await sb.from("categories").insert({
          name: args.name, slug: args.slug, description: args.description,
          is_active: args.is_active ?? true, sort_order: args.sort_order || 0,
        }).select("id, name, slug").single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, category: data, action: "category_created" });
      }

      case "update_category": {
        const { data, error } = await sb.from("categories").update(args.updates).eq("id", args.category_id).select("id, name, slug").single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, category: data, action: "category_updated" });
      }

      // SETTINGS
      case "get_site_settings": {
        let q = sb.from("site_settings").select("key, value, category");
        if (args.category) q = q.eq("category", args.category);
        const { data, error } = await q;
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ settings: data });
      }

      case "update_site_setting": {
        const { data, error } = await sb.from("site_settings").upsert({ key: args.key, value: args.value, category: args.category || "general" }, { onConflict: "key" }).select().single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, setting: data, action: "setting_updated" });
      }

      case "bulk_update_settings": {
        const results = [];
        for (const s of args.settings) {
          const { data, error } = await sb.from("site_settings").upsert({ key: s.key, value: s.value, category: s.category || "general" }, { onConflict: "key" }).select().single();
          results.push(error ? { key: s.key, error: error.message } : { key: s.key, success: true });
        }
        return JSON.stringify({ results, action: "settings_bulk_updated" });
      }

      // COUPONS
      case "get_coupons": {
        let q = sb.from("coupons").select("*").order("created_at", { ascending: false });
        if (args.is_active !== undefined) q = q.eq("is_active", args.is_active);
        const { data, error } = await q;
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ coupons: data });
      }

      case "create_coupon": {
        const { data, error } = await sb.from("coupons").insert({
          code: args.code.toUpperCase(),
          discount_type: args.discount_type,
          discount_value: args.discount_value,
          min_order_amount: args.min_order_amount || 0,
          max_uses: args.max_uses,
          expires_at: args.expires_at,
          description: args.description,
          is_active: args.is_active ?? true,
        }).select().single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, coupon: data, action: "coupon_created" });
      }

      case "update_coupon": {
        const { data, error } = await sb.from("coupons").update(args.updates).eq("id", args.coupon_id).select().single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, coupon: data, action: "coupon_updated" });
      }

      // BLOG
      case "get_blog_posts": {
        let q = sb.from("blog_posts").select("id, title, slug, status, views, is_featured, published_at, created_at").order("created_at", { ascending: false }).limit(args.limit || 10);
        if (args.status) q = q.eq("status", args.status);
        if (args.search) q = q.ilike("title", `%${args.search}%`);
        const { data, error } = await q;
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ posts: data, count: data?.length });
      }

      case "create_blog_post": {
        const { data, error } = await sb.from("blog_posts").insert({
          title: args.title, slug: args.slug, content: args.content,
          excerpt: args.excerpt, status: args.status || "draft",
          seo_title: args.seo_title, seo_description: args.seo_description,
          tags: args.tags || [], is_featured: args.is_featured || false,
          author_name: "Admin",
          published_at: args.status === "published" ? new Date().toISOString() : null,
        }).select("id, title, slug, status").single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, post: data, action: "blog_created" });
      }

      case "update_blog_post": {
        const upd = { ...args.updates };
        if (upd.status === "published" && !upd.published_at) upd.published_at = new Date().toISOString();
        const { data, error } = await sb.from("blog_posts").update(upd).eq("id", args.post_id).select("id, title, slug, status").single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, post: data, action: "blog_updated" });
      }

      // REVIEWS
      case "get_recent_reviews": {
        let q = sb.from("product_reviews").select("id, author_name, rating, title, body, status, product_slug, created_at").order("created_at", { ascending: false }).limit(args.limit || 10);
        if (args.status) q = q.eq("status", args.status);
        const { data, error } = await q;
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ reviews: data, count: data?.length });
      }

      case "update_review_status": {
        const { data, error } = await sb.from("product_reviews").update({ status: args.status }).eq("id", args.review_id).select("id, author_name, status").single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, review: data, action: "review_updated" });
      }

      // NEWSLETTER
      case "get_newsletter_stats": {
        const { count: total } = await sb.from("newsletter_subscribers").select("id", { count: "exact", head: true });
        const { count: active } = await sb.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("status", "active");
        return JSON.stringify({ total_subscribers: total, active_subscribers: active });
      }

      // AI CONTENT GENERATION
      case "generate_content": {
        const prompts: Record<string, string> = {
          product_description: `Write a compelling product description for "${args.context}" in ${args.language || "bangla"}. Tone: ${args.tone || "professional"}. Include features, benefits, and a call to action. Format with markdown.`,
          blog_post: `Write a blog post about "${args.context}" in ${args.language || "bangla"}. Tone: ${args.tone || "informative"}. Include introduction, main points, and conclusion. Format with markdown headings.`,
          seo_meta: `Generate SEO meta title (under 60 chars) and meta description (under 160 chars) for "${args.context}". Return in format: Title: ...\nDescription: ...`,
          announcement: `Create a short, attention-grabbing announcement bar text for "${args.context}" in ${args.language || "bangla"}. Max 100 characters. Include an emoji.`,
          social_post: `Write a social media post about "${args.context}" in ${args.language || "bangla"}. Include hashtags.`,
          email_template: `Write an email template about "${args.context}" in ${args.language || "bangla"}. Include subject line, greeting, body, and call to action.`,
        };

        const prompt = prompts[args.type] || prompts.product_description;
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: "You are a professional content writer for Shahed Store, a digital software shop in Bangladesh." },
              { role: "user", content: prompt },
            ],
          }),
        });
        if (!res.ok) return JSON.stringify({ error: "Content generation failed" });
        const d = await res.json();
        return JSON.stringify({ generated_content: d.choices?.[0]?.message?.content || "", type: args.type, action: "content_generated" });
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (e) {
    return JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const token = authHeader.replace("Bearer ", "");
    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user } } = await supabaseUser.auth.getUser(token);
    if (!user) throw new Error("Unauthorized");

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: roleData } = await sb.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleData) throw new Error("Not admin");

    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `তুমি Shahed Store-এর সুপার-পাওয়ার্ড এডমিন AI অ্যাসিস্ট্যান্ট। তুমি বাংলায় কথা বলো।

তুমি পুরো ওয়েবসাইট কন্ট্রোল করতে পারো:

📦 **প্রোডাক্ট ম্যানেজমেন্ট**: প্রোডাক্ট তৈরি, এডিট, ডিলিট, প্রাইস চেঞ্জ, স্টক আপডেট, স্ট্যাটাস পরিবর্তন, ফিচার্ড মার্ক, ব্যাজ সেট, SEO আপডেট
📋 **অর্ডার ম্যানেজমেন্ট**: অর্ডার দেখা, সার্চ, ফিল্টার, স্ট্যাটাস আপডেট, নোট যোগ
📊 **রিপোর্ট ও অ্যানালিটিক্স**: সেলস রিপোর্ট, রেভিনিউ ব্রেকডাউন, টপ প্রোডাক্ট, কাস্টমার স্ট্যাটিস্টিক্স
👥 **কাস্টমার ম্যানেজমেন্ট**: কাস্টমার সার্চ, ওয়ালেট/পয়েন্ট আপডেট
⚙️ **সাইট সেটিংস**: অ্যানাউন্সমেন্ট বার, পপআপ ব্যানার, হিরো ব্যানার, ফুটার, পেমেন্ট নম্বর — সব চেঞ্জ করতে পারো
🏷️ **ক্যাটাগরি ম্যানেজমেন্ট**: ক্যাটাগরি তৈরি, এডিট, অ্যাক্টিভ/ইনঅ্যাক্টিভ
🎟️ **কুপন ম্যানেজমেন্ট**: কুপন তৈরি, এডিট, ডিঅ্যাক্টিভ
📝 **ব্লগ ম্যানেজমেন্ট**: ব্লগ পোস্ট তৈরি, এডিট, পাবলিশ/ড্রাফট
⭐ **রিভিউ ম্যানেজমেন্ট**: রিভিউ অ্যাপ্রুভ/রিজেক্ট
🎫 **সাপোর্ট টিকেট**: টিকেট দেখা, রিপ্লাই দেওয়া, স্ট্যাটাস আপডেট
✍️ **AI কন্টেন্ট তৈরি**: প্রোডাক্ট ডেসক্রিপশন, ব্লগ পোস্ট, SEO মেটা, অ্যানাউন্সমেন্ট টেক্সট জেনারেট

🔑 গুরুত্বপূর্ণ নিয়ম:
- তথ্য সুন্দরভাবে ফরম্যাট করে দেখাও (মার্কডাউন টেবিল, লিস্ট ব্যবহার করো)
- টাকার পরিমাণ "৳" চিহ্ন দিয়ে দেখাও
- কোনো কিছু পরিবর্তন করার পর কনফার্মেশন মেসেজ দাও
- ডিলিটের আগে সতর্কতা দেখাও
- প্রতিটি অ্যাকশনের ফলাফল স্পষ্টভাবে জানাও
- যদি কোনো কিছু বোঝা না যায়, জিজ্ঞেস করো`;

    let aiMessages: any[] = [{ role: "system", content: systemPrompt }, ...messages];
    let maxIterations = 8;

    while (maxIterations-- > 0) {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: aiMessages, tools, tool_choice: "auto" }),
      });

      if (!response.ok) {
        const s = response.status;
        if (s === 429) return new Response(JSON.stringify({ error: "রেট লিমিট। কিছুক্ষণ পর চেষ্টা করুন।" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (s === 402) return new Response(JSON.stringify({ error: "ক্রেডিট শেষ।" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error(`AI error: ${s}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      if (!choice) throw new Error("No AI response");

      const msg = choice.message;
      aiMessages.push(msg);

      if (!msg.tool_calls || msg.tool_calls.length === 0) {
        return new Response(JSON.stringify({ result: msg.content || "কোনো উত্তর পাওয়া যায়নি।" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      for (const tc of msg.tool_calls) {
        const toolArgs = typeof tc.function.arguments === "string" ? JSON.parse(tc.function.arguments) : tc.function.arguments;
        const toolResult = await executeTool(tc.function.name, toolArgs, sb, LOVABLE_API_KEY);
        aiMessages.push({ role: "tool", tool_call_id: tc.id, content: toolResult });
      }
    }

    return new Response(JSON.stringify({ result: "অনেক বেশি স্টেপ হয়ে গেছে। আবার চেষ্টা করুন।" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-ai-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: e instanceof Error && e.message === "Unauthorized" ? 401 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
