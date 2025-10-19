/* ========== 🧧 初始化頁面與紅包動畫 ========== */
let redPacketTimer;

// 初始化
function initPage() {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  document.getElementById('homePage').style.display = 'block';
  startRedPackets();
}

// 分頁切換
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  const page = document.getElementById(pageId);
  if (page) {
    page.style.display = 'block';
    window.scrollTo(0, 0);
  }

  if (pageId === 'homePage') {
    startRedPackets();
  } else {
    stopRedPackets();
  }
}

// 紅包飄落（數量減少）
function startRedPackets() {
  stopRedPackets();
  redPacketTimer = setInterval(() => {
    for (let i = 0; i < 3; i++) { // 一次 3 個紅包
      const rp = document.createElement("div");
      rp.className = "redpacket";
      rp.style.left = Math.random() * 100 + "vw";
      rp.style.animationDuration = 6 + Math.random() * 3 + "s"; // 掉得慢一點
      rp.style.animationDelay = Math.random() * 2 + "s";
      document.body.appendChild(rp);
      setTimeout(() => rp.remove(), 10000);
    }
  }, 1500);
}

function stopRedPackets() {
  clearInterval(redPacketTimer);
  document.querySelectorAll('.redpacket').forEach(e => e.remove());
}


/* ========== 🧾 Google Sheet 連線設定 ========== */
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzU4Nbezh-QRxgf8opzwzQU2FotsjITXdrkOMYFVn_FabSP6CAad6PuJJeDYV9J4lv3/exec';

let cart = [];

/* ========== 📦 商品資料載入 ========== */
async function loadProducts() {
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getProducts`);
    const data = await res.json();
    const vendorSel = document.getElementById('vendor');
    const itemSel = document.getElementById('item');

    const vendors = [...new Set(data.map(p => p[0]))];
    vendorSel.innerHTML = '<option value="">選擇商家</option>';
    vendors.forEach(v => {
      vendorSel.innerHTML += `<option value="${v}">${v}</option>`;
    });

    vendorSel.addEventListener('change', () => {
      const selectedVendor = vendorSel.value;
      const items = data.filter(p => p[0] === selectedVendor);
      itemSel.innerHTML = '<option value="">選擇商品</option>';
      items.forEach(p => {
        itemSel.innerHTML += `<option value="${p[1]}" data-price="${p[2]}">${p[1]}（$${p[2]}）</option>`;
      });
    });
  } catch (err) {
    console.error('讀取商品資料失敗', err);
  }
}

/* ========== 🛍️ 加入購物車 ========== */
document.getElementById('orderForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const vendor = document.getElementById('vendor').value;
  const itemEl = document.getElementById('item');
  const item = itemEl.value;
  const price = itemEl.selectedOptions[0]?.dataset.price || 0;
  const qty = parseInt(document.getElementById('qty').value);

  if (!name || !vendor || !item) return alert('請完整填寫訂單資訊');
  cart.push({ name, vendor, item, price, qty });
  alert('已加入購物車 ✅');
  document.getElementById('cartCount').textContent = cart.length;
});

/* ========== 🧺 購物車相關 ========== */
function toggleCart() {
  document.getElementById('cartPanel').classList.toggle('active');
  renderCart();
}

function renderCart() {
  const list = document.getElementById('cartList');
  list.innerHTML = '';
  cart.forEach((c, i) => {
    const li = document.createElement('li');
    li.innerHTML = `${c.item} x ${c.qty}（$${c.price * c.qty}） <button onclick="removeItem(${i})">❌</button>`;
    list.appendChild(li);
  });
}

function removeItem(i) {
  cart.splice(i, 1);
  document.getElementById('cartCount').textContent = cart.length;
  renderCart();
}

async function submitCart() {
  if (cart.length === 0) return alert('購物車是空的');
  for (const c of cart) {
    const data = {
      action: 'addOrder',
      name: c.name,
      vendor: c.vendor,
      item: c.item,
      qty: c.qty,
      price: c.price
    };
    await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  alert('🎉 訂單已送出！');
  cart = [];
  document.getElementById('cartCount').textContent = 0;
  renderCart();
  toggleCart();
}

/* ========== 🔍 查詢訂單 ========== */
async function queryOrders() {
  const name = document.getElementById('queryName').value.trim();
  if (!name) return alert('請輸入姓名');

  const res = await fetch(`${SCRIPT_URL}?action=getOrders&name=${encodeURIComponent(name)}`);
  const data = await res.json();
  const list = document.getElementById('orderList');

  if (data.length === 0) {
    list.innerHTML = '<p>查無訂單資料。</p>';
    return;
  }

  let html = '<table border="1" style="margin:auto;border-collapse:collapse;"><tr><th>商家</th><th>商品</th><th>數量</th><th>金額</th><th>時間</th></tr>';
  data.forEach(o => {
    html += `<tr><td>${o.vendor}</td><td>${o.item}</td><td>${o.qty}</td><td>${o.price}</td><td>${o.time}</td></tr>`;
  });
  html += '</table>';
  list.innerHTML = html;
}

/* ========== 🚀 啟動 ========== */
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
});
