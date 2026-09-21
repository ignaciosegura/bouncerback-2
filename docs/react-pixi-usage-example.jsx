// src/screens/GameScreen.jsx
import React, { useState } from 'react';
import PixiCanvas from '../components/PixiCanvas';
import HUD from '../components/HUD';

export default function GameScreen({ onGameOver }) {
    const [score, setScore] = useState(0);

    const handleGameReady = (pixiApp) => {
        // You can now spawn your Pixi game elements, load textures, 
        // or link game events to React state updates here.
        console.log('Pixi Engine Ready:', pixiApp);
    };

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
            {/* PixiJS renders the 60 FPS gameplay canvas underneath */}
            <PixiCanvas onGameReady={handleGameReady} />

            {/* React renders the UI overlay on top */}
            <HUD score={score} />
        </div>
    );
}