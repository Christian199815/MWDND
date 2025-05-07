document.addEventListener('DOMContentLoaded', function () {
  // DOM elements
  const listContainer = getElement('.wn-list');
  const filterButtons = document.querySelectorAll('.control-button[data-filter]');
  const toggleButtons = document.querySelectorAll('.toggle-button');
  
  // Templates
  const loadingTemplate = getElement('#loading-template');
  const emptyTemplate = getElement('#empty-template');
  const errorTemplate = getElement('#error-template');
  const listItemTemplate = getElement('#list-item-template');
  const popoverTemplate = getElement('#popover-template');

  // Current state
  let currentSort = { type: 'date', direction: 'desc' }; // Unified sort state
  let currentFilter = 'all';
  let items = []; // Will hold our data

  // Initialize date toggle as active and descending (newest first)
  const dateToggle = getElement('[data-toggle="date"]');
  if (dateToggle) {
    dateToggle.classList.add('active', 'desc');
  }

  function getElement(selector) {
    const element = document.querySelector(selector);
    if (!element) console.warn(`Element with selector "${selector}" not found`);
    return element;
}

  // Event listeners for toggle buttons
  toggleButtons.forEach(button => {
    button.addEventListener('click', () => {
      const toggleType = button.dataset.toggle;

      // If clicking on the already active toggle
      if (currentSort.type === toggleType) {
        // Cycle through states: asc -> desc -> none (random) -> asc
        if (button.classList.contains('asc')) {
          // Currently asc, make it desc
          button.classList.remove('asc');
          button.classList.add('desc');
          currentSort = { type: toggleType, direction: 'desc' };
        } else if (button.classList.contains('desc')) {
          // Currently desc, deactivate it and randomize
          button.classList.remove('active', 'desc');
          randomizeAndRender(); // This will reset currentSort and render random
          return; // Skip the renderList call at the end as randomizeAndRender already calls it
        } else {
          // Currently inactive, make it asc
          button.classList.add('active', 'asc');
          currentSort = { type: toggleType, direction: 'asc' };
        }
      } else {
        // Clicking on a different toggle, reset all and set this one to asc
        toggleButtons.forEach(btn => btn.classList.remove('active', 'asc', 'desc'));
        button.classList.add('active', 'asc');
        currentSort = { type: toggleType, direction: 'asc' };
      }

      // After updating sort state
      renderList();
    });
  });

  // Event listeners for filter buttons
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Update active state
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // Update current filter and re-render
      currentFilter = button.dataset.filter;
      renderList();
    });
  });

  // Function to render the list
  function renderList() {
    // Clear the list
    listContainer.innerHTML = '';

    // Filter items
    let filteredItems = items;
    if (currentFilter !== 'all') {
      const filterValue = currentFilter === 'weekly-nerd' ? 'Weekly Nerd' : 'Guest Teacher';
      filteredItems = items.filter(item => item.type === filterValue);
    }

    // Sort items
    let sortedItems;

    if (!currentSort.type) {
      // If no sort is active, shuffle the items randomly
      sortedItems = [...filteredItems].sort(() => Math.random() - 0.5);
    } else {
      // Otherwise, use the selected sort method
      sortedItems = [...filteredItems].sort((a, b) => {
        if (currentSort.type === 'date') {
          return currentSort.direction === 'asc'
            ? new Date(a.dateObj) - new Date(b.dateObj)
            : new Date(b.dateObj) - new Date(a.dateObj);
        } else if (currentSort.type === 'alpha') {
          return currentSort.direction === 'asc'
            ? a.speaker.localeCompare(b.speaker)
            : b.speaker.localeCompare(a.speaker);
        }
        return 0;
      });
    }

    // Check if there are no items after filtering
    if (sortedItems.length === 0) {
      const emptyNode = emptyTemplate.content.cloneNode(true);
      listContainer.appendChild(emptyNode);
      return;
    }

    // Add items to the list
    sortedItems.forEach((item, index) => {
      const itemNode = listItemTemplate.content.cloneNode(true);
      const li = itemNode.querySelector('li');
      
      // Set animation delay
      li.style.animationDelay = `${index * 0.05}s`;
      
      // Configure item content
      const button = li.querySelector('button');
      button.setAttribute('popovertarget', item.id);
      
      // Set title and speaker
      const h4 = button.querySelector('h4');
      h4.textContent = `"${item.title}" by `;
      const strong = document.createElement('strong');
      strong.textContent = Array.isArray(item.speaker) ? item.speaker.join(', ') : item.speaker;
      h4.appendChild(strong);
      
      // Set type and date
      button.querySelector('div p').textContent = item.type;
      button.querySelector('h3').textContent = item.date;
      
      // Configure popover
      const popover = li.querySelector('[popover]');
      popover.id = item.id;
      
      // Add popover content
      createPopoverContent(popover, item);
      
      // Add to container
      listContainer.appendChild(itemNode);
    });

    // Update container height
    updateContainerHeight();
  }

  // Function to create popover content
  function createPopoverContent(popoverElement, item) {
    // Clone the basic template
    const popoverContent = popoverTemplate.content.cloneNode(true);
    
    // Set basic info
    popoverContent.querySelector('.bento-header h2').textContent = item.title;
    popoverContent.querySelector('.bento-header h3').textContent = 
      Array.isArray(item.speaker) ? item.speaker.join(', ') : item.speaker;
    const metaP = popoverContent.querySelectorAll('.bento-meta p');
    metaP[0].textContent = item.type;
    metaP[1].textContent = item.date;
    popoverContent.querySelector('.bento-content p').textContent = item.content.summary;
    
    // Create container for additional content
    const contentContainer = popoverContent.querySelector('.bento-content');
    
    // Add introduction if it exists (for multi-speaker events)
    if (item.content.introduction) {
      const introP = document.createElement('p');
      introP.textContent = item.content.introduction;
      contentContainer.appendChild(introP);
    }

    // For items with standard sections format (most entries)
    if (item.content.sections) {
      // Check if this is a bento grid layout (with 'span' property)
      const hasBentoGrid = item.content.sections.some(section => 'span' in section);

      if (hasBentoGrid) {
        // For bento grid layout (Nils Binder, Julia Miocene, etc.)
        const bentoGrid = document.createElement('div');
        bentoGrid.className = 'bento-grid';

        item.content.sections.forEach(section => {
          const bentoBox = document.createElement('div');
          bentoBox.className = 'bento-box';
          if (section.span === 2) {
            bentoBox.classList.add('span-2');
          }

          const h4 = document.createElement('h4');
          h4.textContent = section.title;
          bentoBox.appendChild(h4);

          const p = document.createElement('p');
          p.textContent = section.description;
          bentoBox.appendChild(p);

          bentoGrid.appendChild(bentoBox);
        });

        contentContainer.appendChild(bentoGrid);
      } else {
        // For sections with lists (PP Koch)
        item.content.sections.forEach(section => {
          const highlight = document.createElement('div');
          highlight.className = 'highlight';
          const p = document.createElement('p');
          p.textContent = section.title;
          highlight.appendChild(p);
          contentContainer.appendChild(highlight);

          if (section.items && section.items.length > 0) {
            const ul = document.createElement('ul');
            
            section.items.forEach(item => {
              const li = document.createElement('li');
              const strong = document.createElement('strong');
              strong.textContent = `${item.title}: `;
              li.appendChild(strong);
              li.appendChild(document.createTextNode(item.description));
              ul.appendChild(li);
            });
            
            contentContainer.appendChild(ul);
          } else {
            const sectionP = document.createElement('p');
            sectionP.textContent = section.description || '';
            contentContainer.appendChild(sectionP);
          }
        });
      }
    }

    // For items with features (Cassie Evans, Kilian Valkhof)
    if (item.content.features) {
      if (item.id === "CE-WN") {
        // Cassie Evans with feature grid
        const highlight = document.createElement('div');
        highlight.className = 'highlight';
        const p = document.createElement('p');
        p.textContent = 'Key GSAP features highlighted in the presentation:';
        highlight.appendChild(p);
        contentContainer.appendChild(highlight);

        const featureGrid = document.createElement('div');
        featureGrid.className = 'feature-grid';

        item.content.features.forEach(feature => {
          const featureCard = document.createElement('div');
          featureCard.className = 'feature-card';
          
          const h4 = document.createElement('h4');
          h4.textContent = feature.title;
          featureCard.appendChild(h4);
          
          const featureP = document.createElement('p');
          featureP.textContent = feature.description;
          featureCard.appendChild(featureP);
          
          featureGrid.appendChild(featureCard);
        });

        contentContainer.appendChild(featureGrid);
      } else {
        // Kilian Valkhof format with list
        const highlight = document.createElement('div');
        highlight.className = 'highlight';
        const p = document.createElement('p');
        p.textContent = item.content.highlights[0];
        highlight.appendChild(p);
        contentContainer.appendChild(highlight);

        const ul = document.createElement('ul');
        
        item.content.features.forEach(feature => {
          const li = document.createElement('li');
          const strong = document.createElement('strong');
          strong.textContent = `${feature.title}: `;
          li.appendChild(strong);
          li.appendChild(document.createTextNode(feature.description));
          ul.appendChild(li);
        });
        
        contentContainer.appendChild(ul);
      }
    }

    // For multi-speaker events like IDEA11Y
    if (item.content.speakers) {
      const speakersSection = document.createElement('div');
      speakersSection.className = 'speakers-section';

      item.content.speakers.forEach(speaker => {
        const speakerCard = document.createElement('div');
        speakerCard.className = 'speaker-card';
        
        const h3 = document.createElement('h3');
        h3.textContent = speaker.name;
        speakerCard.appendChild(h3);
        
        const h4 = document.createElement('h4');
        h4.textContent = speaker.title;
        speakerCard.appendChild(h4);
        
        if (speaker.role) {
          const roleP = document.createElement('p');
          roleP.className = 'speaker-role';
          roleP.textContent = speaker.role;
          speakerCard.appendChild(roleP);
        }

        // If speaker has topics
        if (speaker.topics && speaker.topics.length > 0) {
          const topicList = document.createElement('div');
          topicList.className = 'topic-list';

          speaker.topics.forEach(topic => {
            const topicItem = document.createElement('div');
            topicItem.className = 'topic-item';
            
            const h5 = document.createElement('h5');
            h5.textContent = topic.title;
            topicItem.appendChild(h5);
            
            const topicP = document.createElement('p');
            topicP.textContent = topic.details;
            topicItem.appendChild(topicP);
            
            topicList.appendChild(topicItem);
          });

          speakerCard.appendChild(topicList);
        } else if (speaker.details) {
          // If speaker has simple details
          const detailsP = document.createElement('p');
          detailsP.textContent = speaker.details;
          speakerCard.appendChild(detailsP);
        }

        speakersSection.appendChild(speakerCard);
      });

      contentContainer.appendChild(speakersSection);
    }

    // For items with resource lists (Jeremy Keith)
    if (item.content.resources) {
      const highlight = document.createElement('div');
      highlight.className = 'highlight';
      const p = document.createElement('p');
      p.textContent = 'Resources:';
      highlight.appendChild(p);
      contentContainer.appendChild(highlight);

      const ul = document.createElement('ul');
      ul.className = 'resources-list';
      
      item.content.resources.forEach(resource => {
        const li = document.createElement('li');
        li.textContent = resource;
        ul.appendChild(li);
      });
      
      contentContainer.appendChild(ul);
    }

    // For items with takeaways (IDEA11Y)
    if (item.content.takeaways) {
      const highlight = document.createElement('div');
      highlight.className = 'highlight';
      const p = document.createElement('p');
      p.textContent = 'Key Takeaways:';
      highlight.appendChild(p);
      contentContainer.appendChild(highlight);

      const ul = document.createElement('ul');
      ul.className = 'takeaways-list';
      
      item.content.takeaways.forEach(takeaway => {
        const li = document.createElement('li');
        li.textContent = takeaway;
        ul.appendChild(li);
      });
      
      contentContainer.appendChild(ul);
    }

    // Add any additional content
    if (item.content.challenges) {
      const challengesP = document.createElement('p');
      challengesP.textContent = item.content.challenges;
      contentContainer.appendChild(challengesP);
    }

    if (item.content.conclusion) {
      const conclusion = document.createElement('div');
      conclusion.className = 'conclusion';
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = 'Conclusion: ';
      p.appendChild(strong);
      p.appendChild(document.createTextNode(item.content.conclusion));
      conclusion.appendChild(p);
      contentContainer.appendChild(conclusion);
    }

    // Append the complete popover content
    popoverElement.appendChild(popoverContent);
  }

  // Function to update container height
  function updateContainerHeight() {
    document.getElementById('WN').style.height = 'auto';
  }

  // Function to handle toggle for "More of Me"
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
      }, 1000); // 1 second delay
    }
  }

  // Load data from JSON file
  function loadData() {
    // Show loading state using template
    listContainer.innerHTML = '';
    const loadingNode = loadingTemplate.content.cloneNode(true);
    listContainer.appendChild(loadingNode);

    // Fetch the JSON file
    fetch('weekly-nerd-data.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        // Store the data
        items = data;

        // First render: random order
        randomizeAndRender();
      })
      .catch(error => {
        console.error('Error loading data:', error);
        
        // Show error template
        listContainer.innerHTML = '';
        const errorNode = errorTemplate.content.cloneNode(true);
        listContainer.appendChild(errorNode);

        // Add retry button event listener
        const retryButton = getElement('#retry-button');
        if (retryButton) {
          retryButton.addEventListener('click', loadData);
        }
      });
  }

  function randomizeAndRender() {
    // Set current sort to null (no sorting)
    currentSort = { type: null, direction: null };

    // Reset all toggle buttons
    toggleButtons.forEach(btn => btn.classList.remove('active', 'asc', 'desc'));

    // Render the list (which will now be in random order since sorting is disabled)
    renderList();
  }

  // Make handleToggle available globally
  window.handleToggle = handleToggle;

  // Initial data load
  loadData();
});