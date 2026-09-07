import urllib.request
import json

headers = {"User-Agent": "Mozilla/5.0"}
types = ["time", "minute", "day", "intraday", "realtime", "timeCandle", "minuteCandle", "1day", "1d"]

for t in types:
    url = f"https://api.stock.naver.com/chart/domestic/index/KOSPI?periodType={t}"
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            infos = data.get("priceInfos", [])
            print(f"Type '{t}': Success! Items={len(infos)}, First={infos[0] if infos else None}")
    except Exception as e:
        # print(f"Type '{t}' failed: {e}")
        pass
