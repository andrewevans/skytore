
function getParameterByName(name) {
  var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);

  // No matching query param? return "1"
  if (match === null) {
    match = [];
    match[1] = "1";
  }
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

$.get( "pages/part-" + getParameterByName('page') + ".txt", function( data ) {

  $('.box').html(data);
}).done(function() {

  var editor = new MediumEditor('.box'); // Initialize the editable content area
  var custom_extensions = function () {
    var right_block = {
        type: 'lang',
        regex: /((^ {0,3}>\-[ \t]?.+\n(.+\n)*\n*)+)/gm,
        replace: function(regex_match) {
          // Most of these replacements within this function are
          // copied from the subparser for the Showdown blockquote.

          var needle = regex_match;

          // trim one level of quoting
          needle = needle.replace(/^[ \t]*>-[ \t]?/gm, '¨0');

          // attacklab: clean up hack
          needle = needle.replace(/¨0/g, '');

          needle = needle.replace(/^[ \t]+$/gm, ''); // trim whitespace-only lines
          needle = needle.replace(/\n$/gm, ''); // trim whitespace-only lines
          needle = needle.split("\n").join("<br />\n"); //@TODO: bad hack to make new lines show up

          return '<blockquote class="blockquote-right"><p>\n' + needle + '\n</p></blockquote>';
        }
      },
      star_split = {
        // Creates stylized split in text

        type: 'lang',
        filter: function (text) {

          var split_pattern = "* * *",
            new_text = text.replace(split_pattern, '<span class="star-split">' + split_pattern + '</span>');

          return new_text;
        }
      },
      no_italics = {
        // Italics text are not supposed to be transformed in this
        // document, so let's change them back, mmkay.

        type: 'output',
        filter: function (text) {
          return text.replace(/<em>([^\s*][\s\S]*?)<\/em>/g, function (wm, m) {

            return (/\S$/.test(m)) ? '*' + m + '*' : wm;
          });
        }
      };

    return [right_block, star_split, no_italics];
  }

// Register the new extensions with Showdown
  showdown.extension('custom_extensions', custom_extensions);

  var converter = new showdown.Converter({
      simpleLineBreaks: 'true',
      extensions: [custom_extensions],
    }), // Initialize Showdown
    plain_text_markdown = $('.box').text(), // Showdown markup text
    html_text = converter.makeHtml(plain_text_markdown); // Convert to HTML

// Replace markup text with HTML text that will be rendered by the browser as HTML
  $('.box').html(html_text);

  return true;
});
