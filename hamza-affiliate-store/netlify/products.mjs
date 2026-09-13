import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";

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

function response(
  data,
  status = 200
) {

  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type":
          "application/json",
        "Cache-Control":
          "no-store"
      }
    }
  );

}

function getAdminPassword() {

  return process.env.ADMIN_PASSWORD || "";

}

function getSessionSecret() {

  return (
    process.env.SESSION_SECRET ||
    getAdminPassword()
  );

}

function createToken() {

  const payload =
    Buffer.from(
      JSON.stringify({
        exp:
          Date.now() +
          1000 * 60 * 60 * 12
      })
    ).toString("base64url");

  const signature =
    crypto
      .createHmac(
        "sha256",
        getSessionSecret()
      )
      .update(payload)
      .digest("base64url");

  return `${payload}.${signature}`;

}

function validToken(request) {

  const authorization =
    request.headers.get(
      "authorization"
    ) || "";

  if (
    !authorization.startsWith(
      "Bearer "
    )
  ) {

    return false;

  }

  const token =
    authorization.slice(7);

  const parts =
    token.split(".");

  if (parts.length !== 2) {
    return false;
  }

  const [
    payload,
    signature
  ] = parts;

  const expected =
    crypto
      .createHmac(
        "sha256",
        getSessionSecret()
      )
      .update(payload)
      .digest("base64url");

  if (
    signature.length !==
    expected.length
  ) {

    return false;

  }

  if (
    !crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    )
  ) {

    return false;

  }

  try {

    const data =
      JSON.parse(
        Buffer.from(
          payload,
          "base64url"
        ).toString()
      );

    return data.exp > Date.now();

  } catch {

    return false;

  }

}

function cleanProduct(product) {

  return {

    id:
      String(
        product.id ||
        crypto.randomUUID()
      ).slice(0,100),

    name:
      String(
        product.name || ""
      )
      .trim()
      .slice(0,150),

    category:
      String(
        product.category ||
        "Home"
      )
      .trim()
      .slice(0,50),

    price:
      Math.max(
        0,
        Number(product.price) || 0
      ),

    badge:
      String(
        product.badge ||
        "Featured"
      )
      .trim()
      .slice(0,50),

    image:
      String(
        product.image || ""
      )
      .trim()
      .slice(0,1000),

    affiliateLink:
      String(
        product.affiliateLink ||
        ""
      )
      .trim()
      .slice(0,2000),

    description:
      String(
        product.description ||
        ""
      )
      .trim()
      .slice(0,500)

  };

}

async function getProducts() {

  const store =
    getStore(
      "hamza-picks"
    );

  const saved =
    await store.get(
      "products.json",
      {
        type: "json"
      }
    );

  if (
    Array.isArray(saved) &&
    saved.length
  ) {

    return saved;

  }

  return DEFAULT_PRODUCTS;

}

async function saveProducts(
  products
) {

  const store =
    getStore(
      "hamza-picks"
    );

  await store.set(
    "products.json",
    JSON.stringify(products)
  );

}

export default async function handler(
  request
) {

  if (
    request.method ===
    "GET"
  ) {

    return response({
      products:
        await getProducts()
    });

  }

  if (
    request.method !==
    "POST"
  ) {

    return response(
      {
        error:
          "Method not allowed"
      },
      405
    );

  }

  let body;

  try {

    body =
      await request.json();

  } catch {

    return response(
      {
        error:
          "Invalid JSON"
      },
      400
    );

  }

  /* LOGIN */

  if (
    body.action ===
    "login"
  ) {

    if (!getAdminPassword()) {

      return response(
        {
          error:
            "ADMIN_PASSWORD is not configured in Netlify."
        },
        500
      );

    }

    if (
      typeof body.password !==
        "string" ||
      body.password !==
        getAdminPassword()
    ) {

      return response(
        {
          error:
            "Wrong password."
        },
        401
      );

    }

    return response({
      token:
        createToken()
    });

  }

  /* SECURITY */

  if (!validToken(request)) {

    return response(
      {
        error:
          "Unauthorized"
      },
      401
    );

  }

  const products =
    await getProducts();

  /* SAVE */

  if (
    body.action ===
    "save"
  ) {

    const product =
      cleanProduct(
        body.product
      );

    if (
      !product.name ||
      !product.image ||
      !product.affiliateLink ||
      !product.description
    ) {

      return response(
        {
          error:
            "Name, image, affiliate link and description are required."
        },
        400
      );

    }

    const index =
      products.findIndex(
        item =>
          item.id ===
          product.id
      );

    if (index >= 0) {

      products[index] =
        product;

    } else {

      products.push(
        product
      );

    }

    await saveProducts(
      products
    );

    return response({
      products
    });

  }

  /* DELETE */

  if (
    body.action ===
    "delete"
  ) {

    const next =
      products.filter(
        product =>
          product.id !==
          String(body.id)
      );

    if (
      next.length ===
      products.length
    ) {

      return response(
        {
          error:
            "Product not found."
        },
        404
      );

    }

    await saveProducts(
      next
    );

    return response({
      products: next
    });

  }

  return response(
    {
      error:
        "Unknown action."
    },
    400
  );

}

export const config = {
  path: "/api/products"
};