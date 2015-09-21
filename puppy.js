var readline = require('readline');
var fs = require('fs');
var output = console.log;

var manufacs = [];
var manufacRegex = [];
var manufacDict = {};

// Product           Object
//   product_name    String
//   manufacturer    String
//   model           String
//   family          String
//   announced-date  ISODate
//
// Listing           Object
//   title           String
//   manufacturer    String
//   currency        String
//   price           String

function loadProducts () {
  var productStream = fs.createReadStream('products.txt');

  var rl = readline.createInterface({
    input: productStream
  });

  rl.on('line', function (line) {
    var product = JSON.parse(line);

    if ( manufacs.indexOf( product.manufacturer ) < 0 ) {
      manufacs.push( product.manufacturer );
      manufacRegex.push( new RegExp(product.manufacturer, 'i') );
      manufacDict[ product.manufacturer ] = [];
    }

    product.regex = createMatcher(product.model);
    product.listings = [];
    manufacDict[ product.manufacturer ].push( product );
  });

  rl.on('close', function() {
    loadListings();
  });
}

function loadListings () {
  var listingStream = fs.createReadStream('listings.txt');

  var rl = readline.createInterface({
    input: listingStream
  });
  
  rl.on('line', matchListing);

  rl.on('close', function() {
    printResults();
  });
}

function matchListing ( listingString ) {
  var listing = JSON.parse( listingString );
  var manufacturer = matchManufacturer(listing);
  var matches = matchProduct( listing, manufacturer );

  matches.forEach( function ( product ) {
    product.listings.push( listing );
  });
}

function matchManufacturer ( listing ) {
  var matches = [];
  manufacs.forEach( function ( manufacturer, index ) {
    if ( manufacRegex[index].test( listing.title ) ) {
      matches.push(manufacturer);
    }
  });
  return matches;
}

function matchProduct ( listing, manufacturerArray ) {
  var matches = [];
  manufacturerArray.forEach( function ( manufacturer ) {
    manufacDict[manufacturer].some( function ( product ) {
      if ( product.regex.test( listing.title ) ) {
        matches.push( product );
        return true;
      }
      return false;
    });
  });
  if ( matches.length > 1 ) console.log( '2137812321', listing.title, matches );
  return matches;
}

function printResults() {
  manufacs.forEach( function ( manufacturer ) {
    manufacDict[manufacturer].forEach( function ( product ) {
      output({ product_name: product.product_name, listings: product.listings });
    });
  });
}

function run () {
  loadProducts();
}

run();