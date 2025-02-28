document.addEventListener('DOMContentLoaded', function() {
    const itemCount = document.querySelectorAll('#weeks ul li').length;
    console.log(itemCount);
    document.documentElement.style.setProperty('--item-count', (itemCount * 9) + 14 + 'em');
});



function handleToggle(checkbox) {
    if (checkbox.checked) {
        // Add loading class for animation
        checkbox.classList.add('loading');
        
        // Set delay before opening link
        setTimeout(() => {
            window.open('https://chrisdonker.nl/', '_blank');
            
            // Reset the toggle
            checkbox.checked = false;
            checkbox.classList.remove('loading');
        }, 1000); // 2 second delay
    }
}