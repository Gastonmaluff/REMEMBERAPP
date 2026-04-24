function ProgressRing({ value }) {
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (circumference * value) / 100

  return (
    <div className="progress-ring">
      <svg viewBox="0 0 88 88" aria-hidden="true">
        <circle className="progress-ring__track" cx="44" cy="44" r={radius} />
        <circle
          className="progress-ring__value"
          cx="44"
          cy="44"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <strong>{value}%</strong>
    </div>
  )
}

function ReminderStats({ stats }) {
  return (
    <section className="stats-scroll" aria-label="Resumen del día">
      {stats.map((stat) => {
        if (stat.type === 'progress') {
          return (
            <article className="stat-card stat-card--progress" key={stat.id}>
              <p className="stat-card__label">{stat.label}</p>
              <ProgressRing value={stat.value} />
              <p className="stat-card__caption">{stat.caption}</p>
            </article>
          )
        }

        const Icon = stat.icon

        return (
          <article className={`stat-card stat-card--${stat.tone}`} key={stat.id}>
            <div className="stat-card__icon">
              <Icon size={20} />
            </div>
            <strong className="stat-card__value">{stat.value}</strong>
            <p className="stat-card__label">{stat.label}</p>
            <p className="stat-card__caption">{stat.caption}</p>
          </article>
        )
      })}
    </section>
  )
}

export default ReminderStats
