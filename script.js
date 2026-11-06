// Apply stored theme immediately to avoid flash of light theme
(function () {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
})();

// Centralized Color Configuration (Hex to Name Mapping)
const colorNames = {
    '#ffffff': 'Pure White',
    '#000000': 'Black',
    '#0a0a0a': 'Obsidian Black',
    '#000080': 'Navy Blue',
    '#ff0000': 'Red',
    '#dc143c': 'Crimson Red',
    '#8b0000': 'Dark Red',
    '#0000ff': 'Blue',
    '#008000': 'Green',
    '#ffff00': 'Yellow',
    '#808080': 'Gray',
    '#00f2ff': 'Light Blue',
    '#e100ff': 'Pink',
    '#1a2a4a': 'Midnight Blue',
    '#4a90e2': 'Sky Blue',
    '#f0f0f0': 'Off-White',
    '#0a0f1e': 'Dark Navy',
    '#333333': 'Grey',
    '#ff91a4': 'Salmon Pink',
    '#800000': 'Maroon',
    '#900056': 'Dark Pink',
    '#c4956a': 'Light Brown',
    '#f5e6c8': 'Light Yellow',
    '#36454f': 'Charcoal',
    '#889c8a': 'Sage Green',
    '#7f94a8': 'Dusty Blue',
    '#d9cdbe': 'Beige'
};

function getColorName(color) {
    if (!color) return 'Classic';
    const str = String(color).trim();
    if (!str.startsWith('#')) return str;
    const lower = str.toLowerCase();
    const map = {
        '#000000': 'Black',
        '#0a0a0a': 'Obsidian Black',
        '#0a0f1e': 'Dark Navy',
        '#111111': 'Jet Black',
        '#161616': 'Onyx Black',
        '#1a1a1a': 'Charcoal Black',
        '#1a2a4a': 'Midnight Blue',
        '#333333': 'Grey',
        '#36454f': 'Charcoal',
        '#808080': 'Gray',
        '#9ca3af': 'Light Slate',
        '#d1d5db': 'Silver',
        '#ffffff': 'Pure White',
        '#f0f0f0': 'Off-White',
        '#f5f5f5': 'Light Smoke',
        '#f5e6c8': 'Light Yellow',
        '#d9cdbe': 'Beige',
        '#c4956a': 'Light Brown',
        '#8b0000': 'Dark Red',
        '#dc143c': 'Crimson Red',
        '#ff0000': 'Red',
        '#800000': 'Maroon',
        '#900056': 'Dark Pink',
        '#e100ff': 'Pink',
        '#ff91a4': 'Salmon Pink',
        '#000080': 'Navy Blue',
        '#0000ff': 'Royal Blue',
        '#4a90e2': 'Sky Blue',
        '#7f94a8': 'Dusty Blue',
        '#00f2ff': 'Light Blue',
        '#008000': 'Green',
        '#047857': 'Forest Green',
        '#16a34a': 'Emerald Green',
        '#22c55e': 'Mint Green',
        '#889c8a': 'Sage Green',
        '#ffff00': 'Yellow',
        '#ff9500': 'Amber Orange'
    };
    if (map[lower]) return map[lower];
    if (typeof colorNames !== 'undefined') {
        const found = Object.keys(colorNames).find(k => k.toLowerCase() === lower);
        if (found) return colorNames[found];
    }
    return str;
}
if (typeof window !== 'undefined') {
    window.getColorName = getColorName;
    window.colorNames = colorNames;
}


// --- 100% Dynamic Firebase Firestore Products Engine ---
// Clear legacy cached products from prior versions
(function clearOldProductCaches() {
    try {
        localStorage.removeItem('python_deleted_products');
        localStorage.removeItem('python_product_stock_map');
        // If the cache contains old product names, wipe it clean
        const cached = localStorage.getItem('python_live_products');
        if (cached && (cached.includes('Peace Design') || cached.includes('Infinity Edition') || cached.includes('Wildland') || cached.includes('Stitch Design') || cached.includes('BMW Design'))) {
            localStorage.removeItem('python_live_products');
            console.log("Purged legacy product cache successfully.");
        }
    } catch (e) {}
})();

// Active live products array (strictly loaded from the connected Firebase Database)
let products = [];
try {
    const cached = localStorage.getItem('python_live_products');
    if (cached) {
        products = JSON.parse(cached);
    }
} catch (e) {
    products = [];
}
if (!Array.isArray(products)) products = [];

// Normalize the many older product shapes into one predictable database model.
function normalizeSizes(rawSizes, fallbackPrice, fallbackOldPrice) {
    const price = Number(fallbackPrice) || 0;
    const oldPrice = Number(fallbackOldPrice) || 0;

    if (Array.isArray(rawSizes) && rawSizes.length) {
        const mapped = {};
        rawSizes.forEach(size => {
            if (size) mapped[String(size)] = { price: price, oldPrice: oldPrice };
        });
        return mapped;
    }

    if (rawSizes && typeof rawSizes === 'object') {
        const mapped = {};
        Object.entries(rawSizes).forEach(([size, value]) => {
            if (!size) return;
            if (value && typeof value === 'object') {
                mapped[size] = {
                    price: Number(value.price) || price,
                    oldPrice: Number(value.oldPrice) || oldPrice
                };
            } else {
                mapped[size] = { price: Number(value) || price, oldPrice: oldPrice };
            }
        });
        if (Object.keys(mapped).length) return mapped;
    }

    return {
        'S': { price: price, oldPrice: oldPrice },
        'M': { price: price, oldPrice: oldPrice },
        'L': { price: price, oldPrice: oldPrice },
        'XL': { price: price, oldPrice: oldPrice }
    };
}

function getFirstSizePrice(sizes) {
    if (!sizes || typeof sizes !== 'object') return 0;
    const first = Object.values(sizes)[0];
    return first && typeof first === 'object' ? Number(first.price) || 0 : Number(first) || 0;
}

function getFirstSizeOldPrice(sizes) {
    if (!sizes || typeof sizes !== 'object') return 0;
    const first = Object.values(sizes)[0];
    return first && typeof first === 'object' ? Number(first.oldPrice) || 0 : 0;
}

function getProductImages(product) {
    if (!product) return ['T Shirt.png'];
    if (Array.isArray(product.images) && product.images.length) return product.images.filter(Boolean);
    return [product.image || 'T Shirt.png'];
}

function getProductSizes(product) {
    if (!product) return [];
    let sizes = [];
    if (Array.isArray(product.sizes)) sizes = product.sizes.filter(Boolean);
    else if (product.sizes && typeof product.sizes === 'object') sizes = Object.keys(product.sizes);
    const sizeOrder = ['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'FREE'];
    return Array.from(new Set(sizes.map(size => String(size).trim()).filter(Boolean))).sort((a, b) => {
        const ai = sizeOrder.indexOf(a.toUpperCase());
        const bi = sizeOrder.indexOf(b.toUpperCase());
        if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
        const an = parseFloat(a);
        const bn = parseFloat(b);
        if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
        return a.localeCompare(b);
    });
}

function getProductColors(product) {
    if (!product || !Array.isArray(product.colors)) return [];
    return product.colors.filter(Boolean);
}

function getColorLabel(color, product) {
    if (!color) return 'Default';
    if (product && product.colorLabels && product.colorLabels[color]) return product.colorLabels[color];
    const match = Object.keys(colorNames).find(key => key.toLowerCase() === String(color).toLowerCase());
    return match ? colorNames[match] : color;
}

function getProductDisplayPrice(product) {
    if (!product) return 0;
    const fromSizes = getFirstSizePrice(product.sizes);
    return fromSizes || Number(product.price) || 0;
}

function getProductDisplayOldPrice(product) {
    if (!product) return 0;
    const fromSizes = getFirstSizeOldPrice(product.sizes);
    return fromSizes || Number(product.oldPrice) || 0;
}

function escapeProductHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Function to refresh UI across any active page
function refreshActivePageProductViews() {
    try {
        if (typeof filterShop === 'function' && window.location.pathname.includes('shop.html')) {
            filterShop();
        } else if (typeof displayProducts === 'function' && document.getElementById('product-grid')) {
            displayProducts(products.filter(p => !p.isDeleted));
        }

        // Render Home New Drop & Featured Carousels if on index.html
        const newDropContainer = document.getElementById('new-drop-grid') || document.getElementById('top-selling-carousel');
        if (newDropContainer && typeof renderHomeProducts === 'function') {
            renderHomeProducts();
        }
    } catch (e) {
        console.warn('View refresh error:', e);
    }
}

// Real-Time Firebase Firestore Products Sync
function initFirestoreProductSync() {
    if (typeof db !== 'undefined' && db) {
        db.collection('products').onSnapshot(snapshot => {
            const liveProducts = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                const normalizedSizes = normalizeSizes(data.sizes, data.price, data.oldPrice);
                liveProducts.push({
                    id: doc.id,
                    ...data,
                    images: (Array.isArray(data.images) && data.images.length > 0)
                        ? data.images.filter(Boolean)
                        : [data.image || 'T Shirt.png'],
                    sizes: normalizedSizes,
                    colors: Array.isArray(data.colors) ? data.colors.filter(Boolean) : [],
                    colorLabels: (data.colorLabels && typeof data.colorLabels === 'object') ? data.colorLabels : {},
                    specifications: (data.specifications && typeof data.specifications === 'object') ? data.specifications : {},
                    price: Number(data.price) || getFirstSizePrice(normalizedSizes) || 0,
                    oldPrice: Number(data.oldPrice) || getFirstSizeOldPrice(normalizedSizes) || 0,
                    stock: data.stock !== undefined ? Number(data.stock) : 10,
                    stockStatus: data.stock === 0 ? 'out_of_stock' : (data.stockStatus || 'in_stock')
                });
            });
            products = liveProducts;
            if (products.length > 0) {
                localStorage.setItem('python_live_products', JSON.stringify(products));
            } else {
                localStorage.removeItem('python_live_products');
            }
            console.log('✅ Synced ' + products.length + ' products live from Firestore!');
            refreshActivePageProductViews();
            try {
                window.dispatchEvent(new CustomEvent('products-updated', { detail: products }));
            } catch (e) {}
            if (products.length === 0) {
                console.log('ℹ️ Firestore collection "products" is currently empty. Add a product from database.html');
            }
        }, err => {
            console.warn('Firestore live listener notice:', err);
        });
    }
}

// Auto-run sync on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initFirestoreProductSync, 500));
} else {
    setTimeout(initFirestoreProductSync, 500);
}

// --- Cart System ---
let cart = [];
try {
    cart = JSON.parse(localStorage.getItem('python_cart')) || [];
    if (!Array.isArray(cart)) cart = [];
} catch (e) {
    cart = [];
    console.error("Failed to load cart from localStorage", e);
}

function updateCartCount() {
    const countElement = document.getElementById('cart-count');
    if (countElement) {
        countElement.innerText = cart.reduce((total, item) => total + item.quantity, 0);
    }
}

function addToCart(name, price, image = '', size = 'Free', color = 'Default', quantity = 1) {
    // Block out-of-stock products from being added to cart
    const product = products.find(p => p.name === name);
    if (product) {
        const stockMap = JSON.parse(localStorage.getItem('python_product_stock_map')) || {};
        const deletedList = JSON.parse(localStorage.getItem('python_deleted_products')) || [];
        const status = stockMap[product.id] || product.stockStatus || (product.stock === 0 ? 'out_of_stock' : 'in_stock');
        if (status === 'out_of_stock' || deletedList.includes(product.id)) {
            showNotification(`❌ ${name} is currently Out of Stock!`);
            return;
        }
    }
    const existingItem = cart.find(item => item.name === name && item.size === size && item.color === color);
    if (existingItem) {
        existingItem.quantity += parseInt(quantity);
    } else {
        cart.push({ name: name, price: price, quantity: parseInt(quantity), image: image, size: size, color: color });
    }
    saveCart();
    showNotification(`${name} added to cart!`);
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    renderCart();
}

function updateQuantity(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) removeFromCart(index);
    else { saveCart(); renderCart(); }
}

function saveCart() {
    localStorage.setItem('python_cart', JSON.stringify(cart));
    updateCartCount();
    if (typeof updateFreeDeliveryBar === 'function') updateFreeDeliveryBar();
}

