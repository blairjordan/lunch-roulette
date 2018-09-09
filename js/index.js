const max_price_range = 3; // Lower is cheaper
const min_aggregate_rating = 3.9;
const min_temp = 15;
const min_votes = 20;
let radius = 3500;

const rain_factor = 0.6;
const temp_threshold_factor = 0.4;
const pages = 5;
const lat = -37.8149526;
const lon = 144.9598002;
const category = 9; // 9 = Lunch
const blacklist = ['Restaurant One', 'Restaurant Two'];

let restaurants = [];

zomatoAPIKey = 'MY-ZOMATO-API-KEY';
openweathermapAPIKey = 'MY-OPENWEATHERMAP-API-KEY';

const setHeader = xhr => {
  xhr.setRequestHeader('user-key', zomatoAPIKey);
}

const loadWeather = () => {
  return new Promise((resolve, reject) => {
    $.ajax({
        url: 'https://api.openweathermap.org/data/2.5/weather',
        data: {
          appid: openweathermapAPIKey,
          lat,
          lon
        },
        method: "GET"
      }).done((data) => {
        resolve(data);
      }).fail(() => {
        return reject();
      });
  });
};

const loadRestaurants = page => {
  return new Promise((resolve, reject) => {
    $.ajax({
        url: 'https://developers.zomato.com/api/v2.1/search',
        data: {
          radius,
          lat,
          lon,
          category,
          sort: 'real_distance',
          order: 'desc',
          start: (page-1) * 10
        },
        method: "GET",
        beforeSend: setHeader
      }).done((items) => {
        r = items.restaurants.map((r) => r.restaurant).filter(
            (i) => (i.price_range <= max_price_range)
                  && 
                  (i.user_rating.aggregate_rating >= min_aggregate_rating)
                  &&
                  (i.user_rating.votes >= min_votes)
                  &&
                  (!blacklist.includes(i.name))
            );

        console.log(r);
        restaurants = [...restaurants, ...r];
        resolve(restaurants);
      }).fail(() => {
        return reject();
      });
  });
};

$(document).ready(() => {
  var promises = [];
  for (let i = 0; i <= pages; i++) {
    promises.push(loadRestaurants(i));
  }
  
  loadWeather().then((weather) => {
    let isRain = false;
    weather.weather.forEach((w) => {
      if (w.main === 'Rain')
        isRain = true;
    });
    
    radius /= isRain ? 2 : rain_factor; 
    radius /= ((5/9) * (weather.main.temp-32) <= min_temp) ? 2 : temp_threshold_factor; 
    
    Promise.all(promises).then(() => {
      console.log(restaurants);
      let index = Math.floor((Math.random() * restaurants.length));
      console.log(index);
      let restaurant = (restaurants[index]);
      
      console.log(restaurants);
      if (typeof(restaurant) !== 'undefined') {
        $('#restaurant-name').empty();
        $('#restaurant-name').append(restaurant.name);
        $('#restaurant-link').attr('href', `https://www.google.com/maps/?q=${restaurant.location.latitude},${restaurant.location.longitude}`);
        $('#gmap').attr('src',  `https://www.google.com/maps/embed?q=${restaurant.location.latitude},${restaurant.location.longitude}`);
      } else {
        alert('No restaurants found. Try adjusting your search criteria.')
      }
    }, () => {
      console.log('Error fetching restaurants');
    });
  });
});