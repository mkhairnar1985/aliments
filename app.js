// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, getDoc, doc, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
            apiKey: "AIzaSyCwMm9I0OP53oGmysE3PEjgNvcBsCf5YCc",
            authDomain: "aliments-bd960.firebaseapp.com",
            projectId: "aliments-bd960",
            storageBucket: "aliments-bd960.firebasestorage.app",
            messagingSenderId: "144941222515",
            appId: "1:144941222515:web:22f1dfeaeef8f93adff806",
            measurementId: "G-8E79M9ME8L"
        };


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const VENDOR_WHATSAPP = "919876543210"; // Replace with your WhatsApp number
const VENDOR_UPI_ID = "yourbusiness@okhdfcbank"; // Replace with your UPI ID

let menuItems = [];
let cart = [];
let currentCategory = 'All';
let isKitchenOpen = false;

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('admin') === 'true') {
    document.getElementById('headerAdminLink').classList.remove('hidden');
}

async function initApp() {
    await fetchKitchenStatus();
    await fetchMenu();
}

async function fetchKitchenStatus() {
    const badge = document.getElementById('kitchenStatusBadge');
    const dot = document.getElementById('kitchenDot');
    const text = document.getElementById('kitchenText');
    const checkoutBtn = document.getElementById('checkoutBtn');

    try {
        const docRef = doc(db, "settings", "store");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            isKitchenOpen = docSnap.data().isKitchenOpen === true;
        } else {
            isKitchenOpen = true; 
        }

        if (isKitchenOpen) {
            badge.className = "px-3 py-1.5 rounded-xl text-xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-100 flex items-center gap-1.5 shadow-2xs";
            dot.className = "w-2 h-2 rounded-full bg-emerald-500 animate-pulse";
            text.textContent = "Kitchen Open";
            checkoutBtn.disabled = false;
            checkoutBtn.classList.remove("opacity-50", "cursor-not-allowed");
        } else {
            badge.className = "px-3 py-1.5 rounded-xl text-xs font-bold border bg-red-50 text-red-700 border-red-200 flex items-center gap-1.5 shadow-2xs";
            dot.className = "w-2 h-2 rounded-full bg-red-500";
            text.textContent = "Kitchen Closed";
            checkoutBtn.disabled = true;
            checkoutBtn.classList.add("opacity-50", "cursor-not-allowed");
            checkoutBtn.innerHTML = `<i class="fa-solid fa-lock text-xs"></i> Kitchen Currently Closed`;
            
            cart = [];
            renderCart();
        }
    } catch (error) {
        console.error("Error fetching kitchen status:", error);
        text.textContent = "Status Error";
    }
}

async function fetchMenu() {
    const menuGrid = document.getElementById('menuGrid');
    const menuStatus = document.getElementById('menuStatus');
    try {
        const querySnapshot = await getDocs(collection(db, "menu"));
        menuItems = [];
        querySnapshot.forEach((doc) => {
            menuItems.push({ id: doc.id, ...doc.data() });
        });

        if (menuItems.length === 0) {
            menuStatus.textContent = "Database empty";
            menuGrid.innerHTML = `<div class="col-span-2 bg-white p-8 rounded-3xl border border-slate-100 text-center text-slate-400 shadow-2xs"><i class="fa-solid fa-box-open text-3xl mb-2 text-slate-300"></i><p class="text-xs">No menu items found in Firebase.</p></div>`;
            return;
        }

        menuStatus.textContent = `${menuItems.length} items live`;
        renderMenuGrid();
    } catch (error) {
        console.error("Error fetching menu:", error);
        menuStatus.textContent = "Connection error";
    }
}

window.filterCategory = function(cat) {
    currentCategory = cat;
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.className = "cat-btn px-4 py-2.5 rounded-2xl text-xs font-bold bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 transition whitespace-nowrap";
    });
    document.getElementById(`cat-${cat}`).className = "cat-btn px-4 py-2.5 rounded-2xl text-xs font-bold bg-emerald-600 text-white shadow-md shadow-emerald-600/20 transition whitespace-nowrap";
    renderMenuGrid();
}

function renderMenuGrid() {
    const menuGrid = document.getElementById('menuGrid');
    menuGrid.innerHTML = '';

    const filtered = currentCategory === 'All' ? menuItems : menuItems.filter(i => (i.category || 'Meals') === currentCategory);

    if (filtered.length === 0) {
        menuGrid.innerHTML = `<div class="col-span-2 bg-white p-8 rounded-3xl border border-slate-100 text-center text-slate-400"><p class="text-xs">No items found in this category.</p></div>`;
        return;
    }

    filtered.forEach(item => {
        const itemImg = item.img || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60';
        
        menuGrid.innerHTML += `
            <div class="bg-white rounded-3xl border border-slate-100/80 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group">
                <div class="relative h-44 w-full overflow-hidden bg-slate-100">
                    <img src="${itemImg}" alt="${item.name}" class="w-full h-full object-cover object-center group-hover:scale-105 transition duration-500">
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent"></div>
                    <span class="absolute top-3 right-3 bg-white/95 backdrop-blur-md text-slate-900 text-xs font-black px-3 py-1.5 rounded-2xl shadow-sm">₹${item.price}</span>
                    <span class="absolute bottom-3 left-3 bg-slate-900/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-xl">${item.category || 'Fresh Meal'}</span>
                </div>
                <div class="p-5 flex flex-col justify-between flex-grow space-y-4">
                    <div>
                        <h4 class="font-extrabold text-slate-900 text-sm mb-1">${item.name}</h4>
                        <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">${item.desc || 'Prepared fresh daily with premium ingredients.'}</p>
                    </div>
                    <button onclick="window.addToCart('${item.id}')" ${!isKitchenOpen ? 'disabled' : ''} class="w-full ${isKitchenOpen ? 'bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border-emerald-100/80 shadow-2xs cursor-pointer' : 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200'} text-xs font-extrabold py-3 rounded-2xl transition duration-200 flex items-center justify-center gap-1.5 border">
                        <i class="fa-solid fa-plus text-[10px]"></i> ${isKitchenOpen ? 'Add to Basket' : 'Kitchen Closed'}
                    </button>
                </div>
            </div>
        `;
    });
}

