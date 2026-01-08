// public/js/Script2.js
// THIS IS FRONTEND JAVASCRIPT - IT RUNS IN THE BROWSER

console.log("Frontend Script2.js is ALIVE!");

// ==================== CART MANAGEMENT SYSTEM ====================
// Cart stored in localStorage as array of: { id, name, price, quantity, image }

function getCart() {
    const cart = localStorage.getItem('stylishCart');
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem('stylishCart', JSON.stringify(cart));
    updateCartUI();
}

function addToCart(product) {
    const cart = getCart();
    const existingIndex = cart.findIndex(item => item.id === product.id);

    if (existingIndex > -1) {
        cart[existingIndex].quantity += product.quantity || 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: product.quantity || 1,
            image: product.image || 'images/card-item1.jpg'
        });
    }

    saveCart(cart);
    console.log("Added to cart:", product);
    alert(`"${product.name}" added to cart!`);
}

function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
    console.log("Removed from cart:", productId);
}

function updateCartItemQuantity(productId, newQuantity) {
    const cart = getCart();
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = newQuantity;
            saveCart(cart);
        }
    }
}

function clearCart() {
    localStorage.removeItem('stylishCart');
    updateCartUI();
    console.log("Cart cleared");
}

function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function updateCartUI() {
    const cart = getCart();
    const cartContainer = document.querySelector('.shopping-cart-content');

    if (!cartContainer) return;

    // Build cart HTML
    let cartHTML = '';

    if (cart.length === 0) {
        cartHTML = '<div class="text-center py-4"><p>Your cart is empty</p></div>';
    } else {
        cart.forEach(item => {
            cartHTML += `
                <div class="mini-cart cart-list p-0 mt-3" data-product-id="${item.id}">
                    <div class="mini-cart-item d-flex border-bottom pb-3">
                        <div class="col-lg-3 col-md-3 col-3">
                            <img src="${item.image}" alt="${item.name}" class="img-fluid">
                        </div>
                        <div class="col-lg-8 col-md-8 col-8">
                            <h6 class="product-title fs-6 me-5">${item.name}</h6>
                            <div class="quantity-price">
                                <span class="quantity">${item.quantity} ×</span>
                                <span class="price-amount">
                                    <bdi><span class="price-currency-symbol">$</span>${item.price.toFixed(2)}</bdi>
                                </span>
                            </div>
                            <button type="button" class="btn btn-sm btn-outline-danger mt-2 remove-cart-item" data-id="${item.id}">
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    cartContainer.innerHTML = cartHTML;

    // Update total
    const totalElement = document.querySelector('.mini-cart-total .price-amount');
    if (totalElement) {
        const total = getCartTotal();
        totalElement.innerHTML = `<bdi><span class="price-currency-symbol">$</span>${total.toFixed(2)}</bdi>`;
    }

    // Add remove button event listeners
    document.querySelectorAll('.remove-cart-item').forEach(btn => {
        btn.addEventListener('click', function () {
            const productId = this.getAttribute('data-id');
            removeFromCart(productId);
        });
    });
}

// Initialize cart UI on page load
document.addEventListener('DOMContentLoaded', function () {
    updateCartUI();

    // Setup Add to Cart buttons on product cards
    setupAddToCartButtons();
});

function setupAddToCartButtons() {
    console.log("Setting up Add to Cart buttons...");

    // Find all cart buttons that open the cart modal (multiple selector patterns)
    const addToCartButtons = document.querySelectorAll(
        '.cart-button button[data-bs-target="#modallong"], ' +
        '.product-card .cart-button button:first-child'
    );

    console.log("Found Add to Cart buttons:", addToCartButtons.length);

    addToCartButtons.forEach((btn, index) => {
        // Remove any existing click handlers and add new one
        btn.addEventListener('click', function (e) {
            console.log("Cart button clicked, index:", index);

            // Get product info from the closest product card
            const productCard = this.closest('.product-card');
            if (productCard) {
                const titleEl = productCard.querySelector('.card-title a') || productCard.querySelector('.card-title');
                const priceEl = productCard.querySelector('.card-price');
                const imageEl = productCard.querySelector('.product-image');

                // Generate unique ID from image source or index
                let productId = `prod_${index + 1}`;
                if (imageEl && imageEl.src) {
                    // Extract filename from image path for unique ID
                    const imgPath = imageEl.src.split('/').pop().replace('.jpg', '').replace('.png', '');
                    productId = `prod_${imgPath}`;
                }

                const product = {
                    id: productId,
                    name: titleEl ? titleEl.textContent.trim() : 'Running shoes for men',
                    price: priceEl ? parseFloat(priceEl.textContent.replace('$', '').trim()) : 99,
                    quantity: 1,
                    image: imageEl ? imageEl.src : 'images/card-item1.jpg'
                };

                console.log("Adding product to cart:", product);
                addToCart(product);
            } else {
                console.log("No product card found for button");
            }
        });
    });

    // Also handle the "Add to cart" button in the quick view modal
    const quickViewAddBtn = document.querySelector('#modaltoggle button[type="submit"]');
    if (quickViewAddBtn) {
        quickViewAddBtn.addEventListener('click', function (e) {
            e.preventDefault();
            const modal = document.getElementById('modaltoggle');
            const titleEl = modal.querySelector('.display-7');
            const priceEl = modal.querySelector('.product-price');
            const quantityEl = modal.querySelector('input[name="quantity"]');

            const product = {
                id: 'prod_quickview_' + Date.now(),
                name: titleEl ? titleEl.textContent.trim() : 'Product',
                price: priceEl ? parseFloat(priceEl.textContent.replace('$', '').trim()) : 99,
                quantity: quantityEl ? parseInt(quantityEl.value) || 1 : 1,
                image: 'images/summary-item1.jpg'
            };

            console.log("Adding from quick view:", product);
            addToCart(product);
        });
    }
}

// ==================== END CART MANAGEMENT SYSTEM ====================

document.addEventListener('DOMContentLoaded', function () {
    console.log("DOM fully loaded. Setting up forms.");

    // --- Modal Form Switching (if you have this UI) ---
    const loginSection = document.getElementById('login-section');
    const registrationSection = document.getElementById('registration-section');
    const goToRegisterButton = document.getElementById('go-to-register-button');
    const showLoginFromRegisterButton = document.getElementById('show-login-from-register');

    const loginErrorMessageDiv = document.getElementById('login-error-message');
    const registerErrorMessageDiv = document.getElementById('register-error-message');

    function showLogin() {
        if (loginSection) loginSection.style.display = 'block';
        if (registrationSection) registrationSection.style.display = 'none';
        clearErrorMessages();
    }

    function showRegister() {
        if (loginSection) loginSection.style.display = 'none';
        if (registrationSection) registrationSection.style.display = 'block';
        clearErrorMessages();
    }

    function clearErrorMessages() {
        if (loginErrorMessageDiv) {
            loginErrorMessageDiv.style.display = 'none';
            loginErrorMessageDiv.textContent = '';
        }
        if (registerErrorMessageDiv) {
            registerErrorMessageDiv.style.display = 'none';
            registerErrorMessageDiv.textContent = '';
        }
    }

    if (goToRegisterButton) {
        goToRegisterButton.addEventListener('click', showRegister);
    }

    if (showLoginFromRegisterButton) {
        showLoginFromRegisterButton.addEventListener('click', showLogin);
    }

    // --- Registration Form Handling ---
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        console.log("Register form found. Adding submit listener.");
        registerForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            clearErrorMessages();
            console.log("Register form submitted.");

            const nameInput = document.getElementById('register-name');
            const emailInput = document.getElementById('register-email');
            const passwordInput = document.getElementById('register-password');
            const confirmPasswordInput = document.getElementById('register-confirm-password');
            const phoneInput = document.getElementById('register-phone');
            const addressInput = document.getElementById('register-address');

            if (!nameInput || !emailInput || !passwordInput || !confirmPasswordInput) {
                console.error("One or more required registration input fields are missing from the HTML.");
                displayRegisterError("A form field is missing. Please contact support.");
                return;
            }

            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            const phone = phoneInput ? phoneInput.value.trim() : "";
            const address = addressInput ? addressInput.value.trim() : "";

            if (!name || !email || !password || !confirmPassword) {
                displayRegisterError("Please fill in all required fields (*)."); return;
            }
            if (password.length < 6) {
                displayRegisterError("Password must be at least 6 characters long."); return;
            }
            if (password !== confirmPassword) {
                displayRegisterError("Passwords do not match."); return;
            }

            const userData = { name, email, password, phone: phone || undefined, address: address || undefined };
            console.log("Attempting to send registration data to server:", userData);

            try {
                const response = await fetch('/api/users/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData),
                });
                const result = await response.json();
                console.log("Server registration response status:", response.status, "Body:", result);
                if (response.ok) {
                    alert(result.message || "Registration successful! Please login.");
                    registerForm.reset();
                    showLogin();
                } else {
                    displayRegisterError(result.message || `Registration failed: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error during registration fetch:', error);
                displayRegisterError('An error occurred during registration. Please try again later.');
            }
        });
    } else {
        console.warn("Registration form with ID 'register-form' not found in the HTML.");
    }

    function displayRegisterError(message) {
        if (registerErrorMessageDiv) {
            registerErrorMessageDiv.textContent = message;
            registerErrorMessageDiv.style.display = 'block';
        } else {
            alert("Error: " + message);
        }
    }

    // --- Login Form Handling ---
    const loginButton = document.getElementById('login-button');
    const loginForm = document.getElementById('login-form');

    if (loginButton && loginForm) {
        console.log("Login button found. Adding click listener.");
        loginButton.addEventListener('click', async function () {
            clearErrorMessages();
            console.log("Login button clicked.");
            const emailInput = document.getElementById('login-email');
            const passwordInput = document.getElementById('login-password');

            if (!emailInput || !passwordInput) {
                console.error("Login email or password input field missing.");
                displayLoginError("A form field is missing. Please contact support."); return;
            }
            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (!email || !password) {
                displayLoginError("Please enter both email and password."); return;
            }
            const credentials = { email, password };
            console.log("Attempting to send login data to server:", credentials);

            try {
                const response = await fetch('/api/users/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(credentials),
                });
                const result = await response.json();
                console.log("Server login response status:", response.status, "Body:", result);
                if (response.ok) {
                    alert(result.message || "Login successful!");
                    if (result.token) {
                        localStorage.setItem('authToken', result.token);
                        localStorage.setItem('userName', result.user.name);
                    }
                    updateLoginState();
                    loginForm.reset();
                    const loginModalElement = document.getElementById('modallogin');
                    if (loginModalElement) {
                        const loginModal = bootstrap.Modal.getInstance(loginModalElement);
                        if (loginModal) loginModal.hide();
                    }
                } else {
                    displayLoginError(result.message || `Login failed: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error during login fetch:', error);
                displayLoginError('An error occurred during login. Please try again later.');
            }
        });
    } else {
        console.warn("Login button or form not found.");
    }

    function displayLoginError(message) {
        if (loginErrorMessageDiv) {
            loginErrorMessageDiv.textContent = message;
            loginErrorMessageDiv.style.display = 'block';
        } else {
            alert("Error: " + message);
        }
    }

    function updateLoginState() {
        const token = localStorage.getItem('authToken');
        const userName = localStorage.getItem('userName');
        const userIconLink = document.querySelector('.user-items a[data-bs-target="#modallogin"]');
        const navLoginLink = document.querySelector('.dropdown-item[data-bs-target="#modallogin"]');

        if (token && userName && userIconLink) {
            userIconLink.innerHTML = `<span style="font-size: 0.8em;">Hi, ${userName.split(' ')[0]}</span>`;
            userIconLink.removeAttribute('data-bs-toggle');
            userIconLink.removeAttribute('data-bs-target');
            userIconLink.href = '#logout';
            userIconLink.onclick = (e) => {
                e.preventDefault();
                if (confirm('Are you sure you want to logout?')) {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('userName');
                    alert('Logged out successfully.');
                    window.location.reload();
                }
            };
            if (navLoginLink) {
                navLoginLink.textContent = 'Logout';
                navLoginLink.removeAttribute('data-bs-toggle');
                navLoginLink.removeAttribute('data-bs-target');
                navLoginLink.href = '#logout';
                navLoginLink.onclick = (e) => {
                    e.preventDefault();
                    if (confirm('Are you sure you want to logout?')) {
                        localStorage.removeItem('authToken');
                        localStorage.removeItem('userName');
                        alert('Logged out successfully.');
                        window.location.reload();
                    }
                };
            }
        }
    }
    updateLoginState();

    // --- Function to handle Checkout ---
    async function handleCheckout(cartItems, calculatedTotal, shippingInfo) {
        console.log("handleCheckout called with:", { cartItems, calculatedTotal, shippingInfo });

        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            alert("Please login to make a purchase.");
            // TODO: Optionally, trigger the login modal here
            // const loginModalElement = document.getElementById('modallogin');
            // if (loginModalElement) {
            //     const loginModal = bootstrap.Modal.getOrCreateInstance(loginModalElement); // Use getOrCreateInstance
            //     loginModal.show();
            // }
            return;
        }

        // IMPORTANT: Transform cartItems from YOUR cart structure to the 'products' array structure
        // expected by the backend. This is an EXAMPLE.
        let productsForBackend;
        try {
            productsForBackend = cartItems.map(item => {
                // --- !!! YOU NEED TO ADJUST THIS MAPPING !!! ---
                // Assuming your cart item objects have properties like:
                // item.id (for productId), item.name (for productName), item.quantity, item.price (for pricePerItem)
                if (!item.id || !item.name || typeof item.quantity !== 'number' || typeof item.price !== 'number') {
                    console.error("Invalid cart item structure:", item);
                    // Throw an error that can be caught by the outer try-catch in the button event listener
                    throw new Error("Cart item data is invalid. Cannot proceed with checkout. Check console for details on the item.");
                }
                console.log("Mapping item:", item); // Log item being mapped
                return {
                    productId: String(item.id),
                    productName: item.name,
                    quantity: item.quantity,
                    pricePerItem: item.price
                };
            });
        } catch (error) {
            console.error("Error during cart item mapping:", error);
            alert(error.message || "There was an issue processing your cart items.");
            return; // Stop checkout if mapping fails
        }


        console.log("Products formatted for backend:", productsForBackend);

        const purchaseData = {
            products: productsForBackend,
            totalAmount: calculatedTotal,
            shippingAddress: shippingInfo
        };

        console.log("Attempting to send purchase data to server:", purchaseData);

        try {
            const response = await fetch('/api/purchases/record', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(purchaseData)
            });

            const result = await response.json();
            console.log("Server purchase response status:", response.status, "Body:", result);

            if (response.ok) {
                alert(result.message || "Purchase successful!");
                // TODO: Clear the cart on the frontend
                // TODO: Redirect to an order confirmation page or update UI
                console.log("Purchase recorded:", result.purchase);
                // Example: clearCart(); window.location.href = '/order-confirmation?orderId=' + result.purchase._id;
            } else {
                alert(`Purchase failed: ${result.message || response.statusText}`);
                console.error("Purchase error response from server:", result);
            }
        } catch (error) {
            console.error("Error making purchase request (frontend fetch):", error);
            alert("An error occurred while trying to make the purchase. Please check console.");
        }
    }

    // --- HOW TO USE handleCheckout ---
    // This attaches the checkout logic to a button with id="checkout-button".
    const checkoutButton = document.getElementById('checkout-button');
    if (checkoutButton) {
        console.log("Checkout button found. Adding click listener.");
        checkoutButton.addEventListener('click', function () {
            console.log("Checkout button clicked!");

            // 1. Get cart items from localStorage (using our cart management system)
            const currentCartItems = getCart();
            console.log("Cart items for checkout:", currentCartItems);

            if (!currentCartItems || currentCartItems.length === 0) {
                alert("Your cart is empty! Please add items before checking out.");
                return;
            }

            // 2. Calculate the total amount using getCartTotal()
            const currentTotalAmount = parseFloat(getCartTotal().toFixed(2));
            console.log("Calculated total for checkout:", currentTotalAmount);

            // 3. Get shipping information.
            //    Try to get from user's saved address, otherwise prompt
            const userName = localStorage.getItem('userName');
            let currentShippingInfo = "";

            // Prompt user for shipping address
            currentShippingInfo = prompt("Please enter your shipping address:", "");
            if (!currentShippingInfo || currentShippingInfo.trim() === "") {
                alert("Shipping address is required to proceed with checkout.");
                return;
            }
            console.log("Shipping info for checkout:", currentShippingInfo);

            // 4. Call handleCheckout with real cart data
            handleCheckoutWithClear(currentCartItems, currentTotalAmount, currentShippingInfo);
        });
    } else {
        console.warn("Checkout button with ID 'checkout-button' not found. Ensure your checkout button exists and has this ID.");
    }

    // Wrapper function that clears cart after successful checkout
    async function handleCheckoutWithClear(cartItems, totalAmount, shippingInfo) {
        console.log("handleCheckoutWithClear called with:", { cartItems, totalAmount, shippingInfo });

        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            alert("Please login to make a purchase.");
            return;
        }

        // Transform cartItems to backend expected format
        let productsForBackend;
        try {
            productsForBackend = cartItems.map(item => {
                if (!item.id || !item.name || typeof item.quantity !== 'number' || typeof item.price !== 'number') {
                    console.error("Invalid cart item structure:", item);
                    throw new Error("Cart item data is invalid. Cannot proceed with checkout.");
                }
                return {
                    productId: String(item.id),
                    productName: item.name,
                    quantity: item.quantity,
                    pricePerItem: item.price
                };
            });
        } catch (error) {
            console.error("Error during cart item mapping:", error);
            alert(error.message || "There was an issue processing your cart items.");
            return;
        }

        console.log("Products formatted for backend:", productsForBackend);

        const purchaseData = {
            products: productsForBackend,
            totalAmount: totalAmount,
            shippingAddress: shippingInfo
        };

        console.log("Sending purchase data to server:", purchaseData);

        try {
            const response = await fetch('/api/purchases/record', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(purchaseData)
            });

            const result = await response.json();
            console.log("Server purchase response status:", response.status, "Body:", result);

            if (response.ok) {
                alert(result.message || "Purchase successful! Thank you for your order.");
                // Clear the cart after successful purchase
                clearCart();
                console.log("Cart cleared after successful purchase. Purchase recorded:", result.purchase);

                // Close the cart modal if open
                const cartModalElement = document.getElementById('modallong');
                if (cartModalElement) {
                    const cartModal = bootstrap.Modal.getInstance(cartModalElement);
                    if (cartModal) cartModal.hide();
                }
            } else {
                alert(`Purchase failed: ${result.message || response.statusText}`);
                console.error("Purchase error response from server:", result);
            }
        } catch (error) {
            console.error("Error making purchase request:", error);
            alert("An error occurred while trying to make the purchase. Please try again.");
        }
    }
    // --- End of HOW TO USE handleCheckout example ---

});