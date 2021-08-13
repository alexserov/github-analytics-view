$(() => {
    let store = new DevExpress.data.CustomStore({
        load: async options => {
            let url = 'https://serov-github-analytics.herokuapp.com/runs';
            if (location.hostname === "localhost" || location.hostname === "127.0.0.1")
                url = 'http://localhost:3000/runs';

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
    $(function () {
        $("#rangeSelector").dxRangeSelector({
            dataSource: new DevExpress.data.DataSource({
                paginate: false,
                store: store
            }),
            margin: {
                top: 50
            },
            size: {
                height: 300
            },
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
    });
    $('#dataGrid').dxDataGrid({
        dataSource: new DevExpress.data.DataSource({
            store: store,
            filter: 'skip'
        }),
        remoteOperations: {
            filtering: true,
            sorting: true,
            grouping: true
        },
        columns: [
            { dataField: 'name' },
            { dataField: 'date' },
            { dataField: 'duration' },
            { dataField: 'pending' },
        ]
    });
});