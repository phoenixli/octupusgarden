// add bubble to the top of the page
//var bubbleDOM = document.createElement('div');
//bubbleDOM.setAttribute('class', 'selection_bubble');
//document.body.appendChild(bubbleDOM);
var speechBubble = document.createElement('div');
speechBubble.setAttribute('class', 'triangle-isosceles');
document.body.appendChild(speechBubble);
var lastName;
var firstName;
var apiNameString;

var avgGPA = new Array();
var avgStudyHours = new Array();
var avgRcmndInstr = new Array();

// listen to mouseup DOM events
document.addEventListener('mouseup', function (e) {
  var selection = window.getSelection().toString();
  if (selection.length == 0)
    return;

  if (selection.length > 0) {
    var nameArray = selection.split(",");
    lastName = nameArray[0].trim();
    firstName = nameArray[1].trim();

    apiNameString = "https://www.kimonolabs.com/api/5inqlg2o?apikey=2rcGrMLaiLoUiY88CmU3X8KWkVbARce6" + "&Name=" + lastName + "%2C+" + firstName;
  
    
    kimonoCallback(httpGet(apiNameString))
    renderBubble(e.clientX, e.clientY, selection);
  }
}, false);

// close the bubble when we click on the screen
document.addEventListener('mousedown', function (e) {
  //bubbleDOM.style.visibility = 'hidden';
    speechBubble.style.visibility = 'hidden';
}, false);

// javascript way to perform a GET web request
function httpGet(theUrl)
{
    var xmlHttp = null;

    xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false );
    xmlHttp.send( null );
    return xmlHttp.responseText;
}

// move that bubble to the appropriate location
function renderBubble(mouseX, mouseY, selection) {

  speechBubble.innerHTML = selection;
  speechBubble.style.top = mouseY  + 'px';
  speechBubble.style.left = mouseX + 'px';
  speechBubble.style.position = 'fixed';
  speechBubble .style.visibility = 'visible';
}

function kimonoCallback(data) {
  
    //console.log(data.name);
    var json = JSON.parse(data);
    
    var classCountArray = new Array();
    var classNameArray = new Array(20);
    var rcmndInstrArray = new Array();
    var studyHrsArray = new Array();
    var gpaArray = new Array();
    var notAvailableArray = new Array();
    var classCode;
    var lastIndexParens;
    var classNameIndex = 0;

    //console.log(json.name);
    for(var index = 0; index < json.results.collection1.length; index++ ){
      
      if(json.results.collection1[index].Term.charAt(1) == 'U'){ //check if this is a summer quarter, and skip
        continue; 
      }
      classCode = json.results.collection1[index].Course.text.split("-")[0];
      
      //if(isNaNclassCountArray[classCode])
      //console.log(term);

      //Sum up number of times the instructor has taught each class
      if(isNaN(classCountArray[classCode])){

        //start incrementing instances of this class
        classCountArray[classCode] = 1;

        // we make an upper bound number of classes taught one prof to be 20 classes
        if(classNameIndex < 20){
          classNameArray[classNameIndex++] = classCode;
        }
      }
      else{
        classCountArray[classCode]++;
      }
      //console.log(classCode + "  " + classCountArray[classCode]);

      //Sum up instructor recommendation percentage
      if(isNaN(rcmndInstrArray[classCode])){
        rcmndInstrArray[classCode] = parseFloat(json.results.collection1[index].RcmndInstr.split(" ")[0]);
      }
      else{
        rcmndInstrArray[classCode] += parseFloat(json.results.collection1[index].RcmndInstr.split(" ")[0]);
        console.log(classCode + "   " + rcmndInstrArray[classCode]);
      }

      //Sum up study hours per week
      if(isNaN(studyHrsArray[classCode])){
        studyHrsArray[classCode] = parseFloat(json.results.collection1[index]["StudyHrs/wk"]);
      }
      else{
        studyHrsArray[classCode] += parseFloat(json.results.collection1[index]["StudyHrs/wk"]);
        console.log(classCode + "   " + studyHrsArray[classCode]);
      }

      //Sum up avg gpa received
      if(isNaN(gpaArray[classCode])){

        //if there is no grade info about this class, things get really confusing in calculating the average
        if(json.results.collection1[index]["Avg Grade Received"] === "N/A"){

          //we want to count the # of times a class displays N/A so we can subtract it from the total count
          notAvailableArray[classCode] = 1;

          if(!(gpaArray[classCode] > 0)){ 
          //if gpaArray at this class isn't greater than 0, set it to 0 so we don't get in this conditional again
            gpaArray[classCode] = 0;
          }
          console.log("NANfirst" + classCode + "   " + notAvailableArray[classCode]);
        }
        else{

          // grab the grade info if there is average gpa info
          lastIndexParens = json.results.collection1[index]["Avg Grade Received"].lastIndexOf("(");
          gpaArray[classCode] = parseFloat(json.results.collection1[index]["Avg Grade Received"].substr(lastIndexParens+1,4));
          console.log(classCode + "   " + gpaArray[classCode]);
        }
      }
      else{
        
        if(json.results.collection1[index]["Avg Grade Received"] === "N/A"){
          notAvailableArray[classCode]++;
          console.log("NANsubseq" + classCode + "   " + notAvailableArray[classCode]);
        }
        else{
          lastIndexParens = json.results.collection1[index]["Avg Grade Received"].lastIndexOf("(");
          gpaArray[classCode] += parseFloat(json.results.collection1[index]["Avg Grade Received"].substr(lastIndexParens+1,4));
          console.log(classCode + "   " + gpaArray[classCode]);
        }
      }
    }
    
    //Finally compute the averages....holy.....
    for(var j = 0; j < classNameIndex; j++){
      classCode = classNameArray[j];

      if(isNaN(notAvailableArray[classCode])){
        notAvailableArray[classCode] = 0;
      }

      if(classCountArray[classCode] > notAvailableArray[classCode]){
        if(isNaN(notAvailableArray[classCode])){ //if there's no N/A grades for this class
          avgGPA[classCode] = (gpaArray[classCode]) / (classCountArray[classCode]);
        }
        else{ //if there has been N/A grades for this class, need to account for these
          avgGPA[classCode] = (gpaArray[classCode]) / (classCountArray[classCode] - notAvailableArray[classCode]);
        }
      }
      else{ //never been a grade input for this class
        avgGPA[classCode] = "N/A"
      }
      
      avgStudyHours[classCode] = studyHrsArray[classCode]/classCountArray[classCode];
      avgRcmndInstr[classCode] = rcmndInstrArray[classCode]/classCountArray[classCode]; 
      console.log("classCountArray = " + notAvailableArray[classCode] + ", classIndex = " + j + ", classCode = " + classCode + " avgGPA = " + avgGPA[classCode] + ", avgStudyHours = " + 
                  avgStudyHours[classCode] + ", avgRcmndInstr = " + avgRcmndInstr[classCode]);
    }


}


