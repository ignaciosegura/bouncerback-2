# Layout

The screen will be used in forced landscape mode. The visual style is based on early arcade computers, such as Pong, Asteroids or Defender. Details below:

## The background

* The background will always be black, except in the inverted menu layouts, where the background will be white, and during gameplay when the player has only one life left, where it turns dark red (see "Visual feedback" below).
    * During the game, black background, white lines and full circles only (except for the color changes in "Visual feedback" below). No textures. The vector assets provided will also be in black and white.
    * During the menus, the same font and visual style will be used. The background will be black, with white text. In some cases, the layout will be inverted, white background, black texts and outlines.

## Menu background animation

* The Intro, Main Menu, Level Select and Settings screens show the vector animation `assets/motion/intro_animation.json` (Lottie) on top of the white (#DDDDDD) background and behind the text and buttons. Its light-grey and white lines are meant to be subtle, tone on tone.
* It starts at the same moment as the menu music (they were made together), and stays still until the music starts.
* It plays continuously while the player moves between those four screens: changing screens never restarts or pauses it. It starts again from the beginning when the player comes back to the menus after playing a level.
* It covers the whole screen (cropped at the top and bottom on screens wider than 16:9) and loops: the content (about 125 s) plus 5 seconds of empty background, then back to the start.

## Text and menus

* All menus and texts will be wrapped in a transparent rectangle with a thin border, the same color as the text.
* The distance between the text and the border will always be 0.5 em, meaning that it will scale with the font size (matches the mockups).
* Font size should always be (at the 1920x1080 reference size of the mockups; see "Scaling" below):
    * 24px for HUD text during gameplay
    * 32px for all menu buttons
    * 64px for the texts "GAME OVER" and "YOU WIN!" texts in those screens.
* Line height will be exactly 1.
* Font weight normal/regular in all cases (no bold or italic).
* All texts will be uppercase.
* The font used will be "C64 Angled", a monospaced font: `assets/fonts/c64_angled.ttf`.
* All text boxes should put all the text in one line (no line-breaks).

## Scaling

* The mockups are drawn at 1920x1080, 1:1 with CSS pixels. All UI sizes (fonts, borders, paddings, gaps) are defined in mockup pixels and scaled with the viewport: one mockup pixel = `min(viewport height / 1080, viewport width / 1920)`, with a floor of 0.4 CSS px so text stays readable on small phones.
* In CSS this is the `--u` custom property in `src/index.css`; sizes are written as `calc(N * var(--u))`.

## Visual effects

* The game will use 2D vector graphics (Pixi.js).
* Optional effects will be considered for specific moments during the game:
    * Color palette switch (e.g. when the player has only one life left)
    * Glow effects (e.g. when the player uses a power-up)

## Visual feedback (changes in the visuals during gameplay to communicate the player relevant information)

Note: All color changes use a transition time of 0.5 seconds unless otherwise specified.

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
* White background: #DDDDDD
* Dark red background (one life left): #660000
* Yellow (atom at 3 charges): #FFFF00
* Red (atom at 10 charges): #FF0000
* Grey (core fill and outline during the level-end core collapse): #888888

# Mockups

Reference images can be found in the `docs/mockups` folder. The filenames specify the screen they represent.
