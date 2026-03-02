
## পরিবর্তন: TickerBanner এর border line সম্পূর্ণ রিমুভ

### সমস্যা
`TickerBanner` এর div এ `border-b border-primary/30` class আছে, যেটা নিচে একটা gradient/colored border line দেখাচ্ছে।

### সমাধান
`src/components/store/Extras.tsx` এর line 18 থেকে `border-b border-primary/30` সরিয়ে দেওয়া হবে।

**পরিবর্তন:**
```
আগে: <div className="border-b border-primary/30 py-1 overflow-hidden relative" ...>
পরে: <div className="py-1 overflow-hidden relative" ...>
```

এতে TickerBanner এর নিচের colored border line সম্পূর্ণ চলে যাবে এবং নিচে ফাঁকা থাকবে।
