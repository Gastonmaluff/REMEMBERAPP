function FilterChips({ activeValue, onChange, options }) {
  return (
    <div className="filter-chips" aria-label="Filtros de recordatorios">
      {options.map((option) => {
        const Icon = option.icon
        const isActive = activeValue === option.value

        return (
          <button
            className={`filter-chip ${isActive ? 'is-active' : ''}`}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            <Icon size={18} />
            <span>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default FilterChips
