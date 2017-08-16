/**
 * Autocomplete global variables. Used to hold onto various global variables
 * needed for an autocomplete.
 */
// The autocomplete form selector.
var _theme_autocomplete_form_selector = {};

// The autocomplete remote boolean.
var _theme_autocomplete_remote = {};

// The theme autocomplete variables.
var _theme_autocomplete_variables = {};

// The theme autocomplete variables.
var _theme_autocomplete_success_handlers = {};

/**
 * Themes an autocomplete.
 * @param {Object} variables
 * @return {String}
 */
function theme_autocomplete(variables) {
  try {
    var html = '';
    var js = '';

    // We need to have a unique identifier for this autocomplete. If it is a
    // field, use the field name. Otherwise use the id attribute if it is
    // provided or generate a random one. Then finally attach the autocomplete
    // id to the variables so it can be passed along.
    var autocomplete_id = null;
    if (typeof variables.field_info_field !== 'undefined') {
      autocomplete_id = variables.field_info_field.field_name + '_' + variables.delta;
    }
    else if (typeof variables.attributes.id !== 'undefined') {
      autocomplete_id = variables.attributes.id;
    }
    else { autocomplete_id = user_password(); }
    variables.autocomplete_id = autocomplete_id;

    // Hold onto a copy of the variables.
    _theme_autocomplete_variables[autocomplete_id] = {};
    $.extend(true, _theme_autocomplete_variables[autocomplete_id], variables);

    // Are we dealing with a remote data set?
    var remote = false;
    if (variables.remote) { remote = true; }
    variables.remote = remote;
    _theme_autocomplete_remote[autocomplete_id] = variables.remote;

    // Make sure we have an id to use on the list.
    var id = null;
    if (variables.attributes.id) { id = variables.attributes.id; }
    else {
      id = 'autocomplete_' + user_password();
      variables.attributes.id = id;
    }

    // We need a hidden input to hold the value. If a default value
    // was provided by a form element, use it.
    var hidden_attributes = { id: id };
    if (
      variables.element &&
      typeof variables.element.default_value !== 'undefined'
    ) {
      hidden_attributes.value = variables.element.default_value;

      if (!empty(variables.element.default_value)) {
        label_value = variables.element.default_value;
        if (
          (typeof(variables.element.default_value_label) != 'undefined') &&
          (!empty(variables.element.default_value_label))
        ) {
          label_value = variables.element.default_value_label;
        }
        html += _theme_autocomplete_value(id, label_value);
      }
    }
    html += theme('hidden', { attributes: hidden_attributes });

    if ((parseInt(variables.delta) + 1) == variables.cardinality) {
      // Now we need an id for the list.
      var list_id = variables.element_id + '-list';

      // Build the widget variables.
      var widget = {
        attributes: {
          'id': list_id,
          'data-role': 'listview',
          'data-filter': 'true',
          'data-inset': 'true',
          'data-filter-placeholder': '...'
        }
      };

      // Handle a remote data set.
      if (variables.remote) {
        widget.items = [];
        // We have a remote data set.
        js += '<script type="text/javascript">' +
          '$("#' + list_id + '").on("filterablecreate", function(event, ui) {' +
            '_theme_autocomplete_visibility(\'' + autocomplete_id + '\');' +
          '}).on("filterablebeforefilter", function(e, d) {' +
            '_theme_autocomplete(this, e, d, "' + autocomplete_id + '"); ' +
          '});' +
        '</script>';
      }
      else {
        // Prepare the items then set the data filter reveal attribute.
        widget.items = _theme_autocomplete_prepare_items(variables);
        widget.attributes['data-filter-reveal'] = true;
      }

      html += theme('item_list', widget);
    }

    // Save a reference to the autocomplete text field input.
    var last_item_id = variables.element_id + '-' + variables.langcode + '-' + (variables.cardinality - 1) + '-value';
    js += '<script type="text/javascript">' +
      '_theme_autocomplete_form_selector["' + id + '"] = ' +
          '\'#' + drupalgap_get_page_id() + ' #' + last_item_id + ' + form.ui-filterable\';' +
    '</script>';

    // Theme the list and add the js to it, then return the html.
    html += js;
    return html;
  }
  catch (error) { console.log('theme_autocomplete - ' + error); }
}

