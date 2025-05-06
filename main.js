document.addEventListener('DOMContentLoaded', function () {
  // DOM elements
  const listContainer = document.querySelector('.wn-list');
  const filterButtons = document.querySelectorAll('.control-button[data-filter]');
  const toggleButtons = document.querySelectorAll('.toggle-button');

  // Current state
  let currentSort = { type: 'date', direction: 'desc' }; // Unified sort state
  let currentFilter = 'all';
  let items = []; // Will hold our data

  // Initialize date toggle as active and descending (newest first)
  const dateToggle = document.querySelector('[data-toggle="date"]');
  if (dateToggle) {
    dateToggle.classList.add('active', 'desc');
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
      const emptyState = document.createElement('div');
      emptyState.classList.add('empty-state');
      emptyState.innerHTML = `
        <h3>No items found</h3>
        <p>Try changing your filter settings</p>
      `;
      listContainer.appendChild(emptyState);
      return;
    }

    // Add items to the list
    sortedItems.forEach((item, index) => {
      const li = document.createElement('li');
      li.style.animationDelay = `${index * 0.05}s`;

      li.innerHTML = `
        <button popovertarget="${item.id}">
          <div>
            <h4>"${item.title}" by <strong>${Array.isArray(item.speaker) ? item.speaker.join(', ') : item.speaker}</strong></h4>
            <p>${item.type}</p>
          </div>
          <h3>${item.date}</h3>
        </button>
        <div popover id="${item.id}">
          ${renderPopoverContent(item)}
        </div>
      `;

      listContainer.appendChild(li);
    });

    // Update container height
    updateContainerHeight();
  }

  // Unified renderPopoverContent function (keep only this one)
  function renderPopoverContent(item) {
    let popoverContent = `
      <div class="bento-container">
        <div class="bento-header">
          <h2>${item.title}</h2>
          <h3>${Array.isArray(item.speaker) ? item.speaker.join(', ') : item.speaker}</h3>
        </div>
        <div class="bento-meta">
          <p>${item.type}</p>
          <p>${item.date}</p>
        </div>
        <div class="bento-content">
          <p>${item.content.summary}</p>
    `;

    // Add introduction if it exists (for multi-speaker events)
    if (item.content.introduction) {
      popoverContent += `<p>${item.content.introduction}</p>`;
    }

    // For items with standard sections format (most entries)
    if (item.content.sections) {
      // Check if this is a bento grid layout (with 'span' property)
      const hasBentoGrid = item.content.sections.some(section => 'span' in section);

      if (hasBentoGrid) {
        // For bento grid layout (Nils Binder, Julia Miocene, etc.)
        popoverContent += `<div class="bento-grid">`;

        item.content.sections.forEach(section => {
          popoverContent += `
            <div class="bento-box ${section.span === 2 ? 'span-2' : ''}">
              <h4>${section.title}</h4>
              <p>${section.description}</p>
            </div>
          `;
        });

        popoverContent += `</div>`;
      } else {
        // For sections with lists (PP Koch)
        item.content.sections.forEach(section => {
          popoverContent += `
            <div class="highlight">
              <p>${section.title}</p>
            </div>
          `;

          if (section.items && section.items.length > 0) {
            popoverContent += `<ul>`;
            section.items.forEach(item => {
              popoverContent += `
                <li><strong>${item.title}:</strong> ${item.description}</li>
              `;
            });
            popoverContent += `</ul>`;
          } else {
            popoverContent += `<p>${section.description || ''}</p>`;
          }
        });
      }
    }

    // For items with features (Cassie Evans, Kilian Valkhof)
    if (item.content.features) {
      if (item.id === "CE-WN") {
        // Cassie Evans with feature grid
        popoverContent += `
          <div class="highlight">
            <p>Key GSAP features highlighted in the presentation:</p>
          </div>
          <div class="feature-grid">
        `;

        item.content.features.forEach(feature => {
          popoverContent += `
            <div class="feature-card">
              <h4>${feature.title}</h4>
              <p>${feature.description}</p>
            </div>
          `;
        });

        popoverContent += `</div>`;
      } else {
        // Kilian Valkhof format with list
        popoverContent += `
          <div class="highlight">
            <p>${item.content.highlights[0]}</p>
          </div>
          <ul>
        `;

        item.content.features.forEach(feature => {
          popoverContent += `
            <li><strong>${feature.title}:</strong> ${feature.description}</li>
          `;
        });

        popoverContent += `</ul>`;
      }
    }

    // For multi-speaker events like IDEA11Y
    if (item.content.speakers) {
      popoverContent += `<div class="speakers-section">`;

      item.content.speakers.forEach(speaker => {
        popoverContent += `
          <div class="speaker-card">
            <h3>${speaker.name}</h3>
            <h4>${speaker.title}</h4>
            ${speaker.role ? `<p class="speaker-role">${speaker.role}</p>` : ''}
        `;

        // If speaker has topics
        if (speaker.topics && speaker.topics.length > 0) {
          popoverContent += `<div class="topic-list">`;

          speaker.topics.forEach(topic => {
            popoverContent += `
              <div class="topic-item">
                <h5>${topic.title}</h5>
                <p>${topic.details}</p>
              </div>
            `;
          });

          popoverContent += `</div>`;
        } else if (speaker.details) {
          // If speaker has simple details
          popoverContent += `<p>${speaker.details}</p>`;
        }

        popoverContent += `</div>`;
      });

      popoverContent += `</div>`;
    }

    // For items with resource lists (Jeremy Keith)
    if (item.content.resources) {
      popoverContent += `
        <div class="highlight">
          <p>Resources:</p>
        </div>
        <ul class="resources-list">
      `;

      item.content.resources.forEach(resource => {
        popoverContent += `<li>${resource}</li>`;
      });

      popoverContent += `</ul>`;
    }

    // For items with takeaways (IDEA11Y)
    if (item.content.takeaways) {
      popoverContent += `
        <div class="highlight">
          <p>Key Takeaways:</p>
        </div>
        <ul class="takeaways-list">
      `;

      item.content.takeaways.forEach(takeaway => {
        popoverContent += `<li>${takeaway}</li>`;
      });

      popoverContent += `</ul>`;
    }

    // Add any additional content
    if (item.content.challenges) {
      popoverContent += `<p>${item.content.challenges}</p>`;
    }

    if (item.content.conclusion) {
      popoverContent += `
        <div class="conclusion">
          <p><strong>Conclusion:</strong> ${item.content.conclusion}</p>
        </div>
      `;
    }

    popoverContent += `
        </div>
      </div>
    `;

    return popoverContent;
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
    // Show loading state
    listContainer.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading speakers...</p>
      </div>
    `;

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
        listContainer.innerHTML = `
          <div class="empty-state">
            <h3>Error loading data</h3>
            <p>Please check your network connection and try again.</p>
            <button id="retry-button" class="control-button">Retry</button>
          </div>
        `;

        // Add retry button event listener
        document.getElementById('retry-button').addEventListener('click', loadData);
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