
const VPlusAPI = (() => {
  const BASE_URL =
    "https://script.google.com/macros/s/AKfycbzqvdpRGNYw5uXeYfLggjdBGINxBvbVIssQkdlwbWUY8xBSVgyDH5r2_eKGfjqP5zFnzg/exec";

  async function request(url, options = {}) {
    try {
      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "خطا در ارتباط با سرور");
      }

      return result;
    } catch (error) {
      console.error("VPLUS API Error:", error);
      throw error;
    }
  }

  async function get(action, params = {}) {
    const query = new URLSearchParams({
      action,
      ...params
    });

    return request(`${BASE_URL}?${query.toString()}`);
  }

  async function post(action, data = {}) {
    return request(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        action,
        ...data
      })
    });
  }

  return {
    get,
    post,

    health() {
      return get("health");
    },

    products(params = {}) {
      return get("products", params);
    },

    product(id) {
      return get("product", { id });
    },

    categories() {
      return get("categories");
    },

    brands() {
      return get("brands");
    },

    registerUser(data) {
      return post("registerUser", data);
    },

    createSupportTicket(data) {
      return post("createSupportTicket", data);
    }
  };
})();
