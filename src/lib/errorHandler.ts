/**
 * Maps raw database errors to user-friendly messages.
 * Never exposes internal DB schema details to the UI.
 */
export const handleDbError = (error: { message?: string } | null): string => {
  if (!error?.message) return 'একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।';
  const msg = error.message.toLowerCase();

  if (msg.includes('duplicate') || msg.includes('already exists') || msg.includes('unique'))
    return 'এই আইটেমটি ইতিমধ্যে বিদ্যমান। অন্য নাম বা কোড ব্যবহার করুন।';
  if (msg.includes('foreign key') || msg.includes('violates foreign'))
    return 'এই আইটেমটি মুছে ফেলা যাবে না কারণ এটি অন্য জায়গায় ব্যবহৃত হচ্ছে।';
  if (msg.includes('not-null') || msg.includes('null value'))
    return 'সব প্রয়োজনীয় ফিল্ড পূরণ করুন।';
  if (msg.includes('check constraint') || msg.includes('violates check'))
    return 'প্রদত্ত মান গ্রহণযোগ্য সীমার বাইরে।';
  if (msg.includes('permission') || msg.includes('policy') || msg.includes('rls'))
    return 'এই অপারেশনের অনুমতি নেই।';
  if (msg.includes('network') || msg.includes('connection'))
    return 'নেটওয়ার্ক সমস্যা। ইন্টারনেট সংযোগ চেক করুন।';

  return 'একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।';
};
