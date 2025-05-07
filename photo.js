async function getRandomPhoto(query = 'city') {
    const response = await fetch(`https://api.unsplash.com/photos/random?query=${query}`, {
        headers: {
            'Authorization': 'Client-ID 0iKCycNlQrsfeEECAZlLKm_MlKe8neNuzpSDWIsBI78'
        }
    });
    const data = await response.json();
    return data.urls.regular;
}

async function loadPhoto() {
    // Get all elements with class 'randomPhoto'
    const imgElements = document.querySelectorAll('.randomPhoto');
    
    // Define the topics we want to alternate between
    const topics = ['nature', 'city'];
    
    // Loop through each element
    for (let i = 0; i < imgElements.length; i++) {
        // Alternate between nature and city
        const topic = topics[i % topics.length];
        
        try {
            const photoUrl = await getRandomPhoto(topic);
            imgElements[i].src = photoUrl;
        } catch (error) {
            console.error(`Error loading ${topic} photo:`, error);
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadPhoto();
});