"use strict";

(() => {

const DEFAULT_PRODUCTS = [

  {
    id: "wireless-headphones",
    name: "Wireless Headphones",
    category: "Electronics",
    price: 28,
    badge: "Popular",
    image: "images/wireless-headphones.jpg",
    description:
      "Comfortable wireless headphones for everyday music, calls and entertainment.",
    affiliateLink:
      "https://www.amazon.com/?tag=hamzapicks04-20"
  },

  {
    id: "smart-watch",
    name: "Smart Watch",
    category: "Electronics",
    price: 499,
    badge: "Trending",
    image: "images/smart-watch.jpg",
    description:
      "A modern smart watch pick for fitness tracking, notifications and daily use.",
    affiliateLink:
      "https://www.amazon.com/?tag=hamzapicks04-20"
  },

  {
    id: "laptop-backpack",
    name: "Laptop Backpack",
    category: "Fashion",
    price: 34,
    badge: "Best Seller",
    image: "images/laptop-backpack.jpg",
    description:
      "A practical backpack for laptops, study, work and everyday travel.",
    affiliateLink:
      "https://www.amazon.com/?tag=hamzapicks04-20"
  },

  {
    id: "led-desk-lamp",
    name: "LED Desk Lamp",
    category: "Home",
    price: 39,
    badge: "Deal",
    image: "images/led-desk-lamp.jpg",
    description:
      "A useful desk lighting option for study, work and home office setups.",
    affiliateLink:
      "https://www.amazon.com/?tag=hamzapicks04-20"
  },

  {
    id: "fitness-resistance-bands",
    name: "Fitness Resistance Bands",
    category: "Sports",
    price: 29,
    badge: "Fitness",
    image: "images/fitness-resistance-bands.jpg",
    description:
      "Portable resistance bands for home workouts, stretching and strength training.",
    affiliateLink:
      "https://www.amazon.com/?tag=hamzapicks04-20"
  },

  {
    id: "beauty-care-set",
    name: "Beauty Care Set",
    category: "Beauty",
    price: 99,
    badge: "Featured",
    image: "images/beauty-care-set.jpg",
    description:
      "A convenient beauty care selection for an everyday self-care routine.",
    affiliateLink:
      "https://www.amazon.com/?tag=hamzapicks04-20"
  }

];

let products = [];
let wishlist =
  JSON.parse(localStorage.getItem("hamzaWishlist") || "[]");

let activeCategory = "All";
let searchTerm = "";

const $ = selector =>
  document.querySelector(selector);

function escapeHTML(value) {

  return String(value ?? "").replace(
    /[&<>"']/g,
    character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[character])
  );

}

function money(value) {

  return "$" +
    Number(value || 0)
      .toFixed(2)
      .replace(".00", "");

}

async function loadProducts() {

  try {

    const response =
      await fetch("/api/products", {
        headers: {
          Accept: "application/json"
        }
      });

    if (!response.ok) {
      throw new Error("API unavailable");
    }

    const data = await response.json();

    if (
      Array.isArray(data.products) &&
      data.products.length
    ) {
      return data.products;
    }

  } catch (error) {

    console.log("Using local fallback products.");

  }

  return DEFAULT_PRODUCTS;

}

function saveWishlist() {

  localStorage.setItem(
    "hamzaWishlist",
    JSON.stringify(wishlist)
  );

}

function productMatches(product) {

  const categoryMatch =
    activeCategory === "All" ||
    product.category === activeCategory;

  const query =
    searchTerm.toLowerCase().trim();

  const searchMatch =
    !query ||
    [
      product.name,
      product.category,
      product.description,
      product.badge
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);

  return categoryMatch && searchMatch;

}

function getFilteredProducts() {

  let list =
    products.filter(productMatches);

  const sort =
    $("#sortSelect").value;

  if (sort === "low") {

    list.sort(
      (a,b) =>
        Number(a.price) -
        Number(b.price)
    );

  }

  if (sort === "high") {

    list.sort(
      (a,b) =>
        Number(b.price) -
        Number(a.price)
    );

  }

  if (sort === "name") {

    list.sort(
      (a,b) =>
        a.name.localeCompare(b.name)
    );

  }

  return list;

}

function createProductCard(product) {

  const saved =
    wishlist.includes(product.id);

  return `

<article class="product-card">

  <div class="product-image-wrap">

    <span class="badge">
      ${escapeHTML(product.badge || "Featured")}
    </span>

    <button
      class="wish-btn"
      type="button"
      data-wish="${escapeHTML(product.id)}"
      aria-label="Save ${escapeHTML(product.name)}"
    >
      ${saved ? "♥" : "♡"}
    </button>

    <img
      class="product-image"
      loading="lazy"
      decoding="async"
      src="${escapeHTML(product.image)}"
      alt="${escapeHTML(product.name)}"
      onerror="this.onerror=null;this.src='images/logo.png'"
    >

  </div>

  <div class="product-body">

    <span class="product-cat">
      ${escapeHTML(product.category)}
    </span>

    <h3>
      ${escapeHTML(product.name)}
    </h3>

    <p>
      ${escapeHTML(product.description)}
    </p>

    <div class="product-bottom">

      <strong class="price">
        ${money(product.price)}
      </strong>

      <div class="card-actions">

        <button
          class="mini-btn"
          type="button"
          data-view="${escapeHTML(product.id)}"
        >
          View
        </button>

        <a
          class="mini-btn store"
          href="${escapeHTML(product.affiliateLink)}"
          target="_blank"
          rel="sponsored nofollow noopener noreferrer"
        >
          Visit Store
        </a>

      </div>

    </div>

  </div>

</article>

`;

}

function renderProducts() {

  const list =
    getFilteredProducts();

  $("#productGrid").innerHTML =
    list.map(createProductCard).join("");

  $("#resultsText").textContent =
    `${list.length} product${list.length === 1 ? "" : "s"} found`;

  $("#productStat").textContent =
    `${products.length}+`;

  $("#emptyState").hidden =
    list.length !== 0;

  renderWishlist();

  updateSchema();

}

function renderWishlist() {

  $("#wishlistCount").textContent =
    wishlist.length;

  const saved =
    products.filter(product =>
      wishlist.includes(product.id)
    );

  if (!saved.length) {

    $("#wishlistGrid").innerHTML = `

      <div class="empty-state">

        <div>♡</div>

        <h3>Your wishlist is empty</h3>

        <p>
          Save products you like and find them here later.
        </p>

      </div>

    `;

    return;

  }

  $("#wishlistGrid").innerHTML =
    saved.map(createProductCard).join("");

}

function toggleWishlist(id) {

  if (wishlist.includes(id)) {

    wishlist =
      wishlist.filter(item => item !== id);

    showToast("Removed from wishlist");

  } else {

    wishlist.push(id);

    showToast("Added to wishlist");

  }

  saveWishlist();

  renderProducts();

}

function openProduct(id) {

  const product =
    products.find(item => item.id === id);

  if (!product) return;

  $("#modalBody").innerHTML = `

    <div class="modal-product">

      <img
        src="${escapeHTML(product.image)}"
        alt="${escapeHTML(product.name)}"
        onerror="this.onerror=null;this.src='images/logo.png'"
      >

      <div>

        <span class="product-cat">
          ${escapeHTML(product.category)}
        </span>

        <h2>
          ${escapeHTML(product.name)}
        </h2>

        <p>
          ${escapeHTML(product.description)}
        </p>

        <div class="modal-price">
          ${money(product.price)}
        </div>

        <a
          class="btn primary"
          href="${escapeHTML(product.affiliateLink)}"
          target="_blank"
          rel="sponsored nofollow noopener noreferrer"
        >
          Visit Store →
        </a>

      </div>

    </div>

  `;

  $("#productModal").hidden = false;

  document.body.style.overflow =
    "hidden";

}

function closeModal() {

  $("#productModal").hidden = true;

  document.body.style.overflow = "";

}

let toastTimer;

function showToast(message) {

  const toast =
    $("#toast");

  toast.textContent =
    message;

  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer =
    setTimeout(
      () => toast.classList.remove("show"),
      2200
    );

}

function updateSchema() {

  const items =
    products.map(
      (product,index) => {

        const item = {
          "@type": "ListItem",
          "position": index + 1,
          "name": product.name,
          "description": product.description
        };

        if (product.image) {

          item.image =
            new URL(
              product.image,
              window.location.origin
            ).href;

        }

        return item;

      }
    );

  const schema = {

    "@context": "https://schema.org",

    "@graph": [

      {
        "@type": "WebSite",
        "@id":
          "https://hamza-affiliate-store.netlify.app/#website",
        "url":
          "https://hamza-affiliate-store.netlify.app/",
        "name": "Hamza Picks",
        "description":
          "Useful products, deals and recommendations."
      },

      {
        "@type": "WebPage",
        "@id":
          "https://hamza-affiliate-store.netlify.app/#webpage",
        "url":
          "https://hamza-affiliate-store.netlify.app/",
        "name":
          "Hamza Picks | Best Products & Deals",
        "description":
          "Discover useful products, deals and recommendations."
      },

      {
        "@type": "ItemList",
        "name": "Hamza Picks Products",
        "numberOfItems": products.length,
        "itemListElement": items
      }

    ]

  };

  $("#siteSchema").textContent =
    JSON.stringify(schema);

}

/* EVENTS */

document.addEventListener(
  "click",
  event => {

    const wish =
      event.target.closest("[data-wish]");

    if (wish) {

      toggleWishlist(
        wish.dataset.wish
      );

      return;

    }

    const view =
      event.target.closest("[data-view]");

    if (view) {

      openProduct(
        view.dataset.view
      );

    }

  }
);

document
  .querySelectorAll(".category")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(".category")
          .forEach(item =>
            item.classList.remove("active")
          );

        button.classList.add("active");

        activeCategory =
          button.dataset.category;

        renderProducts();

        $("#products")
          .scrollIntoView({
            behavior: "smooth"
          });

      }
    );

  });

