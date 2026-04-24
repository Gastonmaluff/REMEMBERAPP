import { useState } from 'react'
import {
  BellRing,
  CalendarDays,
  ChevronRight,
  Clock3,
  ListTodo,
  Paperclip,
  Plus,
  Repeat2,
  StickyNote,
  X,
} from 'lucide-react'
import {
  ALERT_OPTIONS,
  CATEGORY_OPTIONS,
  PRIORITY_OPTIONS,
  REPEAT_OPTIONS,
  getAlertMeta,
  getCategoryMeta,
  getPriorityMeta,
  getRepeatMeta,
  inferReminderVisual,
  renderReminderIcon,
} from '../reminderOptions'
import { formatFriendlyDate, formatFriendlyTime, getRoundedTime, getTodayKey } from '../reminderUtils'

function ExpandableRow({
  icon,
  isOpen,
  label,
  surface,
  value,
  children,
  onToggle,
}) {
  return (
    <div className={`settings-row ${isOpen ? 'is-open' : ''}`}>
      <button className="settings-row__summary" onClick={onToggle} type="button">
        <div className="settings-row__leading">
          <div className="settings-row__icon" style={{ background: surface }}>
            {icon}
          </div>
          <div>
            <p className="settings-row__label">{label}</p>
            <p className="settings-row__value">{value}</p>
          </div>
        </div>
        <ChevronRight className={`settings-row__chevron ${isOpen ? 'is-open' : ''}`} size={18} />
      </button>

      {isOpen ? <div className="settings-row__control">{children}</div> : null}
    </div>
  )
}

