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
    $(document).on('click', '#add-shop', App.addStore);
    $(document).on('click', '#add-store-owner', App.addStoreOwner);
  },
  loadRoles: function() {
    App.contracts.Marketplace.deployed().then(function(instance) {
      App.marketplaceInstance = instance;
      return App.marketplaceInstance.isUserAdmin.call();
    }).then(function(isAdmin) {
      App.isAdmin = isAdmin;

      if (App.isAdmin) {
        $('.add-store-owner-panel').removeClass('hidden');
      }

      return App.marketplaceInstance.isUserStoreOwner.call();
    }).then(function(isStoreOwner) {
      App.isStoreOwner = isStoreOwner;

      if (App.isStoreOwner) {
        $('.add-shop-panel').removeClass('hidden');
      }
      web3.eth.getBlock('latest', function(error, block) {
        App.marketplaceInstance.AddStore({ })
        .watch(function(error, result){
          if (error) {
            console.log(error);
            return;
          }

          if (block.number == result.blockNumber) return;

          storeId = parseInt(result.args.storeId.toString());
          App.renderStore([result.args.name, result.args.who, 0], storeId);
        });

      });
      return App.getStores();
    })
  },
  getStores: function() {
    App.marketplaceInstance.getNumberOfStores()
    .then(function(numberOfStores) {
      stores = []
      for (var i = 0; i < numberOfStores; i++) {
        App.marketplaceInstance.getStore.call(i)
          .then(function(store) {
            stores.push(store);
            if (stores.length == numberOfStores) {
              for (i = 0; i < stores.length; i++) {
                if (stores[i].owner !== '0x0000000000000000000000000000000000000000') {
                  App.renderStore(stores[i], i);
                }
              }
            }
          })
      }
    })
  },
  renderStore: function(store, id) {
    decoded = store.toString().split(',');
    data = {
      name: decoded[0],
      owner: decoded[1],
      funds: parseInt(decoded[2])
    }

    var template = $('#shopTemplate').clone();

    template.find('.shop-name').text(data.name);
    template.find('.shop-owner').text(data.owner);
    template.find('.btn-visit').attr('href', '/products.html?storeId=' + id);
    template.css('display', 'block');

    $('#content').append(template);
  },
  addStore: function(event) {
    event.preventDefault();

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];
      App.marketplaceInstance.addStore.sendTransaction(
        $('#add-shop-name').val(),
        { from: account }
      );
    });
  },
  addStoreOwner: function(event) {
    App.marketplaceInstance.makeStoreOwner.sendTransaction(
      $('#add-store-owner-input').val(),
      { from: web3.eth.coinbase }
    );
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
