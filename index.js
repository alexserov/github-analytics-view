function createStore(endpoint) {
    return new DevExpress.data.CustomStore({
        load: async options => {
            let url = `https://serov-github-analytics.herokuapp.com/${endpoint}`;
            if (location.hostname === "localhost" || location.hostname === "127.0.0.1")
                url = `http://localhost:3000/${endpoint}`;

            return await new Promise(resolve => {
                $.ajax({
                    type: 'GET',
                    url: url,
                    data: options,
                    success: response => resolve(response)
                });
            });
        }
    });
}
$(() => {
    let store = createStore('runs');
    $("#rangeSelector").dxRangeSelector({
        dataSource: new DevExpress.data.DataSource({
            paginate: false,
            store: store,
            filter: 'skip'
        }),
        size: {
            height: 300
        },
        title: 'Pending time/Run time',
        chart: {
            commonSeriesSettings: {
                type: "steparea",
                argumentField: "date"
            },
            series: [
                { valueField: "pending", color: "red" },
                { valueField: "duration", color: "green" }
            ]
        },
        scale: {
            minorTickInterval: "minute",
            tickInterval: "hour",
            valueType: "datetime"
        },
        sliderMarker: {
            format: "shortDateShortTime"
        },
        onValueChanged: x => {
            var dataSource = $("#dataGrid").dxDataGrid("getDataSource");
            dataSource.filter(x.value);
            dataSource.load();
        }
    });
    $("#rangeSelectorDates").dxRangeSelector({
        dataSource: new DevExpress.data.DataSource({
            paginate: false,
            store: createStore('dates')
        }),
        title: 'Total action runs',
        chart: {
            commonSeriesSettings: {
                type: "steparea",
                argumentField: "date"
            },
            series: [
                { valueField: "count", color: "red" },
            ]
        },
        scale: {
            tickInterval: "hour",
            valueType: "datetime"
        },
        sliderMarker: {
            format: "shortDateShortTime"
        },
        onValueChanged: x => {
            var dataSource = $("#rangeSelector").dxRangeSelector("getDataSource");
            dataSource.filter(x.value);
            dataSource.load();
        }
    });
    $('#dataGrid').dxDataGrid({
        dataSource: new DevExpress.data.DataSource({
            store: store,
            filter: 'skip'
        }),
        remoteOperations: {
            filtering: true,
            sorting: false,
            grouping: false
        },
        columns: [
            { dataField: 'repository' },
            { dataField: 'name' },
            { dataField: 'date' },
            { dataField: 'status' },
            { dataField: 'duration' },
            { dataField: 'pending' },
        ]
    });
});