function displayProducts(filteredProducts) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    grid.innerHTML = '';

    filteredProducts.forEach((p) => {
        const images = getProductImages(p);
        const sizeKeys = getProductSizes(p);
        const colors = getProductColors(p);
        const displayPrice = getProductDisplayPrice(p);
        const displayOldPrice = getProductDisplayOldPrice(p);
        const primaryColor = colors[0] || 'Default';

        let discountBadge = '';
        if (displayOldPrice && displayOldPrice > displayPrice) {
            const discountPercent = Math.round(((displayOldPrice - displayPrice) / displayOldPrice) * 100);
            discountBadge = `<span class="card-discount-badge">${discountPercent}% OFF</span>`;
        }

        const stockMap = JSON.parse(localStorage.getItem('python_product_stock_map')) || {};
        const deletedList = JSON.parse(localStorage.getItem('python_deleted_products')) || [];
        const stockStatus = stockMap[p.id] || p.stockStatus || (p.stock === 0 ? 'out_of_stock' : 'in_stock');
        const isOutOfStock = stockStatus === 'out_of_stock' || deletedList.includes(p.id);
        const stockBadge = isOutOfStock
            ? `<span class="card-stock-pill is-out">OUT OF STOCK</span>`
            : `<span class="card-stock-pill">IN STOCK</span>`;

        const wished = isInWishlist(p.id);
        const heartColor = wished ? 'color: #DC143C;' : 'color: var(--text-main);';
        const visibleSizes = sizeKeys.slice(0, 7);
        const visibleColors = colors.slice(0, 7);
        const imagery = images.map(img => `<img src="${escapeProductHtml(img)}" alt="${escapeProductHtml(p.name)}" loading="lazy" decoding="async" draggable="false" style="width:100%;flex:0 0 100%;height:100%;object-fit:contain;padding:18px;box-sizing:border-box;">`).join('');

        grid.innerHTML += `
        <div class="product-card product-card-large ${isOutOfStock ? 'out-of-stock' : ''}"
             data-product-id="${escapeProductHtml(p.id)}"
             onclick="window.location.href='product-detail.html?id=${p.id}'"
             onmouseenter="startHoverSlide('${p.id}', this.querySelector('.card-slider'))"
             onmouseleave="stopHoverSlide('${p.id}', this.querySelector('.card-slider'))"
             style="${isOutOfStock ? 'opacity: 0.72;' : ''}">

            <div class="product-image card-product-media">
                ${discountBadge}
                <div class="wishlist-overlay-btn" onclick="event.stopPropagation(); handleCardWishlistToggle('${p.id}', this)" title="Add to Wishlist">
                    <i data-lucide="heart" style="width: 17px; height: 17px; ${heartColor}" ${wished ? 'fill="#DC143C"' : ''}></i>
                </div>

                <div class="card-slider">
                    ${imagery}
                </div>
                ${images.length > 1 ? `
                <div class="card-slider-indicators">
                    ${images.map((_, idx) => `<div class="card-slider-indicator-dot ${idx === 0 ? 'active' : ''}"></div>`).join('')}
                </div>` : ''}
                ${p.badge ? `<span class="card-edit-badge">${escapeProductHtml(p.badge)}</span>` : ''}
            </div>

            <div class="product-info card-product-info">
                <div>
                    <div class="card-meta-row">
                        <span class="card-kicker">${p.badge ? escapeProductHtml(p.badge) : 'PYTHON ARCHIVE'}</span>
                        ${stockBadge}
                    </div>

                    <h3 class="card-product-title">${escapeProductHtml(p.name)}</h3>

                    ${visibleSizes.length ? `
                    <div class="card-sizes-strip">
                        ${visibleSizes.map(s => `<span class="size-pill">${escapeProductHtml(s)}</span>`).join('')}
                    </div>` : ''}

                    ${visibleColors.length ? `
                    <div class="card-colour-row" onclick="event.stopPropagation()">
                        <div class="card-colour-dots">
                            ${visibleColors.map((color, idx) => `
                                <button type="button"
                                        class="card-color-dot ${idx === 0 ? 'active' : ''}"
                                        data-color="${escapeProductHtml(color)}"
                                        data-label="${escapeProductHtml(getColorLabel(color, p))}"
                                        style="background:${escapeProductHtml(color)}"
                                        title="${escapeProductHtml(getColorLabel(color, p))}"
                                        aria-label="Select ${escapeProductHtml(getColorLabel(color, p))}"
                                        onclick="event.stopPropagation(); selectCardColor(this)"></button>
                            `).join('')}
                            ${colors.length > 7 ? `<span class="card-color-more">+${colors.length - 7}</span>` : ''}
                        </div>
                        <span class="card-colour-label">${escapeProductHtml(getColorLabel(primaryColor, p))}</span>
                    </div>` : ''}
                </div>

                <div class="card-product-foot">
                    <div class="card-price-line">
                        <span class="card-price-current">Rs. ${Number(displayPrice).toLocaleString()}</span>
                        ${displayOldPrice ? `<span class="card-price-old">Rs. ${Number(displayOldPrice).toLocaleString()}</span>` : ''}
                    </div>

                    ${isOutOfStock ? `
                    <button class="btn btn-outline card-add-to-cart" disabled>OUT OF STOCK</button>
                    ` : `
                    <button type="button" class="btn btn-primary card-add-to-cart" onclick="event.stopPropagation(); addCardToCart(event, '${p.id}')">
                        <i data-lucide="shopping-bag" style="width: 15px; height: 15px;"></i> ADD TO CART
                    </button>
                    `}
                </div>
            </div>
        </div>`;
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
    updateCartCount();
}

function selectCardColor(dot) {
    const card = dot.closest('.product-card, .fashion-card, .home-product-card');
    if (!card) return;
    card.querySelectorAll('.card-color-dot').forEach(item => item.classList.remove('active'));
    dot.classList.add('active');
    const label = card.querySelector('.card-colour-label');
    if (label) label.textContent = dot.dataset.label || dot.dataset.color || 'Selected';
}

function addCardToCart(event, productId) {
    if (event) event.stopPropagation();
    const card = event && event.currentTarget ? event.currentTarget.closest('.product-card, .fashion-card, .home-product-card') : null;
    const product = products.find(p => p.id === productId);
    if (!product) return;
    if (product.stock === 0 || product.stockStatus === 'out_of_stock') {
        showNotification('❌ This piece is currently out of stock.');
        return;
    }
    const activeColor = card ? card.querySelector('.card-color-dot.active') : null;
    const selectedColor = activeColor ? activeColor.dataset.color : (getProductColors(product)[0] || 'Default');
    const sizes = getProductSizes(product);
    const selectedSize = sizes[0] || 'Free';
    addToCart(product.name, getProductDisplayPrice(product), getProductImages(product)[0], selectedSize, selectedColor, 1);
}

let hoverIntervals = {};

function startHoverSlide(productId, sliderElement) {
    const p = products.find(prod => prod.id === productId);
    if (!p || !p.images || p.images.length <= 1) return;

    let currentIdx = 0;
    const container = sliderElement.parentElement;
    const dots = container.querySelectorAll('.card-slider-indicator-dot');

    hoverIntervals[productId] = setInterval(() => {
        currentIdx = (currentIdx + 1) % p.images.length;
        sliderElement.style.transform = `translateX(-${currentIdx * 100}%)`;

        dots.forEach((dot, idx) => {
            if (idx === currentIdx) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }, 1000);
}

function stopHoverSlide(productId, sliderElement) {
    if (hoverIntervals[productId]) {
        clearInterval(hoverIntervals[productId]);
        delete hoverIntervals[productId];
    }
    sliderElement.style.transform = 'translateX(0)';

    const container = sliderElement.parentElement;
    const dots = container.querySelectorAll('.card-slider-indicator-dot');
    dots.forEach((dot, idx) => {
        if (idx === 0) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

// --- Shop Filtering System ---
let currentCategory = 'All';
let currentSubcategory = 'All';
let currentGSM = 'all';
let currentSizeFilter = 'All';
let searchQuery = '';

// true only when a *specific* (non-All) value is chosen
let categorySelected = false;
let subcategorySelected = false;

function handleSearch(val) {
    searchQuery = val.trim().toLowerCase();
    filterShop();
}

function selectSizeFilter(size, btn) {
    currentSizeFilter = size;
    document.querySelectorAll('.size-filter-btn').forEach(b => {
        const attr = b.getAttribute('onclick') || '';
        if (attr.includes(`'${size}'`)) {
            b.classList.add('active');
        } else {
            b.classList.remove('active');
        }
    });
    filterShop();
}

function scrollToActiveButtonInContainer(containerSelector, activeSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    const activeBtn = container.querySelector(activeSelector);
    if (!activeBtn) return;

    const containerWidth = container.getBoundingClientRect().width;
    const btnWidth = activeBtn.getBoundingClientRect().width;
    const btnLeft = activeBtn.offsetLeft;

    container.scrollTo({
        left: btnLeft - (containerWidth / 2) + (btnWidth / 2),
        behavior: 'smooth'
    });
}

function updateFilterVisibility() {
    const categoryRow = document.getElementById('category-row-wrapper');
    const subcategoryRow = document.getElementById('subcategory-row-wrapper');
    const gsmRow = document.getElementById('gsm-row-wrapper');

    // Category row is always visible
    if (categoryRow) categoryRow.classList.add('visible');

    // Subcategory row only appears when a specific category (not 'All') is active
    if (subcategoryRow) {
        if (categorySelected) {
            subcategoryRow.classList.add('visible');
        } else {
            subcategoryRow.classList.remove('visible');
        }
    }

    // GSM row only appears when a specific subcategory (not 'All') is active
    if (gsmRow) {
        if (categorySelected && subcategorySelected) {
            gsmRow.classList.add('visible');
        } else {
            gsmRow.classList.remove('visible');
        }
    }
}

function selectCategory(cat, btn) {
    currentCategory = cat;
    // categorySelected = true only for a real category, not 'All'
    categorySelected = (cat !== 'All');
    // Whenever category changes, reset subcategory
    currentSubcategory = 'All';
    subcategorySelected = false;
    currentGSM = 'all';
    // Reset subcategory buttons to 'All'
    document.querySelectorAll('.subcategory-btn').forEach(b => {
        const onclickAttr = b.getAttribute('onclick') || '';
        if (onclickAttr.includes("'All'")) {
            b.classList.add('active');
        } else {
            b.classList.remove('active');
        }
    });
    // Reset GSM buttons to 'all'
    document.querySelectorAll('.gsm-btn').forEach(b => {
        const onclickAttr = b.getAttribute('onclick') || '';
        if (onclickAttr.includes("'all'")) {
            b.classList.add('active');
        } else {
            b.classList.remove('active');
        }
    });
    document.querySelectorAll('.category-btn').forEach(b => {
        const onclickAttr = b.getAttribute('onclick') || '';
        if (onclickAttr.includes(`'${cat}'`)) {
            b.classList.add('active');
        } else {
            b.classList.remove('active');
        }
    });
    updateFilterVisibility();
    filterShop();
    setTimeout(() => {
        scrollToActiveButtonInContainer('#category-row-wrapper .filter-scroll-container', '.category-btn.active');
    }, 100);
}

function selectSubcategory(subcat, btn) {
    currentSubcategory = subcat;
    // subcategorySelected = true only for a real subcategory, not 'All'
    subcategorySelected = (subcat !== 'All');
    // Reset GSM when subcategory changes
    currentGSM = 'all';
    document.querySelectorAll('.gsm-btn').forEach(b => {
        const onclickAttr = b.getAttribute('onclick') || '';
        if (onclickAttr.includes("'all'")) {
            b.classList.add('active');
        } else {
            b.classList.remove('active');
        }
    });
    document.querySelectorAll('.subcategory-btn').forEach(b => {
        const onclickAttr = b.getAttribute('onclick') || '';
        if (onclickAttr.includes(`'${subcat}'`)) {
            b.classList.add('active');
        } else {
            b.classList.remove('active');
        }
    });
    updateFilterVisibility();
    filterShop();
    setTimeout(() => {
        scrollToActiveButtonInContainer('#subcategory-row-wrapper .filter-scroll-container', '.subcategory-btn.active');
    }, 100);
}

function selectGSM(gsm, btn) {
    currentGSM = gsm;
    document.querySelectorAll('.gsm-btn').forEach(b => {
        const onclickAttr = b.getAttribute('onclick') || '';
        if (onclickAttr.includes(`'${gsm}'`)) {
            b.classList.add('active');
        } else {
            b.classList.remove('active');
        }
    });
    filterShop();
    setTimeout(() => {
        scrollToActiveButtonInContainer('#gsm-row-wrapper .filter-scroll-container', '.gsm-btn.active');
    }, 100);
}

let currentShopCategory = 'All';
let currentShopBadge = 'All';

function selectShopCategory(catName) {
    currentShopCategory = catName || 'All';
    document.querySelectorAll('.shop-cat-pill').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === currentShopCategory);
    });
    filterShop();
}
window.selectShopCategory = selectShopCategory;

function selectShopBadge(badge) {
    const target = badge || 'All';
    // Tapping the already-active collection again clears it back to All
    currentShopBadge = (target !== 'All' && currentShopBadge === target) ? 'All' : target;
    document.querySelectorAll('.shop-badge-pill').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.badge === currentShopBadge);
    });
    filterShop();
}
window.selectShopBadge = selectShopBadge;

