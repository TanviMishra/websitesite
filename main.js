// Store sites data globally for sorting
let allSites = [];
let currentSort = { column: null, direction: null };

async function loadSites() {
  const tbody = document.getElementById("sites-tbody");
  if (!tbody) return;

  try {
    const response = await fetch("sites.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load sites.json: ${response.status}`);
    }
    allSites = await response.json();
    renderSites(allSites);
    setupSorting();
  } catch (error) {
    console.error(error);
    tbody.innerHTML =
      '<tr><td colspan="9">Could not load site data. Check that <code>sites.json</code> is present.</td></tr>';
  }
}

function renderSites(sites) {
  const tbody = document.getElementById("sites-tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  sites
    .filter((site) => {
      const titleText = getTitleText(site);
      return titleText.length > 0;
    })
    .forEach((site) => {
      const tr = document.createElement("tr");

      tr.appendChild(createVersionCell(site.v1, "v.1"));
      tr.appendChild(createVersionCell(site.v2, "v.2"));
      tr.appendChild(createVersionCell(site.v3, "v.3"));

      const titleCell = document.createElement("td");
      const title = site.title;
      const titleText = getTitleText(site);

      if (title && typeof title === "object" && title.url) {
        const a = document.createElement("a");
        a.href = title.url;
        a.target = "_blank";
        a.rel = "noreferrer";
        a.textContent = titleText;
        titleCell.appendChild(a);
      } else {
        titleCell.textContent = titleText;
      }
      tr.appendChild(titleCell);

      const sourceCell = document.createElement("td");
      const source = site["source code"];
      if (source) {
        const a = document.createElement("a");
        a.href = source;
        a.target = "_blank";
        a.rel = "noreferrer";
        a.textContent = "[code]";
        sourceCell.appendChild(a);
      }
      tr.appendChild(sourceCell);

      const yearCell = document.createElement("td");
      yearCell.textContent = site.year || "";
      tr.appendChild(yearCell);

      const forCell = document.createElement("td");
      forCell.textContent = site.for || "";
      tr.appendChild(forCell);

      const functionCell = document.createElement("td");
      const fn = site.function;
      if (fn && typeof fn === "object") {
        if (fn.url) {
          const a = document.createElement("a");
          a.href = fn.url;
          a.target = "_blank";
          a.rel = "noreferrer";
          a.textContent = fn.name || "";
          functionCell.appendChild(a);
        } else {
          functionCell.textContent = fn.name || "";
        }
      } else {
        functionCell.textContent = fn || "";
      }
      tr.appendChild(functionCell);

      const descCell = document.createElement("td");
      descCell.textContent = site.description || "";
      tr.appendChild(descCell);

      tbody.appendChild(tr);
    });
}

function setupSorting() {
  const titleHeader = document.querySelector('.sites-table thead th:nth-child(4)'); // Title
  const yearHeader = document.querySelector('.sites-table thead th:nth-child(6)'); // Year
  const forHeader = document.querySelector('.sites-table thead th:nth-child(7)'); // For
  const functionHeader = document.querySelector('.sites-table thead th:nth-child(8)'); // Function

  if (titleHeader) {
    titleHeader.classList.add('sortable');
    titleHeader.title = 'Click to sort alphabetically';
    titleHeader.addEventListener('click', () => sortByTitle());
  }

  if (yearHeader) {
    yearHeader.classList.add('sortable');
    yearHeader.title = 'Click to sort by year';
    yearHeader.addEventListener('click', () => sortByYear());
  }

  if (forHeader) {
    forHeader.classList.add('sortable');
    forHeader.title = 'Click to sort: Me → Work → School';
    forHeader.addEventListener('click', () => sortByFor());
  }

  if (functionHeader) {
    functionHeader.classList.add('sortable');
    functionHeader.title = 'Click to group by function';
    functionHeader.addEventListener('click', () => sortByFunction());
  }
}

function sortByTitle() {
  const filtered = allSites.filter((site) => {
    const titleText = getTitleText(site);
    return titleText.length > 0;
  });

  if (currentSort.column === 'title' && currentSort.direction === 'asc') {
    currentSort.direction = 'desc';
    filtered.sort((a, b) => {
      const titleA = getTitleText(a).toLowerCase();
      const titleB = getTitleText(b).toLowerCase();
      return titleB.localeCompare(titleA);
    });
  } else {
    currentSort.column = 'title';
    currentSort.direction = 'asc';
    filtered.sort((a, b) => {
      const titleA = getTitleText(a).toLowerCase();
      const titleB = getTitleText(b).toLowerCase();
      return titleA.localeCompare(titleB);
    });
  }

  renderSites(filtered);
  updateSortIndicator('title');
}

function sortByYear() {
  const filtered = allSites.filter((site) => {
    const titleText = getTitleText(site);
    return titleText.length > 0;
  });

  if (currentSort.column === 'year' && currentSort.direction === 'asc') {
    currentSort.direction = 'desc';
    filtered.sort((a, b) => {
      return compareYears(b.year, a.year);
    });
  } else {
    currentSort.column = 'year';
    currentSort.direction = 'asc';
    filtered.sort((a, b) => {
      return compareYears(a.year, b.year);
    });
  }

  renderSites(filtered);
  updateSortIndicator('year');
}

function compareYears(yearA, yearB) {
  // Handle "Forever" - put it at the end
  if (yearA === 'Forever' && yearB === 'Forever') return 0;
  if (yearA === 'Forever') return 1;
  if (yearB === 'Forever') return -1;

  // Handle ranges like "2023-2024" - use the first year
  const extractYear = (year) => {
    if (!year) return 0;
    const match = year.match(/^(\d{4})/);
    return match ? parseInt(match[1], 10) : 0;
  };

  return extractYear(yearA) - extractYear(yearB);
}

function sortByFor() {
  const filtered = allSites.filter((site) => {
    const titleText = getTitleText(site);
    return titleText.length > 0;
  });

  const order = { 'me': 1, 'work': 2, 'school': 3 };
  
  if (currentSort.column === 'for' && currentSort.direction === 'asc') {
    currentSort.direction = 'desc';
    filtered.sort((a, b) => {
      const forA = (a.for || '').toLowerCase();
      const forB = (b.for || '').toLowerCase();
      const orderA = order[forA] || 999;
      const orderB = order[forB] || 999;
      return orderB - orderA;
    });
  } else {
    currentSort.column = 'for';
    currentSort.direction = 'asc';
    filtered.sort((a, b) => {
      const forA = (a.for || '').toLowerCase();
      const forB = (b.for || '').toLowerCase();
      const orderA = order[forA] || 999;
      const orderB = order[forB] || 999;
      return orderA - orderB;
    });
  }

  renderSites(filtered);
  updateSortIndicator('for');
}

function sortByFunction() {
  const filtered = allSites.filter((site) => {
    const titleText = getTitleText(site);
    return titleText.length > 0;
  });

  // Group by function name
  const getFunctionName = (site) => {
    const fn = site.function;
    if (!fn) return '';
    if (typeof fn === 'object') return (fn.name || '').toLowerCase();
    return (fn || '').toLowerCase();
  };

  if (currentSort.column === 'function' && currentSort.direction === 'asc') {
    currentSort.direction = 'desc';
    filtered.sort((a, b) => {
      const fnA = getFunctionName(a);
      const fnB = getFunctionName(b);
      if (fnA === fnB) {
        // Secondary sort by title if same function
        return getTitleText(b).toLowerCase().localeCompare(getTitleText(a).toLowerCase());
      }
      return fnB.localeCompare(fnA);
    });
  } else {
    currentSort.column = 'function';
    currentSort.direction = 'asc';
    filtered.sort((a, b) => {
      const fnA = getFunctionName(a);
      const fnB = getFunctionName(b);
      if (fnA === fnB) {
        // Secondary sort by title if same function
        return getTitleText(a).toLowerCase().localeCompare(getTitleText(b).toLowerCase());
      }
      return fnA.localeCompare(fnB);
    });
  }

  renderSites(filtered);
  updateSortIndicator('function');
}

function updateSortIndicator(column) {
  // Remove all sort indicators
  document.querySelectorAll('.sites-table thead th').forEach(th => {
    const text = th.textContent;
    th.textContent = text.replace(' ↑', '').replace(' ↓', '').trim();
  });

  // Add indicator to current column
  const headers = {
    'title': document.querySelector('.sites-table thead th:nth-child(4)'),
    'year': document.querySelector('.sites-table thead th:nth-child(6)'),
    'for': document.querySelector('.sites-table thead th:nth-child(7)'),
    'function': document.querySelector('.sites-table thead th:nth-child(8)')
  };

  const header = headers[column];
  if (header && currentSort.column === column) {
    const baseText = header.textContent.replace(' ↑', '').replace(' ↓', '').trim();
    const indicator = currentSort.direction === 'asc' ? ' ↑' : ' ↓';
    header.textContent = baseText + indicator;
  }
}

function createVersionCell(version, label) {
  const td = document.createElement("td");
  if (!version) return td;

  // If this version is an object with images, render the images as the content.
  if (typeof version === "object" && version !== null) {
    const images = Array.isArray(version.images) ? version.images : [];
    const hasImages = images.length > 0;
    const url = version.url || null;

    const containerTag = url ? "a" : "div";
    const container = document.createElement(containerTag);
    if (url) {
      container.href = url;
      container.target = "_blank";
      container.rel = "noreferrer";
    }
    container.className = "version-images";

    if (hasImages) {
      images.forEach((src, index) => {
        if (!src) return;
        const img = document.createElement("img");
        img.src = src;
        img.alt = `${label} screenshot ${index + 1}`;
        img.className = "version-image";
        img.style.cursor = "pointer";
        
        // Add click handler to open image popup and link
        img.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Open link in new tab if URL exists
          // if (url) {
          //   window.open(url, "_blank", "noopener,noreferrer");
          // }
          
          // Open image in popup window
          openImagePopup(src, 500, 500);
        });
        
        container.appendChild(img);
      });
    } else if (url) {
      // Fallback to a text link if there are no images.
      container.textContent = label;
    }

    td.appendChild(container);
    return td;
  }

  // Simple string URL fallback (no images).
  const url = typeof version === "string" ? version : null;
  if (!url) return td;

  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noreferrer";
  a.textContent = label;

  td.appendChild(a);
  return td;
}

