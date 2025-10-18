// 請確認這個網址是你已部署的 Apps Script（你已確認過）
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzU4Nbezh-QRxgf8opzwzQU2FotsjITXdrkOMYFVn_FabSP6CAad6PuJJeDYV9J4lv3/exec';

let redPacketTimer = null;
let cart = [];

// 初始化：載入 products、顯示首頁（並啟動紅包）
function initPage(){
  showPage('homePage');
  startRedPackets();
  loadProducts();
}

// --- 紅包動畫（僅在首頁） ---
function startRedPackets(){
  stopRedPackets();
  redPacketTimer = setInterval(() => {
    // 一次產生 2 個，較不雜亂
    for (let i = 0; i < 2; i++){
      const rp = document.createElement('div');
      rp.className = 'redpacket';
      rp.style.left = Math.random() * 90 + 'vw';
      rp.style.animationDuration = 5 + Math.random() * 4 + 's';
      rp.style.animationDelay = Math.random() * 1.2 + 's';
      document.body.appendChild(rp);
      setTimeout(()=> rp.remove(), 10000);
    }
  }, 1800);
}
function stopRedPackets(){
  clearInterval(redPacketTimer);
  document.querySelectorAll('.redpacket').forEach(e=> e.remove());
}

// --- 分頁切換（使用 active class） ---
function showPage(id){
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('active');
  // 紅包只在首頁啟動
  if (id === 'homePage') startRedPackets();
  else stopRedPackets();
}

// --- 載入 Products（可容錯） ---
async function loadProducts(){
  try{
    const res = await fetch(`${SCRIPT_URL}?action=getProducts`);
    if (!res.ok) throw new Error('無法取得 products, status:' + res.status);
    const data = await res.json();

    // 資料有可能是 array of arrays（每 row），也有可能是 objects，做兼容處理
    const rows = Array.isArray(data) ? data : (data.rows || []);
    const vendorSel = document.getElementById('vendor');
    const itemSel = document.getElementById('item');
    vendorSel.innerHTML = '<option value="">選擇商家</option>';
    itemSel.innerHTML = '<option value="">先選商家</option>';

    // 把每列當成 [Vendor, Item, Price] 或 {Vendor:..., Item:..., Price:...}
    const parsed = rows.map(r => {
      if (Array.isArray(r)) return { vendor: r[0] || '', item: r[1] || '', price: r[2] || '' };
      if (typeof r === 'object') return { vendor: r.Vendor || r.vendor || r[0]||'', item: r.Item || r.item || r[1]||'', price: r.Price || r.price || r[2]||'' };
      return null;
    }).filter(Boolean);

    const vendors = [...new Set(parsed.map(p => p.vendor).filter(Boolean))];
    vendors.forEach(v => vendorSel.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`));

    vendorSel.addEventListener('change', () => {
      const selected = vendorSel.value;
      itemSel.innerHTML = '<option value="">選擇商品</option>';
      parsed.filter(p => p.vendor === selected).forEach(p => {
        const label = `${p.item}（$${p.price}）`;
        itemSel.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(p.item)}" data-price="${escapeHtml(p.price)}">${escapeHtml(label)}</option>`);
      });
    });
  }catch(err){
    console.error('loadProducts error', err);
    document.getElementById('vendor').innerHTML = '<option>無法取得商家資料</option>';
  }
}

// 簡單 HTML escape
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// --- 表單：加入購物車 (變成暫存) ---
document.addEventListener('submit', function(e){
  if (e.target && e.target.id === 'orderForm') {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const vendor = document.getElementById('vendor').value;
    const itemSel = document.getElementById('item');
    const item = itemSel.value;
    const price = parseFloat(itemSel.selectedOptions[0]?.dataset.price || 0);
    const qty = parseInt(document.getElementById('qty').value, 10) || 1;

    if (!name || !vendor || !item) { alert('請完整填寫姓名、商家與商品'); return; }

    cart.push({ name, vendor, item, qty, price });
    updateCartUI();
    alert('已加入購物車！');
    e.target.reset();
    // 更新 cartCount
    document.getElementById('cartCount').textContent = cart.length;
  }
});

// 更新購物車介面
function updateCartUI(){
  const ul = document.getElementById('cartList');
  if (!ul) return;
  if (cart.length === 0) {
    ul.innerHTML = '<li>目前購物車為空</li>';
    document.getElementById('cartCount').textContent = 0;
    return;
  }
  ul.innerHTML = cart.map((c,i) =>
    `<li>
      <div>${escapeHtml(c.item)} x ${c.qty} <small>($${c.price})</small></div>
      <div><button onclick="removeItem(${i})">❌</button></div>
     </li>`
  ).join('');
  document.getElementById('cartCount').textContent = cart.length;
}

// 刪除購物車項目
function removeItem(idx){
  cart.splice(idx,1);
  updateCartUI();
}

// 顯示/隱藏購物車（側欄）
// 會向左滑出（預設在右側）
function toggleCart(){
  const panel = document.getElementById('cartPanel');
  if (!panel) return;
  panel.classList.toggle('show');
  updateCartUI();
}

// 送出整個購物車（會逐筆送到 Apps Script）
async function submitCart(){
  if (cart.length === 0) return alert('購物車是空的');
  try{
    for (const c of cart){
      const payload = { action: 'addOrder', name: c.name, vendor: c.vendor, item: c.item, qty: c.qty, price: c.price };
      await fetch(SCRIPT_URL, { method:'POST', body: JSON.stringify(payload) });
    }
    alert('訂單已全部送出！');
    cart = [];
    updateCartUI();
    toggleCart();
  }catch(err){
    console.error('submitCart error', err);
    alert('送出時發生錯誤，請稍後再試');
  }
}

// 查詢訂單（姓名）
async function queryOrders(){
  const name = document.getElementById('queryName').value.trim();
  if (!name) return alert('請輸入姓名');
  try{
    const res = await fetch(`${SCRIPT_URL}?action=getOrders&name=${encodeURIComponent(name)}`);
    if (!res.ok) throw new Error('getOrders status ' + res.status);
    const data = await res.json();
    const list = document.getElementById('orderList');
    if (!Array.isArray(data) || data.length === 0) {
      list.innerHTML = `<p>查無訂單</p>`;
      return;
    }
    let html = '<table border="1" style="margin:auto;border-collapse:collapse;"><tr><th>商家</th><th>商品</th><th>數量</th><th>價格</th><th>時間</th></tr>';
    data.forEach(o => {
      html += `<tr><td>${escapeHtml(o.vendor)}</td><td>${escapeHtml(o.item)}</td><td>${escapeHtml(o.qty)}</td><td>${escapeHtml(o.price)}</td><td>${escapeHtml(o.time)}</td></tr>`;
    });
    html += '</table>';
    list.innerHTML = html;
  }catch(err){
    console.error('queryOrders error', err);
    alert('查詢發生錯誤，請稍後再試');
  }
}