window.addToCart = function(id) {
    if (!isKitchenOpen) {
        alert("Sorry, the kitchen is currently closed. Basket updates are disabled.");
        return;
    }
    const item = menuItems.find(m => m.id === id);
    const existing = cart.find(c => c.id === id);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ ...item, qty: 1 });
    }
    renderCart();
}

window.removeFromCart = function(id) {
    if (!isKitchenOpen) {
        alert("Sorry, the kitchen is currently closed.");
        return;
    }
    cart = cart.filter(c => c.id !== id);
    renderCart();
}

function renderCart() {
    const list = document.getElementById('cartItemsList');
    const totalSumEl = document.getElementById('cartTotalSum');
    const heroTotalEl = document.getElementById('heroCartTotal');
    const cartCountBadge = document.getElementById('cartCountBadge');
    const qrImg = document.getElementById('upiQRCode');
    
    list.innerHTML = '';
    const totalItemsCount = cart.reduce((sum, i) => sum + i.qty, 0);
    cartCountBadge.textContent = `${totalItemsCount} items`;

    if (!isKitchenOpen) {
        list.innerHTML = `
            <div class="text-center py-6 text-red-400 space-y-1">
                <i class="fa-solid fa-lock text-2xl mb-1"></i>
                <p class="text-xs font-bold text-red-600">Kitchen is Closed</p>
                <p class="text-[11px] text-slate-400">Basket locked.</p>
            </div>
        `;
        totalSumEl.textContent = '₹0';
        heroTotalEl.textContent = '₹0';
        return;
    }

    if (cart.length === 0) {
        list.innerHTML = `
            <div class="text-center py-6 text-slate-400">
                <i class="fa-solid fa-cart-flatbed text-2xl mb-2 text-slate-300"></i>
                <p class="text-xs">Your basket is empty. Add items to begin.</p>
            </div>
        `;
        totalSumEl.textContent = '₹0';
        heroTotalEl.textContent = '₹0';
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=${VENDOR_UPI_ID}&pn=Aliments&am=0`;
        return;
    }

    let total = 0;
    cart.forEach(item => {
        total += item.price * item.qty;
        list.innerHTML += `
            <div class="py-3 flex justify-between items-center text-xs">
                <div class="space-y-0.5 max-w-[160px]">
                    <p class="font-extrabold text-slate-800 truncate">${item.name}</p>
                    <span class="text-slate-400 font-medium">Qty: ${item.qty} × ₹${item.price}</span>
                </div>
                <div class="flex items-center gap-3">
                    <span class="font-black text-slate-900">₹${item.price * item.qty}</span>
                    <button onclick="window.removeFromCart('${item.id}')" class="text-red-400 hover:text-red-600 p-1"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>
        `;
    });

    totalSumEl.textContent = `₹${total}`;
    heroTotalEl.textContent = `₹${total}`;
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=${VENDOR_UPI_ID}&pn=Aliments&am=${total}&cu=INR`)}`;
}

window.submitOrderToCloud = async function() {
    if (!isKitchenOpen) {
        alert("Sorry, the kitchen is closed and cannot accept orders at this time.");
        return;
    }
    if (cart.length === 0) {
        alert("Your basket is empty. Please add items before placing an order.");
        return;
    }
    const name = document.getElementById('custName').value.trim();
    const address = document.getElementById('custAddress').value.trim();
    const payRef = document.getElementById('payRef').value.trim();

    if (!name || !address || !payRef) {
        alert("Please complete your name, delivery address, and UTR payment reference ID after scanning the QR code.");
        return;
    }

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
    
    const newOrder = {
        orderId: orderId,
        name: name,
        address: address,
        payRef: payRef,
        items: cart,
        total: totalAmount,
        status: 'Placed',
        createdAt: new Date().toISOString()
    };

    try {
        await addDoc(collection(db, "orders"), newOrder);
    } catch (e) {
        console.error("Error saving order to cloud: ", e);
    }

    let itemsText = cart.map(i => `• ${i.name} (x${i.qty}) - ₹${i.price * i.qty}`).join('%0A');
    let whatsappMessage = `*New Verified Order: ${orderId}*%0A` +
                          `*Customer:* ${name}%0A` +
                          `*Address:* ${address}%0A` +
                          `*Payment UTR:* ${payRef}%0A` +
                          `*Total Paid:* ₹${totalAmount}%0A%0A` +
                          `*Items Ordered:*%0A${itemsText}`;

    cart = [];
    renderCart();
    document.getElementById('custName').value = '';
    document.getElementById('custAddress').value = '';
    document.getElementById('payRef').value = '';

    window.open(`https://wa.me/${VENDOR_WHATSAPP}?text=${whatsappMessage}`, '_blank');
    alert(`Order ${orderId} placed successfully! Redirecting to WhatsApp...`);
}

// Initialize App on Load
initApp();