# Layout

The screen will be used in forced landscape mode. The visual style is based on early arcade computers, such as Pong, Asteroids or Defender. Details below:

## The background

* The background will always be black, except in the inverted menu layouts, where the background will be white, and during gameplay when the player has only one life left, where it turns dark red (see "Visual feedback" below).
    * During the game, black background, white lines and full circles only (except for the color changes in "Visual feedback" and "Visual feedback for additional game mechanics" below). No textures. The vector assets provided will also be in black and white.
    * The one exception to "no textures" is the end-of-level interstitials: bitmap pictures shown after a level has ended, between player actions, so gameplay itself stays vector only (see "End-of-level interstitials" below).
    * During the menus, the same font and visual style will be used. The background will be black, with white text. In some cases, the layout will be inverted, white background, black texts and outlines.

## Menu background animation

* The Main Menu, Level Select, Settings and How To Play screens show the vector animation `assets/motion/intro_animation.json` (Lottie) on top of the white (#D8D8D8) background and behind the text and buttons. Its light-grey and white lines are meant to be subtle, tone on tone. The Intro screen (ENTER BOUNCERBACK) doesn't show it: it's a plain white (#D8D8D8) background.
* It starts at the same moment as the menu music (they were made together), and stays still until the music starts.
* It plays continuously while the player moves between those four screens: changing screens never restarts or pauses it. It starts again from the beginning when the player comes back to the menus after playing a level.
* It covers the whole screen (cropped at the top and bottom on screens wider than 16:9) and loops: the content (about 125 s) plus 5 seconds of empty background, then back to the start.
* It's drawn on a PixiJS canvas behind the menus' HTML layer (`src/menu/MenuScene.js`): Lottie's canvas renderer draws each frame into an off-screen canvas, which PixiJS shows as a full-screen texture. It looks the same as when Lottie drew it as SVG; drawing it in PixiJS lets the CRT effect process it (see "CRT on the menus" in `docs/design-decisions.md`).

## How To Play screen

* Opened by the Main Menu's HOW TO button (see the HOW TO PLAY and MAIN MENU mockups). Light layout over the menu background animation, like Settings.
* Left: the instructions, the text of `docs/game-instructions.md`, in mixed case (the `MOUSE` and `GAMEPAD` headings are uppercase), 24px, left-aligned, no border, wrapped at 38 characters, with one blank line between paragraphs. The single-line rule is unbreakable for buttons only: this text is exempt.
* Right: the example drawing (`assets/images/HOW TO PLAY example vector.svg`, text converted to paths) in the foreground color, with the Back button below it, centered under the ring. At the 1920x1080 reference size the text starts at x = 202, the drawing's left edge is at x = 1083, and the Back button's top is at y = 903.
* It's one of the screens' elements, so the text, the drawing and the button take part in the screen transitions (see "Screen transitions").

## Intro screen note

* The Intro screen shows one line of text above the ENTER BOUNCERBACK button: "Grab your best headphones first ;)" (see the INTRO mockup).
* It's written in mixed case exactly as above, not all uppercase.
* It's 32px, the same size as the button's text, in the screen's foreground color (black on the white #D8D8D8 background), with no border: it's a note, not a button, like the scores on the Game Over and You Win! screens.
* At the 1920x1080 reference size, the bottom of its text line is 59px above the button's top edge, and it's horizontally centered. The button doesn't move: it stays centered on the screen.
* It's one of the screen's elements, so it takes part in the screen transitions together with the button (see "Screen transitions").
* The ENTER BOUNCERBACK button blinks; the note doesn't (see "Blinking buttons").

## Game logo

* The game logo (source art: `assets/images/game_logo.svg`, vector, black) is shown at the top of the Main Menu, above its buttons: PLAY, SETTINGS and HOW TO (see the MAIN MENU mockup), plus EXIT GAME in the desktop builds (see the MAIN MENU - desktop mockup). It isn't shown on any other screen, How To Play included. It's drawn by PixiJS in the menu scene, behind the HTML layer (`src/menu/MenuLogo.js`), from the same vector paths, one shape per piece so each piece can blink on its own; an empty box in the Main Menu's layout (`src/components/Logo.jsx`) holds its place and names it for screen readers. Drawing it in PixiJS lets the CRT effect process it with the background (see "CRT on the menus" in `docs/design-decisions.md`). It looks and behaves as any other element of the screen: it fades, tints and shakes with the buttons in the screen transitions (see "Screen transitions").
* At the 1920x1080 reference size it's 1518px wide, horizontally centered, with its top edge 182px from the top of the screen. The PLAY button's top edge is 132px below the logo's bottom edge, and the buttons keep the usual 64px gap between them.
* **Desktop builds** (MAIN MENU - desktop mockup): the fourth button, EXIT GAME, goes under HOW TO. To make room for it, the gap between the buttons shrinks to a third of a button's height (about 23.3px; a button is 70px tall), and the gap between the logo and PLAY shrinks by whatever extra height is left (to 120px), so the logo and the last button's bottom stay where they are on the other builds. The mockup draws these gaps at 32px and 96px; the rule above wins.
* The logo's pieces blink at random. About once every 2 seconds, at irregular moments (0.5 to 3.5 s apart), one piece turns white (#FFFFFF) at once, then fades back to the logo's color in 0.15 s. A piece is a letter or one of the E's three bars; the O's ring and dot blink together. The same piece never blinks twice in a row, and two pieces never blink at once. Blinking continues during screen transitions; a piece blinking during the screen-out fades to the tint color instead of black.

## Main Menu credits

* The Main Menu shows two lines of credits at the bottom of the screen (see the MAIN MENU mockup):
    * "A game by NIK NAK STUDIO"
    * "Music and sfx by MAN FROM SPACE"
* They're written in mixed case exactly as above, not all uppercase, like the Intro screen note.
* They're 24px, in the screen's foreground color (black on the white #D8D8D8 background), with no border. Each line is horizontally centered on its own.
* At the 1920x1080 reference size, there are 23px between the two lines, and the bottom of the second line is 109px above the bottom of the screen. The logo and the buttons don't move to make room for them.
* The names are links that open in a new tab: NIK NAK STUDIO → https://niknak.es, MAN FROM SPACE → https://manfromspace.com. The rest of each line isn't a link.
* The links look exactly like the text around them: same color, no underline, no change once visited. They give no feedback on hover, press, tap or focus.
* They're one of the screen's elements, so they take part in the screen transitions together with the logo and the buttons (see "Screen transitions").

## Main Menu gamepad indicator

* On the right of the Main Menu's buttons, a controller drawing with one line of text above it tells the player that the game can be played with a controller (see the MAIN MENU and MAIN MENU - gamepad not detected mockups; `src/components/GamepadIndicator.jsx`).
* It has two states:
    * No controller detected: "You can use a gamepad", with the controller's outline and a `?` (`assets/images/gamepad_not_detected.svg`). It's a hint, not a warning.
    * Controller detected: "Gamepad detected", with the full drawing: sticks, d-pad and face buttons (`assets/images/gamepad_detected.svg`).
* It switches as soon as a controller is connected or disconnected. Browsers only expose a controller once one of its buttons has been pressed on the page, so any menu interaction with the controller switches it to "Gamepad detected". Only the controllers the game can use count (see "Supported controllers" in `docs/game-controller.md`).
* The text is 24px, in sentence case exactly as above (a non-interactive informative text, like the credits), in the screen's foreground color, with no border, on one line, horizontally centered over the drawing (it's wider than the drawing). The drawing is in the foreground color too.
* At the 1920x1080 reference size, the drawing's left edge is 350px right of the screen's center, its top is level with the SETTINGS button's top and its bottom with the HOW TO button's bottom. In the desktop builds it keeps the same size and place: its bottom is level with EXIT GAME's bottom, and its top no longer lines up with a button. The bottom of the text line is 27px above the drawing's top. The logo, the buttons and the credits don't move to make room for it.
* It isn't shown on phones and tablets: in the native apps, and in browsers whose primary input is touch only.
* It's one of the screen's elements, so it takes part in the screen transitions together with the logo and the buttons (see "Screen transitions"). Controller navigation never selects it.

## Text and menus

* All menus and texts will be wrapped in a transparent rectangle with a thin border, the same color as the text.
* The distance between the text and the border will always be 0.5 em, meaning that it will scale with the font size (matches the mockups).
* Font size should always be (at the 1920x1080 reference size of the mockups; see "Scaling" below):
    * 24px for HUD text during gameplay, and for the Main Menu credits and gamepad indicator (see "Main Menu credits" and "Main Menu gamepad indicator")
    * 32px for all menu buttons, and for the Intro screen's note (see "Intro screen note")
    * 64px for the texts "GAME OVER" and "YOU WIN!" texts in those screens.
* Line height will be exactly 1.
* Font weight normal/regular in all cases (no bold or italic).
* All texts will be uppercase, except the non-interactive informative texts, which are written in mixed case: the Intro screen note, the Main Menu credits, the Main Menu gamepad indicator, the How To Play instructions and the Gameplay tips (see "Intro screen note", "Main Menu credits", "Main Menu gamepad indicator", "How To Play screen" and "Gameplay tips"). Buttons, including READY, are always uppercase.
* The font used will be "C64 Angled", a monospaced font: `assets/fonts/c64_angled.ttf`.
* All text boxes and buttons should put all the text in one line (no line-breaks). The only exception is the How To Play screen's instructions (see "How To Play screen").

## Blinking buttons

* A blinking button is the one suggested to press next. The Intro's ENTER BOUNCERBACK button blinks, so the player learns this with their first click; Level Select then uses it, unexplained, for the levels still to beat (see "Level Select"). No other button blinks.
* Only the text blinks: visible for 1 s, invisible for 1 s, with no fade (a hard on/off), starting visible. The border, the size, the game controller's double border and the pressed look don't change, so nothing moves.
* Every blinking text on a screen blinks in sync, also one that starts blinking while the screen is shown.
* It keeps blinking while the button is selected with the game controller, and while it's held down (its text blinks in the pressed look's inverted color).
* When the button is activated (click, tap, or the controller's release), its text stops blinking and stays visible through the screen-out. Other blinking buttons keep blinking. Nothing is saved: the next time the screen is shown, it blinks again if it still applies.
* It doesn't follow the system's reduced-motion setting, like the rest of the game.

## Level Select

See the LEVEL MENU and LEVEL MENU (LOCKED LEVELS) mockups.

* One row of buttons per tier (see "Level unlocking" in `game-rules.md`): tier 0 is the first row, tier 1 the second, and so on. Within a row, the levels go left to right by level number. Each row is centered horizontally, and the rows are centered vertically above the BACK button.
* The gap between the buttons of a row is the same as the gap between rows, the menus' usual gap between buttons.
* Every level button and BACK have the same width: room for the longest level name allowed (14 characters), whatever the current names are, so unlocking a level or adding one never changes the layout.
* A locked level's button shows 12 dashes (`------------`) instead of its name, the same for every locked level. It keeps the border and colors of the other buttons, but it has no pressed look and the game controller never selects it.
* An unlocked level that hasn't been beaten yet blinks its name (see "Blinking buttons"); a beaten level's name is steady. A level button is therefore locked (dashes), pending (blinking) or beaten (steady).

## Pause overlay

* It's shown on top of the Game Screen, which stays as it was when the game was paused: the HUD, the ring, the paddles and the atoms stay visible and frozen, on their black (or one-life-left dark red) background (see the GAMEPLAY PAUSE MENU mockup).
* It uses the dark layout: white text and borders, like the HUD.
* It's the Settings screen's menu (MUSIC, SFX, OLD TV), with EXIT TO MENU and `<<< RESUME` below it in place of `<<< BACK`. The buttons are the same size as on the Settings screen, and the whole menu is vertically centered.
* Behind the buttons there's an opaque panel that hides the part of the game under the menu (in the mockup the ring is cut at its edges). It covers all the buttons together plus 64px of padding on every side (top, bottom, left and right). Its color is the gameplay area's current background: black (#000000), or dark red (#550000) when the player has only one life left.
* It isn't a screen change, so it doesn't play the screen transitions (see "Screen transitions"). EXIT TO MENU does: it leaves the Game Screen for the Main Menu.

## Gameplay tips

* Shown over the Game Screen right after a level is selected (or TRY AGAIN is pressed), before the level starts, if the level file has a `tip` (see the GAMEPLAY TIPS mockup). Levels without a tip start straight away.
* The HUD is already visible (score 0, full time, hi-score, all the lives). The arena is empty: the ring and the core don't grow in until READY is pressed.
* The tip is informative text, so it's written in mixed case exactly as in the level file (not all uppercase, like the Intro screen note), 32px, centered, no border, one line per `tip` item. Below it, 54px under its last line, a READY button (32px, the usual button look), centered. At the 1920x1080 reference size the tip's top edge is 359px from the top of the screen.
* It isn't a screen change, but READY plays a screen-out on the tip and the button (see "Screen transitions"), then the level starts as usual (start animation and 3-second start delay). Taps are ignored while it fades.

## End-of-level interstitials

* A level can name a picture for each outcome in its level file (`youWinInterstitial`, `gameOverInterstitial`: a PNG in `assets/interstitials/`). It's the first storytelling element. Without one, the level goes to its result screen as before.
* When the end animation is over (the last life zoom on a loss, the core collapse on a win), the picture replaces the arena at once (a cut, no fade) and the HUD disappears at once. It stays until the player continues; then the Game Over or You Win! screen replaces it at once and plays its usual screen-in (no screen-out). See `docs/navigation.md` for how to continue.
* It's drawn in the game canvas, full screen, scaled to fit whole and centered: black bars where the screen's shape differs from the picture's (e.g. 16:10 on the Steam Deck, wide phones). Pictures are made at 1920x1080, like the mockups, and are deliberately low fidelity.
* With OLD TV on it goes through the same bloom and CRT layers as the arena, with the same values; it never gets the zoom blur (it radiates from the core, which the picture doesn't have). With OLD TV off it's drawn flat.
* Presses are ignored for a short moment after it appears, so a stray tap at the end of the level doesn't skip it. The length is set in `src/game/interstitialSettings.js`.

## Game controller selection

* When the menus are navigated with a game controller, the selected item is marked with a double border: its own border, a gap, and a second line outside it, all three as thick as the border (like CSS's `double` border style). The second line is drawn with `outline`, so nothing moves.
* It's drawn in the screen's foreground color, so it follows the screen transitions' tint and fades with its button.
* The Settings `-` / `+` steps share their borders with the volume control, so on them the double line is drawn inside the step instead (line, gap, line).
* While a controller button is held to activate a menu button, that button shows the same pressed look as under a held mouse button (inverted colors), and the double border stays around it. On the Settings `-` / `+` steps the inner double line has the same color as the pressed fill, so it's hidden while the step is held.
* When the mark is shown and hidden: see "Menus" in `docs/game-controller.md`.

## Scaling

* The mockups are drawn at 1920x1080, 1:1 with CSS pixels. All UI sizes (fonts, borders, paddings, gaps) are defined in mockup pixels and scaled with the viewport: one mockup pixel = `min(viewport height / 1080, viewport width / 1920)`, with a floor of 0.4 CSS px so text stays readable on small phones.
* In CSS this is the `--u` custom property in `src/index.css`; sizes are written as `calc(N * var(--u))`.

## Screen transitions

* Every screen change uses the same transition, inspired by old TV sets: the elements of the old screen go out, then the elements of the new screen come in.
* Only the elements animate: text, buttons, borders, the Main Menu logo and the HUD. The screens themselves don't: their background (black, white #D8D8D8, the menu background animation) stays still and changes at once when the new screen replaces the old one, and the menu background animation keeps playing. On the Game Screen only the HUD animates; the game canvas (ring, core, atoms and its black or dark red background) stays as it is until the Game Screen is replaced.
* Screen out (1 s):
    * 0 → 1 s: the elements fade out (linear), revealing the screen's background.
    * 0.5 → 0.75 s: their color blends gradually from its own color (black on the light menus, white on the dark screens) to transition dark yellow (#666600, see "Colors").
    * 0.75 → 1 s: their color blends gradually from transition dark yellow to transition dark red (#660000, see "Colors"; not the #550000 one-life-left background).
    * 0.875 → 1 s: a slight vertical vibration (2px up, then 2px down, at the 1080px reference, once).
    * The blends are linear and last 0.25 s each (this overrides the 0.5 s default for color changes).
* Screen in (0.5 s): the new screen's elements fade in (linear). No tint, no shake.
* The first screen on launch (Intro) only plays the screen in.
* Taps and clicks are ignored while a transition is running.

## Visual effects

* The game will use 2D vector graphics (Pixi.js).
* Optional effects will be considered for specific moments during the game:
    * Color palette switch (e.g. when the player has only one life left)
    * Glow effects (e.g. when the player uses a power-up)

## CRT effect

* The game arena (the game canvas: ring, core, atoms, paddles, echoes and the black or dark red background) is shown as if on an old CRT screen. It's a post-process applied to the finished image, so the shapes themselves are still the same 2D vector drawings.
* The HUD is not part of it: it stays flat and sharp on top, with no curvature, scanlines or blur.
* The end-of-level interstitials are drawn in the game canvas in place of the arena, so they get the same bloom and CRT layers with OLD TV on, but no zoom blur (see "End-of-level interstitials").
* The menu screens that show the menu background animation (Main Menu, Level Select, Settings, How To Play) get the CRT layers too: the animation, its `#D8D8D8` background and the Main Menu logo are on the same TV as the arena. Their buttons, texts, credits and the How To Play instructions and drawing stay flat and sharp on top, like the HUD, and inside the glass. They get no zoom blur (it radiates from the core, and the menus have none). The Intro, Game Over and You Win! screens don't change.
* The player chooses: the Settings screen's **OLD TV** switch (`OLD TV ON` / `OLD TV OFF`, below SFX, as wide as the volume controls; see the SETTINGS MENU mockup) turns the CRT layers and the bloom (curved glass, chromatic aberration, scanlines, phosphor mask, vignette) on and off, on the arena and on those menu screens. Switching it on the Settings screen changes the screen behind it at once. The Pause overlay has the same switch, which changes the arena mid-level. It's **off by default** and saved like the volumes. The zoom blur isn't part of the switch: it's always on.
* The effect is made of these layers, from the scene outward:
    * Zoom blur: a copy of the arena blurred into streaks that point away from the core, mixed over the arena at a low opacity, so it stays subtle (aesthetic reference: Resolume Avenue's Radial Blur). Streak length grows with an object's distance from the core, so the paddles and atoms streak, while the core and the thin ring only get a faint halo. The streaks always come from the core, also while it moves during the last life zoom.
    * Bloom (the arena only, with OLD TV on): a soft glow around bright shapes, added over the image, so they look a bit bigger, shinier and less sharp. It comes before the chromatic aberration, so the glow is fringed too. The menus get none: it would wash out their light picture.
    * Curved glass: the image bulges like a CRT's curved glass, more toward the corners. Outside the glass (the screen's rounded corners and edges) is the edge color, like the TV's frame: black, on the arena and on the menus (it's a setting of the effect, so it can be changed in code).
    * Chromatic aberration: the red and blue channels separate slightly toward the edges.
    * Scanlines: horizontal dark lines, a fixed number per screen height whatever the device, following the curve of the glass.
    * Phosphor mask: very faint vertical red / green / blue stripes.
    * Vignette: the image darkens slightly toward the edges.
* Scanlines, the mask and the vignette darken the image; a brightness gain compensates, so the arena's white and colors stay close to their values above. The menus use their own, lower gain and vignette: their picture is light, and the arena's gain would push the background and the animation's light lines all to white. The background ends up a little darker than `#D8D8D8`, with its lines still distinct.
* Every amount (scanline count, curvature, blur strength, the opacities, the resolutions) is tuned by eye. The values are defined only in the code, one settings file per effect (`src/effects/zoomBlur/zoomBlurSettings.js`, `src/effects/bloom/bloomSettings.js`, `src/effects/crt/crtSettings.js`) plus the menus' own CRT values (`src/menu/menuSettings.js`), never in this document.
* Touch and mouse input follow what's on screen: pressing where a paddle or the core is shown hits it, even near the edges where the glass moves things. On the menus nothing under the glass is interactive: the buttons are flat, on top.

## Visual feedback (changes in the visuals during gameplay to communicate the player relevant information)

Note: All color changes use a transition time of 0.5 seconds unless otherwise specified.

* Level start: the containment ring and the core aren't simply shown, they grow in. First the ring grows from radius zero to its full size in 0.25 seconds (ease-out), then the core grows from radius zero to its full size in 0.5 seconds (ease-out). Their outlines keep their normal width while they grow. It plays at the start of every level, Try Again included, during the first 0.75 seconds of the 3-second start delay, so the delay doesn't get longer.
* Draw order: every new atom is drawn behind all the atoms already on screen, so fresh atoms never hide older ones.
* The core (atom emitter) is 25% larger than in the first cycle (radius 20 → 25 at the reference size, now slightly bigger than the atoms), so the moment an atom crosses it is easier to see.
* When the player has only one life, turn the background dark red (#550000)
* Paddle lifetime: once set, a paddle stays at full opacity for the first half of its lifetime, then fades steadily to 20% opacity over the second half, and disappears when it expires. This fade lasts half the paddle's lifetime and doesn't follow the 0.5 s default above. While the player is still dragging it, the paddle is shown at full opacity.
* Paddle bounce: every time a paddle bounces an atom back, a subtle, semi-transparent white arc as thick as the paddle (an "echo" of that paddle) appears on top of the paddle and drifts outward (about half a paddle thickness) while fading out, in 0.2 s, like a slight recoil. It only ever reaches half a paddle thickness inside the ring, where the paddle itself sits, so the playable area stays clean. If the same paddle bounces another atom while its echo is still visible, the echo restarts from the beginning. This is cosmetic only.
* Paddle replacement warning: while the player is dragging a new paddle (mouse, touch or a controller stick) and the level's paddle count is already reached (`paddles.count`, two by default), the paddle that will disappear when the new one is set (the oldest: first in, first out) turns red (#FF0000). With two new paddles being dragged at once, the two oldest set paddles turn red. The change is instant (it doesn't follow the 0.5 s default above: a drag can be very short). The red paddle keeps fading with its lifetime and stays red until it disappears. Its bounce echo stays white, and the paddle being dragged keeps its white outline.
* Level end (core collapse): a 2-second animation that starts together with the `vortex_creation` sound effect when the timer reaches zero. It doesn't follow the 0.5 s default above.
    - 0 → 1.85 s: the core grows (ease-in-out) until it matches the containment ring's size and position, while its fill fades in from transparent to grey (#888888) and its outline turns from white to the same grey, with the same transition. The outline ends on top of the ring. At the same time, every atom slows down (ease-out) until it stops completely. Atoms keep their current color and are drawn over the grey core. An atom that is close to the ring can drift slightly past it before it stops; it doesn't escape.
    - 1.85 → 2 s: the core collapses to radius zero (ease-in) and takes every atom with it: all atoms move to the center while shrinking to radius zero, at the same time as the core.
* Atom escape shake: when an atom escapes the containment ring, only that atom vibrates vertically, 3 times in a row and fast (each vibration is the screen transitions' up-then-down shake, 0.1 s long, so 0.3 s in all), while it keeps moving out and fading. Its color blends gradually from its own color to transition dark yellow (#666600) and then to transition dark red (#660000, see "Colors"), half of the 0.5 s fade each, like the screen transitions' tint. The last atom doesn't fade or tint. It's subtle on purpose: a few pixels at the 1080px reference. It doesn't follow the 0.5 s default above.
* Last life lost: when an atom takes the player's last life, every other atom freezes where it is at once. The escaping atom keeps moving out at its normal speed for 0.5 seconds, without fading out, then freezes too. Then the view zooms in on the point midway between where the atom crossed the containment ring and where it stopped: the zoom lasts 0.5 seconds (ease-out) and goes up to 8×; that point moves to the center of the screen while everything grows around it, so line widths grow too (the ring's outline ends 8× thicker). The zoomed view holds, with the atom fully visible, until the Game Over screen-out starts, 2 seconds after the loss. Circles stay round at 8×. The HUD doesn't zoom. The escaping atom also does the atom escape shake during those first 0.5 seconds, so it's over before the zoom starts. It doesn't follow the 0.5 s default above.

## Visual feedback for additional game mechanics

Each additional game mechanic (see "Additional game mechanics" in `game-rules.md`) has its own visual feedback, listed here under its name. It only applies to levels that include that mechanic: in the others, none of it is shown. The same 0.5 seconds default color transition as in "Visual feedback" applies. The visuals that don't depend on any additional mechanic (the draw order, the paddles, the lives, the level start and end) stay in "Visual feedback".

### `atom capture`

Without this mechanic atoms never get charged, so they always stay white and nothing pulses or is captured.

* Every time an atom bounces back, it gets a charged.
    - At 3 charges, the atom should transition to yellow (#FFFF00)
    - For every charge from 3 onwards, the atom should transition its color until the tenth charge, to get closer to red (#FF0000) for every additional charge.
* Capture window: while an atom that can be captured (3 or more charges) is crossing the core, it emits a pulse on every beat of the music, up to 3 pulses per crossing (later beats would come as the atom is leaving the core, so most of the pulse would play after it can no longer be captured): a filled circle of the atom's current color that grows outward from the atom while fading from 50% to 0% opacity over one beat. The pulse follows the atom and is drawn behind it. Pulses only start while the atom overlaps the core (the moment a released tap captures it); a pulse that has already started finishes its fade even if the atom leaves the core. Atoms with fewer than 3 charges never pulse.
* Capture: when the player captures an atom, it stops and is pulled into the center of the core while shrinking to radius zero, in 0.5 seconds with an ease-in curve (slow at first, fast at the end). It keeps its current color. Any pulse it was emitting stops at the moment of capture.
* Capture burst: at the moment of capture a second animation plays together with the pull-in, lasting the same 0.5 seconds: a circle in the captured atom's color (the color it has at that moment) at the exact center of the scene, drawn behind everything else in the arena (the containment ring, the paddles, the core and the atoms are all on top of it). Its line is as thick as the core's radius, and it starts at radius zero and opacity zero. First, over 0.1 seconds, its opacity rises to 50% (linear). Then, over the remaining 0.4 seconds, its radius grows to 1.25 times the containment ring's radius (ease-out) while its opacity falls to 0 (linear). The circle is removed when it ends. Each capture gets its own circle, so several captures close in time show as many circles, and a new one never interrupts the previous one.
* Colors used here: yellow and red, see "Colors".

### `supercharged atom`

Without this mechanic there is no supercharged atom.

* The supercharged atom appears at the core at the halfway point of the level (see "Supercharged atom" in `game-rules.md`) already in its own color, supercharged purple (#BB00FF), with no color transition. It keeps that color for as long as it lives: it never goes through the white, yellow and red of the charge colors, and bouncing doesn't change it. Everything that uses an atom's current color (the capture window pulse, the capture burst, the escape tint) uses the purple. It is the same size as every other atom.
* Besides the color, its speed is what sets it apart (see "Supercharged atom" in `game-rules.md`). It has no extra effect, aura or sound.
* Without `atom capture` it is purple too, but it never pulses, since it can't be captured.
* Colors used here: supercharged purple, see "Colors".

### `charged atom hold`

Without this mechanic nothing is held. It builds on `atom capture`, so everything in the previous section still applies, and the release of a held atom plays that section's capture, pull-in and burst unchanged.

* Hold: when the player holds an atom, it stops where it is, with its current color. Any pulse it was emitting stops at that moment, like at a capture, and it emits no more while held.
* Hold shake: for as long as the atom is held, it vibrates vertically exactly like the atom escape shake (the screen transitions' up-then-down shake, same duration of each vibration and same distance, see "Atom escape shake" in "Visual feedback"), but the vibrations repeat without limit from the moment it is held until the release. Unlike the escape, there's no fade and no tint: the atom keeps its color and opacity. When it's released, the shake stops at once and the capture pull-in starts from the atom's resting position.
* Score: every increment of the held-atom score appears on the HUD as soon as it's paid, with no animation of its own (see "Charged atom hold" in `game-rules.md`).
* Nothing else is drawn for the hold: no extra ring, color or sound.

# Colors

* Black background: #000000
* White: #FFFFFF
* White background: #D8D8D8
* Dark red background (one life left): #550000
* Yellow (atom at 3 charges): #FFFF00
* Red (atom at 10 charges, paddle replacement warning): #FF0000
* Grey (core fill and outline during the level-end core collapse): #888888
* Transition dark yellow (screen-out tint, halfway): #666600
* Transition dark red (screen-out tint, end): #660000. It's slightly lighter than the dark red background (#550000) on purpose: they're separate colors, so changing one doesn't change the other.
* Supercharged purple (supercharged atom): #BB00FF

# Mockups

Reference images can be found in the `docs/mockups` folder. The filenames specify the screen they represent.