function filterShop() {
    let filtered = products.filter(p => !p.isDeleted);

    // Dynamic Category filter
    if (currentShopCategory && currentShopCategory !== 'All') {
        filtered = filtered.filter(p => {
            const cat = String(p.category || '').toLowerCase().trim();
            return cat === currentShopCategory.toLowerCase().trim();
        });
    }

    // Promo badge quick filter: New Drop / Best Seller / Hot / Limited
    if (currentShopBadge && currentShopBadge !== 'All') {
        const normalizeBadge = v => String(v || '').toUpperCase().replace(/[^A-Z]/g, '');
        const targetBadge = normalizeBadge(currentShopBadge);
        filtered = filtered.filter(p => normalizeBadge(p.badge) === targetBadge);
    }

    // Size filter (sizes are stored as an object in Firestore)
    if (currentSizeFilter !== 'All') {
        filtered = filtered.filter(p => {
            return getProductSizes(p).some(size => String(size).toUpperCase() === currentSizeFilter.toUpperCase());
        });
    }

    // Search across the product's editorial content, colours, and specifications.
    if (searchQuery !== '') {
        filtered = filtered.filter(p => {
            const name = String(p.name || '').toLowerCase();
            const desc = String(p.desc || '').toLowerCase();
            const specs = Object.entries(p.specifications || {})
                .map(([key, value]) => `${key} ${value}`)
                .join(' ')
                .toLowerCase();
            const colours = getProductColors(p).map(c => getColorLabel(c, p)).join(' ').toLowerCase();
            const sizes = getProductSizes(p).join(' ').toLowerCase();
            const haystack = `${name} ${desc} ${specs} ${colours} ${sizes}`;
            return searchQuery.split(/\s+/).every(token => haystack.includes(token));
        });
    }

    displayProducts(filtered);

    const grid = document.getElementById('product-grid');
    if (grid && filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 80px 20px; animation: fadeIn 0.5s ease;">
                <div style="display: inline-block; padding: 44px 54px; border-radius: 0; border: 1px dashed var(--border-color); max-width: 470px; background: #FAFAFA;">
                    <i data-lucide="shopping-bag" style="width: 48px; height: 48px; color: var(--dark-red); margin-bottom: 20px; stroke-width: 1.5;"></i>
                    <h3 style="margin-bottom: 10px; font-weight: 900; font-size: 1.3rem; letter-spacing: 1px;">NO PIECES FOUND</h3>
                    <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.6;">Try a different search term or explore the full archive. New pieces are added regularly.</p>
                </div>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// Kept as a safe entry point for older storefront links. Categories are no longer used.
function filterProducts() {
    currentSizeFilter = 'All';
    document.querySelectorAll('.size-filter-btn').forEach(btn => {
        btn.classList.toggle('active', (btn.getAttribute('onclick') || '').includes("'All'"));
    });
    filterShop();
}


function renderCart() {
    const cartContainer = document.getElementById('cart-items');
    const totalElement = document.getElementById('cart-total');
    if (!cartContainer) return;
    if (cart.length === 0) {
        cartContainer.innerHTML = '<div style="text-align: center; padding: 50px; color: var(--text-muted);">Your cart is empty.</div>';
        if (totalElement) totalElement.innerText = 'Rs. 0.00';
        return;
    }
    let html = '', total = 0, totalQty = 0;
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        totalQty += item.quantity;
        html += `
            <div class="cart-item glass" style="display: flex; justify-content: space-between; align-items: center; padding: 20px; margin-bottom: 15px;">
                <div style="display: flex; align-items: center; gap: 20px;">
                    <img src="${item.image}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 10px;">
                    <div>
                        <h4 style="margin: 0;">${item.name}</h4>
                        <p style="color: var(--text-muted); font-size: 0.8rem; margin: 2px 0;">Size: ${item.size} | Color: ${getColorName(item.color)}</p>
                        <p style="color: #000; font-weight: 800; margin: 5px 0 0;">Rs. ${itemTotal.toLocaleString()}</p>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="display: flex; align-items: center; gap: 10px; background: rgba(0,0,0,0.05); padding: 5px 10px; border-radius: 8px;">
                        <button onclick="updateQuantity(${index}, -1)" class="btn-qty">-</button>
                        <span style="min-width: 20px; text-align: center; font-weight: 800;">${item.quantity}</span>
                        <button onclick="updateQuantity(${index}, 1)" class="btn-qty">+</button>
                    </div>
                    <button onclick="removeFromCart(${index})" style="background: none; border: none; color: #ff4444; cursor: pointer;"><i data-lucide="trash-2" style="width: 18px;"></i></button>
                </div>
            </div>`;
    });

    const freeDeliveryItemThreshold = 4;
    const progressPercent = Math.min(100, (totalQty / freeDeliveryItemThreshold) * 100);
    const itemsNeeded = freeDeliveryItemThreshold - totalQty;

    let deliveryMessage = '';
    if (itemsNeeded > 0) {
        deliveryMessage = `Add <strong>${itemsNeeded} more item(s)</strong> to get <strong>FREE delivery</strong>!`;
    } else {
        deliveryMessage = `🎉 Congrats! You have unlocked <strong>FREE delivery</strong> (4+ Items)!`;
    }

    const progressColor = itemsNeeded <= 0 ? '#22c55e' : 'var(--text-main)';
    const progressBarHtml = `<div class="glass" style="padding: 15px 20px; margin-bottom: 20px; border: 1px solid var(--border-color); background: var(--surface); border-radius: 16px;">
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 8px; color: var(--text-main);">
            <span>${deliveryMessage}</span>
            <span style="font-weight: 800; color: ${progressColor};">${Math.round(progressPercent)}%</span>
        </div>
        <div style="width: 100%; height: 8px; background: var(--primary-light); border-radius: 10px; overflow: hidden;">
            <div style="width: ${progressPercent}%; height: 100%; background: linear-gradient(90deg, #ff5238, #ff1e38); transition: width 0.4s ease; border-radius: 10px;"></div>
        </div>
    </div>`;

    cartContainer.innerHTML = progressBarHtml + html;
    if (totalElement) totalElement.innerText = `Rs. ${total.toLocaleString()}.00`;

    const shippingEl = document.getElementById('cart-shipping') || document.querySelector('.cart-summary div:nth-child(2) span:last-child');
    if (shippingEl) {
        shippingEl.innerText = totalQty >= 4 ? 'FREE' : 'Rs. 500.00';
        if (totalQty >= 4) {
            shippingEl.style.color = '#22c55e';
            shippingEl.style.fontWeight = '800';
        } else {
            shippingEl.style.color = 'var(--text-main)';
            shippingEl.style.fontWeight = '700';
        }
    }

    lucide.createIcons();
}

// --- Auth System ---
// The cached session in localStorage is the UI's source of truth. Firebase Auth
// is used as the credential provider when it is available. If Authentication is
// not enabled for the project yet, accounts are still saved to Firestore and
// localStorage so signup/login keep working (no redirect loops).
function readStoredUser() {
    try {
        return JSON.parse(localStorage.getItem('python_user')) || null;
    } catch (e) {
        return null;
    }
}

let currentUser = readStoredUser();

function saveSession(userData) {
    if (!userData) return null;
    const cleanUser = Object.assign({}, userData);
    delete cleanUser.password;
    delete cleanUser.passwordHash;
    delete cleanUser.passwordAlgo;
    delete cleanUser.passwordHashFallback;
    const sessionUser = Object.assign({}, cleanUser, { sessionStartedAt: Date.now() });
    try {
        localStorage.setItem('python_user', JSON.stringify(sessionUser));
    } catch (e) {
        console.warn('Could not persist session:', e);
    }
    currentUser = sessionUser;
    return sessionUser;
}

function clearSession() {
    try { localStorage.removeItem('python_user'); } catch (e) {}
    currentUser = null;
}

function getPostLoginRedirect() {
    let redirectUrl = sessionStorage.getItem('redirect_after_login') || 'profile.html';
    sessionStorage.removeItem('redirect_after_login');
    // Never bounce the user back to an auth page (avoids login redirect loops).
    if (/^(login|signup|reset-password)\.html/i.test(redirectUrl)) {
        redirectUrl = 'profile.html';
    }
    return redirectUrl;
}

function goToPostLoginPage() {
    window.location.href = getPostLoginRedirect();
}

// --- Password helpers for the Firestore/local fallback accounts ---
function simplePasswordHash(raw) {
    let h = 5381;
    const text = String(raw || '');
    for (let i = 0; i < text.length; i++) {
        h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
    }
    return 'djb2_' + h.toString(16);
}

async function hashPassword(password, forcedAlgo) {
    const raw = String(password || '');
    const fallbackHash = simplePasswordHash(raw);
    const algo = forcedAlgo || ((window.crypto && window.crypto.subtle) ? 'sha256' : 'djb2');
    if (algo === 'sha256' && window.crypto && window.crypto.subtle && window.TextEncoder) {
        try {
            const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
            const hex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
            return { passwordHash: hex, passwordAlgo: 'sha256', passwordHashFallback: fallbackHash };
        } catch (e) {
            return { passwordHash: fallbackHash, passwordAlgo: 'djb2', passwordHashFallback: fallbackHash };
        }
    }
    return { passwordHash: fallbackHash, passwordAlgo: 'djb2', passwordHashFallback: fallbackHash };
}

async function passwordMatches(account, password) {
    if (!account) return false;
    const raw = String(password || '');
    if (account.passwordHash) {
        if (account.passwordHashFallback && account.passwordHashFallback === simplePasswordHash(raw)) return true;
        const hashed = await hashPassword(raw, account.passwordAlgo || 'sha256');
        if (hashed.passwordHash === account.passwordHash) return true;
        // Handles accounts created on a secure origin but verified on a non-secure one.
        return simplePasswordHash(raw) === account.passwordHash;
    }
    // Legacy plain-text entries saved by older versions of the site.
    return typeof account.password === 'string' && account.password === password;
}

// --- Local account registry ---
function getLocalAccounts() {
    try {
        return JSON.parse(localStorage.getItem('python_accounts')) || [];
    } catch (e) {
        return [];
    }
}

function saveLocalUser(userData, password) {
    // Async so callers can wait before navigating away.
    return (async () => {
        try {
            const accounts = getLocalAccounts();
            const entry = Object.assign({}, userData);
            if (password) {
                Object.assign(entry, await hashPassword(password));
            }
            const existingIndex = accounts.findIndex(a => a.email && userData.email && a.email.toLowerCase() === userData.email.toLowerCase());
            if (existingIndex >= 0) accounts[existingIndex] = entry;
            else accounts.push(entry);
            localStorage.setItem('python_accounts', JSON.stringify(accounts));
        } catch (e) {
            console.warn('Error saving local account backup:', e);
        }
    })();
}

async function findLocalUser(email, password) {
    const account = getLocalAccounts().find(a => a.email && email && a.email.toLowerCase() === email.toLowerCase());
    if (!account) return null;
    return (await passwordMatches(account, password)) ? account : null;
}

async function findFirestoreUser(email, password) {
    if (typeof db === 'undefined' || !db || !email) return null;
    try {
        const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        const data = doc.data() || {};
        if (data.blocked === true) {
            const blockedErr = new Error('BLOCKED');
            blockedErr.code = 'BLOCKED';
            throw blockedErr;
        }
        // Firebase Auth accounts do not store a password in Firestore.
        if (!data.passwordHash && !data.password) return null;
        if (!(await passwordMatches(data, password))) return null;
        return Object.assign({}, data, { uid: doc.id });
    } catch (e) {
        if (e && e.code === 'BLOCKED') throw e;
        console.warn('Firestore account lookup failed:', e);
        return null;
    }
}

async function findFallbackUser(email, password) {
    const localAccount = await findLocalUser(email, password);
    if (localAccount) return localAccount;
    return findFirestoreUser(email, password);
}

