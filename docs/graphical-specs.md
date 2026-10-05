# Layout

The screen will be used in forced landscape mode. The visual style is based on early arcade computers, such as Pong, Asteroids or Defender. Details below:

## The background

* The background will always be black, except in the inverted menu layouts, where the background will be white, and during gameplay when the player has only one life left, where it turns dark red (see "Visual feedback" below).
    * During the game, black background, white lines and full circles only (except for the color changes in "Visual feedback" below). No textures. The vector assets provided will also be in black and white.
    * During the menus, the same font and visual style will be used. The background will be black, with white text. In some cases, the layout will be inverted, white background, black texts and outlines.

## Menu background animation

* The Main Menu, Level Select and Settings screens show the vector animation `assets/motion/intro_animation.json` (Lottie) on top of the white (#D8D8D8) background and behind the text and buttons. Its light-grey and white lines are meant to be subtle, tone on tone. The Intro screen (ENTER BOUNCERBACK) doesn't show it: it's a plain white (#D8D8D8) background.
* It starts at the same moment as the menu music (they were made together), and stays still until the music starts.
* It plays continuously while the player moves between those three screens: changing screens never restarts or pauses it. It starts again from the beginning when the player comes back to the menus after playing a level.
* It covers the whole screen (cropped at the top and bottom on screens wider than 16:9) and loops: the content (about 125 s) plus 5 seconds of empty background, then back to the start.

## Intro screen note

* The Intro screen shows one line of text above the ENTER BOUNCERBACK button: "Grab your best headphones first ;)" (see the INTRO mockup).
* It's written in mixed case exactly as above, not all uppercase.
* It's 32px, the same size as the button's text, in the screen's foreground color (black on the white #D8D8D8 background), with no border: it's a note, not a button, like the scores on the Game Over and You Win! screens.
* At the 1920x1080 reference size, the bottom of its text line is 59px above the button's top edge, and it's horizontally centered. The button doesn't move: it stays centered on the screen.
* It's one of the screen's elements, so it takes part in the screen transitions together with the button (see "Screen transitions").

## Game logo

* The game logo (source art: `assets/images/game_logo.svg`, vector, black) is shown at the top of the Main Menu, above the PLAY and SETTINGS buttons (see the MAIN MENU mockup). It isn't shown on any other screen. It's rendered as inline SVG (`src/components/Logo.jsx`, one `<path>`/`<rect>` per letterform), not as an `<img>` or CSS mask, so its segments can be targeted individually for animation.
* At the 1920x1080 reference size it's 1518px wide, horizontally centered, with its top edge 182px from the top of the screen. The PLAY button's top edge is 229px below the logo's bottom edge, and the buttons keep the usual 64px gap between them.
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

## Text and menus

* All menus and texts will be wrapped in a transparent rectangle with a thin border, the same color as the text.
* The distance between the text and the border will always be 0.5 em, meaning that it will scale with the font size (matches the mockups).
* Font size should always be (at the 1920x1080 reference size of the mockups; see "Scaling" below):
    * 24px for HUD text during gameplay, and for the Main Menu credits (see "Main Menu credits")
    * 32px for all menu buttons, and for the Intro screen's note (see "Intro screen note")
    * 64px for the texts "GAME OVER" and "YOU WIN!" texts in those screens.
* Line height will be exactly 1.
* Font weight normal/regular in all cases (no bold or italic).
* All texts will be uppercase, except the Intro screen note and the Main Menu credits, which are written in mixed case (see "Intro screen note" and "Main Menu credits").
* The font used will be "C64 Angled", a monospaced font: `assets/fonts/c64_angled.ttf`.
* All text boxes should put all the text in one line (no line-breaks).

## Game controller selection

* When the menus are navigated with a game controller, the selected item is marked with a double border: its own border, a gap, and a second line outside it, all three as thick as the border (like CSS's `double` border style). The second line is drawn with `outline`, so nothing moves.
* It's drawn in the screen's foreground color, so it follows the screen transitions' tint and fades with its button.
* The Settings `-` / `+` steps share their borders with the volume control, so on them the double line is drawn inside the step instead (line, gap, line).
* Nothing is marked until the controller is used, and a mouse click or tap hides the mark.

## Scaling

* The mockups are drawn at 1920x1080, 1:1 with CSS pixels. All UI sizes (fonts, borders, paddings, gaps) are defined in mockup pixels and scaled with the viewport: one mockup pixel = `min(viewport height / 1080, viewport width / 1920)`, with a floor of 0.4 CSS px so text stays readable on small phones.
* In CSS this is the `--u` custom property in `src/index.css`; sizes are written as `calc(N * var(--u))`.

## Screen transitions

* Every screen change uses the same transition, inspired by old TV sets: the elements of the old screen go out, then the elements of the new screen come in.
* Only the elements animate: text, buttons, borders, the Main Menu logo and the HUD. The screens themselves don't: their background (black, white #D8D8D8, the menu background animation) stays still and changes at once when the new screen replaces the old one, and the menu background animation keeps playing. On the Game Screen only the HUD animates; the game canvas (ring, core, atoms and its black or dark red background) stays as it is until the Game Screen is replaced.
* Screen out (1 s):
    * 0 → 1 s: the elements fade out (linear), revealing the screen's background.
    * 0.5 → 0.75 s: their color blends gradually from its own color (black on the light menus, white on the dark screens) to dark yellow (#666600).
    * 0.75 → 1 s: their color blends gradually from dark yellow to dark red (#660000).
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

## Visual feedback (changes in the visuals during gameplay to communicate the player relevant information)

Note: All color changes use a transition time of 0.5 seconds unless otherwise specified.

* Level start: the containment ring and the core aren't simply shown, they grow in. First the ring grows from radius zero to its full size in 0.25 seconds (ease-out), then the core grows from radius zero to its full size in 0.5 seconds (ease-out). Their outlines keep their normal width while they grow. It plays at the start of every level, Try Again included, during the first 0.75 seconds of the 3-second start delay, so the delay doesn't get longer.
* Every time an atom bounces back, it gets a charged.
    - At 3 charges, the atom should transition to yellow (#FFFF00)
    - For every charge from 3 onwards, the atom should transition its color until the tenth charge, to get closer to red (#FF0000) for every additional charge.
* Draw order: every new atom is drawn behind all the atoms already on screen, so fresh (uncharged) atoms never hide charged ones that the player may want to capture.
* Capture window: while an atom that can be captured (3 or more charges) is crossing the core, it emits a pulse on every beat of the music, up to 3 pulses per crossing (later beats would come as the atom is leaving the core, so most of the pulse would play after it can no longer be captured): a filled circle of the atom's current color that grows outward from the atom while fading from 50% to 0% opacity over one beat. The pulse follows the atom and is drawn behind it. Pulses only start while the atom overlaps the core (the moment a tap captures it); a pulse that has already started finishes its fade even if the atom leaves the core. Atoms with fewer than 3 charges never pulse.
* Capture: when the player captures an atom, it stops and is pulled into the center of the core while shrinking to radius zero, in 0.5 seconds with an ease-in curve (slow at first, fast at the end). It keeps its current color. Any pulse it was emitting stops at the moment of capture.
* The core (atom emitter) is 25% larger than in the first cycle (radius 20 → 25 at the reference size, now slightly bigger than the atoms), so the moment an atom crosses it is easier to see.
* When the player has only one life, turn the background dark red (#660000)
* Paddle lifetime: once set, a paddle stays at full opacity for the first half of its lifetime, then fades steadily to 20% opacity over the second half, and disappears when it expires. This fade lasts half the paddle's lifetime and doesn't follow the 0.5 s default above. While the player is still dragging it, the paddle is shown at full opacity.
* Paddle bounce: every time a paddle bounces an atom back, a subtle, semi-transparent white arc as thick as the paddle (an "echo" of that paddle) appears on top of the paddle and drifts outward (about half a paddle thickness) while fading out, in 0.2 s, like a slight recoil. It only ever reaches half a paddle thickness inside the ring, where the paddle itself sits, so the playable area stays clean. If the same paddle bounces another atom while its echo is still visible, the echo restarts from the beginning. This is cosmetic only.
* Level end (core collapse): a 2-second animation that starts together with the `vortex_creation` sound effect when the timer reaches zero. It doesn't follow the 0.5 s default above.
    - 0 → 1.85 s: the core grows (ease-in-out) until it matches the containment ring's size and position, while its fill fades in from transparent to grey (#888888) and its outline turns from white to the same grey, with the same transition. The outline ends on top of the ring. At the same time, every atom slows down (ease-out) until it stops completely. Atoms keep their current color and are drawn over the grey core. An atom that is close to the ring can drift slightly past it before it stops; it doesn't escape.
    - 1.85 → 2 s: the core collapses to radius zero (ease-in) and takes every atom with it: all atoms move to the center while shrinking to radius zero, at the same time as the core.

# Colors

* Black background: #000000
* White: #FFFFFF
* White background: #D8D8D8
* Dark red background (one life left): #660000
* Yellow (atom at 3 charges): #FFFF00
* Red (atom at 10 charges): #FF0000
* Grey (core fill and outline during the level-end core collapse): #888888

# Mockups

Reference images can be found in the `docs/mockups` folder. The filenames specify the screen they represent.