/**
 * Hide autocomplete form if we reach the cardinality
 * @param {String} autocomplete_id The Id of the autocomplete element
 */
function _theme_autocomplete_visibility(autocomplete_id) {
  var id = _theme_autocomplete_variables[autocomplete_id].id;
  var element_id = _theme_autocomplete_variables[autocomplete_id].element_id;
  var field_language = _theme_autocomplete_variables[autocomplete_id].langcode;
  var field_cardinality = _theme_autocomplete_variables[autocomplete_id].cardinality;

  $(_theme_autocomplete_form_selector[id])
    .hide()
    .find('input[data-type=search]').val('');

  for (var i = 0; i < field_cardinality; i++) {
    var field_id = element_id + '-' + field_language + '-' + i + '-value';

    if (empty($('#' + field_id).val())) {
      $(_theme_autocomplete_form_selector[id])
        .show();
      break;
    }
  }
}

/**
 * Adds a button with one value of the field. When clicked, it will remove the value
 * @param {String} field_id The id of the hidden input that hold the field value.
 * @param {String} text Text to show on the button
 * @return {String} HTML code of the button
 */
function _theme_autocomplete_value(field_id, text) {
  variables = {
    text: text,
    attributes: {
      'data-inline': 'true',
      'data-icon': 'delete',
      'data-iconpos': 'right',
      'data-field_id': field_id,
      'href': '#',
      'onclick': '_theme_autocomplete_remove_value(this);'
    }
  };

  return theme('button', variables);
}

/**
 * Removes a value of a field
 * @param {Object} button Button object that was clicked
 */
function _theme_autocomplete_remove_value(button) {
  var field_id = $(button).data('field_id');

  // Empty value from field and show autocomplete form
  $('#' + field_id)
    .val('');

  $(_theme_autocomplete_form_selector[field_id])
    .show();

  $(button).remove();
}

/**
 * An internal function used to handle remote data for an autocomplete.
 * @param {Object} list The unordered list that displays the items.
 * @param {Object} e
 * @param {Object} data
 * @param {String} autocomplete_id
 */
