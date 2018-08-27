pragma solidity ^0.4.24;

/** @title Marketplace */
contract Marketplace {
  struct Product {
    string name;
    uint256 price;
    uint64 quantity;

    uint256 _index;
  }

  struct Store {
    mapping (uint256 => Product) products;
    uint256[] productIndices;
    uint256 productIdentifier;
    string name;
    address owner;
    uint256 funds;
  }

  mapping (address => bool) admins;
  mapping (address => bool) storeOwners;

  Store[] stores;
  mapping (address => uint256[]) storeIndices;

  address owner;
  bool stopped;

  /** @dev Deposit funds event.
    * @param who The address who deposited.
    * @param storeId The store in which the deposit was made.
    * @param value How much was deposited.
    */
  event DepositFunds(address indexed who, uint256 indexed storeId, uint256 value);
  /** @dev Withdraw funds event.
    * @param who The address who withdrew.
    * @param storeId The store in which the withdrawal was made.
    * @param value How much was withdrawn.
    */
  event WithdrawFunds(address indexed who, uint256 indexed storeId, uint256 value);
  /** @dev Emitted when a product is added to a store.
    * @param who The address who added the product.
    * @param storeId The store in which the product was added.
    * @param productIndex The index of the product in the store storage.
    * @param name Product name.
    * @param price Product price.
    * @param quantity Product quantity.
    */
  event AddProduct(address indexed who, uint256 indexed storeId, uint256 productIndex, string name, uint256 price, uint64 quantity);
  /** @dev Emitted when a product is removed from a store.
    * @param who The address who removed the product.
    * @param storeId The store in which the product was removed.
    * @param productIndex The index of the product in the store storage.
    */
  event RemoveProduct(address indexed who, uint256 indexed storeId, uint256 productIndex);
  /** @dev Emitted when a product is updated in a store.
    * @param who The address who updated the product.
    * @param storeId The store in which the product was updated.
    * @param productIndex The index of the product in the store storage.
    * @param name New product name.
    * @param price New product price.
    * @param quantity New product quantity.
    */
  event UpdateProduct(address indexed who, uint256 indexed storeId, uint256 productIndex, string name, uint256 price, uint64 quantity);
  /** @dev Emitted when a store is created.
    * @param who The address who created the store.
    * @param storeId The id of the newly created store.
    * @param name The name of the newly created store.
    * @param funds The initial funds of the newly created store.
    */
  event AddStore(address indexed who, uint256 storeId, string name, uint256 funds);
  /** @dev Emitted when a product is purchased from a store.
    * @param who The address who made the purchase.
    * @param storeId The id of the store where the purchase was made.
    * @param productIndex The id of the product that was purchased.
    */
  event Purchase(address indexed who, uint256 indexed storeId, uint256 productIndex);

  /** @dev Halts execution if contract is stopped. */
  modifier stopInEmergency {
      require(!isInEmergency());
      _;
  }

  /** @dev Halts execution if user is not admin. */
  modifier isAdmin() {
    require(isUserAdmin());
    _;
  }

  /** @dev Halts execution if user is not store owner. */
  modifier isStoreOwner() {
    require(isUserStoreOwner());
    _;
  }

  /** @dev Halts execution if msg.sender does not own store with id == 'id'. */
  modifier ownsStore(uint256 id) {
    require(userOwnsStore(id));
    _;
  }

  constructor() public {
      owner = msg.sender;
      admins[msg.sender] = true;
      stopped = false;
      storeOwners[msg.sender] = true;
  }

  /** @dev Checks if sender owns the store with given id. */
  function userOwnsStore(uint256 id) public view isStoreOwner returns(bool) {
    return stores[id].owner == msg.sender;
  }

  /** @dev Checks if contract is stopped. */
  function isInEmergency() public view returns(bool) {
    return stopped;
  }

  /** @dev Stops contract. */
  function stopContract() public isAdmin {
    stopped = true;
  }

  /** @dev Resumes contract. */
  function resumeContract() public isAdmin {
    stopped = false;
  }

  /** @dev Checks if sender is admin. */
  function isUserAdmin() public view returns(bool) {
    return admins[msg.sender];
  }

  /** @dev Checks if sender is store owner. */
  function isUserStoreOwner() public view returns(bool) {
    return storeOwners[msg.sender];
  }

  /** @dev Admin-only function that gives admin privileges.
    * @param candidate The new admin.
    */
  function makeAdmin(address candidate) public isAdmin {
      admins[candidate] = true;
  }

  /** @dev Admin-only function that gives store owner privileges.
    * @param candidate The new store owner.
    */
  function makeStoreOwner(address candidate) public isAdmin {
      storeOwners[candidate] = true;
  }

  /** @dev Returns the number of stores. */
  function getNumberOfStores() public view returns(uint256) {
    return stores.length;
  }
  /** @dev Get store by id.
    * @param id Id of store.
    */
  function getStore(uint256 id) public view returns(string, address, uint256) {
    Store storage s = stores[id];
    return (s.name, s.owner, s.funds);
  }
  /** @dev Adds new store.
    * @param name The name of the newly added store.
    */
  function addStore(string name) public isStoreOwner stopInEmergency returns(uint256) {
    stores.push(Store({ productIndices: new uint256[](0), name: name, funds: 0, owner: msg.sender, productIdentifier: 0 }));
    storeIndices[msg.sender].push(stores.length-1);

    emit AddStore(msg.sender, stores.length-1, name, 0);
    return stores.length-1;
  }

  /** @dev Add a new product to a store.
    * @param storeId The store in which the product will be added.
    * @param name The name of the product.
    * @param price The price of the product.
    * @param quantity The quantity of the product.
    */
  function addProduct(uint256 storeId, string name, uint256 price, uint64 quantity) public isStoreOwner ownsStore(storeId) stopInEmergency returns(uint256) {
    Store storage store = stores[storeId];
    uint256 productId = store.productIdentifier;
    store.productIdentifier++;
    store.products[productId] = Product({ name: name, price: price, quantity: quantity, _index: productId });
    store.productIndices.push(productId);

    emit AddProduct(msg.sender, storeId, productId, name, price, quantity);
    return productId;
  }

  /** @dev Update existing product in store.
    * @param storeId The store in which the product will be updated.
    * @param productIndex The index of the product in store storage.
    * @param name The new name of the product.
    * @param price The new price of the product.
    * @param quantity The new quantity of the product.
    */
  function updateProduct(uint256 storeId, uint256 productIndex, string name, uint256 price, uint64 quantity) public isStoreOwner ownsStore(storeId) stopInEmergency returns(bool) {
    uint256 index = stores[storeId].productIndices[productIndex];
    Product storage product = stores[storeId].products[index];
    product.name = name;
    product.price = price;
    product.quantity = quantity;

    emit UpdateProduct(msg.sender, storeId, productIndex, name, price, quantity);
    return true;
  }

  /** @dev Get the available funds in a store.
    * @param storeId The id of the store in which the funds will be checked.
    */
  function getFunds(uint256 storeId) public view isStoreOwner ownsStore(storeId) returns(uint256) {
    return stores[storeId].funds;
  }

  /** @dev Deposits funds to a store.
    * @param storeId The id of the store in which the funds will be deposited.
    */
  function depositFunds(uint256 storeId) public payable isStoreOwner ownsStore(storeId) stopInEmergency returns(bool) {
    require(stores[storeId].funds + msg.value >= stores[storeId].funds);
    stores[storeId].funds += msg.value;
    emit DepositFunds(msg.sender, storeId, msg.value);
    return true;
  }

  /** @dev Withdraws funds from a store.
    * @param storeId The id of the store from which the funds will be withdrawn.
    */
  function withdrawFunds(uint256 storeId, uint256 amount) public payable isStoreOwner ownsStore(storeId) stopInEmergency returns(bool) {
      require(stores[storeId].funds >= amount && stores[storeId].funds - amount <= stores[storeId].funds);
      stores[storeId].funds -= amount;
      msg.sender.transfer(amount);
      emit WithdrawFunds(msg.sender, storeId, amount);
      return true;
  }

  /** @dev Gets the number of products in a store.
    * @param storeId The id of the store from which the number of unique products will be calculated (not including quantity).
    */
  function getProductCount(uint256 storeId) public view returns(uint256) {
      return stores[storeId].productIndices.length;
  }

  /** @dev Purchases a product from a store.
    * @param storeId The id of the store from which the product will be purchased.
    * @param productId The id of the the product that will be purchased.
    */
  function purchase(uint256 storeId, uint256 productId) public payable stopInEmergency returns(string) {
      uint256 index = stores[storeId].productIndices[productId];
      Product storage product = stores[storeId].products[index];
      require(msg.value == product.price);
      require(product.quantity > 0);

      product.quantity--;
      stores[storeId].funds += msg.value;

      emit Purchase(msg.sender, storeId, productId);
      return product.name;
  }

  /** @dev Get details for a product.
    * @param storeId The id of the store in which the product is present.
    * @param productIndex The id of the the product in the store storage.
    */
  function getProduct(uint256 storeId, uint256 productIndex) public view returns(string, uint256, uint64) {
    uint256 index = stores[storeId].productIndices[productIndex];
    Product storage product = stores[storeId].products[index];
    return (product.name, product.price, product.quantity);
  }

  /** @dev Deletes a product from the store storage.
    * @param storeId The id of the store from which the product will be deleted.
    * @param productIndex The id of the the product in the store storage.
    */
  function deleteProduct(uint256 storeId, uint256 productIndex) public isStoreOwner ownsStore(storeId) stopInEmergency returns(bool) {
    Store storage store = stores[storeId];
    require(store.productIndices.length > 0); // prevents underflow
    uint256 last = store.productIndices[store.productIndices.length-1];
    store.productIndices[store.productIndices.length-1] = store.productIndices[productIndex];
    store.productIndices[productIndex] = last;
    delete store.products[store.productIndices[store.productIndices.length-1]];
    delete store.productIndices[store.productIndices.length-1];

    store.productIndices.length--;

    emit RemoveProduct(msg.sender, storeId, productIndex);
    return true;
  }
}
