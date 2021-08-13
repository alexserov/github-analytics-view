function createStore(endpoint) {
    return new DevExpress.data.CustomStore({
        load: (options) => {
            let url = `https://serov-github-analytics.herokuapp.com/${endpoint}`;
            // eslint-disable-next-line no-restricted-globals
            if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') { url = `http://localhost:3000/${endpoint}`; }

            return new Promise((resolve) => {
                $.ajax({
                    type: 'GET',
                    url,
                    data: options,
                    success: (response) => resolve(response),
                });
            });
        },
    });
}
$(() => {
    const store = createStore('runs');
    $('#rangeSelector').dxRangeSelector({
        dataSource: new DevExpress.data.DataSource({
            paginate: false,
            store,
            filter: 'skip',
        }),
        size: {
            height: 300,
        },
        title: 'Pending time/Run time',
        chart: {
            commonSeriesSettings: {
                type: 'steparea',
                argumentField: 'date',
            },
            series: [
                { valueField: 'pending', color: 'red' },
                { valueField: 'duration', color: 'green' },
            ],
        },
        scale: {
            minorTickInterval: 'minute',
            tickInterval: 'hour',
            valueType: 'datetime',
        },
        sliderMarker: {
            format: 'shortDateShortTime',
        },
        onValueChanged: (x) => {
            const dataSource = $('#dataGrid').dxDataGrid('getDataSource');
            dataSource.filter(x.value);
            dataSource.load();
        },
    });
    $('#rangeSelectorDates').dxRangeSelector({
        dataSource: new DevExpress.data.DataSource({
            paginate: false,
            store: createStore('dates'),
        }),
        title: 'Total action runs',
        chart: {
            commonSeriesSettings: {
                type: 'steparea',
                argumentField: 'date',
            },
            series: [
                { valueField: 'count', color: 'red' },
            ],
        },
        scale: {
            tickInterval: 'hour',
            valueType: 'datetime',
        },
        sliderMarker: {
            format: 'shortDateShortTime',
        },
        onValueChanged: (x) => {
            const dataSource = $('#rangeSelector').dxRangeSelector('getDataSource');
            dataSource.filter(x.value);
            dataSource.load();
        },
    });
    const formatMiliseconds = (cell) => {
        if (cell.value) {
            const valueNum = Math.ceil((+cell.value) / 1000);
            const minutes = Math.floor(valueNum / 60);
            const seconds = valueNum - minutes * 60;
            return `${minutes}m ${seconds.toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false })}s`;
        }
        return undefined;
    };
    $('#dataGrid').dxDataGrid({
        dataSource: new DevExpress.data.DataSource({
            store,
            filter: 'skip',
        }),
        groupPanel: {
            visible: true,
        },
        remoteOperations: {
            filtering: true,
            sorting: false,
            grouping: false,
        },
        columns: [
            { dataField: 'repository' },
            { dataField: 'name' },
            { dataField: 'date' },
            {
                caption: 'URL',
                cellTemplate: (container, options) => {
                    $('<a>')
                        .text('Link')
                        .attr({
                            href: options.data.url,
                            target: '_blank',
                        })
                        .appendTo(container);
                },
            },
            { dataField: 'status' },
            { dataField: 'conclusion' },
            {
                dataField: 'duration',
                customizeText: formatMiliseconds,
            },
            {
                dataField: 'pending',
                customizeText: formatMiliseconds,
            },
        ],
    });
});
