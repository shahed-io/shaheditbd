import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Tools the AI can call
const tools = [
  {
    type: "function",
    function: {
      name: "get_orders",
      description: "Get orders with optional filters. Use to view, search, or summarize orders.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["pending", "processing", "completed", "cancelled", "refunded", "delivered", "failed"], description: "Filter by status" },
          limit: { type: "number", description: "Number of orders to return (default 10)" },
          search: { type: "string", description: "Search by order number, customer name, or phone" },
          date_from: { type: "string", description: "Filter orders from this date (YYYY-MM-DD)" },
          date_to: { type: "string", description: "Filter orders to this date (YYYY-MM-DD)" },
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
          admin_notes: { type: "string", description: "Optional admin note" },
        },
        required: ["order_id", "new_status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_products",
      description: "Get products with optional filters",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["active", "draft", "out_of_stock"] },
          limit: { type: "number" },
          search: { type: "string", description: "Search by product name" },
          category_id: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_product",
      description: "Update a product's fields (price, status, stock, name, etc.)",
      parameters: {
        type: "object",
        properties: {
          product_id: { type: "string", description: "Product UUID or slug" },
          updates: {
            type: "object",
            description: "Fields to update",
            properties: {
              name: { type: "string" },
              price: { type: "number" },
              original_price: { type: "number" },
              status: { type: "string", enum: ["active", "draft", "out_of_stock"] },
              stock_quantity: { type: "number" },
              description: { type: "string" },
              short_description: { type: "string" },
              is_featured: { type: "boolean" },
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
      name: "get_dashboard_stats",
      description: "Get sales stats, revenue, order counts, customer counts for admin dashboard",
      parameters: {
        type: "object",
        properties: {
          period: { type: "string", enum: ["today", "week", "month", "all"], description: "Time period for stats" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_customers",
      description: "Get customer list with optional search",
      parameters: {
        type: "object",
        properties: {
          search: { type: "string", description: "Search by name or email" },
          limit: { type: "number" },
        },
      },
    },
  },
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
        properties: {
          ticket_id: { type: "string" },
          message: { type: "string" },
        },
        required: ["ticket_id", "message"],
      },
    },
  },
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
      name: "get_site_settings",
      description: "Get site settings by category",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", description: "Settings category like general, appearance, store, seo" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_site_setting",
      description: "Update a site setting",
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
      name: "get_low_stock_products",
      description: "Get products with low stock (below threshold)",
      parameters: {
        type: "object",
        properties: {
          threshold: { type: "number", description: "Stock threshold (default 5)" },
        },
      },
    },
  },
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
];

// Tool executor
async function executeTool(name: string, args: Record<string, any>, supabaseAdmin: any): Promise<string> {
  try {
    switch (name) {
      case "get_orders": {
        let query = supabaseAdmin.from("orders").select("id, order_number, customer_name, customer_email, customer_phone, status, total, payment_method, payment_status, created_at, admin_notes, coupon_code, discount_amount").order("created_at", { ascending: false }).limit(args.limit || 10);
        if (args.status) query = query.eq("status", args.status);
        if (args.search) query = query.or(`order_number.ilike.%${args.search}%,customer_name.ilike.%${args.search}%,customer_phone.ilike.%${args.search}%`);
        if (args.date_from) query = query.gte("created_at", args.date_from);
        if (args.date_to) query = query.lte("created_at", args.date_to + "T23:59:59");
        const { data, error } = await query;
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ orders: data, count: data?.length });
      }

      case "update_order_status": {
        let orderId = args.order_id;
        // If it looks like an order number, find the UUID
        if (!orderId.includes("-") || orderId.length < 30) {
          const { data: found } = await supabaseAdmin.from("orders").select("id").eq("order_number", orderId).maybeSingle();
          if (found) orderId = found.id;
        }
        const updateData: any = { status: args.new_status };
        if (args.admin_notes) updateData.admin_notes = args.admin_notes;
        const { data, error } = await supabaseAdmin.from("orders").update(updateData).eq("id", orderId).select("id, order_number, status").single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, order: data });
      }

      case "get_products": {
        let query = supabaseAdmin.from("products").select("id, name, slug, price, original_price, status, stock_quantity, is_featured, total_sales, category_id, created_at").order("created_at", { ascending: false }).limit(args.limit || 10);
        if (args.status) query = query.eq("status", args.status);
        if (args.search) query = query.ilike("name", `%${args.search}%`);
        if (args.category_id) query = query.eq("category_id", args.category_id);
        const { data, error } = await query;
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ products: data, count: data?.length });
      }

      case "update_product": {
        let productId = args.product_id;
        if (!productId.includes("-") || productId.length < 30) {
          const { data: found } = await supabaseAdmin.from("products").select("id").eq("slug", productId).maybeSingle();
          if (found) productId = found.id;
        }
        const { data, error } = await supabaseAdmin.from("products").update(args.updates).eq("id", productId).select("id, name, price, status, stock_quantity").single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, product: data });
      }

      case "get_dashboard_stats": {
        const period = args.period || "today";
        let dateFilter: string | null = null;
        const now = new Date();
        if (period === "today") dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        else if (period === "week") { const d = new Date(now); d.setDate(d.getDate() - 7); dateFilter = d.toISOString(); }
        else if (period === "month") { const d = new Date(now); d.setMonth(d.getMonth() - 1); dateFilter = d.toISOString(); }

        let ordersQuery = supabaseAdmin.from("orders").select("id, total, status, created_at");
        if (dateFilter) ordersQuery = ordersQuery.gte("created_at", dateFilter);
        const { data: orders } = await ordersQuery;

        const totalOrders = orders?.length || 0;
        const completedOrders = orders?.filter((o: any) => o.status === "completed" || o.status === "delivered") || [];
        const totalRevenue = completedOrders.reduce((s: number, o: any) => s + Number(o.total), 0);
        const pendingOrders = orders?.filter((o: any) => o.status === "pending")?.length || 0;

        const { count: totalCustomers } = await supabaseAdmin.from("profiles").select("id", { count: "exact", head: true });
        const { count: totalProducts } = await supabaseAdmin.from("products").select("id", { count: "exact", head: true }).eq("status", "active");

        return JSON.stringify({
          period,
          total_orders: totalOrders,
          completed_orders: completedOrders.length,
          pending_orders: pendingOrders,
          total_revenue: totalRevenue,
          total_customers: totalCustomers,
          active_products: totalProducts,
        });
      }

      case "get_customers": {
        let query = supabaseAdmin.from("profiles").select("id, user_id, display_name, email, phone, wallet_balance, points_balance, created_at").order("created_at", { ascending: false }).limit(args.limit || 10);
        if (args.search) query = query.or(`display_name.ilike.%${args.search}%,email.ilike.%${args.search}%`);
        const { data, error } = await query;
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ customers: data, count: data?.length });
      }

      case "get_support_tickets": {
        let query = supabaseAdmin.from("support_tickets").select("id, ticket_number, subject, status, priority, customer_name, customer_email, created_at").order("created_at", { ascending: false }).limit(args.limit || 10);
        if (args.status) query = query.eq("status", args.status);
        const { data, error } = await query;
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ tickets: data, count: data?.length });
      }

      case "reply_to_ticket": {
        const { data, error } = await supabaseAdmin.from("support_replies").insert({
          ticket_id: args.ticket_id,
          message: args.message,
          author_name: "AI Assistant",
          is_admin: true,
        }).select().single();
        if (error) return JSON.stringify({ error: error.message });
        // Update ticket status
        await supabaseAdmin.from("support_tickets").update({ status: "in_progress" }).eq("id", args.ticket_id);
        return JSON.stringify({ success: true, reply: data });
      }

      case "get_categories": {
        const { data, error } = await supabaseAdmin.from("categories").select("id, name, slug, is_active, sort_order, parent_id").order("sort_order");
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ categories: data });
      }

      case "get_site_settings": {
        let query = supabaseAdmin.from("site_settings").select("key, value, category");
        if (args.category) query = query.eq("category", args.category);
        const { data, error } = await query;
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ settings: data });
      }

      case "update_site_setting": {
        const { data, error } = await supabaseAdmin.from("site_settings").upsert({
          key: args.key,
          value: args.value,
          category: args.category || "general",
        }, { onConflict: "key" }).select().single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, setting: data });
      }

      case "get_low_stock_products": {
        const threshold = args.threshold || 5;
        const { data, error } = await supabaseAdmin.from("products").select("id, name, slug, stock_quantity, status").eq("status", "active").lte("stock_quantity", threshold).order("stock_quantity");
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ low_stock_products: data, count: data?.length });
      }

      case "get_recent_reviews": {
        let query = supabaseAdmin.from("product_reviews").select("id, author_name, rating, title, body, status, product_slug, created_at").order("created_at", { ascending: false }).limit(args.limit || 10);
        if (args.status) query = query.eq("status", args.status);
        const { data, error } = await query;
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ reviews: data, count: data?.length });
      }

      case "update_review_status": {
        const { data, error } = await supabaseAdmin.from("product_reviews").update({ status: args.status }).eq("id", args.review_id).select("id, author_name, status").single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, review: data });
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
    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const token = authHeader.replace("Bearer ", "");
    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user } } = await supabaseUser.auth.getUser(token);
    if (!user) throw new Error("Unauthorized");

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check admin role
    const { data: roleData } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleData) throw new Error("Not admin");

    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `তুমি Shahed Store-এর এডমিন AI অ্যাসিস্ট্যান্ট। তুমি বাংলায় কথা বলো।
তুমি পুরো এডমিন প্যানেল কন্ট্রোল করতে পারো:
- অর্ডার দেখা, সার্চ করা, স্ট্যাটাস পরিবর্তন করা
- প্রোডাক্ট দেখা, প্রাইস/স্টক আপডেট, স্ট্যাটাস পরিবর্তন
- সেলস রিপোর্ট ও অ্যানালিটিক্স দেখা
- কাস্টমার তথ্য দেখা
- সাপোর্ট টিকেট দেখা ও রিপ্লাই দেওয়া
- সাইট সেটিংস দেখা ও পরিবর্তন করা
- রিভিউ অ্যাপ্রুভ/রিজেক্ট করা
- লো স্টক প্রোডাক্ট দেখা

প্রতিটি তথ্য ফরম্যাট করে সুন্দরভাবে উপস্থাপন করো। টাকার পরিমাণ "৳" চিহ্ন দিয়ে দেখাও।
যদি ইউজার কোনো কিছু করতে বলে, তাহলে টুল ব্যবহার করে সেটা সম্পন্ন করো এবং ফলাফল জানাও।
সবসময় নম্র ও সহায়ক হও।`;

    let aiMessages = [{ role: "system", content: systemPrompt }, ...messages];

    // Loop: call AI -> if tool_calls -> execute -> call AI again
    let maxIterations = 5;
    while (maxIterations-- > 0) {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: aiMessages,
          tools,
          tool_choice: "auto",
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) return new Response(JSON.stringify({ error: "রেট লিমিট অতিক্রম হয়েছে। কিছুক্ষণ পর চেষ্টা করুন।" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "ক্রেডিট শেষ হয়েছে।" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error(`AI error: ${status}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      if (!choice) throw new Error("No AI response");

      const msg = choice.message;
      aiMessages.push(msg);

      // If no tool calls, return the final text
      if (!msg.tool_calls || msg.tool_calls.length === 0) {
        return new Response(JSON.stringify({ result: msg.content || "কোনো উত্তর পাওয়া যায়নি।" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Execute all tool calls
      for (const tc of msg.tool_calls) {
        const toolArgs = typeof tc.function.arguments === "string" ? JSON.parse(tc.function.arguments) : tc.function.arguments;
        const toolResult = await executeTool(tc.function.name, toolArgs, supabaseAdmin);
        aiMessages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: toolResult,
        });
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
