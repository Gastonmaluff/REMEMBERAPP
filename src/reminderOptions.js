import { createElement } from 'react'
import {
  ArrowDown,
  ArrowUp,
  BellRing,
  BriefcaseBusiness,
  CalendarDays,
  Equal,
  FileText,
  Gift,
  House,
  ListTodo,
  NotebookPen,
  PhoneCall,
  Repeat2,
  SunMedium,
  UserRound,
  UsersRound,
} from 'lucide-react'

export const FILTER_OPTIONS = [
  { value: 'today', label: 'Hoy', icon: SunMedium },
  { value: 'upcoming', label: 'Próximos', icon: CalendarDays },
  { value: 'work', label: 'Trabajo', icon: BriefcaseBusiness },
  { value: 'personal', label: 'Personal', icon: UserRound },
]

export const CATEGORY_OPTIONS = [
  {
    value: 'Trabajo',
    label: 'Trabajo',
    icon: BriefcaseBusiness,
    iconId: 'briefcase',
    accent: '#2F80ED',
    surface: '#EEF4FF',
  },
  {
    value: 'Personal',
    label: 'Personal',
    icon: UserRound,
    iconId: 'gift',
    accent: '#D35A9D',
    surface: '#FFF0F7',
  },
  {
    value: 'Casa',
    label: 'Casa',
    icon: House,
    iconId: 'home',
    accent: '#F2A23B',
    surface: '#FFF6E9',
  },
]

export const PRIORITY_OPTIONS = [
  {
    value: 'Alta',
    label: 'Alta',
    icon: ArrowUp,
    accent: '#E94B53',
    surface: '#FFF1F1',
  },
  {
    value: 'Media',
    label: 'Media',
    icon: Equal,
    accent: '#F2A23B',
    surface: '#FFF7EA',
  },
  {
    value: 'Baja',
    label: 'Baja',
    icon: ArrowDown,
    accent: '#22A06B',
    surface: '#EBFBF3',
  },
]

export const REPEAT_OPTIONS = [
  { value: 'none', label: 'No repetir', icon: Repeat2 },
  { value: 'daily', label: 'Todos los días', icon: Repeat2 },
  { value: 'weekly', label: 'Cada semana', icon: Repeat2 },
  { value: 'monthly', label: 'Cada mes', icon: Repeat2 },
]

export const ALERT_OPTIONS = [
  { value: 10, label: '10 min antes', icon: BellRing },
  { value: 30, label: '30 min antes', icon: BellRing },
  { value: 60, label: '1 hora antes', icon: BellRing },
  { value: 1440, label: '1 día antes', icon: BellRing },
]

const ICON_COMPONENTS = {
  briefcase: BriefcaseBusiness,
  file: FileText,
  gift: Gift,
  home: House,
  list: ListTodo,
  note: NotebookPen,
  phone: PhoneCall,
  user: UserRound,
  users: UsersRound,
}

const SURFACE_BY_ACCENT = {
  '#2F80ED': '#EEF4FF',
  '#8B5CF6': '#F3EEFF',
  '#D35A9D': '#FFF0F7',
  '#E35D9B': '#FFF0F7',
  '#F2A23B': '#FFF6E9',
  '#22A06B': '#EBFBF3',
}

export function getCategoryMeta(category) {
  return CATEGORY_OPTIONS.find((option) => option.value === category) ?? CATEGORY_OPTIONS[1]
}

export function getPriorityMeta(priority) {
  return PRIORITY_OPTIONS.find((option) => option.value === priority) ?? PRIORITY_OPTIONS[1]
}

export function getRepeatMeta(repeat) {
  return REPEAT_OPTIONS.find((option) => option.value === repeat) ?? REPEAT_OPTIONS[0]
}

export function getAlertMeta(alertMinutes) {
  return ALERT_OPTIONS.find((option) => option.value === Number(alertMinutes)) ?? ALERT_OPTIONS[0]
}

export function getIconComponent(iconId) {
  return ICON_COMPONENTS[iconId] ?? FileText
}

export function renderReminderIcon(iconId, props) {
  return createElement(getIconComponent(iconId), props)
}

export function inferReminderVisual(title, category) {
  const normalizedTitle = title.trim().toLowerCase()

  if (/llam|call|proveedor|telefono/.test(normalizedTitle)) {
    return { icon: 'phone', color: '#2F80ED' }
  }

  if (/reuni|equipo|meeting|producci/.test(normalizedTitle)) {
    return { icon: 'users', color: '#8B5CF6' }
  }

  if (/paga|factura|servicio|cuenta/.test(normalizedTitle)) {
    return { icon: 'note', color: '#F2A23B' }
  }

  if (/cumple|regalo|familia|mam[aá]/.test(normalizedTitle)) {
    return { icon: 'gift', color: '#E35D9B' }
  }

  const categoryMeta = getCategoryMeta(category)

  return {
    icon: categoryMeta.iconId,
    color: categoryMeta.accent,
  }
}

export function getReminderVisual(reminder) {
  const categoryMeta = getCategoryMeta(reminder.category)
  const accent = reminder.color || categoryMeta.accent
  const surface = SURFACE_BY_ACCENT[accent] ?? categoryMeta.surface

  return {
    iconId: reminder.icon || categoryMeta.iconId,
    accent,
    surface,
  }
}
