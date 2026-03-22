# PixiJS Interview Notes

## What This Demo Shows

- `Application` creates the renderer, ticker, and root stage.
- `stage` is the root display tree. This project splits it into `world` and `uiLayer` containers.
- `Assets.load()` loads the player texture from an inline SVG, so the demo works without external files.
- `Sprite` is used for the player because it displays a texture.
- `Graphics` is used for enemies and the background because those shapes are generated in code.
- `ticker` drives the game loop. Every frame it updates input, movement, spawns, collisions, and score.

## Interview Answers

### Why Use `ticker`?

`ticker` gives you one central update loop tied to rendering. It is a natural place for animation, movement, spawning, and collision checks, and `deltaTime` keeps movement consistent across different frame rates.

### What Is `stage`?

`stage` is the root container for everything Pixi renders. Child objects inherit transforms from their parents, so grouping the game into `world` and `uiLayer` makes scene management easier.

### `Sprite` vs `Texture`

`Texture` is the image data. `Sprite` is the display object that uses that texture on screen. Multiple sprites can reuse the same texture.

### Why `deltaTime` Matters

Without `deltaTime`, movement speed depends on frame rate. Multiplying by `deltaTime` keeps gameplay closer to frame-independent behavior.

### How To Scale This Project

- move player, enemy, input, and UI code into separate modules
- add a start screen and pause state
- use object pooling for enemies
- swap primitive graphics for sprite sheets and animated assets
