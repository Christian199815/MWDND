// wrapper.js
const items = [
    "VS Code",
    "HTML",
    "CCS",
    "JavaScript",
    "Wordpress",
    "Prepr",
    "Figma",
    "Node.js"
];

function createItems() {
    const wrapper = document.querySelector('.wrapper');
    const itemCount = items.length;
    const itemWidth = 200; // matches CSS width
    const gapWidth = 20; // gap between items
    const totalWidth = (itemWidth + gapWidth) * itemCount;
    
    // Create two containers for seamless loop
    const track = document.createElement('div');
    track.style.display = 'flex';
    track.style.gap = `${gapWidth}px`;
    track.style.width = `${totalWidth * 2}px`; // Double width to hold two sets
    track.style.position = 'absolute';
    track.style.left = '0';
    track.style.animation = `scrollLeft ${itemCount * 3}s linear infinite`;
    
    // Create two sets of items for seamless loop
    for (let j = 0; j < 2; j++) {
        items.forEach((text, index) => {
            const item = document.createElement('div');
            item.className = 'item';
            item.textContent = text;
            item.style.position = 'relative';
            track.appendChild(item);
        });
    }
    
    wrapper.appendChild(track);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', createItems);