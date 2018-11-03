/**
 * Common database helper functions.
 */
class DBHelper {

static openDatabase() {
  return idb.open('restaurants', 1, function(upgradeDB) {
      var store = upgradeDB.createObjectStore('allrestaurants', {keyPath: 'id'});
      upgradeDB.createObjectStore('allreviews', {keyPath: 'id'});
      upgradeDB.createObjectStore('offlinereviews', {keyPath: 'updatedAt'});
  });
}


  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {

    //check cached data
    DBHelper.openDatabase().then(db => {
      if(!db) {
        return;
      }

      const transaction = db.transaction('allrestaurants');
      const store = transaction.objectStore('allrestaurants');

      store.getAll().then(restaurants => {

        if(restaurants.length === 0) {

          fetch('http://localhost:1337/restaurants', {            
          }).then(response =>
             response.json()
          ).then(result => {
      
            //add to idb
            const transaction = db.transaction('allrestaurants', 'readwrite');
            const store = transaction.objectStore('allrestaurants');

            for(let restaurant of result) {
              store.put(restaurant);
            }

            store.openCursor(null, 'prev').then(function(cursor) {  
              return cursor.advance(30);
            }).then(function deleteRest(cursor) {
              if(!cursor) {
                return;
              }

              cursor.delete();
              return cursor.continue().then(deleteRest);
            });

            callback(null, result);            
      
          }).catch(error =>  callback(error, null));
        }
        else {
          callback(null, restaurants);            
        } 
      })
    })  
  }  

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    
    if(restaurant.photograph){
      return (`/img/${restaurant.photograph}.jpg`);
    }
    else {
      return (`/img/10.jpg`);
    }
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 


  static fetchRestaurantReviews(restaurant, callback) {
      //check cached data
      DBHelper.openDatabase().then(db => {
        if(!db) {
          return;
        }
  
        const transaction = db.transaction('allreviews');
        const store = transaction.objectStore('allreviews');
  
        store.getAll().then(reviews => {
  
          //If 0 fetch all
          if(reviews.length === 0) {
  
            fetch(`http://localhost:1337/reviews/restauran_id=${restaurant.id}`, {            
            }).then(response =>
               response.json()
            ).then(reviewList => {
        
              //add to idb
              const transaction = db.transaction('allreviews', 'readwrite');
              const store = transaction.objectStore('allreviews');
  
              for(let review of reviewList) {
                store.put(review);
              }

              callback(null, reviewList);            
        
            }).catch(error =>  callback(error, null));
          }
          else {
            callback(null, reviews);            
          } 
        })
      })  
  }

  static setFavorite(restaurantId){

    DBHelper.openDatabase().then(function (db) {

      const tx = db.transaction('allrestaurants', 'readwrite');
      const store = tx.objectStore('allrestaurants');
      return store.get(restaurantId);
  
    }).then(restaurant => {
  
      const isFavorite = !(restaurant.is_favorite == 'true');
      restaurant.is_favorite = isFavorite.toString();
  
      return DBHelper.openDatabase().then(function (db) {
  
        const tx = db.transaction('allrestaurants', 'readwrite');
        const store = tx.objectStore('allrestaurants');
  
        store.put(restaurant);
  
        return store.complete;
  
      }).catch((err) => console.log(err))
    })
  }

  static postReview(review, callback) {

    return fetch(`http://localhost:1337/reviews`, {
      body: JSON.stringify(review),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      method: "POST"
    }).then(res => {
      res.json().then(review => {
        
        DBHelper.openDatabase().then(db => {
          if(!db) {
            return;
          }

          const tx = db.transaction('allreviews', 'readwrite');
          const store = tx.objectStore('allreviews');
          store.put(review);

          return review;
        });                  
      })
    })
    .catch(err => {
      review["updatedAt"] = new Date().getTime();
      review["createdAt"] = new Date().getTime();      

      DBHelper.openDatabase().then(db => {
        if(!db) {
          return;
        }
        const txoffline = db.transaction('offlinereviews', 'readwrite');
        const storeoffline = txoffline.objectStore('offlinereviews');
        storeoffline.put(review);

      });

    });
  }

  static postOfflineReviews() {

		DBHelper.openDatabase().then(db => {
      if (!db) {
        return;
      }
      
      const txoffline = db.transaction('offlinereviews');
      const storeoffline = txoffline.objectStore('offlinereviews');
      
			storeoffline.getAll().then(offlineReviews => {

				offlineReviews.forEach(review => {
					DBHelper.postReview(review);
        })
        
        DBHelper.openDatabase().then(db => {
          const txoffline = db.transaction('offlinereviews', 'readwrite');
          const storeoffline = txoffline.objectStore('offlinereviews').clear();
        })
        return;
        
			})
		})
	}

}

