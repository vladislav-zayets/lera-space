import { Application, Assets, Container, Graphics, Sprite, Text } from './pixi.mjs';

const GAME_WIDTH = 1400;
const GAME_HEIGHT = 800;
const PLAYER_SPEED = 6.5;
const PLAYER_MARGIN = 5;
const BACKGROUND_MUSIC_PATH = './assets/bg.mp3';


const state = {
    status: 'playing',
    spawnTimer: 0,
    dodged: 0,
    bestDodged: 0,
    enemies: [],
    keys: new Set(),
    musicStarted: false,
};

function clamp(value, min, max)
{
    return Math.max(min, Math.min(max, value));
}

function randomBetween(min, max)
{
    return min + ((max - min) * Math.random());
}

function createStarfield(count = 120)
{
    const starLayer = new Container();
    const stars = [];

    for (let index = 0; index < count; index += 1)
    {
        const star = new Graphics()
            .circle(0, 0, randomBetween(1, 3))
            .fill(0xffffff);

        star.x = randomBetween(0, GAME_WIDTH);
        star.y = randomBetween(0, GAME_HEIGHT);
        star.alpha = randomBetween(0.2, 0.95);
        star.speed = randomBetween(0.3, 2.2);
        star.twinkleOffset = randomBetween(0, Math.PI * 2);

        stars.push(star);
        starLayer.addChild(star);
    }

    return { starLayer, stars };
}

function updateStarfield(stars, delta)
{
    for (const star of stars)
    {
        star.y += star.speed * delta;
        star.alpha = 0.35 + (Math.sin((star.y * 0.03) + star.twinkleOffset) * 0.25);

        if (star.y > GAME_HEIGHT + 4)
        {
            star.y = -4;
            star.x = randomBetween(0, GAME_WIDTH);
        }
    }
}

async function createEnemy()
{   

    const playerTexture = await Assets.load("./assets/enemy2.png");
    const enemy = new Sprite(playerTexture);

    const size = randomBetween(24, 56);

    enemy.width = 45;
    enemy.height = 45; 
    enemy.x = randomBetween(size, GAME_WIDTH - size);
    enemy.y = -size;
    enemy.speed = randomBetween(1,2);
    enemy.spin = randomBetween(-0.03, 0.03);
    enemy.hitSize = size * 0.45;

    return enemy;
}
function intersects(player, enemy)
{
    const playerHalfWidth = player.width * 0.32;
    const playerHalfHeight = player.height * 0.35;

    return Math.abs(player.x - enemy.x) < (playerHalfWidth + enemy.hitSize)
        && Math.abs(player.y - enemy.y) < (playerHalfHeight + enemy.hitSize);
}

function destroyEnemy(world, enemy)
{
    world.removeChild(enemy);
    enemy.destroy();
}

function clearEnemies(world)
{
    for (const enemy of state.enemies)
    {
        destroyEnemy(world, enemy);
    }

    state.enemies = [];
}

function updateHud(scoreText, bestText)
{
    scoreText.text = `Dodged: ${state.dodged}`;
    bestText.text = `Best: ${state.bestDodged}`;
}

function setGameOver(overlayText)
{
    state.status = 'gameOver';
    state.bestDodged = Math.max(state.bestDodged, state.dodged);
    overlayText.text = `Game Over\nDodged: ${state.dodged}\nPress R to restart`;
}

function resetGame(player, world, overlayText, scoreText, bestText)
{
    clearEnemies(world);
    state.status = 'playing';
    state.spawnTimer = 0;
    state.dodged = 0;
    player.x = GAME_WIDTH / 2;
    player.y = GAME_HEIGHT - 70;
    player.rotation = 0;
    overlayText.text = '';
    updateHud(scoreText, bestText);
}

function createBackgroundMusic()
{
    const backgroundMusic = new Audio(BACKGROUND_MUSIC_PATH);

    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.5;
    backgroundMusic.preload = 'auto';

    return backgroundMusic;
}

async function startBackgroundMusic(backgroundMusic)
{
    if (state.musicStarted)
    {
        return;
    }

    state.musicStarted = true;

    try
    {
        await backgroundMusic.play();
    }
    catch (error)
    {
        state.musicStarted = false;
        console.warn(`Could not start background music from "${BACKGROUND_MUSIC_PATH}". Add the file to assets to enable music.`, error);
    }
}

function setupInput(onRestart, backgroundMusic)
{
    const blockedKeys = new Set(['ArrowLeft', 'ArrowRight', 'Space']);

    window.addEventListener('keydown', (event) =>
    {
        startBackgroundMusic(backgroundMusic);

        if (blockedKeys.has(event.code))
        {
            event.preventDefault();
        }

        state.keys.add(event.code);

        if ((event.code === 'KeyR' || event.code === 'Space') && state.status === 'gameOver')
        {
            onRestart();
        }
    });

    window.addEventListener('keyup', (event) =>
    {
        state.keys.delete(event.code);
    });

    window.addEventListener('pointerdown', () =>
    {
        startBackgroundMusic(backgroundMusic);
    }, { once: true });
}