function getTitleText(site) {
  const title = site.title;
  if (!title) return "";

  if (typeof title === "string") {
    return title.trim();
  }

  if (typeof title === "object") {
    return (title.name || "").trim();
  }

  return "";
}

function setLastUpdated() {
  const el = document.getElementById("last-updated");
  if (!el) return;

  // Use the document's last modified time so you don't have to update this manually.
  const lastModified = document.lastModified
    ? new Date(document.lastModified)
    : new Date();

  if (Number.isNaN(lastModified.getTime())) {
    el.textContent = "";
    return;
  }

  el.textContent = lastModified.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function openImagePopup(imageSrc, width = 500, height = 500) {
  // Calculate center position
  const left = (screen.width - width) / 2;
  const top = (screen.height - height) / 2;
  
  // Open popup window with image
  const popup = window.open(
    "",
    "",
    `scrollbars=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes`
  );
  
  if (!popup) {
    // If popup was blocked, fall back to opening in new tab
    window.open(imageSrc, "_blank", "noopener,noreferrer");
    return;
  }
  
  // Write HTML content to the popup window
  popup.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Image</title>
      <style>
        :root {
          --white: #fffdf6;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: var(--white);
          padding: 20px;
        }
        img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
      </style>
    </head>
    <body>
      <img src="${imageSrc}" alt="Image" />
    </body>
    </html>
  `);
  
  popup.document.close();
}

document.addEventListener("DOMContentLoaded", () => {
  loadSites();
  setLastUpdated();
});

