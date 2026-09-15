import { NextResponse } from "next/server";
import { db, backendMode, runWithCloud } from "@/lib/server/store";
import { hashPassword, createSession, SESSION_COOKIE } from "@/lib/server/auth";
import { createServerClient, setSessionCookies } from "@/lib/server/cloud-auth";
import { buildSnapshot } from "@/lib/server/snapshot";
import { str } from "@/lib/server/route";

/** Bengali digits → Latin, strip separators — the owner may type either. */
function normalizePhone(raw: string): string {
  const bn = "০১২৩৪৫৬৭৮৯";
  return raw.replace(/[০-৯]/g, (d) => String(bn.indexOf(d))).replace(/\D/g, "");
}

const validPhone = (p: string) => /^01\d{9}$/.test(p);
const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

/**
 * Self-service signup — a brand-new business + its owner account.
 * Email-ভিত্তিক অ্যাকাউন্ট: email-টাই Supabase auth identity (লগইন ফোন বা
 * ইমেইল — দুইভাবেই সম্ভব)।
 * LOCAL : business + user rows (scrypt) + session cookie → straight in.
 * CLOUD : Supabase Auth signUp (real email) + business + membership +
 *         profile inserts (RLS: creator self-assigns owner — 0004 SQL) → token cookies.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const businessName = str(body.businessName);
    const ownerName = str(body.ownerName);
    const phone = normalizePhone(str(body.phone));
    const email = str(body.email).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";

    if (!businessName || !ownerName || !phone || !email || !password) {
      return NextResponse.json({ ok: false, error: "fillAll" }, { status: 400 });
    }
    if (!validPhone(phone)) {
      return NextResponse.json({ ok: false, error: "invalidPhone" }, { status: 400 });
    }
    if (!validEmail(email)) {
      return NextResponse.json({ ok: false, error: "invalidEmail" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ ok: false, error: "shortPassword" }, { status: 400 });
    }

    /* ---------- CLOUD ---------- */
    if (backendMode() === "cloud") {
      const client = createServerClient();
      const { data: authData, error: authError } = await client.auth.signUp({
        email,
        password,
        options: { data: { full_name: ownerName, phone } },
      });
      const uid = authData?.user?.id;
      if (authError || !uid) {
        const msg = authError?.message ?? "";
        const known = /already registered|already been registered/i.test(msg);
        const invalid = /email_address_invalid|invalid.*email/i.test(msg);
        return NextResponse.json(
          { ok: false, error: known ? "emailTaken" : invalid ? "invalidEmail" : "signupFailed" },
          { status: known ? 409 : 400 }
        );
      }
      // signUp without a session → email confirmation is ON. Real email দেওয়া
      // আছে, তাই ইউজার ইমেইলে কনফার্ম করে লগইন করতে পারবে।
      if (!authData.session) {
        return NextResponse.json({ ok: false, error: "checkEmailToConfirm" }, { status: 400 });
      }

      const { data: bizRow, error: bizErr } = await client.from("businesses").insert({
        name: businessName,
        owner_user_id: uid,
        phone,
        plan: "free",
        settings: {},
      }).select("id").single();
      if (bizErr) {
        // RLS আটকে দিলে মানে owner-এর Supabase-এ এই v0.10 fix SQL টা এখনো চালানো
        // হয়নি — ঠিক message দেখাই (chat-এ দেওয়া আছে)।
        if (/row-level security/i.test(bizErr.message ?? "")) {
          return NextResponse.json({ ok: false, error: "policyPatchNeeded" }, { status: 400 });
        }
        throw new Error(bizErr.message);
      }
      const businessId = (bizRow as { id?: string } | null)?.id;
      if (!businessId) throw new Error("business insert failed");

      const { error: memberErr } = await client.from("business_members").insert({
        business_id: businessId,
        user_id: uid,
        role: "owner",
        status: "active",
        joined_at: new Date().toISOString(),
      });
      if (memberErr) {
        const rls = /row-level security/i.test(memberErr.message ?? "");
        if (rls) return NextResponse.json({ ok: false, error: "policyPatchNeeded" }, { status: 400 });
        throw new Error(memberErr.message);
      }

      // profile: upsert — অনেক প্রজেক্টে auth.users-এর trigger নিজেই profile
      // বানিয়ে দেয় (তখন সাধারণ insert → duplicate key)। upsert-এ দুই দশাতেই কাজ হয়।
      const { error: profileErr } = await client.from("profiles").upsert({
        id: uid,
        full_name: ownerName,
        phone,
        email,
        default_business_id: businessId,
      }, { onConflict: "id" });
      if (profileErr) throw new Error(profileErr.message);

      const user = { id: uid, name: ownerName, phone, role: "owner", businessId, driverId: null };
      // buildSnapshot → cloud db needs the request context (RLS client).
      const data = await runWithCloud(client, () => buildSnapshot(user));
      const res = NextResponse.json({ ok: true, user, data });
      const session = authData.session;
      setSessionCookies(res, {
        at: session.access_token,
        rt: session.refresh_token,
        expiresAt: new Date((session.expires_at ?? 0) * 1000),
      });
      return res;
    }

    /* ---------- LOCAL ---------- */
    const [byPhone, byEmail] = await Promise.all([
      db.user.findUnique({ where: { phone } }),
      db.user.findUnique({ where: { email } }),
    ]);
    if (byPhone) {
      return NextResponse.json({ ok: false, error: "phoneTaken" }, { status: 409 });
    }
    if (byEmail) {
      return NextResponse.json({ ok: false, error: "emailTaken" }, { status: 409 });
    }

    const business = await db.business.create({
      data: {
        name: businessName,
        ownerName,
        phone,
        address: "",
        plan: "free",
        tripSeq: 1,
        quoteSeq: 1,
      },
    });

    const user = await db.user.create({
      data: {
        businessId: business.id,
        name: ownerName,
        phone,
        email,
        role: "owner",
        passwordHash: hashPassword(password),
      },
    });

    const { token, expiresAt } = await createSession(user.id);
    const sessionUser = {
      id: user.id, name: user.name, phone: user.phone,
      role: user.role, businessId: user.businessId, driverId: null,
    };
    const data = await buildSnapshot(sessionUser);
    const res = NextResponse.json({ ok: true, user: sessionUser, data });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch (e) {
    console.error("[signup]", e);
    return NextResponse.json({ ok: false, error: "serverError" }, { status: 500 });
  }
}
