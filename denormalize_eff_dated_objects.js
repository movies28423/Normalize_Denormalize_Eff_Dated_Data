"use strict";

//Script Globals, data to be denormalized by the script
//TODO - update hard coded data to real sourceDataTables and real
//data

var EFF_DATED_FIELDS = [
  "eff_dt",
  "end_eff_dt"
];

var sourceDataTable1Payload = [
  {
    eff_dt     : "2017-01-01",
    end_eff_dt : "2017-03-01",
    city       : "Ann Arbor",
    state      : "MI"
  },
  {
    eff_dt     : "2017-03-02",
    end_eff_dt : "2017-04-01",
    city       : "Livonia",
    state      : "MI"
  }  
];

var sourceDataTable2Payload = [
  {
    eff_dt     : "2017-01-01",
    end_eff_dt : "2017-01-31",
    rate       : "70.0"
  },
  {
    eff_dt     : "2017-02-01",
    end_eff_dt : "2017-04-01",
    rate       : "75.0"
  }  
];

var sourceDataTable3Payload = [
  {
    eff_dt     : "2017-01-01",
    end_eff_dt : "2017-02-17",
    postion    : "00001234"
  },
  {
    eff_dt     : "2017-02-18",
    end_eff_dt : "2017-04-01",
    postion    : "00001111"
  }  
];

var payloads = {
  sourceDataTable1 : sourceDataTable1Payload,
  sourceDataTable2 : sourceDataTable2Payload,
  sourceDataTable3 : sourceDataTable3Payload
};

module.exports = {
  'getOutputPayload': getOutputPayload
};


/*
HashMap like data structure, used to perform lookups with a given sourceDataTable and asOfDate
JS Object with
sourceDataTable key -> JS Object with
                eff_dt + "|" + end_eff_dt key,
                object attributes without eff dates value
*/
var _effDatedMap = function(){
  this.keyToEffDateValueMap = {};
}

var _effDatedMapPut = function(key, effDate, endEffDate, value){
  if(this.keyToEffDateValueMap[key] == undefined){
    this.keyToEffDateValueMap[key] = {};
  }
  this.keyToEffDateValueMap[key][effDate + "|" + endEffDate] = value;
}

var _effDatedMapGet = function(key, asOfDateString){
  var asOfDate = new Date(asOfDateString);

  if(this.keyToEffDateValueMap[key] == undefined){
    return null;
  }

  var effDatedObjects = this.keyToEffDateValueMap[key];

  for(var effDatedObject in effDatedObjects){
    var effDates = effDatedObject.split("|");
    var effDate = new Date(effDates[0]);
    var endEffDate = new Date(effDates[1]);
    if(asOfDate >= effDate && asOfDate <= endEffDate){
      return effDatedObjects[effDatedObject];
    }
  }

  return null;
}

_effDatedMap.prototype.put = _effDatedMapPut;
_effDatedMap.prototype.get = _effDatedMapGet;


function _compareDates(a, b) {
  if (new Date(a) < new Date(b)) {
    return -1;
  }
  return 1;
}

function buildEffDatedMapAndEffDatesList(){
  var sourceDataTablesEffDatedMap = new _effDatedMap();
  var payLoadEffDates = [];

  for(var sourceDataTable in payloads){
    var payload = payloads[sourceDataTable];
    for(var j = 0; j < payload.length; j++){
      var effDate = payload[j].eff_dt;
      var endEffDate = payload[j].end_eff_dt;

      sourceDataTablesEffDatedMap.put(sourceDataTable, effDate, endEffDate, payload[j]);

      if(payLoadEffDates.indexOf(effDate) == -1){
        payLoadEffDates.push(effDate);
      }
    }
  }

  //sort eff dated array in ascending order
  payLoadEffDates.sort(
    _compareDates
  );

  return {
    'sourceDataTablesEffDatedMap' : sourceDataTablesEffDatedMap,
    'payLoadEffDates' : payLoadEffDates
  };
}

function getDenormalizedPayload(sourceDataTablesEffDatedMap, payLoadEffDates){
  //holds the denormalized rows
  var outputPayload = [];

  for(var i = 0; i < payLoadEffDates.length; i++){
    var effDate = payLoadEffDates[i];
    var effDatedObject = {
      eff_dt : effDate
    };

    for(var sourceDataTable in payloads){
      var effDatedsourceDataTableObject = sourceDataTablesEffDatedMap.get(sourceDataTable, effDate);
      //copy over the value for each attribute for the sourceDataTable
      for(var attribute in effDatedsourceDataTableObject){
        //ignore the eff dated fields as we don't want to add them to the output rows
        if(EFF_DATED_FIELDS.indexOf(attribute) != -1){
          continue;
        }
        effDatedObject[attribute] = effDatedsourceDataTableObject[attribute];
      }
    }

    outputPayload.push(effDatedObject);
  }

  return outputPayload;  
}

function getOutputPayload(){
  var effDatedMapAndEffDatesListObject = buildEffDatedMapAndEffDatesList();
  var sourceDataTablesEffDatedMap = effDatedMapAndEffDatesListObject.sourceDataTablesEffDatedMap;
  var payLoadEffDates = effDatedMapAndEffDatesListObject.payLoadEffDates;
  var outputPayload = getDenormalizedPayload(sourceDataTablesEffDatedMap, payLoadEffDates);
  return outputPayload;
}


function main(){
  var outputPayload = getOutputPayload();
  console.log(outputPayload);
}

main();