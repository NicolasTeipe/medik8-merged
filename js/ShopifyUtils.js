
export class ShopifyUtils{
  constructor(settings){
    this.money_format = settings.money_format || "£{{amount}}";
  }

  handleize(str){
    return str.toLowerCase().replace(/[^\w\u00C0-\u024f]+/g, "-").replace(/^-+|-+$/g, "");
  }

  parseImgUrl(url,width){
    const fileType = url.includes('.png') ? 'png' : 'jpg' 
    const split = url.split( fileType == 'png' ? '.png' : '.jpg')
    return `${split[0]}_${width}x.${fileType}`
  }

  formatMoney(cents, format){
    if (typeof cents == 'string') { cents = cents.replace('.',''); }
    var value = '';
      var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
      var formatString = (format || this.money_format);
    
      function defaultOption(opt, def) {
         return (typeof opt == 'undefined' ? def : opt);
      }
    
      function formatWithDelimiters(number, precision, thousands, decimal) {
        precision = defaultOption(precision, 2);
        thousands = defaultOption(thousands, ',');
        decimal   = defaultOption(decimal, '.');
    
        if (isNaN(number) || number == null) { return 0; }
    
        number = (number/100.0).toFixed(precision);
    
        var parts   = number.split('.'),
            dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
            cents   = parts[1] ? (decimal + parts[1]) : '';
    
        return dollars + cents;
      }
    
      switch(formatString.match(placeholderRegex)[1]) {
        case 'amount':
          value = formatWithDelimiters(cents, 2);
          break;
        case 'amount_no_decimals':
          value = formatWithDelimiters(cents, 0);
          break;
        case 'amount_optional_decimals':
            value = formatWithDelimiters(cents, 2);
            value = Number(value) % 1 === 0 ? Number(value).toFixed(0) : value;
            break;
        case 'amount_with_comma_separator':
          value = formatWithDelimiters(cents, 2, '.', ',');
          break;
        case 'amount_with_period_separator':
            value = formatWithDelimiters(cents, 2, ',', '.');
            break;
        case 'amount_no_decimals_with_comma_separator':
          value = formatWithDelimiters(cents, 0, '.', ',');
          break;
      }
    
    return formatString.replace(placeholderRegex, value);
  }
}
