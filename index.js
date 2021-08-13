$(() => {
    let store = new DevExpress.data.CustomStore({
        load: async options => {
            return await new Promise(resolve => {
                $.ajax({
                    type: 'GET',
                    // url: 'https://serov-github-analytics.herokuapp.com/runs',
                    url: 'http://localhost:3000/runs',
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
                let source = DevExpress.ui.dxDataGrid.getInstance($('#dataGrid')).option('dataSource');
                source.filter = x.value;
                source.load();
                source.reload();
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
    });
});