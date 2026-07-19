"use client";

import { AccountSwitcher } from "@/components/AccountSwitcher";
import { ActionPanel } from "@/components/ActionPanel";
import { ArisanRing } from "@/components/ArisanRing";
import { CopyMono } from "@/components/CopyMono";
import { HistoryTable } from "@/components/HistoryTable";
import { PotCard } from "@/components/PotCard";
import { RoundProgress } from "@/components/RoundProgress";
import { TxToastStack } from "@/components/TxToast";
import {
  useArisan,
  useArisanEvents,
  useRoundHistory,
} from "@/hooks/useArisan";
import { RPC_URL } from "@/lib/clients";
import { ARISAN_ADDRESS, ArisanState } from "@/lib/contract";
import { revertMessage } from "@/lib/errors";
import { toEth } from "@/lib/format";

function ConnectionError({ detail }: { detail: string | null }) {
  return (
    <div className="rounded-[16px] border border-rust/40 bg-surface p-6 shadow-[var(--shadow-card)]">
      <h2 className="text-[1.25rem] font-semibold text-rust">
        Tidak bisa memuat data on-chain
      </h2>
      {detail && <p className="mt-2 text-sm text-ink-soft">{detail}</p>}
      <p className="mt-2 text-sm text-ink-soft">
        Pastikan Anvil berjalan dan kontrak sudah dideploy, lalu muat ulang
        halaman ini:
      </p>
      <pre className="mt-3 overflow-x-auto rounded-[10px] bg-nila-tint p-4 font-mono text-[0.8rem] leading-6 text-ink">
        {`anvil
forge script script/Deploy.s.sol --rpc-url ${RPC_URL} --broadcast
cd app && npm run dev`}
      </pre>
    </div>
  );
}

/** Node putus di sesi berjalan: data terakhir tetap tampil + peringatan. */
function OfflineBanner({ detail }: { detail: string | null }) {
  return (
    <div
      role="alert"
      className="rounded-[10px] border border-rust/40 bg-surface px-4 py-3 text-sm text-rust shadow-[var(--shadow-card)]"
    >
      {detail ?? "Koneksi ke chain lokal terputus."} Menampilkan data terakhir
      yang termuat.
    </div>
  );
}

function SetupNotice() {
  return (
    <div className="rounded-[16px] border border-nila-tint bg-surface p-6 shadow-[var(--shadow-card)]">
      <h2 className="text-[1.25rem] font-semibold text-ink">
        Arisan masih tahap setup
      </h2>
      <p className="mt-2 text-sm text-ink-soft">
        Belum ada siklus berjalan. Jalankan script deploy (deploy + daftar
        anggota + mulai) agar arisan aktif:
      </p>
      <pre className="mt-3 overflow-x-auto rounded-[10px] bg-nila-tint p-4 font-mono text-[0.8rem] leading-6 text-ink">
        forge script script/Deploy.s.sol --rpc-url {RPC_URL} --broadcast
      </pre>
    </div>
  );
}

export default function Dashboard() {
  const arisan = useArisan();
  const history = useRoundHistory();
  const offline = useArisanEvents();

  const snapshot = arisan.data;
  const finished = snapshot?.state === ArisanState.Finished;
  // Dihitung dari snapshot (pasti benar by invariant kontrak), bukan dari
  // log riwayat yang bisa belum/gagal termuat.
  const totalDisbursed =
    snapshot && finished
      ? snapshot.contributionAmount *
        BigInt(snapshot.members.length) *
        snapshot.totalRounds
      : 0n;
  const degraded = offline || arisan.isError;
  const errorDetail = arisan.isError ? revertMessage(arisan.error) : null;

  return (
    <div className="min-h-screen">
      <header className="bg-nila">
        <div className="mx-auto flex max-w-[960px] items-center justify-between gap-4 px-6 py-4">
          <h1
            className="text-[1.25rem] font-semibold text-paper"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            Arisan On-Chain
          </h1>
          <AccountSwitcher />
        </div>
      </header>

      <main className="mx-auto flex max-w-[960px] flex-col gap-6 px-6 py-8">
        {degraded && !snapshot && <ConnectionError detail={errorDetail} />}
        {degraded && snapshot && <OfflineBanner detail={errorDetail} />}

        {arisan.isLoading && (
          <p className="py-16 text-center text-sm text-muted">
            Memuat data on-chain…
          </p>
        )}

        {snapshot && snapshot.state === ArisanState.Setup && <SetupNotice />}

        {snapshot && snapshot.state !== ArisanState.Setup && (
          <>
            {finished && (
              <div className="rounded-[16px] border border-jade/40 bg-surface p-6 shadow-[var(--shadow-card)]">
                <h2 className="text-[1.563rem] font-semibold text-jade">
                  Arisan selesai
                </h2>
                <p className="mt-1 text-sm text-ink-soft">
                  Seluruh {Number(snapshot.totalRounds)} ronde tuntas — setiap
                  anggota menerima pot tepat satu kali. Total tersalurkan:{" "}
                  <span className="font-mono text-ink">
                    {toEth(totalDisbursed)} ETH
                  </span>
                  .
                </p>
              </div>
            )}

            <section className="grid gap-6 md:grid-cols-[1fr_320px]">
              <div className="rounded-[16px] border border-nila-tint bg-surface p-6 shadow-[var(--shadow-card)]">
                <ArisanRing
                  members={snapshot.members}
                  currentRound={Number(snapshot.currentRound)}
                  totalRounds={Number(snapshot.totalRounds)}
                  finished={finished}
                />
                {!finished && (
                  <div className="mt-6 border-t border-line pt-4">
                    <RoundProgress
                      paid={Number(snapshot.paid)}
                      total={Number(snapshot.total)}
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-6">
                <PotCard
                  pot={snapshot.pot}
                  round={Number(snapshot.currentRound)}
                  contributionAmount={snapshot.contributionAmount}
                  memberCount={snapshot.members.length}
                  finished={finished}
                />
                {!finished && <ActionPanel snapshot={snapshot} />}
              </div>
            </section>

            <HistoryTable
              members={snapshot.members}
              currentRound={Number(snapshot.currentRound)}
              finished={finished}
              history={history.data ?? []}
              historyFailed={history.isError}
            />
          </>
        )}

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-[0.8rem] text-muted">
          <span className="inline-flex items-center gap-2">
            Kontrak <CopyMono value={ARISAN_ADDRESS} />
          </span>
          <span className="font-mono">Anvil · chainId 31337</span>
        </footer>
      </main>

      <TxToastStack />
    </div>
  );
}
