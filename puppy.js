var readline = require('readline');
var fs = require('fs');
var fileout = fs.createWriteStream('results.txt');
var output = fileout.write;

var manufacs = [];
var manufacRegex = {};
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
      manufacRegex[ product.manufacturer ] = new RegExp(product.manufacturer, 'i');
      manufacDict[ product.manufacturer ] = [];
    }

    product.regex = createMatcher(product.model);
    product.listings = [];
    manufacDict[ product.manufacturer ].push( product );
  });

  rl.on('close', function() {
    console.log('done loading products');
    loadListings();
  });
}

// creates a regular expression that matches key words in the string
function createMatcher( string ) {
  var tokens = keywordify(string);
  var len = tokens.length;
  var expression = '';
  var flags = 'ig';
  tokens.forEach( function (token, index) {
    expression += '(' + token + ')';
    if ( index < len - 1 )
      expression += '(\\s|-)*';
  });
  expression += '(\\s|$)';
  return new RegExp(expression, flags);
}

function keywordify( string ) {
  var tokens;
  string = string.replace(/(\s|-)+/, '\n');
  tokens = string.split('\n');
  return tokens;
}

function loadListings () {
  var listingStream = fs.createReadStream('listings.txt');

  var rl = readline.createInterface({
    input: listingStream
  });
  
  rl.on('line', matchListing);

  rl.on('close', function() {
    console.log('done processing listings');
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
  manufacs.forEach( function ( manufacturer ) {
    if ( manufacRegex[manufacturer].test( listing.title ) ) {
      matches.push(manufacturer);
    }
  });
  return matches;
}

function matchProduct ( listing, manufacturerArray ) {
  var matches = [];
  manufacturerArray.forEach( function ( manufacturer ) {
    manufacDict[manufacturer].some( function ( product ) {
      if ( product.regex.test( listing.title ) && manufacRegex[manufacturer].test( listing.manufacturer ) ) {
        matches.push( product );
        return true;
      }
      return false;
    });
  });
  // if ( matches.length > 1 ) console.log( '2137812321', listing.title, matches );
  return matches;
}

function printResults() {
  var result;
  console.log('printing');
  manufacs.forEach( function ( manufacturer ) {
    manufacDict[manufacturer].forEach( function ( product ) {
      result = { product_name: product.product_name, listings: product.listings };
      if ( !result.listings.length ) {
        result.keywords = product.regex;
      }
      fileout.write( JSON.stringify( result ) + '\n' );
    });
  });
}

function run () {
  loadProducts();
}

run();