function _theme_autocomplete(list, e, data, autocomplete_id) {
  try {
    var autocomplete = _theme_autocomplete_variables[autocomplete_id];
    // Make sure a filter is present.
    if (typeof autocomplete.filter === 'undefined') {
      console.log(
        '_theme_autocomplete - A "filter" was not supplied.'
      );
      return;
    }

    // Make sure a value and/or label has been supplied so we know how to render
    // the items in the autocomplete list.
    var value_provided = typeof autocomplete.value !== 'undefined';
    var label_provided = typeof autocomplete.label !== 'undefined';
    if (!value_provided && !label_provided) {
      console.log(
        '_theme_autocomplete - A "value" and/or "label" was not supplied.'
      );
      return;
    }
    else {
      // We have a value and/or label. If one isn't provided, set it equal to
      // the other.
      if (!value_provided) { autocomplete.value = autocomplete.label; }
      else if (!label_provided) { autocomplete.label = autocomplete.value; }
    }
    // Setup the vars to handle this widget.
    var $ul = $(list),
        $input = $(data.input),
        value = $input.val(),
        html = '';
    // Clear the list.
    $ul.html('');
    // If a value has been input, start the autocomplete search.
    if (value && value.length > 0) {
      // Show the loader icon.
      $ul.html('<li><div class="ui-loader">' +
        '<span class="ui-icon ui-icon-loading"></span>' +
        '</div></li>');
      $ul.listview('refresh');

      // Let's first build the success handler that will place the items into
      // the autocomplete list.
      _theme_autocomplete_success_handlers[autocomplete_id] = function(
        _autocomplete_id, result_items, _wrapped, _child) {
        try {
          // If there are no results, and then if an empty callback handler was
          // provided, call it.
          // empty callback handler, then call it and return.
          if (result_items.length == 0) {
            if (autocomplete.empty_callback) {
              var fn = window[autocomplete.empty_callback];
              fn(value, list, autocomplete_id);
            }
          }
          else {
            // Convert the result into an items array for a list. Each item will
            // be a JSON object with a "value" and "label" properties.
            // When using autocomplete on taxonomy_terms,
            // we use the taxonomy term name as item so it's used as value also
            var items = [];
            var _value = autocomplete.value;
            var _label = autocomplete.label;
            for (var index in result_items) {
                if (!result_items.hasOwnProperty(index)) { continue; }
                var object = result_items[index];
                var _item = null;
                if (_wrapped) { _item = object[_child]; }
                else { _item = object; }

                if (autocomplete.entity_type == 'taxonomy_term') {
                  var item = _item[_label];
                } else {
                  var item = {
                    value: _item[_value],
                    label: _item[_label]
                  };
                }
                items.push(item);
            }

            // Now render the items, add them to list and refresh the list.
            if (items.length != 0) {
              autocomplete.items = items;
              var _items = _theme_autocomplete_prepare_items(autocomplete);
              for (var index in _items) {
                  if (!_items.hasOwnProperty(index)) { continue; }
                  var item = _items[index];
                  html += '<li>' + item + '</li>';
              }
              $ul.html(html);
              $ul.listview('refresh');
              $ul.trigger('updatelayout');
            }
          }

          // Anybody want to act on the completion of the autocomplete?
          if (autocomplete.finish_callback) {
            var fn = window[autocomplete.finish_callback];
            fn(value, list, autocomplete_id);
          }

        }
        catch (error) {
          console.log('_theme_autocomplete_success_handlers[' +
            _autocomplete_id +
          '] - ' + error);
        }
      };

      // Depending on the handler, build the path and call the Drupal site for
      // the data. If it's a custom path, see if a handler was provided,
      // otherwise just default to views.
      var handler = null;
      if (autocomplete.custom) {
        if (autocomplete.handler) { handler = autocomplete.handler; }
        else if (autocomplete.field_info_field && autocomplete.field_info_field.settings.handler) {
          handler = autocomplete.field_info_field.settings.handler;
        }
        else { handler = 'views'; }
      }
      else if (autocomplete.field_info_field) {
        handler = autocomplete.field_info_field.settings.handler;
      }
      else { handler = 'views'; }
      switch (handler) {
        // Views (and Organic Groups)
        case 'views':
          // Prepare the path to the view.
          var path = autocomplete.path + '?' + autocomplete.filter + '=' +
            encodeURIComponent(value);
          // Any extra params to send along?
          if (autocomplete.params) { path += '&' + autocomplete.params; }

          // Retrieve JSON results. Keep in mind, we use this for retrieving
          // Views JSON results and custom hook_menu() path results in Drupal.
          views_datasource_get_view_result(path, {
              success: function(results) {
                // If this was a custom path, don't use a wrapper around the
                // results like the one used by Views Datasource.
                var wrapped = true;
                if (autocomplete.custom) { wrapped = false; }

                // Extract the result items based on the presence of the wrapper
                // or not.
                var result_items = null;
                if (wrapped) { result_items = results[results.view.root]; }
                else { result_items = results; }

                // Finally call the sucess handler.
                var fn = _theme_autocomplete_success_handlers[autocomplete_id];
                fn(autocomplete_id, result_items, wrapped, results.view.child);
              }
          });
          break;

        // Simple entity selection mode (provided by the entity reference
        // module), use the Index resource for the entity type.
        case 'base':
        case 'og':
          var field_settings =
            autocomplete.field_info_field.settings;
          var index_resource = field_settings.target_type + '_index';
          if (!drupalgap_function_exists(index_resource)) {
            console.log('WARNING - _theme_autocomplete - ' +
              index_resource + '() does not exist!'
            );
            return;
          }
          var options = {
            fields: [autocomplete.value, autocomplete.filter],
            parameters: { },
            parameters_op: { }
          };
          options.parameters[autocomplete.filter] = '%' + value + '%';
          options.parameters_op[autocomplete.filter] = 'like';
          var bundles = entityreference_get_target_bundles(field_settings);
          if (bundles) { options.parameters[entity_get_bundle_name(field_settings.target_type)] = bundles.join(','); }
          window[index_resource](options, {
              success: function(results) {
                _theme_autocomplete_success_handlers[autocomplete_id](autocomplete_id, results, false);
              }
          });
          break;

        // An entity index resource call. Figure out which entity type index
        // to call, and build a default query if one wasn't provided.
        case 'index':
          if (!autocomplete.entity_type) {
            console.log(
              'WARNING - _theme_autocomplete - no entity_type provided'
            );
            return;
          }
          var function_name = autocomplete.entity_type + '_index';
          var fn = window[function_name];
          var query = null;
          if (autocomplete.query) { query = autocomplete.query; }
          else {
            query = {
              parameters: { },
              parameters_op: { }
            };
            var fields = [
              entity_primary_key(autocomplete.entity_type),
              entity_primary_key_title(autocomplete.entity_type)
            ];
            if (autocomplete.entity_type == 'taxonomy_term') {
              if (autocomplete.vid) {
                query.parameters['vid'] = autocomplete.vid;
              }
            }
            query.fields = fields;
            query.parameters[autocomplete.filter] = '%' + value + '%';
            query.parameters_op[autocomplete.filter] = 'like';
          }
          fn.apply(null, [query, {
              success: function(results) {
                var fn = _theme_autocomplete_success_handlers[autocomplete_id];
                fn(autocomplete_id, results, false, null);
              }
          }]);
          break;

        // The default handler...
        default:
          // If we made it this far, and don't have a handler, then warn the
          // developer.
          if (!handler) {
            console.log('WARNING - _theme_autocomplete - no handler provided');
            return;
          }

          break;
      }
    }
    else {
      // The autocomplete text field was emptied, clear out the hidden value.
      $('#' + autocomplete.id).val('');
    }
  }
  catch (error) { console.log('_theme_autocomplete - ' + error); }
}

