import Button from './Button.jsx'
import { MIN_VOLUME, MAX_VOLUME } from '../audio/soundManager.js'

// "Dual button": [-] LABEL VALUE [+]
function VolumeControl ({ label, value, onChange }) {
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

// The Settings controls, shared by the Settings screen and the Pause overlay. A fragment, so they
// are direct items of the surrounding Menu.
// OLD TV is a button only for now: its functionality will be connected from another branch.
export default function SettingsControls ({ musicVolume, sfxVolume, onMusicVolumeChange, onSfxVolumeChange }) {
  return (
    <>
      <VolumeControl label="MUSIC" value={musicVolume} onChange={onMusicVolumeChange} />
      <VolumeControl label="SFX" value={sfxVolume} onChange={onSfxVolumeChange} />
      <Button onClick={() => {}}>OLD TV ON</Button>
    </>
  )
}
