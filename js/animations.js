// Minimal animations file - only custom cursor
document.addEventListener('DOMContentLoaded', () => {
    // Set custom cursor
    document.body.style.cursor = 'url("./assets/orb.gif"), auto';
    
    // Apply cursor to all interactive elements
    const interactiveElements = document.querySelectorAll('button, a, [onclick], .choice-btn');
    interactiveElements.forEach(element => {
        element.style.cursor = 'url("./assets/orb.gif"), pointer';
    });
    
    console.log('Custom orb cursor applied');
}); 