$("#searchInput")
  .addEventListener(
    "input",
    event => {

      searchTerm =
        event.target.value;

      renderProducts();

    }
  );

$("#clearSearch")
  .addEventListener(
    "click",
    () => {

      $("#searchInput").value = "";

      searchTerm = "";

      renderProducts();

    }
  );

$("#sortSelect")
  .addEventListener(
    "change",
    renderProducts
  );

$("#resetBtn")
  .addEventListener(
    "click",
    () => {

      activeCategory = "All";

      searchTerm = "";

      $("#searchInput").value = "";

      document
        .querySelectorAll(".category")
        .forEach(item =>
          item.classList.toggle(
            "active",
            item.dataset.category === "All"
          )
        );

      renderProducts();

    }
  );

$("#wishlistNavBtn")
  .addEventListener(
    "click",
    () => {

      $("#wishlist")
        .removeAttribute("hidden");

      $("#wishlist")
        .scrollIntoView({
          behavior: "smooth"
        });

      renderWishlist();

    }
  );

$("#clearWishlist")
  .addEventListener(
    "click",
    () => {

      wishlist = [];

      saveWishlist();

      renderProducts();

      showToast("Wishlist cleared");

    }
  );

$("#closeModal")
  .addEventListener(
    "click",
    closeModal
  );

