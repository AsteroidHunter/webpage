// Timeline Page Controller
class TimelineController {
    constructor() {
        this.experienceBlocks = document.querySelectorAll('.experience-block');
        this.skillsPanel = document.getElementById('skillsPanel');
        this.panelContent = document.getElementById('panelContent');
        this.skillLegend = document.getElementById('skillLegend');
        this.activeBlock = null;
        
        this.init();
    }
    
    init() {
        this.setupExperienceBlocks();
        this.setupScrollAnimations();
        this.setupTimelineAnimations();
        this.setupSkillLegend();
    }
    
    setupExperienceBlocks() {
        this.experienceBlocks.forEach((block, index) => {
            // Add click handler
            block.addEventListener('click', () => {
                this.toggleExperienceBlock(block);
            });
            
            // Add staggered entrance animation
            gsap.set(block, {
                opacity: 0,
                x: 50,
                scale: 0.9
            });
            
            gsap.to(block, {
                opacity: 1,
                x: 0,
                scale: 1,
                duration: 0.8,
                delay: index * 0.2,
                ease: "power2.out"
            });
            
            // Setup hover effects
            this.setupBlockHoverEffects(block);
        });
    }
    
    setupBlockHoverEffects(block) {
        const skills = block.dataset.skills.split(',');
        
        block.addEventListener('mouseenter', () => {
            if (block !== this.activeBlock) {
                gsap.to(block, {
                    scale: 1.02,
                    duration: 0.3,
                    ease: "power2.out"
                });
                
                // Highlight corresponding legend items
                this.highlightSkillsInLegend(skills, true);
            }
        });
        
        block.addEventListener('mouseleave', () => {
            if (block !== this.activeBlock) {
                gsap.to(block, {
                    scale: 1,
                    duration: 0.3,
                    ease: "power2.out"
                });
                
                // Remove highlight from legend items
                this.highlightSkillsInLegend(skills, false);
            }
        });
    }
    
    toggleExperienceBlock(block) {
        // Close current active block if different
        if (this.activeBlock && this.activeBlock !== block) {
            this.closeExperienceBlock(this.activeBlock);
        }
        
        if (block.classList.contains('active')) {
            this.closeExperienceBlock(block);
        } else {
            this.openExperienceBlock(block);
        }
    }
    
    openExperienceBlock(block) {
        this.activeBlock = block;
        block.classList.add('active');
        
        // Animate block expansion
        gsap.to(block, {
            scale: 1.05,
            duration: 0.4,
            ease: "back.out(1.7)"
        });
        
        // Show details with staggered animation
        const details = block.querySelector('.experience-details');
        const skillsSection = details.querySelector('.skills-gained');
        const achievementsSection = details.querySelector('.achievements');
        
        gsap.timeline()
            .to(details, {
                maxHeight: '500px',
                duration: 0.5,
                ease: "power2.out"
            })
            .from([skillsSection, achievementsSection], {
                opacity: 0,
                y: 20,
                duration: 0.4,
                stagger: 0.1,
                ease: "power2.out"
            }, "-=0.2");
        
        // Update skills panel
        this.updateSkillsPanel(block);
        
        // Scroll to block
        this.scrollToBlock(block);
    }
    
    closeExperienceBlock(block) {
        block.classList.remove('active');
        
        if (this.activeBlock === block) {
            this.activeBlock = null;
        }
        
        // Animate block contraction
        gsap.to(block, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out"
        });
        
        // Hide details
        const details = block.querySelector('.experience-details');
        gsap.to(details, {
            maxHeight: '0px',
            duration: 0.3,
            ease: "power2.out"
        });
        
