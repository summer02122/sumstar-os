"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useAgentStore } from '@/store/agentStore';

export interface PhaserGameRef {
    game: Phaser.Game | null;
}

const PhaserGame = forwardRef<PhaserGameRef>((props, ref) => {
    const gameContainer = useRef<HTMLDivElement>(null);
    const gameInstance = useRef<Phaser.Game | null>(null);
    const agents = useAgentStore((state) => state.agents);

    useImperativeHandle(ref, () => ({
        game: gameInstance.current
    }));

    useEffect(() => {
        if (!gameContainer.current) return;
        
        let game: Phaser.Game;

        // Dynamic imports to prevent SSR issues with Phaser
        Promise.all([
            import('phaser'),
            import('@/game/main')
        ]).then(([Phaser, { config }]) => {
            if (!gameInstance.current) {
                game = new Phaser.default.Game({
                    ...config,
                    parent: gameContainer.current!
                });
                gameInstance.current = game;
                
                // Initialize current state once game is ready
                setTimeout(() => {
                    if (gameInstance.current && gameInstance.current.events) {
                        gameInstance.current.events.emit('updateAgents', useAgentStore.getState().agents);
                    }
                }, 500);
            }
        });

        return () => {
            if (gameInstance.current) {
                gameInstance.current.destroy(true);
                gameInstance.current = null;
            }
        };
    }, []);

    // Sync Zustand state to Phaser event
    useEffect(() => {
        if (gameInstance.current && gameInstance.current.events) {
            gameInstance.current.events.emit('updateAgents', agents);
        }
    }, [agents]);

    return <div ref={gameContainer} id="game-container" className="w-full h-full rounded-none overflow-hidden" />;
});

PhaserGame.displayName = 'PhaserGame';

export default PhaserGame;
