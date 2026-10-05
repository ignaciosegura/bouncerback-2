import Screen from '../components/Screen.jsx'
import Menu from '../components/Menu.jsx'
import Button from '../components/Button.jsx'
import { MIN_VOLUME, MAX_VOLUME } from '../audio/soundManager.js'

/**
 * @typedef {Object} VolumeControlProps
 * @property {string} label
 * @property {number} value
 * @property {(value: number) => void} onChange
 */

/**
 * "Dual button": [-] LABEL VALUE [+]
 * @param {VolumeControlProps} props
 */
function VolumeControl ({ label, value, onChange }) {
  /** @param {number} v */
  const clamp = (v) => Math.min(MAX_VOLUME, Math.max(MIN_VOLUME, v))

  return (
    <div className="volume-control">
      <button
        type="button"
        className="volume-control__step"
        aria-label={`${label} down`}
        onClick={() => onChange(clamp(value - 1))}
      >
        -
      </button>
      <span className="volume-control__label">{label} {value}</span>
      <button
        type="button"
        className="volume-control__step"
        aria-label={`${label} up`}
        onClick={() => onChange(clamp(value + 1))}
      >
        +
      </button>
    </div>
  )
}

/**
 * @typedef {Object} SettingsMenuScreenProps
 * @property {number} musicVolume
 * @property {number} sfxVolume
 * @property {(value: number) => void} onMusicVolumeChange
 * @property {(value: number) => void} onSfxVolumeChange
 * @property {() => void} onBack
 */

/** @param {SettingsMenuScreenProps} props */
export default function SettingsMenuScreen ({
  musicVolume,
  sfxVolume,
  onMusicVolumeChange,
  onSfxVolumeChange,
  onBack
}) {
  return (
    <Screen variant="light" transparent>
      <Menu footer={<Button onClick={onBack}>&lt;&lt;&lt; BACK</Button>}>
        <VolumeControl label="MUSIC" value={musicVolume} onChange={onMusicVolumeChange} />
        <VolumeControl label="SFX" value={sfxVolume} onChange={onSfxVolumeChange} />
      </Menu>
    </Screen>
  )
}
