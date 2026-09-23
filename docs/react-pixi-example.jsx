// Example: a Pixi component for React
// src/components/PixiCanvas.jsx
import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

export default function PixiCanvas({ onGameReady }) {
    const canvasContainerRef = useRef(null);
    const appRef = useRef(null);

    useEffect(() => {
        let isInitialized = false;

        const initPixi = async () => {
            // 1. Create the Pixi Application instance
            const app = new PIXI.Application();

            // 2. Initialize it asynchronously (PixiJS v8 standard)
            await app.init({
                resizeTo: canvasContainerRef.current, // Auto-resizes to fit parent div container
                background: '#1a1a2e',
                antialias: true,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true,
            });

            if (!canvasContainerRef.current) return;

            // 3. Append the canvas to our React DOM container
            canvasContainerRef.current.appendChild(app.canvas);
            appRef.current = app;
            isInitialized = true;

            // 4. Setup your game loop or main scene ticker here
            app.ticker.add((ticker) => {
                // Game loop logic updates go here or inside your modular scene classes
            });

            // Optional callback to pass the app instance back up to your screen controller
            if (onGameReady) {
                onGameReady(app);
            }
        };

        initPixi();

        // 5. Cleanup on unmount (critical for preventing mobile WebView memory leaks)
        return () => {
            if (isInitialized && appRef.current) {
                appRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
                appRef.current = null;
            }
        };
    }, []);

    return (
        <div
            ref={canvasContainerRef}
            style={{
                width: '100vw',
                height: '100vh',
                overflow: 'hidden',
                touchAction: 'none' // Prevents default mobile browser panning/zooming gestures
            }}
        />
    );
}