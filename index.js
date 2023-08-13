import './jquery-3.6.0.min.js';
import './luxon/luxon.js';
import { DateTime } from './luxon/luxon.js';

const timezone = "Asia/Jerusalem";
const today = DateTime.now().setZone(timezone);

let hour = today.hour;
let day = today.day;
let month = today.month;
let year = today.year;

let day_tomorrow = today.plus({ days: 1 }).day;
let day_yesterday = today.minus({ days: 1 }).day;

let month_tomorrow = today.plus({ days: 1 }).month;
let month_yesterday = today.minus({ days: 1 }).month;

let year_tomorrow = today.plus({ days: 1 }).year;
let year_yesterday = today.minus({ days: 1 }).year;

function httpGet(theUrl)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
    xmlHttp.send( null );
    return xmlHttp.responseText;
}

//a sheet that contains a link to the monthly toranim shift and a DB sheet that contains the details about the toranim.
//the backend depends on the data those sheets contain

let links_sheet_html = httpGet("google_sheets_link");
links_sheet_html = links_sheet_html.split('^^^');

//js for some reason create the i as a number which is a string instead of an integer
//and still you can access the content, you actually can access it as a string and as an integer

for (let i in links_sheet_html){
    if (links_sheet_html[i].includes('TORANIM DB')){
        var toranim_db_link = links_sheet_html[parseInt(i)+1]; //The i difference       
        break;
    }
}
for (let i in links_sheet_html){
    if (links_sheet_html[i].includes('TORANIM TABLE')){
        var toranim_table_link = links_sheet_html[parseInt(i)+1]; //The i difference
        break;
    }
}

//document.getElementById("depend_on_id").href = toranim_table_link;

var toranim_db_html = httpGet(toranim_db_link)
toranim_db_html = toranim_db_html.split('^^^')

var toranim_table_html = httpGet(toranim_table_link);
toranim_table_html = toranim_table_html.replaceAll('<', '>');
toranim_table_html = toranim_table_html.split('>');

function ToraNOC_backend(which_team){
    //getting the toranim in a specified team
    let list_toranim_details = [];

    for (let i in toranim_db_html){
        if (toranim_db_html[i].includes(` ${which_team} `)){ //need to change to the choosen team function
            if (toranim_db_html[i].includes('null;') == false){  //the null; meant to remove a piece of code from the taken HTML we need to remove. (it contains the word null;)
                list_toranim_details.push(toranim_db_html[i].split(' '));

            }
        }
    }

    let date_now;
    let date_tomorrow;

    if (hour < 8){

        date_now = [day_yesterday, month_yesterday, year_yesterday] //changed to yesterday
        date_tomorrow = [day, month, year]//changed to today
        
    }

    if (hour >= 8){

        date_now = [day, month, year]
        date_tomorrow = [day_tomorrow ,month_tomorrow ,year_tomorrow]

    }


    //permutator function allowing to get all the possibilities of list sequences.

    const permutator = (inputArr) => {
        let result = [];

        const permute = (arr, m = []) => {
        if (arr.length === 0) {
            result.push(m)
        } else {
            for (let i = 0; i < arr.length; i++) {
            let curr = arr.slice();
            let next = curr.splice(i, 1);
            permute(curr.slice(), m.concat(next))
        }
        }
    }
    
    permute(inputArr)
    
    return result;
    }
    

    //Now we need to take all the dates and change them to String to be able
    //to check if it equals the dates on the toranim sheet HTML code.

    let date_now_list_before_string = [];
    let date_tomorrow_list_before_string = [];
    
    permutator(date_now).forEach(index => date_now_list_before_string.push(index)); 
    permutator(date_tomorrow).forEach(index => date_tomorrow_list_before_string.push(index));

    function fix_add_zero(needed_list) { //The dates with the datetime function built on js return dates without zeros, we need to fix it.
        
        for (let i in needed_list){
            needed_list[i] = needed_list[i].toString().split(',');
        }
        for (let i in needed_list){
            for (let j in needed_list[i]){
                if (needed_list[i][j].length == 1){
                    needed_list[i][j] = needed_list[i][j].replace(needed_list[i][j], '0'+needed_list[i][j]); 
                }
            } 
        }
        var list_with_fixed_zeros = needed_list;
        return list_with_fixed_zeros;
    }

    let date_now_list = [];
    let date_tomorrow_list = [];

    //The dates on the toranim sheet HTML looks like this xx-xx-xxxx.
    //we need to change the columns to lines to check equality | ',' -> '-'
    fix_add_zero(date_now_list_before_string).forEach(index => date_now_list.push(index.toString().replaceAll(',', '-')));
    fix_add_zero(date_tomorrow_list_before_string).forEach(index => date_tomorrow_list.push(index.toString().replaceAll(',', '-')));

    let first_position_found = false;
    let second_position_found = false;

    //The code work in the way it's searching the toranim between today's date and tomorrow's date
    //the next piece of code gives me the position of the dates to check between them.
    if (first_position_found == false || second_position_found == false){

        for (let i in toranim_table_html){
        
            if (first_position_found == false){
                
                for (let j in date_now_list){
                    
                    if (toranim_table_html[i].includes(date_now_list[j])){
                        var first_turn = i;
                        first_position_found = true;
                        break;
                    }
                }
            }
            
            if (second_position_found == false){
            
                for (let k in date_now_list){
                    
                    if (month_tomorrow != month && hour > 8 || month_yesterday != month && hour < 8){ //<- toranoc searching between dates, if he don't have tomorrow date
                        var second_turn = toranim_table_html.length - 1; //because last day in month date don't appear
                        second_position_found = true;                    //in table, it will take the last splitted html 
                        break;                                           //list index. cover case of 1 day and last day.
                    } else if (toranim_table_html[i].includes(date_tomorrow_list[k])) {    
                        var second_turn = i;
                        second_position_found = true;
                        break;
                    }
                }
            }
        }
    }

    let currect_toranim_list = [];
    //in the next two following for loops it takes all the HTML between the needed dates
    //and add it to a list which js will search in the current toran using by trying to
    //see if the name is the same as the name in our toranim DB sheet.
    for (let index = first_turn-1; index < second_turn; index++) {
        currect_toranim_list.push(toranim_table_html[index+1].split(" "));
    }
    
    let searching_at_least_two_details = 0;
    for (let i in currect_toranim_list){
        if (searching_at_least_two_details == 2){
            break;
        }
        for (let j in list_toranim_details){
            if (searching_at_least_two_details == 2){
                break;
            }
            searching_at_least_two_details = 0;
            for (let k in list_toranim_details[j]){
                if(currect_toranim_list[i].includes(list_toranim_details[j][k])){ //בן שוור מביא לי שי בן שימול למרות שהתורן הוא שגיא קרנר נגרם בגלל שהטיימר לא מתאפס לאחר מציאת מילה!!!
                    searching_at_least_two_details = searching_at_least_two_details + 1
                    if (searching_at_least_two_details == 2){ //helps to prevent cases when two toranim from different teams have the same name 
                        var toran = list_toranim_details[j];
                        break;
                        
                    }
                }
            }
        }
    }

    return toran; //return list which includes the following by order: last name, name, team, phone. 
}

