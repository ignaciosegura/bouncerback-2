import Overlay from '../components/Overlay.jsx'
import Menu from '../components/Menu.jsx'
import Button from '../components/Button.jsx'
import SettingsControls from '../components/SettingsControls.jsx'

// Over the frozen Game Screen: the Settings controls, EXIT TO MENU and RESUME on a panel in the
// gameplay background's color (GAMEPLAY PAUSE MENU mockup). Not a screen change: no transition.
// The controller's right face button and menu button both press RESUME.
export default function PauseOverlay ({ settings, backgroundColor, onExitToMenu, onResume }) {
  return (
    <Overlay className="pause-overlay">
      <div className="pause-overlay__panel" style={{ background: backgroundColor }}>
        <Menu>
          <SettingsControls {...settings} />
          <Button className="pause-overlay__exit" onClick={onExitToMenu}>EXIT TO MENU</Button>
          <Button data-gamepad="back menu" onClick={onResume}>&lt;&lt;&lt; RESUME</Button>
        </Menu>
      </div>
    </Overlay>
  )
}
