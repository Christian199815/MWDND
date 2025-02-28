async function getRandomPhoto() {
    const response = await fetch('https://api.unsplash.com/photos/random', {
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
    
    // Loop through each element
    for (const imgElement of imgElements) {
        const photoUrl = await getRandomPhoto();
        imgElement.src = photoUrl;
    }
}


document.addEventListener('DOMContentLoaded', function() {
    loadPhoto();
});