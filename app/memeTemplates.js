// মিম-টেমপ্লেটের তালিকা। নতুন টেমপ্লেট যোগ করতে: ছবি public/meme-templates/-এ রাখুন আর এখানে এক লাইন যোগ করুন (কোড বদলাতে হয় না)।
// source/license: প্রতিটা ছবির উৎস ও লাইসেন্স অবশ্যই লিখে রাখুন (অভিযোগ এলে লাইনটা মুছে দিলেই টেমপ্লেট সরে যায়)।
// জনপ্রিয় মিমের ছবি (Drake ইত্যাদি) বা অন্যের কপিরাইটযুক্ত ছবি এখানে দেবেন না।
export const COUNTRIES = [
  { id: 'global', label: 'Global' },
  { id: 'usa', label: 'USA' },
];

const O = { source: 'Original artwork by BuffRadar', license: 'Original' };

export const TEMPLATES = [
  { id: 'plain-dark', name: 'Dark', country: 'global', src: '/meme-templates/plain-dark.svg', ...O },
  { id: 'plain-sunset', name: 'Sunset', country: 'global', src: '/meme-templates/plain-sunset.svg', ...O },
  { id: 'plain-sky', name: 'Sky', country: 'global', src: '/meme-templates/plain-sky.svg', ...O },
  { id: 'stickman-shrug', name: 'Shrug', country: 'global', src: '/meme-templates/stickman-shrug.svg', ...O },
  { id: 'stickman-laptop', name: 'Laptop', country: 'global', src: '/meme-templates/stickman-laptop.svg', ...O },
  { id: 'stickman-stage', name: 'Spotlight', country: 'global', src: '/meme-templates/stickman-stage.svg', ...O },

  { id: 'usa-diner', name: 'Diner', country: 'usa', src: '/meme-templates/usa-diner.svg', ...O },
  { id: 'usa-school-bus', name: 'School bus', country: 'usa', src: '/meme-templates/usa-school-bus.svg', ...O },
  { id: 'usa-highway', name: 'Highway', country: 'usa', src: '/meme-templates/usa-highway.svg', ...O },
  { id: 'usa-suburb', name: 'Suburb', country: 'usa', src: '/meme-templates/usa-suburb.svg', ...O },
  { id: 'usa-football', name: 'Football', country: 'usa', src: '/meme-templates/usa-football.svg', ...O },
  { id: 'usa-burger', name: 'Burger', country: 'usa', src: '/meme-templates/usa-burger.svg', ...O },
];