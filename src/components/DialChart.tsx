// Self-serve dial chart — the colored arrow-row settings reference shown on the
// Instructions section. Visual port of the standalone dial-chart.html mock.

type Variant = 'default' | 'lustra' | 'stop'

type Row = {
  bg?: string
  fg?: string
  label: React.ReactNode
  instruction: React.ReactNode
  variant?: Variant
}

const ROWS: Row[] = [
  {
    bg: '#4a4a52',
    fg: '#fff',
    label: <span>Engine Cleaner</span>,
    instruction: (
      <>
        Apply to entire engine.
        <br />
        <strong>Spot free rinse.</strong>
      </>
    ),
  },
  {
    bg: '#ffffff',
    fg: '#1B4FD9',
    label: (
      <span>
        <SpectrumMark /> Tire &amp; Wheel Cleaner
      </span>
    ),
    instruction: (
      <>
        Apply to wheels or tires.
        <br />
        <strong>High pressure rinse.</strong>
      </>
    ),
  },
  {
    bg: '#e6157a',
    fg: '#fff',
    label: (
      <span>
        <SpectrumMark /> Low Pressure Presoak
      </span>
    ),
    instruction: (
      <>
        Apply to entire vehicle
        <br />
        from bottom up.
      </>
    ),
  },
  {
    bg: '#f08a17',
    fg: '#fff',
    label: (
      <span>
        <SpectrumMark /> High Pressure Detergent
      </span>
    ),
    instruction: (
      <>
        Apply to entire vehicle
        <br />
        from bottom up.
      </>
    ),
  },
  {
    bg: '#1B4FD9',
    fg: '#fff',
    label: (
      <span>
        <SpectrumMark /> Foaming Brush Detergent
      </span>
    ),
    instruction: (
      <>
        Scrub vehicle, top to bottom.
        <br />
        <strong>High pressure rinse.</strong>
      </>
    ),
  },
  {
    bg: '#FFD93D',
    fg: '#08183F',
    label: <span>High Pressure Rinse</span>,
    instruction: (
      <>
        Rinse entire vehicle
        <br />
        from top down.
      </>
    ),
  },
  {
    bg: '#b8d54a',
    fg: '#08183F',
    label: (
      <span>
        <SpectrumMark /> Clear Coat Sealant
      </span>
    ),
    instruction: (
      <>
        Apply to entire vehicle.
        <br />
        <strong>Finish with final rinse.</strong>
      </>
    ),
  },
  {
    variant: 'lustra',
    label: <span className="dial-lustra-wm">LustraShield</span>,
    instruction: (
      <>
        Apply to entire vehicle.
        <br />
        <strong>Finish with final rinse.</strong>
      </>
    ),
  },
  {
    bg: '#3fb5e6',
    fg: '#fff',
    label: <span>Spot Free Rinse</span>,
    instruction: (
      <>
        Apply spot free rinse
        <br />
        to entire vehicle.
      </>
    ),
  },
  {
    variant: 'stop',
    bg: '#e32a2a',
    fg: '#fff',
    label: (
      <>
        <span className="dial-stop-badge">STOP</span>
        <span>STOP</span>
      </>
    ),
    instruction: (
      <>
        Safety feature,
        <br />
        time continues to run.
      </>
    ),
  },
]

function SpectrumMark() {
  return (
    <b className="font-black not-italic" style={{ fontStyle: 'italic' }}>
      Spectrum<sup style={{ fontSize: '0.6em', verticalAlign: 'super' }}>&reg;</sup>
    </b>
  )
}

export default function DialChart() {
  return (
    <div
      className="w-full mx-auto rounded-[14px] p-3.5 flex flex-col gap-2.5"
      style={{
        background: '#1B4FD9',
        border: '3px solid #fff',
        boxShadow: '0 24px 60px rgba(0,0,0,.4)',
      }}
    >
      {ROWS.map((row, i) => (
        <div
          key={i}
          className="grid grid-cols-[1.05fr_1fr] gap-2 bg-white rounded-lg overflow-hidden min-h-[62px]"
        >
          <div
            className={
              'flex items-center px-4 py-2.5 font-extrabold uppercase text-[14px] leading-tight tracking-wide relative ' +
              (row.variant === 'lustra' ? 'dial-arrow-lustra ' : '') +
              (row.variant === 'stop' ? 'dial-arrow-stop ' : '')
            }
            style={{
              background:
                row.variant === 'lustra'
                  ? 'linear-gradient(180deg,#ece2ec 0%,#c8a8c8 50%,#7a4d7a 100%)'
                  : row.bg,
              color: row.variant === 'lustra' ? '#7a1e6f' : row.fg,
              clipPath:
                'polygon(0 0, calc(100% - 22px) 0, 100% 50%, calc(100% - 22px) 100%, 0 100%)',
              paddingLeft: row.variant === 'stop' ? '6px' : undefined,
              paddingRight: '36px',
            }}
          >
            {row.label}
          </div>
          <div className="flex items-center px-3 py-2 text-[#1B4FD9] font-extrabold uppercase text-[12.5px] leading-snug">
            {row.instruction}
          </div>
        </div>
      ))}

      <style>{`
        .dial-lustra-wm {
          font-family: 'Archivo Black', Impact, Haettenschweiler, system-ui, sans-serif;
          font-style: italic;
          font-size: 22px;
          letter-spacing: -0.01em;
          text-transform: none;
          color: #7a1e6f;
          text-shadow: 0 1px 0 #fff, 1px 1px 0 #fff;
        }
        .dial-stop-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          background: #e32a2a;
          color: #fff;
          font-family: 'Archivo Black', Impact, system-ui, sans-serif;
          font-size: 11px;
          margin-right: 12px;
          flex-shrink: 0;
          clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%);
        }
        .dial-arrow-stop > span:last-child {
          font-size: 18px;
          font-family: 'Archivo Black', Impact, system-ui, sans-serif;
          font-style: italic;
          letter-spacing: -0.01em;
          text-transform: none;
        }
        @media (max-width: 480px) {
          .dial-lustra-wm { font-size: 16px; }
          .dial-stop-badge { width: 34px; height: 34px; font-size: 10px; margin-right: 8px; }
          .dial-arrow-stop > span:last-child { font-size: 14px; }
        }
      `}</style>
    </div>
  )
}
