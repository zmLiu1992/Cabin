  function starCruiseNotify(subtitle = '', message = '') {
      $notification.post('Star Cruise 查房', subtitle, message, {
          'url': ''
      });
  };

  const checkCabinRequest = {
      url: 'https://www.abc-mart.com.tw/api/home',
      headers: {
          'authorization': $persistentStore.read('StarCruiseToken'),
      }
  };

  function checkCabin() {
      $httpClient.get(checkCabinRequest, function(error, response, data) {
          if (error) {
              starCruiseNotify(
                  '查房失敗 ‼️',
                  '連線錯誤'
              );
              $done();
          } else {
              if (response.status === 200) {
                  const obj = JSON.parse(data);
                  try {

                      // 排序 items，依照 updated_at 由新到舊
                      const sortedItems = obj.items.sort((a, b) => {
                          return new Date(b.updated_at) - new Date(a.updated_at);
                      });

                      // 格式化日期並組合通知文字
                      const formattedList = sortedItems.map(item => {
                          const date = new Date(item.updated_at);
                          const formattedDate = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
                          return `${formattedDate} - ${item.traditional_chinese_name}`;
                      });

                      starCruiseNotify(
                          '房間資訊',
                          ormattedList.join('\n')
                      );
                  } catch (e) {
                      starCruiseNotify(
                          '查房失敗 ‼️',
                          e
                      );
                  }
              } else {
                  starCruiseNotify(
                      'Cookie 已過期 ‼️',
                      '請重新登入'
                  );
                  $done();
              }
          }
          $done();
      });
  }
  checkCabin();