/**
 * An internal function used to prepare the items for an autocomplete list.
 * @param {Object} variables
 * @return {*}
 */
function _theme_autocomplete_prepare_items(variables) {
  try {
    // Make sure we have an items array.
    var items = [];
    if (variables.items) { items = variables.items; }

    // Prepare the items, and return them.
    var _items = [];
    if (items.length > 0) {
      for (var index in items) {
          if (!items.hasOwnProperty(index)) { continue; }
          var item = items[index];
          var value = '';
          var label = '';
          if (typeof item === 'string') {
            value = item;
            label = item;
          }
          else {
            value = item.value;
            label = item.label;
          }
          var options = {
            attributes: {
              value: value,
              onclick: '_theme_autocomplete_click(this, \'' + variables.autocomplete_id + '\')'
            }
          };
          var _item = l(label, null, options);
          _items.push(_item);
      }
    }
    return _items;
  }
  catch (error) { console.log('_theme_autocomplete_prepare_items - ' + error); }
}

/**
 * An internal function used to handle clicks on items in autocomplete results.
 * @param {Object} item The list item anchor that was just clicked.
 * @param {String} autocomplete_id
 */
function _theme_autocomplete_click(item, autocomplete_id) {
  try {
    var variables = _theme_autocomplete_variables[autocomplete_id];

    // Set the hidden input with the value, and the text field with the text.
    var list_id = variables.element_id + '-list';

    var field_language = variables.langcode;
    var field_cardinality = variables.cardinality;

    // Search for an empty position within the field values
    for (var i = 0; i < field_cardinality; i++) {
      var field_id = variables.element_id + '-' + field_language + '-' + i + '-value';

      if (empty($('#' + field_id).val())) {
        $('#' + field_id)
          .val($(item).attr('value'))
          .before(
            _theme_autocomplete_value(field_id, $(item).text())
          )
          .prev('[data-role=button]')
            .buttonMarkup()
        break;
      }
    }

    if (_theme_autocomplete_remote[autocomplete_id]) {
      $('#' + list_id).html('');
    }
    else {
      $('#' + list_id + ' li').addClass('ui-screen-hidden');
      $('#' + list_id).listview('refresh');
    }

    _theme_autocomplete_visibility(autocomplete_id);

    // Now fire the item onclick handler, if one was provided.
    if (
      _theme_autocomplete_variables[autocomplete_id].item_onclick &&
      drupalgap_function_exists(
        _theme_autocomplete_variables[autocomplete_id].item_onclick
      )
    ) {
      var fn =
        window[_theme_autocomplete_variables[autocomplete_id].item_onclick];
      fn(autocomplete_id, $(item));
    }
  }
  catch (error) { console.log('_theme_autocomplete_click - ' + error); }
}