//the following function handle the data from buttons clicks and writes to the HTML what will be appear
//on the popup.
function get_toran_details(button_team, team){
    document.getElementById(button_team).addEventListener("click", function(){
        const toran_details = ToraNOC_backend(team);
        if (ToraNOC_backend(team) == null){ //for cases the toran which appear in the tavla dosen't in the DB in the correct format (or not appear at all)
            document.getElementById("toran_info_id").innerHTML = `Error: need to add this toran to DB / invalid google sheet`;    
            document.getElementById("toran_phone_id").innerHTML = `see documantion for more details`
            document.getElementById("toran_phone_id").href = 'no docs yet';
        }
        if (toran_details.length < 5){
            document.getElementById("toran_info_id").innerHTML = `${toran_details[2]} התורן: ${toran_details[1]} ${toran_details[0]}  מצוות`;
            document.getElementById("toran_phone_id").innerHTML = toran_details[3];
            document.getElementById("toran_phone_id").href = 'tel:'+toran_details[3];
        }

        if (toran_details.length >= 5){ //checking for a case when a full name contains more than 2 words, 3 words are the max limit in the presentation
            document.getElementById("toran_info_id").innerHTML = `${toran_details[3]} התורן: ${toran_details[2]} ${toran_details[0]} ${toran_details[1]}  מצוות`;
            document.getElementById("toran_phone_id").innerHTML = toran_details[4];
            document.getElementById("toran_phone_id").href = 'tel:'+toran_details[4];
        }
    });
    
}

get_toran_details('button_team1', 'team1');
get_toran_details('button_team2', 'team2');
get_toran_details('button_team3', 'team3');
get_toran_details('button_team4', 'team4');
get_toran_details('button_team5', 'team5');
get_toran_details('button_team6', 'team6');
get_toran_details('button_team7', 'team7');
get_toran_details('button_team8', 'team8');
get_toran_details('button_team9', 'team9');
get_toran_details('button_team10', 'team10');
get_toran_details('button_team11', 'steam11');
get_toran_details('button_team12', 'team12');

//the following function open the popup, 
function popup_opener(button_team){
    $(button_team).on('click', function() {
        $(".custom-model-main").addClass('model-open');
      }); 
      $(".close-btn, .bg-overlay").click(function(){
        $(".custom-model-main").removeClass('model-open');
      });
}

popup_opener('button_team1');
popup_opener('button_team2');
popup_opener('button_team3');
popup_opener('button_team4');
popup_opener('button_team5');
popup_opener('button_team6');
popup_opener('button_team7');
popup_opener('button_team8');
popup_opener('button_team9');
popup_opener('button_team10');
popup_opener('button_team11');
popup_opener('button_team12');
