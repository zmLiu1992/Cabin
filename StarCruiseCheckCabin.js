  function starCruiseNotify(subtitle = '', message = '') {
      $notification.post('StarCruise 基隆查房', subtitle, message, {
          'url': ''
      });
  };

  // portNum = 12 Keelung
  function getDepartureDates(portNum) {

      return new Promise((resolve) => {
          const requestUrl = {
              url: `https://backend-prd.b2m.stardreamcruises.com/customers/list/departure-date?departure_port=${portNum}&lang=hant`,
              headers: {
                  'authorization': $persistentStore.read('StarCruiseToken'),
              }
          };

          $httpClient.get(requestUrl, function(error, response, data) {
              if (error) {
                  starCruiseNotify('出發日查詢失敗 ‼️', '連線錯誤');
                  resolve([]);
              } else {
                  if (response.status === 200) {
                      try {
                          const datas = JSON.parse(data);
                          resolve(datas);
                      } catch (e) {
                          starCruiseNotify('出發日查詢失敗 ‼️', e);
                          resolve([]);
                      }
                  } else {
                      starCruiseNotify('Cookie 已過期 ‼️', '請重新登入');
                      resolve([]);
                      $done();
                  }
              }
          });
      });
  }


  function getItinerary(portNum, departureDate) {
      return new Promise((resolve) => {
          const requestUrl = {
              url: `https://backend-prd.b2m.stardreamcruises.com/customers/list/itinerary?port_id=${portNum}&departure_date=${departureDate}&lang=hant&page=1`,
              headers: {
                  'authorization': $persistentStore.read('StarCruiseToken'),
              }
          };

          $httpClient.get(requestUrl, function(error, response, data) {
              if (error) {
                  starCruiseNotify('出航查詢失敗 ‼️', '連線錯誤');
                  resolve('');
              } else {
                  if (response.status === 200) {
                      try {
                          const jsonData = JSON.parse(data);

                          if (jsonData.items && jsonData.items.length > 0) {
                              resolve(jsonData.items[0].traditional_chinese_name);
                          } else {
                              resolve('');
                          }

                      } catch (e) {
                          starCruiseNotify('出航查詢失敗 ‼️', e);
                          resolve('');
                      }
                  } else {
                      starCruiseNotify('Cookie 已過期 ‼️', '請重新登入');
                      resolve('');
                  }
              }
          });
      });
  }

  function checkCabin(portNum, departureDate, itineraryName, persons) {
      return new Promise((resolve) => {
          const requestUrl = {
              url: `https://backend-prd.b2m.stardreamcruises.com/customers/cabin-allotment?itinerary_name=${itineraryName}&departure_date=${departureDate}&departure_port=${portNum}&pax=${persons}&lang=hant&currentStep=0&page=1`,
              headers: {
                  'authorization': $persistentStore.read('StarCruiseToken'),
              }
          };

          $httpClient.get(requestUrl, function(error, response, data) {
              if (error) {
                  starCruiseNotify('查房失敗 ‼️', '連線錯誤');
                  resolve([]);
              } else {
                  if (response.status === 200) {
                      try {
                          const jsonData = JSON.parse(data);

                          if (!jsonData.items || jsonData.items.length == 0) {
                              resolve([]);
                              return;
                          }

                          const cabins = jsonData.items.map(item => `(${item.cabin_id}) ${item.traditional_chinese_cabin_name}`);
                          resolve(cabins);

                      } catch (e) {
                          starCruiseNotify('查房失敗 ‼️', e);
                          resolve([]);
                      }
                  } else {
                      starCruiseNotify('Cookie 已過期 ‼️', '請重新登入');
                      resolve([]);
                  }
              }
          });
      });
  }

  function urlencode(str) {
      return encodeURIComponent(str).replace(/%20/g, '+');
  }

  function getShortItinerary(text) {
      const parts = text.split(' - ');
      if (parts.length >= 3) {
          const days = parts[1];
          const destination = parts.slice(2).join('-').replace('海上遊', '');
          return `(${days}) ${destination}`;
      }
  }

  function getCabinInfos(cabins) {
      if (Array.isArray(cabins) && cabins.length > 0) {
          return '\n' + cabins.join('\n');  
      }
      
      return '';
  }

  async function execute() {
      const portNum = 12; // Keelung = 12, Kaohsiung = 13
      const persons = 2;
      let messages = [];

      const departureDates = await getDepartureDates(portNum);
      if (departureDates.length == 0) {
          starCruiseNotify('出發日查詢', '沒有資料');
          $done();
          return;
      }

      for (const date of departureDates) {
          const itinerary = await getItinerary(portNum, date);
          const cabins = await checkCabin(portNum, date, urlencode(itinerary), persons);

          const shortItinerary = getShortItinerary(itinerary);
          const cabinInfo = getCabinInfos(cabins);

          let result = `[${cabins.length}房] ${date} ${shortItinerary}${cabinInfo}`;
          messages.push(result);
      }

      starCruiseNotify('', messages.join('\n'));
      $done();
      return;
  }

  execute();