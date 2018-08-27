var Marketplace = artifacts.require('Marketplace')


/*
This test are covering the operations that the store has to do regularly:
  - Adding stores
  - Adding products
  - Removing products
  - Updating products
  - Giving admin privileges
  - Giving store owner privileges
  - Giving default privileges to owner

The tests were written because these are important functions that are crucial to the smart contract functionality.
*/
contract('Marketplace', function(accounts) {

    const owner = accounts[0]
    const john = accounts[1]
    const jane = accounts[2]
    const emptyAddress = '0x0000000000000000000000000000000000000000'

    it("should add a store with the provided name", async() => {
      const marketplace = await Marketplace.deployed()
      const storeName = "teststore"

      await marketplace.addStore(storeName, { from: owner })

      const store = await marketplace.getStore(0)

      assert.equal(store[0], storeName, 'the name of the store matches the expected value')
      assert.equal(store[1], owner, 'the owner of the newly created store matches the expected value')
      assert.equal(store[2], 0, 'the store has no funds initially')
    })

    describe('product test', () => {
      before(async() => {
        const marketplace = await Marketplace.deployed()
        const storeName = "teststore"

        await marketplace.addStore(storeName, { from: owner })
      })

      it("should add product with provided name, price, quantity", async() => {
        const marketplace = await Marketplace.deployed()

        const productName = "testproduct"
        const productPrice = 100
        const productQuantity = 20

        await marketplace.addProduct(0, productName, productPrice, productQuantity, { from: owner })

        const product = await marketplace.getProduct(0, 0);

        assert.equal(product[0], productName, 'the name of the product matches the expected value')
        assert.equal(product[1], productPrice, 'the price of the product matches the expected value')
        assert.equal(product[2], productQuantity, 'the quantity of the product matches the expected value')
      })

      it("should remove product at given index", async() => {
        const marketplace = await Marketplace.deployed()

        const productCountBefore = await marketplace.getProductCount(0)

        assert.equal(parseInt(productCountBefore.toString()), 1, 'one product was added successfully')

        await marketplace.deleteProduct(0, 0, { from: owner })

        const productCountAfter = await marketplace.getProductCount(0)
        assert.equal(parseInt(productCountAfter.toString()), 0, 'the product was removed successfully')
      })

      it("should update product at given index", async() => {
        const marketplace = await Marketplace.deployed()

        const productName = "testproduct"
        const productPrice = 100
        const productQuantity = 20

        await marketplace.addProduct(0, productName, productPrice, productQuantity, { from: owner })

        const product = await marketplace.getProduct(0, 0)

        assert.equal(product[0], productName, 'the name of the product matches the expected value')
        assert.equal(product[1], productPrice, 'the price of the product matches the expected value')
        assert.equal(product[2], productQuantity, 'the quantity of the product matches the expected value')

        const newProductName = "newname"
        const newProductPrice = 2000
        const newProductQuantity = 10000

        await marketplace.updateProduct(0, 0, newProductName, newProductPrice, newProductQuantity, { from: owner })

        const updatedProduct = await marketplace.getProduct(0, 0)

        assert.equal(updatedProduct[0], newProductName, 'the new name of the product matches the expected value')
        assert.equal(updatedProduct[1], newProductPrice, 'the new price of the product matches the expected value')
        assert.equal(updatedProduct[2], newProductQuantity, 'the new quantity of the product matches the expected value')

      })
    })

    it("owner should be admin and store owner", async() => {
      const marketplace = await Marketplace.deployed()

      const isOwnerAdmin = await marketplace.isUserAdmin({ from: owner })
      const isOwnerStoreOwner = await marketplace.isUserStoreOwner({ from: owner })

      assert(isOwnerAdmin, true, 'owner is admin')
      assert(isOwnerStoreOwner, true, 'owner is store owner')
    })

    it("should make address store owner", async() => {
      const marketplace = await Marketplace.deployed()

      const johnBefore = await marketplace.isUserStoreOwner({ from: john })
      await marketplace.makeStoreOwner(john, { from: owner })
      const johnAfter = await marketplace.isUserStoreOwner({ from: john })

      assert(johnBefore, false, 'john wasnt a store owner')
      assert(johnAfter, true, 'john now is a store owner')
    })

    it("should make address admin", async() => {
      const marketplace = await Marketplace.deployed()

      const janeBefore = await marketplace.isUserAdmin({ from: jane })
      await marketplace.makeAdmin(jane, { from: owner })
      const janeAfter = await marketplace.isUserAdmin({ from: jane })

      assert(janeBefore, false, 'jane wasnt an admin')
      assert(janeAfter, true, 'jane now is an admin')
    })

});
