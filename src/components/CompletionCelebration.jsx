const CONFETTI_COLORS = {
  blue: '#2F80ED',
  green: '#27AE60',
  red: '#EB5757',
  yellow: '#F2C94C',
  white: '#FFFFFF',
  coral: '#F17A8A',
}

const CONFETTI_PIECES = [
  { x: '-14px', y: '-62px', rotate: '-92deg', delay: '0ms', color: 'blue' },
  { x: '10px', y: '-74px', rotate: '104deg', delay: '30ms', color: 'yellow' },
  { x: '38px', y: '-56px', rotate: '146deg', delay: '70ms', color: 'green' },
  { x: '58px', y: '-26px', rotate: '188deg', delay: '120ms', color: 'red' },
  { x: '42px', y: '8px', rotate: '236deg', delay: '90ms', color: 'white', shape: 'dot' },
  { x: '-52px', y: '-38px', rotate: '-138deg', delay: '60ms', color: 'yellow' },
  { x: '-70px', y: '-8px', rotate: '-220deg', delay: '140ms', color: 'blue' },
  { x: '-38px', y: '18px', rotate: '-284deg', delay: '180ms', color: 'green', shape: 'dot' },
  { x: '22px', y: '26px', rotate: '270deg', delay: '110ms', color: 'red' },
]

const STREAMERS = [
  { x: '-58px', y: '-48px', rotate: '-142deg', delay: '40ms', color: 'yellow' },
  { x: '-12px', y: '-78px', rotate: '-92deg', delay: '0ms', color: 'blue' },
  { x: '42px', y: '-50px', rotate: '-34deg', delay: '80ms', color: 'green' },
]

const SPARKLES = [
  { x: '-28px', y: '-36px', delay: '70ms', color: 'white' },
  { x: '6px', y: '-56px', delay: '100ms', color: 'yellow' },
  { x: '30px', y: '-14px', delay: '160ms', color: 'blue' },
  { x: '-50px', y: '4px', delay: '210ms', color: 'red' },
]

function getCelebrationColor(colorKey, isMaria) {
  if (isMaria && colorKey === 'red') {
    return CONFETTI_COLORS.coral
  }

  return CONFETTI_COLORS[colorKey] ?? CONFETTI_COLORS.blue
}

function CompletionCelebration({ compact = false, isMaria = false }) {
  return (
    <div
      aria-hidden="true"
      className={`completion-celebration ${compact ? 'completion-celebration--compact' : ''} ${isMaria ? 'is-maria' : ''}`}
    >
      {STREAMERS.map((streamer, index) => (
        <span
          className="completion-celebration__streamer"
          key={`streamer-${index}`}
          style={{
            '--celebration-piece-delay': streamer.delay,
            '--celebration-piece-x': streamer.x,
            '--celebration-piece-y': streamer.y,
            '--celebration-piece-rotate': streamer.rotate,
            '--celebration-piece-color': getCelebrationColor(streamer.color, isMaria),
          }}
        />
      ))}

      {CONFETTI_PIECES.map((piece, index) => (
        <span
          className={`completion-celebration__confetti ${piece.shape === 'dot' ? 'completion-celebration__confetti--dot' : ''}`}
          key={`confetti-${index}`}
          style={{
            '--celebration-piece-delay': piece.delay,
            '--celebration-piece-x': piece.x,
            '--celebration-piece-y': piece.y,
            '--celebration-piece-rotate': piece.rotate,
            '--celebration-piece-color': getCelebrationColor(piece.color, isMaria),
          }}
        />
      ))}

      {SPARKLES.map((sparkle, index) => (
        <span
          className="completion-celebration__sparkle"
          key={`sparkle-${index}`}
          style={{
            '--celebration-piece-delay': sparkle.delay,
            '--celebration-piece-x': sparkle.x,
            '--celebration-piece-y': sparkle.y,
            '--celebration-piece-color': getCelebrationColor(sparkle.color, isMaria),
          }}
        />
      ))}
    </div>
  )
}

export default CompletionCelebration
