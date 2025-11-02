  function starCruiseNotify(subtitle = '', message = '') {
      $notification.post('[Star Cruises] 探索星號', subtitle, message, {
          'url': ''
      });
  };

  function quickDisplay(result = '') {

      // 捷徑名稱（請先在捷徑 App 建一個同名捷徑）
      const shortcutName = "StarCruise顯示";

      // Shortcuts URL scheme（把 result 當作捷徑輸入）
      const url =
        "shortcuts://run-shortcut?name=" +
        encodeURIComponent(shortcutName) +
        "&input=" +
        encodeURIComponent(result);

      // 發一則可操作的通知：點了就打開捷徑並把值丟進去
      $notification.post(
        "[Star Cruises] 探索星號 房間查詢完成",
        "點擊這則通知以開啟捷徑，顯示完整結果",
        result,
        {
          action: "open-url", // 點通知後執行「開網址」
          url,                 // 這個網址就是上面的 shortcuts://...
          sound: true,         //（可選）有提示音
          "auto-dismiss": 0      //（可選）0 代表不自動消失
        }
      );
  }

  function getCustomerInfo() {
      return new Promise((resolve) => {
        const requestUrl = {
              url: 'https://backend-prd.b2m.stardreamcruises.com/auth/customer/report',
              headers: {
                  'authorization': $persistentStore.read('StarCruiseToken'),
              }
          };

          $httpClient.get(requestUrl, function(error, response, body) {
              if (error) {
                  starCruiseNotify('旅客資訊查詢失敗 ‼️', '連線錯誤');
                  resolve('');
                  $done();
                  return;
              } else {
                  if (response.status === 200) {
                      try {
                          const datas = JSON.parse(body);
                          const info = $`剩餘客房點數：{datas.cabin_credits} P`;
                          resolve(info);
                      } catch (e) {
                          starCruiseNotify('旅客資訊查詢失敗 ‼️', String(e));
                          resolve('');
                          $done();
                          return;
                      }
                  } else {
                      starCruiseNotify('Cookie 已過期 ‼️', '請重新登入');
                      resolve('');
                      $done();
                      return;
                  }
              }
          });
      });
  }

  function getPortInfos() {
      return new Promise((resolve) => {
        const requestUrl = {
              url: 'https://backend-prd.b2m.stardreamcruises.com/customers/list/port?lang=hant&page=1',
              headers: {
                  'authorization': $persistentStore.read('StarCruiseToken'),
              }
          };

          $httpClient.get(requestUrl, function(error, response, body) {
              if (error) {
                  starCruiseNotify('港口清單查詢失敗 ‼️', '連線錯誤');
                  resolve({});
                  $done();
                  return;
              } else {
                  if (response.status === 200) {
                      try {
                          const datas = JSON.parse(body);
                          const portDictionary = datas.items
                            .filter(item => item.status === true)
                            .reduce((acc, item) => {
                              acc[item.id] = item.traditional_chinese_port_name;
                              return acc;
                            }, {});

                          resolve(portDictionary);
                      } catch (e) {
                          starCruiseNotify('港口清單查詢失敗 ‼️', String(e));
                          resolve({});
                          $done();
                          return;
                      }
                  } else {
                      starCruiseNotify('Cookie 已過期 ‼️', '請重新登入');
                      resolve({});
                      $done();
                      return;
                  }
              }
          });
      });
  }

  function getDepartureDates(portNum) {
      return new Promise((resolve) => {
          const requestUrl = {
              url: `https://backend-prd.b2m.stardreamcruises.com/customers/list/departure-date?departure_port=${portNum}&lang=hant`,
              headers: {
                  'authorization': $persistentStore.read('StarCruiseToken'),
              }
          };

          $httpClient.get(requestUrl, function(error, response, body) {
              if (error) {
                  starCruiseNotify('出發日查詢失敗 ‼️', '連線錯誤');
                  resolve([]);
                  $done();
                  return;
              } else {
                  if (response.status === 200) {
                      try {
                          const datas = JSON.parse(body);
                          resolve(datas);
                      } catch (e) {
                          starCruiseNotify('出發日查詢失敗 ‼️', String(e));
                          resolve([]);
                          $done();
                          return;
                      }
                  } else {
                      starCruiseNotify('Cookie 已過期 ‼️', '請重新登入');
                      resolve([]);
					            $done();
					            return;
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

          $httpClient.get(requestUrl, function(error, response, body) {
              if (error) {
                  starCruiseNotify('出航查詢失敗 ‼️', '連線錯誤');
                  resolve('');
                  $done();
                  return;
              } else {
                  if (response.status === 200) {
                      try {
                          const jsonData = JSON.parse(body);
                          if (jsonData.items && jsonData.items.length > 0) {
                              resolve(jsonData.items[0].traditional_chinese_name);
                          } else {
                              resolve('');
                          }

                      } catch (e) {
                          starCruiseNotify('出航查詢失敗 ‼️', String(e));
                          resolve('');
                          $done();
                          return;
                      }
                  } else {
                      starCruiseNotify('Cookie 已過期 ‼️', '請重新登入');
                      resolve('');
                      $done();
                      return;
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

          $httpClient.get(requestUrl, function(error, response, body) {
              if (error) {
                  starCruiseNotify('查房失敗 ‼️', '連線錯誤');
                  resolve([]);
                  $done();
                  return;
              } else {
                  if (response.status === 200) {
                      try {
                          const jsonData = JSON.parse(body);
                          if (!jsonData.items || jsonData.items.length == 0) {
                              resolve([]);
                              return;
                          }

                          const cabins = jsonData.items.map(item => `(${item.cabin_fare}P) ${item.traditional_chinese_cabin_name}`);
                          resolve(cabins);

                      } catch (e) {
                          starCruiseNotify('查房失敗 ‼️', String(e));
                          resolve([]);
                          $done();
                          return;
                      }
                  } else {
                      starCruiseNotify('Cookie 已過期 ‼️', '請重新登入');
                      resolve([]);
                      $done();
                      return;
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

  function getDateDay(dateStr) {
      const date = new Date(dateStr);
	  const days = ["日","一","二","三","四","五","六"];
      return dateStr + days[date.getDay()];
  }

  function getCabinInfos(cabins) {
      if (Array.isArray(cabins) && cabins.length > 0) {
          return '=' + cabins.join(',');  
      }
      
      return '';
  }

  async function execute() {
	  const maxMessageCount = 8;
	  
	  try {
		  const input = $intent.parameter;
		  const parameters = input.split("|");
		  const portNum = parseInt(parameters[0], 10);
		  const persons = parseInt(parameters[1], 10);

      if (Number.isNaN(portNum) || Number.isNaN(persons)) {
        starCruiseNotify('參數錯誤', '請正確輸入港口編號與人數！');
        $done();
        return;
      }
				
      const customerInfo = await getCustomerInfo();
      if (customerInfo === '') {
        starCruiseNotify('旅客資訊錯誤', `沒有資料`);
        $done();
        return;
      }

      const portDictionary = await getPortInfos();  
		  if (!(portNum in portDictionary)) {
			  starCruiseNotify('港口編號錯誤', `未知港口編號 ${portNum}`);
			  $done();
			  return;
		  }

		  const departureDates = await getDepartureDates(portNum);
		  if (departureDates.length == 0) {
			  starCruiseNotify('出發日查詢', '沒有資料');
			  $done();
			  return;
		  }

      let messages = [];
		  for (let i = 0; i < departureDates.length; i++) {
			  const date = departureDates[i];
			  const itinerary = await getItinerary(portNum, date);
			  const cabins = await checkCabin(portNum, date, urlencode(itinerary), persons);

			  const shortItinerary = getShortItinerary(itinerary);
			  const cabinInfo = getCabinInfos(cabins);

			  let result = `[${cabins.length}房] ${getDateDay(date)} ${shortItinerary}`;
			  messages.push(result);
			  
			  if (cabinInfo !== '') {
				  messages.push(cabinInfo);
			  }
			  
        	  // 每8行顯示一次通知
			  // const isLast = i === departureDates.length - 1;
			  // if (messages.length >= maxMessageCount || isLast) {
			  //     starCruiseNotify(`『${portDictionary[portNum]}』 出發`, messages.join('\n'));
				//   messages = [];
			  // }
		  }

		  // 一次顯示全部資訊
		  quickDisplay($`{customerInfo}\n\n{messages.join('\n')}`);
	  } catch (e) {
	      starCruiseNotify('執行錯誤', String(e));
        $done();
        return;
	  }
	  
    $done();
    return;  
  }

  execute();