// Sync the cached session with Firebase Auth when it is available.
if (typeof auth !== 'undefined' && auth) {
    auth.onAuthStateChanged(user => {
        if (user) {
            db.collection('users').doc(user.uid).get().then(doc => {
                const firestoreData = doc.exists ? (doc.data() || {}) : {};
                if (firestoreData.blocked === true) {
                    auth.signOut().catch(() => {});
                    clearSession();
                    return;
                }
                const syncedUser = doc.exists
                    ? {
                        uid: user.uid,
                        name: firestoreData.name || user.displayName || user.email.split('@')[0],
                        email: user.email,
                        phone: firestoreData.phone || '',
                        address: firestoreData.address || '',
                        clubPoints: firestoreData.clubPoints || 0,
                        authProvider: 'firebase'
                    }
                    : {
                        uid: user.uid,
                        name: user.displayName || user.email.split('@')[0],
                        email: user.email,
                        authProvider: 'firebase'
                    };
                saveSession(syncedUser);
                if (!doc.exists) {
                    // Auto-create Firestore doc for Auth users who have none yet so they immediately show in database.html.
                    const newUserData = {
                        uid: user.uid,
                        name: user.displayName || (user.email ? user.email.split('@')[0] : 'Member'),
                        email: user.email || '',
                        phone: user.phoneNumber || '',
                        address: '',
                        authProvider: 'firebase',
                        createdAt: new Date().toISOString()
                    };
                    db.collection('users').doc(user.uid)
                        .set(newUserData, { merge: true })
                        .then(() => console.log('✅ Auto-created Firestore user profile:', user.uid))
                        .catch(err => console.warn('Auto user doc create failed:', err));
                }
                startNotificationListener();
                startBlacklistWatcher(user.uid, user.email);
            }).catch(err => {
                console.error("Error syncing user profile:", err);
                saveSession({
                    uid: user.uid,
                    name: user.displayName || user.email.split('@')[0],
                    email: user.email,
                    authProvider: 'firebase'
                });
                startNotificationListener();
                startBlacklistWatcher(user.uid, user.email);
            });
        } else {
            // Do NOT wipe a cached session here. When Firebase Auth is not enabled
            // (or browser persistence is unavailable) this callback fires with null
            // right after a successful local login, which caused the login loop.
            // The session is only removed by logout().
            currentUser = readStoredUser();
            if (!currentUser && notificationListenerUnsubscribe) {
                notificationListenerUnsubscribe();
                notificationListenerUnsubscribe = null;
            }
        }
    });
}

// ── Blacklist / Ban Watcher ─────────────────────────────────────────────────
let _blacklistUnsubscribe = null;

function startBlacklistWatcher(uid, email) {
    if (!db || !auth) return;
    // Unsubscribe previous watcher if any
    if (_blacklistUnsubscribe) { try { _blacklistUnsubscribe(); } catch(e) {} }

    function forceSignOut() {
        clearSession();
        try { localStorage.removeItem('python_user'); } catch(e) {}
        auth.signOut().catch(() => {});
        // Redirect to login with ban notice
        window.location.href = 'login.html?banned=1';
    }

    // 1. Watch user's own Firestore document for blacklisted: true
    if (uid) {
        _blacklistUnsubscribe = db.collection('users').doc(uid).onSnapshot(doc => {
            if (!doc.exists) {
                // Document deleted by admin → force sign out
                forceSignOut();
                return;
            }
            const data = doc.data() || {};
            if (data.blacklisted === true) {
                forceSignOut();
            }
        }, () => {});
    }

    // 2. Also watch the blacklist collection by email key
    if (email) {
        const emailKey = email.toLowerCase().replace(/./g, '_');
        db.collection('blacklist').doc(emailKey).onSnapshot(doc => {
            if (doc.exists) forceSignOut();
        }, () => {});
    }
}
// ────────────────────────────────────────────────────────────────────────────

function login(email, password, onError) {
    email = (email || '').trim();

    // 1. Admin shortcut check
    if (email.toLowerCase() === 'pythonstore@gmail.com' && password === 'python123') {
        sessionStorage.setItem('python_admin_session', 'authenticated');
        sessionStorage.setItem('python_admin_email', 'pythonstore@gmail.com');
        localStorage.setItem('python_admin_session', 'authenticated');
        localStorage.setItem('python_admin_email', 'pythonstore@gmail.com');
        window.location.href = 'database.html';
        return;
    }

    const finishWithAccount = async (account) => {
        const sessionUser = saveSession(account);
        await saveLocalUser(sessionUser || account, password);
        goToPostLoginPage();
    };

    if (typeof auth === 'undefined' || !auth) {
        findFallbackUser(email, password).then(account => {
            if (account) return finishWithAccount(account);
            if (onError) onError('Email හෝ Password වැරදියි. නැවත උත්සාහ කරන්න.');
        }).catch(err => {
            const msg = (err && err.code === 'BLOCKED')
                ? '⛔ ඔබගේ account block කර ඇත. Admin හා සම්බන්ධ වන්න.'
                : 'Email හෝ Password වැරදියි. නැවත උත්සාහ කරන්න.';
            if (onError) onError(msg);
        });
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then(async (userCredential) => {
            const user = userCredential.user;
            let profile = null;

            if (typeof db !== 'undefined' && db) {
                try {
                    const doc = await db.collection('users').doc(user.uid).get();
                    if (doc.exists) {
                        const data = doc.data() || {};
                        if (data.blocked === true) {
                            await auth.signOut().catch(() => {});
                            clearSession();
                            if (onError) onError('⛔ ඔබගේ account block කර ඇත. Admin හා සම්බන්ධ වන්න.');
                            return;
                        }
                        profile = {
                            uid: user.uid,
                            name: data.name || user.displayName || user.email.split('@')[0],
                            email: user.email,
                            phone: data.phone || '',
                            address: data.address || '',
                            clubPoints: data.clubPoints || 0,
                            authProvider: 'firebase'
                        };
                    } else {
                        profile = {
                            uid: user.uid,
                            name: user.displayName || user.email.split('@')[0],
                            email: user.email,
                            authProvider: 'firebase'
                        };
                        db.collection('users').doc(user.uid)
                            .set(Object.assign({}, profile, { createdAt: new Date().toISOString() }), { merge: true })
                            .catch(() => {});
                    }
                } catch (err) {
                    console.warn('Firestore profile read failed:', err);
                }
            }

            if (!profile) {
                profile = {
                    uid: user.uid,
                    name: user.displayName || user.email.split('@')[0],
                    email: user.email,
                    authProvider: 'firebase'
                };
            }

            saveSession(profile);
            await saveLocalUser(profile, password);
            goToPostLoginPage();
        })
        .catch((error) => {
            console.warn('Firebase login attempt caught:', error);

            // Firebase Auth may not be enabled for this project yet. Fall back to
            // the Firestore/local account store so registered users can still log in.
            findFallbackUser(email, password).then(account => {
                if (account) return finishWithAccount(account);

                let msg = 'Email හෝ Password වැරදියි. නැවත උත්සාහ කරන්න.';
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') msg = 'Email හෝ Password වැරදියි.';
                else if (error.code === 'auth/invalid-email') msg = 'Email format එක වැරදියි.';
                else if (error.code === 'auth/too-many-requests') msg = 'ඉතා වාර ගණනක් try කළා. ටිකක් wait කරලා try කරන්න.';
                else if (error.code === 'auth/user-disabled') msg = '⛔ මෙම account එක disable කර ඇත.';
                if (onError) onError(msg); else alert(msg);
            }).catch(err => {
                if (err && err.code === 'BLOCKED') {
                    if (onError) onError('⛔ ඔබගේ account block කර ඇත. Admin හා සම්බන්ධ වන්න.');
                } else if (onError) {
                    onError('Email හෝ Password වැරදියි. නැවත උත්සාහ කරන්න.');
                }
            });
        });
}

function signup(name, email, password, phone, address, onError) {
    email = (email || '').trim();
    name = (name || '').trim();
    phone = (phone || '').trim();
    address = (address || '').trim();

    if (!email || !name) {
        if (onError) onError('කරුණාකර සියලු විස්තර ඇතුළත් කරන්න.');
        return;
    }

    const fail = (msg) => { if (onError) onError(msg); else alert(msg); };

    // Used when Firebase Auth is unavailable (not enabled / provider disabled).
    // The account is still written to Firestore + localStorage so signup works.
    const createFallbackAccount = async () => {
        if (getLocalAccounts().some(a => a.email && a.email.toLowerCase() === email.toLowerCase())) {
            fail('මෙම Email ලිපිනයෙන් දැනටමත් Account එකක් පවතී. කරුණාකර Login වන්න.');
            return;
        }

        if (typeof db !== 'undefined' && db) {
            try {
                const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();
                if (!snapshot.empty) {
                    fail('මෙම Email ලිපිනයෙන් දැනටමත් Account එකක් පවතී. කරුණාකර Login වන්න.');
                    return;
                }
            } catch (e) {
                console.warn('Firestore duplicate check failed:', e);
            }
        }

        const localUid = 'usr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const credentials = await hashPassword(password);
        const userData = Object.assign({
            uid: localUid,
            name: name,
            email: email,
            phone: phone,
            address: address,
            authProvider: 'local',
            createdAt: new Date().toISOString()
        }, credentials);

        saveSession(userData);
        await saveLocalUser(userData, password);

        if (typeof db !== 'undefined' && db) {
            try {
                await db.collection('users').doc(localUid).set(userData);
                console.log('✅ Fallback user successfully saved to Firestore users collection:', localUid);
            } catch (e) {
                console.error('Firestore fallback write error:', e);
            }
        }

        setTimeout(() => {
            goToPostLoginPage();
        }, 350);
    };

    if (getLocalAccounts().some(a => a.email && a.email.toLowerCase() === email.toLowerCase())) {
        fail('මෙම Email ලිපිනයෙන් දැනටමත් Account එකක් පවතී. කරුණාකර Login වන්න.');
        return;
    }

    if (typeof auth === 'undefined' || !auth) {
        createFallbackAccount();
        return;
    }

    const startFirebaseSignup = () => {
    auth.createUserWithEmailAndPassword(email, password)
        .then(async (userCredential) => {
            const user = userCredential.user;
            const userData = {
                uid: user.uid,
                name: name,
                email: email,
                phone: phone,
                address: address,
                authProvider: 'firebase',
                createdAt: new Date().toISOString()
            };

            if (user && user.updateProfile) {
                user.updateProfile({ displayName: name }).catch(e => console.warn('Display name update error:', e));
            }

            saveSession(userData);
            await saveLocalUser(userData, password);

            if (typeof db !== 'undefined' && db) {
                try {
                    await db.collection('users').doc(user.uid).set(userData, { merge: true });
                    console.log('✅ User profile successfully saved to Firestore users collection:', user.uid);
                } catch (err) {
                    console.error('Firestore write error during signup:', err);
                }
            }

            // Small delay to ensure Firestore network socket has completed the write
            setTimeout(() => {
                goToPostLoginPage();
            }, 350);
        })
        .catch((error) => {
            console.warn('Firebase Auth signup message:', error.code, error.message);

            // Only show user errors for real input issues.
            if (error.code === 'auth/email-already-in-use') {
                fail('මෙම Email ලිපිනයෙන් දැනටමත් Account එකක් තිබේ. කරුණාකර Login වන්න.');
                return;
            }
            if (error.code === 'auth/invalid-email') {
                fail('වලංගු Email ලිපිනයක් ඇතුළත් කරන්න.');
                return;
            }
            if (error.code === 'auth/weak-password') {
                fail('Password එකට අවම වශයෙන් අකුරු 6ක් ඇතුළත් කරන්න.');
                return;
            }

            if (error.code === 'auth/configuration-not-found' || error.code === 'auth/operation-not-allowed') {
                console.warn('Firebase Authentication (Email/Password) is not enabled for this project. Enable it in Firebase Console → Authentication → Sign-in method. Using the Firestore fallback for now.');
            }

            // Auth unavailable — complete the registration via Firestore.
            createFallbackAccount();
        });
    };

    // Avoid creating a duplicate account when an older Firestore-only account exists.
    if (typeof db !== 'undefined' && db) {
        db.collection('users').where('email', '==', email).limit(1).get()
            .then(snapshot => {
                if (!snapshot.empty) {
                    fail('මෙම Email ලිපිනයෙන් දැනටමත් Account එකක් පවතී. කරුණාකර Login වන්න.');
                } else {
                    startFirebaseSignup();
                }
            })
            .catch(() => startFirebaseSignup());
    } else {
        startFirebaseSignup();
    }
}

function logout() {
    const finish = () => {
        clearSession();
        window.location.href = 'login.html';
    };
    if (typeof auth !== 'undefined' && auth) {
        auth.signOut().then(finish).catch(finish);
    } else {
        finish();
    }
}

function showNotification(message) {
    const note = document.createElement('div');
    note.className = 'glass';
    note.style.cssText = `position: fixed; bottom: 20px; right: 20px; padding: 15px 30px; border-left: 4px solid #DC143C; z-index: 10001; background: white;`;
    note.innerText = message;
    document.body.appendChild(note);
    setTimeout(() => { note.style.opacity = '0'; note.style.transition = '0.5s'; setTimeout(() => note.remove(), 500); }, 3000);
}

let notificationListenerUnsubscribe = null;

function startNotificationListener() {
    if (typeof db === 'undefined' || !db || !currentUser || !currentUser.email) return;

    if (notificationListenerUnsubscribe) {
        notificationListenerUnsubscribe();
    }

    notificationListenerUnsubscribe = db.collection('notifications')
        .where('userEmail', '==', currentUser.email)
        .where('read', '==', false)
        .onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const notif = change.doc.data();
                    const docId = change.doc.id;

                    showCustomerNotification(notif.message, notif.status);

                    db.collection('notifications').doc(docId).update({ read: true })
                        .catch(err => console.error("Error marking notification as read:", err));
                }
            });
        }, err => {
            console.error("Error in notification listener:", err);
        });
}

