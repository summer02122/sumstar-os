import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
    private agentsGroup!: Phaser.GameObjects.Group;
    private agentsData: Record<string, any> = {};
    private ambientLight?: Phaser.GameObjects.Rectangle;
    private bgImage?: Phaser.GameObjects.Image;

    constructor() {
        super('GameScene');
    }

    preload() {
        this.load.image('minimalWide', '/bg_minimal_wide.png');
    }

    create() {
        this.generateProgrammerTexture();
        this.generateDesignerTexture();
        this.generateManagerTexture();
        this.generateRoombaTexture();

        // --- BACKGROUND ---
        this.bgImage = this.add.image(0, 0, 'minimalWide').setOrigin(0, 0);
        
        this.cameras.main.setBounds(0, 0, this.bgImage.width, this.bgImage.height);
        this.physics.world.setBounds(0, 0, this.bgImage.width, this.bgImage.height);
        this.cameras.main.centerOn(this.bgImage.width / 2, this.bgImage.height / 2);
        
        // --- CAMERA CONTROLS ---
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (pointer.isDown) {
                this.cameras.main.scrollX -= (pointer.x - pointer.prevPosition.x) / this.cameras.main.zoom;
                this.cameras.main.scrollY -= (pointer.y - pointer.prevPosition.y) / this.cameras.main.zoom;
            }
        });

        this.input.on('wheel', (pointer: any, gameObjects: any, deltaX: number, deltaY: number, deltaZ: number) => {
            let newZoom = this.cameras.main.zoom - (deltaY * 0.001);
            newZoom = Phaser.Math.Clamp(newZoom, 0.5, 3);
            this.cameras.main.zoom = newZoom;
        });

        this.agentsGroup = this.add.group();

        // --- LIGHTING ---
        this.ambientLight = this.add.rectangle(0, 0, this.bgImage.width, this.bgImage.height, 0x000000, 0).setOrigin(0,0);
        this.ambientLight.setBlendMode(Phaser.BlendModes.MULTIPLY);
        this.ambientLight.setDepth(100);

        this.updateLighting();
        this.time.addEvent({ delay: 60000, loop: true, callback: () => this.updateLighting() });

        // --- ROOMBA VFX ---
        for (let i = 0; i < 3; i++) {
            this.spawnRoomba();
        }

        // Listen for React state
        this.game.events.on('updateAgents', (agents: Record<string, any>) => {
            this.syncAgents(agents);
        });
    }

    private generateProgrammerTexture() {
        this.createStringTexture('programmerAgent', [
            "........................",
            "........................",
            ".......WWWWWWWW.........",
            "......WWWWWWWWWW........",
            "......WSSSSSSSSW........",
            "......WSESESSESW........",
            "......WSSSSSSSSW........",
            "......WWSSSSSSWW........",
            ".....WWWGGGGGGWWW.......",
            "....WWWWGGGGGGWWWW......",
            "....WWWWGGGGGGWWWW......",
            "...WWWWWGGGGGGWWWWW.....",
            "...WWWWWGGGGGGWWWWW.....",
            "....WWWWGGGGGGWWWW......",
            ".....WWWWWWWWWWWW.......",
            ".....BBBBBBBBBBBB.......",
            "......PPPPPPPPPP........",
            "......PPPPPPPPPP........",
            "......PPPP..PPPP........",
            "......PPPP..PPPP........",
            "......PPPP..PPPP........",
            "......PPPP..PPPP........",
            "......HHHH..HHHH........",
            "........................"
        ]);
    }

    private generateDesignerTexture() {
        this.createStringTexture('designerAgent', [
            "........................",
            "........................",
            ".......HHHHHHHH.........",
            "......HHHHHHHHHH........",
            "......HSSSSSSSS.........",
            "......HSESESSES.........",
            "......HSSSSSSSS.........",
            "......HHSSSSSSHH........",
            ".....HHWWWWWWWWWH.......",
            "....HHWWWWWWWWWWHH......",
            "....HWWWWWWWWWWWWH......",
            "...HWWWWWWWWWWWWWH......",
            "...HWWWWWWWWWWWWWH......",
            "....WWWWWWWWWWWWW.......",
            ".....WWWWWWWWWWW........",
            ".....BBBBBBBBBBB........",
            "......PPPPPPPPPP........",
            "......PPPPPPPPPP........",
            "......PPPP..PPPP........",
            "......PPPP..PPPP........",
            "......PPPP..PPPP........",
            "......PPPP..PPPP........",
            "......HHHH..HHHH........",
            "........................"
        ]);
    }

    private generateManagerTexture() {
        this.createStringTexture('managerAgent', [
            "........................",
            "........................",
            ".......HHHHHHHH.........",
            "......HHHHHHHHHH........",
            "......HSSSSSSSSHH.......",
            "......HSESESSESH........",
            "......HSSSSSSSS.........",
            ".......SSSSSSSS.........",
            ".....WWWGTTGTTGWW.......",
            "....WWWWGTTGTTGWWW......",
            "....WWWWGTTGTTGWWW......",
            "...WWWWWGGGGGGWWWWW.....",
            "...WWWWWGGGGGGWWWWW.....",
            "....WWWWGGGGGGWWWW......",
            ".....WWWWWWWWWWWW.......",
            ".....BBBBBBBBBBBB.......",
            "......PPPPPPPPPP........",
            "......PPPPPPPPPP........",
            "......PPPP..PPPP........",
            "......PPPP..PPPP........",
            "......PPPP..PPPP........",
            "......PPPP..PPPP........",
            "......HHHH..HHHH........",
            "........................"
        ]);
    }

    private generateRoombaTexture() {
        this.createStringTexture('roomba', [
            "........................",
            "........................",
            "........................",
            "........................",
            "........................",
            "........................",
            "........................",
            "........................",
            ".......GGGGGGGG.........",
            ".....GGGGGGGGGGGG.......",
            "....GGGGGGGGGGGGGG......",
            "...GGGGGGGGGGGGGGGG.....",
            "...GGGGGGGGGXXGGGGG.....",
            "...GGGGGGGGGGGGGGGG.....",
            "....GGGGGGGGGGGGGG......",
            ".....GGGGGGGGGGGG.......",
            ".......GGGGGGGG.........",
            "........................",
            "........................",
            "........................",
            "........................",
            "........................",
            "........................",
            "........................"
        ]);
    }

    private createStringTexture(key: string, map: string[]) {
        const size = map.length;
        const pSize = 3;
        const canvas = document.createElement('canvas');
        canvas.width = size * pSize;
        canvas.height = size * pSize;
        const ctx = canvas.getContext('2d')!;
        
        map.forEach((row, y) => {
            for (let x = 0; x < row.length; x++) {
                const char = row[x];
                if (char === '.' || char === ' ') continue;
                
                switch(char) {
                    case 'S': ctx.fillStyle = '#ffcc99'; break; 
                    case 'H': ctx.fillStyle = '#111111'; break; 
                    case 'E': ctx.fillStyle = '#000000'; break; 
                    case 'W': ctx.fillStyle = '#ffffff'; break; 
                    case 'G': ctx.fillStyle = '#cccccc'; break; 
                    case 'B': ctx.fillStyle = '#1e1e1e'; break; 
                    case 'X': ctx.fillStyle = '#22cc44'; break; // Roomba LED
                    case 'P': ctx.fillStyle = '#334155'; break; // Pants
                    case 'T': ctx.fillStyle = '#3b82f6'; break; // Tie
                }
                ctx.fillRect(x * pSize, y * pSize, pSize, pSize);
            }
        });
    
        this.textures.addCanvas(key, canvas);
    }

    private getZoneForRole(role: string): { x: number, y: number } {
        const r = role.toLowerCase();
        if (r === 'programmer') return { x: Phaser.Math.FloatBetween(0.1, 0.35), y: Phaser.Math.FloatBetween(0.4, 0.8) };
        if (r === 'manager') return { x: Phaser.Math.FloatBetween(0.45, 0.55), y: Phaser.Math.FloatBetween(0.5, 0.8) };
        if (r === 'designer') return { x: Phaser.Math.FloatBetween(0.75, 0.9), y: Phaser.Math.FloatBetween(0.5, 0.8) };
        return { x: Phaser.Math.FloatBetween(0.4, 0.6), y: Phaser.Math.FloatBetween(0.5, 0.8) };
    }

    private getTextureForRole(role: string): string {
        const r = role.toLowerCase();
        if (r === 'manager') return 'managerAgent';
        if (r === 'designer') return 'designerAgent';
        return 'programmerAgent';
    }

    private syncAgents(newAgents: Record<string, any>) {
        if (!this.bgImage) return;
        const width = this.bgImage.width;
        const height = this.bgImage.height;

        Object.values(newAgents).forEach((agentData) => {
            let agentObj = this.agentsData[agentData.id];
            
            if (!agentObj) {
                const textureKey = this.getTextureForRole(agentData.role);
                const container = this.createCharacter(agentData.color, agentData.name, textureKey);
                
                container.setPosition(width / 2, height / 2);
                this.agentsGroup.add(container);
                
                const deskRelative = this.getZoneForRole(agentData.role);
                
                agentObj = {
                    sprite: container,
                    target: new Phaser.Math.Vector2(width / 2, height / 2),
                    text: container.getByName('statusText') as Phaser.GameObjects.Text,
                    deskRelative: deskRelative,
                    lamp: this.add.pointlight(0, 0, 0xFBBF24, 150, 0.5, 0.05).setDepth(101).setVisible(false) // WARM LAMP
                };
                this.agentsData[agentData.id] = agentObj;
            }

            agentObj.text.setText(agentData.state);
            
            const deskX = width * agentObj.deskRelative.x;
            const deskY = height * agentObj.deskRelative.y;
            
            if (agentData.state === 'thinking' || agentData.state === 'coding') {
                agentObj.target.set(deskX, deskY);
            } else if (agentData.state === 'sleeping') {
                agentObj.target.set(width * 0.85, height * 0.4); // Cafe zone
            } else {
                agentObj.target.set(deskX + (Math.random() * 80 - 40), deskY + (Math.random() * 80 - 40));
            }
            
            agentObj.lamp.setPosition(deskX, deskY - 40);
        });
        
        this.updateLighting();
    }

    private createCharacter(color: number, name: string, textureKey: string) {
        const container = this.add.container(0, 0);
        const shadow = this.add.ellipse(0, 26, 32, 10, 0x000000, 0.2);
        
        const sprite = this.add.image(0, 0, textureKey).setName('suitSprite');
        sprite.setTint(color); 

        const nameText = this.add.text(0, -45, name, {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#1a1a1a',
            backgroundColor: '#ffffff',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5).setAlpha(0.7);

        const statusText = this.add.text(0, -65, 'idle', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#ffffff',
            backgroundColor: '#1a1a1a',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5).setName('statusText').setDepth(50);

        container.add([shadow, sprite, nameText, statusText]);
        container.setDepth(10);
        
        this.tweens.add({
            targets: [sprite],
            y: '-=3',
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        return container;
    }

    private spawnRoomba() {
        if (!this.bgImage) return;
        const width = this.bgImage.width;
        const height = this.bgImage.height;

        const roomba = this.add.image(Phaser.Math.FloatBetween(100, width - 100), Phaser.Math.FloatBetween(200, height - 100), 'roomba');
        roomba.setDepth(5);

        const moveRoomba = () => {
            if (!roomba.active) return;
            const targetX = Phaser.Math.FloatBetween(100, width - 100);
            const targetY = Phaser.Math.FloatBetween(200, height - 100);
            
            const dist = Phaser.Math.Distance.Between(roomba.x, roomba.y, targetX, targetY);
            
            this.tweens.add({
                targets: roomba,
                x: targetX,
                y: targetY,
                duration: dist * 30, // Slow constant speed
                ease: 'Linear',
                onComplete: () => {
                    // Wiggle/Turn around
                    this.tweens.add({
                        targets: roomba,
                        angle: '+=90',
                        duration: 500,
                        onComplete: moveRoomba
                    });
                }
            });
        };

        moveRoomba();
    }

    update() {
        Object.values(this.agentsData).forEach(agentObj => {
            const agent = agentObj.sprite as Phaser.GameObjects.Container;
            const target = agentObj.target as Phaser.Math.Vector2;
            
            const speed = 1.8; 
            const distance = Phaser.Math.Distance.Between(agent.x, agent.y, target.x, target.y);
            
            if (distance > speed) {
                const angle = Phaser.Math.Angle.Between(agent.x, agent.y, target.x, target.y);
                agent.x += Math.cos(angle) * speed;
                agent.y += Math.sin(angle) * speed;
                
                agent.angle = Math.sin(this.time.now / 150) * 8;
            } else {
                agent.angle = 0;
            }
        });
    }

    private updateLighting() {
        if (!this.ambientLight) return;
        const hour = new Date().getHours();
        
        let isNight = false;

        if (hour >= 6 && hour < 17) {
            this.ambientLight.setFillStyle(0xffffff, 0); 
        } else if (hour >= 17 && hour < 19) {
            this.ambientLight.setFillStyle(0xffa500, 0.15); // Slight warm sunset
        } else {
            isNight = true;
            this.ambientLight.setFillStyle(0x1a1a2e, 0.6); // Modern office dark mode
        }

        Object.values(this.agentsData).forEach(agentObj => {
            const isWorking = ['thinking', 'coding', 'searching'].includes(agentObj.text.text);
            agentObj.lamp.setVisible(isNight && isWorking);
        });
    }
}
