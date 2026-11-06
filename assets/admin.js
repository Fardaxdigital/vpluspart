document.addEventListener("DOMContentLoaded", () => {
  const login = document.querySelector("#adminLogin");
  const app = document.querySelector("#adminApp");
  const view = document.querySelector("#adminView");
  let adminToken = localStorage.getItem("vplus_admin_token") || "";

  async function call(action, payload = {}) {
    if (adminToken) localStorage.setItem("vplus_token", adminToken);
    const result = await VP.api(action, payload);
    if (result.adminToken) {
      adminToken = result.adminToken;
      localStorage.setItem("vplus_admin_token", adminToken);
      localStorage.setItem("vplus_token", adminToken);
    }
    return result;
  }

  document.querySelector("#adminLoginForm").onsubmit = async event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    try {
      await call("adminLogin", data);
      login.hidden = true;
      app.hidden = false;
      load("products");
    } catch (error) { VP.toast(error.message); }
  };

  document.querySelectorAll("[data-view]").forEach(button => {
    button.onclick = () => {
      document.querySelectorAll("[data-view]").forEach(item => item.classList.toggle("active", item === button));
      load(button.dataset.view);
    };
  });

  document.querySelector("#adminLogout").onclick = () => {
    localStorage.removeItem("vplus_admin_token");
    localStorage.removeItem("vplus_token");
    location.reload();
  };

  async function load(type) {
    view.innerHTML = "در حال دریافت اطلاعات...";
    try {
      const result = await call("adminList", { type });
      if (type === "products") {
        view.innerHTML = `<div class="panel-head"><h2>مدیریت محصولات</h2><button id="newProduct" class="btn btn-orange">افزودن محصول</button></div><div id="editArea"></div><div class="table-wrap"><table><thead><tr><th>نام</th><th>کد</th><th>قیمت</th><th>موجودی</th><th>عملیات</th></tr></thead><tbody>${(result.items || []).map(p => `<tr><td>${VP.esc(p.Name)}</td><td>${VP.esc(p.ProductCode)}</td><td>${VP.fa(p.Price)}</td><td>${VP.fa(p.Stock)}</td><td><button data-edit="${VP.esc(p.ProductID)}">ویرایش</button> <button data-del="${VP.esc(p.ProductID)}">حذف</button></td></tr>`).join("")}</tbody></table></div>`;
        document.querySelector("#newProduct").onclick = () => productForm();
        view.querySelectorAll("[data-edit]").forEach(button => button.onclick = () => productForm((result.items || []).find(x => x.ProductID === button.dataset.edit)));
        view.querySelectorAll("[data-del]").forEach(button => button.onclick = async () => {
          if (confirm("محصول حذف شود؟")) { await call("adminDeleteProduct", { productId: button.dataset.del }); load("products"); }
        });
      } else if (type === "orders") {
        view.innerHTML = `<h2>سفارش‌ها</h2><div class="table-wrap"><table><tr><th>شماره</th><th>مشتری</th><th>مبلغ</th><th>وضعیت فعلی</th><th>تغییر وضعیت</th></tr>${(result.items || []).map(o => `<tr><td>${VP.esc(o.OrderNo)}</td><td>${VP.esc(o.CustomerName)}</td><td>${VP.fa(o.Total)}</td><td>${VP.esc(o.Status)}</td><td><select data-status="${VP.esc(o.OrderID)}"><option>در انتظار تأیید</option><option>تأیید شده</option><option>در حال آماده‌سازی</option><option>ارسال شده</option><option>تحویل شده</option><option>لغو شده</option></select></td></tr>`).join("")}</table></div>`;
        view.querySelectorAll("[data-status]").forEach(select => select.onchange = () => call("adminUpdateOrder", { orderId: select.dataset.status, status: select.value }).then(() => VP.toast("وضعیت به‌روزرسانی شد.")));
      } else if (type === "tickets") {
        view.innerHTML = `<h2>درخواست‌های پشتیبانی</h2>${(result.items || []).map(t => `<div class="ticket-row"><b>${VP.esc(t.TicketNo)} — ${VP.esc(t.Subject)}</b><p>${VP.esc(t.Message)}</p><small>${VP.esc(t.Name)} · ${VP.esc(t.Phone)} · ${VP.esc(t.Status)}</small><textarea data-reply="${VP.esc(t.TicketID)}" placeholder="پاسخ مدیر"></textarea><button data-send="${VP.esc(t.TicketID)}" class="btn btn-light">ثبت پاسخ</button></div>`).join("")}`;
        view.querySelectorAll("[data-send]").forEach(button => button.onclick = async () => {
          const textarea = view.querySelector(`[data-reply="${button.dataset.send}"]`);
          await call("adminReplyTicket", { ticketId: button.dataset.send, reply: textarea.value });
          VP.toast("پاسخ ثبت شد."); load("tickets");
        });
      } else if (type === "categories") {
        view.innerHTML = `<h2>دسته‌بندی‌ها</h2><form id="catForm" class="inline-form"><input name="name" placeholder="نام دسته‌بندی" required><input name="description" placeholder="توضیح"><button class="btn btn-orange">افزودن</button></form>${(result.items || []).map(c => `<p class="category-admin">${VP.esc(c.Name)} <button data-catdel="${VP.esc(c.CategoryID)}">حذف</button></p>`).join("")}`;
        document.querySelector("#catForm").addEventListener("submit", async event => {
          event.preventDefault(); await call("adminSaveCategory", Object.fromEntries(new FormData(event.target))); load("categories");
        });
        view.querySelectorAll("[data-catdel]").forEach(button => button.onclick = async () => { await call("adminDeleteCategory", { categoryId: button.dataset.catdel }); load("categories"); });
      }
    } catch (error) { view.textContent = error.message; }
  }

  function productForm(product = {}) {
    const area = document.querySelector("#editArea");
    area.innerHTML = `<form id="productForm" class="form-grid admin-form"><h3 class="wide">${product.ProductID ? "ویرایش محصول" : "محصول جدید"}</h3><input type="hidden" name="ProductID" value="${VP.esc(product.ProductID || "")}"><label>نام محصول<input name="Name" required value="${VP.esc(product.Name || "")}"></label><label>کد کالا<input name="ProductCode" required value="${VP.esc(product.ProductCode || "")}"></label><label>قیمت (تومان)<input name="Price" type="number" min="0" value="${VP.esc(product.Price || 0)}"></label><label>موجودی<input name="Stock" type="number" min="0" value="${VP.esc(product.Stock || 0)}"></label><label>دسته‌بندی<input name="CategoryName" value="${VP.esc(product.CategoryName || "")}"></label><label>برند<input name="Brand" value="${VP.esc(product.Brand || "")}"></label><label>خودروهای سازگار<input name="Vehicle" value="${VP.esc(product.Vehicle || "")}"></label><label>آدرس تصویر<input name="ImageURL" value="${VP.esc(product.ImageURL || "")}"></label><label class="wide">توضیحات<textarea name="Description">${VP.esc(product.Description || "")}</textarea></label><label>نمایش محصول<select name="IsActive"><option value="TRUE">فعال</option><option value="FALSE">غیرفعال</option></select></label><button class="btn btn-orange">ذخیره محصول</button></form>`;
    area.querySelector('[name="IsActive"]').value = String(product.IsActive ?? true).toUpperCase();
    area.querySelector("form").onsubmit = async event => {
      event.preventDefault();
      try { await call("adminSaveProduct", Object.fromEntries(new FormData(event.target))); VP.toast("محصول ذخیره شد."); load("products"); }
      catch (error) { VP.toast(error.message); }
    };
  }

  if (adminToken) { localStorage.setItem("vplus_token", adminToken); login.hidden = true; app.hidden = false; load("products"); }
});
