"use strict";

(() => {

let token =
  sessionStorage.getItem(
    "hamzaAdminToken"
  ) || "";

let products = [];

const $ =
  selector =>
    document.querySelector(selector);

async function api(
  path,
  options = {}
) {

  const headers = {
    "Content-Type":
      "application/json",
    ...(options.headers || {})
  };

  if (token) {

    headers.Authorization =
      `Bearer ${token}`;

  }

  const response =
    await fetch(
      path,
      {
        ...options,
        headers
      }
    );

  const data =
    await response
      .json()
      .catch(() => ({}));

  if (!response.ok) {

    throw new Error(
      data.error ||
      "Request failed"
    );

  }

  return data;

}

async function login(password) {

  const data =
    await api(
      "/api/products",
      {
        method: "POST",
        body: JSON.stringify({
          action: "login",
          password
        })
      }
    );

  token =
    data.token;

  sessionStorage.setItem(
    "hamzaAdminToken",
    token
  );

  showPanel();

}

function showPanel() {

  $("#loginBox")
    .classList
    .add("hidden");

  $("#panel")
    .classList
    .remove("hidden");

  loadProducts();

}

async function loadProducts() {

  try {

    const data =
      await api(
        "/api/products"
      );

    products =
      data.products || [];

    renderProducts();

  } catch(error) {

    if (
      error.message ===
      "Unauthorized"
    ) {

      logout();

      return;

    }

    alert(error.message);

  }

}

function renderProducts() {

  $("#adminProducts")
    .innerHTML =

    products.map(
      product => `

<div class="admin-product">

  <div>

    <strong>
      ${escapeHTML(product.name)}
    </strong>

    <br>

    <small>
      ${escapeHTML(product.category)}
      · $${Number(product.price).toFixed(2)}
      · ${escapeHTML(product.badge || "")}
    </small>

  </div>

  <div class="admin-actions">

    <button
      class="mini-btn"
      data-edit="${escapeHTML(product.id)}"
    >
      Edit
    </button>

    <button
      class="mini-btn danger"
      data-delete="${escapeHTML(product.id)}"
    >
      Delete
    </button>

  </div>

</div>

`
    ).join("") ||

    "<p style='opacity:.6'>No products yet.</p>";

}

function escapeHTML(value) {

  return String(value ?? "")
    .replace(
      /[&<>"']/g,
      character => ({
        "&":"&amp;",
        "<":"&lt;",
        ">":"&gt;",
        '"':"&quot;",
        "'":"&#039;"
      }[character])
    );

}

function fillForm(product) {

  $("#productId").value =
    product.id || "";

  $("#name").value =
    product.name || "";

  $("#price").value =
    product.price || "";

  $("#category").value =
    product.category || "Home";

  $("#badge").value =
    product.badge || "";

  $("#image").value =
    product.image || "";

  $("#affiliateLink").value =
    product.affiliateLink || "";

  $("#description").value =
    product.description || "";

  $("#formTitle").textContent =
    "Edit Product";

  $("#saveBtn").textContent =
    "Save Changes";

  $("#cancelEdit")
    .classList
    .remove("hidden");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}

function resetForm() {

  $("#productForm").reset();

  $("#productId").value = "";

  $("#formTitle").textContent =
    "Add Product";

  $("#saveBtn").textContent =
    "＋ Add Product";

  $("#cancelEdit")
    .classList
    .add("hidden");

}

function logout() {

  sessionStorage.removeItem(
    "hamzaAdminToken"
  );

  token = "";

  $("#panel")
    .classList
    .add("hidden");

  $("#loginBox")
    .classList
    .remove("hidden");

}

$("#loginForm")
  .addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      $("#loginError")
        .textContent = "";

      try {

        await login(
          $("#password").value
        );

      } catch(error) {

        $("#loginError")
          .textContent =
          error.message;

      }

    }
  );

$("#productForm")
  .addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      const product = {

        id:
          $("#productId").value ||
          crypto.randomUUID(),

        name:
          $("#name").value.trim(),

        price:
          Number($("#price").value),

        category:
          $("#category").value,

        badge:
          $("#badge").value.trim() ||
          "Featured",

        image:
          $("#image").value.trim(),

        affiliateLink:
          $("#affiliateLink").value.trim(),

        description:
          $("#description")
            .value
            .trim()

      };

      try {

        await api(
          "/api/products",
          {
            method: "POST",
            body: JSON.stringify({
              action: "save",
              product
            })
          }
        );

        resetForm();

        await loadProducts();

        alert(
          "Product saved successfully."
        );

      } catch(error) {

        alert(
          error.message
        );

      }

    }
  );

$("#adminProducts")
  .addEventListener(
    "click",
    async event => {

      const edit =
        event.target.closest(
          "[data-edit]"
        );

      const remove =
        event.target.closest(
          "[data-delete]"
        );

      if (edit) {

        const product =
          products.find(
            item =>
              item.id ===
              edit.dataset.edit
          );

        if (product) {

          fillForm(product);

        }

      }

      if (remove) {

        const product =
          products.find(
            item =>
              item.id ===
              remove.dataset.delete
          );

        if (!product) return;

        const confirmed =
          confirm(
            `Delete "${product.name}"?`
          );

        if (!confirmed) return;

        try {

          await api(
            "/api/products",
            {
              method: "POST",
              body: JSON.stringify({
                action: "delete",
                id: product.id
              })
            }
          );

          await loadProducts();

          alert(
            "Product deleted."
          );

        } catch(error) {

          alert(
            error.message
          );

        }

      }

    }
  );

$("#cancelEdit")
  .addEventListener(
    "click",
    resetForm
  );

$("#refresh")
  .addEventListener(
    "click",
    loadProducts
  );

if (token) {

  showPanel();

}

})();