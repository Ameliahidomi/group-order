const SHEET_ID = '1XQzmPnXohvVda2ybCwLrRZPm1CD6XnAWpMSFRpHBcQ4';
const PRODUCTS_SHEET = 'Products';
const ORDERS_SHEET = 'Orders';
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzU4Nbezh-QRxgf8opzwzQU2FotsjITXdrkOMYFVn_FabSP6CAad6PuJJeDYV9J4lv3/exec';

let products = [];
let cart = [];

let redPacketTimer;
function startRedPackets() {
  stopRedPackets();
  redPacketTimer = setInterval(() => {
    for (let i = 0; i < 6; i++) {
      const rp = document.createElement("div");
      rp.className = "redpacket";
      rp.style.left = Math.random() * 100 + "vw";
      rp.style.animationDuration = 5 + Math.random() * 4 + "s";
      rp.style.animationDelay = Math.random() * 2 + "s";
      document.body.appendChild(rp);
      setTimeout(() => rp.remove(), 9000);
    }
  }, 1200);
}
function stopRedPackets() {
  clearInterval(redPacketTimer);
  document.querySelectorAll('.redpacket').forEach(e => e.remove());
}

function initApp() {
  startRedPackets();
  loadProducts();
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'homePage') startRedPackets(); else stopRedPackets();
}

async function loadProducts() {
  const url = `https://opensheet.elk.sh/${SHEET_ID}/${PRODUCTS_SHEET}`;
  const res = await fetch(url);
  products = await res.json();
  const vendors = [...new Set(products.map(p => p.Vendor))];
  const vendorSel = document.getElementById('vendor');
  vendorSel.innerHTML = vendors.map(v => `<option>${v}</option>`).join('');
  populateItems();
}

function populateItems() {
  const vendor = document.getElementById('vendor').value;
  const items = products.filter(p => p.Vendor === vendor);
  const itemSel = document.getElementById('item');
  itemSel.innerHTML = items.map(i => `<option value="${i.Item}" data-price="${i.Price}">${i.Item} ($${i.Price})</option>`).join('');
}

function addToCart() {
  const name = document.getElementById('name').value.trim();
  if (!name) return alert('請先輸入姓名');
  const vendor = document.getElementById('vendor').value;
  const itemEl = document.getElementById('item').selectedOptions[0];
  const item = itemEl.value;
  const price = parseFloat(itemEl.dataset.price);
  const qty = parseInt(document.getElementById('qty').value);
  cart.push({ vendor, item, price, qty });
  updateCartCount();
  alert('已加入購物車');
}

function updateCartCount() {
  document.getElementById('cartCount').textContent = cart.length;
  renderCart();
}

function renderCart() {
  const ul = document.getElementById('cartItems');
  ul.innerHTML = cart.map((c,i)=>`
    <li>${c.item} x ${c.qty} = $${c.price*c.qty}
      <button onclick="removeCartItem(${i})">❌</button></li>`).join('');
}

function removeCartItem(i){
  cart.splice(i,1);
  updateCartCount();
}

function clearCart(){
  if(confirm('確定要清空購物車嗎？')){
    cart = [];
    updateCartCount();
  }
}

function toggleCart(){
  document.getElementById('cartList').classList.toggle('active');
}

async function submitOrder(e){
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  if(!name) return alert('請輸入姓名');
  if(cart.length===0) return alert('購物車是空的');

  for(const c of cart){
    const data = {
      Name: name,
      Vendor: c.vendor,
      Item: c.item,
      Qty: c.qty,
      Price: c.price * c.qty,
      Timestamp: new Date().toLocaleString()
    };
    await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  alert('訂單已送出！');
  cart = [];
  updateCartCount();
  showPage('homePage');
}

async function queryOrders(){
  const name = document.getElementById('queryName').value.trim();
  if(!name) return alert('請輸入姓名');
  const url = `https://opensheet.elk.sh/${SHEET_ID}/${ORDERS_SHEET}`;
  const res = await fetch(url);
  const data = await res.json();
  const result = data.filter(o => o.Name === name);
  const div = document.getElementById('queryResult');
  if(result.length===0){
    div.innerHTML = '<p>查無訂單</p>';
  }else{
    div.innerHTML = `<table border="1" width="100%">
      <tr><th>商家</th><th>商品</th><th>數量</th><th>金額</th><th>時間</th></tr>
      ${result.map(r=>`<tr><td>${r.Vendor}</td><td>${r.Item}</td><td>${r.Qty}</td><td>${r.Price}</td><td>${r.Timestamp}</td></tr>`).join('')}
    </table>`;
  }
}
