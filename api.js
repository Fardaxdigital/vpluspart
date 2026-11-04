const VPlusAPI = (() => {
  "use strict";

  const BASE_URL =
    "https://script.google.com/macros/s/AKfycbzqvdpRGNYw5uXeYfLggjdBGINxBvbVIssQkdlwbWUY8xBSVgyDH5r2_eKGfjqP5zFnzg/exec";

  async function request(url, options = {}) {
    let response;

    try {
      response = await fetch(url, options);
    } catch (error) {
      throw new Error("ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.");
    }

    let result;

    try {
      result = await response.json();
    } catch (error) {
      throw new Error("پاسخ سرور قابل خواندن نیست. انتشار Web App را بررسی کنید.");
    }

    if (!response.ok || result.success === false) {
      throw new Error(result.message || "درخواست با خطا مواجه شد.");
    }

    return result;
  }

  function get(action, params = {}) {
    const query = new URLSearchParams({
      action,
      ...params
    });

    return request(`${BASE_URL}?${query.toString()}`);
  }

  function post(action, data = {}) {
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

    productByCode(code) {
      return get("product", { code });
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

    loginUser(data) {
  let phone = String(data?.phone || "")
    .replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
    .replace(/\D/g, "");

  // حذف صفر ابتدایی شماره
  phone = phone.replace(/^0/, "");

  return post("loginUser", {
    ...data,
    phone
  });
},

    updateUserProfile(data) {
      return post("updateUserProfile", data);
    },

    getMyProfile(token) {
      return get("getMyProfile", { token });
    },

    myOrders(token) {
      return get("myOrders", { token });
    },

    createSupportTicket(data) {
      return post("createSupportTicket", data);
    }
  };
})();
