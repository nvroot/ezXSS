$(document).ready(function() {
    $.fn.dataTable.ext.errMode = 'none';

    const commonSettings = {
        scrollX: false,
        autoWidth: true,
        responsive: true,
        pagingType: "simple_numbers",
        dom: '<"top"lipf>rt',
        language: {
            search: "_INPUT_",
            searchPlaceholder: "Search...",
            lengthMenu: "Show _MENU_ entries",
            info: "Showing _START_ to _END_ of _TOTAL_ entries",
            paginate: {
                first: "«",
                previous: "‹",
                next: "›",
                last: "»"
            }
        },
        initComplete: function(settings, json) {
            const api = this.api();
            const tableId = $(api.table().node()).attr('id');
            
            if (!$('#column-context-menu').length) {
                $('body').append(`
                    <div id="column-context-menu" class="dropdown-menu" style="display: none; position: absolute; z-index: 1000; padding: 10px;">
                        <a class="dropdown-item hide-column" href="#">Hide column</a>
                    </div>
                `);
            }

            $(`#${tableId}`).on('contextmenu', 'thead th', function(e) {
                e.preventDefault();
                const columnIndex = api.column(this).index();
                $('#column-context-menu').css({
                    top: e.pageY + 'px',
                    left: e.pageX + 'px',
                    display: 'block'
                }).data('column-index', columnIndex).data('table-instance', api);
                return false;
            });
            
            $(document).on('click', '.hide-column', function(e) {
                e.preventDefault();
                const columnIndex = $('#column-context-menu').data('column-index');
                const tableApi = $('#column-context-menu').data('table-instance');
                if (tableApi && typeof columnIndex !== 'undefined') {
                    tableApi.column(columnIndex).visible(false, false).draw();
                }
                $('#column-context-menu').hide();
            });
            
            $(document).on('click', function(e) {
                if (!$(e.target).closest('#column-context-menu').length) {
                    $('#column-context-menu').hide();
                }
            });
        }
    };

    // Reports table
    new DataTable('#reports', {
        ...commonSettings,
        autoWidth: false,
        responsive: false,
        ajax: {
            url: "/manage/reports/data",
            contentType: "application/json",
            type: "POST",
            data: function(d) {
                d.id = window.location.pathname.split('/').filter(Boolean).pop() === 'all' ? 0 : esc(window.location.pathname.split('/').filter(Boolean).pop());
                d.archive = window.location.search.includes('archive=1') ? 1 : 0;
                return JSON.stringify(d);
            }
        },
        columns: safeColumns([
            {
                className: 'dt-body-left',
                data: 'shareid',
                orderable: false,
                render: function(data, type, row) {
                    return `
                        <div class="action-column">
                            <label class="reports-checkbox-label" for="chk_${row.id}">
                                <input class="chkbox" type="checkbox" name="selected" value="${row.id}" id="chk_${row.id}" report-id="${row.id}">
                                <span class="reports-checkbox-custom rectangular"></span>
                            </label>
                            <div class="btn-group btn-view" role="group">
                                <a href="/manage/reports/view/${row.id}" class="btn pretty-border">View</a>
                                <div class="btn-group" role="group">
                                    <button type="button" class="btn btn-default dropdown-toggle pretty-border" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
                                        <span class="caret"></span>
                                    </button>
                                    <div class="dropdown-backdrop"></div>
                                    <ul class="dropdown-menu">
                                        <li><a class="share" report-id="${row.id}" share-id="${esc(data)}" data-toggle="modal" data-target="#shareModal">Share</a></li>
                                        <li><a class="delete" report-id="${row.id}">Delete</a></li>
                                        <li><a class="archive" report-id="${row.id}">Archive</a></li>
                                    </ul>
                                </div>
                            </div>
                        </div>`;
                }
            },
            { data: 'id', className: 'dt-id-column' },
            { data: 'uri', className: 'truncate' },
            { 
                data: 'ip',
                className: 'truncate',
                render: function(data, type, row) {
                    if (type === 'display' || type === 'type') {
                        return esc(data) && data.length > 15 ? esc(data.substring(0, 15)) + '..' : esc(data);
                    }
                    return esc(data);
                }
            },
            { data: 'browser', className: 'truncate' },
            { data: 'payload', className: 'truncate' },
            { data: 'last' }
        ]),
        columnDefs: [{ targets: 2, className: "truncate" }],
        createdRow: function(row, data) {
            $(row).attr('id', data.id);
        },
        order: [[1, 'desc']],
        drawCallback: function() {
            $('.with-bar').toggle(this.api().data().any());
        }
    });

    // Persistent table
    const dataTablePersistent = new DataTable('#persistent', {
        ...commonSettings,
        autoWidth: false,
        responsive: false,
        ajax: {
            url: "/manage/persistent/sessions",
            contentType: "application/json",
            type: "POST",
            data: function(d) {
                d.id = window.location.pathname.split('/').filter(Boolean).pop() === 'all' ? 0 : esc(window.location.pathname.split('/').filter(Boolean).pop());
                d.archive = window.location.search.includes('archive=1') ? 1 : 0;
                return JSON.stringify(d);
            }
        },
        columns: safeColumns([
            {
                className: 'dt-body-left persistent-column',
                data: 'clientid',
                orderable: false,
                render: function(data, type, row) {
                    return `
                        <div class="action-column">
                            <label class="reports-checkbox-label" for="chk_${row.id}">
                                <input class="chkbox" type="checkbox" name="selected" value="${row.id}" id="chk_${row.id}" url="/manage/persistent/session/${esc(row.link)}">
                                <span class="reports-checkbox-custom rectangular" style="top:7px"></span>
                            </label>
                            <a href="/manage/persistent/session/${esc(row.link)}">${esc(data)}</a>
                        </div>`;
                }
            },
            { data: 'browser' },
            { 
                data: 'ip',
                className: 'truncate',
                render: function(data, type, row) {
                    if (type === 'display' || type === 'type') {
                        return esc(data) && data.length > 15 ? esc(data.substring(0, 15)) + '..' : esc(data);
                    }
                    return esc(data);
                }
            },
            { data: 'shorturi', className: 'truncate' },
            { data: 'payload', className: 'truncate' },
            { data: 'requests' },
            { 
                data: 'last',
                render: function(data, type, row) {
                    return type === 'sort' ? row.time : data;
                }
            }
        ]),
        order: [[6, 'desc']],
        drawCallback: function() {
            $('.with-bar').toggle(this.api().data().any());
        }
    });

    // Persistent table auto-refresh
    if (location.pathname.split('/')[2] === "persistent") {
        let elapsedTime = 0;
        setInterval(function() {
            elapsedTime++;
            $("#last").text(elapsedTime + "s ago");
        }, 1000);
        setInterval(function() {
            dataTablePersistent.ajax.reload(null, false);
            elapsedTime = 0;
        }, 120000);
    }

    // Logs table
    new DataTable('#logs', {
        ...commonSettings,
        ajax: {
            url: "/manage/logs/data",
            contentType: "application/json",
            type: "POST",
            data: function(d) {
                return JSON.stringify(d);
            }
        },
        columns: safeColumns([
            { 
                data: 'user',
                render: function(data, type, row) {
                    if(data !== 'Not logged in') {
                        return `<a href="/manage/users/edit/${row.user_id}">${esc(data)}</a>`;
                    }
                    return esc(data);
                }
            },
            { data: 'description', className: 'truncate' },
            { data: 'ip', className: 'truncate' },
            { 
                data: 'date',
                render: function(data, type, row) {
                    return type === 'sort' ? row.time : data;
                }
            }
        ]),
        order: [[3, 'desc']]
    });

    // Users table
    new DataTable('#users', {
        ...commonSettings,
        ajax: {
            url: "/manage/users/data",
            contentType: "application/json",
            type: "POST",
            data: function(d) {
                return JSON.stringify(d);
            }
        },
        columns: safeColumns([
            { data: 'id' },
            { data: 'username',
                render: function(data, type, row) {
                    return `<a href="/manage/users/edit/${row.id}">${esc(data)}</a>`;
                }
             },
            { data: 'rank' },
            { data: 'payloads', className: 'truncate' }
        ]),
        order: [[0, 'asc']],
        dom: '<"top"pf>rt'
    });

    // Extensions table
    new DataTable('#extensions', {
        ...commonSettings,
        autoWidth: false,
        responsive: false,
        ajax: {
            url: "/manage/extensions/data",
            contentType: "application/json",
            type: "POST",
            data: function(d) {
                return JSON.stringify(d);
            }
        },
        columns: safeColumns([
            { 
                data: 'id',
                orderable: false,
                className: 'dt-actions-column',
                render: function(data, type, row) {
                    return `<div class="btn-group btn-view" role="group">
                                <a href="/manage/extensions/edit/${row.id}" class="btn pretty-border">Edit</a>
                                <div class="btn-group" role="group">
                                    <button type="button" class="btn btn-default dropdown-toggle pretty-border" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
                                        <span class="caret"></span>
                                    </button>
                                    <div class="dropdown-backdrop"></div>
                                    <ul class="dropdown-menu">
                                        <li><a class="update" href="/manage/extensions/update/${row.id}">Update</a></li>
                                        <li><a class="delete" href="/manage/extensions/delete/${row.id}">Delete</a></li>
                                    </ul>
                                </div>
                            </div>`;
                }
            },
            { data: 'name'},
            { data: 'description'},
            { data: 'author', className: "truncate" },
            { data: 'version', className: 'dt-version-column' },
            { 
                data: 'enabled',
                orderable: false,
                className: 'text-center extension-toggle-cell dt-toggle-column',
                render: function(data, type, row) {
                    const isEnabled = data == 1;
                    const checked = isEnabled ? 'checked' : '';
                    return `<label class="extension-toggle-label" for="ext_${row.id}">
                                <input class="extension-toggle" type="checkbox" id="ext_${row.id}" data-id="${row.id}" ${checked}>
                                <span class="extension-checkbox-custom rectangular"></span>
                            </label>`;
                }
            }
        ]),
        order: [[0, 'asc']]
    });

    // User logs table
    new DataTable('#user-logs', {
        ...commonSettings,
        ajax: {
            url: "/manage/logs/users",
            contentType: "application/json",
            type: "POST",
            data: function(d) {
                d.id = window.location.pathname.split('/').filter(Boolean).pop();
                return JSON.stringify(d);
            }
        },
        columns: safeColumns([
            { data: 'description' },
            { 
                data: 'ip',
                className: 'truncate',
                render: function(data, type, row) {
                    if (type === 'display' || type === 'type') {
                        return esc(data) && data.length > 15 ? esc(data.substring(0, 15)) + '..' : esc(data);
                    }
                    return esc(data);
                }
            },
            { 
                data: 'date',
                render: function(data, type, row) {
                    return type === 'sort' ? esc(row.time) : esc(data);
                }
            }
        ]),
        columnDefs: [
            { targets: 1, className: "truncate" }
        ],
        order: [[2, 'desc']],
        dom: '<"top"pf>rt',
        pageLength: 10,
        lengthMenu: [[5, 10, 25, 50], [5, 10, 25, 50]],
        pagingType: "simple",
        scrollX: false,
        autoWidth: false
    });

    // Simple table
    $('#simple-table').DataTable({
        ...commonSettings,
        columnDefs: [{ orderable: true, targets: [0] }],
        pageLength: 25,
        order: [[0, 'desc']]
    });
});

function esc(value) {
    if (typeof value === 'string') {
        return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    return 'null';
}

function safeColumns(columns) {
    return columns.map(col => {
        if (!col.render) {
            return { ...col, render: DataTable.render.text() };
        }
        return col;
    });
}