$("#productModal")
  .addEventListener(
    "click",
    event => {

      if (
        event.target.matches(
          "[data-close-modal]"
        )
      ) {

        closeModal();

      }

    }
  );

$("#themeBtn")
  .addEventListener(
    "click",
    () => {

      document.body.classList.toggle("light");

      localStorage.setItem(
        "hamzaTheme",
        document.body.classList.contains("light")
          ? "light"
          : "dark"
      );

    }
  );

$("#menuBtn")
  .addEventListener(
    "click",
    () => {

      $("#navMenu")
        .classList.toggle("open");

    }
  );

document
  .querySelectorAll("#navMenu a")
  .forEach(link => {

    link.addEventListener(
      "click",
      () =>
        $("#navMenu")
          .classList.remove("open")
    );

  });

$("#contactForm")
  .addEventListener(
    "submit",
    () => {

      showToast(
        "Message is being sent..."
      );

    }
  );

$("#year").textContent =
  new Date().getFullYear();

if (
  localStorage.getItem("hamzaTheme") ===
  "light"
) {

  document.body.classList.add("light");

}

/* START */

(async () => {

  products =
    await loadProducts();

  renderProducts();

  setTimeout(
    () =>
      $("#loader")
        .classList.add("hide"),
    250
  );

})();

})();