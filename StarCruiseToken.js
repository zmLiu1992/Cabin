function starCruiseNotify(subtitle = '', message = '') {
    $notification.post('[Star Cruises] 獲取 Token', subtitle, message, {
        'url': ''
    });
};

const starCruiseToken = $request.headers['authorization'] || $request.headers['Authorization'];
if (starCruiseToken) {
    const saveToken = $persistentStore.write(starCruiseToken, 'StarCruiseToken');

    if (!saveToken) {
        starCruiseNotify(
            '保存失敗 ‼️',
            '請稍後嘗試'
        );
    } else {
        starCruiseNotify(
            '保存成功~',
            ''
        );
    }
} else {
    //starCruiseNotify(
    //    '保存失敗 ‼️',
    //    '請重新登入'
    //);
}
$done({});