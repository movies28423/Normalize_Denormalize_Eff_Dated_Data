"use strict";

//Script Globals, data to be denormalized by the script
//TODO - update schemas to real sourceDataTables schemas

var SCHEMA_END_EFF_DATE = "2017-04-01";

var EFF_DATED_FIELDS = [
    "eff_dt",
    "end_eff_dt"
];

var sourceDataTable1Schema = [
    "eff_dt",
    "end_eff_dt",
    "city",
    "state"
];

var sourceDataTable2Schema = [
    "eff_dt",
    "end_eff_dt",
    "rate"
];

var sourceDataTable3Schema = [
    "eff_dt",
    "end_eff_dt",
    "postion"
];

var schemas = {
    sourceDataTable1: sourceDataTable1Schema,
    sourceDataTable2: sourceDataTable2Schema,
    sourceDataTable3: sourceDataTable3Schema
};

var payloadRows = require('/Users/stephanie/Desktop/denormalize_eff_dated_objects.js').getOutputPayload();

function getEmptysourceDataTableObjects() {
	
    var sourceDataTableMaps = {};
    for (var sourceDataTable in schemas) {
        sourceDataTableMaps[sourceDataTable] = [];
    }
	
    return sourceDataTableMaps;
}

var sourceDataTableMaps = getEmptysourceDataTableObjects();

for (var i = 0; i < payloadRows.length; i++) {
	
    var payloadRow = payloadRows[i];
    var effDate = payloadRow.eff_dt;

    for (var sourceDataTable in sourceDataTableMaps) {
	    
        var sourceDataTableDataList = sourceDataTableMaps[sourceDataTable];
        var matches = sourceDataTableDataList.length > 0;
        var currentRowsourceDataTableObject = {};
	    
	//determine if the current record's data for the current source table matches the previous records
	//outside of the eff_dts, if so don't create a new record
        for (var j = 0; j < schemas[sourceDataTable].length; j++) {
		
            var field = schemas[sourceDataTable][j];
            currentRowsourceDataTableObject[field] = payloadRow[field];
		
            if (matches && field != "eff_dt" && field != "end_eff_dt") {
                matches = currentRowsourceDataTableObject[field] == sourceDataTableDataList[sourceDataTableDataList.length - 1][field];
            }
        }

        if (!matches) {
		
            if (sourceDataTableDataList.length > 0) {
		    
		//set the end_eff_dt on the previous record to the day before this record's eff_dt
                var previousObject = sourceDataTableDataList[sourceDataTableDataList.length - 1];
                var effDateAsDate = new Date(effDate);
                var endEffDtAsUTC = effDateAsDate.setDate(effDateAsDate.getDate() - 1);
                var endEffDt = new Date(endEffDtAsUTC);
                var endEffDtString = endEffDt.toISOString().split("T")[0];
                previousObject.end_eff_dt = endEffDtString;
		    
            }
		
            sourceDataTableDataList.push(currentRowsourceDataTableObject);
        }

        if (i == payloadRows.length - 1) {
		
            //update the last record's end_eff_dt to the schema's end of time date
            var objectToUpdateLastRow = matches ? sourceDataTableDataList[sourceDataTableDataList.length - 1] : currentRowsourceDataTableObject;
            objectToUpdateLastRow.end_eff_dt = SCHEMA_END_EFF_DATE;
		
        }
	    
    }
}

console.log(sourceDataTableMaps);
