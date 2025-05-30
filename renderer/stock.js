const db = require('../db/db.js');

document.addEventListener('DOMContentLoaded', () => {
    // DOM Element References
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const addProductButton = document.getElementById('addProductButton');
    const productTable = document.getElementById('productTable');
    const productTableBody = productTable.getElementsByTagName('tbody')[0];

    const addProductModal = document.getElementById('addProductModal');
    const addProductForm = document.getElementById('addProductForm');
    const productNameInput = document.getElementById('productNameInput');
    const quantityInput = document.getElementById('quantityInput'); // Will be ignored for DB saving
    const priceInput = document.getElementById('priceInput');
    const saveProductButton = document.getElementById('saveProductButton');
    const cancelButton = document.getElementById('cancelButton');

    // Function to load products and render them in the table
    function loadProducts(searchTerm = '') {
        let query = 'SELECT id, name, sell_price FROM products';
        const params = [];
        if (searchTerm) {
            query += ' WHERE name LIKE ?';
            params.push(`%${searchTerm}%`);
        }

        db.all(query, params, (err, rows) => {
            if (err) {
                console.error('Error loading products:', err.message);
                return;
            }
            productTableBody.innerHTML = ''; // Clear existing rows
            rows.forEach(product => {
                const row = productTableBody.insertRow();
                row.insertCell().textContent = product.name;
                row.insertCell().textContent = product.sell_price;

                const actionsCell = row.insertCell();
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.dataset.id = product.id;
                deleteButton.addEventListener('click', () => handleDeleteProduct(product.id));
                actionsCell.appendChild(deleteButton);
            });
        });
    }

    // Function to handle deleting a product
    function handleDeleteProduct(productId) {
        if (confirm('Are you sure you want to delete this product?')) {
            const query = 'DELETE FROM products WHERE id = ?';
            db.run(query, [productId], function(err) {
                if (err) {
                    console.error('Error deleting product:', err.message);
                    alert('Failed to delete product.');
                    return;
                }
                console.log(`Product with ID ${productId} deleted. Rows affected: ${this.changes}`);
                loadProducts(); // Refresh the table
            });
        }
    }

    // Function to handle adding a product (form submission)
    function handleAddProduct(event) {
        event.preventDefault(); // Prevent default form submission

        const name = productNameInput.value.trim();
        const price = priceInput.value.trim();
        // const quantity = quantityInput.value.trim(); // Quantity is ignored for DB

        if (!name || !price) {
            alert('Product name and price cannot be empty.');
            return;
        }

        const query = 'INSERT INTO products (name, sell_price) VALUES (?, ?)';
        db.run(query, [name, parseFloat(price)], function(err) {
            if (err) {
                console.error('Error adding product:', err.message);
                alert('Failed to add product.');
                return;
            }
            console.log(`Product added with ID: ${this.lastID}`);
            addProductForm.reset();
            addProductModal.style.display = 'none';
            loadProducts(); // Refresh the table
        });
    }

    // Modal Handling
    addProductButton.addEventListener('click', () => {
        addProductModal.style.display = 'block';
    });

    cancelButton.addEventListener('click', () => {
        addProductModal.style.display = 'none';
        addProductForm.reset();
    });

    // Event Listeners
    searchButton.addEventListener('click', () => {
        loadProducts(searchInput.value.trim());
    });

    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            loadProducts(searchInput.value.trim());
        }
    });
    
    addProductForm.addEventListener('submit', handleAddProduct);

    // Initial load of products
    loadProducts();
});
