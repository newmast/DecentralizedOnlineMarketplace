/*
owner: 0x42e3958ae493a7fd2616700f9d71d4fd210ca720ffb284383e271ba0b784575f
random: 0x7ec9140c7ba00c736fb26dbeff0430b066aa080d
*/

App = {
  web3Provider: null,
  contracts: {},

  init: function() {
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },
  initContract: function() {
    $.getJSON('Marketplace.json', function(data) {
      var MarketplaceArtifact = data;
      App.contracts.Marketplace = TruffleContract(MarketplaceArtifact);
      App.contracts.Marketplace.setProvider(App.web3Provider);
      return App.loadRoles();
    });

    $('#address').html(web3.eth.coinbase)

    return App.bindEvents();
  },
  bindEvents: function() {
    $(document).on('click', '#add-product', App.addProduct);
    $(document).on('click', '.btn-remove', App.deleteProduct);
    $(document).on('click', '.btn-buy', App.buyProduct);
    $(document).on('click', '.btn-edit', App.editProduct);
    $(document).on('click', '.btn-save', App.saveProduct);
    $(document).on('click', '.btn-back', App.backProduct);
    $(document).on('click', '.withdraw-funds', App.withdrawFunds);
    $(document).on('click', '.deposit-funds', App.depositFunds);
  },
  loadRoles: function() {
    var storeId = getUrlParam('storeId');
    App.contracts.Marketplace.deployed().then(function(instance) {
      App.marketplaceInstance = instance;
      return App.marketplaceInstance.isUserAdmin.call();
    }).then(function(isAdmin) {
      App.isAdmin = isAdmin;
      return App.marketplaceInstance.userOwnsStore.call(getStoreId());
    }).then(function(isStoreOwner) {
      App.isStoreOwner = isStoreOwner;

      if (App.isStoreOwner) {
        $('.store-owner-panel').removeClass('hidden');
        $('.btn-edit').removeClass('hidden');
        $('.btn-remove').removeClass('hidden');
      }

      return App.marketplaceInstance.getFunds.call(storeId);
    }).then(function(funds) {
      App.storeFunds = parseInt(funds.toString());
      App.loadData();
      return App.getProductsForStore(getStoreId());
    })
  },
  getProductsForStore: function(storeId) {
    App.marketplaceInstance.getProductCount(storeId)
    .then(function(productCount) {
      products = []
      for (var i = 0; i < productCount; i++) {
        App.marketplaceInstance.getProduct.call(storeId, i)
          .then(function(product) {
            products.push(product);
            if (products.length == productCount) {
              for (i = 0; i < productCount; i++) {
                App.renderProduct(products[i], i);
              }
            }
          })
      }
    })
  },
  renderProduct: function(product, index) {
    decoded = product.toString().split(',');
    data = {
      name: decoded[0],
      price: parseInt(decoded[1]),
      quantity: parseInt(decoded[2])
    }

    var template = $('#productTemplate').clone();
    template.attr('id', '');
    template.addClass('product-details');
    template.find('.product-name').text(data.name);
    template.find('.product-price').text(data.price);
    template.find('.product-quantity').text(data.quantity);
    template.find('.panel-body').attr('data-index', index);
    template.css('display', 'block');

    $('#content').append(template);
  },
  addProduct: function(event) {
    event.preventDefault();

    var marketplaceInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];
      App.marketplaceInstance.addProduct.sendTransaction(
        getStoreId(),
        $('#add-product-name').val(),
        parseInt($('#add-product-price').val()),
        parseInt($('#add-product-quantity').val()),
        { from: account }
      );
    });
  },
  buyProduct: function(event) {
    var body = $(event.target).closest('.panel-body');
    var index = parseInt(body.attr('data-index'));
    var price = parseInt(body.find('.product-view .product-price').html());
    App.marketplaceInstance.purchase.sendTransaction(
      getStoreId(),
      index,
      {
        from: web3.eth.coinbase,
        value: price
      }
    );
  },
  editProduct: function(event) {
    var body = $(event.target).closest('.panel-body');
    var productView = body.find('.product-view');
    var productEdit = body.find('.product-edit');

    productView.addClass('hidden');
    productEdit.removeClass('hidden');

    var data = {
      name: productView.find('.product-name').html(),
      price: productView.find('.product-price').html(),
      quantity: productView.find('.product-quantity').html()
    };

    body.find('.product-edit .product-name-input').val(data.name);
    body.find('.product-edit .product-price-input').val(data.price);
    body.find('.product-edit .product-quantity-input').val(data.quantity);
  },
  saveProduct: function(event) {
    var panelBody = $(event.target).closest('.panel-body');
    var edit = panelBody.find('.product-edit');

    var data = {
      storeId: getStoreId(),
      index: parseInt(panelBody.attr('data-index')),
      name: edit.find('.product-name-input').val(),
      price: parseInt(edit.find('.product-price-input').val()),
      quantity: parseInt(edit.find('.product-quantity-input').val())
    };

    App.marketplaceInstance.updateProduct.sendTransaction(
      data.storeId,
      data.index,
      data.name,
      data.price,
      data.quantity,
      { from: web3.eth.coinbase }
    );
  },
  backProduct: function(event) {
    var body = $(event.target).closest('.panel-body');
    body.find('.product-view').removeClass('hidden');
    body.find('.product-edit').addClass('hidden');
  },
  deleteProduct: function(event) {
    var index = parseInt($(event.target).closest('.panel-body').attr('data-index'));
    App.marketplaceInstance.deleteProduct.sendTransaction(
      getStoreId(),
      index,
      { from: web3.eth.coinbase, gas: 100000 }
    );
  },
  withdrawFunds: function() {
    var withdrawAmount = $('.withdraw-funds-input').first().val();
    if (isNaN(withdrawAmount)) {
      alert("Enter a number!");
      return;
    }
    withdrawAmount = parseInt(withdrawAmount);
    App.marketplaceInstance.withdrawFunds.sendTransaction(
      getStoreId(),
      withdrawAmount,
      { from: web3.eth.coinbase }
    );
  },
  depositFunds: function() {
    var depositAmount = $('.deposit-funds-input').first().val();
    if (isNaN(depositAmount)) {
      alert("Enter a number!");
      return;
    }
    depositAmount = parseInt(depositAmount);
    App.marketplaceInstance.depositFunds.sendTransaction(
      getStoreId(),
      {
        from: web3.eth.coinbase,
        value: depositAmount
      }
    );
  },
  loadData: function(event) {
    $('#store-funds').html(App.storeFunds);

    web3.eth.getBlock('latest', function(error, block) {
      App.marketplaceInstance.DepositFunds(
        { storeId: getStoreId() }, { fromBlock: 'latest', toBlock: 'pending' }
      ).watch(function(error, result){
        if (error) {
          console.log(error);
          return;
        }

        if (block.number == result.blockNumber) return;

        var value = parseInt(result.args.value.toString());
        var currentFunds = parseInt($('#store-funds').html());
        $('#store-funds').html(currentFunds + value);
      });

      App.marketplaceInstance.WithdrawFunds(
        { storeId: getStoreId() }, { fromBlock: 'latest', toBlock: 'pending' }
      ).watch(function(error, result){
        if (error) {
          console.log(error);
          return;
        }

        if (block.number == result.blockNumber) return;

        var value = parseInt(result.args.value.toString());
        var currentFunds = parseInt($('#store-funds').html());
        $('#store-funds').html(currentFunds - value);
      });

      App.marketplaceInstance.Purchase(
        { storeId: getStoreId() }, { fromBlock: 'latest', toBlock: 'pending' }
      ).watch(function(error, result){
        if (error) {
          console.log(error);
          return;
        }

        if (block.number == result.blockNumber) return;

        var details = $( "div[data-index='" + result.args.productIndex + "']")
          .closest('.product-details');

        var quantity = details.find('.product-quantity');
        var currentQuantity = parseInt(quantity.html());
        quantity.html(currentQuantity - 1);

        var price = details.find('.product-price');
        var currentPrice = parseInt(price.html());
        var storeFunds = parseInt($('#store-funds').html());
        $('#store-funds').html(storeFunds + currentPrice);
      });
      // TODO: VISIT STORE LINKS
      App.marketplaceInstance.AddProduct(
        { storeId: getStoreId() }, { fromBlock: 'pending', toBlock: 'latest' }
      ).watch(function(error, result){
        if (error) {
          console.log(error);
          return;
        }

        if (block.number == result.blockNumber) return;
        App.renderProduct(
          [result.args.name, result.args.price, result.args.quantity],
          result.args.productIndex
        );
      });

      App.marketplaceInstance.RemoveProduct(
        { storeId: getStoreId() }, { fromBlock: 'latest', toBlock: 'pending' }
      ).watch(function(error, result){
        if (error) {
          console.log(error);
          return;
        }
        $( "div[data-index='" + result.args.productIndex + "']").closest('.product-details').remove();
      });

      App.marketplaceInstance.UpdateProduct(
        { storeId: getStoreId() }, { fromBlock: 'latest', toBlock: 'pending' }
      ).watch(function(error, result){
        if (error) {
          console.log(error);
          return;
        }

        $( "div[data-index='" + result.args.productIndex + "']").closest('.product-details').remove();
        App.renderProduct(
          [result.args.name, result.args.price, result.args.quantity],
          result.args.productIndex
        );
      });
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});

function getStoreId() {
  return parseInt(getUrlParam('storeId'));
}

function getUrlParam(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
