import Screen from '../components/Screen.jsx'
import Menu from '../components/Menu.jsx'
import Button from '../components/Button.jsx'
import SettingsControls from '../components/SettingsControls.jsx'

export default function SettingsMenuScreen ({ settings, onBack }) {
  return (
    <Screen variant="light" transparent>
      <Menu className="settings-menu" footer={<Button data-gamepad="back" onClick={onBack}>&lt;&lt;&lt; BACK</Button>}>
        <SettingsControls {...settings} />
      </Menu>
    </Screen>
  )
}
