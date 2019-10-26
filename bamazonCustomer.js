var inquirer = require("inquirer");
var mysql = require('mysql');
var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'root',
	database: "bamazon"
});

connection.connect(function (err) {
	if (err) {
		console.error('error connecting: ' + err.stack);
		return;
	}
	// console.log('You are connected as id: ' + connection.threadId);
	// queryAllProducts(); 
});
// Function for making a purchase

// validateInput makes sure that the user is supplying only positive integers for their inputs
function validateInput(value) {
	var integer = Number.isInteger(parseFloat(value));
	var sign = Math.sign(value);

	if (integer && (sign === 1)) {
		return true;
	} else {
		console.log('Please enter a whole non-zero number.');
		promptPurchase()

	}
}

// promptPurchase will prompt the user for the item/quantity they would like to purchase
function promptPurchase() {
	// console.log('___ENTER promptPurchase___');

	// Prompt the user to select an item
	inquirer.prompt([
		{
			type: 'input',
			name: 'item_id',
			message: 'Please enter the Item ID of the item you would like to purchase.',
			validate: validateInput,
			filter: Number
		},
		{
			type: 'input',
			name: 'quantity',
			message: 'How many do you need?',
			validate: validateInput,
			filter: Number
		}
	]).then(function (input) {
		// console.log('Customer has selected: \n    item_id = '  + input.item_id + '\n    quantity = ' + input.quantity);

		var item = input.item_id;
		var quantity = input.quantity;

		// Query db to confirm that the given item ID exists in the desired quantity
		var queryStr = 'SELECT * FROM products WHERE ?';

		connection.query(queryStr, { item_id: item }, function (err, data) {
			if (err) throw err;

			// If the user has selected an invalid item ID, data attay will be empty
			// console.log('data = ' + JSON.stringify(data));

			if (data.length === 0) {
				console.log('ERROR: Invalid Item ID. Please select a valid Item ID.');
				displayInventory();

			} else {
				var productData = data[0];

				// console.log('productData = ' + JSON.stringify(productData));
				// console.log('productData.stock_quantity = ' + productData.stock_quantity);

				// If the quantity requested by the user is in stock
				if (quantity <= productData.stock_quantity) {
					console.log('Congratulations, the product you requested is in stock! Placing order!');

					// Make the updating query string
					var updateQueryStr = 'UPDATE products SET stock_quantity = ' + (productData.stock_quantity - quantity) + ' WHERE item_id = ' + item;
					// console.log('updateQueryStr = ' + updateQueryStr);

					// Update inventory
					connection.query(updateQueryStr, function (err, data) {
						if (err) throw err;

						console.log('Your order for ' + productData.product_name + ' has been placed! Your total is $' + productData.price * quantity);
						console.log('Thank you for shopping with us!');
						console.log("\n---------------------------------------------------------------------\n");

						// End the database connection
						// connection.end(); // Not here
						letsShop();
					})
				} else {
					console.log('Sorry, there is not enough ' + productData.product_name + ' in stock!');
					console.log('Please Try Again.');
					console.log("\n---------------------------------------------------------------------\n");

					// letsShop();
					promptPurchase()
				}
			}
		})
	})
}
// Old function for making a purchase
// function makePurchase() {
//   console.log("Were going to make a purchase!");
// }
// Enquirer function to ask questions
function letsShop() {
	inquirer.prompt([

		{
			type: "list",
			name: "startShop",
			message: "Welcome to BAMAZON! How May I Help You?",
			choices: ["Show Me The Products!", "Make A Purchase", "Leave"]
		},


	]).then(function (user) {

		// Show products...
		if (user.startShop === "Show Me The Products!") {
			queryAllProducts();
			// letsShop();
		}
		// Make a purchase...
		else if (user.startShop === "Make A Purchase") {
			promptPurchase();
			// console.log("Let's Make a Purchase")
		}
		else if (user.startShop === "Leave") {
			console.log("Thank you for shopping at BAMAZON! Goodbye!");
			connection.end();
		}
	});
}

// Function to see all products...
function queryAllProducts() {
	connection.query("SELECT * FROM products", function (err, res) {
		if (err) throw err;
		console.log(`
-----------------------------------------
          Welcome to Bamazon!
        These are our products...
-----------------------------------------
        `);
		for (var i = 0; i < res.length; i++) {
			console.log(`
---------------- Item ID: ${res[i].item_id} | ${res[i].product_name} ----------------
Category: ${res[i].department_name} | Price: $${res[i].price} | Available Quantity: ${res[i].stock_quantity}`)
		}
		console.log(`
----------------------END PRODUCTS---------------------
      `);
		letsShop();
	});
}
letsShop();