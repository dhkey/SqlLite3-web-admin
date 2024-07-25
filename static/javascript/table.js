const step = 50;
let dataArray = [];
let current_offset_from = 0;
let current_offset_to = current_offset_from + step;

var table_name = localStorage.getItem("table-name");

var filters = {};

function loadFromServer(filters, current_offset_from, current_offset_to) {
    fetch('/get_data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
	body: JSON.stringify({ table_name: localStorage.getItem("table-name"), filters: filters, offset: current_offset_from, limit: current_offset_to, key: localStorage.getItem("auth") })
    })
    .then(response => response.json())
    .then(data => {
        const columns = data.columns;
        const rows = data.data;
        render(rows);
    })
    .catch(error => console.error('Error:', error));
}

function getByRowId(table, from, to, rowid) {
    fetch('/get_by_rowid', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
	body: JSON.stringify({ table_name: localStorage.getItem("table-name"), offset: from, limit: to, rowid: rowid, key: localStorage.getItem("auth") })
    })
    .then(response => response.json())
    .then(data => {
        const columns = data.columns;
        const rows = data.data; 
    })
    .catch(error => console.error('Error:', error));
}

function render(rows) {
    var table = document.getElementById("data-rows");
    rows.forEach((row, rowIndex) => {
        var newRow = table.insertRow();
        newRow.classList.add('row');
        rowIndex = row[0];
        row.forEach((cell, cellIndex) => {
            var newCell = newRow.insertCell();
            newCell.innerHTML = cell;
            if (cellIndex!=0){            
                newCell.addEventListener("click", function(event) {
                    let input = document.createElement('input');
                    input.type = 'text';
                    input.value = row[cellIndex];
                    newCell.innerHTML = '';
                    newCell.appendChild(input);

                    input.addEventListener('keypress', function(e) {
                        if (e.key === 'Enter') {
                            row[cellIndex] = input.value;
                            newCell.innerHTML = input.value;
                            fetch('/edit', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ table_name: localStorage.getItem("table-name"), row: row, key: localStorage.getItem("auth") })
                            })
                        }
                        else if (e.key === 'Escape') {
                            newCell.innerHTML = row[cellIndex]    
                        }
                    });

                    input.addEventListener('blur', function(e) {
                        newCell.innerHTML = row[cellIndex]
                    });

                    input.focus();
                });
            }
        });
    });
}

function initialize_table() {

    fetch('/get_tables_names', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
	body: JSON.stringify({ key: localStorage.getItem("auth") })
    })
    .then(response => response.json())
    .then(data => {
        const container = document.getElementById('button-container');
        const tables_names = data.table_names;
        tables_names.forEach(tableName => {
            const button = document.createElement('button');
            button.textContent = tableName;
            button.addEventListener('click', () => {
                localStorage.setItem("table-name", tableName)
                loadFromServer(0, step)
                location.reload()
            });
            container.appendChild(button);
        });
        
    })
    .catch(error => console.error('Error:', error));

    fetch('/get_data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ table_name: localStorage.getItem("table-name"), filters: filters, offset: current_offset_from, limit: current_offset_to, key: localStorage.getItem("auth") })
        })
        .then(response => response.json())
        .then(data => {
            const columns = data.columns;
            const rows = data.data;
            var html = '<tr>';
    
            columns.forEach((column, index) => {
                html += '<th class="column_name">' + column + '</th>';
                filters[column] = null;
            });
        html += '</tr><tr>';
    
            columns.forEach((column, index) => {
                html += '<th><input type="text" class="filter-input" data-column-index="' + index + '"></th>';
            });
    
            html += '</tr>';
            document.getElementById('data-rows').innerHTML = html;
    
            document.querySelectorAll('.filter-input').forEach(input => {
                input.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        const inputs = document.querySelectorAll('.filter-input');
                        inputs.forEach((input, index) => {
                            const columnIndex = input.getAttribute('data-column-index');
                            const inputValue = input.value;
                            filters[columns[columnIndex]] = inputValue;
                        });
                        var table = document.getElementById("data-rows");
                        var rowsToRemove = table.querySelectorAll("tr:nth-child(n+3)");
                        rowsToRemove.forEach(row => row.parentNode.removeChild(row));
                        var elements = document.querySelectorAll('.row');
                        var current_offset_from = elements.length;
                        loadFromServer(filters, current_offset_from, step)
                    }
                });
            });
        render(rows);
        })
        .catch(error => console.error('Error:', error));
    }
    
let isReachedEnd = false;
window.addEventListener('scroll', () => {
    if (window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight && !isReachedEnd) {
        var elements = document.querySelectorAll('.row');
        var current_offset_from = elements.length;
        loadFromServer(filters, current_offset_from, step);
        isReachedEnd = true;
    } else if (window.innerHeight + window.pageYOffset <= document.documentElement.scrollHeight && isReachedEnd) {
        isReachedEnd = false;
    }
});
    
window.onload = function() {
    initialize_table();
}