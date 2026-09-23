// হোমপেজ থেকে /converter পেজে ফাইল পাঠানোর জন্য সাধারণ ইন-মেমরি স্টোর।
// Next.js-এ ক্লায়েন্ট-সাইড নেভিগেশনে (router.push) এই মডিউলের ভ্যালু বেঁচে থাকে,
// কিন্তু ব্রাউজার রিফ্রেশ/হার্ড রিলোড করলে হারিয়ে যাবে — তাই /converter পেজে নিজের
// একটা আপলোডারও আছে, ফাইল না পেলে সেটা দিয়ে সরাসরি বাছাই করা যায়।
let pendingFile = null;

export function setPendingFile(file) {
  pendingFile = file || null;
}

export function takePendingFile() {
  const file = pendingFile;
  pendingFile = null; // একবার নেওয়ার পরই খালি করে দেওয়া হয়, যাতে পরে ভুলবশত আবার ব্যবহার না হয়
  return file;
}
