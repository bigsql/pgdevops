// Restore dialog
define('tools.restore', [
  'sources/gettext', 'sources/url_for', 'jquery', 'underscore',
  'underscore.string', 'pgadmin.alertifyjs', 'pgadmin.browser', 'backbone', 'backgrid',
  'backform', 'pgadmin.browser.node'
], function(
  gettext, url_for, $, _, S, alertify, pgBrowser, Backbone, Backgrid, Backform,
  pgNode
) {

    // if module is already initialized, refer to that.
    if (pgBrowser.Restore) {
      return pgBrowser.Restore;
    }

    var CustomSwitchControl = Backform.CustomSwitchControl = Backform.SwitchControl.extend({
        template: _.template([
          '<label class="<%=Backform.controlLabelClassName%> custom_switch_label_class"><%=label%></label>',
          '<div class="<%=Backform.controlsClassName%> custom_switch_control_class">',
          '  <div class="checkbox">',
          '    <label>',
          '      <input type="checkbox" class="<%=extraClasses.join(\' \')%>" name="<%=name%>" <%=value ? "checked=\'checked\'" : ""%> <%=disabled ? "disabled" : ""%> <%=required ? "required" : ""%> />',
          '    </label>',
          '  </div>',
          '</div>',
          '<% if (helpMessage && helpMessage.length) { %>',
          '  <span class="<%=Backform.helpMessageClassName%>"><%=helpMessage%></span>',
          '<% } %>'
        ].join("\n")),
        className: 'pgadmin-control-group form-group pg-el-xs-4'
    });

    //Restore Model (Objects like Database/Schema/Table)
    var RestoreObjectModel = Backbone.Model.extend({
      idAttribute: 'id',
      defaults: {
        custom: false,
        file: undefined,
        role: undefined,
        format: 'custom',
        verbose: true,
        blobs: true,
        encoding: undefined,
        database: undefined,
        schemas: undefined,
        tables: undefined,
        functions: undefined,
        triggers: undefined,
        trigger_funcs: undefined,
        indexes: undefined
      },

      // Default values!
      initialize: function(attrs, args) {
        // Set default options according to node type selection by user
        var node_type = attrs.node_data.type;

        if (node_type) {
          // Only_Schema option
          if (node_type === 'function' || node_type === 'index'
          || node_type === 'trigger') {
            this.set({'only_schema': true}, {silent: true});
          }

          // Only_Data option
          if (node_type === 'table') {
            this.set({'only_data': true}, {silent: true});
          }

          // Clean option
          if (node_type === 'function' || node_type === 'trigger_function') {
            this.set({'clean': true}, {silent: true});
          }
        }
        Backbone.Model.prototype.initialize.apply(this, arguments);
      },
      schema: [{
        id: 'format', label: gettext('Format'),
        type: 'text', disabled: false,
        control: 'select2', select2: {
            allowClear: false,
            width: "100%"
        },
        options: [
          {label: gettext('Custom or tar'), value: "custom"},
          {label: gettext('Directory'), value: "directory"}
        ]
      },{
        id: 'file', label: gettext('Filename'),
        type: 'text', disabled: false, control: Backform.FileControl,
        dialog_type: 'select_file', supp_types: ['*', 'backup','sql', 'patch']
      },{
        id: 'no_of_jobs', label: gettext('Number of jobs'),
        type: 'int'
      },{
        id: 'role', label: gettext('Role name'),
        control: 'node-list-by-name', node: 'role',
        select2: { allowClear: false }
      },{
        type: 'nested', control: 'fieldset', label: gettext('Sections'),
        group: gettext('Restore options'),
        schema:[{
          id: 'pre_data', label: gettext('Pre-data'),
          control: Backform.CustomSwitchControl, group: gettext('Sections'),
          deps: ['only_data', 'only_schema'], disabled: function(m) {
            return this.node.type !== 'function' && this.node.type !== 'table'
                   && this.node.type !== 'trigger'
                   && this.node.type !== 'trigger_function'
                   && (m.get('only_data') || m.get('only_schema'));
          }
        },{
          id: 'data', label: gettext('Data'),
          control: Backform.CustomSwitchControl, group: gettext('Sections'),
          deps: ['only_data', 'only_schema'], disabled: function(m) {
            return this.node.type !== 'function' && this.node.type !== 'table'
                   && this.node.type !== 'trigger'
                   && this.node.type !== 'trigger_function'
                   && (m.get('only_data') || m.get('only_schema'));
          }
        },{
          id: 'post_data', label: gettext('Post-data'),
          control: Backform.CustomSwitchControl, group: gettext('Sections'),
          deps: ['only_data', 'only_schema'], disabled: function(m) {
            return this.node.type !== 'function' && this.node.type !== 'table'
                   && this.node.type !== 'trigger'
                   && this.node.type !== 'trigger_function'
                   && (m.get('only_data') || m.get('only_schema'));
          }
        }]
      },{
        type: 'nested', control: 'fieldset', label: gettext('Type of objects'),
        group: gettext('Restore options'),
        schema:[{
          id: 'only_data', label: gettext('Only data'),
          control: Backform.CustomSwitchControl, group: gettext('Type of objects'),
          deps: ['pre_data', 'data', 'post_data','only_schema'], disabled: function(m) {
            return (this.node.type !== 'database' && this.node.type !== 'schema')
                   || ( m.get('pre_data')
                        ||m.get('data')
                        || m.get('post_data')
                        || m.get('only_schema')
                      );
          }
        },{
          id: 'only_schema', label: gettext('Only schema'),
          control: Backform.CustomSwitchControl, group: gettext('Type of objects'),
          deps: ['pre_data', 'data', 'post_data', 'only_data'], disabled: function(m) {
            return (this.node.type !== 'database' && this.node.type !== 'schema')
                   || ( m.get('pre_data')
                        || m.get('data')
                        || m.get('post_data')
                        || m.get('only_data')
                      );
          }
        }]
      },{
        type: 'nested', control: 'fieldset', label: gettext('Do not save'),
        group: gettext('Restore options'),
        schema:[{
          id: 'dns_owner', label: gettext('Owner'),
          control: Backform.CustomSwitchControl, disabled: false, group: gettext('Do not save')
        },{
          id: 'dns_privilege', label: gettext('Privilege'),
          control: Backform.CustomSwitchControl, disabled: false, group: gettext('Do not save')
        },{
          id: 'dns_tablespace', label: gettext('Tablespace'),
          control: Backform.CustomSwitchControl, disabled: false, group: gettext('Do not save')
        }]
      },{
        type: 'nested', control: 'fieldset', label: gettext('Queries'),
        group: gettext('Restore options'),
        schema:[{
          id: 'include_create_database', label: gettext('Include CREATE DATABASE statement'),
          control: Backform.CustomSwitchControl, disabled: false, group: gettext('Queries')
        },{
          id: 'clean', label: gettext('Clean before restore'),
          control: Backform.CustomSwitchControl, group: gettext('Queries'),
          disabled: function(m) {
            return this.node.type === 'function' ||
                     this.node.type === 'trigger_function';
          }
        },{
          id: 'single_transaction', label: gettext('Single transaction'),
          control: Backform.CustomSwitchControl, disabled: false, group: gettext('Queries')
        }]
      },{
        type: 'nested', control: 'fieldset', label: gettext('Disable'),
        group: gettext('Restore options'),
        schema:[{
          id: 'disable_trigger', label: gettext('Trigger'),
          control: Backform.CustomSwitchControl, group: gettext('Disable')
        },{
          id: 'no_data_fail_table', label: gettext('No data for Failed Tables'),
          control: Backform.CustomSwitchControl, disabled: false, group: gettext('Disable')
        }]
      },{
        type: 'nested', control: 'fieldset', label: gettext('Miscellaneous / Behavior'),
        group: gettext('Restore options'),
        schema:[{
          id: 'verbose', label: gettext('Verbose messages'),
          control: Backform.CustomSwitchControl, disabled: false,
          group: gettext('Miscellaneous / Behavior')
        },{
          id: 'use_set_session_auth', label: gettext('Use SET SESSION AUTHORIZATION'),
          control: Backform.CustomSwitchControl, disabled: false,
          group: gettext('Miscellaneous / Behavior')
        },{
          id: 'exit_on_error', label: gettext('Exit on error'),
          control: Backform.CustomSwitchControl, disabled: false,
          group: gettext('Miscellaneous / Behavior')
        }]
      }],
      validate: function() {
        return null;
      }
    });

    // Create an Object Restore of pgBrowser class
    pgBrowser.Restore  = {
      init: function() {
        if (this.initialized)
          return;

        this.initialized = true;

        // Define list of nodes on which restore context menu option appears
        var restore_supported_nodes = [
              'database', 'schema',
              'table', 'function',
              'trigger', 'index',
              'partition'
            ];

        /**
          Enable/disable restore menu in tools based
          on node selected
          if selected node is present in supported_nodes,
          menu will be enabled otherwise disabled.
          Also, hide it for system view in catalogs
        */
        var menu_enabled = function(itemData, item, data) {
          var t = pgBrowser.tree, i = item, d = itemData;
          var parent_item = t.hasParent(i) ? t.parent(i): null,
              parent_data = parent_item ? t.itemData(parent_item) : null;
            if(!_.isUndefined(d) && !_.isNull(d) && !_.isNull(parent_data)) {
              if (_.indexOf(restore_supported_nodes, d._type) !== -1 &&
                is_parent_catalog(itemData, item, data) ) {
                  if (d._type == 'database' && d.allowConn)
                    return true;
                  else if(d._type != 'database')
                    return true;
                  else
                    return false;
              }
              else
                return false;
            }
            else
              return false;
        };

        var is_parent_catalog = function(itemData, item, data) {
          var t = pgBrowser.tree, i = item, d = itemData;
          // To iterate over tree to check parent node
          while (i) {
            // If it is schema then allow user to restore
            if (_.indexOf(['catalog'], d._type) > -1)
              return false;
            i = t.hasParent(i) ? t.parent(i) : null;
            d = i ? t.itemData(i) : null;
          }
          // by default we do not want to allow create menu
          return true;
        }

        // Define the nodes on which the menus to be appear
        var menus = [{
          name: 'restore_object', module: this,
          applies: ['tools'], callback: 'restore_objects',
          priority: 13, label: gettext('Restore...'),
          icon: 'fa fa-upload', enable: menu_enabled
        }];

        for (var idx = 0; idx < restore_supported_nodes.length; idx++) {
          menus.push({
            name: 'restore_' + restore_supported_nodes[idx],
            node: restore_supported_nodes[idx], module: this,
            applies: ['context'], callback: 'restore_objects',
            priority: 13, label: gettext('Restore...'),
            icon: 'fa fa-upload', enable: menu_enabled
            });
        }

        pgAdmin.Browser.add_menus(menus);
        return this;
      },
      // Callback to draw Backup Dialog for objects
      restore_objects: function(action, treeItem) {

        var i = treeItem || pgBrowser.tree.selected(),
          server_data = null;

        while (i) {
          var node_data = pgBrowser.tree.itemData(i);
          if (node_data._type == 'server') {
            server_data = node_data;
            break;
          }

          if (pgBrowser.tree.hasParent(i)) {
            i = $(pgBrowser.tree.parent(i));
          } else {
            alertify.alert(
              gettext("Restore Error"),
              gettext("Please select server or child node from tree.")
            );
            break;
          }
        }

        if (!server_data) {
          return;
        }

        var module = 'paths',
          preference_name = 'pg_bin_dir',
          msg = gettext('Please configure the PostgreSQL Binary Path in the Preferences dialog.');

        if ((server_data.type && server_data.type == 'ppas') ||
            server_data.server_type == 'ppas') {
          preference_name = 'ppas_bin_dir';
          msg = gettext('Please configure the EDB Advanced Server Binary Path in the Preferences dialog.');
        }

        var preference = pgBrowser.get_preference(module, preference_name);

        if(preference) {
          if (!preference.value) {
            alertify.alert(gettext('Configuration required'), msg);
            return;
          }
        } else {
          alertify.alert(
            gettext("Restore Error"),
            S(gettext('Failed to load preference %s of module %s')).sprintf(preference_name, module).value()
          );
          return;
        }

        var title = S(gettext('Restore (%s: %s)')),
            tree = pgBrowser.tree,
            item = treeItem || tree.selected(),
            data = item && item.length == 1 && tree.itemData(item),
            node = data && data._type && pgBrowser.Nodes[data._type];

        if (!node)
          return;

        title = title.sprintf(node.label, data.label).value();

        if(!alertify.pg_restore) {
          // Create Dialog title on the fly with node details
          alertify.dialog('pg_restore' ,function factory() {
            return {
               main: function(title, item, data, node) {
                this.set('title', title);
                this.setting('pg_node', node);
                this.setting('pg_item', item);
                this.setting('pg_item_data', data);
               },
               build: function() {
                alertify.pgDialogBuild.apply(this)
               },
               setup:function() {
                return {
                  buttons: [{
                    text: '', className: 'btn btn-default pull-left fa fa-lg fa-info',
                    attrs:{name:'object_help', type:'button', url: 'backup.html', label: gettext('Restore')}
                  },{
                    text: '', key: 112, className: 'btn btn-default pull-left fa fa-lg fa-question',
                    attrs:{
                      name:'dialog_help', type:'button', label: gettext('Restore'),
                      url: url_for('help.static', {'filename': 'restore_dialog.html'})
                    }
                  },{
                    text: gettext('Restore'), key: 13,
                    className: 'btn btn-primary fa fa-upload pg-alertify-button', restore: true,
                    'data-btn-name': 'restore'
                  },{
                    text: gettext('Cancel'), key: 27,
                    className: 'btn btn-danger fa fa-lg fa-times pg-alertify-button', restore: false,
                    'data-btn-name': 'cancel'
                  }],
                  // Set options for dialog
                  options: {
                    title: title,
                    //disable both padding and overflow control.
                    padding : !1,
                    overflow: !1,
                    model: 0,
                    resizable: true,
                    maximizable: true,
                    pinnable: false,
                    closableByDimmer: false,
                    modal: false
                  }
                };
              },
              hooks: {
                // triggered when the dialog is closed
                onclose: function() {
                  if (this.view) {
                    this.view.remove({data: true, internal: true, silent: true});
                  }
                }
              },
              settings:{
                pg_node: null,
                pg_item: null,
                pg_item_data: null
              },
              prepare: function() {

                var self = this;
                // Disable Backup button until user provides Filename
                this.__internal.buttons[2].element.disabled = true;
                var $container = $("<div class='restore_dialog'></div>");
                var t = pgBrowser.tree,
                  i = t.selected(),
                  d = i && i.length == 1 ? t.itemData(i) : undefined,
                  node = d && pgBrowser.Nodes[d._type];

                if (!d)
                  return;

                var treeInfo = node.getTreeNodeHierarchy.apply(node, [i]);

                var newModel = new RestoreObjectModel(
                  {node_data: node}, {node_info: treeInfo}
                  ),
                  fields = Backform.generateViewSchema(
                    treeInfo, newModel, 'create', node, treeInfo.server, true
                  );

                var view = this.view = new Backform.Dialog({
                  el: $container, model: newModel, schema: fields
                });

                $(this.elements.body.childNodes[0]).addClass(
                  'alertify_tools_dialog_properties obj_properties'
                );

                view.render();

                this.elements.content.appendChild($container.get(0));

                 // Listen to model & if filename is provided then enable Backup button
                this.view.model.on('change', function() {
                    if (!_.isUndefined(this.get('file')) && this.get('file') !== '') {
                      this.errorModel.clear();
                      self.__internal.buttons[2].element.disabled = false;
                    } else {
                      self.__internal.buttons[2].element.disabled = true;
                      this.errorModel.set('file', gettext('Please provide filename'))
                    }
                });

              },
              // Callback functions when click on the buttons of the Alertify dialogs
              callback: function(e) {
                // Fetch current server id
                var t = pgBrowser.tree,
                  i = this.settings['pg_item'] || t.selected(),
                  d = this.settings['pg_item_data'] || (
                    i && i.length == 1 ? t.itemData(i) : undefined
                  ),
                  node = this.settings['pg_node'] || (
                    d && pgBrowser.Nodes[d._type]
                  );

                if (e.button.element.name == "dialog_help" || e.button.element.name == "object_help") {
                  e.cancel = true;
                  pgBrowser.showHelp(e.button.element.name, e.button.element.getAttribute('url'),
                    node, i, e.button.element.getAttribute('label'));
                  return;
                }

                if (e.button['data-btn-name'] === "restore") {
                  if (!d)
                    return;

                  var info = node.getTreeNodeHierarchy.apply(node, [i]),
                      m = this.view.model;
                  // Set current node info into model
                  m.set('database', info.database._label);
                  if (!m.get('custom')) {
                    switch (d._type) {
                      case 'schema':
                        m.set('schemas', [d._label]);
                        break;
                      case 'table':
                        m.set('schemas', [info.schema._label]);
                        m.set('tables', [d._label]);
                        break;
                      case 'function':
                        m.set('schemas', [info.schema._label]);
                        m.set('functions', [d._label]);
                        break;
                      case 'index':
                        m.set('schemas', [info.schema._label]);
                        m.set('indexes', [d._label]);
                        break;
                      case 'trigger':
                        m.set('schemas', [info.schema._label]);
                        m.set('triggers', [d._label]);
                        break;
                      case 'trigger_func':
                        m.set('schemas', [info.schema._label]);
                        m.set('trigger_funcs', [d._label]);
                        break;
                    }
                  } else {
                    // TODO::
                    // When we will implement the object selection in the
                    // import dialog, we will need to select the objects from
                    // the tree selection tab.
                  }

                  var self = this,
                      baseUrl = url_for('restore.create_job', {'sid': info.server._id}),
                      args =  this.view.model.toJSON();

                  $.ajax({
                    url: baseUrl,
                    method: 'POST',
                    data:{ 'data': JSON.stringify(args) },
                    success: function(res) {
                      if (res.success) {
                        alertify.success(
                          gettext('Restore job created.'), 5
                        );
                        pgBrowser.Events.trigger('pgadmin-bgprocess:created', self);
                      } else {
                        console.log(res);
                      }
                    },
                    error: function(xhr, status, error) {
                      try {
                        var err = $.parseJSON(xhr.responseText);
                        alertify.alert(
                          gettext('Restore failed.'),
                          err.errormsg
                        );
                      } catch (e) {}
                    }
                  });
                }
             }
          };
        });
      }

      alertify.pg_restore(title, item, data, node).resizeTo('65%','60%');
      }
    };
    return pgBrowser.Restore;
  });
