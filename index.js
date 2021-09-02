/* eslint-disable no-param-reassign */
/* eslint-disable max-len */
function loadData(endpoint, options) {
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
}
function createStore(endpoint) {
    return new DevExpress.data.CustomStore({
        load: (options) => loadData(endpoint, options),
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
        onValueChanged: async (range) => {
            const dataSource = $('#dataGrid').dxDataGrid('getDataSource');
            dataSource.filter(range.value);
            dataSource.load();

            const durationPendingChart = $('#durationPendingChart').dxChart('instance');
            durationPendingChart.getArgumentAxis().visualRange({ startValue: range.value[0], endValue: range.value[1] });
            const concurrentJobsChart = $('#concurrentJobsChart').dxChart('instance');
            concurrentJobsChart.getArgumentAxis().visualRange({ startValue: range.value[0], endValue: range.value[1] });

            $('#total-minutes').text('loading...');
            $('#total-pending-minutes').text('loading...');
            $('#max-concurrent-jobs').text('loading...');
            $('#average-concurrent-jobs').text('loading...');
            $('#median-concurrent-jobs').text('loading...');

            const jobs = await loadData('jobs', { filter: range.value });
            const totalMinutes = jobs.length && jobs.map((x) => x.duration).reduce((a, b) => a + b, 0) / (60 * 1000);
            const totalPendingMinutes = jobs.length && jobs.map((x) => x.pending).reduce((a, b) => a + b, 0) / (60 * 1000);
            $('#total-minutes').text(totalMinutes);
            $('#total-pending-minutes').text(totalPendingMinutes);

            const concurrentJobs = await loadData('concurrentJobs', { filter: range.value });
            const maxConcurrentJobs = concurrentJobs.length && Math.max(...concurrentJobs.map((x) => x.length));
            const averageConcurrentJobs = concurrentJobs.length && concurrentJobs.map((x) => x.length).reduce((a, b) => a + b, 0) / concurrentJobs.length;
            const medianConcurrentJobs = concurrentJobs.length && concurrentJobs.sort((a, b) => a.length - b.length)[Math.min(concurrentJobs.length, Math.round(concurrentJobs.length / 2))].length;

            $('#max-concurrent-jobs').text(maxConcurrentJobs);
            $('#average-concurrent-jobs').text(averageConcurrentJobs);
            $('#median-concurrent-jobs').text(medianConcurrentJobs);
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
        onPointHoverChanged(e) {
            const point = e.target;
            if (!point.isHovered()) {
                point.hideTooltip();
            } else {
                point.showToolTip();
            }
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