function ReminderForm({ errorMessage, isSubmitting, onSubmit }) {
  const [formValues, setFormValues] = useState({
    title: '',
    notes: '',
    date: getTodayKey(),
    time: getRoundedTime(),
    category: 'Trabajo',
    priority: 'Alta',
    repeat: 'none',
    alertMinutes: 10,
  })
  const [openSection, setOpenSection] = useState('date')

  const visual = inferReminderVisual(formValues.title, formValues.category)
  const categoryMeta = getCategoryMeta(formValues.category)
  const priorityMeta = getPriorityMeta(formValues.priority)
  const repeatMeta = getRepeatMeta(formValues.repeat)
  const alertMeta = getAlertMeta(formValues.alertMinutes)
  const PriorityPreviewIcon = priorityMeta.icon
  const isFormValid =
    formValues.title.trim().length > 0 && formValues.date.length > 0 && formValues.time.length > 0

  function updateField(field, value) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!isFormValid || isSubmitting) {
      return
    }

    await onSubmit({
      ...formValues,
      icon: visual.icon,
      color: visual.color,
    })
  }

  return (
    <form className="reminder-form" id="reminder-form" onSubmit={handleSubmit}>
      <div className="form-scroll">
        <section className="form-card">
          <div className="field-shell">
            <div
              className="field-shell__icon"
              style={{
                '--field-accent': visual.color,
                '--field-surface': categoryMeta.surface,
              }}
            >
              {renderReminderIcon(visual.icon, { size: 22 })}
            </div>

            <input
              aria-label="Título del recordatorio"
              onChange={(event) => updateField('title', event.target.value)}
              placeholder="Enviar propuesta a cliente"
              required
              type="text"
              value={formValues.title}
            />

            {formValues.title ? (
              <button
                aria-label="Limpiar título"
                className="field-shell__clear"
                onClick={() => updateField('title', '')}
                type="button"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>

          <div className="field-shell field-shell--textarea">
            <div className="field-shell__icon field-shell__icon--muted">
              <StickyNote size={20} />
            </div>

            <textarea
              aria-label="Notas del recordatorio"
              onChange={(event) => updateField('notes', event.target.value)}
              placeholder="Añadir notas"
              rows={3}
              value={formValues.notes}
            />
          </div>

          <p className="helper-text">
            Añade detalles adicionales sobre este recordatorio...
          </p>
        </section>

        <section className="form-card form-card--settings">
          <ExpandableRow
            icon={<CalendarDays size={20} color="#2F80ED" />}
            isOpen={openSection === 'date'}
            label="Fecha"
            onToggle={() => setOpenSection(openSection === 'date' ? '' : 'date')}
            surface="#EEF4FF"
            value={formatFriendlyDate(formValues.date)}
          >
            <label className="inline-picker">
              <span>Selecciona la fecha</span>
              <input
                aria-label="Fecha del recordatorio"
                onChange={(event) => updateField('date', event.target.value)}
                required
                type="date"
                value={formValues.date}
              />
            </label>
          </ExpandableRow>

          <ExpandableRow
            icon={<Clock3 size={20} color="#22A06B" />}
            isOpen={openSection === 'time'}
            label="Hora"
            onToggle={() => setOpenSection(openSection === 'time' ? '' : 'time')}
            surface="#EBFBF3"
            value={formatFriendlyTime(formValues.time)}
          >
            <label className="inline-picker">
              <span>Selecciona la hora</span>
              <input
                aria-label="Hora del recordatorio"
                onChange={(event) => updateField('time', event.target.value)}
                required
                type="time"
                value={formValues.time}
              />
            </label>
          </ExpandableRow>

          <div className="settings-row">
            <div className="settings-row__summary settings-row__summary--static">
              <div className="settings-row__leading">
                <div className="settings-row__icon" style={{ background: '#F3EEFF' }}>
                  <ListTodo size={20} color="#8B5CF6" />
                </div>
                <div>
                  <p className="settings-row__label">Lista / Categoría</p>
                  <p className="settings-row__value">Selecciona el contexto del recordatorio</p>
                </div>
              </div>
            </div>

            <div className="choice-row">
              {CATEGORY_OPTIONS.map((option) => {
                const Icon = option.icon
                const isSelected = formValues.category === option.value

                return (
                  <button
                    className={`choice-chip ${isSelected ? 'is-selected' : ''}`}
                    key={option.value}
                    onClick={() => updateField('category', option.value)}
                    style={{
                      '--choice-accent': option.accent,
                      '--choice-surface': option.surface,
                    }}
                    type="button"
                  >
                    <Icon size={16} />
                    <span>{option.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row__summary settings-row__summary--static">
              <div className="settings-row__leading">
                <div className="settings-row__icon" style={{ background: '#FFF7EA' }}>
                  <PriorityPreviewIcon size={20} color={priorityMeta.accent} />
                </div>
                <div>
                  <p className="settings-row__label">Prioridad</p>
                  <p className="settings-row__value">Define qué tan urgente es</p>
                </div>
              </div>
            </div>

            <div className="choice-row">
              {PRIORITY_OPTIONS.map((option) => {
                const Icon = option.icon
                const isSelected = formValues.priority === option.value

                return (
                  <button
                    className={`choice-chip ${isSelected ? 'is-selected' : ''}`}
                    key={option.value}
                    onClick={() => updateField('priority', option.value)}
                    style={{
                      '--choice-accent': option.accent,
                      '--choice-surface': option.surface,
                    }}
                    type="button"
                  >
                    <Icon size={16} />
                    <span>{option.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <ExpandableRow
            icon={<Repeat2 size={20} color="#8B5CF6" />}
            isOpen={openSection === 'repeat'}
            label="Repetir"
            onToggle={() => setOpenSection(openSection === 'repeat' ? '' : 'repeat')}
            surface="#F3EEFF"
            value={repeatMeta.label}
          >
            <label className="inline-picker">
              <span>Frecuencia</span>
              <select
                aria-label="Frecuencia de repetición"
                onChange={(event) => updateField('repeat', event.target.value)}
                value={formValues.repeat}
              >
                {REPEAT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </ExpandableRow>

          <ExpandableRow
            icon={<BellRing size={20} color="#F2A23B" />}
            isOpen={openSection === 'alert'}
            label="Recordatorio / Alerta"
            onToggle={() => setOpenSection(openSection === 'alert' ? '' : 'alert')}
            surface="#FFF7EA"
            value={alertMeta.label}
          >
            <label className="inline-picker">
              <span>Cuándo avisar</span>
              <select
                aria-label="Momento de alerta"
                onChange={(event) => updateField('alertMinutes', Number(event.target.value))}
                value={formValues.alertMinutes}
              >
                {ALERT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </ExpandableRow>
        </section>

        <section className="form-card">
          <button className="utility-row" type="button">
            <span className="utility-row__leading">
              <span className="utility-row__icon utility-row__icon--blue">
                <ListTodo size={18} />
              </span>
              Añadir subtarea
            </span>
            <span className="utility-row__action">
              <Plus size={16} />
            </span>
          </button>

          <button className="utility-row" type="button">
            <span className="utility-row__leading">
              <span className="utility-row__icon utility-row__icon--purple">
                <Paperclip size={18} />
              </span>
              Añadir archivo
            </span>
            <span className="utility-row__action">
              <Plus size={16} />
            </span>
          </button>
        </section>

        {errorMessage ? <p className="feedback-message feedback-message--error">{errorMessage}</p> : null}
      </div>

      <div className="form-footer">
        <button className="primary-button" disabled={!isFormValid || isSubmitting} type="submit">
          {isSubmitting ? 'Creando...' : 'Crear recordatorio'}
        </button>
      </div>
    </form>
  )
}

export default ReminderForm
