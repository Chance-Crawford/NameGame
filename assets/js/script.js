
var inputBar = document.querySelector("#enter-name");
var searchForm = document.querySelector("#search-form");

var errorField = document.querySelector("#error-field");

var ageInfo = document.querySelector("#age-info");
var genderInfo = document.querySelector("#gender-info");
var nationInfo = document.querySelector("#nation-info");

var noDataCounter = 0;

var prevName = "";


function saveName(name){
    localStorage.setItem("name", name);
}


function loadName(){
    prevName = localStorage.getItem("name");

    if(prevName){
        inputBar.value = prevName;
        getAgePrediction(prevName);
    }
}



function getName(event){
    event.preventDefault();

    var name = inputBar.value.trim();

    errorField.textContent = "";
    
    errorField.classList.remove("has-text-danger");
    errorField.classList.remove("purple");

    if(name){
        errorField.className += " purple"
        errorField.textContent = "One moment please...";
        saveName(name);
        getAgePrediction(name);
    }
    else{
        errorField.className += " has-text-danger"
        errorField.textContent = "Please enter a name!"
        return;
    }
    
}

function getAgePrediction(name){
    fetch("https://api.agify.io?name=" + name.toLowerCase().trim()).then( (response) => {
        
        if(response.ok){
            response.json().then( (data) => {
                console.log(data);
                if(data.age){
                    getPredictedGender(name.toLowerCase().trim());
                    displayAge(data);
                }
                else{
                    ageInfo.textContent = "Not enough data to determine age.";
                    getPredictedGender(name.toLowerCase().trim());
                    noDataCounter++;
                }
                
            });
        }
        else{
            errorField.textContent = "error for getting age";
        }
        
    });


}

// display info to page

function displayAge(ageObj){
    ageInfo.innerHTML = "You have a predicted age of " + ageObj.age + ".<br>Based on " + ageObj.count + " people.";
}

function displayGender(genderObj){
    var percent = genderObj.probability.toString().split(".")[1];

    if(percent.length == 1){
        percent += "0%";
    }
    else{
        percent += "%";
    }

    genderInfo.innerHTML = "There is a " + percent + " chance you are " + genderObj.gender + ".<br>Based on " + genderObj.count + " people.";
}

function getPredictedGender(name){
    fetch("https://api.genderize.io?name=" + name).then( (response) => {
        
        if(response.ok){
            response.json().then( (data) => {
                console.log(data);
                if(data.gender){
                    getPredictedNationality(name);
                    displayGender(data);
                }
                else{
                    genderInfo.textContent = "Not enough data to determine gender.";
                    getPredictedNationality(name);
                    noDataCounter++;
                }
                
                
            });
        }
        else{
            errorField.textContent = "error for getting gender";
        }
        
    });
}

function getPredictedNationality(name){
    fetch("https://api.nationalize.io?name=" + name).then( (response) => {
        
        if(response.ok){
            response.json().then( (data) => {
                console.log(data);

                if(data.country.length > 0){
                    parseCountries(data);
                    dog();
                }
                else{
                    nationInfo.textContent = "Not enough data to determine countries.";
                    noDataCounter++;
                    
                    // if at least one box has data
                    if(noDataCounter < 3){
                        dog();
                        noDataCounter = 0;
                    }
                    // if all 3 boxes have no data
                    if(noDataCounter >= 3){
                        errorField.textContent = "Sorry, not enough data.";
                        document.querySelector("#wow").textContent = "";
                        noDataCounter = 0;
                    }
                }

            });
        }
        else{
            errorField.textContent = "error for getting nationality countries";
        }
        
    });
}


// an async method allows you to wait for a specific async
// http request or function within the block to return before the
// code moves on to the next line.
async function parseCountries(dataObj){

    // arrays to hold the full named countries and
    // the array of probability.
    var countryList = [];
    var probableList = [];
    
    // loop through each country 2 digit abbreviation
    // and parse it to its full name.
    for(var i = 0; i < dataObj.country.length; i++){

        // gets the probability of the person being from each country
        // rounds it to nearest tenth then moves the period
        // to convert it to a percentage instead of decimal.

        // this probability code runs somewhat async to the code
        // within the fetch request below. This is alright
        // because the countries and probability still stay in order.
        var prob = dataObj.country[i].probability.toFixed(3).split(".")[1];
        prob = prob.slice(0, 2) + "." + prob.slice(2);

        // if first number in string is 0, remove first number
        if(prob[0] === "0"){
            prob = prob.slice(1);
        }

        // this would mean that the nationalize api returned "1"
        // which is supposed to be equal to 100. this catches that error after 
        // we parsed the string
        if(prob === "0.0"){
            prob = "100";
        }
        console.log(prob);

        // push current country's probability to array
        probableList.push(prob);

        // we are forcing the for loop to pause and await
        // the http request to return. If we didnt do this,
        // some of the countries could display out of order.
        // because the for loop would continue on to the
        // next index in the array
        await fetch("https://api.worldbank.org/v2/country/" + dataObj.country[i].country_id + "?format=json").then( (response) => {
            
        // everything in here runs first
        // before it moves on to the next for loop fetch
        // request
            if(response.ok){
                response.json().then( (data) => {
                    console.log(data);                  
                    console.log(data[1][0].name);

                    countryList.push(data[1][0].name);

                    console.log(countryList.length);
                    console.log(countryList);

                    // inside request we are checking to see if
                    // this country request is the last one.
                    // if so, that means we got all the info we need.
                    // we then push both of the arrays to the function
                    // that displays the values to the page.
                    if(countryList.length === dataObj.country.length){
                        displayCountries(countryList, probableList);
                    }
                });
            }
            else{
                errorField.textContent = "error for parsing country to full name";
            }
        
        });
    }

    // DO NOT put anything outside of for loop because it will
    // mess up the flow. Any functions outside
    // should be ones you are alright with running
    // asynchronously, they will run the other functions
    // outside before the for loop is done
}




// Display countries in order to screen
// gives arrays of country names and their probability of being 
// from that country. lists correspond to eachother.
// so countryList[0] has the probability of probableList[0]
function displayCountries(countryList, probableList){

    nationInfo.textContent = "";

    for(var i = 0; i < countryList.length; i++){

        if(i == 0){
            nationInfo.innerHTML += (i + 1) + ". " + countryList[i] + ". " + probableList[i] + "% chance";
        }
        else{
            nationInfo.innerHTML += "<br>" + (i + 1) + ". " + countryList[i] + ". " + probableList[i] + "% chance";
        }
        
    }
}


function dog(){
    fetch("https://dog.ceo/api/breeds/image/random").then( (response) => {
        if(response.ok){
            response.json().then( (data) => {
                console.log(data);
                dogImage(data);
            });
        }
        else{
            errorField.textContent = "error for getting dog image";
        }
        
    });
}


function dogImage(pic){
    var divEl = document.querySelector("#wow");

    divEl.textContent = "";

    errorField.textContent = "";

    var image = document.createElement("img");
    image.setAttribute("src", pic.message);
    image.style = "width: 75%; border-radius: 20px;";

    divEl.appendChild(image);
}



// events
loadName();
searchForm.addEventListener("submit", getName);