        // Hide skills panel if this was the active block
        if (this.skillsPanel.classList.contains('active')) {
            this.closeSkillsPanel();
        }
    }
    
    updateSkillsPanel(block) {
        const skills = block.dataset.skills.split(',');
        const header = block.querySelector('.experience-header h3').textContent;
        const company = block.querySelector('.company').textContent;
        const skillsData = block.querySelector('.skills-gained');
        const achievementsData = block.querySelector('.achievements');
        
        // Build panel content
        const content = `
            <div class="panel-experience-header">
                <h4>${header}</h4>
                <p class="panel-company">${company}</p>
            </div>
            <div class="panel-skills">
                <h5>Skills Applied:</h5>
                <div class="skill-tags">
                    ${skills.map(skill => `<span class="skill-tag ${skill.trim()}">${this.formatSkillName(skill.trim())}</span>`).join('')}
                </div>
            </div>
            <div class="panel-details">
                ${skillsData ? skillsData.outerHTML : ''}
                ${achievementsData ? achievementsData.outerHTML : ''}
            </div>
        `;
        
        this.panelContent.innerHTML = content;
        
        // Show panel with animation
        gsap.to(this.skillsPanel, {
            right: '20px',
            duration: 0.5,
            ease: "power2.out"
        });
        
        this.skillsPanel.classList.add('active');
        
        // Animate panel content
        gsap.from(this.panelContent.children, {
            opacity: 0,
            y: 20,
            duration: 0.4,
            stagger: 0.1,
            ease: "power2.out",
            delay: 0.2
        });
    }
    
    closeSkillsPanel() {
        gsap.to(this.skillsPanel, {
            right: '-400px',
            duration: 0.5,
            ease: "power2.out"
        });
        
        this.skillsPanel.classList.remove('active');
    }
    
    scrollToBlock(block) {
        const blockTop = block.offsetTop;
        const offset = 150; // Account for fixed header
        
        gsap.to(window, {
            scrollTo: blockTop - offset,
            duration: 1,
            ease: "power2.out"
        });
    }
    
    setupScrollAnimations() {
        // Register ScrollTrigger plugin
        gsap.registerPlugin(ScrollTrigger);
        
        // Animate experience blocks on scroll
        this.experienceBlocks.forEach((block, index) => {
            gsap.fromTo(block, 
                {
                    opacity: 0,
                    x: 100,
                    scale: 0.9
                },
                {
                    opacity: 1,
                    x: 0,
                    scale: 1,
                    duration: 0.8,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: block,
                        start: "top 80%",
                        end: "bottom 20%",
                        toggleActions: "play none none reverse"
                    }
                }
            );
        });
        
        // Parallax effect for timeline line
        gsap.to('.timeline-line', {
            backgroundPosition: '0 50px',
            ease: "none",
            scrollTrigger: {
                trigger: '.timeline-content',
                start: "top bottom",
                end: "bottom top",
                scrub: true
            }
        });
    }
    
    setupTimelineAnimations() {
        // Animate timeline line drawing
        gsap.fromTo('.timeline-line', 
            {
                scaleY: 0,
                transformOrigin: 'top center'
            },
            {
                scaleY: 1,
                duration: 2,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: '.timeline-content',
                    start: "top 80%"
                }
            }
        );
        
        // Pulse effect for timeline dots
        gsap.to('.experience-block::before', {
            scale: 1.2,
            duration: 2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            stagger: 0.3
        });
    }
    
    setupSkillLegend() {
        const legendItems = document.querySelectorAll('.legend-item');
        
        legendItems.forEach(item => {
            item.addEventListener('click', () => {
                const skill = item.dataset.skill;
                this.filterBySkill(skill);
            });
        });
    }
    
    filterBySkill(skill) {
        this.experienceBlocks.forEach(block => {
            const blockSkills = block.dataset.skills.split(',').map(s => s.trim());
            
            if (blockSkills.includes(skill)) {
                // Highlight matching blocks
                gsap.to(block, {
                    scale: 1.05,
                    duration: 0.3,
                    ease: "power2.out"
                });
                
                // Enhanced glow effect
                const originalBoxShadow = getComputedStyle(block).boxShadow;
                gsap.to(block, {
                    boxShadow: `${originalBoxShadow}, 0 0 40px rgba(255, 255, 255, 0.3)`,
                    duration: 0.3
                });
                
                // Reset after 2 seconds
                setTimeout(() => {
                    gsap.to(block, {
                        scale: 1,
                        boxShadow: originalBoxShadow,
                        duration: 0.3
                    });
                }, 2000);
            }
        });
    }
    
    highlightSkillsInLegend(skills, highlight) {
        skills.forEach(skill => {
            const legendItem = document.querySelector(`[data-skill="${skill.trim()}"]`);
            if (legendItem) {
                if (highlight) {
                    gsap.to(legendItem, {
                        scale: 1.1,
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        duration: 0.2
                    });
                } else {
                    gsap.to(legendItem, {
                        scale: 1,
                        backgroundColor: 'transparent',
                        duration: 0.2
                    });
                }
            }
        });
    }
    
    formatSkillName(skill) {
        const skillNames = {
            'engineering': 'Engineering',
            'research': 'Research',
            'leadership': 'Leadership',
            'communication': 'Communication',
            'innovation': 'Innovation'
        };
        return skillNames[skill] || skill;
    }
}

