"use client";

import { useActiveAccount } from "@/hooks/useActiveAccount";
import { useContribute } from "@/hooks/useContribute";
import { useCloseRound } from "@/hooks/useCloseRound";
import type { ArisanSnapshot } from "@/hooks/useArisan";
import { toEth } from "@/lib/format";

const BTN_BASE =
  "inline-flex w-full items-center justify-center gap-2 rounded-[10px] px-5 py-3 text-sm font-semibold transition-colors " +
  "disabled:cursor-not-allowed disabled:bg-nila-tint disabled:text-muted";
const BTN_PRIMARY = `${BTN_BASE} bg-kunyit text-ink hover:bg-kunyit-deep`;
const BTN_SECONDARY = `${BTN_BASE} border border-nila bg-surface text-nila hover:bg-nila-tint disabled:border-transparent`;

function Spinner() {
  return (
    <span
      aria-hidden
      className="h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink motion-reduce:animate-none"
    />
  );
}

/** Dua aksi inti: "Setor X ETH" (anggota) dan "Tutup ronde" (siapa pun, F-6). */
export function ActionPanel({ snapshot }: { snapshot: ArisanSnapshot }) {
  const { account } = useActiveAccount();
  const contribute = useContribute();
  const closeRound = useCloseRound();

  const memberIndex = snapshot.members.findIndex(
    (m) => m.toLowerCase() === account.address.toLowerCase(),
  );
  const isMember = memberIndex >= 0;
  const alreadyContributed = isMember && snapshot.contributed[memberIndex];
  const potFull =
    snapshot.pot === snapshot.contributionAmount * BigInt(snapshot.members.length);
  const amountEth = toEth(snapshot.contributionAmount);

  const contributeDisabled =
    !isMember || alreadyContributed || contribute.isPending;
  const contributeHint = !isMember
    ? "Akun aktif bukan anggota — pilih akun anggota untuk menyetor."
    : alreadyContributed
      ? "Akun ini sudah setor untuk ronde berjalan."
      : null;

  return (
    <div className="rounded-[16px] border border-nila-tint bg-surface p-6 shadow-[var(--shadow-card)]">
      <h2 className="text-[1.25rem] font-semibold text-ink">Aksi</h2>

      <div className="mt-4 flex flex-col gap-3">
        <div>
          <button
            type="button"
            className={BTN_PRIMARY}
            disabled={contributeDisabled}
            onClick={() =>
              contribute.mutate({ amount: snapshot.contributionAmount })
            }
          >
            {contribute.isPending && <Spinner />}
            {contribute.isPending ? "Menyetor…" : `Setor ${amountEth} ETH`}
          </button>
          {contributeHint && (
            <p className="mt-1.5 text-[0.8rem] text-muted">{contributeHint}</p>
          )}
        </div>

        <div>
          <button
            type="button"
            className={potFull ? BTN_PRIMARY : BTN_SECONDARY}
            disabled={!potFull || closeRound.isPending}
            onClick={() => closeRound.mutate()}
          >
            {closeRound.isPending && <Spinner />}
            {closeRound.isPending ? "Menutup ronde…" : "Tutup ronde"}
          </button>
          {!potFull && (
            <p className="mt-1.5 text-[0.8rem] text-muted">
              Aktif setelah semua anggota setor. Siapa pun boleh menutup ronde —
              penerima & jumlah ditentukan kontrak.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
