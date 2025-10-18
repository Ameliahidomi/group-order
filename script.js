const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzU4Nbezh-QRxgf8opzwzQU2FotsjITXdrkOMYFVn_FabSP6CAad6PuJJeDYV9J4lv3/exec';
let redPacketTimer;

// 🧧 紅包飄落
function startRedPackets() {
  stopRedPackets();
  redPacketTimer = setInterval(() => {
    for (let i = 0; i < 6; i++) {
      const rp = document.createElement('div');
      rp.className = 'redpacket';
      rp.style.left = Math.random() * 100 + 'vw';
      rp.style.animationDuration = 5 + Math.random() * 4 + 's';
      rp.style.animationDelay = Math.random() * 2 + 's';
      document.body.appendChild(rp);
      setTimeout(() => rp.remove(), 9000);
    }
  }, 1200);
}

function stopRedPackets() {
  clearInterval(redPacketTimer);
  document.querySelectorAll('.redpacket').forEach(e => e.remove());
}

// 顯示分頁
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

// 讀取產品
async function loadProducts() {
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
}

// 送出訂單
document.getElementById('orderForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const vendor = document.getElementById('vendor').value;
  const itemSel = document.getElementById('item');
  const item = itemSel.value;
  const price = itemSel.selectedOptions[0]?.dataset.price || 0;
  const qty = document.getElementById('qty').value;

  if (!name || !vendor || !item) {
    alert('請完整填寫訂單資訊');
    return;
  }

  const data = { action: 'addOrder', name, vendor, item, qty, price };
  await fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(data)
  });

  alert('訂單已送出！');
  document.getElementById('orderForm').reset();
});

// 查詢訂單
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

  let html = '<table border="1" style="margin:auto;border-collapse:collapse;"><tr><th>商家</th><th>商品</th><th>數量</th><th>價格</th><th>時間</th></tr>';
  data.forEach(o => {
    html += `<tr><td>${o.vendor}</td><td>${o.item}</td><td>${o.qty}</td><td>${o.price}</td><td>${o.time}</td></tr>`;
  });
  html += '</table>';
  list.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', loadProducts);
