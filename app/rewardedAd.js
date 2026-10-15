// বিজ্ঞাপন দেখানোর একটাই জায়গা। LimitModal শুধু এই ফাংশন ডাকে।
//
// আসল বিজ্ঞাপন (যেমন Monetag-এর রিওয়ার্ড ফরম্যাট) এখানে বসবে:
//   - দেখা শেষ হলে true ফেরত দিন, ব্যবহারকারী মাঝপথে বন্ধ করলে false।
//   - সার্ভার আলাদাভাবে সময় যাচাই করে (AD_MIN_SECONDS), তাই এখানে ফাঁকি দিলেও ক্রেডিট পাওয়া যায় না।
//
// টেস্ট মোড: Vercel-এর Environment-এ NEXT_PUBLIC_ADS_TEST=1 দিলে শুধু অপেক্ষা করে true দেয়
// (সার্ভারের পুরো প্রবাহ পরীক্ষার জন্য)। আসল সাইটে এটা চালু রাখবেন না, নইলে বিজ্ঞাপন ছাড়াই ক্রেডিট পাওয়া যাবে।
export async function showRewardedAd({ minSeconds = 10 } = {}) {
  if (process.env.NEXT_PUBLIC_ADS_TEST === '1') {
    await new Promise((resolve) => setTimeout(resolve, (minSeconds + 1) * 1000));
    return true;
  }
  // TODO: এখানে বিজ্ঞাপন নেটওয়ার্কের কোড বসান।
  throw new Error('বিজ্ঞাপন নেটওয়ার্ক এখনো যুক্ত হয়নি।');
}