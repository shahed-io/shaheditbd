import { useState } from 'react';
import { ExternalLink, AlertCircle, Server, Download } from 'lucide-react';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import { Suspense } from 'react';

// The PHP system URL — update this after uploading to your hosting
const CID_URL = 'https://shahedstore.com.bd/getcid/login.php';

const GetCID = () => {
  const [iframeError, setIframeError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 pt-4 pb-8">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">CID For Reseller</h1>
              <p className="text-muted-foreground text-sm mt-1">
                রিসেলার প্যানেলে লগইন করুন এবং CID জেনারেট করুন
              </p>
            </div>
            <a
              href={CID_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <ExternalLink size={15} />
              নতুন ট্যাবে খুলুন
            </a>
          </div>
        </div>

        {/* iframe container */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="rounded-2xl border border-border overflow-hidden shadow-lg bg-card"
               style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}>

            {!loaded && !iframeError && (
              <div className="flex items-center justify-center h-full bg-muted/20">
                <div className="text-center space-y-3">
                  <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
                  <p className="text-muted-foreground text-sm">লোড হচ্ছে...</p>
                </div>
              </div>
            )}

            {iframeError ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4 max-w-md px-6">
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                    <Server className="text-destructive" size={28} />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">PHP সিস্টেম সেটআপ প্রয়োজন</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    PHP ফাইলগুলো আপনার hosting-এ আপলোড করতে হবে।
                    নিচের ধাপগুলো অনুসরণ করুন:
                  </p>

                  <div className="bg-muted/30 rounded-xl p-4 text-left space-y-3 text-sm">
                    <div className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">১</span>
                      <p className="text-foreground">ZIP ফাইলটি আপনার cPanel File Manager-এ <code className="bg-muted px-1 rounded">public_html/getcid/</code> ফোল্ডারে আপলোড করুন</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">২</span>
                      <p className="text-foreground">cPanel-এ Extract করুন</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">৩</span>
                      <p className="text-foreground"><code className="bg-muted px-1 rounded">_data</code> ফোল্ডারটি writable করুন (permission: 755)</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">৪</span>
                      <p className="text-foreground">ব্রাউজারে <code className="bg-muted px-1 rounded">yourdomain.com/getcid/login.php</code> ভিজিট করুন</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-left">
                    <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-amber-700 dark:text-amber-400 text-xs">
                      Default Admin: <strong>admin</strong> / <strong>Sh@9696</strong> — লগইন করার পরে পাসওয়ার্ড পরিবর্তন করুন
                    </p>
                  </div>

                  <a
                    href={CID_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    <ExternalLink size={15} />
                    সরাসরি লিংকে যান
                  </a>
                </div>
              </div>
            ) : (
              <iframe
                src={CID_URL}
                className="w-full h-full border-0"
                title="CID For Reseller"
                style={{ display: loaded ? 'block' : 'none' }}
                onLoad={() => setLoaded(true)}
                onError={() => setIframeError(true)}
                allow="same-origin"
                sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-top-navigation"
              />
            )}
          </div>
        </div>
      </main>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default GetCID;