function showCustomerNotification(message, status) {
    // Play audio alert
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            const ctx = new AudioContext();
            const playTone = (freq, start, duration) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.setValueAtTime(freq, start);
                gain.gain.setValueAtTime(0.2, start);
                gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
                osc.start(start);
                osc.stop(start + duration);
            };
            const now = ctx.currentTime;
            if (status === 'confirmed') {
                playTone(523.25, now, 0.15); // C5
                playTone(659.25, now + 0.1, 0.3); // E5
            } else {
                playTone(392.00, now, 0.15); // G4
                playTone(311.13, now + 0.1, 0.3); // D#4 (sad tone)
            }
        }
    } catch (e) {
        console.warn("Could not play customer notification sound:", e);
    }

    const note = document.createElement('div');
    note.className = 'glass';
    const borderLeftColor = status === 'confirmed' ? '#22c55e' : (status === 'cancelled' ? '#ef4444' : '#DC143C');
    const titleEmoji = status === 'confirmed' ? '✅' : (status === 'cancelled' ? '❌' : '🔔');

    note.style.cssText = `
        position: fixed; 
        bottom: 24px; 
        right: 24px; 
        padding: 16px 24px; 
        border-left: 4px solid ${borderLeftColor}; 
        z-index: 10001; 
        background: var(--surface, white);
        color: var(--text-main, #000);
        box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        border-radius: 12px;
        font-family: inherit;
        display: flex;
        align-items: center;
        gap: 12px;
        transform: translateY(20px);
        opacity: 0;
        transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s;
    `;

    note.innerHTML = `
        <span style="font-size: 1.2rem;">${titleEmoji}</span>
        <div style="font-size: 0.9rem; font-weight: 700;">${message}</div>
    `;

    document.body.appendChild(note);

    setTimeout(() => {
        note.style.transform = 'translateY(0)';
        note.style.opacity = '1';
    }, 10);

    setTimeout(() => {
        note.style.transform = 'translateY(-20px)';
        note.style.opacity = '0';
        setTimeout(() => note.remove(), 400);
    }, 4500);
}

function generateUniqueOrderID() {
    let id = '';
    let isUnique = false;
    let attempts = 0;
    const existingOrders = (typeof orders !== 'undefined' && Array.isArray(orders)) ? orders : [];
    while (!isUnique && attempts < 100) {
        attempts++;
        const rand8 = Math.floor(10000000 + Math.random() * 90000000);
        id = `PS-ORD-${rand8}`;
        const exists = existingOrders.some(o => o.id === id);
        if (!exists) isUnique = true;
    }
    return id || `PS-ORD-${Math.floor(10000000 + Math.random() * 90000000)}`;
}
window.generateUniqueOrderID = generateUniqueOrderID;

// --- Order System ---
let orders = JSON.parse(localStorage.getItem('python_orders')) || [];

function showRedOrderLoader(callback) {
    let loader = document.getElementById('red-order-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'red-order-loader';
        loader.className = 'red-loader-overlay';
        loader.innerHTML = `
            <div class="red-loader-content">
                <div class="red-spinner-ring"></div>
                <div class="red-loader-text">Placing <span>Your Order</span></div>
                <div class="red-loader-subtext">Please wait while we process your details...</div>
                <div class="red-progress-bar">
                    <div class="red-progress-fill" id="red-loader-bar"></div>
                </div>
            </div>
        `;
        document.body.appendChild(loader);
    }
    loader.classList.add('active');
    const fillBar = document.getElementById('red-loader-bar');
    if (fillBar) {
        fillBar.style.width = '0%';
        setTimeout(() => { fillBar.style.width = '100%'; }, 50);
    }
    setTimeout(() => {
        loader.classList.remove('active');
        if (callback) callback();
    }, 2000);
}