// Global functions for HTML onclick handlers
function toggleSkillLegend() {
    const legend = document.getElementById('skillLegend');
    legend.classList.toggle('active');
    
    // Animate legend items
    if (legend.classList.contains('active')) {
        gsap.from('.legend-item', {
            opacity: 0,
            x: 20,
            duration: 0.3,
            stagger: 0.1,
            ease: "power2.out",
            delay: 0.2
        });
    }
}

function closeSkillsPanel() {
    const controller = window.timelineController;
    if (controller) {
        controller.closeSkillsPanel();
    }
}

function downloadResume() {
    // Create a magical download effect
    const btn = event.target.closest('.download-btn');
    
    gsap.timeline()
        .to(btn, {
            scale: 0.95,
            duration: 0.1
        })
        .to(btn, {
            scale: 1.1,
            duration: 0.2,
            ease: "back.out(1.7)"
        })
        .to(btn, {
            scale: 1,
            duration: 0.2
        });
    
    // Create sparkle effect
    for (let i = 0; i < 10; i++) {
        createSparkle(btn);
    }
    
    // In a real implementation, this would trigger actual resume download
    setTimeout(() => {
        alert('✨ Resume download initiated! ✨\n(In a real implementation, this would download your actual resume)');
    }, 500);
}

function openContact() {
    // Create contact modal or redirect
    const btn = event.target.closest('.contact-btn');
    
    gsap.timeline()
        .to(btn, {
            scale: 0.95,
            duration: 0.1
        })
        .to(btn, {
            scale: 1.1,
            duration: 0.2,
            ease: "back.out(1.7)"
        })
        .to(btn, {
            scale: 1,
            duration: 0.2
        });
    
    // In a real implementation, this could open a contact form or email client
    setTimeout(() => {
        alert('📧 Contact portal activated! ✨\n(In a real implementation, this would open your contact form or email)');
    }, 500);
}

function createSparkle(element) {
    const sparkle = document.createElement('div');
    const rect = element.getBoundingClientRect();
    
    sparkle.style.cssText = `
        position: fixed;
        left: ${rect.left + Math.random() * rect.width}px;
        top: ${rect.top + Math.random() * rect.height}px;
        width: 4px;
        height: 4px;
        background: #ffd700;
        border-radius: 50%;
        pointer-events: none;
        z-index: 10000;
    `;
    
    document.body.appendChild(sparkle);
    
    gsap.timeline()
        .to(sparkle, {
            y: -50 - Math.random() * 50,
            x: (Math.random() - 0.5) * 100,
            scale: 0,
            rotation: 360,
            duration: 1,
            ease: "power2.out"
        })
        .call(() => {
            document.body.removeChild(sparkle);
        });
}

