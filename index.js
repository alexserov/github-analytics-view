/* eslint-disable max-len */
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
const fakeDuration = 2 * 60 * 60 * 1000 + 123;
function avg(array) {
    const sum = array.reduce((a, b) => a + b, 0);
    return (sum / array.length) || 0;
}
$(() => {
    let today = new Date();
    today = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const store = createStore('runs');
    $('#rangeSelectorDates').dxRangeSelector({
        dataSource: new DevExpress.data.DataSource({
            paginate: false,
            store: createStore('dates'),
        }),
        title: 'Total action runs',
        behavior: {
            manualRangeSelectionEnabled: true,
        },
        loadingIndicator: {
            enabled: true,
            font: {
                weight: 900,
            },
        },
        chart: {
            valueAxis: {
                valueType: 'numeric',
            },
            toolTip: {
                enabled: true,
            },
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
        value: [today, new Date()],
        onValueChanged: (x) => {
            const dataSource = $('#rangeSelector').dxRangeSelector('getDataSource');
            dataSource.filter(x.value);
            dataSource.load();
        },
    });
    $('#rangeSelector').dxRangeSelector({
        dataSource: new DevExpress.data.DataSource({
            paginate: false,
            store,
            filter: 'skip',
            map: (x) => {
                x.date = new Date(x.date);
                x.pending /= (60 * 1000);
                x.duration /= (60 * 1000);
                return x;
            },
        }),
        title: 'Pending time/Run time',
        behavior: {
            manualRangeSelectionEnabled: true,
        },
        loadingIndicator: {
            enabled: true,
            font: {
                weight: 900,
            },
        },
        chart: {
            toolTip: {
                enabled: true,
            },
            commonSeriesSettings: {
                type: 'splinearea',
                argumentField: 'date',
                aggregation: {
                    enabled: true,
                    method: 'custom',
                    calculate(aggregationInfo) {
                        if (!aggregationInfo.data.length) {
                            return {};
                        }
                        const duration = avg(aggregationInfo.data.map((item) => item.duration).filter((x) => x < fakeDuration));
                        const pending = avg(aggregationInfo.data.map((item) => item.pending).filter((x) => x < fakeDuration));
                        return { date: new Date((aggregationInfo.intervalStart.valueOf() + aggregationInfo.intervalEnd.valueOf()) / 2), duration, pending };
                    },
                },
            },
            series: [
                {
                    valueField: 'pending',
                    color: 'red',
                },
                {
                    valueField: 'duration',
                    color: 'green',
                },
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
            const durationPendingChart = $('#durationPendingChart').dxChart('instance');
            durationPendingChart.getArgumentAxis().visualRange({ startValue: x.value[0], endValue: x.value[1] });
            const concurrentJobsChart = $('#concurrentJobsChart').dxChart('instance');
            concurrentJobsChart.getArgumentAxis().visualRange({ startValue: x.value[0], endValue: x.value[1] });
        },
    });
    $('#durationPendingChart').dxChart({
        dataSource: $('#rangeSelector').dxRangeSelector('getDataSource'),
        loadingIndicator: {
            enabled: true,
            font: {
                weight: 900,
            },
        },
        valueAxis: {
            valueType: 'numeric',
        },
        toolTip: {
            enabled: true,
        },
        commonSeriesSettings: {
            type: 'steparea',
            argumentField: 'date',
        },
        argumentAxis: {
            argumentType: 'datetime',
        },
        series: [
            {
                valueField: 'pending',
                color: 'red',
            },
            {
                valueField: 'duration',
                color: 'green',
            },
        ],
    });
    $('#concurrentJobsChart').dxChart({
        dataSource: new DevExpress.data.DataSource({
            paginate: false,
            store: createStore('concurrentJobs'),
        }),
        loadingIndicator: {
            enabled: true,
            font: {
                weight: 900,
            },
        },
        valueAxis: {
            valueType: 'numeric',
        },
        toolTip: {
            enabled: true,
        },
        commonSeriesSettings: {
            type: 'steparea',
            argumentField: 'date',
        },
        argumentAxis: {
            argumentType: 'datetime',
        },
        series: [
            {
                valueField: 'length',
                color: 'red',
            },
        ],
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
            {
                dataField: 'date',
                customizeText: (cell) => cell.value && new Date(cell.value).toLocaleString(),
            },
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
