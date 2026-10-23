import { useEffect, useState } from 'react'
import TextBox from './TextBox.jsx'
import { hasGamepad, watchGamepads } from '../input/gamepad.js'
import { isNative } from '../native.js'

// Tells the player a controller can be used, and switches as soon as one is detected (MAIN MENU and
// MAIN MENU - gamepad not detected mockups). Browsers only expose a controller once one of its
// buttons is pressed, so any menu interaction with it switches the indicator to the detected state.
// Not shown on phones and tablets: the native apps, and browsers whose primary input is touch only.

// Source art: assets/images/gamepad_detected.svg and gamepad_not_detected.svg, in the foreground
// color (currentColor) so they tint with the rest of the screen in transitions. The viewBox is
// cropped to the drawing's own bounds, so the element's box is the visible lines.
const VIEW_BOX = '91 197 818 571'

const OUTLINE = 'M674.654,559.444C674.443,559.16 674.214,558.848 673.969,558.511C672.192,556.064 667.926,550.754 659.854,550.701C643.404,550.593 504.121,550.698 500.006,550.701L499.907,550.701L499.901,550.701C495.786,550.698 356.503,550.593 340.053,550.701C331.981,550.754 327.715,556.064 325.938,558.511C325.693,558.848 325.464,559.16 325.253,559.444C324.769,560.986 323.012,566.616 321.329,572.403C310.818,608.545 285.1,699.006 266.907,726.901C258.692,739.498 251.561,752.109 238.554,759.913C225.471,767.763 206.221,771.202 173.167,763.49C123.655,751.937 89.543,710.271 91.668,601.9C92.477,560.671 103.314,463.921 126.417,378.69C142.134,320.706 163.755,268.121 191.232,240.85C216.735,215.539 265.878,202.315 318.105,196.479C318.391,196.447 318.678,196.43 318.966,196.429L665.966,194.955C666.209,194.954 666.452,194.964 666.695,194.985C724.313,199.975 780.736,213.121 808.674,240.85C836.152,268.121 857.773,320.706 873.49,378.69C896.593,463.921 907.43,560.671 908.239,601.9C910.363,710.271 876.252,751.937 826.739,763.49C793.686,771.202 774.436,767.763 761.353,759.913C748.346,752.109 741.215,739.498 733,726.901C714.807,699.006 689.089,608.545 678.578,572.403C676.895,566.616 675.138,560.986 674.654,559.444ZM666,203.58L319,205.054C268.856,210.658 221.485,222.774 197,247.076C130.333,313.242 101.334,534.022 100,602.076C98,704.076 128.398,744.202 175,755.076C235,769.076 245,745.076 260,722.076C282.385,687.752 316,557.076 318,555.076C319.055,554.02 325.247,542.172 340,542.076C356.456,541.968 495.791,542.072 499.907,542.075L500,542.075C504.116,542.072 643.451,541.968 659.907,542.076C674.66,542.172 680.851,554.02 681.907,555.076C683.907,557.076 717.522,687.752 739.907,722.076C754.907,745.076 764.907,769.076 824.907,755.076C871.509,744.202 901.907,704.076 899.907,602.076C898.573,534.022 869.574,313.242 802.907,247.076C776.006,220.376 721.478,208.385 666,203.58Z'
const BUMPER = 'M224,241C224,241 225,226 239,221C260.163,213.442 317.5,202.167 337,200C344.113,199.21 356,208 356,208L360,216C306.225,216.618 259.604,223.774 224,241Z'
const D_PAD = 'M238,355L208,355C202.481,355 198,350.519 198,345L198,325C198,319.481 202.481,315 208,315L238,315L238,285C238,279.481 242.481,275 248,275L268,275C273.519,275 278,279.481 278,285L278,315L308,315C313.519,315 318,319.481 318,325L318,345C318,350.519 313.519,355 308,355L278,355L278,385C278,390.519 273.519,395 268,395L248,395C242.481,395 238,390.519 238,385L238,355Z'
const QUESTION_MARK = 'M1595.021,346.875L1608.042,333.854L1660.125,333.854L1673.146,346.875L1673.146,372.917L1660.125,385.938L1647.104,385.938L1647.104,398.958L1621.062,398.958L1621.062,385.938L1634.083,372.917L1647.104,372.917L1647.104,346.875L1621.062,346.875L1621.062,359.896L1595.021,359.896L1595.021,346.875ZM1621.062,411.979L1647.104,411.979L1647.104,425L1621.062,425L1621.062,411.979Z'
const FACE_BUTTONS = [[740.5, 290.5], [793.5, 343.5], [740.5, 396.5], [687.5, 343.5]]

// Read once, when the indicator mounts. A touch-screen laptop still shows it: its primary input is a mouse or trackpad
function isMobileDevice () {
  return isNative || (window.matchMedia?.('(hover: none) and (pointer: coarse)').matches ?? false)
}

function GamepadDrawing ({ detected }) {
  return (
    <svg className="gamepad-indicator__drawing" viewBox={VIEW_BOX} fill="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="1.5" aria-hidden="true">
      <path d={OUTLINE} transform="matrix(1,0,0,0.96612,0,24.317058)"/>
      <g fill="none" stroke="currentColor" strokeWidth="4.17">
        <g transform="translate(-1,0)">
          <path d={BUMPER}/>
          <path d={BUMPER} transform="matrix(-1,0,0,1,1002,0)"/>
        </g>
        {detected && (
          <>
            <circle cx="368.5" cy="471" r="46"/>
            <circle cx="631.5" cy="471" r="46"/>
            <path d={D_PAD}/>
            {FACE_BUTTONS.map(([cx, cy]) => <circle key={`${cx},${cy}`} cx={cx} cy={cy} r="26.5" strokeWidth="4.16"/>)}
          </>
        )}
      </g>
      {!detected && <path d={QUESTION_MARK} transform="translate(-1134.083333,7.145833)"/>}
    </svg>
  )
}

export default function GamepadIndicator () {
  const [mobile] = useState(isMobileDevice)
  const [gamepadDetected, setGamepadDetected] = useState(hasGamepad)

  useEffect(() => mobile ? undefined : watchGamepads(setGamepadDetected), [mobile])

  if (mobile) return null
  return (
    <div className="gamepad-indicator">
      <TextBox size="hud" className="gamepad-indicator__text">
        {gamepadDetected ? 'Gamepad detected' : 'You can use a gamepad'}
      </TextBox>
      <GamepadDrawing detected={gamepadDetected}/>
    </div>
  )
}