// Enhanced scroll effects
function setupAdvancedScrollEffects() {
    // Parallax background movement
    gsap.to('.matrix-bg', {
        yPercent: -50,
        ease: "none",
        scrollTrigger: {
            trigger: '.timeline-container',
            start: "top bottom",
            end: "bottom top",
            scrub: true
        }
    });
    
    // Floating shapes react to scroll
    gsap.to('.floating-shape', {
        y: (i, target) => -50 - (i * 10),
        rotation: (i, target) => i * 45,
        ease: "none",
        scrollTrigger: {
            trigger: '.timeline-container',
            start: "top bottom",
            end: "bottom top",
            scrub: 1
        }
    });
}

// Initialize timeline when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    // Create global instance
    window.timelineController = new TimelineController();
    
    // Setup additional scroll effects
    setTimeout(() => {
        setupAdvancedScrollEffects();
    }, 1000);
    
    // Add some easter eggs
    let secretCode = [];
    const secret = ['t', 'i', 'm', 'e', 'l', 'i', 'n', 'e'];
    
    document.addEventListener('keydown', (e) => {
        secretCode.push(e.key.toLowerCase());
        if (secretCode.length > secret.length) {
            secretCode.shift();
        }
        
        if (secretCode.join('') === secret.join('')) {
            // Trigger timeline rainbow effect
            gsap.to('.timeline-line', {
                filter: 'hue-rotate(360deg)',
                duration: 2,
                repeat: 2,
                ease: "power2.inOut"
            });
            
            gsap.to('.experience-block', {
                filter: 'hue-rotate(360deg)',
                duration: 2,
                repeat: 2,
                stagger: 0.1,
                ease: "power2.inOut"
            });
            
            secretCode = [];
        }
    });
    
    // Add click counter for hidden features
    let clickCount = 0;
    document.querySelector('.page-title').addEventListener('click', () => {
        clickCount++;
        if (clickCount === 7) {
            // Activate party mode
            document.body.style.animation = 'rainbow-bg 3s ease-in-out infinite';
            setTimeout(() => {
                document.body.style.animation = '';
            }, 10000);
            clickCount = 0;
        }
    });
});

// Add rainbow background animation to CSS
const rainbowStyle = document.createElement('style');
rainbowStyle.textContent = `
    @keyframes rainbow-bg {
        0% { filter: hue-rotate(0deg); }
        25% { filter: hue-rotate(90deg); }
        50% { filter: hue-rotate(180deg); }
        75% { filter: hue-rotate(270deg); }
        100% { filter: hue-rotate(360deg); }
    }
    
    .skill-tag {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        margin: 0.25rem;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .skill-tag.engineering {
        background: linear-gradient(45deg, #00ffff, #0088ff);
        color: #000;
    }
    
    .skill-tag.research {
        background: linear-gradient(45deg, #ff00ff, #cc00ff);
        color: #fff;
    }
    
    .skill-tag.leadership {
        background: linear-gradient(45deg, #ff6600, #ff4400);
        color: #fff;
    }
    
    .skill-tag.communication {
        background: linear-gradient(45deg, #00ff00, #66ff00);
        color: #000;
    }
    
    .skill-tag.innovation {
        background: linear-gradient(45deg, #ffff00, #ffcc00);
        color: #000;
    }
    
    .panel-experience-header h4 {
        color: #00ffff;
        margin-bottom: 0.5rem;
        font-family: 'Orbitron', monospace;
    }
    
    .panel-company {
        color: #ff6600;
        font-style: italic;
        margin-bottom: 1rem;
    }
    
    .panel-skills h5 {
        color: #00ff00;
        margin-bottom: 0.75rem;
        font-family: 'Rajdhani', sans-serif;
        text-transform: uppercase;
    }
`;

document.head.appendChild(rainbowStyle); 