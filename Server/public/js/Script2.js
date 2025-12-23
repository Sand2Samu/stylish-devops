// public/js/Script2.js
// THIS IS FRONTEND JAVASCRIPT - IT RUNS IN THE BROWSER

console.log("Frontend Script2.js is ALIVE!");

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
    // This example attaches the checkout logic to a button with id="checkout-button".
    // Make sure you have such a button in your HTML, or change the ID here.
    const checkoutButton = document.getElementById('checkout-button');
    if (checkoutButton) {
        console.log("Checkout button found. Adding click listener.");
        checkoutButton.addEventListener('click', function() {
            console.log("Checkout button clicked!");

            // 1. Get your cart items.
            //    THIS IS WHERE YOU NEED TO INTEGRATE YOUR ACTUAL CART LOGIC.
            //    For testing, we'll use hardcoded data. Replace this with your real cart data.
            //    Example: let currentCartItems = getCartFromLocalStorage();
            const currentCartItems = [
                { id: "shoe001", name: "Test Running Shoes", quantity: 1, price: 79.99 },
                { id: "hat002", name: "Test Baseball Cap", quantity: 2, price: 19.50 }
            ];
            console.log("Test cart items for checkout:", currentCartItems);

            if (!currentCartItems || currentCartItems.length === 0) {
                alert("Your cart is empty!");
                return;
            }

            // 2. Calculate the total amount.
            let currentTotalAmount = 0;
            try {
                currentCartItems.forEach(item => {
                    if (typeof item.quantity !== 'number' || typeof item.price !== 'number') {
                        throw new Error(`Invalid item in cart: Quantity or price is not a number. Item: ${JSON.stringify(item)}`);
                    }
                    currentTotalAmount += item.quantity * item.price;
                });
                currentTotalAmount = parseFloat(currentTotalAmount.toFixed(2));
                console.log("Calculated total for checkout:", currentTotalAmount);
            } catch (error) {
                console.error("Error calculating total:", error);
                alert(error.message || "Error calculating total. Please check cart items.");
                return;
            }


            // 3. Get shipping information.
            //    This might come from a form. For testing, we'll use a static address.
            //    Example: const shippingAddressInput = document.getElementById('shipping-address-input');
            //    const currentShippingInfo = shippingAddressInput ? shippingAddressInput.value.trim() : "";
            const currentShippingInfo = "123 Test Address, Suite 100"; // Example static address
            console.log("Shipping info for checkout:", currentShippingInfo);

            // 4. Call handleCheckout
            handleCheckout(currentCartItems, currentTotalAmount, currentShippingInfo);
        });
    } else {
        console.warn("Checkout button with ID 'checkout-button' not found. Purchase functionality will not be triggered by this example setup. Ensure your checkout button exists and has this ID, or update the getElementById call.");
    }
    // --- End of HOW TO USE handleCheckout example ---

});