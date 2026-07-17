"use client";

import { labelFor } from "@/lib/accounts";

const SIZE = 372;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R_OUTER = 132;
const R_INNER = 96;
const R_LABEL = 152;
const GAP_DEG = 3;

function polar(r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

/** Path sektor cincin (donut segment) dari sudut a0 ke a1 (derajat). */
function sectorPath(a0: number, a1: number): string {
  const large = a1 - a0 > 180 ? 1 : 0;
  const [x0, y0] = polar(R_OUTER, a0);
  const [x1, y1] = polar(R_OUTER, a1);
  const [x2, y2] = polar(R_INNER, a1);
  const [x3, y3] = polar(R_INNER, a0);
  return [
    `M ${x0} ${y0}`,
    `A ${R_OUTER} ${R_OUTER} 0 ${large} 1 ${x1} ${y1}`,
    `L ${x2} ${y2}`,
    `A ${R_INNER} ${R_INNER} 0 ${large} 0 ${x3} ${y3}`,
    "Z",
  ].join(" ");
}

type ArisanRingProps = {
  members: readonly string[];
  currentRound: number;
  totalRounds: number;
  finished: boolean;
};

/**
 * Signature element (design-system §5): cincin anggota berurutan.
 * Penerima ronde ini kunyit, sudah menerima nila-tint, belum outline nila.
 * Indikator giliran berotasi 400ms ease-out; prefers-reduced-motion dihormati.
 */
export function ArisanRing({
  members,
  currentRound,
  totalRounds,
  finished,
}: ArisanRingProps) {
  const n = members.length;
  if (n === 0) return null;

  const step = 360 / n;
  const indicatorDeg = finished ? 360 : currentRound * step;

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label={
        finished
          ? `Arisan selesai, ${totalRounds} ronde tuntas`
          : `Ronde ${currentRound + 1} dari ${totalRounds}, giliran ${labelFor(members[currentRound])}`
      }
      className="mx-auto w-full max-w-[340px]"
    >
      {members.map((member, i) => {
        const a0 = i * step - 90 + GAP_DEG / 2;
        const a1 = (i + 1) * step - 90 - GAP_DEG / 2;
        const isRecipient = !finished && i === currentRound;
        const hasReceived = finished || i < currentRound;

        const fill = isRecipient
          ? "var(--kunyit)"
          : hasReceived
            ? "var(--nila-tint)"
            : "var(--surface)";
        const stroke = isRecipient
          ? "var(--kunyit-deep)"
          : hasReceived
            ? "var(--line)"
            : "var(--nila)";

        const mid = (a0 + a1) / 2;
        const [lx, ly] = polar(R_LABEL, mid);

        return (
          <g key={member}>
            <path
              d={sectorPath(a0, a1)}
              fill={fill}
              stroke={stroke}
              strokeWidth={1.5}
              className="transition-colors duration-[400ms] ease-out motion-reduce:transition-none"
            />
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              className="transition-colors duration-[400ms] motion-reduce:transition-none"
              fontSize={11}
              fontWeight={isRecipient ? 600 : 400}
              fill={
                isRecipient
                  ? "var(--ink)"
                  : hasReceived
                    ? "var(--muted)"
                    : "var(--ink-soft)"
              }
            >
              {labelFor(member)}
            </text>
          </g>
        );
      })}

      {/* Indikator giliran: titik kecil yang berputar ke segmen penerima. */}
      {!finished && (
        <g
          style={{
            transform: `rotate(${indicatorDeg}deg)`,
            transformOrigin: `${CX}px ${CY}px`,
          }}
          className="transition-transform duration-[400ms] ease-out motion-reduce:transition-none"
        >
          <circle
            cx={polar(R_INNER - 10, -90 + step / 2)[0]}
            cy={polar(R_INNER - 10, -90 + step / 2)[1]}
            r={5}
            fill="var(--kunyit)"
            stroke="var(--kunyit-deep)"
            strokeWidth={1}
          />
        </g>
      )}

      {/* Teks tengah: ronde berjalan / selesai. */}
      <text
        x={CX}
        y={CY - 8}
        textAnchor="middle"
        fontSize={26}
        fontWeight={600}
        fill="var(--ink)"
        style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
      >
        {finished ? "Selesai" : `Ronde ${currentRound + 1}/${totalRounds}`}
      </text>
      <text
        x={CX}
        y={CY + 18}
        textAnchor="middle"
        fontSize={13}
        fill="var(--muted)"
      >
        {finished
          ? `${totalRounds} ronde tuntas`
          : `Giliran ${labelFor(members[currentRound])}`}
      </text>
    </svg>
  );
}
