import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// গাড়িখাতা — OpenNext Cloudflare config।
// লোকাল SQLite/Prisma (GK_BACKEND=local) Workers-এ চলে না — production
// সবসময় supabase মোড। বাকি সব default।
export default defineCloudflareConfig({});
