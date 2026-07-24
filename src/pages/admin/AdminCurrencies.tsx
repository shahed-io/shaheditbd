import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, RefreshCw, Globe, DollarSign, Calculator, Sparkles, Check, X } from "lucide-react";

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  rate_from_bdt: number;
  rate_per_usd: number | null;
  is_default: boolean;
  is_active: boolean;
  position: number;
  decimals: number;
  symbol_position: "before" | "after";
  flag_emoji: string | null;
}

const EMPTY: Partial<Currency> = {
  code: "",
  name: "",
  symbol: "",
  rate_from_bdt: 1,
  rate_per_usd: null,
  is_default: false,
  is_active: true,
  position: 0,
  decimals: 2,
  symbol_position: "before",
  flag_emoji: "",
};

const AdminCurrencies = () => {
  const [rows, setRows] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Currency> | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [usdRate, setUsdRate] = useState<number>(120);
  const [usdRateInput, setUsdRateInput] = useState<string>("120");
  const [savingUsd, setSavingUsd] = useState(false);
  const [aiUpdating, setAiUpdating] = useState(false);
  const [inlineEdit, setInlineEdit] = useState<{ id: string; value: string } | null>(null);
  const [inlineSaving, setInlineSaving] = useState(false);

  const aiAutoUpdate = async () => {
    if (!confirm("AI দ্বারা live exchange rates এনে সকল currency-এর দাম update করা হবে। চালিয়ে যাব?")) return;
    setAiUpdating(true);
    try {
      const { data, error } = await supabase.functions.invoke("auto-update-currency-rates", { body: {} });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Update failed");
      toast.success(`AI update সফল: ${data.updated_count} currency update হয়েছে। 1 USD = ৳${Number(data.usd_to_bdt).toFixed(2)}`);
      if (data.missing_codes?.length) {
        toast.info(`FX feed-এ পাওয়া যায়নি: ${data.missing_codes.join(", ")}`);
      }
      await Promise.all([load(), loadUsdRate()]);
    } catch (e: any) {
      toast.error(e?.message || "AI auto-update failed");
    } finally {
      setAiUpdating(false);
    }
  };

  const saveInlineRate = async (row: Currency) => {
    if (!inlineEdit || inlineEdit.id !== row.id) return;
    const rpu = Number(inlineEdit.value);
    if (!isFinite(rpu) || rpu <= 0) {
      toast.error("Rate must be a positive number");
      return;
    }
    setInlineSaving(true);
    const rateFromBdt = usdRate / rpu;
    const { error } = await supabase
      .from("currencies")
      .update({ rate_per_usd: rpu, rate_from_bdt: rateFromBdt })
      .eq("id", row.id);
    setInlineSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${row.code} rate updated`);
    setInlineEdit(null);
    load();
  };

  const loadUsdRate = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "usd_to_bdt_rate")
      .maybeSingle();
    const v = Number(data?.value ?? 120);
    if (isFinite(v) && v > 0) {
      setUsdRate(v);
      setUsdRateInput(String(v));
    }
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("currencies")
      .select("*")
      .order("position", { ascending: true });
    if (error) toast.error(error.message);
    else setRows((data || []) as unknown as Currency[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    loadUsdRate();
  }, []);

  const openNew = () => {
    setEditing({ ...EMPTY, position: rows.length });
    setOpen(true);
  };

  const openEdit = (row: Currency) => {
    setEditing({ ...row });
    setOpen(true);
  };

  const save = async () => {
    if (!editing) return;
    const code = (editing.code || "").trim().toUpperCase();
    if (!code || !editing.name || !editing.symbol) {
      toast.error("Code, Name and Symbol are required");
      return;
    }
    const rpu = editing.rate_per_usd == null || (editing.rate_per_usd as any) === ""
      ? null
      : Number(editing.rate_per_usd);
    let rate = Number(editing.rate_from_bdt);
    if (code === "BDT") {
      rate = 1;
    } else if (rpu != null && isFinite(rpu) && rpu > 0) {
      // Derive rate_from_bdt from USD pivot: 1 unit = usdRate / rpu BDT
      rate = usdRate / rpu;
    }
    if (!isFinite(rate) || rate <= 0) {
      toast.error("Rate must be a positive number");
      return;
    }
    setSaving(true);
    const payload = {
      code,
      name: editing.name,
      symbol: editing.symbol,
      rate_from_bdt: rate,
      rate_per_usd: code === "BDT" ? null : rpu,
      is_default: !!editing.is_default,
      is_active: editing.is_active !== false,
      position: Number(editing.position) || 0,
      decimals: Number(editing.decimals) || 0,
      symbol_position: (editing.symbol_position || "before") as "before" | "after",
      flag_emoji: editing.flag_emoji || null,
    };
    const q = editing.id
      ? supabase.from("currencies").update(payload).eq("id", editing.id)
      : supabase.from("currencies").insert(payload);
    const { error } = await q;
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Saved");
    setOpen(false);
    setEditing(null);
    load();
  };

  const remove = async (id: string, code: string) => {
    if (code === "BDT") {
      toast.error("BDT is the base currency and cannot be deleted");
      return;
    }
    if (!confirm(`Delete currency ${code}?`)) return;
    const { error } = await supabase.from("currencies").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      load();
    }
  };

  const toggleActive = async (row: Currency) => {
    const { error } = await supabase
      .from("currencies")
      .update({ is_active: !row.is_active })
      .eq("id", row.id);
    if (error) toast.error(error.message);
    else load();
  };

  const makeDefault = async (row: Currency) => {
    const { error } = await supabase
      .from("currencies")
      .update({ is_default: true })
      .eq("id", row.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`${row.code} is now default`);
      load();
    }
  };

  const saveUsdRateAndRecalc = async () => {
    const newRate = Number(usdRateInput);
    if (!isFinite(newRate) || newRate <= 0) {
      toast.error("USD rate must be a positive number");
      return;
    }
    setSavingUsd(true);
    // 1) Save USD -> BDT pivot rate
    const { error: settingsErr } = await supabase
      .from("site_settings")
      .upsert({ key: "usd_to_bdt_rate", value: newRate as any }, { onConflict: "key" });
    if (settingsErr) {
      setSavingUsd(false);
      toast.error(settingsErr.message);
      return;
    }
    // 2) Recalculate rate_from_bdt for every currency that has rate_per_usd
    const updates = rows
      .filter((r) => r.code !== "BDT" && r.rate_per_usd != null && Number(r.rate_per_usd) > 0)
      .map((r) => {
        const newFromBdt = newRate / Number(r.rate_per_usd);
        return supabase
          .from("currencies")
          .update({ rate_from_bdt: newFromBdt })
          .eq("id", r.id);
      });
    const results = await Promise.all(updates);
    const failed = results.find((r) => r.error);
    setSavingUsd(false);
    if (failed?.error) {
      toast.error(failed.error.message);
      return;
    }
    setUsdRate(newRate);
    toast.success(`USD rate saved. ${updates.length} currencies recalculated.`);
    load();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="w-6 h-6" /> Multi Currency Manager
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Product prices are stored in <b>BDT (৳)</b>. Set the <b>USD → BDT</b> rate below,
            then every other currency auto-converts from its <b>per-USD</b> rate.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => { load(); loadUsdRate(); }}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={aiAutoUpdate}
            disabled={aiUpdating}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            {aiUpdating ? "Updating…" : "AI Auto-Update Rates"}
          </Button>
          <Button size="sm" onClick={openNew}>
            <Plus className="w-4 h-4 mr-1" /> Add Currency
          </Button>
        </div>
      </div>

      {/* USD Pivot Rate */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" /> Base Rate: 1 USD = ? BDT
          </CardTitle>
          <CardDescription>
            Enter today's USD → BDT rate (e.g. <b>135</b>). When you save, every currency with
            a "rate per USD" is auto-recalculated. Example: if 1 USD = 135 BDT and 1 USD = 0.92 EUR,
            then 1 EUR = 135 ÷ 0.92 ≈ 146.74 BDT.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px] max-w-xs">
              <Label>1 USD equals how many BDT?</Label>
              <Input
                type="number"
                step="0.0001"
                min="0.0001"
                value={usdRateInput}
                onChange={(e) => setUsdRateInput(e.target.value)}
                placeholder="135"
              />
            </div>
            <Button onClick={saveUsdRateAndRecalc} disabled={savingUsd}>
              <Calculator className="w-4 h-4 mr-1" />
              {savingUsd ? "Recalculating…" : "Save & Recalculate All"}
            </Button>
            <div className="text-xs text-muted-foreground ml-auto">
              Current stored rate: <b>1 USD = ৳{usdRate}</b>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Currencies</CardTitle>
          <CardDescription>
            Customers can pick any active currency from the storefront.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Order</TableHead>
                <TableHead className="whitespace-nowrap">Code</TableHead>
                <TableHead className="whitespace-nowrap">Name</TableHead>
                <TableHead className="whitespace-nowrap">Symbol</TableHead>
                <TableHead className="whitespace-nowrap">1 USD = ? {`{code}`}</TableHead>
                <TableHead className="whitespace-nowrap">1 unit = BDT</TableHead>
                <TableHead className="whitespace-nowrap">Preview (৳1000)</TableHead>
                <TableHead className="whitespace-nowrap">Default</TableHead>
                <TableHead className="whitespace-nowrap">Active</TableHead>
                <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                rows.map((row) => {
                  const preview = 1000 / (row.rate_from_bdt || 1);
                  const formatted = new Intl.NumberFormat("en-US", {
                    minimumFractionDigits: row.decimals,
                    maximumFractionDigits: row.decimals,
                  }).format(preview);
                  const previewStr =
                    row.symbol_position === "after"
                      ? `${formatted}${row.symbol}`
                      : `${row.symbol}${formatted}`;
                  return (
                    <TableRow key={row.id}>
                      <TableCell>{row.position}</TableCell>
                      <TableCell className="font-semibold whitespace-nowrap">
                        {row.flag_emoji ? <span className="mr-1">{row.flag_emoji}</span> : null}
                        {row.code}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{row.name}</TableCell>
                      <TableCell className="whitespace-nowrap">{row.symbol}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {row.code === "BDT" ? (
                          <span className="text-muted-foreground text-xs">—</span>
                        ) : row.rate_per_usd != null ? (
                          <span className="font-mono text-xs">{Number(row.rate_per_usd)}</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">manual</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {row.code === "BDT" ? (
                          <span className="text-muted-foreground text-xs">base</span>
                        ) : (
                          Number(row.rate_from_bdt).toFixed(4)
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-xs">
                        {previewStr}
                      </TableCell>
                      <TableCell>
                        {row.is_default ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                            Default
                          </span>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => makeDefault(row)}>
                            Set default
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch checked={row.is_active} onCheckedChange={() => toggleActive(row)} />
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(row)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => remove(row.id, row.code)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No currencies. Click "Add Currency".
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit Currency" : "Add Currency"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-1">
                <Label>Code</Label>
                <Input
                  value={editing.code || ""}
                  onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                  placeholder="USD"
                  maxLength={5}
                />
              </div>
              <div className="col-span-1">
                <Label>Flag emoji</Label>
                <Input
                  value={editing.flag_emoji || ""}
                  onChange={(e) => setEditing({ ...editing, flag_emoji: e.target.value })}
                  placeholder="🇺🇸"
                />
              </div>
              <div className="col-span-2">
                <Label>Name</Label>
                <Input
                  value={editing.name || ""}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="US Dollar"
                />
              </div>
              <div className="col-span-1">
                <Label>Symbol</Label>
                <Input
                  value={editing.symbol || ""}
                  onChange={(e) => setEditing({ ...editing, symbol: e.target.value })}
                  placeholder="$"
                />
              </div>
              <div className="col-span-1">
                <Label>Symbol position</Label>
                <Select
                  value={editing.symbol_position || "before"}
                  onValueChange={(v) =>
                    setEditing({ ...editing, symbol_position: v as "before" | "after" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="before">Before ($100)</SelectItem>
                    <SelectItem value="after">After (100$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(editing.code || "").toUpperCase() !== "BDT" && (
                <>
                  <div className="col-span-2 rounded-md border border-primary/20 bg-primary/5 p-3">
                    <Label className="text-sm font-semibold">
                      1 USD = how many {(editing.code || "units").toUpperCase()}?
                    </Label>
                    <Input
                      type="number"
                      step="0.0001"
                      min="0"
                      value={editing.rate_per_usd ?? ""}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          rate_per_usd: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                      placeholder="e.g. 0.92 for EUR, 83 for INR, 1 for USD"
                      className="mt-1"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Recommended. This currency auto-recalculates whenever the USD → BDT rate
                      changes. For USD itself, enter <b>1</b>. Leave empty to enter a fixed BDT
                      rate manually below.
                    </p>
                    {editing.rate_per_usd != null && Number(editing.rate_per_usd) > 0 && (
                      <p className="text-[11px] mt-1">
                        → Auto: 1 {(editing.code || "").toUpperCase()} ={" "}
                        <b>৳{(usdRate / Number(editing.rate_per_usd)).toFixed(4)}</b>
                      </p>
                    )}
                  </div>

                  <div className="col-span-1">
                    <Label>Manual: 1 unit = BDT</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      value={editing.rate_from_bdt ?? 1}
                      onChange={(e) =>
                        setEditing({ ...editing, rate_from_bdt: Number(e.target.value) })
                      }
                      placeholder="130"
                      disabled={editing.rate_per_usd != null && Number(editing.rate_per_usd) > 0}
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Used only if "rate per USD" is empty.
                    </p>
                  </div>
                </>
              )}
              <div className="col-span-1">
                <Label>Decimals</Label>
                <Input
                  type="number"
                  min={0}
                  max={4}
                  value={editing.decimals ?? 2}
                  onChange={(e) => setEditing({ ...editing, decimals: Number(e.target.value) })}
                />
              </div>
              <div className="col-span-1">
                <Label>Sort order</Label>
                <Input
                  type="number"
                  value={editing.position ?? 0}
                  onChange={(e) => setEditing({ ...editing, position: Number(e.target.value) })}
                />
              </div>
              <div className="col-span-1 flex items-end gap-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!!editing.is_active}
                    onCheckedChange={(v) => setEditing({ ...editing, is_active: v })}
                  />
                  <Label className="text-sm">Active</Label>
                </div>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <Switch
                  checked={!!editing.is_default}
                  onCheckedChange={(v) => setEditing({ ...editing, is_default: v })}
                />
                <Label className="text-sm">Set as default currency for new visitors</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCurrencies;
