modExtra.grid.Items = function (config) {
    config = config || {};
    if (!config.id) {
        config.id = 'modextra-grid-items';
    }
    Ext.applyIf(config, {
        url: modExtra.config.connector_url,
        fields: this.getFields(config),
        columns: this.getColumns(config),
        tbar: this.getTopBar(config),
        // sm: new Ext.grid.CheckboxSelectionModel(),
        sm: new Ext.grid.RowSelectionModel({singleSelect:true}),
        baseParams: {
            action: 'mgr/item/getlist',
            sort: 'rank',
            dir: 'asc',
        },
        stateful: true,
        stateId: config.id,
        ddGroup: 'modextra-grid-statusDD',
        ddAction: 'mgr/item/sort',
        enableDragDrop: true,
        multi_select: true,
        listeners: {
            rowDblClick: function (grid, rowIndex, e) {
                var row = grid.store.getAt(rowIndex);
                this.updateItem(grid, e, row);
            },
            render:{
                scope: this,
                fn: function(grid) {
                    var grid = this;
                    var el = grid.getEl();
                    new Ext.dd.DropTarget(el, {
                        ddGroup: grid.ddGroup,
                        notifyDrop: function (dd, e, data) {
                            var store = grid.getStore();
                            var target = store.getAt(dd.getDragData(e).rowIndex);
                            var sources = [];
                            if (data.selections.length < 1 || data.selections[0].id == target.id) {
                                return false;
                            }
                            for (var i in data.selections) {
                                if (!data.selections.hasOwnProperty(i)) {
                                    continue;
                                }
                                var row = data.selections[i];
                                sources.push(row.id);
                            }

                            el.mask(_('loading'), 'x-mask-loading');
                            MODx.Ajax.request({
                                url: config.url,
                                params: {
                                    action: config.ddAction,
                                    sources: Ext.util.JSON.encode(sources),
                                    target: target.id,
                                },
                                listeners: {
                                    success: {
                                        fn: function () {
                                            el.unmask();
                                            grid.refresh();
                                            if (typeof(grid.reloadTree) == 'function') {
                                                sources.push(target.id);
                                                grid.reloadTree(sources);
                                            }
                                        }, scope: grid
                                    },
                                    failure: {
                                        fn: function () {
                                            el.unmask();
                                        }, scope: grid
                                    },
                                }
                            });
                        },
                        notifyOver: function(dd, e, data) {
                            var returnCls = this.dropAllowed;
                            return returnCls;
                        },
                    });
                },
            },
        },
        viewConfig: {
            forceFit: true,
            enableRowBody: true,
            autoFill: true,
            showPreview: true,
            scrollOffset: 0,
            getRowClass: function (rec) {
                return !rec.data.active
                    ? 'modextra-grid-row-disabled'
                    : '';
            }
        },
        paging: true,
        remoteSort: true,
        autoHeight: true,
    });
    modExtra.grid.Items.superclass.constructor.call(this, config);

    // Clear selection on grid refresh
    this.store.on('load', function () {
        if (this._getSelectedIds().length) {
            this.getSelectionModel().clearSelections();
        }
    }, this);
};
Ext.extend(modExtra.grid.Items, MODx.grid.Grid, {
    windows: {},

    getMenu: function (grid, rowIndex) {
        var ids = this._getSelectedIds();

        var row = grid.getStore().getAt(rowIndex);
        var menu = modExtra.utils.getMenu(row.data['actions'], this, ids);

        this.addContextMenuItem(menu);
    },

    statusAction: function (method) {
        var ids = this._getSelectedIds();
        if (!ids.length) {
            return false;
        }
        MODx.Ajax.request({
            url: modExtra.config.connector_url,
            params: {
                action: 'mgr/item/multiple',
                method: method,
                ids: Ext.util.JSON.encode(ids),
            },
            listeners: {
                success: {
                    fn: function () {
                        //noinspection JSUnresolvedFunction
                        this.refresh();
                    }, scope: this
                },
                failure: {
                    fn: function (response) {
                        MODx.msg.alert(_('error'), response.message);
                    }, scope: this
                },
            }
        });
    },

    createItem: function (btn, e) {
        var w = MODx.load({
            xtype: 'modextra-item-window-create',
            id: Ext.id(),
            listeners: {
                success: {
                    fn: function () {
                        this.refresh();
                    }, scope: this
                }
            }
        });
        w.reset();
        w.setValues({active: true});
        w.show(e.target);
    },

    updateItem: function (btn, e, row) {
        if (typeof(row) != 'undefined') {
            this.menu.record = row.data;
        }
        else if (!this.menu.record) {
            return false;
        }
        var id = this.menu.record.id;

        MODx.Ajax.request({
            url: this.config.url,
            params: {
                action: 'mgr/item/get',
                id: id
            },
            listeners: {
                success: {
                    fn: function (r) {
                        var w = MODx.load({
                            xtype: 'modextra-item-window-update',
                            id: Ext.id(),
                            record: r,
                            listeners: {
                                success: {
                                    fn: function () {
                                        this.refresh();
                                    }, scope: this
                                }
                            }
                        });
                        w.reset();
                        w.setValues(r.object);
                        w.show(e.target);
                    }, scope: this
                }
            }
        });
    },

    removeItem: function () {
        var ids = this._getSelectedIds();

        Ext.MessageBox.confirm(
            _('modextra_item_remove_title'),
            ids.length > 1
                ? _('modextra_items_remove_confirm')
                : _('modextra_item_remove_confirm'),
            function (val) {
                if (val == 'yes') {
                    this.statusAction('remove');
                }
            }, this
        );
    },

    disableItem: function () {
        this.statusAction('disable');
    },

    enableItem: function () {
        this.statusAction('enable');
    },

    getFields: function () {
        return ['id', 'name', 'description', 'active', 'actions'];
    },

    getColumns: function () {
        return [{
            header: _('modextra_item_id'),
            dataIndex: 'id',
            sortable: true,
            width: 70
        }, {
            header: _('modextra_item_name'),
            dataIndex: 'name',
            sortable: true,
            width: 200,
        }, {
            header: _('modextra_item_description'),
            dataIndex: 'description',
            sortable: false,
            width: 250,
        }, {
            header: _('modextra_item_active'),
            dataIndex: 'active',
            renderer: modExtra.utils.renderBoolean,
            sortable: true,
            width: 100,
        }, {
            header: _('modextra_grid_actions'),
            dataIndex: 'actions',
            renderer: modExtra.utils.renderActions,
            sortable: false,
            width: 100,
            id: 'actions'
        }];
    },

    getTopBar: function () {
        return [{
            text: '<i class="icon icon-plus"></i>&nbsp;' + _('modextra_item_create'),
            handler: this.createItem,
            scope: this
        }, '->', {
            xtype: 'modextra-field-search',
            width: 250,
            listeners: {
                search: {
                    fn: function (field) {
                        this._doSearch(field);
                    }, scope: this
                },
                clear: {
                    fn: function (field) {
                        field.setValue('');
                        this._clearSearch();
                    }, scope: this
                },
            }
        }];
    },

    onClick: function (e) {
        var elem = e.getTarget();
        if (elem.nodeName == 'BUTTON') {
            var row = this.getSelectionModel().getSelected();
            if (typeof(row) != 'undefined') {
                var action = elem.getAttribute('action');
                if (action == 'showMenu') {
                    var ri = this.getStore().find('id', row.id);
                    return this._showMenu(this, ri, e);
                }
                else if (typeof this[action] === 'function') {
                    this.menu.record = row.data;
                    return this[action](this, e);
                }
            }
        }
        return this.processEvent('click', e);
    },

    _getSelectedIds: function () {
        var ids = [];
        var selected = this.getSelectionModel().getSelections();

        for (var i in selected) {
            if (!selected.hasOwnProperty(i)) {
                continue;
            }
            ids.push(selected[i]['id']);
        }

        return ids;
    },

    _doSearch: function (tf) {
        this.getStore().baseParams.query = tf.getValue();
        this.getBottomToolbar().changePage(1);
    },

    _clearSearch: function () {
        this.getStore().baseParams.query = '';
        this.getBottomToolbar().changePage(1);
    },
});
Ext.reg('modextra-grid-items', modExtra.grid.Items);
