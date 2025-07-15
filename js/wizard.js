// Robot Interface Controller
class RobotController {
    constructor() {
        this.speechBubble = document.getElementById('speech-bubble');
        this.bubbleText = document.getElementById('bubble-text');
        this.choiceButtons = document.getElementById('choice-buttons');
        
        this.isAnimating = false;
        this.init();
    }
    
    init() {
        console.log('RobotController init called');
        // Register both immediate and typing speech bubble functions
        window.showSpeechBubble = () => this.showSpeechBubble();
        window.showSpeechBubbleImmediate = () => this.showSpeechBubbleImmediate();
        window.hideSpeechBubble = () => this.hideSpeechBubble();
        
        console.log('Speech bubble functions registered');
    }
    
    handleResize() {
        if (this.speechBubble.style.display !== 'none') {
            this.positionSpeechBubble();
        }
    }
    
    showSpeechBubbleImmediate() {
        // Show speech bubble immediately without typing animation
        gsap.set(this.speechBubble, {
            display: 'block',
            opacity: 0,
            scale: 0.8,
            y: 20
        });
        
        gsap.to(this.speechBubble, {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.5,
            ease: "back.out(1.7)"
        });
        
        // Position speech bubble
        this.positionSpeechBubble();
        
        // Show text immediately, then choices after a delay
        setTimeout(() => {
            this.showChoices();
        }, 2000);
    }
    
    showSpeechBubble() {
        // Show speech bubble with typing animation (legacy function)
        gsap.set(this.speechBubble, {
            display: 'block',
            opacity: 0,
            scale: 0.8,
            y: 20
        });
        
        gsap.to(this.speechBubble, {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.5,
            ease: "back.out(1.7)"
        });
        
        // Position speech bubble
        this.positionSpeechBubble();
        
        // Start typing the message (text is already set by robot)
        this.typeMessage();
    }
    
    hideSpeechBubble() {
        gsap.to(this.speechBubble, {
            opacity: 0,
            scale: 0.8,
            y: 20,
            duration: 0.3,
            ease: "power2.in",
            onComplete: () => {
                this.speechBubble.style.display = 'none';
            }
        });
    }
    
    positionSpeechBubble() {
        // Position bubble on the right side since robot is bottom-right
        gsap.set(this.speechBubble, {
            right: 50,
            left: 'auto',
            top: '20%', // Moved much higher up from 50%
            transform: 'translateY(-50%)',
            position: 'fixed'
        });
        
        // Adjust position for mobile
        if (window.innerWidth < 768) {
            gsap.set(this.speechBubble, {
                left: '50%',
                right: 'auto',
                transform: 'translate(-50%, -50%)',
                top: '25%' // Also higher on mobile
            });
        }
    }
    
    typeMessage(callback) {
        const message = this.bubbleText.textContent;
        this.bubbleText.textContent = '';
        
        let index = 0;
        const typeInterval = setInterval(() => {
            if (index < message.length) {
                this.bubbleText.textContent += message[index];
                index++;
                
                // Add some randomness to typing speed
                if (Math.random() < 0.1) {
                    setTimeout(() => {}, 100); // Pause occasionally
                }
            } else {
                clearInterval(typeInterval);
                
                // Wait a moment then show choices
                setTimeout(() => {
                    this.showChoices();
                }, 1500);
                
                if (callback) callback();
            }
        }, 20 + Math.random() * 10); // Fast typing speed
    }
    
    showChoices() {
        // Animate choice buttons in
        gsap.set(this.choiceButtons, {
            display: 'flex',
            opacity: 0,
            y: 20
        });
        
        gsap.to(this.choiceButtons, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "back.out(1.7)"
        });
        
        // Animate each button individually
        const buttons = this.choiceButtons.querySelectorAll('.choice-btn');
        buttons.forEach((button, index) => {
            gsap.set(button, {
                opacity: 0,
                scale: 0.8,
                y: 20
            });
            
            gsap.to(button, {
                opacity: 1,
                scale: 1,
                y: 0,
                duration: 0.4,
                delay: index * 0.1,
                ease: "back.out(1.7)"
            });
            
            // Add hover animations
            button.addEventListener('mouseenter', () => {
                gsap.to(button, {
                    scale: 1.05,
                    duration: 0.2,
                    ease: "power2.out"
                });
                
                // Make robot react to hover
                this.robotReactToHover();
            });
            
            button.addEventListener('mouseleave', () => {
                gsap.to(button, {
                    scale: 1,
                    duration: 0.2,
                    ease: "power2.out"
                });
            });
        });
        
        this.isAnimating = false;
    }
    
    robotReactToHover() {
        // Make robot react to hover with subtle head movement
        if (window.robot3D && window.robot3D.robot && window.robot3D.animations.idle) {
            // Quick robot head turn
            const headTarget = window.robot3D.robot.children.find(child => child.position.y > 1) || window.robot3D.robot;
            
            gsap.to(headTarget.rotation, {
                x: Math.random() * 0.1 - 0.05,
                y: window.robot3D.robot.rotation.y + (Math.random() * 0.2 - 0.1),
                duration: 0.3,
                yoyo: true,
                repeat: 1
            });
        }
    }
    
    // Handle window resize
    handleResize() {
        if (this.speechBubble.style.display !== 'none') {
            this.positionSpeechBubble();
        }
    }
}

// Navigation function
function navigateTo(destination) {
    const speechBubble = document.getElementById('speech-bubble');
    
    // Simple robot celebration animation
    if (window.robot3D && window.robot3D.robot) {
        gsap.timeline()
            .to(window.robot3D.robot.scale, {
                x: 1.0,
                y: 1.0,
                z: 1.0,
                duration: 0.3,
                ease: "back.out(1.7)"
            })
            .to(window.robot3D.robot.rotation, {
                y: window.robot3D.robot.rotation.y + Math.PI / 4,
                duration: 0.4,
                ease: "power2.inOut"
            }, "<")
            .to(speechBubble, {
                opacity: 0,
                scale: 0.8,
                duration: 0.3
            }, "<")
            .call(() => {
                // Navigate to the appropriate page
                switch(destination) {
                    case 'recruiter':
                        window.location.href = 'projects.html';
                        break;
                    case 'friend':
                        window.location.href = 'friend.html';
                        break;
                    case 'random':
                        window.location.href = 'random.html';
                        break;
                }
            });
    } else {
        // Fallback if robot isn't loaded
        gsap.to(speechBubble, {
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
                switch(destination) {
                    case 'recruiter':
                        window.location.href = 'projects.html';
                        break;
                    case 'friend':
                        window.location.href = 'friend.html';
                        break;
                    case 'random':
                        window.location.href = 'random.html';
                        break;
                }
            }
        });
    }
}

// Initialize robot controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing robot controller...');
    window.robotController = new RobotController();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        window.robotController.handleResize();
    });
    
    console.log('Robot controller initialized');
});

// Function to toggle info popup
function toggleInfoPopup() {
    const popup = document.getElementById('info-popup');
    if (popup.style.display === 'none' || popup.style.display === '') {
        popup.style.display = 'block';
    } else {
        popup.style.display = 'none';
    }
}

// Hide info popup when clicking elsewhere
document.addEventListener('click', function(event) {
    const popup = document.getElementById('info-popup');
    const infoIcon = document.querySelector('.info-icon');
    
    if (!popup.contains(event.target) && !infoIcon.contains(event.target)) {
        popup.style.display = 'none';
    }
}); 