function showOrderSuccessModal(orderData, subtotal, deliveryFee, grandTotal, whatsappUrl, invoiceUrl) {
    let modal = document.getElementById('order-success-modal');
    if (modal) modal.remove();

    const itemsSummaryHtml = (Array.isArray(orderData.items) ? orderData.items : []).map(it => {
        const itemImg = it.image || 'logo.png';
        const itemColor = getColorName(it.color || 'Classic');
        const itemSize = it.size || 'Free';
        const itemQty = it.quantity || 1;
        const lineTotal = (it.price || 0) * itemQty;
        return `
            <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:8px 0; border-bottom:1px solid #f1f5f9;">
                <div style="display:flex; align-items:center; gap:10px; min-width: 0;">
                    <img src="${itemImg}" style="width:38px; height:38px; border-radius:8px; object-fit:cover; border:1px solid #e2e8f0; flex-shrink:0;" onerror="this.src='logo.png'">
                    <div style="min-width: 0;">
                        <div style="font-weight:800; font-size:0.82rem; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${it.name}</div>
                        <div style="font-size:0.72rem; color:#64748b;">${itemSize} • ${itemColor} × ${itemQty}</div>
                    </div>
                </div>
                <div style="font-weight:900; font-size:0.84rem; color:#0f172a; white-space:nowrap; font-family:'League Spartan', 'Anta', monospace;">Rs. ${lineTotal.toLocaleString()}.00</div>
            </div>
        `;
    }).join('');

    const invoiceLink = `invoice.html?data=${encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(orderData)))))}`;

    modal = document.createElement('div');
    modal.id = 'order-success-modal';
    modal.className = 'order-success-modal-overlay active';
    modal.innerHTML = `
        <style>
            #order-success-modal {
                position: fixed;
                inset: 0;
                background: rgba(10, 10, 10, 0.75);
                backdrop-filter: blur(8px);
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 16px;
                box-sizing: border-box;
            }
            .order-success-card {
                background: #FFFFFF;
                width: 100%;
                max-width: 580px;
                max-height: 92vh;
                border-radius: 22px;
                box-shadow: 0 25px 70px rgba(0, 0, 0, 0.4);
                border: 1.5px solid #E2E8F0;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                position: relative;
                animation: successModalPop 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            @keyframes successModalPop {
                from { opacity: 0; transform: scale(0.93) translateY(12px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }
            .order-success-header-wrap {
                background: linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%);
                padding: 20px 24px;
                color: #FFFFFF;
                border-bottom: 2.5px solid #8B0000;
                position: relative;
                flex-shrink: 0;
            }
            .btn-close-success-modal {
                position: absolute;
                right: 14px;
                top: 14px;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.12);
                color: #FFFFFF;
                border: none;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .btn-close-success-modal:hover {
                background: #8B0000;
                transform: rotate(90deg);
            }
            .order-success-content-scroll {
                padding: 20px 24px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 14px;
                -webkit-overflow-scrolling: touch;
            }
            .order-success-grid-2col {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
            }
            @media (max-width: 600px) {
                #order-success-modal {
                    padding: 10px 8px;
                }
                .order-success-card {
                    max-width: 100%;
                    max-height: 94vh;
                    border-radius: 18px;
                }
                .order-success-header-wrap {
                    padding: 15px 16px;
                }
                .order-success-content-scroll {
                    padding: 14px 14px;
                    gap: 11px;
                }
                .order-success-grid-2col {
                    grid-template-columns: 1fr !important;
                    gap: 10px;
                }
                .order-success-title-text {
                    font-size: 1.1rem !important;
                }
                .order-id-badge-pill {
                    font-size: 0.76rem !important;
                    padding: 4px 10px !important;
                }
            }
        </style>

        <div class="order-success-card">
            <!-- Header -->
            <div class="order-success-header-wrap">
                <button type="button" class="btn-close-success-modal" title="Close">
                    <i data-lucide="x" style="width: 18px; height: 18px;"></i>
                </button>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding-right: 36px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 42px; height: 42px; border-radius: 50%; background: #22c55e; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 0 16px rgba(34,197,94,0.4); flex-shrink: 0;">
                            <i data-lucide="check" style="width: 22px; height: 22px; stroke-width: 3;"></i>
                        </div>
                        <div>
                            <h2 class="order-success-title-text" style="margin: 0; font-size: 1.22rem; font-weight: 900; letter-spacing: 0.5px; color: #FFFFFF; font-family: 'League Spartan', 'Anta', sans-serif;">
                                ORDER PLACED <span style="color: #ef4444;">SUCCESSFULLY!</span>
                            </h2>
                            <p style="margin: 2px 0 0; font-size: 0.75rem; color: #94a3b8;">Your luxury order has been recorded in our system.</p>
                        </div>
                    </div>
                    <div class="order-id-badge-pill" style="background: rgba(139, 0, 0, 0.35); border: 1px solid rgba(220, 20, 60, 0.45); padding: 5px 12px; border-radius: 50px; font-family: monospace; font-size: 0.82rem; font-weight: 800; color: #fca5a5; letter-spacing: 1px;">
                        ${orderData.id}
                    </div>
                </div>
            </div>

            <!-- Body (Scrollable) -->
            <div class="order-success-content-scroll">
                <!-- Info Cards (Stacks on mobile) -->
                <div class="order-success-grid-2col">
                    <!-- Recipient Details -->
                    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 12px 14px; font-size: 0.8rem;">
                        <div style="font-weight: 800; color: #8B0000; margin-bottom: 6px; text-transform: uppercase; font-size: 0.72rem; letter-spacing: 0.8px; display: flex; align-items: center; gap: 5px; font-family:'League Spartan', sans-serif;">
                            <i data-lucide="user" style="width: 13px; height: 13px;"></i> Recipient Details
                        </div>
                        <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px;">${orderData.name}</div>
                        <div style="color: #64748b; font-family: monospace; font-size: 0.78rem;">${orderData.phone}</div>
                        <div style="color: #475569; font-size: 0.74rem; margin-top: 4px; line-height: 1.35;">${orderData.address}</div>
                    </div>

                    <!-- Order Details -->
                    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 12px 14px; font-size: 0.8rem;">
                        <div style="font-weight: 800; color: #8B0000; margin-bottom: 6px; text-transform: uppercase; font-size: 0.72rem; letter-spacing: 0.8px; display: flex; align-items: center; gap: 5px; font-family:'League Spartan', sans-serif;">
                            <i data-lucide="package" style="width: 13px; height: 13px;"></i> Order Details
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                            <span style="color: #64748b;">Date:</span>
                            <span style="font-weight: 700; color: #0f172a;">${orderData.date}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                            <span style="color: #64748b;">Payment:</span>
                            <span style="font-weight: 800; color: #16a34a;">Cash on Delivery</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #64748b;">Delivery:</span>
                            <span style="font-weight: 700; color: #0f172a;">2 - 3 Days Courier</span>
                        </div>
                    </div>
                </div>

                <!-- Items Preview -->
                <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 10px 14px;">
                    <div style="font-size: 0.72rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; font-family:'League Spartan', sans-serif;">
                        Ordered Pieces
                    </div>
                    <div style="max-height: 120px; overflow-y: auto;">
                        ${itemsSummaryHtml}
                    </div>
                </div>

                <!-- Price Breakdown Box -->
                <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 12px 16px; font-size: 0.82rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #64748b;">
                        <span>Subtotal</span>
                        <span style="font-weight: 700; color: #0f172a;">Rs. ${subtotal.toLocaleString()}.00</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #64748b;">
                        <span>Delivery Charge</span>
                        <span style="font-weight: 700; color: #0f172a;">${deliveryFee === 0 ? '<span style="color:#16a34a; font-weight:800;">FREE</span>' : 'Rs. ' + deliveryFee.toLocaleString() + '.00'}</span>
                    </div>
                    ${(orderData.pointsDiscount && orderData.pointsDiscount > 0) ? `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #8B0000; font-weight: 700;">
                        <span>Club Points Discount</span>
                        <span>-Rs. ${orderData.pointsDiscount.toLocaleString()}.00</span>
                    </div>` : ''}
                    <div style="display: flex; justify-content: space-between; align-items: baseline; border-top: 1.5px solid #E2E8F0; padding-top: 8px; margin-top: 5px;">
                        <span style="font-weight: 800; font-size: 0.92rem; color: #0f172a; font-family:'League Spartan', sans-serif;">Grand Total:</span>
                        <span style="font-weight: 900; font-size: 1.3rem; color: #8B0000; font-family: 'League Spartan', monospace;">Rs. ${grandTotal.toLocaleString()}.00</span>
                    </div>
                </div>

                <!-- Action Buttons: E-Bill + WhatsApp + Home -->
                <div style="display: flex; flex-direction: column; gap: 9px; margin-top: 2px;">
                    <!-- E-INVOICE BUTTON -->
                    <a href="${invoiceLink}" target="_blank" style="display: flex; align-items: center; justify-content: center; gap: 10px; padding: 14px; border-radius: 50px; background: #8B0000; color: #FFFFFF; font-weight: 900; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.8px; text-decoration: none; box-shadow: 0 6px 20px rgba(139, 0, 0, 0.35); transition: all 0.22s ease; font-family:'League Spartan', sans-serif;">
                        <i data-lucide="file-text" style="width: 18px; height: 18px;"></i>
                        <span>View &amp; Print E-Invoice</span>
                    </a>

                    <!-- WHATSAPP CONFIRMATION BUTTON -->
                    <a href="${whatsappUrl}" target="_blank" style="display: flex; align-items: center; justify-content: center; gap: 10px; padding: 12px; border-radius: 50px; background: #25D366; color: #FFFFFF; font-weight: 800; font-size: 0.86rem; text-decoration: none; box-shadow: 0 4px 15px rgba(37, 211, 102, 0.25); transition: all 0.22s ease; font-family:'League Spartan', sans-serif;">
                        <i data-lucide="message-circle" style="width: 18px; height: 18px;"></i>
                        <span>Send WhatsApp Confirmation</span>
                    </a>

                    <!-- BACK TO HOME / CONTINUE -->
                    <a href="index.html" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 11px; border-radius: 50px; background: #0A0A0A; color: #FFFFFF; font-weight: 700; font-size: 0.82rem; text-decoration: none; transition: all 0.2s ease; font-family:'League Spartan', sans-serif;">
                        <i data-lucide="home" style="width: 15px; height: 15px;"></i>
                        <span>Return to Storefront</span>
                    </a>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close button & outside overlay click to dismiss
    const closeBtn = modal.querySelector('.btn-close-success-modal');
    if (closeBtn) {
        closeBtn.onclick = function() { modal.remove(); };
    }
    modal.onclick = function(e) {
        if (e.target === modal) modal.remove();
    };

    if (window.lucide) {
        lucide.createIcons();
    }
}

function placeOrder() {
    if (cart.length === 0) { alert('Your cart is empty!'); return; }

    const nameEl = document.getElementById('checkout-name');
    const addressEl = document.getElementById('checkout-address');
    const cityEl = document.getElementById('checkout-city');
    const districtEl = document.getElementById('checkout-district');
    const phoneEl = document.getElementById('checkout-phone');
    const notesEl = document.getElementById('checkout-notes');

    const customerName = nameEl && nameEl.value.trim() ? nameEl.value.trim() : (currentUser ? currentUser.name : 'Guest');
    const address = addressEl ? addressEl.value.trim() : '';
    const city = cityEl ? cityEl.value.trim() : '';
    const district = districtEl ? districtEl.value.trim() : '';
    const postalEl = document.getElementById('checkout-postal');
    const postal = postalEl ? postalEl.value.trim() : '';
    const fullAddress = district ? `${address}, ${city} (${district})` : `${address}, ${city}`;
    const phone = phoneEl ? phoneEl.value.trim() : '';
    const notes = notesEl ? notesEl.value.trim() : '';

    if (!address || !city || !phone) {
        alert('Please fill out your address, city, and phone number before completing the order!');
        return;
    }

    const now = new Date();
    const orderID = generateUniqueOrderID();

    // Calculate subtotal and item count from cart
    let subtotal = 0;
    let itemCount = 0;
    cart.forEach(item => {
        subtotal += item.price * item.quantity;
        itemCount += item.quantity;
    });

    // Calculate dynamic delivery fee: FREE for 4+ items, else Rs. 500
    const deliveryFee = itemCount >= 4 ? 0 : 500;

    const safeColorNames = typeof colorNames !== 'undefined' ? colorNames : {};

    // Retrieve points redemption details from checkout interface
    const redeemedPoints = window.checkoutPointsRedeemed || 0;
    const pointsDiscount = window.checkoutPointsDiscount || 0;

    // Calculate points earned from this purchase: 20 points per 1750 Rs in bill price
    const pointsEarned = Math.floor(subtotal / 1750) * 20;

    // Prepare data for the E-Invoice
    const orderData = {
        id: orderID,
        name: customerName,
        phone: phone,
        email: (currentUser && currentUser.email) ? currentUser.email : '',
        streetAddress: address,
        city: city,
        district: district,
        postal: postal,
        address: fullAddress,
        notes: notes,
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        items: cart.map(item => {
            const p = products.find(prod => prod.name === item.name) || {};
            return {
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                size: item.size,
                color: getColorName(item.color),
                image: item.image || (p.images ? p.images[0] : ''),
                isCustom: item.isCustom || (item.id && String(item.id).startsWith('custom-')) || false,
                customStickers: item.customStickers || []
            };
        }),
        delivery: deliveryFee,
        redeemedPoints: redeemedPoints,
        pointsDiscount: pointsDiscount,
        pointsEarned: pointsEarned
    };

    // Encode order data for the URL
    const jsonStr = JSON.stringify(orderData);
    const encodedData = btoa(unescape(encodeURIComponent(jsonStr)));

    let baseUrl = window.location.protocol + '//' + window.location.host + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    let whatsappBaseUrl = baseUrl;

    if (window.location.protocol === 'file:') {
        baseUrl = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
        baseUrl = 'file:///' + baseUrl.replace(/^\/+/g, '');
        whatsappBaseUrl = 'https://onijawathsuka39-arch.github.io/Python.-Store/';
    } else {
        whatsappBaseUrl = baseUrl;
    }

    const whatsappInvoiceUrl = `${whatsappBaseUrl}invoice.html?data=${encodeURIComponent(encodedData)}`;

    let message = `🔴 *NEW ORDER CONFIRMATION: ${orderID}*\n\n`;
    message += `👤 *Customer:* ${orderData.name}\n`;
    message += `📞 *Phone:* ${phone}\n`;
    message += `📍 *Address:* ${orderData.address}\n`;
    if (notes) {
        message += `📝 *Notes:* ${notes}\n`;
    }
    message += `📅 *Date:* ${orderData.date} | ${orderData.time}\n\n`;
    message += `💳 *Payment Method:* Cash on Delivery\n\n`;
    message += `📦 *Items Ordered:*\n`;

    cart.forEach((item) => {
        const colorName = getColorName(item.color);
        message += `• *${item.name}* (${item.size} | ${colorName})\n`;
        message += `  Qty: ${item.quantity} x Rs. ${item.price.toLocaleString()}\n`;
    });

    const grandTotal = Math.max(0, subtotal + deliveryFee - pointsDiscount);
    message += `\n💵 *Subtotal:* Rs. ${subtotal.toLocaleString()}.00\n`;
    message += `🚚 *Delivery Fee:* ${deliveryFee === 0 ? 'FREE' : 'Rs. ' + deliveryFee.toLocaleString() + '.00'}\n`;
    if (pointsDiscount > 0) {
        message += `🎁 *Club Points Redeemed:* -${redeemedPoints} pts (-Rs. ${pointsDiscount.toLocaleString()}.00)\n`;
    }
    message += `✨ *Points Earned:* +${pointsEarned} pts\n`;
    message += `💰 *Grand Total: Rs. ${grandTotal.toLocaleString()}.00*\n\n`;

    // Invoice link removed from WhatsApp message
    message += `Thank you for shopping with Python Store!`;

    const whatsappUrl = `https://wa.me/94757218786?text=${encodeURIComponent(message)}`;

    const dbOrder = {
        id: orderID,
        date: now.toLocaleDateString(),
        items: cart.map(item => ({ ...item, color: getColorName(item.color) })),
        total: grandTotal,
        subtotal: subtotal,
        delivery: deliveryFee,
        redeemedPoints: redeemedPoints,
        pointsDiscount: pointsDiscount,
        pointsEarned: pointsEarned,
        userEmail: currentUser ? currentUser.email : 'Guest',
        userName: customerName,
        userPhone: phone,
        streetAddress: address,
        city: city,
        district: district,
        postal: postal,
        userAddress: fullAddress,
        notes: notes,
        status: 'pending',
        timestamp: (typeof firebase !== 'undefined' ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString())
    };
    orders.push(dbOrder);
    localStorage.setItem('python_orders', JSON.stringify(orders));

    if (typeof db !== 'undefined' && db) {
        // Always save order to Firestore so it shows in Admin portal immediately!
        db.collection('orders').add(dbOrder).then(docRef => {
            console.log("Order saved to Firestore with ID:", docRef.id);
            // Save docRef.id back to localStorage so order-history can link for delete
            try {
                let savedOrders = JSON.parse(localStorage.getItem('python_orders') || '[]');
                const oi = savedOrders.findIndex(o => o.id === dbOrder.id);
                if (oi !== -1) {
                    savedOrders[oi].docId = docRef.id;
                    localStorage.setItem('python_orders', JSON.stringify(savedOrders));
                }
            } catch(e2) {}
        }).catch(e => {
            console.error("Error saving order to database:", e);
        });

        // Update user's points balance in firestore if logged in
        if (currentUser && currentUser.uid) {
            db.collection('users').doc(currentUser.uid).get().then(doc => {
                let currentPoints = doc.exists && doc.data().clubPoints !== undefined ? doc.data().clubPoints : 0;
                let nextPoints = Math.max(0, currentPoints - redeemedPoints + pointsEarned);
                db.collection('users').doc(currentUser.uid).update({
                    clubPoints: nextPoints
                }).then(() => {
                    if (currentUser) {
                        currentUser.clubPoints = nextPoints;
                        localStorage.setItem('python_user', JSON.stringify(currentUser));
                    }
                }).catch(e => console.error("Error updating user club points:", e));
            });
        }
    } else if (currentUser) {
        let currentPoints = currentUser.clubPoints || 0;
        let nextPoints = Math.max(0, currentPoints - redeemedPoints + pointsEarned);
        currentUser.clubPoints = nextPoints;
        localStorage.setItem('python_user', JSON.stringify(currentUser));
    }
    localStorage.removeItem('python_free_delivery_active');
    const bar = document.getElementById('free-delivery-bar');
    if (bar) bar.remove();
    cart = []; saveCart();

    // Trigger Red Loading Page first, then show simplified clean modal
    showRedOrderLoader(() => {
        showOrderSuccessModal(orderData, subtotal, deliveryFee, grandTotal, whatsappUrl, whatsappInvoiceUrl);
    });
}

function clearOrderHistory() {
    if (confirm('Are you sure you want to clear your order history?')) {
        orders = orders.filter(o => o.userEmail !== currentUser.email);
        localStorage.setItem('python_orders', JSON.stringify(orders));
        if (typeof db !== 'undefined' && db) {
            db.collection('orders').where('userEmail', '==', currentUser.email).get().then(snapshot => {
                let deletePromises = [];
                snapshot.forEach(doc => deletePromises.push(doc.ref.delete()));
                Promise.all(deletePromises).then(() => {
                    loadProfile();
                    showNotification('Order history cleared.');
                });
            }).catch(e => {
                console.error("Error clearing orders from database:", e);
                loadProfile();
                showNotification('Order history cleared.');
            });
        } else {
            loadProfile();
            showNotification('Order history cleared.');
        }
    }
}