(async () =>
{
    const app = new Application();
    globalThis.__PIXI_APP__ = app;

    await app.init({
        background: '#020617',
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        antialias: true,
    });

    document.body.appendChild(app.canvas);

    const world = new Container();
    const uiLayer = new Container();

    app.stage.addChild(world);
    app.stage.addChild(uiLayer);

    const background = new Graphics()
        .rect(0, 0, GAME_WIDTH, GAME_HEIGHT)
        .fill('#0f172a');

    const { starLayer, stars } = createStarfield();

    world.addChild(background);
    world.addChild(starLayer);

    const backgroundMusic = createBackgroundMusic();
    const playerTexture = await Assets.load("./assets/player2.png");
    const player = new Sprite(playerTexture);

    player.anchor.set(0.5);
    player.width = 100;
    player.height = 180;
    player.x = GAME_WIDTH / 2;
    player.y = GAME_HEIGHT - 100;

    world.addChild(player);

    const scoreText = new Text({
        text: 'Dodged: 0',
        style: {
            fill: '#f8fafc',
            fontSize: 28,
            fontWeight: '700',
        },
    });

    const bestText = new Text({
        text: 'Best: 0',
        style: {
            fill: '#cbd5e1',
            fontSize: 20,
        },
    });

    const hintText = new Text({
        text: 'Move: WASD / Arrows | Music starts on first input',
        style: {
            fill: '#94a3b8',
            fontSize: 18,
        },
    });

    const overlayText = new Text({
        text: '',
        style: {
            align: 'center',
            fill: '#f8fafc',
            fontSize: 34,
            fontWeight: '700',
            stroke: {
                color: '#020617',
                width: 6,
            },
        },
    });

    scoreText.x = 20;
    scoreText.y = 18;
    bestText.x = 20;
    bestText.y = 52;
    hintText.x = 20;
    hintText.y = GAME_HEIGHT - 38;
    overlayText.anchor.set(0.5);
    overlayText.x = GAME_WIDTH / 2;
    overlayText.y = GAME_HEIGHT / 2;

    uiLayer.addChild(scoreText);
    uiLayer.addChild(bestText);
    uiLayer.addChild(hintText);
    uiLayer.addChild(overlayText);

    setupInput(() => resetGame(player, world, overlayText, scoreText, bestText), backgroundMusic);
    updateHud(scoreText, bestText);

    app.ticker.add(async (ticker) =>
    {
        const delta = ticker.deltaTime;

        updateStarfield(stars, delta);

        if (state.status !== 'playing')
        {
            return;
        }

        let direction = 0;
        let directionY = 0;
        if (state.keys.has('ArrowUp') || state.keys.has('KeyW'))
        {
            directionY -= 1;
        }
        if (state.keys.has('ArrowDown') || state.keys.has('KeyS'))
        {
            directionY += 1;
        }
        player.y += directionY * PLAYER_SPEED * delta;
        player.y = clamp(player.y, PLAYER_MARGIN, GAME_HEIGHT - PLAYER_MARGIN);

        if (state.keys.has('ArrowLeft') || state.keys.has('KeyA'))
        {
            direction -= 1;
        }

        if (state.keys.has('ArrowRight') || state.keys.has('KeyD'))
        {
            direction += 1;
        }

        player.x += direction * PLAYER_SPEED * delta;
        player.x = clamp(player.x, PLAYER_MARGIN, GAME_WIDTH - PLAYER_MARGIN);
        player.rotation = direction * 0.15;

        const spawnEvery = Math.max(18, 44 - (state.dodged * 0.8));

        state.spawnTimer += delta;

        if (state.spawnTimer >= spawnEvery)
        {
            state.spawnTimer = 0;
            const enemy = await createEnemy();
            state.enemies.push(enemy);
            world.addChild(enemy);
        }

        for (let index = state.enemies.length - 1; index >= 0; index -= 1)
        {
            const enemy = state.enemies[index];

            enemy.y += (enemy.speed + (state.dodged * 0.02)) * delta;
            enemy.rotation += enemy.spin * delta;

            if (intersects(player, enemy))
            {
                setGameOver(overlayText);
                updateHud(scoreText, bestText);
                return;
            }

            if (enemy.y - enemy.hitSize > GAME_HEIGHT)
            {
                state.enemies.splice(index, 1);
                destroyEnemy(world, enemy);
                state.dodged += 1;
                updateHud(scoreText, bestText);
            }
        }
    });
})();