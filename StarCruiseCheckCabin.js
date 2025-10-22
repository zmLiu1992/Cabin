  function starCruiseNotify(subtitle = '', message = '') {
      $notification.post('StarCruise 基隆查房', subtitle, message, {
          'url': ''
      });
  };

  // portNum = 12 Keelung
  function getDepartureDates(portNum, callback) {
      const requestUrl = {
          url: `https://backend-prd.b2m.stardreamcruises.com/customers/list/departure-date?departure_port=${portNum}&lang=hant`,
          headers: {
              'authorization': $persistentStore.read('StarCruiseToken'),
          }
      };

      $httpClient.get(requestUrl, function(error, response, data) {
          if (error) {
              starCruiseNotify('出發日查詢失敗 ‼️', '連線錯誤');
              callback([]);
          } else {
              if (response.status === 200) {
                  try {
                      const datas = JSON.parse(data);
                      callback(datas);
                  } catch (e) {
                      starCruiseNotify('出發日查詢失敗 ‼️', e);
                      callback([]);
                  }
              } else {
                  starCruiseNotify('Cookie 已過期 ‼️', '請重新登入');
                  callback([]);
              }
          }
      });
  }


  function getItinerary(portNum, departureDate, callback) {
      const requestUrl = {
          url: `https://backend-prd.b2m.stardreamcruises.com/customers/list/itinerary?port_id=${portNum}&departure_date=${departureDate}&lang=hant&page=1`,
          headers: {
              'authorization': $persistentStore.read('StarCruiseToken'),
          }
      };

      $httpClient.get(requestUrl, function(error, response, data) {
          if (error) {
              starCruiseNotify('出航查詢失敗 ‼️', '連線錯誤');
              callback('');
          } else {
              if (response.status === 200) {
                  try {
                      const jsonData = JSON.parse(data);

                      if (jsonData.items && jsonData.items.length > 0) {
                          callback(jsonData.items[0].traditional_chinese_name);
                      } else {
                          callback('');
                      }

                  } catch (e) {
                      starCruiseNotify('出航查詢失敗 ‼️', e);
                      callback('');
                  }
              } else {
                  starCruiseNotify('Cookie 已過期 ‼️', '請重新登入');
                  callback('');
              }
          }
      });
  }

  function checkCabin(portNum, departureDate, itineraryName, persons, callback) {
      const requestUrl = {
          url: `https://backend-prd.b2m.stardreamcruises.com/customers/cabin-allotment?itinerary_name=${itineraryName}&departure_date=${departureDate}&departure_port=${portNum}&pax=${persons}&lang=hant&currentStep=0&page=1`,
          headers: {
              'authorization': $persistentStore.read('StarCruiseToken'),
          }
      };

      $httpClient.get(requestUrl, function(error, response, data) {
          if (error) {
              starCruiseNotify('查房失敗 ‼️', '連線錯誤');
              callback([]);
          } else {
              if (response.status === 200) {
                  try {
                      const jsonData = JSON.parse(data);

                      if (!jsonData.items || jsonData.items.length == 0) {
                          callback([]);
                      }

                      const cabins = jsonData.items.map(item => `(${item.cabin_id}) ${item.traditional_chinese_cabin_name}`);
                      callback(cabins);

                  } catch (e) {
                      starCruiseNotify('查房失敗 ‼️', e);
                      callback([]);
                  }
              } else {
                  starCruiseNotify('Cookie 已過期 ‼️', '請重新登入');
                  callback([]);
              }
          }
      });
  }

  function urlencode(str) {
      return encodeURIComponent(str).replace(/%20/g, '+');
  }

  function execute() {
      const portNum = 12; // Keelung = 12, Kaohsiung = 13
      const persons = 2;
      let messages = [];
     
      getDepartureDates(portNum, function(departureDatas) {
          if (departureDatas.length == 0) {
              starCruiseNotify('出發日查詢', '沒有資料');
              $done();
          }

          let completeCount = 0;
          departureDatas.forEach(date => {
              getItinerary(portNum, date, function(itinerary) {
                  checkCabin(portNum, date, urlencode(itinerary), persons, function(cabins) {
                      let result =`${date} ${itinerary} ${cabins.length}房\n${cabins.join('\n')}`;
                      messages.push(result);

                      completeCount++;
                      if (completeCount === departureDatas.length) {
                        starCruiseNotify('查房結果', messages.join('\n'));
                        $done();
                        return;
                      }
                  });
              });
          });
      });
  }

  execute();