function loadProfile() {
    const nameEl = document.getElementById('profile-name');
    const emailEl = document.getElementById('profile-email');
    const initialEl = document.getElementById('profile-initial');
    const orderCountEl = document.getElementById('order-count');
    const historyEl = document.getElementById('order-history');
    if (currentUser) {
        if (nameEl) nameEl.innerText = currentUser.name;
        if (emailEl) emailEl.innerText = currentUser.email;
        if (initialEl) initialEl.innerText = currentUser.name.charAt(0).toUpperCase();

        const renderOrdersList = (ordersList) => {
            if (orderCountEl) orderCountEl.innerText = ordersList.length;
            if (!historyEl) return;

            if (ordersList.length === 0) {
                historyEl.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;text-align:center;">
                    <div style="font-size:3rem;margin-bottom:16px;">📦</div>
                    <div style="font-size:1.1rem;font-weight:700;color:var(--text);margin-bottom:8px;">No Orders Yet</div>
                    <div style="font-size:0.9rem;color:var(--text-muted);">Your order history will appear here after your first purchase.</div>
                    <a href="shop.html" style="margin-top:20px;padding:10px 28px;background:#8B0000;color:#fff;border-radius:50px;font-weight:700;text-decoration:none;font-size:0.9rem;">Shop Now</a>
                </div>`;
                return;
            }

            const statusColors = {
                confirmed:  '#22c55e',
                shipped:    '#3b82f6',
                delivered:  '#16a34a',
                cancelled:  '#ef4444',
                pending:    '#f59e0b',
                processing: '#8b5cf6',
                packed:     '#f59e0b'
            };
            const statusLabels = {
                confirmed:  'Confirmed',
                shipped:    'Shipped',
                delivered:  'Delivered',
                cancelled:  'Cancelled',
                pending:    'Pending',
                processing: 'Processing',
                packed:     'Packed'
            };
            const statusIcons = {
                confirmed:  '✅',
                shipped:    '🚚',
                delivered:  '📦',
                cancelled:  '❌',
                pending:    '⏳',
                processing: '⚙️',
                packed:     '📦'
            };

            const buildInvoiceUrl = (o) => {
                try {
                    const inv = {
                        id: o.id || '',
                        name: o.userName || o.name || '',
                        phone: o.userPhone || o.phone || '',
                        email: o.userEmail || o.email || '',
                        streetAddress: o.streetAddress || '',
                        city: o.city || '',
                        district: o.district || '',
                        postal: o.postal || '',
                        address: o.userAddress || o.address || '',
                        notes: o.notes || '',
                        date: o.date || '',
                        time: o.time || '',
                        items: (o.items || []).map(it => ({
                            name: it.name || '',
                            size: it.size || 'Free',
                            color: it.color || '',
                            quantity: it.quantity || 1,
                            price: it.price || 0,
                            image: it.image || ''
                        })),
                        subtotal: o.subtotal || o.total || 0,
                        delivery: o.delivery || 0,
                        total: o.total || 0,
                        redeemedPoints: o.redeemedPoints || 0,
                        pointsDiscount: o.pointsDiscount || 0,
                        pointsEarned: o.pointsEarned || 0,
                        paymentMethod: o.paymentMethod || 'Cash on Delivery',
                        status: o.status || 'pending'
                    };
                    return 'invoice.html?data=' + encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(inv)))));
                } catch(e) { return '#'; }
            };

            historyEl.innerHTML = ordersList.map((o, idx) => {
                const status = (o.status || 'pending').toLowerCase();
                const statusColor = statusColors[status] || '#f59e0b';
                const statusLabel = statusLabels[status] || (status.charAt(0).toUpperCase() + status.slice(1));
                const statusIcon  = statusIcons[status]  || '⏳';
                const items = o.items || [];
                const previewItems = items.slice(0, 2);
                const extraCount  = items.length - 2;
                const invoiceUrl  = buildInvoiceUrl(o);
                const isCancelled = status === 'cancelled';

                return `
                <div class="ord-card" id="ord-${idx}" style="
                    background: var(--surface);
                    border: 1.5px solid ${isCancelled ? '#ef444433' : statusColor + '33'};
                    border-radius: 18px;
                    margin-bottom: 16px;
                    overflow: hidden;
                    box-shadow: 0 4px 18px rgba(0,0,0,0.07);
                    transition: box-shadow 0.2s, transform 0.2s;
                    font-family: 'League Spartan', 'Anta', sans-serif;
                ">
                    <!-- Card Header -->
                    <div style="
                        display:flex; align-items:center; justify-content:space-between;
                        padding:14px 18px; gap:10px; flex-wrap:wrap;
                        background: linear-gradient(135deg, #0A0A0A 0%, #1a1a1a 100%);
                        border-bottom: 2px solid ${statusColor};
                    ">
                        <div style="display:flex;flex-direction:column;gap:2px;min-width:0;">
                            <span style="font-size:0.72rem;color:#aaa;letter-spacing:0.5px;text-transform:uppercase;">Order ID</span>
                            <span style="font-weight:800;font-size:0.9rem;color:#fff;letter-spacing:0.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px;">
                                ${o.id || 'N/A'}
                            </span>
                        </div>
                        <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
                            <span style="
                                display:inline-flex; align-items:center; gap:5px;
                                background:${statusColor}22; color:${statusColor};
                                border:1px solid ${statusColor}66;
                                padding:4px 12px; border-radius:50px;
                                font-size:0.78rem; font-weight:800; white-space:nowrap;
                            ">${statusIcon} ${statusLabel}</span>
                            <span style="font-size:0.78rem;color:#888;">${o.date || ''}</span>
                        </div>
                    </div>

                    <!-- Card Body -->
                    <div style="padding:14px 18px;">
                        <!-- Items Preview -->
                        <div style="margin-bottom:12px;">
                            ${previewItems.map(it => `
                            <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--border, #f1f5f9);">
                                <img src="${it.image || 'logo.png'}" onerror="this.src='logo.png'"
                                    style="width:40px;height:40px;border-radius:8px;object-fit:cover;border:1px solid #e2e8f0;flex-shrink:0;">
                                <div style="min-width:0;flex:1;">
                                    <div style="font-weight:700;font-size:0.85rem;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                                        ${it.name}
                                    </div>
                                    <div style="font-size:0.75rem;color:var(--text-muted);">
                                        ${it.size || 'Free'} &bull; ${it.color || ''} &times; ${it.quantity || 1}
                                    </div>
                                </div>
                                <div style="font-weight:800;font-size:0.85rem;color:#8B0000;white-space:nowrap;flex-shrink:0;">
                                    Rs.${((it.price||0)*(it.quantity||1)).toLocaleString()}
                                </div>
                            </div>`).join('')}
                            ${extraCount > 0 ? `<div style="font-size:0.78rem;color:var(--text-muted);padding:6px 0;">+ ${extraCount} more item${extraCount>1?'s':''}</div>` : ''}
                        </div>

                        <!-- Totals Row -->
                        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-top:2px solid #0A0A0A;margin-top:4px;flex-wrap:wrap;gap:8px;">
                            <div style="font-size:0.82rem;color:var(--text-muted);">
                                ${items.length} item${items.length!==1?'s':''}
                                ${o.delivery===0 ? '&bull; <span style="color:#22c55e;font-weight:700;">Free Delivery</span>' : '&bull; Delivery Rs.'+((o.delivery||0).toLocaleString())}
                            </div>
                            <div style="font-weight:900;font-size:1.05rem;color:#8B0000;font-family:'League Spartan',sans-serif;">
                                Rs. ${(o.total||0).toLocaleString()}.00
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap;">
                            <a href="${invoiceUrl}" target="_blank" style="
                                display:inline-flex; align-items:center; gap:7px;
                                padding:9px 18px; border-radius:50px;
                                background:linear-gradient(135deg,#0A0A0A 0%,#1a1a1a 100%);
                                color:#fff; font-weight:700; font-size:0.82rem;
                                text-decoration:none; border:1.5px solid #333;
                                transition: transform 0.15s, box-shadow 0.15s;
                                flex:1; justify-content:center; min-width:120px;
                            " onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 4px 14px rgba(0,0,0,0.25)'"
                               onmouseout="this.style.transform='';this.style.boxShadow=''">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                                </svg>
                                View Invoice
                            </a>
                            ${!isCancelled ? `<div style="
                                display:inline-flex; align-items:center; gap:7px;
                                padding:9px 18px; border-radius:50px;
                                background:${statusColor}15; color:${statusColor};
                                border:1.5px solid ${statusColor}44;
                                font-weight:700; font-size:0.82rem;
                                flex:1; justify-content:center; min-width:120px;
                                text-align:center;
                            ">${statusIcon} ${statusLabel}</div>` : ''}
                        </div>
                    </div>
                </div>`;
            }).join('');
        };

        if (typeof db !== 'undefined' && db) {
            db.collection('orders')
                .where('userEmail', '==', currentUser.email)
                .get()
                .then((querySnapshot) => {
                    const dbOrders = [];
                    querySnapshot.forEach((doc) => {
                        dbOrders.push(doc.data());
                    });
                    // Sort descending by date/timestamp
                    dbOrders.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
                    renderOrdersList(dbOrders);
                })
                .catch((err) => {
                    console.error("Error fetching orders from Firestore:", err);
                    const userOrders = orders.filter(o => o.userEmail === currentUser.email);
                    renderOrdersList(userOrders.reverse());
                });
        } else {
            const userOrders = orders.filter(o => o.userEmail === currentUser.email);
            renderOrdersList(userOrders.reverse());
        }
    } else {
        if (window.location.pathname.includes('profile.html')) { window.location.href = 'login.html'; }
    }
}

// Animation styles
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes pulse-red { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 20, 60, 0.7); } 70% { transform: scale(1.2); box-shadow: 0 0 0 10px rgba(220, 20, 60, 0); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 20, 60, 0); } }
    .btn-qty { background: white; border: 1px solid #ddd; color: #000; width: 25px; height: 25px; border-radius: 5px; cursor: pointer; transition: 0.2s; font-weight: bold; }
    .btn-qty:hover { background: #000; color: white; }
    .offer-dot { position: absolute; top: -2px; right: -10px; width: 8px; height: 8px; background: #DC143C; border-radius: 50%; animation: pulse-red 2s infinite; }
`;
document.head.appendChild(styleSheet);

function handleOfferNotification() {
    const offerViewed = localStorage.getItem('python_offer_viewed_v2');
    const isOfferPage = window.location.pathname.includes('offers.html');
    if (isOfferPage) { localStorage.setItem('python_offer_viewed_v2', 'true'); }
    if (!offerViewed && !isOfferPage) {
        document.querySelectorAll('a[href="offers.html"]').forEach(link => {
            if (!link.querySelector('.offer-dot')) {
                link.style.position = 'relative';
                const dot = document.createElement('span');
                dot.className = 'offer-dot';
                link.appendChild(dot);
            }
        });
    }
}

// Centralized Light/Dark Theme System
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
        const sunIcon = btn.querySelector('.sun-icon');
        const moonIcon = btn.querySelector('.moon-icon');
        if (sunIcon && moonIcon) {
            if (theme === 'light') {
                sunIcon.style.display = 'none';
                moonIcon.style.display = 'inline-block';
            } else {
                sunIcon.style.display = 'inline-block';
                moonIcon.style.display = 'none';
            }
        } else {
            btn.innerHTML = `<i data-lucide="${theme === 'dark' ? 'sun' : 'moon'}"></i>`;
        }
    });

    const mobileToggle = document.getElementById('mobile-theme-toggle');
    if (mobileToggle) {
        mobileToggle.innerHTML = `<i data-lucide="${theme === 'dark' ? 'sun' : 'moon'}"></i> Theme: ${theme === 'dark' ? 'Light' : 'Dark'}`;
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function initThemeToggle() {
    const currentTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(currentTheme);

    // Mobile Drawer Toggle
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu && !document.getElementById('mobile-theme-toggle')) {
        const mobileToggle = document.createElement('a');
        mobileToggle.href = '#';
        mobileToggle.id = 'mobile-theme-toggle';
        mobileToggle.style.display = 'flex';
        mobileToggle.style.alignItems = 'center';
        mobileToggle.style.gap = '15px';
        mobileToggle.style.marginTop = '30px';
        mobileToggle.style.padding = '12px 18px';
        mobileToggle.style.borderRadius = '15px';
        mobileToggle.style.background = 'var(--border-light)';
        mobileToggle.style.color = 'var(--primary-dark)';
        mobileToggle.style.fontSize = '1.1rem';
        mobileToggle.style.fontWeight = '600';
        mobileToggle.style.textDecoration = 'none';
        mobileToggle.style.border = '1px solid var(--border-color)';
        mobileToggle.innerHTML = `<i data-lucide="${currentTheme === 'dark' ? 'sun' : 'moon'}"></i> Theme: ${currentTheme === 'dark' ? 'Light' : 'Dark'}`;

        const listContainer = mobileMenu.querySelector('ul');
        if (listContainer) {
            const li = document.createElement('li');
            li.style.marginTop = '20px';
            li.appendChild(mobileToggle);
            listContainer.appendChild(li);
        } else {
            mobileMenu.appendChild(mobileToggle);
        }

        mobileToggle.addEventListener('click', (e) => {
            e.preventDefault();
            toggleTheme();
        });
    }
}

// --- Free Delivery Promo Bar ---
function initFreeDeliveryBar() {
    const isShopPage = window.location.pathname.includes('shop.html');
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('offer') === 'freedelivery') {
        localStorage.setItem('python_free_delivery_active', 'true');
        window.history.replaceState({}, document.title, 'shop.html');
    }

    const isActive = localStorage.getItem('python_free_delivery_active') === 'true';
    if (isShopPage && isActive) {
        if (!document.getElementById('free-delivery-bar')) {
            const bar = document.createElement('div');
            bar.id = 'free-delivery-bar';
            bar.style.cssText = `
                position: fixed;
                bottom: 0;
                left: 0;
                width: 100%;
                background: var(--primary-dark);
                color: var(--primary-light);
                padding: 15px;
                text-align: center;
                z-index: 10000;
                box-shadow: 0 -5px 20px rgba(0,0,0,0.2);
                transition: transform 0.3s ease;
                font-size: 1rem;
                font-weight: 500;
                border-top: 3px solid var(--accent-gold);
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
            `;
            document.body.appendChild(bar);

            if (!document.getElementById('promo-animations')) {
                const style = document.createElement('style');
                style.id = 'promo-animations';
                style.innerHTML = `
                    @keyframes celebrate {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                    }
                    @keyframes pop {
                        0% { transform: scale(0.9); opacity: 0; }
                        100% { transform: scale(1); opacity: 1; }
                    }
                `;
                document.head.appendChild(style);
            }
        }
        updateFreeDeliveryBar();
    }
}

function updateFreeDeliveryBar() {
    const bar = document.getElementById('free-delivery-bar');
    if (!bar) return;

    const itemCount = cart.reduce((total, item) => total + item.quantity, 0);

    if (itemCount >= 4) {
        bar.innerHTML = '🎉 <span style="font-weight: 800; letter-spacing: 1px;">Congratulations! You have unlocked FREE DELIVERY!</span> 🚚';
        bar.style.animation = 'celebrate 1s ease 3, pop 0.5s ease-out';
        bar.style.background = 'var(--accent-gold)';
        bar.style.color = '#fff';
        bar.style.borderTop = '3px solid #fff';
    } else {
        const needed = 4 - itemCount;
        bar.innerHTML = `<i data-lucide="shopping-bag" style="width: 20px;"></i> Buy <b style="color: var(--accent-gold); font-size: 1.2rem; margin: 0 5px;">${needed}</b> more item${needed > 1 ? 's' : ''} to get <b style="letter-spacing: 0.5px; margin-left: 5px;">FREE DELIVERY</b> Island Wide! 🚚`;
        bar.style.animation = 'pop 0.3s ease-out';
        bar.style.background = 'var(--primary-dark)';
        bar.style.color = 'var(--primary-light)';
        bar.style.borderTop = '3px solid var(--accent-gold)';
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// Wishlist Functionality
let wishlist = JSON.parse(localStorage.getItem('python_wishlist')) || [];

function toggleWishlist(productId) {
    wishlist = JSON.parse(localStorage.getItem('python_wishlist')) || [];
    const index = wishlist.indexOf(productId);
    let added = false;
    if (index === -1) {
        wishlist.push(productId);
        added = true;
    } else {
        wishlist.splice(index, 1);
    }
    localStorage.setItem('python_wishlist', JSON.stringify(wishlist));
    updateWishlistCount();

    // Refresh display if we are on the wishlist page
    if (window.location.pathname.includes('wishlist.html')) {
        renderWishlist();
    }
    return added;
}

function handleCardWishlistToggle(productId, btnElement) {
    const added = toggleWishlist(productId);
    const heart = btnElement.querySelector('i');
    if (added) {
        heart.setAttribute('fill', '#DC143C');
        heart.style.color = '#DC143C';
        showNotification('Added to Wishlist!');
    } else {
        heart.removeAttribute('fill');
        heart.style.color = 'var(--text-main)';
        showNotification('Removed from Wishlist!');
    }
}

function isInWishlist(productId) {
    return wishlist.includes(productId);
}

function updateWishlistCount() {
    wishlist = JSON.parse(localStorage.getItem('python_wishlist')) || [];
    const counts = document.querySelectorAll('#wishlist-count');
    counts.forEach(el => {
        el.innerText = wishlist.length;
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    updateCartCount();
    updateWishlistCount();
    handleOfferNotification();
    if (window.location.pathname.includes('cart.html')) { renderCart(); }
    if (window.location.pathname.includes('profile.html')) { loadProfile(); }
    if (window.location.pathname.includes('wishlist.html')) { renderWishlist(); }
    if (window.location.pathname.includes('shop.html')) {
        filterProducts();
    }
    const _isIndexPage = !!document.getElementById('top-selling-carousel');
    if (_isIndexPage) {
        const featuredIds = ['26', '27', '30', '31'];
        const featuredProducts = products.filter(p => featuredIds.includes(p.id));
        displayProducts(featuredProducts);
    }
    if ((window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html')) && currentUser) {
        window.location.href = 'profile.html';
    }
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }

    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const overlay = document.getElementById('menu-overlay');
    const closeBtn = document.getElementById('close-menu');
    if (menuBtn && mobileMenu && overlay) {
        menuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            mobileMenu.classList.add('active');
            overlay.classList.add('active');
        });
        const closeHandler = () => {
            mobileMenu.classList.remove('active');
            overlay.classList.remove('active');
        };
        overlay.addEventListener('click', closeHandler);
        if (closeBtn) closeBtn.addEventListener('click', closeHandler);
    }

    // Initialize Free Delivery Promo Bar if needed
    if (typeof initFreeDeliveryBar === 'function') {
        initFreeDeliveryBar();
    }
});

// ===== NEW DROP WAITLIST =====
function handleNewDropWaitlist() {
    const nameInput = document.getElementById('nd-name-input');
    const phoneInput = document.getElementById('nd-phone-input');
    const btn = document.getElementById('nd-notify-btn');
    const msg = document.getElementById('nd-notify-msg');

    // Dynamic UI Update logic for product details
    const product = products.find(p => p.id === new URLSearchParams(window.location.search).get('id'));
    if (product) {
        const brandEl = document.getElementById('detail-brand');
        if (brandEl) brandEl.innerText = product.brand || 'Python';
        const printTechEl = document.getElementById('detail-print-tech');
        if (printTechEl) printTechEl.innerText = product.printTech || 'A3 DTF Print';
    }

    const name = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';

    // Reset message
    msg.className = 'nd-notify-msg';

    // Validation
    if (!name) {
        msg.textContent = '⚠️ Please enter your name.';
        msg.classList.add('error');
        if (nameInput) nameInput.focus();
        return;
    }
    if (!phone || !/^[0-9+\s\-]{7,15}$/.test(phone)) {
        msg.textContent = '⚠️ Please enter a valid phone number.';
        msg.classList.add('error');
        if (phoneInput) phoneInput.focus();
        return;
    }

    // Disable button to prevent double-submit
    if (btn) { btn.disabled = true; btn.textContent = 'Joining...'; }

    const waitlistEntry = { name: name, phone: phone, joinedAt: new Date().toISOString() };

    if (typeof db !== 'undefined' && db) {
        db.collection('waitlist').where('phone', '==', phone).get()
            .then(snap => {
                if (!snap.empty) {
                    msg.textContent = '✅ You are already on the waitlist!';
                    msg.classList.add('success');
                    if (btn) {
                        btn.disabled = false;
                        btn.innerHTML = '<i data-lucide="bell" style="width:16px;height:16px;"></i> Join Waitlist';
                        if (window.lucide) lucide.createIcons();
                    }
                    return;
                }

                db.collection('waitlist').add(waitlistEntry)
                    .then(() => {
                        msg.textContent = '🎉 You are successfully added to the waitlist!';
                        msg.classList.add('success');

                        // Clear inputs
                        if (nameInput) nameInput.value = '';
                        if (phoneInput) phoneInput.value = '';

                        // Save to localStorage waitlist
                        const waitlist = JSON.parse(localStorage.getItem('python_waitlist') || '[]');
                        // Filter out old phone entry if any to clean local cache
                        const filteredWaitlist = waitlist.filter(e => e.phone !== phone);
                        filteredWaitlist.push(waitlistEntry);
                        localStorage.setItem('python_waitlist', JSON.stringify(filteredWaitlist));
                    })
                    .catch(e => {
                        console.error("Error saving to waitlist database:", e);
                        msg.textContent = '⚠️ Error: Waitlist entry could not be saved to Firestore.';
                        msg.classList.add('error');
                    })
                    .finally(() => {
                        if (btn) {
                            btn.disabled = false;
                            btn.innerHTML = '<i data-lucide="bell" style="width:16px;height:16px;"></i> Join Waitlist';
                            if (window.lucide) lucide.createIcons();
                        }
                    });
            })
            .catch(e => {
                console.error("Error checking waitlist database:", e);
                // Fallback to direct insertion if lookup fails
                db.collection('waitlist').add(waitlistEntry)
                    .then(() => {
                        msg.textContent = '🎉 You are successfully added to the waitlist!';
                        msg.classList.add('success');
                        if (nameInput) nameInput.value = '';
                        if (phoneInput) phoneInput.value = '';
                    })
                    .catch(err => {
                        console.error(err);
                        msg.textContent = '⚠️ Error: Waitlist entry could not be saved.';
                        msg.classList.add('error');
                    })
                    .finally(() => {
                        if (btn) {
                            btn.disabled = false;
                            btn.innerHTML = '<i data-lucide="bell" style="width:16px;height:16px;"></i> Join Waitlist';
                            if (window.lucide) lucide.createIcons();
                        }
                    });
            });
    } else {
        // No firebase configuration loaded
        msg.textContent = '⚠️ Database connection is not available.';
        msg.classList.add('error');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="bell" style="width:16px;height:16px;"></i> Join Waitlist';
            if (window.lucide) lucide.createIcons();
        }
    }
}

// ── Sync Product Stock from Firestore/localStorage ──
function syncProductsWithDatabase() {
    const stockMap = JSON.parse(localStorage.getItem('python_product_stock_map')) || {};
    const deletedList = JSON.parse(localStorage.getItem('python_deleted_products')) || [];

    const applySync = () => {
        products.forEach(p => {
            if (deletedList.includes(p.id)) {
                p.isDeleted = true;
                p.stock = 0;
                p.stockStatus = 'out_of_stock';
            } else if (stockMap[p.id]) {
                p.stockStatus = stockMap[p.id];
                p.stock = stockMap[p.id] === 'out_of_stock' ? 0 : (p.stock || 10);
            }
        });
    };

    if (typeof db !== 'undefined' && db) {
        db.collection('products').get().then(snapshot => {
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.status) stockMap[doc.id] = data.status;
                if (data.isDeleted && !deletedList.includes(doc.id)) deletedList.push(doc.id);
            });
            localStorage.setItem('python_product_stock_map', JSON.stringify(stockMap));
            localStorage.setItem('python_deleted_products', JSON.stringify(deletedList));
            applySync();
            // Re-render shop/product grids if present
            const isIdx = !!document.getElementById('top-selling-carousel');
            if (isIdx) {
                const featuredIds = ['26', '27', '30', '31'];
                displayProducts(products.filter(p => featuredIds.includes(p.id) && !p.isDeleted));
            } else if (typeof filterShop === 'function' && window.location.pathname.includes('shop.html')) {
                filterShop();
            } else if (typeof displayProducts === 'function') {
                displayProducts(products.filter(p => !p.isDeleted));
            }
        }).catch(err => {
            console.warn('Firestore stock sync failed, using localStorage:', err);
            applySync();
        });
    } else {
        applySync();
    }
}

// Auto-sync on page load (runs after firebase is ready)
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to allow firebase/db to initialize
    setTimeout(() => {
        if (typeof syncProductsWithDatabase === 'function') syncProductsWithDatabase();
    }, 1200);
});

// Header - Always Visible on Both PC and Mobile
(function() {
    const nav = document.getElementById('navbar');
    if (!nav) return;

    // Always show header - never hide on scroll
    nav.classList.remove('hide-nav');
    nav.classList.add('show-nav');
})();
