// /editor থেকে /editor/manual-এ ভিডিও ফাইল পাঠানোর জন্য ছোট স্টোর (শুধু মেমোরিতে থাকে)
let pendingFile = null;

export function setPendingEditorFile(file) {
  pendingFile = file;
}

export function takePendingEditorFile() {
  const f = pendingFile;
  pendingFile = null;
  return f;
}