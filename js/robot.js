class Robot3D {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.robot = null;
        this.animationMixer = null;
        this.clock = new THREE.Clock();
        this.isLoaded = false;
        this.animations = {
            walking: false,
            idle: false
        };
        
        this.init();
    }

    init() {
        console.log('Initializing 3D robot...');
        
        const canvas = document.getElementById('robot-canvas');
        const container = document.getElementById('robot-container');
        
        if (!canvas || !container) {
            console.error('Robot canvas or container not found!');
            return;
        }
        
        console.log('Canvas and container found, setting up scene...');
        
        // Scene setup
        this.scene = new THREE.Scene();
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 2, 5);
        this.camera.lookAt(0, 1, 0);
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setClearColor(0x000000, 0); // Transparent background
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        console.log('Renderer created, canvas size:', container.clientWidth, 'x', container.clientHeight);
        
        // Lighting
        this.setupLighting();
        
        // Load robot
        this.loadRobot();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Start render loop
        this.animate();
        
        console.log('3D robot initialization complete');
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light (main light)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Fill light
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-5, 5, -5);
        this.scene.add(fillLight);
    }

    loadRobot() {
        console.log('Starting robot loading...');
        
        // Load the OBJ file only - no fallback
        if (typeof THREE.MTLLoader !== 'undefined' && typeof THREE.OBJLoader !== 'undefined') {
            console.log('Loaders available, loading OBJ robot...');
            this.loadOBJRobot();
        } else {
            console.error('OBJ/MTL loaders not available!');
        }
    }
    
    loadOBJRobot() {
        const mtlLoader = new THREE.MTLLoader();
        mtlLoader.setPath('./assets/robot_obj/');
        
        mtlLoader.load('Robot.mtl', (materials) => {
            materials.preload();
            console.log('MTL loaded successfully');
            
            const objLoader = new THREE.OBJLoader();
            objLoader.setMaterials(materials);
            objLoader.setPath('./assets/robot_obj/');
            
            objLoader.load('Robot.obj', (object) => {
                console.log('OBJ loaded successfully');
                this.robot = object;
                
                // Store references to individual body parts for animation
                this.robotParts = {};
                this.identifyRobotParts();
                
                // Scale the robot
                this.robot.scale.set(0.8, 0.8, 0.8);
                
                // Check if user has seen the animation before
                const hasSeenAnimation = sessionStorage.getItem('robotAnimationSeen') === 'true';
                
                if (hasSeenAnimation) {
                    // Skip animation - place robot in final position immediately
                    console.log('User has seen animation before - skipping to final state');
                    this.robot.position.set(2.5, -2.5, 0); // Final position
                    this.robot.rotation.y = -Math.PI / 6; // Final rotation (facing camera)
                    
                    this.scene.add(this.robot);
                    this.isLoaded = true;
                    
                    // Go directly to speech bubble and choices
                    this.skipToFinalState();
                } else {
                    // First time - play full animation
                    console.log('First time visitor - playing full animation');
                    this.robot.position.set(6, -2.5, 0); // Start off-screen to the right
                    this.robot.rotation.y = Math.PI; // Face left for walking
                    
                    this.scene.add(this.robot);
                    this.isLoaded = true;
                    
                    // Mark that user has now seen the animation
                    sessionStorage.setItem('robotAnimationSeen', 'true');
                    
                    // Start the walking animation
                    this.startWalkingAnimation();
                }
                
                // Enable shadows
                this.robot.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                console.log('Robot parts identified:', Object.keys(this.robotParts));
            }, 
            (progress) => {
                console.log('Loading progress:', progress);
            },
            (error) => {
                console.error('Error loading OBJ:', error);
            });
        }, 
        (progress) => {
            console.log('MTL Loading progress:', progress);
        },
        (error) => {
            console.error('Error loading MTL:', error);
        });
    }
    
    identifyRobotParts() {
        console.log('=== ROBOT PARTS IDENTIFICATION DEBUG ===');
        
        // First, let's see ALL the meshes in the robot
        let allMeshes = [];
        this.robot.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                allMeshes.push({
                    name: child.name,
                    position: {
                        x: child.position.x.toFixed(3),
                        y: child.position.y.toFixed(3), 
                        z: child.position.z.toFixed(3)
                    },
                    mesh: child
                });
                console.log(`Found mesh: "${child.name}" at position (${child.position.x.toFixed(3)}, ${child.position.y.toFixed(3)}, ${child.position.z.toFixed(3)})`);
            }
        });
        
        console.log(`Total meshes found: ${allMeshes.length}`);
        
        // FIXED: Use .L and .R suffixes in names, not position
        this.robot.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const name = child.name.toLowerCase();
                const pos = child.position;
                
                console.log(`\nAnalyzing: "${child.name}"`);
                console.log(`  Name lowercase: "${name}"`);
                
                // Head identification
                if (name.includes('head')) {
                    this.robotParts.head = child;
                    console.log(`  ✓ ASSIGNED as HEAD`);
                }
                // Body identification  
                else if (name.includes('torso') || name.includes('body') || name.includes('chest')) {
                    this.robotParts.body = child;
                    console.log(`  ✓ ASSIGNED as BODY`);
                }
                // ARM identification - use .L and .R in names, prefer main "Arm" parts
                else if (name.includes('arm.l')) {
                    this.robotParts.leftArm = child;
                    console.log(`  ✓ ASSIGNED as LEFT ARM (name contains 'arm.l')`);
                }
                else if (name.includes('arm.r')) {
                    this.robotParts.rightArm = child;
                    console.log(`  ✓ ASSIGNED as RIGHT ARM (name contains 'arm.r')`);
                }
                // LEG identification - use .L and .R in names, prefer main "Leg" parts  
                else if (name.includes('leg.l') && !name.includes('lower')) {
                    this.robotParts.leftLeg = child;
                    console.log(`  ✓ ASSIGNED as LEFT LEG (name contains 'leg.l' but not 'lower')`);
                }
                else if (name.includes('leg.r') && !name.includes('lower')) {
                    this.robotParts.rightLeg = child;
                    console.log(`  ✓ ASSIGNED as RIGHT LEG (name contains 'leg.r' but not 'lower')`);
                }
                // CHILD PARTS - store references to move with parent parts
                else if (name.includes('lowerleg.l')) {
                    this.robotParts.leftLowerLeg = child;
                    console.log(`  ✓ ASSIGNED as LEFT LOWER LEG`);
                }
                else if (name.includes('lowerleg.r')) {
                    this.robotParts.rightLowerLeg = child;
                    console.log(`  ✓ ASSIGNED as RIGHT LOWER LEG`);
                }
                else if (name.includes('hand.l')) {
                    this.robotParts.leftHand = child;
                    console.log(`  ✓ ASSIGNED as LEFT HAND`);
                }
                else if (name.includes('hand.r')) {
                    this.robotParts.rightHand = child;
                    console.log(`  ✓ ASSIGNED as RIGHT HAND`);
                }
                else if (name.includes('foot.l')) {
                    this.robotParts.leftFoot = child;
                    console.log(`  ✓ ASSIGNED as LEFT FOOT`);
                }
                else if (name.includes('foot.r')) {
                    this.robotParts.rightFoot = child;
                    console.log(`  ✓ ASSIGNED as RIGHT FOOT`);
                }
                else {
                    console.log(`  - No assignment made (${name})`);
                }
            }
        });
        
        console.log('\n=== PART ASSIGNMENT RESULTS ===');
        console.log('Head:', this.robotParts.head ? `"${this.robotParts.head.name}"` : 'NOT FOUND');
        console.log('Body:', this.robotParts.body ? `"${this.robotParts.body.name}"` : 'NOT FOUND');
        console.log('Left Arm:', this.robotParts.leftArm ? `"${this.robotParts.leftArm.name}"` : 'NOT FOUND');
        console.log('Right Arm:', this.robotParts.rightArm ? `"${this.robotParts.rightArm.name}"` : 'NOT FOUND');
        console.log('Left Leg:', this.robotParts.leftLeg ? `"${this.robotParts.leftLeg.name}"` : 'NOT FOUND');
        console.log('Right Leg:', this.robotParts.rightLeg ? `"${this.robotParts.rightLeg.name}"` : 'NOT FOUND');
        console.log('Child parts found:', {
            leftLowerLeg: this.robotParts.leftLowerLeg?.name,
            rightLowerLeg: this.robotParts.rightLowerLeg?.name,
            leftHand: this.robotParts.leftHand?.name,
            rightHand: this.robotParts.rightHand?.name,
            leftFoot: this.robotParts.leftFoot?.name,
            rightFoot: this.robotParts.rightFoot?.name
        });
        
        console.log('\n=== FINAL ROBOT PARTS SUMMARY ===');
        const finalParts = Object.keys(this.robotParts);
        console.log(`Successfully identified ${finalParts.length} parts:`, finalParts);
        finalParts.forEach(partName => {
            const part = this.robotParts[partName];
            console.log(`  ${partName.toUpperCase()}: "${part.name}"`);
        });
        console.log('=====================================');
        
        // Store original positions for pivot calculations
        Object.values(this.robotParts).forEach(part => {
            if (part && part.position) {
                part.userData.originalPosition = part.position.clone();
            }
        });
    }

    startWalkingAnimation() {
        if (!this.robot) return;
        
        console.log('Starting walking animation for OBJ robot...');
        this.animations.walking = true;
        
        // Create natural walking timeline that coordinates all movements
        const walkTimeline = gsap.timeline();
        
        // FIXED: Just walk forward, no rotation during walk
        walkTimeline
            .to(this.robot.position, {
                duration: 3,
                x: 2.5, // Final position - pure forward movement
                ease: "power2.out"
            })
            // AFTER walking is done, then rotate to face camera
            .to(this.robot.rotation, {
                duration: 0.5, // Quick turn after arriving
                y: -Math.PI / 6, // Face slightly toward camera
                ease: "power2.out"
            })
            // When everything is done, show speech bubble
            .call(() => {
                this.animations.walking = false;
                this.showSpeechBubble();
                // Start idle animations only AFTER speech bubble is done typing
                setTimeout(() => {
                    this.startIdleAnimations();
                }, 2000); // Give time for speech bubble to finish typing
            });
        
        // WALKING LIMB ANIMATIONS - these happen during the 3-second entrance
        if (this.robotParts && Object.keys(this.robotParts).length > 0) {
            console.log('Animating individual parts during walk:', Object.keys(this.robotParts));
            
            // Natural walking cycle - legs alternate (with child parts following)
            if (this.robotParts.leftLeg) {
                // Left leg: starts forward, swings back, then forward again
                const leftLegAnimation = gsap.fromTo(this.robotParts.leftLeg.rotation, 
                    { x: 0.3 }, // Start forward
                    {
                        duration: 0.6,
                        x: -0.3, // Swing to back
                        ease: "sine.inOut",
                        yoyo: true,
                        repeat: 4, // 5 total steps during 3 seconds
                        repeatDelay: 0
                    }
                );
                
                // Make lower leg and foot follow the upper leg
                if (this.robotParts.leftLowerLeg) {
                    gsap.fromTo(this.robotParts.leftLowerLeg.rotation, 
                        { x: 0.15 }, { x: -0.15, duration: 0.6, ease: "sine.inOut", yoyo: true, repeat: 4, repeatDelay: 0 }
                    );
                }
                if (this.robotParts.leftFoot) {
                    gsap.fromTo(this.robotParts.leftFoot.rotation, 
                        { x: 0.1 }, { x: -0.1, duration: 0.6, ease: "sine.inOut", yoyo: true, repeat: 4, repeatDelay: 0 }
                    );
                }
            }
            
            if (this.robotParts.rightLeg) {
                // Right leg: starts back (opposite to left)
                gsap.fromTo(this.robotParts.rightLeg.rotation,
                    { x: -0.3 }, // Start back
                    {
                        duration: 0.6,
                        x: 0.3, // Swing to forward
                        ease: "sine.inOut",
                        yoyo: true,
                        repeat: 4,
                        repeatDelay: 0
                    }
                );
                
                // Make lower leg and foot follow the upper leg (opposite motion)
                if (this.robotParts.rightLowerLeg) {
                    gsap.fromTo(this.robotParts.rightLowerLeg.rotation, 
                        { x: -0.15 }, { x: 0.15, duration: 0.6, ease: "sine.inOut", yoyo: true, repeat: 4, repeatDelay: 0 }
                    );
                }
                if (this.robotParts.rightFoot) {
                    gsap.fromTo(this.robotParts.rightFoot.rotation, 
                        { x: -0.1 }, { x: 0.1, duration: 0.6, ease: "sine.inOut", yoyo: true, repeat: 4, repeatDelay: 0 }
                    );
                }
            }
            
            // Natural arm swinging - opposite to legs (with hands following)
            if (this.robotParts.leftArm) {
                // Left arm swings opposite to left leg
                gsap.fromTo(this.robotParts.leftArm.rotation,
                    { x: -0.2 }, // Start back (opposite to left leg)
                    {
                        duration: 0.6,
                        x: 0.2, // Swing forward
                        ease: "sine.inOut",
                        yoyo: true,
                        repeat: 4,
                        repeatDelay: 0
                    }
                );
                
                // Make hand follow the arm
                if (this.robotParts.leftHand) {
                    gsap.fromTo(this.robotParts.leftHand.rotation,
                        { x: -0.1 }, { x: 0.1, duration: 0.6, ease: "sine.inOut", yoyo: true, repeat: 4, repeatDelay: 0 }
                    );
                }
            }
            
            if (this.robotParts.rightArm) {
                // Right arm swings opposite to right leg
                gsap.fromTo(this.robotParts.rightArm.rotation,
                    { x: 0.2 }, // Start forward (opposite to right leg)
                    {
                        duration: 0.6,
                        x: -0.2, // Swing back
                        ease: "sine.inOut",
                        yoyo: true,
                        repeat: 4,
                        repeatDelay: 0
                    }
                );
                
                // Make hand follow the arm (opposite motion)
                if (this.robotParts.rightHand) {
                    gsap.fromTo(this.robotParts.rightHand.rotation,
                        { x: 0.1 }, { x: -0.1, duration: 0.6, ease: "sine.inOut", yoyo: true, repeat: 4, repeatDelay: 0 }
                    );
                }
            }
            
            // Walking head bob
            if (this.robotParts.head) {
                const originalY = this.robotParts.head.position.y;
                gsap.to(this.robotParts.head.position, {
                    duration: 0.3,
                    y: originalY + 0.03,
                    ease: "sine.inOut",
                    yoyo: true,
                    repeat: 19 // Bob throughout the 3 second walk
                });
            }
        } else {
            console.log('No individual parts identified, using whole-body movement');
            // Fallback to whole-body walking motion
            gsap.to(this.robot.position, {
                duration: 0.4,
                y: "-=0.05",
                ease: "sine.inOut",
                yoyo: true,
                repeat: 15
            });
        }
    }

    skipToFinalState() {
        console.log('Skipping to final state - showing speech bubble and choices immediately');
        
        // Update the speech bubble text immediately (no typing animation)
        const bubbleText = document.getElementById('bubble-text');
        if (bubbleText) {
            const fullText = "Hi! I'm the webmaster around these parts and can help guide you around. First, who are you?";
            bubbleText.textContent = fullText; // Set text immediately, no typing
            console.log('Speech bubble text set immediately');
        }
        
        // Show speech bubble immediately and then choices
        if (window.showSpeechBubbleImmediate) {
            window.showSpeechBubbleImmediate();
        } else if (window.robotController) {
            window.robotController.showSpeechBubbleImmediate();
        }
        
        // Start idle animations immediately
        this.startIdleAnimations();
    }

    showSpeechBubble() {
        console.log('Robot showSpeechBubble called');
        
        // Update the speech bubble text
        const bubbleText = document.getElementById('bubble-text');
        if (bubbleText) {
            const fullText = "Hi! I'm the webmaster around these parts and can help guide you around. First, who are you?";
            bubbleText.textContent = ""; // Clear existing text
            console.log('Speech bubble text cleared, starting fast typing...');
            
            // Fast typing animation (10ms per character - 2x faster than before)
            let currentIndex = 0;
            const typeInterval = setInterval(() => {
                if (currentIndex < fullText.length) {
                    bubbleText.textContent += fullText.charAt(currentIndex);
                    currentIndex++;
                } else {
                    clearInterval(typeInterval);
                    console.log('Fast typing animation complete');
                }
            }, 10); // 10ms per character = very fast typing
        }
        
        // Show speech bubble with original function
        if (window.showSpeechBubble) {
            window.showSpeechBubble();
        } else if (window.robotController) {
            window.robotController.showSpeechBubble();
        }
    }

    startIdleAnimations() {
        if (!this.robot || this.animations.walking) return;
        
        console.log('Starting AGGRESSIVE idle animations for OBJ robot...');
        this.animations.idle = true;
        
        // Reset ALL limbs (including child parts) to neutral positions first
        if (this.robotParts && Object.keys(this.robotParts).length > 0) {
            // Reset all main parts
            Object.values(this.robotParts).forEach(part => {
                if (part && part.rotation) {
                    gsap.set(part.rotation, { x: 0, y: 0, z: 0 });
                }
                // Reset head position if it was moved during walking
                if (part === this.robotParts.head && part.userData.originalPosition) {
                    gsap.set(part.position, { 
                        y: part.userData.originalPosition.y 
                    });
                }
            });
            
            console.log('Reset all robot parts to neutral positions for idle');
        }
        
        // MORE AGGRESSIVE head movements - looking around frequently
        this.scheduleAggressiveHeadMovement();
        
        // Gentle body swaying (keep this subtle)
        gsap.to(this.robot.rotation, {
            duration: 4,
            z: 0.02,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1
        });
        
        // Very subtle breathing-like movement
        if (this.robotParts && this.robotParts.body) {
            // Breathing animation for just the body/torso
            gsap.to(this.robotParts.body.scale, {
                duration: 3,
                y: 1.02,
                ease: "sine.inOut",
                yoyo: true,
                repeat: -1
            });
        } else {
            // Fallback to whole robot breathing
            gsap.to(this.robot.scale, {
                duration: 3,
                y: 0.805, // Slightly larger than 0.8 base scale
                ease: "sine.inOut",
                yoyo: true,
                repeat: -1
            });
        }
        
        // AGGRESSIVE arm movements and pointing gestures
        if (this.robotParts && (this.robotParts.leftArm || this.robotParts.rightArm)) {
            this.scheduleAggressiveArmMovements();
        }
    }

    scheduleAggressiveArmMovements() {
        if (!this.robot || !this.animations.idle || !this.robotParts) return;
        
        // More frequent arm movements (2-6 seconds instead of 5-12)
        const delay = 2 + Math.random() * 4;
        
        setTimeout(() => {
            if (this.animations.idle) {
                this.performAggressiveArmMovement();
                this.scheduleAggressiveArmMovements(); // Schedule the next one
            }
        }, delay * 1000);
    }

    scheduleAggressiveHeadMovement() {
        if (!this.robot || !this.animations.idle) return;
        
        // Much more frequent head movements (1-3 seconds instead of 3-8)
        const delay = 1 + Math.random() * 2;
        
        setTimeout(() => {
            if (this.animations.idle) {
                this.performAggressiveHeadMovement();
                this.scheduleAggressiveHeadMovement(); // Schedule the next one
            }
        }, delay * 1000);
    }

    performAggressiveArmMovement() {
        if (!this.robot || !this.animations.idle || !this.robotParts) return;
        
        // Choose random arm that exists (prefer right arm for pointing)
        const availableArms = [];
        if (this.robotParts.rightArm) availableArms.push({ arm: this.robotParts.rightArm, name: 'right' });
        if (this.robotParts.leftArm) availableArms.push({ arm: this.robotParts.leftArm, name: 'left' });
        
        if (availableArms.length === 0) return;
        
        const selectedArm = availableArms[Math.floor(Math.random() * availableArms.length)];
        
        // Creative pointing and gesturing movements
        const aggressiveMovements = [
            { x: 0.3, z: 0.2, description: 'point forward-right' },    // Point to corner
            { x: 0.4, z: -0.1, description: 'point up-forward' },      // Point up
            { x: -0.2, z: 0.3, description: 'point outward' },         // Point to side
            { x: 0.1, z: 0.4, description: 'big outward gesture' },    // Big gesture
            { x: 0.5, z: 0, description: 'point straight forward' },   // Aggressive forward point
            { x: 0.2, z: 0.3, description: 'corner pointing' },        // Point to corners
            { x: -0.1, z: 0.2, description: 'casual gesture' }         // Casual arm movement
        ];
        
        const movement = aggressiveMovements[Math.floor(Math.random() * aggressiveMovements.length)];
        console.log(`Robot performing: ${movement.description} with ${selectedArm.name} arm`);
        
        gsap.timeline()
            // Quick move to position
            .to(selectedArm.arm.rotation, {
                duration: 0.5, // Much faster movement
                x: movement.x,
                z: movement.z,
                ease: "power2.out"
            })
            // Hold the gesture
            .to({}, { duration: 1 + Math.random() * 2 })
            // Quick return to neutral
            .to(selectedArm.arm.rotation, {
                duration: 0.4,
                x: 0,
                z: 0,
                ease: "power2.out"
            });
    }

    performAggressiveHeadMovement() {
        if (!this.robot || !this.animations.idle) return;
        
        // Use the identified head part if available
        const headTarget = this.robotParts?.head || this.robot;
        
        // AGGRESSIVE head movements - looking at corners, scanning around
        const aggressiveDirections = [
            { y: 0.4, x: 0, description: 'sharp right look' },          // Sharp right
            { y: -0.4, x: 0, description: 'sharp left look' },          // Sharp left  
            { y: 0.3, x: 0.2, description: 'look up-right corner' },    // Upper right corner
            { y: -0.3, x: 0.2, description: 'look up-left corner' },    // Upper left corner
            { y: 0.2, x: -0.15, description: 'look down-right' },       // Down right
            { y: -0.2, x: -0.15, description: 'look down-left' },       // Down left
            { y: 0.5, x: 0.1, description: 'extreme right-up' },        // Extreme movements
            { y: -0.5, x: 0.1, description: 'extreme left-up' },        // Extreme movements
            { y: 0, x: 0.3, description: 'look way up' },               // Look way up
            { y: 0, x: -0.2, description: 'look down' }                 // Look down
        ];
        
        const direction = aggressiveDirections[Math.floor(Math.random() * aggressiveDirections.length)];
        console.log(`Robot head: ${direction.description}`);
        
        gsap.timeline()
            // Quick move to look direction
            .to(headTarget.rotation, {
                duration: 0.3, // Much faster head movement
                y: direction.y,
                x: direction.x,
                ease: "power2.out"
            })
            // Hold the look briefly
            .to({}, { duration: 0.8 + Math.random() * 1.5 })
            // Quick return to neutral
            .to(headTarget.rotation, {
                duration: 0.3,
                y: 0,
                x: 0,
                ease: "power2.out"
            });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta();
        
        // Update animation mixer if available
        if (this.animationMixer) {
            this.animationMixer.update(delta);
        }
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        const container = document.getElementById('robot-container');
        
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.robot3D = new Robot3D();
}); 