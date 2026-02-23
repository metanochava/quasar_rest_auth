import {
  QInput,
  QSelect,
  QCheckbox,
  QToggle,
  QRadio,
  QOptionGroup,
  QDate,
  QTime,
  QFile,
  QUploader,
  QEditor,
  QSlider,
  QRange,
  QKnob,
  QField
} from 'quasar'


export const componentMap = {
  // 🔤 TEXT / INPUT
  'q-input': QInput,
  'q-field': QField,

  // 🔽 SELECT / RELATIONS
  'q-select': QSelect,
  'q-option-group': QOptionGroup,

  // ✅ BOOLEAN
  'q-checkbox': QCheckbox,
  'q-toggle': QToggle,
  'q-radio': QRadio,

  // 📅 DATE / TIME
  'q-date': QDate,
  'q-time': QTime,

  // 📂 FILES
  'q-file': QFile,
  'q-uploader': QUploader,

  // ✍️ RICH TEXT
  'q-editor': QEditor,

  // 🎚 NUMERIC / RANGE
  'q-slider': QSlider,
  'q-range': QRange,
  'q-knob': QKnob,
}