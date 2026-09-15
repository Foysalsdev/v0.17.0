"use client";

import * as React from "react";
import { useApp, useT } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Users, UserRoundPlus, Loader2, TriangleAlert, KeyRound, Smartphone, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import type { TranslationKey } from "@/lib/i18n";

const STAFF_ROLES = ["manager", "accountant", "driver"] as const;

/** Settings → Team: the owner creates login accounts (manager/accountant/driver),
 *  edits roles, deactivates or removes them; anyone can change their own password. */
export function TeamManager() {
  const { t } = useT();
  const session = useApp((s) => s.session);
  const data = useApp((s) => s.data);
  const busy = useApp((s) => s.busy);
  const addTeamMember = useApp((s) => s.addTeamMember);
  const updateTeamMember = useApp((s) => s.updateTeamMember);
  const removeTeamMember = useApp((s) => s.removeTeamMember);
  const changePassword = useApp((s) => s.changePassword);

  const isOwner = session?.role === "owner";
  const team = data.team ?? [];

  const [addOpen, setAddOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [role, setRole] = React.useState<string>("driver");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const [editId, setEditId] = React.useState<string | null>(null);
  const [editRole, setEditRole] = React.useState<string>("driver");
  const [editActive, setEditActive] = React.useState(true);

  const [pwOpen, setPwOpen] = React.useState(false);
  const [currentPw, setCurrentPw] = React.useState("");
  const [newPw, setNewPw] = React.useState("");
  const [pwError, setPwError] = React.useState<string | null>(null);

  const roleLabel = (r: string) =>
    r === "owner" ? t("roleOwner") :
    r === "manager" ? t("roleManager") :
    r === "driver" ? t("roleDriver") :
    r === "accountant" ? t("roleAccountant") : r;

  const openAdd = () => {
    setName(""); setPhone(""); setRole("driver"); setPassword(""); setError(null);
    setAddOpen(true);
  };

  const submitAdd = async () => {
    if (!name.trim() || !phone.trim() || !password) { setError(t("fillAll")); return; }
    setError(null);
    const err = await addTeamMember({ name: name.trim(), phone: phone.trim(), role, password });
    if (err) { setError(t(err as TranslationKey)); return; }
    setAddOpen(false);
    toast.success(t("teamAdded"));
  };

  const openEdit = (id: string, r: string, active: boolean) => {
    setEditId(id); setEditRole(r); setEditActive(active);
  };

  const submitEdit = async () => {
    if (!editId) return;
    const member = team.find((m) => m.id === editId);
    const err = await updateTeamMember({
      id: editId,
      role: editRole,
      active: editActive,
      ...(member?.name ? {} : {}),
    });
    setEditId(null);
    if (err) { toast.error(t(err as TranslationKey)); return; }
    toast.success(editActive ? t("teamRoleChanged") : t("teamDeactivated"));
  };

  const toggleActive = async (id: string, active: boolean) => {
    const err = await updateTeamMember({ id, active });
    if (err) { toast.error(t(err as TranslationKey)); return; }
    toast.success(active ? t("teamActivated") : t("teamDeactivated"));
  };

  const submitRemove = async () => {
    if (!editId) return;
    const err = await removeTeamMember(editId);
    setEditId(null);
    if (err) { toast.error(t(err as TranslationKey)); return; }
    toast.success(t("teamRemoved"));
  };

  const submitPassword = async () => {
    if (!currentPw || !newPw) { setPwError(t("fillAll")); return; }
    setPwError(null);
    const err = await changePassword(currentPw, newPw);
    if (err) { setPwError(t(err as TranslationKey)); return; }
    setPwOpen(false);
    setCurrentPw(""); setNewPw("");
    toast.success(t("passwordChanged"));
  };

  const editMember = editId ? team.find((m) => m.id === editId) : null;

  return (
    <div className="space-y-3">
      {isOwner && (
        <button
          type="button"
          onClick={openAdd}
          className="w-full flex items-center gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3.5 py-3 text-left transition-colors hover:bg-primary/10"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserRoundPlus className="size-4.5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-foreground">{t("teamAddMember")}</span>
            <span className="block text-[11px] text-muted-foreground truncate">{t("teamAddMemberDesc")}</span>
          </span>
        </button>
      )}

      <div className="space-y-2">
        {team.map((m) => {
          const inactive = m.active === false;
          const isSelf = m.id === session?.id;
          return (
            <button
              key={m.id}
              type="button"
              disabled={!isOwner || isSelf}
              onClick={() => isOwner && !isSelf && openEdit(m.id, m.role, m.active !== false)}
              className={`w-full flex items-center gap-3 rounded-xl bg-muted/50 px-3.5 py-2.5 text-left ${inactive ? "opacity-55" : ""} ${isOwner && !isSelf ? "cursor-pointer hover:bg-muted" : "cursor-default"}`}
            >
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${inactive ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                {m.name.slice(0, 2)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="text-sm font-medium truncate">{m.name}</span>
                  {isSelf && <span className="text-[10px] text-primary font-semibold">({t("me")})</span>}
                </span>
                {m.phone && <span className="block text-[11px] text-muted-foreground tabular">{m.phone}</span>}
              </span>
              {inactive && (
                <Badge variant="outline" className="rounded-full text-[10px] font-semibold bg-muted shrink-0">
                  {t("teamInactive")}
                </Badge>
              )}
              <Badge variant="outline" className={`rounded-full text-[10px] font-semibold shrink-0 ${m.role === "owner" ? "bg-primary/10 border-primary/30 text-primary" : "bg-muted"}`}>
                {roleLabel(m.role)}
              </Badge>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => { setPwError(null); setCurrentPw(""); setNewPw(""); setPwOpen(true); }}
        className="w-full flex items-center gap-3 rounded-xl bg-muted/50 px-3.5 py-2.5 text-left hover:bg-muted"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <KeyRound className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{t("changePassword")}</span>
          <span className="block text-[11px] text-muted-foreground truncate">{t("changePasswordDesc")}</span>
        </span>
      </button>

      {/* ---- add member dialog ---- */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="size-4.5 text-primary" /> {t("teamAddMember")}
            </DialogTitle>
            <DialogDescription>{t("teamAddMemberDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5">
            {error && (
              <Alert variant="destructive" className="items-start">
                <TriangleAlert className="size-4 mt-0.5" />
                <AlertDescription className="text-[13px]">{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-1.5">
              <Label className="text-sm">{t("teamMemberName")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("name")} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm flex items-center gap-1.5">
                <Smartphone className="size-3.5 text-muted-foreground" /> {t("teamMemberPhone")}
              </Label>
              <Input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" className="h-11 rounded-xl tabular" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{t("teamMemberRole")}</Label>
              <div className="grid grid-cols-3 gap-2">
                {STAFF_ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`h-10 rounded-xl border text-[13px] font-medium transition-colors ${role === r ? "border-primary bg-primary/10 text-primary" : "border-border/70 bg-background text-muted-foreground hover:bg-muted/60"}`}
                  >
                    {roleLabel(r)}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm flex items-center gap-1.5">
                <KeyRound className="size-3.5 text-muted-foreground" /> {t("teamMemberPassword")}
              </Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" className="h-11 rounded-xl" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="h-11 rounded-xl" onClick={() => setAddOpen(false)}>{t("cancel")}</Button>
            <Button className="h-11 rounded-xl gap-2" onClick={() => void submitAdd()} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <UserRoundPlus className="size-4" />}
              {t("teamAddBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- edit member dialog ---- */}
      <Dialog open={Boolean(editId)} onOpenChange={(v) => !v && setEditId(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserRound className="size-4.5 text-primary" />
              <span className="truncate">{editMember?.name}</span>
            </DialogTitle>
            <DialogDescription>{editMember?.phone}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">{t("teamMemberRole")}</Label>
              <div className="grid grid-cols-3 gap-2">
                {STAFF_ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setEditRole(r)}
                    className={`h-10 rounded-xl border text-[13px] font-medium transition-colors ${editRole === r ? "border-primary bg-primary/10 text-primary" : "border-border/70 bg-background text-muted-foreground hover:bg-muted/60"}`}
                  >
                    {roleLabel(r)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3.5 py-3">
              <span className="text-sm">{t("teamInactive")}</span>
              <Switch checked={!editActive} onCheckedChange={(v) => setEditActive(!v)} />
            </div>
            <Button variant="outline" className="w-full h-11 rounded-xl gap-2 text-danger border-danger/30 hover:bg-danger/10 hover:text-danger" onClick={() => void submitRemove()} disabled={busy}>
              <Trash2 className="size-4" /> {t("teamRemoveConfirm")}
            </Button>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="h-11 rounded-xl" onClick={() => setEditId(null)}>{t("cancel")}</Button>
            <Button className="h-11 rounded-xl" onClick={() => void submitEdit()} disabled={busy}>{t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- change own password dialog ---- */}
      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="size-4.5 text-primary" /> {t("changePassword")}
            </DialogTitle>
            <DialogDescription>{t("changePasswordDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5">
            {pwError && (
              <Alert variant="destructive" className="items-start">
                <TriangleAlert className="size-4 mt-0.5" />
                <AlertDescription className="text-[13px]">{pwError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-1.5">
              <Label className="text-sm">{t("currentPassword")}</Label>
              <Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="••••••" className="h-11 rounded-xl" autoComplete="current-password" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{t("newPassword")}</Label>
              <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="••••••" className="h-11 rounded-xl" autoComplete="new-password" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="h-11 rounded-xl" onClick={() => setPwOpen(false)}>{t("cancel")}</Button>
            <Button className="h-11 rounded-xl" onClick={() => void submitPassword()} disabled={busy}>{t("changePasswordBtn")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
