export const LightningEffects = ({ lightningSeeds }) => (
  <g>
    {lightningSeeds.map(seed => (
      <path
        key={seed.id}
        d={`M ${seed.startX} 0 L ${seed.startX + seed.o1} 200 L ${seed.startX + seed.o2} 400 L ${seed.startX + seed.o3} 600`}
        fill='none'
        stroke='var(--color-warning-yellow)'
        strokeWidth={seed.w}
        className='animate-[flash_0.05s_infinite]'
        style={{
          filter: 'drop-shadow(0 0 20px var(--color-warning-yellow))'
        }}
      />
    ))}
  </g>
)
