$(document).ready(function(){

 var input = $('input');
 var button = $('button');

function getWeather (city){
 $.ajax({
 url: "http://api.openweathermap.org/data/2.5/weather?q=" + city + "&units=imperial&APPID=20b72c73ca8c0642abe5827e9deec32b",
 success: function(data){
 console.log(data)
 handleResponse(data, city)
 }
})
};

button.click(function(event){
 event.preventDefault()
 var city = input.val();
 getWeather(city);
})

function appendWeather (forecast, date){
var forecastPara= $('#forecast');
var datePara = $('.date');
forecastPara.html(forecast)
datePara.html(date)
}

function handleResponse (data, city){
var date = moment(data.dt*1000).format("MMMM Do YYYY")

//constructor function
var forecast =
 `<p> In ${city.toUpperCase()} it's ${Math.round(data.main.temp)} degrees Farenheit</p>
 <p>Current Conditions: ${data.weather[0].main}</p>
 <p>Sunrise: ${moment(data.sys.sunrise*1000).format("h:mm:ss a' ")}</p>
 <p>Sunset: ${moment(data.sys.sunset*1000).format("h:mm:ss a'")}</p>
 <p> Wind Speed: ${data.wind.speed}</p>`

//JSON.stringify(data.weather[0]);
appendWeather(forecast, date)
};
});
// ends doc.ready//
